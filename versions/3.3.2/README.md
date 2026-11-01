# Chessr.io v3.3.2

Previous version, kept as the **diff baseline for v3.4.0**: every claim in the v3.4.0
report is validated against these builds. A deobfuscated, restructured copy of the
Chessr.io Chrome extension (Manifest V3), plus a build with the account system removed
and every premium feature unlocked.

| Folder | Purpose | Account required? | Edit it? |
|---|---|---|---|
| [`chessr-unlocked-all-features/`](chessr-unlocked-all-features/) | 🟢 The unlocked build for this version | No | **No** — frozen; develop against v3.4.0 |
| [`chessr-original-restored/`](chessr-original-restored/) | Frozen reference baseline, zero behavior changes from the shipped extension | Yes | **No** — read-only |

## What the unlocked build changes

- **No sign-in** — a permanent premium session is installed at startup; the login screen
  never appears.
- **Every engine unlocked** — Stockfish, Dragon/Komodo, Rodent IV (all 39 personalities),
  Maia 3, Torch, and the Explanation Engine, with no plan-based restriction.
- **Full ELO range** — up to 3500, with the free-tier `limitStrength` cap removed.
- **Unlimited analysis** — search depth, node count, and move time are uncapped.
- **Stream Mode unlocked** — mirrored in the separate Stream Mode bundle
  (`chunks/stream-Cq9Ik-VD.js`).

**Known limitation:** the AI move-explanation feature calls the real Chessr.io backend
with a genuine auth token and cannot work without a real account — it will show an error.
This is a server-side dependency, not a defect in this build. See
[`PROJECT_REPORT.md` §10.6](chessr-unlocked-all-features/project-documentation/PROJECT_REPORT.md).

## Installation

1. Open `chrome://extensions/` in Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select `chessr-unlocked-all-features/`.
4. Open chess.com, lichess.org, or worldchess.com — the overlay activates automatically.

## Documentation

| Document | Content |
|---|---|
| [`PROJECT_REPORT.md`](chessr-original-restored/project-documentation/PROJECT_REPORT.md) | Authoritative technical reference for this version |
| [`PROJECT_REPORT.md` (unlocked)](chessr-unlocked-all-features/project-documentation/PROJECT_REPORT.md) | The same, plus **§10** — what was removed/neutralized to unlock it |
| [`../../docs/code-map.md`](../../docs/code-map.md) | What each file in a build does |
| [`../../docs/repository-layout.md`](../../docs/repository-layout.md) | Repository conventions and release packaging |

Cross-version knowledge lives in [`../../knowledge-base/`](../../knowledge-base/README.md);
the next version is [`../3.4.0/`](../3.4.0/README.md).

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
