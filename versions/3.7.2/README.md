# Chessr.io 3.7.2 — restored baseline + unlock patch

This folder holds upstream **Chessr.io 3.7.2** as a Chrome extension, plus the patch that
removes its account system from the client.

| Path | What it is |
|---|---|
| `chessr-original-restored/` | The shipped extension, deobfuscated and Prettier-formatted. Behaviour is unchanged. **Do not edit** — it is the diff baseline. |
| `patches/0000-unlocked.patch` | The unlock: a permanent local premium session, no login screen, every engine selectable, no link-account wall. |
| `build.json` | Identity of the build the series produces (`Chessr.io Unlocked`, `3.7.2.1`). |

## Install

```bash
bash scripts/build-unlocked.sh 3.7.2
```

Then `chrome://extensions` → Developer mode → **Load unpacked** →
`dist/chessr-unlocked-all-features-3.7.2`.

The build is also directly loadable as `chessr-original-restored/` if you want to see the
stock behaviour (it will ask you to sign in).

## What the patch changes

1. The auth store starts with a permanent local session and `plan: "premium"`.
2. `initialize()`, `fetchPlan()` and `signOut()` are stubbed — no Supabase session can
   replace or clear that state.
3. The premium predicate returns `true`, the free predicate returns `false`.
4. The engine predicate returns `true` for every engine.
5. The link-account action is stubbed, so the panel never blocks on "link your account".
6. `manifest.json` is renamed to `Chessr.io Unlocked` / `3.7.2.1` so both copies can be
   installed side by side.
7. The 3.4.0 local engines are spliced in and preferred over the server (see below).

Result, verified in a headless Chromium load test: the panel opens straight into the
analysis UI, badged **Premium**, with no sign-in form and no account wall.

## Local engines — added, not part of upstream 3.7.2

Upstream 3.7.2 removed every chess engine and moved analysis to `wss://api.chessr.io`. A
client-side unlock alone would therefore give you a login-free panel that never produces a
move. To avoid shipping that, this build grafts the 3.4.0 engine stack back in:

| Piece | What it is |
|---|---|
| `vendor/local-engines.js` | The Komodo/Dragon and Stockfish UCI engine classes from the 3.4.0 restoration (commit `04c57c6`), re-pointed at 3.7.2's chrome alias and result normaliser. Spliced into `content.js` by the patch. |
| `scripts/install-local-engines.sh` | Extracts `dragon.js`, `dragon.wasm`, `stockfish.js`, `stockfish.wasm` and `book.bin` from git history into the built `engine/` folder. 54 MB; deliberately not committed to the 3.7.2 tree. |
| `scripts/build-unlocked.sh` | Runs the installer by default. `--no-local-engines` produces the patched tree with no engines — suggestions then fall back to the server exactly as upstream does. |

The factory prefers a local engine when it initialises and falls back to the server when
the assets are missing, so both build flavours work.

**Two fixes were needed on top of the transplant**, both recorded in the vendor file:

- Komodo's `UCI Elo` was being set even when `limitStrength` was false, which clamped it to
  a depth-2 search. Strength options are now only touched when limiting was requested.
- 3.4.0 emitted Stockfish scores in pawns while Komodo emitted centipawns, and the UI
  divides by 100; Stockfish now emits centipawns too.

Measured in headless Chromium on the start position, depth 15, MultiPV 3:

| Engine | Time | Result |
|---|---|---|
| Komodo | 262 ms | e2e4 +0.58, g1f3 +0.41, d2d4 +0.29 |
| Stockfish | 214 ms | e2e4 +0.31, g1f3 +0.21, d2d4 +0.21 |

## What still needs the server

- Maia 3, Rodent IV, Leela and the server-side personalities — their drivers are not in
  3.7.2 and were not transplanted; selecting them falls back to the server engine.
- Game Review (`chesscom_review`) — streamed from Chessr's backend.
- AI move explanations beyond the 50/day quota.
- Feature flags, region gating and the update gate still come from the server.

This is a design change upstream, not a defect in the patch; the graft is a deliberate
departure from a faithful restore.

## Known upstream quirks (kept as-is)

- The sign-in screen's logo points at `/icons/x9110e26d-logo.png`, a build-namespaced file
  that the package does not contain; that image 404s.
- `stream.html` loads the Stream Mode bundle as an ES module; the bundle does parse as a
  module (checked), but any future deobfuscation artifact that creates an implicit global
  will break it.

See [`PROJECT_REPORT.md`](chessr-original-restored/project-documentation/PROJECT_REPORT.md)
for the full technical write-up.
