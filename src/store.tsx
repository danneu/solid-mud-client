import { createContext, useContext, type JSX } from "solid-js";
import { createStore as createSolidStore, produce } from "solid-js/store";
import { parseServerConfig } from "./server-config";
import {
  type RingBuffer,
  createRingBuffer,
  push as ringPush,
  peekLast as ringPeekLast,
  isEmpty as ringIsEmpty,
} from "./util/RingBuffer";
import { LocalStorage } from "./util/LocalStorage";
import type { ConnectionOptions } from "telnet-proxy";
import type { StyledText } from "ansi-stream-parser";
import { PRODUCTION_PROXY_URL } from "./config";

// Maximum number of lines to keep in memory per server
const MAX_LINES = 10_000;

export type ConnectionState = "disconnected" | "connecting" | "connected";

export type ServerConfig = {
  markup: string;
  aliases: Record<string, string>;
};

export type FilterMode = "off" | "include" | "exclude";

export type Server = {
  id: string;
  status: ConnectionState;
  name: string;
  host: ConnectionOptions["host"];
  port: ConnectionOptions["port"];
  encoding: ConnectionOptions["encoding"];
  commandHistory: string[];
  config: ServerConfig;
  lines: RingBuffer<StyledText[]>;
  // Regexes to filter lines, will be passed in to new RegExp
  showSlidePanel: boolean;
  filterMode: FilterMode;
  lineFiltersInclude: string[];
  lineFiltersExclude: string[];
};

const defaultConfig = `
aliases:
  "sac": |
    sac cuerpo
  "cc *": |
    coger $1 cuerpo
  "coc": |
    coger oro cuerpo
  "c * *": |
    prepare $1
    cast $1 $2
  "h *": |
    heal $1
`.trim();

let nextServerId = 1;

function createServer(
  name: Server["name"],
  host: Server["host"],
  port: Server["port"],
  encoding: Server["encoding"] = "auto",
): Server {
  return {
    id: String(nextServerId++),
    status: "disconnected",
    name,
    host,
    port,
    encoding,
    commandHistory: [],
    config: parseServerConfig(defaultConfig)!,
    lines: createRingBuffer<StyledText[]>(MAX_LINES),
    showSlidePanel: false,
    filterMode: "include",
    lineFiltersInclude: [""],
    lineFiltersExclude: ["^Gamedriver:", ""],
  };
}

export type Route =
  | { type: "home" }
  | {
      type: "server";
      id: string;
    };

export type State = {
  modal:
    | { type: "config" } // global config
    | { type: "debug" }
    | { type: "server:config"; id: string } // server name, host, port, encoding
    | { type: "server:aliases"; id: string } // server aliases
    | { type: "server:new" } // add new server
    | null;
  route: Route;
  proxy: string;
  servers: Server[];
  showServerSelector: boolean;
};

function createState(): State {
  const servers: Server[] = [
    // Spanish
    // https://es.wikipedia.org/w/index.php?title=MUD_%28videojuegos%29&type=revision&diff=108731953&oldid=108731054#Actualidad <-- Most are dead
    createServer("Balzhur", "mud.balzhur.org", 5400), // <-- Fun people
    createServer("Reinos de Leyenda", "rlmud.org", 23), // <-- Fun people
    createServer("Cyberlife", "cyberlife.es", 7777), // <-- Fun  people
    createServer("Medina", "medinamud.top", 3232),
    createServer("Simauria", "mud.simauria.org", 23), // <-- Was a cool game years ago but now can't get past the email verification step (email never sent) :(

    // English
    createServer("Elephant", "elephant.org", 23), // <-- Really polished
    createServer("Realms of Despair", "realmsofdespair.com", 4000),
    createServer("Aarchon", "aarchonmud.com", 7000),
    createServer("Aardwolf", "aardmud.org", 23),
    createServer("Threshold RPG", "thresholdrpg.com", 3333),
  ];

  // Load proxy URL from localStorage, fallback to environment variable
  const savedProxyUrl = LocalStorage.load("mud:proxy-url");
  const proxy =
    savedProxyUrl || import.meta.env.VITE_PROXY_URL || PRODUCTION_PROXY_URL;

  return {
    modal: null,
    // route: { type: "home" },
    route: { type: "server", id: servers[0].id },
    proxy,
    servers,
    showServerSelector: true,
  };
}

