import "bootstrap/dist/css/bootstrap.min.css";
import "./App.scss";
import { useStore } from "./store";
import { Button, Container, Navbar, Offcanvas } from "solid-bootstrap";
import { Sidebar } from "./components/Sidebar";
import { createSignal, For, lazy, Match, Show, Switch } from "solid-js";
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
  const [showSidebar, setShowSidebar] = createSignal(false);

  const currentServer = () => {
    if (state.route.type !== "server") return null;
    const id = state.route.id;
    return state.servers.find((s) => s.id === id);
  };

  return (
    <AppErrorBoundary>
      {/* For some reason, this needs to come before the modal switch section below */}
      <Offcanvas
        style={{ transition: "none" }}
        show={showSidebar()}
        onHide={() => setShowSidebar(false)}
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
          <Sidebar />
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
              variant="outline-primary"
              size="sm"
              onClick={() => setShowSidebar(true)}
              class="me-2"
            >
              ☰ Servers
            </Button>
            <Navbar.Brand class="me-auto">solid-mud-client</Navbar.Brand>
            <Navbar.Text>
              Proxy URL: <code>{state.proxy}</code>
            </Navbar.Text>

            <Navbar.Text class="d-flex align-items-center">
              <Button
                variant="link"
                class="text-muted"
                size="sm"
                onClick={() =>
                  dispatch({ type: "set-modal", modal: { type: "config" } })
                }
              >
                <IconGear />
              </Button>

              <a
                href="https://github.com/danneu/solid-mud-client"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <IconGithub width="1.2rem" class="text-muted" />
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
