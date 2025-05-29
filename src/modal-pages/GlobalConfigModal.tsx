import type { Component } from "solid-js";
import { Form, Modal } from "solid-bootstrap";
import { useStore } from "../store";
import { createSignal } from "solid-js";
import { z } from "zod/v4-mini";

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
          <Form.Group class="mb-3">
            <Form.Label>Telnet Proxy URL</Form.Label>
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
