import type { Component } from "solid-js";
import { Index, Match, Show, Switch } from "solid-js";
import { useStore } from "../model";
import { Button, ListGroup, Spinner } from "solid-bootstrap";
import { useConnectionManager } from "../services/connection-manager";
import { IconGear } from "../util/icons";

export const Sidebar: Component = () => {
  const store = useStore();
  const { state, dispatch } = store;
  const { disconnect, connect } = useConnectionManager();

  return (
    <ListGroup variant="flush">
      <Index each={state.servers}>
        {(server) => (
          <ListGroup.Item
            class="d-flex justify-content-between"
            action
            active={
              state.route.type === "server" && state.route.id === server().id
            }
            onClick={() => {
              dispatch({
                type: "set-route",
                route: {
                  type: "server",
                  id: server().id,
                },
              });
            }}
          >
            <div>
              <span
                classList={{
                  "fg-green": server().status === "connected",
                }}
              >
                {server().name}
              </span>
              <br />{" "}
              <code>
                {server().host}:{server().port}
              </code>
            </div>
            <div>
              <Switch>
                <Match when={server().status === "connected"}>
                  <Button
                    onClick={() => disconnect(server().id)}
                    variant="outline-secondary"
                    size="sm"
                  >
                    Disconnect
                  </Button>
                </Match>
                <Match when={server().status === "disconnected"}>
                  <Button
                    onClick={() => connect(server())}
                    variant="outline-secondary"
                    size="sm"
                  >
                    Connect
                  </Button>
                </Match>
                <Match when={server().status === "connecting"}>
                  <Spinner animation="border" size="sm" />
                </Match>
                <Match when={true}>{server().status}</Match>
              </Switch>

              <Show when={server().status === "disconnected"}>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({
                      type: "set-modal",
                      modal: { type: "server:config", id: server().id },
                    });
                  }}
                  variant="link"
                  class="text-secondary"
                  size="sm"
                >
                  <IconGear />
                </Button>
              </Show>
            </div>
          </ListGroup.Item>
        )}
      </Index>
    </ListGroup>
  );
};
