import { Form } from "solid-bootstrap";
import { createSignal, Index, type Component } from "solid-js";
import type { ConnectionOptions } from "telnet-proxy";
import type { Server } from "../store";

export type ServerFormValues = {
  name: Server["name"];
  host: Server["host"];
  port: Server["port"];
  encoding: Server["encoding"];
};

type ServerFormProps = {
  initialValues?: ServerFormValues;
  onSubmit: (values: ServerFormValues) => void;
};

export const ServerForm: Component<ServerFormProps> = (props) => {
  const [name, setName] = createSignal(props.initialValues?.name || "");
  const [host, setHost] = createSignal(props.initialValues?.host || "");
  const [port, setPort] = createSignal(
    props.initialValues?.port?.toString() || "23",
  );
  const [encoding, setEncoding] = createSignal<ConnectionOptions["encoding"]>(
    props.initialValues?.encoding || "auto",
  );

  const options: [ConnectionOptions["encoding"], string][] = [
    ["auto", "Auto (default)"],
    ["utf8", "UTF-8"],
    ["latin1", "Latin-1 (ISO-8859-1)"],
    ["gbk", "GBK"],
    ["big5", "Big5"],
  ];

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    const portNum = parseInt(port(), 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      alert("Port must be a number between 1 and 65535");
      return;
    }

    props.onSubmit({
      name: name().trim(),
      host: host().trim(),
      port: portNum,
      encoding: encoding(),
    });
  };

  return (
    <Form onSubmit={handleSubmit} id="server-form">
      <Form.Group class="mb-3">
        <Form.Label>Server Name</Form.Label>
        <Form.Control
          type="text"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
          placeholder="My MUD Server"
          required
        />
      </Form.Group>

      <Form.Group class="mb-3">
        <Form.Label>Host</Form.Label>
        <Form.Control
          type="text"
          value={host()}
          onInput={(e) => setHost(e.currentTarget.value)}
          placeholder="mud.example.com"
          required
        />
      </Form.Group>

      <Form.Group class="mb-3">
        <Form.Label>Port</Form.Label>
        <Form.Control
          type="number"
          value={port()}
          onInput={(e) => setPort(e.currentTarget.value)}
          min="1"
          max="65535"
          required
        />
      </Form.Group>

      <Form.Group class="mb-3">
        <Form.Label>Encoding</Form.Label>
        <Form.Select
          value={encoding()}
          onChange={(e) =>
            setEncoding(e.currentTarget.value as ConnectionOptions["encoding"])
          }
        >
          <Index each={options}>
            {(option) => <option value={option()[0]}>{option()[1]}</option>}
          </Index>
        </Form.Select>
        <Form.Text class="text-muted">
          Character encoding used by the MUD server
        </Form.Text>
      </Form.Group>
    </Form>
  );
};
