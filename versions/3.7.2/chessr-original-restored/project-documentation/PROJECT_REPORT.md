# Chessr.io browser extension — technical report (v3.7.2)

This report describes the Chessr.io Chrome extension as shipped in `chessr v3.7.2.zip`,
and the restoration in this repository. It is written to be self-contained: someone with
no memory of earlier versions — or of the sessions that produced this folder — should be
able to read it and understand what the extension is, how it is wired, what was changed to
restore it, and what the unlocked build can and cannot do.

The report lives in `project-documentation/` so it is never mistaken for part of the
shipped product and never packaged by a release.

---

## 1. What the extension is

Chessr.io is a Manifest V3 Chrome extension that overlays a chess-assistance panel on
**chess.com**, **lichess.org** and **worldchess.com**, plus a standalone "Stream Mode"
page hosted inside the extension itself. During a game it reads the board state from each
site's own page JavaScript and shows engine suggestions, evaluation, move classification
and an optional auto-move mode on top of the board.

The upstream product is account-based. A Supabase session establishes identity, a
`user_settings.plan` field decides premium features, and — new in 3.7.2 — the actual chess
analysis is performed by Chessr's own servers and streamed back over a sealed WebSocket.
The client no longer contains a chess engine.

### 1.1 What changed in 3.7.2 (versus 3.4.0, the last version this repository held)

| Area | 3.4.0 | 3.7.2 |
|---|---|---|
| Engines | Stockfish, Komodo/Dragon, Rodent IV, Maia 3, Torch, ONNX runtime — ~184 MB of vendored WASM/JS, run locally | **None shipped.** Only `engine/explanation-engine.wasm` (26 MB, AI move commentary) and `wasm/sealed_core_bg.wasm` (157 KB, protocol sealing) remain |
| Suggestions / evaluation | local engine worker | `suggestion_request`, `engine_eval_request`, `maia3_request`, `analysis_request` sent to `wss://api.chessr.io/ws` and answered by the server |
| Game Review | server endpoint | `chesscom_review` request over the same sealed socket |
| Transport | plain JSON over WebSocket | per-connection key exchange (`kex`) through the Rust `sealed_core` module, then `{d: <sealed>}` frames |
| Feature gating | plan + client predicates | plan + server `flags` / `gatedRegions` + per-response `dailyUsage` / `dailyLimit` / `isPremium` quota objects |
| Account linking | optional | the panel can block on a "link your account" screen when the site profile is not in `linked_accounts` |
| New screens | — | guidelines acceptance modal, region picker/server election, update-required gate, 8-language i18n |
| Size | ~190 MB per build | 32.6 MB unzipped, 40 entries |

The headline consequence is documented in §8: **on 3.7.2 the analysis itself is
server-side**, so a client-side unlock cannot reproduce the 3.4.0 outcome.

---

## 2. Package contents

```
manifest.json                     MV3 manifest, version 3.7.2
rules.json                        4 declarativeNetRequest block rules
background.js                     service worker (14 KB restored)
stream.html                       Stream Mode page (loads chunks/stream-*.js as a module)
content-scripts/content.js        main bundle — React UI, stores, WS client (2.6 MB raw)
content-scripts/pageContext.js    MAIN-world bridge — board adapters (64 KB raw)
content-scripts/chesscomAnon.js   MAIN-world chess.com username blurring
content-scripts/chesscomFakeTitle.js  MAIN-world fake FIDE title badge
content-scripts/content.css       overlay stylesheet (87 KB)
chunks/stream-l1H6Qjn3.js         Stream Mode bundle (2.2 MB raw)
assets/stream-CCn0dxZm.css        Stream Mode stylesheet
engine/explanation-engine.{js,wasm}   local AI commentary engine (26 MB wasm)
wasm/sealed_core_bg.wasm          Rust handshake/sealing module (wasm-bindgen, no JS glue
                                  file — the glue is inlined into content.js)
icons/                            app icons, move-classification SVGs, platform logos
```

Everything except the two large bundles and the four small scripts is byte-identical to
the upstream zip in the restored baseline.

