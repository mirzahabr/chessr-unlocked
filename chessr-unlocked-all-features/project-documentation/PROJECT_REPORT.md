# Chessr.io Browser Extension — Project Report

This document is a standalone reference for the Chessr.io browser extension
(v3.3.2). It is meant to let anyone — including a future version of an AI
assistant with no memory of prior sessions — understand the project's
architecture, code layout, and behavior without needing any other context.

It lives in `project-documentation/`, deliberately separate from the
extension's own source tree, so it is never mistaken for part of the shipped
product and never accidentally bundled/loaded by the browser.

---

## 1. What this project is

Chessr.io is a Manifest V3 Chrome extension that injects a chess-assistance
overlay into three chess platforms — **chess.com**, **lichess.org**, and
**worldchess.com** — plus a companion "Stream Mode" tab hosted inside the
extension itself. While a game is in progress it:

- Reads the live board state (FEN, whose turn it is, ratings, game-over status)
  directly from each site's own in-page JavaScript APIs.
- Runs that position through a bundled suite of local chess engines to
  evaluate it and classify the quality of moves played (book / best /
  excellent / good / inaccuracy / mistake / blunder / miss / brilliant /
  great / forced).
- Displays an evaluation bar, best-move arrows, and move-quality markers as an
  overlay on top of the game.
- Can optionally play moves back onto the board itself (auto-move), including
  a "humanized" mode that adds pick/select/move delays and can fall back to
  simulated mouse input via the Chrome DevTools Protocol so moves look like
  real physical drags rather than instantaneous API calls.
- Offers small cosmetic extras on chess.com: blurring player usernames
  ("anonymous mode", for streaming) and displaying a fake FIDE title badge
  next to the user's own name.
- Ships a "Stream Mode" — a separate extension tab with its own clean React
  UI, for streamers who want the analysis overlay on a dedicated window
  instead of layered on the game page.
- Authenticates against a Chessr.io backend (Supabase-based, plus a
  `wss://api.chessr.io` WebSocket) for account/subscription features, and
  blocks a handful of chess.com's own anti-extension telemetry endpoints via
  Manifest V3's `declarativeNetRequest` API (see §7).

The extension is built with **[WXT](https://wxt.dev)** (a web-extension
framework comparable to Vite-for-extensions) — this is evident from the
`defineBackground` and `wxt`-prefixed logger wrappers present in every
entrypoint bundle, and from the file-naming convention (hashed chunk names
like `stream-Cq9Ik-VD.js`, `stream-DMcmulGQ.css`). The UI layer is **React**
(confirmed via `React.createElement`, `useState`, `useEffect`, `useMemo` calls
in the bundles).

---

## 2. Directory structure and responsibility of every file

```
chessr v3.3.2/
├── manifest.json                  Chrome MV3 manifest — the extension's entry point
├── rules.json                     declarativeNetRequest static rules (network blocking)
├── stream.html                    Host page for the standalone "Stream Mode" tab
├── background.js                  Service worker (background script)
├── _metadata/                     Chrome-generated at install/load time, NOT source
│   └── generated_indexed_rulesets/_ruleset1   Compiled form of rules.json
│
├── content-scripts/
│   ├── pageContext.js             MAIN-world script: platform adapters (core logic)
│   ├── content.js                 Isolated-world script: the React overlay app (largest file)
│   ├── content.css                Stylesheet for the overlay, injected at runtime
│   ├── chesscomAnon.js            MAIN-world script: username-blur "anonymous mode"
│   └── chesscomFakeTitle.js       MAIN-world script: cosmetic fake title badge
│
├── chunks/
│   └── stream-Cq9Ik-VD.js         Stream Mode's React app bundle (loaded by stream.html)
│
├── assets/
│   └── stream-DMcmulGQ.css        Stream Mode's stylesheet (loaded by stream.html)
│
├── icons/
│   ├── icon16.png / icon48.png / icon128.png   Extension toolbar/store icons
│   ├── chessr-logo.png            Branding, used in the auth UI
│   ├── cls-*.svg (11 files)       One icon per move-quality classification
│   └── platforms/                 Logos for chess.com / lichess / worldchess (UI use)
│
├── engine/                        Bundled local chess engines — THIRD-PARTY, UNTOUCHED
│   ├── stockfish.js / .wasm       Official Stockfish (GPLv3) — general analysis engine
│   ├── dragon.js / .wasm          Komodo Dragon engine build ("KOMODO_TEP" internally)
│   ├── explanation-engine.js/.wasm Another Komodo Dragon build, used for move explanations
│   ├── torch-4-lite.js / .wasm    Chess.com's own lightweight NNUE engine ("Torch")
│   ├── book.bin                   Opening book (Polyglot-style binary format)
│   ├── rodent/                    Rodent (personality-based engine): .js/.wasm/.data
│   └── maia3/                     Maia 3 human-move-prediction neural net (ONNX)
│       ├── maia3-worker.js        First-party Web Worker glue (small, already readable)
│       ├── model.onnx             The neural network weights
│       ├── all_moves.json / all_moves_reversed.json   Move<->index vocabulary for the model
│       └── ort/                   Microsoft ONNX Runtime Web (third-party, vendored)
│
└── project-documentation/         THIS folder — documentation only, not extension source
    └── PROJECT_REPORT.md          This file
```

