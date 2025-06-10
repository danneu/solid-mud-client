// This sidebar slides out from the right side of the screen

import {
  Alert,
  Button,
  ButtonGroup,
  Form,
  Offcanvas,
  ToggleButton,
} from "solid-bootstrap";
import { Index, Match, onMount, Switch, type Component } from "solid-js";
import { useStore } from "../model";
import { type Server } from "../model/types";
import { type FilterMode } from "../model/types";

const SlidePanel: Component<{ server: Server; show: boolean }> = (props) => {
  const { dispatch } = useStore();

  return (
    <Offcanvas
      show={props.show}
      placement="end"
      // enforceFocus={false}
      backdrop={false}
      style={{
        // Disable open/close animation.
        // I like this animation normally but when transitioning between
        // server tabs, it's prob annoying to wait for one to close and one to open.
        transition: "none",
      }}
      onHide={() => {
        dispatch({
          type: "server:set-show-slide-panel",
          serverId: props.server.id,
          show: false,
        });
      }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Slide Panel</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Alert variant="info">Not sure which things to put here yet.</Alert>

        <h4>Filter mode</h4>
        <ButtonGroup class="w-100">
          <Index each={["off", "include", "exclude"] as FilterMode[]}>
            {(mode) => (
              <ToggleButton
                type="radio"
                variant={
                  props.server.filterMode === mode()
                    ? "secondary"
                    : "outline-secondary"
                }
                onClick={() => {
                  dispatch({
                    type: "server:set-filter-mode",
                    serverId: props.server.id,
                    mode: mode() as FilterMode,
                  });
                }}
                value={mode()}
              >
                {mode()}
              </ToggleButton>
            )}
          </Index>
        </ButtonGroup>

        <Switch>
          <Match when={props.server.filterMode === "include"}>
            <EditFilterList
              mode="include"
              server={props.server}
              filters={props.server.lineFiltersInclude}
            />
          </Match>
          <Match when={props.server.filterMode === "exclude"}>
            <EditFilterList
              mode="exclude"
              server={props.server}
              filters={props.server.lineFiltersExclude}
            />
          </Match>
          <Match when={true}>
            <p>No filter mode selected</p>
          </Match>
        </Switch>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

const EditFilterList: Component<{
  mode: "include" | "exclude";
  server: Server;
  filters: string[];
}> = (props) => {
  const { dispatch } = useStore();

  onMount(() => {
    console.log("EditFilterList mounted", props.mode, props.filters);
  });

  return (
    <ol>
      <Index each={props.filters}>
        {(filter, index) => (
          <li>
            <code>{filter()}</code>{" "}
            <Form.Control
              type="text"
              value={filter()}
              onInput={(e) => {
                dispatch({
                  type: `server:line-filter:update`,
                  mode: props.mode,
                  serverId: props.server.id,
                  index,
                  filter: e.currentTarget.value,
                });
              }}
            />
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                dispatch({
                  type: `server:line-filter:delete`,
                  mode: props.mode,
                  serverId: props.server.id,
                  index,
                });
              }}
            >
              X
            </Button>
          </li>
        )}
      </Index>
    </ol>
  );
};

export default SlidePanel;
