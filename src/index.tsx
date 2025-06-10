/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App.tsx";
import { StoreProvider } from "./model/index.tsx";
import { ConnectionManagerProvider } from "./services/connection-manager.tsx";

const root = document.getElementById("root");

render(
  () => (
    <StoreProvider>
      <ConnectionManagerProvider>
        <App />
      </ConnectionManagerProvider>
    </StoreProvider>
  ),
  root!,
);
