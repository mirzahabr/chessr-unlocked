# Changelog

Notable changes to the repository and to the unlocked build. The per-version technical
detail lives in `versions/<v>/…/PROJECT_REPORT.md`; this file answers "what changed and
should I reinstall?".

The extension version is `<upstream>.<patch>`, e.g. `3.7.2.1` — a modification of upstream
3.7.2. Tags are `v<version>-unlocked`.

## [3.7.2.1] — unreleased

Upstream 3.7.2 restored and unlocked; 3.3.2 and 3.4.0 removed from the tree (they remain in
git history). This is a rebuild around a version that changed architecture, not a
continuation of the 3.4.0 line — see the warning below.

### Changed — upstream, with consequences for the unlock
- **The engines left the package.** 3.7.2 ships no Stockfish, Komodo, Rodent, Maia 3, Torch
  or ONNX runtime. The only wasm left is the 26 MB AI-commentary engine and a 157 KB Rust
  `sealed_core` module. Total package: 32.6 MB instead of ~190 MB.
- **Analysis moved to `wss://api.chessr.io/ws`.** `suggestion_request`,
  `engine_eval_request`, `maia3_request`, `analysis_request` and `chesscom_review` are
  answered server-side. The socket runs a `sealed_core` key exchange (`kex` →
  `handshake_finish`, sealed `{d: …}` frames) before any of them are delivered.
- **Consequence:** the client-side unlock removes the login screen and every plan-based UI
  restriction, but it cannot produce analysis without a real subscription. The unlocked
  build is a UI unlock, and the README now says so at the top instead of in a footnote.

### Added — upstream, now documented
- Server feature flags (`GET /flags` → `flags`, `gatedRegions`) and region election with
  latency probing.
- Update gate (`GET /health` → `minExtensionVersion`) that renders before auth initialises.
- Account-linking flow (`linked_accounts`, `/accounts/link|unlink|resolve`) that can block
  the panel with a "link your account" screen.
- Guidelines acceptance modal (`/guidelines/accept`) and 8-language i18n (en, es, pt, ru,
  fr, de, it, tr).
- AI move explanations through the local `explanation-engine.wasm`, quota-limited
  (`dailyLimit` default 50).

### Added — repository
- `scripts/unlock-3.7.2.py`: the deterministic generator behind the patch. Six edits in
  content.js, two in the Stream bundle, one in `manifest.json`; every anchor must match
  exactly once or the run fails.
- `docs/verification.md`: the headless-Chromium procedure that loads both builds and reads
  the rendered panel over CDP.
- `knowledge-base/signatures/3.7.2.json`, `knowledge-base/learning-log/3.7.2.md`, and a
  rewritten `unlock-manifest.json` describing this version's eight unlocks.

### Changed — repository
- README rewritten around 3.7.2 and its server-side limitation; version table reduced to the
  single current version.
- `manifest.json` and `rules.json` in the baseline are pretty-printed (content unchanged).
- The unlocked manifest is `Chessr.io Unlocked` / `3.7.2.1`, so it installs alongside the
  stock build.

### Verified
- `node --check` on all seven JS files; both large bundles also parse as ES modules.
- Static unlock check: `python3 scripts/unlock-3.7.2.py --check dist/chessr-unlocked-all-features-3.7.2`.
- Headless Chromium: baseline shows the sign-in form; unlocked build shows the analysis
  panel badged Premium, no auth form. Console shows only the expected 401s and the upstream
  404 for the namespaced login logo.

## [3.4.0.1] — 2026-11 (removed from the tree)

Last build of the vendored-engine line. Superseded by 3.7.2.1 in this repository; the
source, patch and report remain in git history at the commit before the 3.7.2 rebuild.

## [3.4.0] — 2026-07-11

Upstream 3.4.0 restored and unlocked. Adds the "price increase" upsell upstream
(`FreeUpgradeModal`, `PriceIncreasePlans`, 12 i18n keys), gated by the same `isFree`
predicate and therefore needing no new unlock.

## [3.3.2] — 2026-07-08

First processed version: account system removed, premium session installed, engine and ELO
limits lifted, Stream Mode mirrored.
