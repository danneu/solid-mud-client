import { Button, Modal } from "solid-bootstrap";
import { useStore } from "../store";
import { batch, type Component } from "solid-js";
import { ServerForm, type ServerFormValues } from "../components/ServerForm";

const ServerConfigModal: Component = () => {
  const { state, dispatch, getServer } = useStore();

  if (state.modal?.type !== "server:config") {
    return null;
  }

  const server = getServer(state.modal.id);
  if (!server) {
    return null;
  }

  const handleSubmit = (values: ServerFormValues) => {
    batch(() => {
      dispatch({
        type: "server-update-config",
        serverId: server.id,
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
        <Modal.Title>Configure Server: {server.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ServerForm
          initialValues={{
            name: server.name,
            host: server.host,
            port: server.port,
            encoding: server.encoding,
          }}
          onSubmit={handleSubmit}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="link"
          class="text-danger me-auto"
          onClick={() =>
            dispatch({ type: "server-delete", serverId: server.id })
          }
        >
          Delete
        </Button>
        <Button
          onClick={() => dispatch({ type: "set-modal", modal: null })}
          variant="outline-secondary"
        >
          Cancel
        </Button>
        <Button type="submit" form="server-form">
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ServerConfigModal;