export function createStore() {
  const [state, _setState] = createSolidStore<State>(createState());

  const setState = (updater: (state: State) => void) => {
    _setState(produce(updater));
  };

  const getServer = (id: Server["id"]) => {
    return state.servers.find((s) => s.id === id);
  };

  const dispatch = (msg: Msg) => {
    _setState(produce((prev) => update(prev, msg)));
  };

  return {
    state,
    setState,
    dispatch,
    getServer,
  };
}

function update(state: State, msg: Msg): void {
  const updateServer = (
    id: Server["id"],
    updater: (server: Server) => void,
  ) => {
    const server = state.servers.find((s) => s.id === id);
    if (server) {
      updater(server);
    } else {
      console.warn(`server ${id} not found`);
    }
  };

  switch (msg.type) {
    case "server-change-status": {
      updateServer(msg.serverId, (server) => {
        server.status = msg.status;
      });
      break;
    }
    case "server-append-lines": {
      updateServer(msg.serverId, (server) => {
        ringPush(server.lines, ...msg.lines);
      });
      break;
    }
    case "server-push-command-history": {
      updateServer(msg.serverId, (server) => {
        server.commandHistory = [msg.command, ...server.commandHistory];
      });
      break;
    }
    case "server-set-config": {
      updateServer(msg.serverId, (server) => {
        server.config = msg.config;
      });
      break;
    }
    case "server:append-chunk": {
      updateServer(msg.serverId, (server) => {
        if (ringIsEmpty(server.lines)) {
          ringPush(server.lines, []);
        }
        const lastLine = ringPeekLast(server.lines);
        if (lastLine) {
          lastLine.push(msg.chunk);
        }
      });
      break;
    }
    case "server:new-line": {
      updateServer(msg.serverId, (server) => {
        const chunks = msg.chunks || [];
        ringPush(server.lines, chunks);
        
        // If terminateLine is true, append an empty line after
        if (msg.terminateLine) {
          ringPush(server.lines, []);
        }
      });
      break;
    }
    case "server:set-show-slide-panel": {
      updateServer(msg.serverId, (server) => {
        server.showSlidePanel = msg.show;
      });
      break;
    }
    case "set-modal": {
      state.modal = msg.modal;
      break;
    }
    case "set-route": {
      state.route = msg.route;
      break;
    }
    case "server:line-filter:delete": {
      if (msg.mode === "off") break;
      updateServer(msg.serverId, (server) => {
        const filters =
          msg.mode === "include"
            ? server.lineFiltersInclude
            : server.lineFiltersExclude;
        filters.splice(msg.index, 1);
        // Ensure the last filter is ""
        if (filters[filters.length - 1] !== "") {
          filters.push("");
        }
      });
      break;
    }
    case "server:line-filter:update": {
      if (msg.mode === "off") break;
      updateServer(msg.serverId, (server) => {
        const filters =
          msg.mode === "include"
            ? server.lineFiltersInclude
            : server.lineFiltersExclude;
        filters[msg.index] = msg.filter;
      });
      break;
    }
    case "server:set-filter-mode": {
      updateServer(msg.serverId, (server) => {
        server.filterMode = msg.mode;
      });
      break;
    }
    case "set-proxy-url": {
      state.proxy = msg.url;
      // Save to localStorage when proxy URL is successfully set
      LocalStorage.save("mud:proxy-url", msg.url);
      break;
    }
    case "server-update-config": {
      updateServer(msg.serverId, (server) => {
        server.name = msg.name;
        server.host = msg.host;
        server.port = msg.port;
        server.encoding = msg.encoding;
        // Update server ID if host/port changed
        const newId = `${msg.host}:${msg.port}`;
        if (server.id !== newId) {
          server.id = newId;
          // Update route if this server is currently selected
          if (
            state.route.type === "server" &&
            state.route.id === msg.serverId
          ) {
            state.route.id = newId;
          }
        }
      });
      break;
    }
    case "server-add": {
      const newServer = createServer(
        msg.name,
        msg.host,
        msg.port,
        msg.encoding,
      );
      state.servers.push(newServer);
      // Navigate to the new server
      state.route = { type: "server", id: newServer.id };
      break;
    }
    case "server-delete": {
      const index = state.servers.findIndex((s) => s.id === msg.serverId);
      if (index !== -1) {
        state.servers.splice(index, 1);
        // If we're viewing the deleted server, navigate to another server
        if (state.route.type === "server" && state.route.id === msg.serverId) {
          if (state.servers.length === 0) {
            // No servers left, go home
            state.route = { type: "home" };
          } else {
            // Select prev server if available, else next
            const newIndex = index > 0 ? index - 1 : 0;
            state.route = { type: "server", id: state.servers[newIndex].id };
          }
        }
        // Close the modal
        state.modal = null;
      }
      break;
    }
    case "show-server-selector": {
      state.showServerSelector = msg.show;
      break;
    }
    default: {
      const _exhaustive: never = msg;
      throw new Error(`Unknown message type: ${_exhaustive}`);
    }
  }
}

