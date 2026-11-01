# Chessr.io v3.4.0

Current version. A fully deobfuscated, restructured copy of the Chessr.io Chrome
extension (Manifest V3), plus a build with the account system removed and every premium
feature unlocked.

| Folder | Purpose | Account required? | Edit it? |
|---|---|---|---|
| [`chessr-unlocked-all-features/`](chessr-unlocked-all-features/) | 🟢 Install this one — auth removed, all premium features unlocked | No | **Yes** — active development |
| [`chessr-original-restored/`](chessr-original-restored/) | Frozen reference baseline, zero behavior changes from the shipped extension | Yes | **No** — read-only, diff against it |

## What the unlocked build changes

- **No sign-in** — a permanent premium session is installed at startup; the login screen
  never appears.
- **Every engine unlocked** — Stockfish, Dragon/Komodo, Rodent IV (all 39 personalities),
  Maia 3, Torch, and the Explanation Engine, with no plan-based restriction.
- **Full ELO range** — up to 3500, with the free-tier `limitStrength` cap removed.
- **Unlimited analysis** — search depth, node count, and move time are uncapped.
- **Stream Mode unlocked** — mirrored in the separate Stream Mode bundle
  (`chunks/stream-CcAo12Z7.js`).
- **New upstream upsell suppressed** — the "price increase" banner introduced in v3.4.0
  (`FreeUpgradeModal` / `PriceIncreasePlans`) is gated by the same `isFree` predicate as
  every other upgrade prompt, so no additional modification was needed.

**Known limitation:** the AI move-explanation feature calls the real Chessr.io backend
with a genuine auth token and cannot work without a real account — it will show an error.
This is a server-side dependency, not a defect in this build. See
[`PROJECT_REPORT.md` §10.6](chessr-unlocked-all-features/project-documentation/PROJECT_REPORT.md).

## Installation

1. Open `chrome://extensions/` in Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select `chessr-unlocked-all-features/`.
4. Open chess.com, lichess.org, or worldchess.com — the overlay activates automatically.

Or download `chessr-unlocked-all-features-*.tar.gz` from
[Releases](https://github.com/mirzahabr/chessr-unlocked/releases/latest) and load the
extracted folder.

## Documentation

| Document | Content |
|---|---|
| [`PROJECT_REPORT.md`](chessr-original-restored/project-documentation/PROJECT_REPORT.md) | Authoritative technical reference for this version: architecture, manifest wiring, data flow, engines, deobfuscation methodology, and **§9.1 What's New vs v3.3.2** |
| [`PROJECT_REPORT.md` (unlocked)](chessr-unlocked-all-features/project-documentation/PROJECT_REPORT.md) | The same, plus **§10** — the account system's architecture and exactly what was removed to unlock it |
| [`../../docs/code-map.md`](../../docs/code-map.md) | What each file in a build does |
| [`../../docs/repository-layout.md`](../../docs/repository-layout.md) | Repository conventions and release packaging |

The two reports are identical through §9 and diverge at §10, because the restored build
never had an account system to remove.

Cross-version knowledge (what changed between versions, every applied unlock with its
anchors and evidence) lives in
[`../../knowledge-base/`](../../knowledge-base/README.md). The previous version is
[`../3.3.2/`](../3.3.2/README.md).

---

## Disclaimer

> ⚠️ **Use at your own risk.**

This is an unofficial, reverse-engineered modification, not affiliated with or supported
by Chessr.io. Using it in live games modifies what chess.com / lichess.org / worldchess.com
see and breaks their terms of service — **your accounts can be banned**. There is no
warranty and no support, and account/cloud sync is stubbed out, so settings live only in
`chrome.storage.local`.

The full wording is in the [repository README's Disclaimer](../../README.md#disclaimer).
This project is a reverse-engineering and modification exercise against a commercial
browser extension you must have legitimately obtained, provided for research/educational
purposes. You are responsible for complying with Chessr.io's terms of service and with the
terms of service of any chess platform you use it on, in your jurisdiction.
