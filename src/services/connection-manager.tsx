// ConnectionManager.tsx
import {
  batch,
  createContext,
  onCleanup,
  useContext,
  type JSX,
} from "solid-js";
import { type Store, useStore } from "../model";
import { type Server } from "../model/types";
import EventEmitter from "eventemitter3";
import { z } from "zod";
import {
  createParser,
  type Parser,
  type StyledText,
  Color16,
} from "ansi-stream-parser";

// telnet-proxy turns telnet messages into JSON
const EventMessageSchema = z.discriminatedUnion("type", [
  // normal telnet messages
  z.object({
    type: z.literal("data"),
    data: z.string(),
  }),
  z.object({
    type: z.literal("error"),
    error: z.string(),
  }),
  z.object({
    type: z.literal("mud:mssp"),
    data: z.record(z.string(), z.string()),
  }),
]);

type EventMessage = z.infer<typeof EventMessageSchema>;

type Connection = {
  socket: WebSocket;
  parser: Parser;
  handlers: {
    error: (error: Event) => void;
    open: () => void;
    message: (event: MessageEvent<string>) => void;
    close: () => void;
  };
};

type ConnectionManagerAPI = ReturnType<typeof createConnectionManager>;

type ChunksEvent = {
  serverId: Server["id"];
  chunks: StyledText[];
};

type ConnectedEvent = {
  serverId: Server["id"];
};

type DisconnectedEvent = {
  serverId: Server["id"];
};

type ErrorEvent = {
  serverId: Server["id"];
  error: Event;
};

export type ConnectionEvents = {
  connected: ConnectedEvent;
  disconnected: DisconnectedEvent;
  error: ErrorEvent;
  chunks: ChunksEvent;
};

function processTokens(
  tokens: StyledText[],
  serverId: string,
  dispatch: Store["dispatch"],
): StyledText[] {
  const chunks: StyledText[] = [];

  for (const token of tokens) {
    // Clean up the token value
    const cleanValue = token.text.replace(/[\x00\r]/g, "");
    if (!cleanValue) continue;

    // Split by newlines and process each line
    const lines = cleanValue.split("\n");

    batch(() => {
      lines.forEach((line, index) => {
        // Add non-empty content
        if (line) {
          const chunk: StyledText = { ...token, text: line };
          console.log("styled text:", chunk);
          dispatch({ type: "server:append-chunk", serverId, chunk });
          chunks.push(chunk);
        }

        // Add newline after each line except the last
        if (index < lines.length - 1) {
          dispatch({ type: "server:new-line", serverId });
        }
      });
    });
  }

  return chunks;
}

