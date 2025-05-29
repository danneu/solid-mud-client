// // Starts long-running process to connect to a server

// import type { Chunk, Server, Store } from "./store";
// import { createAnsiSequenceParser } from "ansi-sequence-parser";

// let socket: WebSocket | null = null;

// export function connect(
//   store: Store,
//   server: Server,
//   proxyUrl: string
// ): WebSocket {
//   if (socket) {
//     socket.close();
//     socket = null;
//   }

//   // Ensure this is killed when we disconnect
//   const ansiParser = createAnsiSequenceParser();

//   console.log(
//     `connecting to "telnet://${server.host}:${server.port}" through telnet proxy "${proxyUrl}"`
//   );

//   store.setState((prev) => {
//     prev.connectionState = "connecting";
//   });
//   const url = `${proxyUrl}?host=${encodeURIComponent(server.host)}&port=${
//     server.port || 23
//   }`;

//   socket = new WebSocket(
//     `ws://localhost:8888?host=${server.host}&port=${server.port}`
//   );

//   const onerror = (error: Event) => {
//     console.error("error connecting to telnet proxy:", error);
//   };

//   const onopen = () => {
//     console.log("websocket connected");
//   };

//   const onmessage = (event: MessageEvent<string>) => {
//     console.log("recv:", event.data);
//     // const lines = event.data.split(/\r?\n/);
//     // const messages: Message[] = lines.reduce((acc, line) => {
//     // const parsed = lines.map((line) => ansiParser.parse(line));
//     // console.log(parsed);
//     const tokens = ansiParser.parse(event.data);
//     const newChunks: Chunk[] = [];

//     for (const token of tokens) {
//       // Filter out NUL bytes
//       token.value = token.value.replace(/\x00/g, "");

//       if (token.value.includes("\n") || token.value.includes("\r\n")) {
//         // Split token on line breaks, keeping the delimiters
//         const parts = token.value.split(/(\r?\n)/);
//         console.log(parts);
//         parts.forEach((part) => {
//           if (!part) {
//             return;
//           } else if (part === "\n" || part === "\r\n") {
//             // It's a line break
//             newChunks.push({ type: "break" });
//           } else if (part) {
//             // It's content
//             newChunks.push({
//               type: "print",
//               token: { ...token, value: part },
//             });
//           }
//         });
//       } else if (token.value) {
//         // Token doesn't contain line breaks
//         newChunks.push({ type: "print", token });
//       }
//     }

//     store.emit("chunk");
//     store.setState((prev) => {
//       prev.chunks = [...prev.chunks, ...newChunks];
//     });

//     // Consider ourselves connecting until we get our first msg from server
//     if (store.state.connectionState === "connecting") {
//       store.setState((prev) => {
//         prev.connectionState = "connected";
//       });
//     }
//   };

//   const onclose = () => {
//     console.log("websocket closed");
//     if (socket) {
//       socket.removeEventListener("error", onerror);
//       socket.removeEventListener("open", onopen);
//       socket.removeEventListener("message", onmessage);
//       socket.removeEventListener("close", onclose);
//       socket = null;
//     }
//   };

//   const s = new WebSocket(url);
//   s.addEventListener("error", onerror);
//   s.addEventListener("open", onopen);
//   s.addEventListener("message", onmessage);
//   s.addEventListener("close", onclose);
//   return s;
// }
