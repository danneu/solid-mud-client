# solid-mud-client

**Live demo**: <https://www.danneu.com/solid-mud-client/>

A rewrite and major continuation of the progress I made in [danneu/elm-mudclient](https://github.com/danneu/elm-mudclient) ([live demo](https://www.danneu.com/elm-mudclient/)).

Built with [Solid](https://www.solidjs.com/) and [Bootstrap](https://getbootstrap.com/).

## Features

- [x] Connect many MUD servers at a time
- [x] ANSI sequence color and formatting (See: [danneu/ansi-stream-parser](https://github.com/danneu/ansi-stream-parser))
- [x] Filtering of lines
- [ ] Screen-reader friendly
- [ ] Alias system (there is a very rough implementation)
- [ ] Trigger system

## Goals

- **Screen-reader friendly**
  - I'd like it to be highly optimized for screen readers, but I haven't even started yet.
  - I sheepishly don't know the first thing about "aria" web accessibility
- **Multi-server gaming** from one frontend

## Run

```bash
$ pnpm install # or npm install

# Start frontend
$ pnpm run dev # or npm run dev

# Build static files into `dist/`
$ pnpm run build # or npm run build
```

## Telnet proxy

Since a browser app can't talk directly to a raw TCP socket, we need a proxy.

I maintain a [telnet proxy](https://github.com/danneu/telnet-proxy) that bridges a WebSocket to a telnet server.

I have a public server running at <wss://telnet-proxy.fly.dev>.

Feel free to use my public server or host it yourself.
