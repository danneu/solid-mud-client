import { Modal } from "solid-bootstrap";
import { useStore } from "../model";
import type { Component } from "solid-js";

export const DebugModal: Component = () => {
  const { state, dispatch } = useStore();

  return (
    <Modal
      show
      size="lg"
      onHide={() =>
        dispatch({
          type: "set-modal",
          modal: null,
        })
      }
    >
      <Modal.Header closeButton>
        <Modal.Title>Debug</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </Modal.Body>
    </Modal>
  );
};
