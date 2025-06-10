import type { Line, Msg, Server, State } from "./types";
import {
  push as ringPush,
  peekLast as ringPeekLast,
  isEmpty as ringIsEmpty,
  createRingBuffer,
} from "../util/RingBuffer";
import { LocalStorage } from "../util/LocalStorage";
import { parseServerConfig } from "../server-config";
import { SCROLLBACK_LENGTH } from "../config";

export function update(state: State, msg: Msg): void {
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
        const lines = msg.lines.map((chunks) => ({ chunks }));
        ringPush(server.lines, ...lines);
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
          ringPush(server.lines, { chunks: [] });
        }
        const lastLine = ringPeekLast(server.lines);
        if (lastLine) {
          lastLine.chunks.push(msg.chunk);
        }
      });
      break;
    }
    case "server:new-line": {
      updateServer(msg.serverId, (server) => {
        const chunks = msg.chunks || [];
        ringPush(server.lines, { chunks });

        // If terminateLine is true, append an empty line after
        if (msg.terminateLine) {
          ringPush(server.lines, { chunks: [] });
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

let nextServerId = 1;

const defaultConfig = `
aliases:
  "sac": |
    sacrificar cuerpo
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

export function createServer(
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
    lines: createRingBuffer<Line>(SCROLLBACK_LENGTH),
    showSlidePanel: false,
    filterMode: "include",
    lineFiltersInclude: [""],
    lineFiltersExclude: ["^Gamedriver:", ""],
  };
}
