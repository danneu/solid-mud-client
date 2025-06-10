// ServerPage.tsx
import {
  createEffect,
  Match,
  on,
  Switch,
  type Component,
  createSignal,
  batch,
  createMemo,
} from "solid-js";
import { useStore } from "../model";
import { type Server } from "../model/types";
import { Badge, Button, Container, Form, Nav, Navbar } from "solid-bootstrap";
import { useConnectionManager } from "../services/connection-manager";
import { useCommandHistory } from "../hooks/useCommandHistory";
import type { Accessor, JSX } from "solid-js";
import { length as ringLength } from "../util/RingBuffer";
import { AliasMatcher, type AliasMatch } from "../alias";
import { Scrollback } from "./Scrollback";
import styles from "./ServerPage.module.scss";
import { Color16 } from "ansi-stream-parser";
import { scrollToBottom } from "../util/scrollToBottom";

export const ServerPage: Component<{ server: Server; visible: boolean }> = (
  props,
) => {
  const { connect, disconnect, sendMessage } = useConnectionManager();

  const [draft, setDraft] = createSignal("");
  const [wasNearBottom, setWasNearBottom] = createSignal(true);
  let scrollContainer: HTMLDivElement | undefined;

  const { navigateHistory, resetHistory } = useCommandHistory();

  const { dispatch } = useStore();
  let inputRef: HTMLInputElement | undefined;

  // Track scroll position changes to determine if user is at bottom
  const updateScrollState = () => {
    if (!scrollContainer) return;

    const distanceFromBottom =
      scrollContainer.scrollHeight -
      scrollContainer.scrollTop -
      scrollContainer.clientHeight;

    // Use same logic as mini pane: at bottom = within 1px (no mini pane needed)
    setWasNearBottom(distanceFromBottom <= 1);
  };

  // Auto-scroll when new lines arrive based on mini pane visibility
  createEffect(
    on(
      () => ringLength(props.server.lines),
      (newLength, prevLength) => {
        if (props.visible && newLength > 0 && newLength !== prevLength) {
          // If mini pane is visible → don't auto-scroll, user can see new messages there
          // If no mini pane (user at bottom) → auto-scroll to keep them at bottom
          const shouldAutoScroll = wasNearBottom(); // only auto-scroll if at bottom (no mini pane)

          if (shouldAutoScroll) {
            setTimeout(() => {
              if (scrollContainer) {
                scrollContainer.scrollTo({
                  top: scrollContainer.scrollHeight,
                  behavior: "instant",
                });
              }
            }, 0);
          }
        }
      },
    ),
  );

  const aliasMatcher = createMemo(
    on(
      // When visible + whenever config changes, recompile the matcher
      [() => props.server.config.aliases, () => props.visible],
      ([, visible]) => {
        if (visible) {
          console.log("recompiling alias matcher", props.server.name);
          return AliasMatcher.compile(props.server.config.aliases);
        } else {
          return null;
        }
      },
    ),
  );

  const aliasMatch: Accessor<AliasMatch | null> = createMemo(
    on([() => draft(), () => aliasMatcher()], ([draft, aliasMatcher]) => {
      if (!aliasMatcher) {
        // aliasMatcher not yet compiled (e.g. page hasn't been visible yet)
        return null;
      }
      // Every time draft changes, check if it matches an alias
      if (draft.trim().length === 0) {
        return null;
      }

      const match = aliasMatcher.match(draft);
      console.log("checking match", match);
      return match;
    }),
  );

  createEffect(
    on(
      () => props.server.status,
      (status) => {
        // on transition to disconnected, print a message
        if (
          status === "disconnected" // this also applies on server initializing as disconnected
          //&& ringLength(props.server.lines) > 0
        ) {
          dispatch({
            type: "server:new-line",
            serverId: props.server.id,
            terminateLine: true,
            chunks: [
              {
                text: "Disconnected",
                fg: { type: "16", code: Color16.red },
              },
            ],
          });
        }
      },
    ),
  );

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const currentDraft = draft();
    console.log("submit", currentDraft);

    // Only send message if connected
    if (props.server.status === "connected") {
      sendMessage(props.server.id, currentDraft);

      batch(() => {
        dispatch({
          type: "server:new-line",
          serverId: props.server.id,
          terminateLine: true,
          chunks: [
            {
              text: "> " + currentDraft,
              fg: { type: "16", code: Color16.cyan },
            },
          ],
        });
        dispatch({
          type: "server-push-command-history",
          serverId: props.server.id,
          command: currentDraft,
        });
        resetHistory();
      });
    } else {
      // on any other server state, don't submit the message and tell the user to connect
      dispatch({
        type: "server:new-line",
        serverId: props.server.id,
        terminateLine: true,
        chunks: [
          {
            text: "Message not sent. Connecting...",
            fg: { type: "16", code: Color16.yellow },
          },
        ],
      });

      // Start connecting if disconnected, otherwise it must be reconnecting
      if (props.server.status === "disconnected") {
        connect(props.server);
      }
    }

    // Don't clear draft, just select it
    inputRef?.select();

    // Only scroll to bottom if mini pane is not visible (user is already at bottom)
    // If mini pane is visible, user was reading history and shouldn't be interrupted
    if (wasNearBottom()) {
      scrollToBottom(scrollContainer!, "always");
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const direction = e.key === "ArrowUp" ? "up" : "down";
      const newCommand = navigateHistory(
        direction,
        draft(),
        props.server.commandHistory,
      );

      setDraft(newCommand);
      inputRef?.select();
    }
  };

  const handleInput: JSX.InputEventHandlerUnion<
    HTMLInputElement | HTMLTextAreaElement,
    InputEvent
  > = (e) => {
    setDraft(e.currentTarget.value);
    resetHistory();
  };

  return (
    <div
      class="flex-column flex-grow-1"
      style={{
        height: "100%",
        display: props.visible ? "flex" : "none",
      }}
    >
      <Navbar
        style={{ "flex-shrink": 0 }}
        class={`pt-0 pb-0 ${styles.serverNavBar}`}
      >
        <Container fluid class="ps-1 pe-1">
          {/* <Navbar.Brand>{props.server.name}</Navbar.Brand> */}

          {/* Connect/Disconnect button */}
          <Button
            size="sm"
            class="me-2"
            variant={
              props.server.status === "disconnected"
                ? "primary"
                : "outline-secondary"
            }
            onClick={() => {
              if (props.server.status === "disconnected") {
                connect(props.server);
              } else if (props.server.status === "connected") {
                disconnect(props.server.id);
              }
            }}
            disabled={props.server.status === "connecting"}
          >
            <Switch>
              <Match when={props.server.status === "connected"}>
                Disconnect
              </Match>
              <Match when={props.server.status === "connecting"}>
                Connecting...
              </Match>
              <Match when={props.server.status === "disconnected"}>
                Connect
              </Match>
            </Switch>
          </Button>

          <Navbar.Text class="me-2">{props.server.name}</Navbar.Text>
          <Navbar.Text>
            <code>
              {props.server.host}:{props.server.port}
            </code>
          </Navbar.Text>

          <Nav class="ms-auto">
            <Nav.Link
              as="button"
              onClick={() => {
                dispatch({
                  type: "server:set-show-slide-panel",
                  serverId: props.server.id,
                  show: !props.server.showSlidePanel,
                });
              }}
            >
              Options
            </Nav.Link>
            <Nav.Link
              as="button"
              onClick={() => {
                dispatch({
                  type: "set-modal",
                  modal: { type: "server:aliases", id: props.server.id },
                });
              }}
            >
              Aliases
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Scrollback
        server={props.server}
        visible={props.visible}
        ref={(el) => (scrollContainer = el)}
        onScroll={updateScrollState}
      />
      <div class={styles.inputArea}>
        <Form onSubmit={handleSubmit}>
          <Form.Control
            type="text"
            placeholder="Write a command and press enter"
            ref={inputRef}
            value={draft()}
            // on uparrow
            onKeyDown={handleInputKeyDown}
            onInput={handleInput}
          />

          <div class="alias-match">
            <Badge bg={aliasMatch() ? "success" : "secondary"}>
              Alias: {aliasMatch() ? "Yes" : "No"}
            </Badge>
          </div>
        </Form>
      </div>
    </div>
  );
};