### 2.1 Manifest facts

- Permissions: `storage`, `activeTab`, `declarativeNetRequest`, `debugger`.
- Host permissions: `*://chess.com/*`, `*://*.chess.com/*`, `*://lichess.org/*`,
  `*://*.lichess.org/*`, `*://worldchess.com/*`, `*://*.worldchess.com/*`,
  `*://app.chessr.io/*`.
- Content scripts: two chess.com-only MAIN-world scripts at `document_start`; the main
  isolated `content.js`; `pageContext.js` in the MAIN world at `document_start`.
- `web_accessible_resources`: `/icons/*`, `/engine/*`, `/wasm/*`, `/icons/cls-*.svg`, plus
  `content-scripts/content.css` with `use_dynamic_url`.
- CSP: `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'`.
- No `minimum_chrome_version` field in 3.7.2 (3.4.0 carried 111).

### 2.2 `rules.json`

Four unconditional block rules, all `xmlhttprequest`:

1. chess.com FairPlay service RPC.
2. chess.com `play-monitor-browser-extensions` chunk (extension detection).
3. chess.com batched UserActivity events.
4. `sentry.io` (the extension blocks the site's own error reporting on those hosts).

---

## 3. Architecture

```
 page (MAIN world)                      isolated world               extension tab
┌───────────────────────┐  window.postMessage  ┌──────────────────┐   ┌─────────────┐
│ pageContext.js        │◄────────────────────►│ content.js       │   │ stream.html │
│  chess.com / lichess  │  x9110e26d:<verb>    │  React overlay   │   │ (same store │
│  / worldchess adapters│                      │  zustand stores  │   │  code, own  │
└───────────────────────┘                      │  WS client       │   │  root)      │
                                               └────────┬─────────┘   └─────────────┘
                                                        │ sealed WS (JSON)
                                                        ▼
                                             wss://api.chessr.io/ws?userId=…
```

- **Three adapters.** `_0x40bef4 = {chesscom, lichess, worldchess}` maps each hostname to a
  reader module (moves, FEN, clocks, ratings, game-over detection). `pageContext.js`
  installs them in the page and answers `requestState` / `rescan`.
- **Cross-world protocol.** `window.postMessage` with a build-namespaced prefix
  (`x9110e26d:`), 22 verbs: `requestState`, `rescan`, `move`, `newGame`, `gameOver`,
  `rematch`, `ratings`, `login`, `mode`, `open`, `toggle`, `setAnon`, `setTitle`,
  `initialMoves`, `executeMove`, `executePremove`, `cancelPremoves`, `cdpClick`,
  `cdpMouseMove`, `regions`, `dismissed`. The prefix is randomized per build; it also
  namespaces every CSS class (`x9110e26d-panel`, `x9110e26d-fab`, …), so the overlay cannot
  collide with the host page — and site CSS cannot target it by a stable name.
- **State.** A small zustand-style factory (`_0x1ee5e6`) creates the stores: auth/store
  (`user`, `session`, `plan`, `flags`, `gatedRegions`), engine/settings, board/game,
  accounts, Discord membership, version gate, review/quota, explanation cache, UI layout.
  Persistence is `chrome.storage.local` (`chessr-auth`, `chessr-profile-id`,
  `chessr-pending-confirm-email`) plus the site's `localStorage` for layout.
- **UI.** React with the automatic JSX runtime (`jsx`/`jsxs` calls after restoration),
  GSAP for panel transitions, custom i18n with 8 locales (en, es, pt, ru, fr, de, it, tr).
- **Background worker.** Five message types: `fetchExtensionFile` (serves
  `engine/explanation-engine.js` to the worker), `cdpMouseMove`, `cdpClick` (DevTools
  Protocol synthetic input for auto-move), `open_stream`, `getBackgroundDiag`. It keeps a
  100-entry console ring buffer and installs `error`/`unhandledrejection` listeners.

---

## 4. Accounts, plans and gating

- Supabase project `ratngdlkcvyfdmidtenx.supabase.co`; the anon JWT is inlined in the
  bundle (public by design, expiry 2036).
- Plan values: `free`, `premium`, `lifetime`, `beta`, `freetrial`. The premium predicate
  is a `Set` membership test over the last four; a second predicate marks
  `plan === "free"` as the limited tier.
- `fetchPlan` reads `user_settings(plan, plan_expiry, freetrial_used, freetrial_ended_at,
  guidelines_accepted_at)`; an expired `freetrial` is demoted to `free` client-side.
- Server feature flags: `GET <api>/flags` with a Bearer token returns
  `{flags: string[], gatedRegions: string[]}`; the store keys off both. Region election
  (`chessrRegionElection`) picks the lowest-latency WebSocket region.
- Version gate: `GET <api>/health` → `minExtensionVersion`; a lower local version renders
  an "update required" screen and never initialises auth.
- Guidelines: a modal blocks the panel until the user accepts, then
  `POST <api>/guidelines/accept`.
- Account linking: the panel compares the profile of the current site tab against
  `linked_accounts`; a mismatch shows the "link your account" screen, which calls
  `POST <api>/accounts/link`, `/accounts/unlink`, `/accounts/resolve`.
- Signup: `POST <api>/check-signup` with a FingerprintJS visitor id (loaded from
  `m1.openfpcdn.io`) guards against banned/disposable addresses.

---

## 5. The analysis pipeline (3.7.2)

1. `pageContext.js` reads the board on every mutation and posts `move` / `newGame` /
   `gameOver` to the isolated world.
2. The overlay builds a `suggestion_request` (engine id, FEN, move list, multiPv, target
   ELO, personality, limit-strength, variety, dynamism, king safety, search mode/nodes/
   depth/movetime) and enqueues it on the WebSocket.
3. On open, the client generates a handshake with `sealed_core` (`handshake_start`), the
   server answers `kex`, the client verifies with `handshake_finish` (a rejected identity
   closes the socket with code 4007), and every subsequent frame is
   `{d: sealed_core.seal(json)}`. Replies arrive `{d: sealed_core.open(...)}`.
4. Messages are queued until an `auth_ok` frame arrives; the client sends
   `{type:"auth", token}` with the Supabase access token, and on `unauthenticated` it
   re-sends auth.
5. Replies: `suggestion_progress` / `suggestion_result` / `suggestion_log_end`,
   `engine_eval_*`, `maia3_*`, `analysis_*`, `chesscom_review_progress` /
   `chesscom_review_result` / `chesscom_review_cache_miss`.
6. Review replies carry the quota object (`dailyUsage`, `dailyLimit`, `isPremium`) that
   drives the "Daily limit reached" / "Upgrade to premium" UI.

**Because the server produces the analysis, the client cannot fake it.** A build without a
valid subscription session can render the whole UI, but suggestions arrive only if the
server answers them.

Local analysis that does remain:

- `engine/explanation-engine.wasm` — natural-language move explanations, called with the
  same auth token against `<api>/explain`; capped at 50/day (`dailyLimit` default 50).
- Opening book lookups: `GET https://opens.chessr.io/game?moves=…` (3 s timeout).
- Player ratings: `api.chess.com`, `lichess.org/api`, `api.worldchess.com`.

---

## 6. Stream Mode

`stream.html` is a minimal page with `#app`, a Google Fonts link and
`<script type="module" src="/chunks/stream-l1H6Qjn3.js">`. The bundle is the same
application code compiled for a second entrypoint; it renders the panel full-page for
capture in OBS and shares the same auth/plan stores.

Two packaging details matter:

- The script tag is `type="module"`, i.e. strict mode. Any deobfuscation artifact that
  leaves an implicit global will crash the module at load (this is exactly the failure
  that broke Stream Mode in 3.4.0; see §9).
- The bundle references the build namespace for CSS classes and for the panel host, so it
  must be loaded as a module from the extension origin, not inlined.

---

## 7. Permissions, privacy and endpoints

| Endpoint | Purpose | Present in unlocked build |
|---|---|---|
| `https://ratngdlkcvyfdmidtenx.supabase.co` | auth, `user_settings`, `linked_accounts` | reachable; no session is created |
| `wss://api.chessr.io/ws` | analysis, review, flags handshake | reachable; no valid token |
| `https://api.chessr.io/*` | `/health`, `/flags`, `/check-signup`, `/accounts/*`, `/guidelines/accept`, `/explain` | reachable |
| `https://opens.chessr.io/game` | opening-book lookups | reachable |
| `https://m1.openfpcdn.io/fingerprintjs/*` | signup fingerprinting | only on signup, which the unlock makes unreachable |
| `https://download.chessr.io/` | update link in the "update required" screen | only if the gate triggers |
| `sentry.io` | blocked by `rules.json` | blocked |

The `debugger` permission is used for `cdpClick`/`cdpMouseMove`: when the site rejects a
synthetic click, the extension drives real CDP mouse events in the tab. `activeTab` is
sufficient because the panel only runs where the user is already active.

---

## 8. The unlocked build (what the patch does and does not change)

`versions/3.7.2/patches/0000-unlocked.patch` is generated by
`scripts/unlock-3.7.2.py` and touches exactly two files. It:

1. replaces the auth store's initial state with a permanent local session
   (`id: "anon"`, `plan: "premium"`, `guidelinesAcceptedAt: new Date(0)`,
   `planLoading: false`, `initializing: false`);
2. stubs `initialize()`, `fetchPlan()` and `signOut()` so no Supabase session can replace
   or clear that state;
3. makes the premium predicate return `true` and the free predicate return `false`;
4. makes the engine-availability predicate return `true` for every engine id;
5. stubs the link-account action so the panel never blocks on "link your account".

What this achieves: **no login screen, premium UI state, every engine selectable, full ELO
range (3500), no upgrade prompts, no link-account wall.**

What it cannot achieve: **analysis**. Suggestions, evaluations, Maia 3, server-side
personalities and Game Review are produced by `api.chessr.io` for an authenticated
subscriber. With no real session the socket authenticates as nobody, and the server
decides what (if anything) to answer. The same applies to AI move explanations and to the
`dailyLimit` quota shown in the review screen.

This is a deliberate property of 3.7.2's design, not a defect in the patch, and it is the
main thing to understand before installing the build.

### 8.1 Local engines spliced back in (forced measure)

Because a build that cannot analyse is of little use, this repository departs from a
faithful restore: the unlocked build grafts the 3.4.0 UCI engines back in.

- `versions/3.7.2/vendor/local-engines.js` holds the Komodo/Dragon, Stockfish and Maia 3
  engine classes transplanted from the 3.4.0 restoration (commit `04c57c6`), generated by
  `scripts/make-local-engines.py`. Three external references are re-pointed: the 3.4.0
  chrome alias becomes `_0x4313f9`, the 3.4.0 result normaliser becomes `_0x18aa03`, and
  the 3.4.0 chess.js class becomes `_0x14c2df` (3.7.2's equivalent). Everything else in the
  block is self-contained.
- The patch inserts that block before the `ServerEngine` class and rewrites the factory
  `_0xa804b4` to try `new LocalEngine()` first, falling back to the server adapter if
  `init()` throws — which is what happens when the engine assets are not installed.
- `scripts/install-local-engines.sh` copies `dragon.js/.wasm`, `stockfish.js/.wasm`,
  `book.bin` and the `maia3/` folder (ONNX model 45 MB + runtime 12 MB) out of git history
  into the built `engine/` folder — about 110 MB. They are not committed to the 3.7.2
  tree; the 3.4.0 blobs are already in git.

Rodent IV was transplanted and tested too, then deliberately dropped: its wasm build answers
the UCI banner and then stops consuming stdin, so `setoption`/`isready` never get a reply and
a second `uci` is ignored — `init()` would hang forever. Leela never had a local driver; it
was served by the node backend even in 3.4.0.

Two transplant defects were found and fixed during verification:

1. The option builder set `UCI Elo` even when `limitStrength` was false. Komodo honours it
   regardless and clamped the search to depth 2. Strength options are now only touched when
   limiting is requested, and `Skill Level` is pinned to 20 for full strength.
2. 3.4.0's Stockfish parser returned pawns (`cp / 100`) while Komodo returned centipawns,
   and the UI divides by 100. Stockfish is normalised to centipawns here.
3. Both UCI engines keyed `activeResults` by move, so a re-reported best move produced two
   "MultiPV 1" rows; they now key by MultiPV.

Measured in headless Chromium, start position, `go depth 14`, MultiPV 3:

| Engine | Init | Search | Suggestions |
|---|---|---|---|
| Komodo | 193 ms | 167 ms | e2e4 +0.54, d2d4 +0.28, g1f3 +0.28 |
| Stockfish | 239 ms | 142 ms | e2e4 +0.42, e2e3 +0.20, g1f3 +0.19 |
| Maia 3 | 402 ms | 82 ms | e2e4, d2d4, c2c4 (probabilities, position eval +0.14) |

Not covered: Rodent IV and Leela (see above), the server-side personalities, Game Review,
and the explanation-engine quota.

---

## 9. Restoration notes (fidelity)

Pipeline: `webcrack@2.16.0` (`--no-jsx`, deobfuscate + unminify + unpack) → Prettier 3.4.2
(`--parser babel --print-width 80`). Identifiers are left as generated; only obfuscator.io
artifacts were removed.

- String arrays: decoded and inlined (79 035 + 74 143 transformations on the two bundles).
  No unresolved decoder calls remain; the single `_0x…(0x…)` looking match in `content.js`
  is a BigInt literal, not a call.
- Control flow: 3.7.2 is string-array obfuscated only. There are no `"3|1|0|2"` order
  strings and webcrack's control-flow passes made zero changes — unlike earlier builds.
- JSX: `--no-jsx` is mandatory. webcrack's JSX decompiler rewrites `jsx()` calls into
  `<div>` syntax, which is not valid in a plain `.js` content script. The first attempt
  produced unparseable bundles; the committed baseline is the `--no-jsx` output.
- Strict-mode hazard: the 3.4.0 restore turned `var f; if (…) f = function(){}` into a
  block-scoped `function f(){}`, which is an implicit global in sloppy mode but a
  ReferenceError in the module-loaded Stream Mode bundle. The 3.7.2 output was checked for
  the same pattern; no such construct survived (`node --check` on both bundles, plus a
  module-mode parse).
- Upstream quirk kept as-is: the auth screen requests `/icons/x9110e26d-logo.png`, a
  namespaced filename the package does not contain (the shipped icon is
  `icons/chessr-logo.png`), so that image 404s. It is the login screen the unlock removes,
  so it is documented rather than repaired.

### 9.1 Validation performed

- `node --check` on `content.js`, `chunks/stream-*.js`, `background.js`, `pageContext.js`,
  `chesscomAnon.js`, `chesscomFakeTitle.js`, `engine/explanation-engine.js` — all pass.
- The two bundles also parse as ES modules (`vm.SourceTextModule`), which is how
  `stream.html` loads its chunk.
- Structural counts (message verbs, storage keys, endpoints, `Set` of plan values) were
  re-derived from the restored files, not copied from the previous version's report.
- The patch applies cleanly to a pristine copy of the baseline and reproduces the build;
  `scripts/verify.py --only patches` checks this on every run.
- A headless-Chromium load test (extension loaded, page served under a mapped
  `www.chess.com` host) confirms the content script mounts the overlay host element; see
  `docs/verification.md` for the exact command and observed output.
- The transplanted local engines were driven directly in that harness: Komodo, Stockfish
  and Maia 3 all initialise and return legal multi-PV output (see §8.1).

---

## 10. Open questions

- Whether the 3.7.2 server serves unauthenticated `suggestion_request`s at all (free tier),
  and at what limits. Not probed: querying Chessr's production backend is outside this
  repository's policy.
- Whether `sealed_core` binds the handshake to a device fingerprint or only to the socket.
  The wasm exports are `handshake_start` / `handshake_finish` / `seal` / `open` / `free`;
  the Rust side is not analysed beyond call sites.
- What `gatedRegions` actually gates in practice once the server is reachable.