function createConnectionManager(store: Store) {
  const connections = new Map<Server["id"], Connection>();
  const emitter = new EventEmitter<ConnectionEvents>();

  const disconnect = (serverId: Server["id"]) => {
    const connection = connections.get(serverId);
    if (connection) {
      const { socket, handlers } = connection;

      // Remove event listeners before closing
      socket.removeEventListener("error", handlers.error);
      socket.removeEventListener("open", handlers.open);
      socket.removeEventListener("message", handlers.message);
      socket.removeEventListener("close", handlers.close);

      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
      connections.delete(serverId);

      store.dispatch({
        type: "server-change-status",
        serverId,
        status: "disconnected",
      });
    }
  };

  const connect = (server: Server) => {
    const { id: serverId, host, port } = server;

    // Always disconnect first to ensure clean state
    disconnect(serverId);

    // Create fresh buffered parser for this connection
    const parser = createParser();

    // Get current proxy URL from store
    const proxyUrl = store.state.proxy;

    console.log(
      `connecting to "telnet://${host}:${port}" through telnet proxy "${proxyUrl}"`,
    );

    const url = new URL(proxyUrl);
    url.searchParams.set("host", host);
    url.searchParams.set("port", String(port));
    url.searchParams.set("encoding", server.encoding);
    url.searchParams.set("format", "json");

    store.dispatch({
      type: "server-change-status",
      serverId,
      status: "connecting",
    });

    const socket = new WebSocket(url);

    // Event handlers
    const handleError = (error: Event) => {
      console.error("error connecting to telnet proxy:", error);
      emitter.emit("error", { serverId, error } satisfies ErrorEvent);
    };

    const handleOpen = () => {
      console.log("websocket connected");
      // We don't consider ourselves connected until we receive a message, not just on open
      // emitter.emit("connected", { serverId } satisfies ConnectedEvent);
    };

    const handleMessage = (event: MessageEvent<string>) => {
      console.log("recv:", event.data);

      const connection = connections.get(serverId);
      if (!connection) {
        console.error(`No connection found for ${serverId}`);
        return;
      }

      // Consider ourselves connected after first message, but only if the connection
      // is still valid. This prevents a race condition where:
      // 1. A message arrives while the socket is being disconnected
      // 2. We would incorrectly set status to "connected" even though the socket is closed/closing
      // 3. The UI would briefly show "connected" when it should show "disconnected"
      const server = store.state.servers.find((s) => s.id === serverId);
      if (
        server?.status === "connecting" &&
        connection.socket.readyState === WebSocket.OPEN
      ) {
        store.dispatch({
          type: "server-change-status",
          serverId,
          status: "connected",
        });
      }

      // Parse event.data as JSON
      let message: EventMessage;
      try {
        const json = JSON.parse(event.data);
        message = EventMessageSchema.parse(json);
      } catch (e) {
        if (e instanceof z.ZodError) {
          console.error(
            "error parsing telnet-proxy message JSON:",
            e.issues[0].message,
          );
        } else {
          console.error("error parsing telnet-proxy message JSON:", e);
        }
        store.dispatch({
          type: "server:append-chunk",
          serverId,
          chunk: {
            text: "telnet-proxy sent invalid JSON",
            fg: { type: "16", code: Color16.red },
          },
        });
        return;
      }
      // Parse and process tokens
      switch (message.type) {
        case "data": {
          const tokens = connection.parser.push(message.data);
          const chunks = processTokens(tokens, serverId, store.dispatch);

          emitter.emit("chunks", {
            serverId,
            chunks,
          } satisfies ChunksEvent);
          break;
        }
        case "error": {
          console.error("error from telnet-proxy:", message.error);
          store.dispatch({
            type: "server:new-line",
            serverId,
            terminateLine: true,
            chunks: [
              {
                text: `[telnet-proxy] error: ${message.error}`,
                fg: { type: "16", code: Color16.red },
              },
            ],
          });
          break;
        }
        case "mud:mssp": {
          console.log("[mud:mssp] received:", message.data);
          break;
        }
        default: {
          const exhaustive: never = message;
          throw new Error(`Unhandled message type: ${exhaustive}`);
        }
      }
    };

    const handleClose = () => {
      console.log("websocket closed");

      // Flush any remaining buffered data
      // const connection = connections.get(serverId);
      // if (connection) {
      //   const remainingTokens = connection.parse.flush();
      //   processTokens(remainingTokens, serverId, store.dispatch);
      // }

      store.dispatch({
        type: "server-change-status",
        serverId,
        status: "disconnected",
      });
      emitter.emit("disconnected", { serverId } satisfies DisconnectedEvent);
      connections.delete(serverId);
    };

    // Store connection info with handlers
    const handlers = {
      error: handleError,
      open: handleOpen,
      message: handleMessage,
      close: handleClose,
    };
    connections.set(serverId, { socket, parser, handlers });

    // Add event listeners
    socket.addEventListener("error", handleError);
    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);
  };

  const sendMessage = (serverId: Server["id"], message: string) => {
    // Proxy expects us to append \r\n
    console.log("sending message:", JSON.stringify(message));
    const connection = connections.get(serverId);

    if (connection?.socket) {
      connection.socket.send(message + "\r\n");
    }
  };

  const disconnectAll = () => {
    for (const serverId of connections.keys()) {
      disconnect(serverId);
    }
  };

  return {
    connect,
    disconnect,
    disconnectAll,
    sendMessage,
    emitter,
  };
}

const ConnectionManagerContext = createContext<ConnectionManagerAPI>();

export function ConnectionManagerProvider(props: { children: JSX.Element }) {
  const store = useStore();
  const manager = createConnectionManager(store);

  onCleanup(() => {
    console.log("[ConnectionManagerProvider] onCleanup");
    manager.disconnectAll();
  });

  return (
    <ConnectionManagerContext.Provider value={manager}>
      {props.children}
    </ConnectionManagerContext.Provider>
  );
}

export function useConnectionManager() {
  const context = useContext(ConnectionManagerContext);
  if (!context) {
    throw new Error(
      "useConnectionManager must be used within ConnectionManagerProvider",
    );
  }
  return context;
}
