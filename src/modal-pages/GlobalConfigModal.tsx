import type { Component } from "solid-js";
import { Button, Form, Modal } from "solid-bootstrap";
import { useStore } from "../store";
import { createSignal, Show } from "solid-js";
import { z } from "zod/v4-mini";
import { PRODUCTION_PROXY_URL } from "../config";

const ProxyUrlSchema = z.string().check(
  z.url(),
  z.refine(
    (val) => {
      const protocol = new URL(val).protocol;
      return protocol === "ws:" || protocol === "wss:";
    },
    {
      message: "Must be a valid WebSocket URL (ws:// or wss://)",
      abort: true,
    },
  ),
);

export const GlobalConfigModal: Component = () => {
  const { state, dispatch } = useStore();
  const [draft, setDraft] = createSignal(state.proxy);
  const [proxyUrlError, setProxyUrlError] = createSignal<string | null>(null);

  const handleClose = () => {
    dispatch({
      type: "set-modal",
      modal: null,
    });
  };

  return (
    <Modal show={true} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Global Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <div class="d-flex align-items-center justify-content-between">
              <Form.Label>Telnet Proxy URL</Form.Label>
              <Show when={state.proxy !== PRODUCTION_PROXY_URL}>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setDraft(PRODUCTION_PROXY_URL);
                    setProxyUrlError(null);
                    dispatch({
                      type: "set-proxy-url",
                      url: PRODUCTION_PROXY_URL,
                    });
                  }}
                  disabled={draft() === PRODUCTION_PROXY_URL}
                >
                  Default
                </Button>
              </Show>
            </div>
            <Form.Control
              type="text"
              placeholder="ws://localhost:8888"
              value={draft()}
              onInput={(e) => {
                const val = e.currentTarget.value;
                setDraft(val);
                const result = ProxyUrlSchema.safeParse(val);
                if (result.success) {
                  setProxyUrlError(null);
                  dispatch({
                    type: "set-proxy-url",
                    url: val,
                  });
                } else {
                  const message = result.error.issues[0].message;
                  console.log("message", message);
                  setProxyUrlError(message);
                }
              }}
              isInvalid={!!proxyUrlError()}
            />
            <Form.Text class="text-muted">
              WebSocket URL for the telnet-to-WebSocket proxy server
            </Form.Text>
            <Form.Control.Feedback type="invalid">
              {proxyUrlError()}
            </Form.Control.Feedback>
          </Form.Group>
        </Form>
      </Modal.Body>
      {/* <Modal.Footer></Modal.Footer> */}
    </Modal>
  );
};
