import "bootstrap/dist/css/bootstrap.min.css";
import "./App.scss";
import { useStore } from "./model";
import { Button, Container, Navbar, Offcanvas } from "solid-bootstrap";
import { Sidebar } from "./components/Sidebar";
import { createEffect, For, lazy, Match, Show, Switch } from "solid-js";
import { HomePage } from "./components/HomePage";
import { ServerPage } from "./components/ServerPage";
import { DebugModal } from "./components/DebugModal";
import { AppErrorBoundary } from "./components/ErrorBoundary";
import { GlobalConfigModal } from "./modal-pages/GlobalConfigModal";
import SlidePanel from "./components/SlidePanel";
import { IconGear, IconGithub } from "./util/icons";

const LazyServerConfigModal = lazy(
  () => import("./modal-pages/ServerConfigModal"),
);

const LazyServerAliasesModal = lazy(
  () => import("./modal-pages/ServerAliasesModal"),
);

const LazyNewServerModal = lazy(() => import("./modal-pages/NewServerModal"));

function App() {
  const { state, dispatch } = useStore();

  const currentServer = () => {
    if (state.route.type !== "server") return null;
    const id = state.route.id;
    return state.servers.find((s) => s.id === id);
  };

  // A11y: When the server selector is shown, focus the sidebar
  createEffect(() => {
    if (state.showServerSelector) {
      requestAnimationFrame(() => {
        // Wait til it's visible
        sidebarRef.focus();
      });
    }
  });

  let sidebarRef: HTMLElement;

  return (
    <AppErrorBoundary>
      {/* For some reason, this needs to come before the modal switch section below */}
      <Offcanvas
        style={{ transition: "none" }}
        show={state.showServerSelector}
        onHide={() => dispatch({ type: "show-server-selector", show: false })}
        placement="start"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            Servers
            <Button
              variant="success"
              size="sm"
              onClick={() =>
                dispatch({ type: "set-modal", modal: { type: "server:new" } })
              }
              class="ms-2"
            >
              Add
            </Button>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Sidebar ref={(el) => (sidebarRef = el)} />
        </Offcanvas.Body>
      </Offcanvas>

      <Show when={currentServer()}>
        {(server) => (
          <SlidePanel server={server()} show={server().showSlidePanel} />
        )}
      </Show>

      <Switch>
        <Match when={state.modal?.type === "debug"}>
          <DebugModal />
        </Match>
        <Match when={state.modal?.type === "config"}>
          <GlobalConfigModal />
        </Match>
        <Match when={state.modal?.type === "server:config"}>
          <LazyServerConfigModal />
        </Match>
        <Match when={state.modal?.type === "server:aliases"}>
          <LazyServerAliasesModal />
        </Match>
        <Match when={state.modal?.type === "server:new"}>
          <LazyNewServerModal />
        </Match>
      </Switch>

      <div
        style={{
          height: "100vh",
          display: "flex",
          "flex-direction": "column",
        }}
      >
        <Navbar style={{ "flex-shrink": 0 }} class="pt-0 pb-0">
          <Container fluid>
            <Button
              aria-expanded={state.showServerSelector}
              aria-controls="server-sidebar"
              aria-label="Toggle server list"
              variant="outline-primary"
              size="sm"
              onClick={() =>
                dispatch({
                  type: "show-server-selector",
                  show: !state.showServerSelector,
                })
              }
              class="me-2"
            >
              ☰ Servers
            </Button>
            <Navbar.Brand class="me-auto">solid-mud-client</Navbar.Brand>
            <div class="form-check form-switch me-3">
              <input
                class="form-check-input"
                type="checkbox"
                role="switch"
                id="screenReaderToggle"
                checked={state.screenReaderMode}
                aria-checked={state.screenReaderMode}
                aria-describedby="screenReaderHelp"
                onChange={(e) => dispatch({ type: "set-screen-reader-mode", value: e.currentTarget.checked })}
              />
              <label class="form-check-label" for="screenReaderToggle">
                Screen reader mode
              </label>
              <div id="screenReaderHelp" class="visually-hidden">
                Toggle screen reader optimizations for better accessibility
              </div>
            </div>
            <Navbar.Text aria-hidden={true}>
              Proxy URL: <code>{state.proxy}</code>
            </Navbar.Text>

            <Navbar.Text class="d-flex align-items-center">
              <Button
                aria-label="Global configuration"
                variant="link"
                class="text-muted"
                size="sm"
                onClick={() =>
                  dispatch({ type: "set-modal", modal: { type: "config" } })
                }
              >
                <IconGear aria-hidden={true} />
              </Button>

              <a
                href="https://github.com/danneu/solid-mud-client"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on GitHub"
              >
                <IconGithub
                  width="1.2rem"
                  class="text-muted"
                  aria-hidden={true}
                />
              </a>
            </Navbar.Text>
          </Container>
        </Navbar>

        <Container fluid style={{ "flex-grow": 1, "min-height": 0 }}>
          <Show when={state.route.type === "home"}>
            <HomePage />
          </Show>
          <For each={state.servers}>
            {(server) => (
              <ServerPage
                server={server}
                visible={
                  state.route.type === "server" && state.route.id === server.id
                }
              />
            )}
          </For>
        </Container>
      </div>
    </AppErrorBoundary>
  );
}

export default App;