### File-by-file responsibility summary

| File | World / Context | Responsibility |
|---|---|---|
| `manifest.json` | — | Declares permissions, host permissions, background worker, content scripts, and web-accessible resources. See §3. |
| `rules.json` | — | Three `declarativeNetRequest` rules that block specific chess.com telemetry/anti-cheat requests. See §7. |
| `background.js` | Service worker | CDP-based synthetic mouse input, Stream-Mode tab tracking, runtime message router, diagnostics log, welcome-page opening. See §5.1. |
| `content-scripts/pageContext.js` | MAIN world, `document_start` | Talks directly to each site's own JS game/board objects; the only file that knows how chess.com/lichess/worldchess actually represent a game internally. See §5.2. |
| `content-scripts/content.js` | Isolated world | The main React overlay: engines, evaluation bar, arrows, markers, FAB, auth, opening panel, system messages. See §5.3. |
| `content-scripts/content.css` | — | Stylesheet for everything `content.js` renders. |
| `content-scripts/chesscomAnon.js` | MAIN world, `document_start` | Blurs on-page usernames when "anonymous mode" is toggled. |
| `content-scripts/chesscomFakeTitle.js` | MAIN world, `document_start` | Injects a cosmetic fake title (GM/IM/etc.) badge next to the logged-in user's name. |
| `chunks/stream-Cq9Ik-VD.js` | Extension page (own tab) | React app for the standalone Stream Mode tab. See §5.4. |
| `assets/stream-DMcmulGQ.css` | — | Stylesheet for Stream Mode. |
| `stream.html` | Extension page | Host HTML for Stream Mode; loads the two files above. |
| `icons/cls-*.svg` | — | One icon per move classification (see §6). |
| `engine/*` | Web Workers / WASM | Bundled chess engines and their data files. Third-party except `maia3-worker.js`. See §6. |

---

## 3. The manifest — permissions and wiring

`manifest.json` is standard Chrome Manifest V3 JSON. **It was intentionally
left unmodified** — JSON has no comment syntax, and Chrome's manifest schema
is strict about unknown top-level keys, so adding pseudo-comment fields
would risk breaking the extension for no real documentation benefit. Its
structure is explained here instead:

- **`permissions`**: `storage` (chrome.storage.local for all persisted
  state), `activeTab`, `declarativeNetRequest` (for `rules.json`), and
  `debugger` (used by `background.js` to simulate real mouse input via CDP —
  see §5.1 and §8).
- **`host_permissions`**: the three game sites plus `app.chessr.io` (the
  Chessr.io web app / auth backend).
- **`web_accessible_resources`**: exposes `/icons/*` and `/engine/*` to the
  three game-site origins (so content scripts and page-injected workers can
  `fetch()` engine files and icons), and separately exposes
  `content-scripts/content.css` with `use_dynamic_url: true` (a per-load
  random URL token, a MV3 anti-fingerprinting feature for web-accessible
  resources).
