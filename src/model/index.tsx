import { createContext, useContext, type JSX } from "solid-js";
import { createStore as createSolidStore, produce } from "solid-js/store";
import { LocalStorage } from "../util/LocalStorage";
import { PRODUCTION_PROXY_URL } from "../config";
import type { Msg, Server, State } from "./types";
import { createServer, update } from "./update";

function createState(): State {
  const servers: Server[] = [
    // English
    createServer("Elephant", "elephant.org", 23), // <-- Really polished
    createServer("Realms of Despair", "realmsofdespair.com", 4000),
    createServer("Aarchon", "aarchonmud.com", 7000),
    createServer("Aardwolf", "aardmud.org", 23),
    createServer("Threshold RPG", "thresholdrpg.com", 3333),

    // Spanish
    // https://es.wikipedia.org/w/index.php?title=MUD_%28videojuegos%29&type=revision&diff=108731953&oldid=108731054#Actualidad <-- Most are dead
    createServer("(es) Balzhur", "mud.balzhur.org", 5400), // <-- Fun people
    createServer("(es) Reinos de Leyenda", "rlmud.org", 23), // <-- Fun people
    createServer("(es) Cyberlife", "cyberlife.es", 7777), // <-- Fun  people
    createServer("(es) Medina", "medinamud.top", 3232),
    createServer("(es) Simauria", "mud.simauria.org", 23), // <-- Was a cool game years ago but now can't get past the email verification step (email never sent) :(
  ];

  // Load proxy URL from localStorage, fallback to environment variable
  const savedProxyUrl = LocalStorage.load("mud:proxy-url");
  const proxy =
    savedProxyUrl || import.meta.env.VITE_PROXY_URL || PRODUCTION_PROXY_URL;

  // Load screen reader mode from localStorage, default to false
  const screenReaderMode = LocalStorage.load("mud:screen-reader-mode") ?? false;

  return {
    modal: null,
    // route: { type: "home" },
    route: { type: "server", id: servers[0].id },
    proxy,
    servers,
    showServerSelector: true,
    screenReaderMode,
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
