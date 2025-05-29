import { Alert, Button, Modal } from "solid-bootstrap";
import { useStore } from "../store";
import {
  batch,
  createSignal,
  onMount,
  onCleanup,
  Show,
  type Component,
} from "solid-js";
import { basicSetup } from "codemirror";
import { EditorView } from "codemirror";
import { yaml as codemirrorYaml } from "@codemirror/lang-yaml";
import { oneDark } from "@codemirror/theme-one-dark";
import { indentWithTab } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import {
  parseServerConfigSafe,
  serverConfigErrorToString,
} from "../server-config";

const tabKeymap = keymap.of([indentWithTab]);

const ServerAliasesModal: Component = () => {
  const { state, dispatch, getServer } = useStore();
  if (state.modal?.type !== "server:aliases") {
    return null;
  }
  const server = getServer(state.modal.id);
  if (!server) {
    return null;
  }

  let view: EditorView | undefined;

  onMount(() => {
    // load editor with server config
    if (view) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: server.config.markup,
        },
      });
    }
  });

  onCleanup(() => {
    // Clean up CodeMirror instance
    if (view) {
      view.destroy();
    }
  });

  const [editorError, setEditorError] = createSignal<string | null>(null);

  const handleSubmit = () => {
    if (!view) return;
    setEditorError(null);

    const result = parseServerConfigSafe(view.state.doc.toString());
    if (!result.success) {
      setEditorError(serverConfigErrorToString(result.error));
      return;
    }

    batch(() => {
      dispatch({
        type: "server-set-config",
        serverId: server.id,
        config: result.value,
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
        <Modal.Title>Aliases for {server.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          ref={(el) => {
            view = new EditorView({
              doc: "Start document",
              parent: el,
              extensions: [basicSetup, codemirrorYaml(), oneDark, tabKeymap],
            });
          }}
        />
        <Show when={editorError()}>
          <Alert
            variant="danger"
            dismissible
            onClose={() => setEditorError(null)}
          >
            <pre>{editorError()}</pre>
          </Alert>
        </Show>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleSubmit}>Save</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ServerAliasesModal;
