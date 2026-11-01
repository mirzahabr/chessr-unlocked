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

Result, verified in a headless Chromium load test: the panel opens straight into the
analysis UI, badged **Premium**, with no sign-in form and no account wall.

## What the patch cannot change

**The analysis is server-side in 3.7.2.** Chessr stopped shipping engines with the
extension: `suggestion_request`, `engine_eval_request`, `maia3_request`,
`analysis_request` and `chesscom_review` are sent over a sealed WebSocket to
`wss://api.chessr.io/ws` and computed there. Without a real subscription session the socket
authenticates as nobody, so:

- move suggestions, evaluations, Maia 3 and server-side personalities will not arrive;
- Game Review stays limited by the server's quota;
- AI move explanations (`/explain`, 50/day) stay limited.

The UI, the settings, the local board adapters, the overlay, anonymous mode and the fake
title still work — those are client-side. Treat the unlocked build as an **unauthenticated
UI unlock**, not as a working free analysis client. This is a design change upstream, not a
defect in the patch.

## Known upstream quirks (kept as-is)

- The sign-in screen's logo points at `/icons/x9110e26d-logo.png`, a build-namespaced file
  that the package does not contain; that image 404s.
- `stream.html` loads the Stream Mode bundle as an ES module; the bundle does parse as a
  module (checked), but any future deobfuscation artifact that creates an implicit global
  will break it.

See [`PROJECT_REPORT.md`](chessr-original-restored/project-documentation/PROJECT_REPORT.md)
for the full technical write-up.
