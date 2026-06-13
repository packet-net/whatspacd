# Packaging & deployment

whatspacd runs two ways from the same code: **standalone** (your own service,
against XRouter/LinBPQ/pdn) or as a **pdn app** (supervised, with its UI and RF
terminal surfaced by the node). It needs an RHP host on TCP (default
`127.0.0.1:9000`).

## Build artifacts

```sh
npm run build              # -> dist/main.js   (single ESM bundle; run with node)
node scripts/package-sea.mjs   # -> dist/whatspacd   (self-contained binary, Node SEA)
```

`dist/main.js` bundles everything except node: builtins (`node:sqlite` is loaded
natively), so it needs only Node ≥ 22.5. The SEA binary needs no Node at all.

> The SEA step injects into the Node executable used to build it, so it requires
> an **official statically-linked Node** (what `actions/setup-node` installs, and
> what the release workflow uses). A distro's shared-`libnode` build (e.g. a thin
> `/usr/bin/node`) cannot be a SEA base — on such hosts use `node dist/main.js`.

## Standalone

Set the configuration via environment and run the binary or the bundle:

| Variable | Default | Meaning |
|---|---|---|
| `WHATSPACD_CALLSIGN` | — (**required**) | your WhatsPac callsign (the connect-object `c`) |
| `WHATSPACD_NAME` | = callsign | display name |
| `WHATSPACD_RHP_HOST` / `_PORT` | `127.0.0.1` / `9000` | the RHP host (pdn/XRouter/BPQ) |
| `WHATSPACD_RHP_USER` / `_PASS` | — | RHP auth, if the host requires it |
| `WHATSPACD_FAMILY` | `ax25` | `ax25` or `netrom` (L4) |
| `WHATSPACD_LOCAL_CALLSIGN` | = callsign | AX.25 source callsign |
| `WHATSPACD_NODE_CALL` | `GB7BPQ`… | first connect-script hop (the node you reach WPS through) |
| `WHATSPACD_WPS_CALL` | `MB7NPW-9` | the WhatsPac Server callsign |
| `WHATSPACD_CONNECT_SCRIPT` | (built from the above) | explicit JSON `[{cmd,val}]` connect-script override |
| `WHATSPACD_STATE_DIR` | `./state` | where the SQLite store lives |
| `WHATSPACD_WEB_HOST` / `_PORT` | `127.0.0.1` / `18900` | the web head bind |
| `WHATSPACD_RF_SOCKET` | `<state>/whatspac.sock` | the RF terminal Unix socket |

```sh
WHATSPACD_CALLSIGN=M0XYZ WHATSPACD_RHP_HOST=127.0.0.1 ./dist/whatspacd
```

A minimal systemd unit:

```ini
[Service]
Environment=WHATSPACD_CALLSIGN=M0XYZ
Environment=WHATSPACD_STATE_DIR=/var/lib/whatspacd
ExecStart=/usr/local/bin/whatspacd
Restart=on-failure
```

## As a pdn app

[`pdn-app.yaml`](../pdn-app.yaml) is the manifest. pdn discovers a `whatspac`
directory under `/usr/share/packetnet/apps/` (staged from a release) or
`/var/lib/packetnet/apps/` (owner-installed). It stays **off** until the owner
enables it in `packetnet.yaml` and supplies the one required value:

```yaml
apps:
  - id: whatspac
    enabled: true
    environment:
      WHATSPACD_CALLSIGN: M0XYZ
```

pdn injects `PDN_RHP_HOST/PORT`, `PDN_NODE_CALLSIGN`, `PDN_APP_STATE`; whatspacd
reads those as fallbacks. pdn supervises the `service:` daemon, reverse-proxies
the web UI at `/apps/whatspac/*`, and routes `C WHATSPAC` to the RF terminal over
the `session:` socket.

> The `session.socketPath` and `WHATSPACD_RF_SOCKET` must resolve to the same
> path; confirm on-node whether pdn interpolates `${PDN_APP_STATE}` in
> `socketPath` (pin an absolute path in both if not).

## Releases

Tagging `v*` runs [`.github/workflows/release.yml`](../.github/workflows/release.yml):
typecheck + test, build the bundle and a per-OS SEA binary, stamp the manifest
version to the tag, and attach the binaries + `pdn-app.yaml` to the GitHub
release — the same fetch-manifest-and-binary-together pattern pdn's deb uses.