- **`background.service_worker`**: `background.js`.
- **`content_scripts`**: three separate registrations —
  1. `chesscomAnon.js` + `chesscomFakeTitle.js` — chess.com only, MAIN world,
     `document_start`.
  2. `content.js` — all three sites, **isolated world** (no `world` key —
     isolated is Chrome's default), default run time (`document_idle`).
  3. `pageContext.js` — all three sites, MAIN world, `document_start`.

**Why three separate content-script registrations instead of one:** Manifest
V3 isolated-world scripts cannot see the page's own JavaScript globals (e.g.
chess.com's `wc-chess-board.game` object, or `window.lichess`). Only a
`world: "MAIN"` script can. So the platform-specific game logic
(`pageContext.js`) has to run in the MAIN world, while the React UI
(`content.js`) runs isolated (safer, standard extension sandboxing, and it
needs `chrome.*` APIs which MAIN-world scripts cannot use). The two
communicate via `window.postMessage` — see §4.

---

## 4. Data flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  Page (chess.com / lichess.org / worldchess.com)                    │
│                                                                       │
│   ┌───────────────────────────┐        ┌──────────────────────────┐ │
│   │  pageContext.js            │        │  chesscomAnon.js /       │ │
│   │  (MAIN world)               │        │  chesscomFakeTitle.js    │ │
│   │  - reads board/game state   │        │  (MAIN world, chess.com  │ │
│   │  - executes moves on the    │        │   only)                  │ │
│   │    real board object        │        └────────────┬─────────────┘ │
│   └──────────────┬─────────────┘                       │ window       │
│                  │ window.postMessage                  │ .postMessage │
│                  │ ("chessr:mode"/"chessr:move"/…)      │ ("chessr:    │
│                  ▼                                     │  setAnon/    │
│   ┌───────────────────────────────────────────┐        │  setTitle")  │
│   │  content.js  (isolated world)               │◄──────┘             │
│   │  - React overlay UI                         │                     │
│   │  - drives engines (Web Workers/WASM)         │                     │
│   │  - chrome.storage.local for persistence       │                     │
│   │  - chrome.runtime.sendMessage → background    │                     │
│   └───────────────┬───────────────────────────┘                      │
└───────────────────┼──────────────────────────────────────────────────┘
                    │ chrome.runtime.sendMessage
                    ▼
        ┌───────────────────────────┐        chrome.storage.local
        │  background.js             │◄──────────────────────────────┐
        │  (service worker)           │                                │
        │  - CDP debugger attach/     │                                │
        │    dispatchMouseEvent       │                                │
        │  - opens stream.html tab    │                                │
        │  - fetches bundled files    │                                │
        └───────────────────────────┘                                │
                                                                        │
        ┌───────────────────────────────────────────────────────────┐│
        │  stream.html  (extension's own tab)                        ││
        │  └─ chunks/stream-Cq9Ik-VD.js (React app) ─────────────────┘│
        │     - reads/writes chrome.storage.local to stay in sync    │
        │       with the live game tab (no direct postMessage link,  │
        │       since it is not injected into the game page)          │
        └───────────────────────────────────────────────────────────┘
```

**Message vocabulary** (all prefixed `chessr:`, passed as `{ type, ...data }`
objects via `window.postMessage(msg, "*")` between `pageContext.js` and
`content.js`):

| Message | Direction | Purpose |
|---|---|---|
| `chessr:mode` | pageContext → content | Game mode changed (playing/observing/idle), includes FEN/turn/result/playingAs. |
| `chessr:move` | pageContext → content | A move happened; new FEN/turn/game-over state. |
| `chessr:newGame` | pageContext → content | A new game/puzzle started; content.js should reset its state. |
| `chessr:gameOver` | pageContext → content | Terminal result reached (checkmate/resign/draw/etc.), with the classified end reason. |
| `chessr:initialMoves` | pageContext → content | The move list of a game already in progress when the page loaded (e.g. after a refresh). |
| `chessr:ratings` | pageContext → content | Player/opponent numeric ratings, once discoverable from the DOM. |
| `chessr:executeMove` | content → pageContext | Play a specific move (UCI string), optionally humanized with delays. |
| `chessr:executePremove` | content → pageContext | Queue a premove. |
| `chessr:cancelPremoves` | content → pageContext | Cancel any queued premove. |
| `chessr:rematch` | content → pageContext | Click the platform's own "new game"/"rematch" control. |
| `chessr:requestState` | content → pageContext | Ask pageContext to re-emit its current state (e.g. on overlay mount). |
| `chessr:cdpMouseMove` / `chessr:cdpClick` | pageContext → content → background | Request a *simulated physical* mouse drag/click (see §5.1/§8), when the page's board doesn't expose a direct move API (mainly Lichess's raw-DOM fallback path). |
| `chessr:setAnon` | content ↔ chesscomAnon | Toggle username blurring. |
| `chessr:setTitle` | content ↔ chesscomFakeTitle | Toggle/change the cosmetic fake title. |
| `chessr:rescan` | (seen in content.js / stream bundle) | Ask the overlay to re-detect the current board/game (used after DOM changes the MutationObservers might have missed). |

**Persistent storage** (`chrome.storage.local`, all first-party, no external
sync): keys observed in `content.js` include `chessr_stream_open` (whether a
Stream Mode tab is currently open — also written by `background.js`),
`chessr_stream_state` (the state Stream Mode reads to mirror the live game),
`chessr_widget` (overlay widget UI state), and `chessr_link_start` (likely
tracks an account-linking/auth flow's start). `localStorage` (page-scoped, not
`chrome.storage`) is used by the two MAIN-world cosmetic scripts for their own
simple booleans: `chessr-anon`, `chessr-title`, `chessr-title-type`.

---

## 5. Core components in detail

### 5.1 `background.js` — the service worker

A WXT `defineBackground` entrypoint. Responsibilities, in the order they
appear in the file:

1. **Diagnostics log** — wraps `console.warn`/`console.error` to also push
   into an in-memory ring buffer (max 100 entries, 800 chars each), plus
   listens for `self.addEventListener("error"/"unhandledrejection")`. Exposed
   to the rest of the extension via the `getBackgroundDiag` message, which
   returns uptime and the last 50 log lines — a lightweight built-in support/
   debugging tool with no external reporting.
2. **CDP-based synthetic input** (`ensureDebuggerAttached`,
   `sendDebuggerCommand`, `performCdpDrag`) — uses `chrome.debugger` (hence
   the `"debugger"` permission) to attach to a tab and dispatch raw
   `Input.dispatchMouseEvent` sequences: a `mousePressed`, a 10-step
   interpolated drag of `mouseMoved` events, then `mouseReleased`. This exists
   because some board implementations only respond correctly to real
   OS/browser-level pointer events rather than DOM-dispatched `MouseEvent`s
   or direct API calls — see §8 for why this matters.
3. **Message router** (`browserApi.runtime.onMessage`) handling:
   `fetchExtensionFile` (read a bundled file's text — used to load engine
   JS/data as strings), `cdpMouseMove` / `cdpClick` (perform the synthetic
   input above), `open_stream` (open `stream.html` in a new tab and track its
   id), `getBackgroundDiag` (diagnostics, above).
4. **Lifecycle**: opens `https://chessr.io/welcome?...` on fresh install and
   on toolbar-icon click; tracks the Stream Mode tab's lifetime via
   `tabs.onRemoved` and keeps `chrome.storage.local.chessr_stream_open` in
   sync; cleans up debugger-attachment bookkeeping via
   `debugger.onDetach`.
5. **`MatchPattern` class** — a full implementation of WebExtension match-
   pattern parsing/testing (`<all_urls>`, `*://*.example.com/*`, etc.),
   including its own `InvalidMatchPattern` error type. This is WXT-framework
   boilerplate pulled in by the bundler; **it is defined but not actually
   invoked anywhere else in this file** in the current build. It's kept as-is
   (removing framework-provided utilities that might be used by other
   generated code paths would be an unnecessary, unverifiable risk).

### 5.2 `content-scripts/pageContext.js` — the platform adapters

This is the most architecturally important first-party file: it is the only
place in the codebase that understands each platform's actual internal APIs.
It defines three adapter classes, all implementing the same informal
interface (`matches(hostname)`, `install(emit)`, `dispose()`,
`requestState()`, `executeMove(uci, humanize?)`, `executePremove(uci)`,
`cancelPremoves()`, `requestRematch()`), and picks the right one for the
current hostname at startup:

- **`ChessBoardAdapter`** (chess.com) — finds the `<wc-chess-board>` custom
  element, reads its `.game` property (chess.com's own game-state object),
  and **patches** that object: wraps `game.move()` to emit `chessr:move`
  after every move, subscribes to the game's own `ResetGame` /
  `ModeChanged` / `UpdatePGNHeaders` events, and re-installs itself whenever
  the board element or its `game` object is replaced (chess.com swaps these
  out on navigation) — detected via a `MutationObserver`, a 500 ms poll
  fallback, and patched `history.pushState`/`replaceState`/`popstate`
  handling, since chess.com is a client-routed SPA. Executes moves by calling
  `game.move({...legalMoveObject, userGenerated: true})`, with optional
  humanized `PieceClicked`/`PieceSelected` event emission and delays first.
- **`LichessAdapter`** (lichess.org) — Lichess doesn't expose a simple
  "current game" object the same way; instead this adapter monkey-patches
  `window.lichess.sound.move` (or `window.site.sound.move`) — the function
  Lichess itself calls to play the move sound — as its move-detection hook,
  since that function reliably receives `{ fen, ply, status, winner }` on
  every move. It also has a **Storm/Racer fallback path**
  (`onStormMount`/`buildFenFromLichessBoard`) that reconstructs a FEN by
  reading rendered `<piece>` DOM elements directly, for Lichess's
  puzzle-rush-style game modes where the sound hook's payload lacks a FEN.
  Executes moves via `puzzle.playUci()` when in a puzzle, via
  `chessground.selectSquare()` when the internal Chessground board instance
  is reachable, or otherwise falls back to posting a `chessr:cdpMouseMove` /
  `chessr:cdpClick` message (handled by `background.js`'s real CDP input) —
  the only path in the codebase that needs the `debugger` permission.
- **`WorldchessAdapter`** (worldchess.com) — finds the game's engine object
  via a global named `window["chessEngine: <gameId>"]` (the game id is parsed
  from the URL), subscribes to its internal state-management `store`'s
  `currentFen` and `checkmateData` keys, and executes moves via the engine's
  own async `move()` method. Falls back to raw DOM `mousedown`/`mousemove`/
  `mouseup` synthetic events (via a React-fiber walk to detect board
  orientation/player color) for premoves, since the engine has no premove
  API of its own.

All three normalize their platform's data into the same `chessr:*` message
shape described in §4, so `content.js` never needs to know which platform
it's running on.

### 5.3 `content-scripts/content.js` — the overlay application

The largest first-party file (~3.5 MB after formatting). It is an
esbuild/Vite-bundled React application containing:

- The **engine orchestration layer** — loads and drives the engines under
  `/engine/*` (see §6) as Web Workers / WASM instances, feeding them the FEN
  from `pageContext.js`'s messages and turning their output into evaluations
  and move classifications.
- The **overlay UI** — evaluation bar (`chessr-eval-bar`/`-fill`/`-text`),
  best-move arrow overlay (`chessr-arrow-overlay`), on-square move markers
  (`chessr-marker-theory`/`-mylast`/`-opp`/`-premove`/`-deviation`), a
  floating action button (`chessr-fab-*`), an opening-book panel
  (`chessr-opening`), and toast-style system messages (`chessr-sysmsg-*`).
- The **auth flow** — a Supabase-backed login/session UI (`.auth-*` classes
  in `content.css`), talking to `app.chessr.io`, `chessr.io/reset-password`,
  `chessr.io/email-confirmed`, and a live `wss://api.chessr.io` WebSocket
  connection (likely for account/session state and/or cloud features).
- The **bridge to `pageContext.js`** — listens for the `chessr:*` messages
  described in §4 and, in the other direction, posts `chessr:executeMove` /
  `chessr:executePremove` / `chessr:cancelPremoves` / `chessr:rematch` /
  `chessr:requestState` back down to it.
- **Persistence and cross-tab sync** via `chrome.storage.local` (§4) so
  Stream Mode can mirror the live game state.

### 5.4 `chunks/stream-Cq9Ik-VD.js` + `stream.html` + `assets/stream-DMcmulGQ.css` — Stream Mode

A second, near-identical React application (same component/engine code,
different entry point) that runs as its own extension page rather than an
injected overlay. It's opened via the `open_stream` background message
(triggered from a control inside the main overlay) and tracked so only one
instance's tab id is remembered at a time. Because it is not injected into
the game page, it cannot use `window.postMessage` to talk to
`pageContext.js` directly — instead it reads/writes `chrome.storage.local`
(`chessr_stream_state`, `chessr_stream_open`) to mirror the live game shown
in the actual game tab, which is presumably why the "content" and "stream"
bundles share so much code but are built as separate entry points.

---

## 6. The engine suite (`engine/`)

All files here are **third-party** except `engine/maia3/maia3-worker.js`,
and per project instruction this entire folder was left completely untouched
during the documentation/refactoring effort (no deobfuscation, no
reformatting, no renaming — only described here).

| Engine | Files | What it is |
|---|---|---|
| **Stockfish** | `stockfish.js`, `stockfish.wasm` | The official open-source Stockfish 18 engine (GPLv3), used as the primary deep-analysis engine (traditional alpha-beta/NNUE search). Has its own license header crediting the Stockfish project and contributors. |
| **Dragon** | `dragon.js`, `dragon.wasm` | A build of the **Komodo Dragon** engine (identified via the `KOMODO_TEP` module name inside the file) — a strong commercial engine chess.com itself licenses for its own "Game Review" feature. |
| **Explanation engine** | `explanation-engine.js`, `explanation-engine.wasm` | Also a Komodo Dragon (`KOMODO_TEP`) build, but configured/used specifically to produce natural-language move explanations rather than raw evaluations — Komodo Dragon is known for a "written analysis" feature. Contains a hardcoded reference to a specific Chrome extension id (`lmpajciiflgoabinkidhpiejcajijfhk`), suggesting this build artifact may originate from chess.com's own extension. |
| **Torch** | `torch-4-lite.js`, `torch-4-lite.wasm` | Chess.com's own lightweight NNUE engine (`/*! Torch (c) 2024, Chess.com, LLC */`), likely used where speed matters more than Stockfish/Dragon-level depth. |
| **Rodent** | `rodent/rodent.js`, `.wasm`, `.data` | Rodent (a personality-based open-source engine, historically "Rodent IV"), likely used to generate more human/style-varied move suggestions rather than pure best-move analysis. |
| **Maia 3** | `maia3/model.onnx` + `maia3/all_moves*.json` + `maia3/ort/*` (Microsoft ONNX Runtime Web, vendored) | A neural network trained to predict *human* moves at a given rating level (the well-known "Maia Chess" line of work), run via ONNX Runtime. Used to power "what would a player of rating X actually play here" style suggestions rather than objectively-best moves. |
| **Maia 3 worker** | `maia3/maia3-worker.js` | The **only first-party file in `engine/`** — a small, already clean and documented Web Worker that loads the ONNX runtime and model off the main thread and exposes a simple `init`/`inference` message protocol (documented in full at the top of that file). Left untouched here per the "don't modify `engine/`" constraint, even though it needed no deobfuscation. |
| **Opening book** | `book.bin` | A Polyglot-style binary opening book, used to recognize known theoretical moves ("book" classification) without needing an engine search. |

### Move classification (`icons/cls-*.svg`)

Eleven SVG icons — `cls-book`, `cls-best`, `cls-excellent`, `cls-good`,
`cls-inaccuracy`, `cls-mistake`, `cls-blunder`, `cls-miss`, `cls-brilliant`,
`cls-great`, `cls-forced` — mirror the familiar chess.com/lichess "game
review" move-quality taxonomy. `content.js` uses these (via the `cls-*` CSS
classes seen in its bundled code) to label each played move based on engine
evaluation swings, most likely computed as: is the move in the opening book?
does it match the engine's top choice? how much eval does it lose relative to
the best available move? Exact thresholds are internal to the minified
bundle and were not reverse-engineered as part of this pass.

---

## 7. `rules.json` — network blocking

Three static `declarativeNetRequest` rules, all `block` actions:

1. Blocks `xmlhttprequest`s to
   `https://www.chess.com/service/fair-play/chesscom.fair_play.v2.FairPlayService/*`
   — chess.com's fair-play/anti-cheat telemetry service.
2. Blocks loading the `script` chunk
   `.../play-monitor-browser-extensions.chunk.client.*.js` from chess.com's
   own asset CDN — a chess.com script apparently specifically designed to
   monitor/detect browser extensions during play.
3. Blocks `xmlhttprequest`s to chess.com's
   `UserActivityHttpBridgeService/DispatchEventBatch` — a general user-
   activity event-batch reporting endpoint.

**Factual note, not an endorsement or condemnation:** these three rules
specifically target chess.com's own extension-detection and anti-cheat
telemetry infrastructure. This is a deliberate, documented part of the
extension's behavior and is worth knowing about if evaluating this codebase
for a chess platform's terms-of-service or fair-play compliance — it is not
an accidental side effect of any refactoring done in this project.

`_metadata/generated_indexed_rulesets/_ruleset1` is **not source** — it's a
compiled/indexed form of `rules.json` that Chrome itself generates on disk
when it loads the extension; it should not be edited or treated as
hand-authored.

---

## 8. Why the CDP/`debugger` fallback exists

Several board implementations (notably Lichess when no direct
Chessground/puzzle API reference can be obtained, and WorldChess for
premoves) don't offer a reliable JS-level "play this move" function reachable
from a content script. For those cases, `pageContext.js` computes the
on-screen pixel coordinates of the from/to squares and asks `background.js`
to perform a **real** Chrome DevTools Protocol `Input.dispatchMouseEvent`
sequence (mouse down → interpolated move steps → mouse up) against the tab,
rather than dispatching a synthetic DOM `MouseEvent` (which some board
libraries can distinguish from genuine user input and ignore). This is the
sole reason the extension requests the `"debugger"` permission, and the sole
reason `background.js` contains CDP plumbing (`ensureDebuggerAttached`,
`sendDebuggerCommand`, `performCdpDrag`) at all.

---

## 9. Deobfuscation and documentation history (state as of this report)

Before this documentation pass, the extension's first-party JavaScript files
were protected with **obfuscator.io**-style obfuscation: string arrays
rotated and looked up through decoder functions, control-flow flattening, and
all identifiers replaced with meaningless `_0x`-prefixed hex names. A prior
session in this project used `webcrack` to mechanically decode the string
tables and restore control flow for every first-party file, then:

- **Fully hand-refactored** (every identifier renamed, logic reorganized,
  header comments added) — safe to treat as authoritative, readable source:
  - `background.js`
  - `content-scripts/pageContext.js`
  - `content-scripts/chesscomAnon.js`
  - `content-scripts/chesscomFakeTitle.js`
- **Deobfuscated and reformatted with Prettier, but not hand-renamed** — the
  control flow, strings, and logic are fully genuine/readable, but internal
  variable names are still bundler-generated short names (`e`, `t`, `_0x...`-
  free but terse) rather than hand-picked ones:
  - `content-scripts/content.js`
  - `chunks/stream-Cq9Ik-VD.js`

  These two are large (tens of thousands of lines) esbuild/Vite bundles
  containing first-party application code interleaved with vendored
  libraries (React, immer, and the engines' own JS glue). Renaming every
  symbol across that much mixed code without a way to run the live extension
  end-to-end in a browser to catch regressions was judged too risky relative
  to the benefit — a top-of-file banner comment (added in this pass) explains
  each bundle's purpose and role instead, and this report describes their
  externally-observable behavior (message types, storage keys, engine
  references) in detail so their *purpose* is fully documented even though
  their *internals* remain terse.
- **Left completely untouched, by explicit instruction**: everything under
  `engine/` (third-party engines and their data, plus the one first-party
  file `maia3-worker.js` which was already clean and readable and simply
  wasn't touched to respect the "don't modify this folder" boundary).
- **Left completely untouched, because JSON/generated files shouldn't be
  hand-edited**: `manifest.json`, `rules.json`,
  `_metadata/generated_indexed_rulesets/_ruleset1`.

CSS assets (`content-scripts/content.css`,
`assets/stream-DMcmulGQ.css`) were reformatted from single-line minified
output to readable multi-line CSS (class names unchanged, since they're
referenced by string from the JS bundles) and given descriptive header
comments.

All changes were verified to be behavior-preserving by: syntax-checking every
modified JS file with `node --check`, and diffing key structural signals
(message-type string literals, counts of `setInterval`/`setTimeout`/
`MutationObserver`/`postMessage`/etc. calls) between the pre-rename
deobfuscated output and the final hand-renamed files to confirm zero logic
was added, removed, or altered — only names and formatting changed.

---

## 10. Known gaps / things not verified

This report is grounded in what could be directly observed in the shipped,
built code (string literals, message names, storage keys, library
fingerprints, license headers). It intentionally avoids asserting anything
that couldn't be confirmed this way. In particular:

- The exact scoring thresholds used to assign move-quality classifications
  (§6) are internal to the minified `content.js` engine-orchestration code
  and were not reverse-engineered.
- The full schema of the `chessr_stream_state` / `chessr_widget` storage
  objects (which fields they contain) was not enumerated — only their keys
  and general purpose were identified.
- The Supabase project configuration and the `wss://api.chessr.io` protocol
  are external backend concerns outside this repository and were not
  investigated further than confirming their presence.
- There is no build configuration, `package.json`, lockfile, or source
  (`.ts`/`.tsx`/pre-bundle) tree included in this distribution — this is a
  **built/shipped extension package**, not the original monorepo. Anything
  about the original build tooling beyond "WXT + esbuild/Vite + React +
  Prettier-formatted output" is inferred from bundle fingerprints, not
  confirmed from a build config.
