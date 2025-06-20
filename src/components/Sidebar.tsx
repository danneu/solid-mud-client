import type { Component } from "solid-js";
import { For, Match, Show, Switch } from "solid-js";
import { useStore } from "../model";
import { Button, ListGroup, Spinner } from "solid-bootstrap";
import { useConnectionManager } from "../services/connection-manager";
import { IconGear, IconGearFill } from "../util/icons";

export const Sidebar: Component<{ ref?: (el: HTMLElement) => void }> = (
  props,
) => {
  const store = useStore();
  const { state, dispatch } = store;
  const { disconnect, connect } = useConnectionManager();

  return (
    <ListGroup
      ref={props.ref}
      variant="flush"
      // Accessibility
      id="server-sidebar" // referred to by servers button aria-controls
      tabindex="-1" // Let us focus it with JS when we click the servers button
      aria-label="Server list"
    >
      <For each={state.servers}>
        {(server) => {
          const isActive = () =>
            state.route.type === "server" && state.route.id === server.id;

          return (
            <ListGroup.Item
              aria-label={`Server, ${server.name}, ${server.status}`}
              class="d-flex justify-content-between"
              action
              aria-current={
                state.route.type === "server" && state.route.id === server.id
              }
              // active={
              //   state.route.type === "server" && state.route.id === server.id
              // }
              variant={isActive() ? "primary" : "dark"}
              onClick={() => {
                dispatch({
                  type: "set-route",
                  route: {
                    type: "server",
                    id: server.id,
                  },
                });
              }}
            >
              <div>
                <span
                  classList={{
                    "fg-green": server.status === "connected",
                  }}
                >
                  {server.name}
                </span>
                <br />{" "}
                <span
                  aria-hidden={true}
                  style={{
                    "font-family": "monospace",
                    "font-size": "90%",
                    opacity: 0.4,
                    "overflow-x": "hidden",
                    "text-overflow": "ellipsis",
                    "white-space": "nowrap",
                    "max-width": "20ch",
                    display: "inline-block",
                  }}
                >
                  {server.host}:{server.port}
                </span>
              </div>
              <div style={{ display: "flex", "align-items": "center" }}>
                {/* Config button */}

                <Show when={server.status === "disconnected"}>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({
                        type: "set-modal",
                        modal: { type: "server:config", id: server.id },
                      });
                    }}
                    aria-label="Configure server"
                    variant="link"
                    class="text-secondary"
                    size="sm"
                    style={{ color: isActive() ? "white" : "inherit" }}
                  >
                    {isActive() ? (
                      <IconGearFill aria-hidden={true} />
                    ) : (
                      <IconGear aria-hidden={true} />
                    )}
                  </Button>
                </Show>

                {/* Connect/Disconnect button */}

                <Button
                  onClick={() => {
                    if (server.status === "connected") {
                      disconnect(server.id);
                    } else if (server.status === "disconnected") {
                      connect(server);
                    } else {
                      // noop
                    }
                  }}
                  classList={{
                    disabled: server.status === "connecting",
                  }}
                  variant={
                    server.status === "connecting"
                      ? "link"
                      : isActive()
                        ? "outline-secondary"
                        : "outline-secondary"
                  }
                  size="sm"
                >
                  <Switch>
                    <Match when={server.status === "connected"}>
                      Disconnect{" "}
                      <div
                        style={{
                          display: "inline-block",
                          "background-color": "#2ecc71",
                          width: "10px",
                          height: "10px",
                          "border-radius": "50%",
                        }}
                      />
                    </Match>
                    <Match when={server.status === "disconnected"}>
                      Connect
                    </Match>
                    <Match when={server.status === "connecting"}>
                      <Spinner animation="border" size="sm" />
                    </Match>
                    <Match when={true}>{server.status}</Match>
                  </Switch>
                </Button>
              </div>
            </ListGroup.Item>
          );
        }}
      </For>
    </ListGroup>
  );
};
