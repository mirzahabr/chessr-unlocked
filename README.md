# Chessr.io v3.3.2 — Reverse-Engineered & Unlocked

A fully deobfuscated, restructured copy of the Chessr.io Chrome extension (Manifest V3),
plus a modified build with the account system removed and every premium feature unlocked
by default. This repository contains **two parallel copies** of the extension — read
this before touching either one.

[![Latest release](https://img.shields.io/github/v/release/mirzahabr/chessr-unlocked?label=latest%20release)](https://github.com/mirzahabr/chessr-unlocked/releases/latest)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-blue)](chessr-unlocked-all-features/manifest.json)

---

## 📦 Which folder do I want?

| Folder | Purpose | Requires an account? | Edit this? |
|---|---|---|---|
| **[`chessr-unlocked-all-features/`](chessr-unlocked-all-features/)** | 🟢 The build to actually use — same functionality, auth removed, all premium features unlocked by default | No | Yes — this is where active development happens |
| **[`chessr-original-restored/`](chessr-original-restored/)** | Frozen reference baseline — structure restored (deobfuscated, reformatted) with **zero behavior changes** from the original shipped extension | Yes, same as the real Chessr.io | **No — read-only.** Diff against it, don't edit it |

If you just want to install and use the extension, go to
**[Releases](https://github.com/mirzahabr/chessr-unlocked/releases/latest)** and download
`chessr-unlocked-all-features-*.tar.gz`. You don't need to clone the repo for that.

---

## 🔓 What `chessr-unlocked-all-features` changes

- **No sign-in required** — a permanent premium session is set at startup; the login
  screen never appears.
- **Every engine unlocked** — Stockfish, Dragon/Komodo, Rodent IV (all 39 personalities),
  Maia 3, Torch, and the Explanation Engine are all available without restriction.
- **Full ELO range** — up to 3500, with the free-tier `limitStrength` cap removed.
- **Unlimited analysis** — search depth, node count, and move time are uncapped.
- **Stream Mode unlocked** — the same changes are mirrored in the separate Stream Mode
  bundle (`chunks/stream-Cq9Ik-VD.js`).

**Known limitation:** the AI move-explanation feature calls the real Chessr.io backend
with a genuine auth token and cannot work without a real account — it will show an
error. This is a server-side dependency, not a bug in this build. See
[`project-documentation/PROJECT_REPORT.md` §10.6](chessr-unlocked-all-features/project-documentation/PROJECT_REPORT.md)
in the unlocked build for the full explanation.

---

## 🧭 Repository structure

```
chessr v3.3.2/
├── README.md                          This file
├── chessr-original-restored/          Frozen, read-only baseline
│   ├── README.md                      Folder-specific notes
│   ├── manifest.json / rules.json     Chrome MV3 manifest + network rules
│   ├── background.js                  Service worker (hand-refactored, readable)
│   ├── content-scripts/               Overlay UI + platform adapters
│   ├── chunks/, assets/               Stream Mode bundle + styles
│   ├── engine/                        Bundled chess engines (Stockfish, Komodo, Rodent, Maia, Torch) — untouched, third-party
│   └── project-documentation/
│       └── PROJECT_REPORT.md          Full architecture write-up
└── chessr-unlocked-all-features/      Active development — same layout as above,
                                        with the account system removed and all
                                        premium features unlocked. Diff against
                                        chessr-original-restored/ to see exactly
                                        what changed and why.
```

Both folders share an identical file layout, so `diff -rq` between them (excluding
`engine/`, which is unmodified in both) is the fastest way to see the full set of
changes at a glance.

---

## 🚀 Installation (using the unlocked build)

1. Download `chessr-unlocked-all-features-*.tar.gz` from
   [Releases](https://github.com/mirzahabr/chessr-unlocked/releases/latest) and extract it
   — or clone this repo and use the `chessr-unlocked-all-features/` folder directly.
2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the extracted/cloned folder.
5. Open chess.com, lichess.org, or worldchess.com — the overlay activates automatically.

---

## 📚 Documentation

Each folder carries its own copy of `project-documentation/PROJECT_REPORT.md`, the
authoritative technical reference for this codebase. It covers, among other things:

- Full directory structure and per-file responsibilities
- Manifest permissions and the three-content-script wiring
- Message protocol between the MAIN-world and isolated-world scripts
- The engine suite (Stockfish, Dragon/Komodo, Rodent IV, Maia 3, Torch) and move
  classification
- **§9** — the deobfuscation methodology and what was hand-refactored vs.
  reformatted-only
- **§10** (unlocked build only) — the account system's original architecture, exactly
  what was removed/neutralized to unlock it, the bugs found and fixed along the way,
  and the one feature that cannot be unlocked client-side

Read the copy inside whichever folder you're working in — they diverge starting at
§10, since the original build never had an account system to remove.

---

## ⚠️ Disclaimer

This project is a reverse-engineering and modification exercise against a
commercial browser extension you must have legitimately obtained. It is provided
for research/educational purposes. You are responsible for complying with
Chessr.io's terms of service, and the terms of service of any chess platform you
use it on, in your own jurisdiction.
