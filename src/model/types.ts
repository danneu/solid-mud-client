import type { StyledText } from "ansi-stream-parser";
import type { ConnectionOptions } from "telnet-proxy";
import type { RingBuffer } from "../util/RingBuffer";

export type ConnectionState = "disconnected" | "connecting" | "connected";

export type ServerConfig = {
  markup: string;
  aliases: Record<string, string>;
};

export type FilterMode = "off" | "include" | "exclude";

export type Line = {
  chunks: StyledText[];
};

export type Server = {
  id: string;
  status: ConnectionState;
  name: string;
  host: ConnectionOptions["host"];
  port: ConnectionOptions["port"];
  encoding: ConnectionOptions["encoding"];
  commandHistory: string[];
  config: ServerConfig;
  lines: RingBuffer<Line>;
  // Regexes to filter lines, will be passed in to new RegExp
  showSlidePanel: boolean;
  filterMode: FilterMode;
  lineFiltersInclude: string[];
  lineFiltersExclude: string[];
};

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
