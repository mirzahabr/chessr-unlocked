# Code map — what is inside a build

This map applies to `versions/3.7.2/chessr-original-restored/` and to any build generated
from it by `scripts/build-unlocked.sh 3.7.2`. Both trees have the same layout; only three
files differ, and the patch says which.

## Top level

| File | What it is |
|---|---|
| `manifest.json` | MV3 manifest. Permissions: `storage`, `activeTab`, `declarativeNetRequest`, `debugger`. Hosts: the three chess sites plus `app.chessr.io`. |
| `rules.json` | Four `declarativeNetRequest` block rules: chess.com FairPlay RPC, chess.com `play-monitor-browser-extensions`, chess.com UserActivity, and `sentry.io`. |
| `background.js` | Service worker. `fetchExtensionFile` (serves the explanation engine to a worker), `cdpMouseMove`/`cdpClick` (synthetic input), `open_stream`, `getBackgroundDiag`. Keeps a 100-entry console ring buffer. |
| `stream.html` | Stream Mode page: `#app`, Google Fonts, `<script type="module" src="/chunks/…">`, stylesheet link. |

## `content-scripts/`

| File | World | What it is |
|---|---|---|
| `content.js` | isolated | The application: React overlay in a shadow root, all stores, the sealed WebSocket client, i18n, settings, review UI. ~2.9 MB restored. |
| `pageContext.js` | MAIN | Site adapters for chess.com, lichess and worldchess; reads the board, answers `requestState`/`rescan`, executes moves. ~75 KB restored. |
| `chesscomAnon.js` | MAIN | Blurs the player's own username on chess.com ("anonymous mode" for streamers). |
| `chesscomFakeTitle.js` | MAIN | Draws a fake FIDE title badge next to the player's name on chess.com. |
| `content.css` | — | Overlay stylesheet, injected with `use_dynamic_url`. |

## `chunks/` and `assets/`

| File | What it is |
|---|---|
| `chunks/stream-l1H6Qjn3.js` | The same application compiled for the Stream Mode entrypoint; loaded as an ES module, so it must stay strict-mode clean. ~2.3 MB restored. |
| `assets/stream-CCn0dxZm.css` | Stream Mode stylesheet. |
| `assets/sealed_core_bg-UdwPS9XK.wasm` | Asset-URL copy of the handshake module. |

## `engine/` and `wasm/`

| File | What it is |
|---|---|
| `engine/explanation-engine.js` | Glue for the local AI-commentary engine; fetched by the service worker and run as a Blob worker. |
| `engine/explanation-engine.wasm` | 26 MB commentary model. Never modified. |
| `wasm/sealed_core_bg.wasm` | Rust/wasm-bindgen module: `handshake_start`, `handshake_finish`, `seal`, `open`, `free`. The JS glue lives inline in `content.js`. |

No chess engine ships in upstream 3.7.2. A build produced by `scripts/build-unlocked.sh`
adds three back — `dragon.js/.wasm`, `stockfish.js/.wasm`, `book.bin` and the `maia3/`
folder — extracted from git history by `scripts/install-local-engines.sh`;
`--no-local-engines` skips them.
`engine/` is third-party either way and untouchable: the unlock never edits it, it only
adds files next to the explanation engine.

## `icons/`

Application icons (`icon16/48/128`, `chessr-logo`), the eleven move-classification SVGs
(`cls-best.svg` … `cls-forced.svg`) and platform logos under `platforms/`.

One upstream quirk: the sign-in screen asks for `/icons/x9110e26d-logo.png`, a
build-namespaced file the package does not contain, so that image 404s. It is on the screen
the unlock removes.

## `project-documentation/`

`PROJECT_REPORT.md` — the technical report for this version. The only non-loadable file
allowed inside a build, and the only one that is not packaged into a release.
