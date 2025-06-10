import { Button, Modal } from "solid-bootstrap";
import { useStore } from "../model";
import { batch, type Component } from "solid-js";
import { ServerForm, type ServerFormValues } from "../components/ServerForm";

const NewServerModal: Component = () => {
  const { state, dispatch } = useStore();

  if (state.modal?.type !== "server:new") {
    return null;
  }

  const handleSubmit = (values: ServerFormValues) => {
    batch(() => {
      dispatch({
        type: "server-add",
        ...values,
      });
      dispatch({
        type: "set-modal",
        modal: null,
      });
    });
  };

  return (
    <Modal
      show
      onHide={() =>
        dispatch({
          type: "set-modal",
          modal: null,
        })
      }
    >
      <Modal.Header closeButton>
        <Modal.Title>Add New Server</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ServerForm onSubmit={handleSubmit} />
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={() => dispatch({ type: "set-modal", modal: null })}
        >
          Cancel
        </Button>
        <Button type="submit" form="server-form" variant="primary">
          Add Server
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NewServerModal;