export type Msg =
  // Nav
  | {
      type: "set-modal";
      modal: State["modal"];
    }
  | {
      type: "set-route";
      route: State["route"];
    }
  // Server stuff
  | {
      type: "server-change-status";
      serverId: Server["id"];
      status: ConnectionState;
    }
  | {
      type: "server:append-chunk";
      serverId: Server["id"];
      chunk: StyledText;
    }
  | {
      type: "server:new-line";
      serverId: Server["id"];
      chunks?: StyledText[];
      terminateLine?: boolean;
    }
  | {
      type: "server-append-lines";
      serverId: Server["id"];
      lines: StyledText[][];
    }
  | {
      type: "server-push-command-history";
      serverId: Server["id"];
      command: string;
    }
  | {
      type: "server-set-config";
      serverId: Server["id"];
      config: ServerConfig;
    }
  | {
      type: "server:set-show-slide-panel";
      serverId: Server["id"];
      show: boolean;
    }
  | {
      type: "server:line-filter:delete";
      serverId: Server["id"];
      mode: FilterMode;
      index: number;
    }
  | {
      type: "server:line-filter:update";
      serverId: Server["id"];
      mode: FilterMode;
      index: number;
      filter: string;
    }
  | {
      type: "server:set-filter-mode";
      serverId: Server["id"];
      mode: FilterMode;
    }
  | {
      type: "set-proxy-url";
      url: string;
    }
  | {
      type: "server-update-config";
      serverId: Server["id"];
      name: Server["name"];
      host: Server["host"];
      port: Server["port"];
      encoding: Server["encoding"];
    }
  | {
      type: "server-add";
      name: Server["name"];
      host: Server["host"];
      port: Server["port"];
      encoding: Server["encoding"];
    }
  | {
      type: "server-delete";
      serverId: Server["id"];
    }
  | {
      type: "show-server-selector";
      show: boolean;
    };

export type Store = ReturnType<typeof createStore>;

const StoreContext = createContext<Store>();

export function useStore() {
  const bag = useContext(StoreContext);
  if (!bag) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return bag;
}

export const StoreProvider = (props: { children: JSX.Element }) => {
  const store = createStore();
  return (
    <StoreContext.Provider value={store}>
      {props.children}
    </StoreContext.Provider>
  );
};
