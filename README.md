# pdn-whatspac-client

A persistent, out-of-process **WhatsPac client** that runs as a [packet.net](https://github.com/m0lte/packet.net) (pdn) app.

WhatsPac (Kevin M0AHN) is a browser SPA with no engine of its own and — its defining limitation — **no persistence**: the over-the-air session to the central WhatsPac Server (WPS, `MB7NPW-9`) lives and dies with the browser tab. `pdn-whatspac-client` fixes that structurally: it is a long-running agent that **holds the WPS link continuously, persists all state**, and presents it through **two heads** — a LAN/phone web UI and a line-based RF terminal reachable from any dumb packet connection (`C WHATSPAC`).

It is **not** a re-host of the WhatsPac SPA. It speaks the WPS application protocol end-to-end over a transparent AX.25 stream obtained from pdn via **RHPv2** — the same decoupled app↔node boundary other pdn apps use.

> Design record / ADR: [`packet.net:docs/whatspac-client-design.md`](https://github.com/m0lte/packet.net/blob/main/docs/whatspac-client-design.md).

## Architecture

```
pdn node ──RHPv2 (TCP/9000)──► [ Agent: WPS link + SQLite store ] ──► (a) LAN/phone HTTP+SSE UI  (via pdn app-gateway)
         ──pdn-app/1 session──►                                  └──► (b) RF terminal (C WHATSPAC)
```

- **`Whatspac.Wps`** — the WPS application-protocol codec: framing (deflate + base64, `0xC0`/`\r` delimiters, Latin-1-clean) + the typed message model.
- **`Whatspac.Agent`** — the persistent agent: RHP transport, connect-script runner, codec wiring, SQLite persistence, keepalive, reconnect/resync. *(in progress)*
- **`Whatspac.Host`** — the supervised daemon: serves the LAN/phone head and the RF-terminal head over the one agent + store. *(in progress)*

## Status

Early build-out, sliced per the ADR §5. The WPS protocol is re-derived from the production SPA bundle; the remaining `(verify)` items need a single on-air capture against the live RF network (radio-gated).

## Build

```
dotnet build
dotnet test
```

Requires the .NET 10 SDK.
