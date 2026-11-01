# Chessr.io — Reverse-Engineered Extension Repository

Deobfuscated, restructured copies of the **Chessr.io** Chrome extension (Manifest V3),
plus a modified build with the account system removed and every premium feature unlocked.

Every version is kept as **two parallel builds**:

| Build | Purpose | Account required? | Edit it? |
|---|---|---|---|
| [`chessr-unlocked-all-features/`](versions/3.4.0/chessr-unlocked-all-features/) | 🟢 Install this one — auth removed, all engines and limits unlocked | No | **Yes** — active development happens here |
| [`chessr-original-restored/`](versions/3.4.0/chessr-original-restored/) | Frozen reference baseline — deobfuscated and reformatted with **zero behavior changes** | Yes | **No** — diff against it, never edit |

[![Latest release](https://img.shields.io/github/v/release/mirzahabr/chessr-unlocked?label=latest%20release)](https://github.com/mirzahabr/chessr-unlocked/releases/latest)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-blue)](versions/3.4.0/chessr-unlocked-all-features/manifest.json)

---

## Versions

| Version | Status | Unlocked build | Technical report |
|---|---|---|---|
| **3.4.0** | 🟢 Current | [`versions/3.4.0/chessr-unlocked-all-features/`](versions/3.4.0/chessr-unlocked-all-features/) | [PROJECT_REPORT.md](versions/3.4.0/chessr-unlocked-all-features/project-documentation/PROJECT_REPORT.md) |
| 3.3.2 | 🗄 Previous — kept as the diff baseline for 3.4.0 | [`versions/3.3.2/chessr-unlocked-all-features/`](versions/3.3.2/chessr-unlocked-all-features/) | [PROJECT_REPORT.md](versions/3.3.2/chessr-unlocked-all-features/project-documentation/PROJECT_REPORT.md) |

Each version folder has its own [`README.md`](versions/3.4.0/README.md) with the install
notes, the list of what was unlocked, and the known limitation that applies to it.

---

## What the unlocked build changes

- **No sign-in** — a permanent premium session is installed at startup; the login screen
  never appears.
- **Every engine available** — Stockfish, Dragon/Komodo, Rodent IV (all 39 personalities),
  Maia 3, Torch, and the Explanation Engine, with no plan-based restriction.
- **Full ELO range** (up to 3500) and **uncapped analysis** — search depth, node count,
  and move time are no longer limited by the free tier.
- **Stream Mode unlocked** — the same changes are mirrored in the separate Stream Mode
  bundle.

**Known limitation:** the AI move-explanation feature calls the real Chessr.io backend
with a genuine auth token and cannot work without a real account. This is a server-side
dependency, not a defect in this build.

---

## Quick start

```bash
git clone https://github.com/mirzahabr/chessr-unlocked.git
```

1. Open `chrome://extensions/` in Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select `versions/3.4.0/chessr-unlocked-all-features/`.
4. Open chess.com, lichess.org, or worldchess.com — the overlay activates automatically.

> ⚠️ **Use at your own risk.** This is not an official build and it is not supported by
> Chessr.io or by any chess platform. Using it in live games can get your accounts
> banned — read the [Disclaimer](#disclaimer) before you install it.

Prefer a packaged copy? Download `chessr-unlocked-all-features-*.tar.gz` from
[Releases](https://github.com/mirzahabr/chessr-unlocked/releases/latest) and load the
extracted folder — cloning is not required for that.

---

## Repository layout

```
Chessr/
├── README.md                        Project index (this file)
├── .gitignore / .gitattributes      Repo hygiene (OS junk, binaries, release archives)
│
├── docs/                            Documentation about the repository itself
│   ├── README.md                    Documentation index
│   ├── repository-layout.md         Structure, conventions, release packaging
│   └── code-map.md                  What every file inside a build does
│
├── knowledge-base/                  Cross-version knowledge — canonical, curated
│   ├── README.md                    Index and maintenance rules
│   ├── architecture.md … ui.md      Per-subsystem notes (fenced auto-generated regions)
│   ├── signatures/<version>.json    Extracted structural fingerprints
│   ├── learning-log/<version>.md    What each version taught us
│   ├── unlock-manifest.json         Every applied unlock, with anchors + evidence
│   └── re-config.json / repo-meta.json / .regions.json
│
└── versions/
    ├── 3.3.2/
    │   ├── README.md
    │   ├── chessr-original-restored/
    │   └── chessr-unlocked-all-features/
    └── 3.4.0/
        ├── README.md
        ├── chessr-original-restored/
        └── chessr-unlocked-all-features/
```

Build folders contain **only what the browser loads** plus a `project-documentation/`
report. Repository-level documentation lives in `docs/` and `knowledge-base/`, never
inside a build.

---

## Documentation

| Document | Answers |
|---|---|
| [`docs/repository-layout.md`](docs/repository-layout.md) | How the repo is organised, naming rules, how to add a version, how releases are packaged |
| [`docs/code-map.md`](docs/code-map.md) | What each folder/file in a build is for |
| [`knowledge-base/README.md`](knowledge-base/README.md) | What we know about the extension across versions, and how that knowledge is maintained |
| [`versions/<v>/…/project-documentation/PROJECT_REPORT.md`](versions/3.4.0/chessr-original-restored/project-documentation/PROJECT_REPORT.md) | Authoritative per-version technical reference (architecture, wiring, deobfuscation history, unlocks) |

---

## Working on the repository

- **Never edit `chessr-original-restored/`.** It is the behavior-preserving baseline;
  every difference in the unlocked build must be explainable as a diff against it.
- **Never edit `engine/`.** It is third-party code, byte-identical to the shipped build.
- **Keep documentation out of builds.** Add repository notes to `docs/`; add
  product knowledge to `knowledge-base/`.
- **Validate before committing** — run the checklist in
  [`docs/repository-layout.md`](docs/repository-layout.md#validation-checklist-for-a-version).

---

## Disclaimer

> ⚠️ **Use at your own risk.**
>
> This is an unofficial, reverse-engineered modification of a commercial product. It is
> not affiliated with, endorsed by, or supported by Chessr.io or any chess platform.

Installing it means you accept that:

- **Your accounts can be banned.** The extension modifies what chess.com, lichess.org and
  worldchess.com see, in live games. That breaks their terms of service, and enforcement
  is entirely up to them. Rated accounts, paid memberships and titles can be lost.
- **There is no warranty and no support.** No guarantee that it works on your Chrome
  version, that an upstream update will not break it, or that an unlocked feature will
  keep working. Fixes arrive when they arrive.
- **Your local data is your problem.** The account/cloud sync path is stubbed out, so
  settings live in `chrome.storage.local` and disappear if the extension is removed.
- **You install it at your own risk.** The author is not liable for account loss, data
  loss, or any consequence of using this software.

The project is a reverse-engineering and modification exercise against a commercial
browser extension you must have legitimately obtained. It is provided for
research/educational purposes. You are responsible for complying with Chessr.io's terms
of service, and the terms of service of any chess platform you use it on, in your
jurisdiction.
