# Code map — what is inside a build

Every version ships the same two builds with the same layout, so this map applies to
`versions/<v>/chessr-original-restored/` and `versions/<v>/chessr-unlocked-all-features/`
alike.

**The two builds differ in three ways, and only one of them is behavioral:**

| Kind | Examples | Where documented |
|---|---|---|
| Behavioral | account system stubbed out, plan gates removed, ELO and search limits lifted | that version's `PROJECT_REPORT.md` §10 |
| Cosmetic | 11 move-quality icons recolored `#81B64C` → `#3b83d9`; `content.css` and `assets/stream-*.css` tweaks | `PROJECT_REPORT.md` §10 "cosmetic deltas" |
| Metadata | the unlocked build has its own `name`/`short_name`/`version` (`Chessr.io Unlocked`, `3.4.0.1`) and `minimum_chrome_version` | that version's README |

Nothing else may differ: `engine/`, `rules.json` and the file layout must be identical, and
`scripts/verify.py` checks exactly that. A diff that fits none of the three categories is a
bug, not a variation.

For architecture, data flow, and message protocols, read the version's
`project-documentation/PROJECT_REPORT.md`. This page is the orientation map: what exists
and why, in one screen.

```
<build>/
├── manifest.json            Chrome MV3 manifest — the extension's entry point
├── rules.json               declarativeNetRequest static rules (network blocking)
├── stream.html              Host page for the standalone Stream Mode tab
├── background.js            Service worker
├── _metadata/               Chrome-generated cache of rules.json — NOT source, git-ignored
├── content-scripts/         Overlay UI + platform adapters (three execution worlds)
├── chunks/                  Stream Mode React bundle
├── assets/                  Stream Mode stylesheet
├── icons/                   Toolbar/store icons, move-quality icons, platform logos
├── engine/                  Bundled chess engines — THIRD-PARTY, NEVER MODIFIED
└── project-documentation/   PROJECT_REPORT.md (documentation only, never loaded)
```

## Root files

| File | Responsibility |
|---|---|
| `manifest.json` | Permissions (`storage`, `activeTab`, `declarativeNetRequest`, `debugger`), host permissions for the three platforms plus `app.chessr.io`, the three content-script entries, the Stream Mode page, and web-accessible resources. In the unlocked build the name, version (`<upstream>.1`) and `minimum_chrome_version` differ so the two installs stay distinguishable. |
| `rules.json` | `declarativeNetRequest` rules that block specific chess.com telemetry / anti-cheat requests. |
| `background.js` | Service worker: CDP synthetic mouse input, Stream Mode tab tracking, runtime message router, diagnostics log, welcome page. |
| `stream.html` | Hosts Stream Mode; its `<script src>` / `<link href>` point at the hashed bundle names below. The bundle is loaded as a **deferred classic script, not `type="module"`** — see the comment in the file for why. |

## `content-scripts/` — three execution worlds

| File | World | Responsibility |
|---|---|---|
| `pageContext.js` | MAIN, `document_start` | The three platform adapters (chess.com / lichess / worldchess). The only file that talks to each site's own game and board objects. |
| `content.js` | Isolated (default) | The React overlay application: engines, evaluation bar, arrows, markers, FAB, auth store, settings. Largest file in the extension. In the unlocked build the auth/plan/accounts/Discord stores are stubbed — see the report §10. |
| `content.css` | — | Stylesheet for everything `content.js` renders. |
| `chesscomAnon.js` | MAIN, `document_start` | Blurs on-page usernames ("anonymous mode"), chess.com only. |
| `chesscomFakeTitle.js` | MAIN, `document_start` | Injects a cosmetic fake FIDE title badge, chess.com only. |

`pageContext.js` and the two cosmetic scripts run in the page's own MAIN world — required
to see the sites' JavaScript globals. `content.js` runs isolated because it needs
`chrome.*` APIs. The two sides communicate over `window.postMessage` with
`chessr:*`-prefixed message types; the full vocabulary is in the report §4 and in
[`knowledge-base/messaging.md`](../knowledge-base/messaging.md).

## `chunks/` and `assets/` — Stream Mode

| File | Responsibility |
|---|---|
| `chunks/stream-<hash>.js` | Stream Mode's React app bundle (near-identical code to `content.js`, built as a separate entry point). |
| `assets/stream-<hash>.css` | Stream Mode's stylesheet. |

The hash suffix is content-derived and changes on every upstream build — read the current
name from `stream.html`'s `<script src>` / `<link href>` instead of hard-coding one.
Stream Mode runs as its own extension page rather than being injected into a game page,
so it syncs with the live game tab through `chrome.storage.local` rather than
`window.postMessage`. Every unlock applied to `content.js` is mirrored here (report §10.4).

## `icons/`

- `icon16.png` / `icon48.png` / `icon128.png` — toolbar and store icons.
- `chessr-logo.png` — branding, used in the auth UI.
- `cls-*.svg` (11 files) — one icon per move-quality classification: book, best,
  excellent, good, inaccuracy, mistake, blunder, miss, brilliant, great, forced.
- `platforms/` — chess.com / lichess / worldchess logos used in the UI.

## `engine/` — THIRD-PARTY, NEVER MODIFIED

Everything here is bundled third-party code, except `maia3/maia3-worker.js` (first-party
glue that is already clean and is left untouched). No deobfuscation, reformatting,
renaming, or unlock-related editing is ever performed here. It is a hard boundary in
every version and every validation script excludes it.

| Engine | Files | What it is |
|---|---|---|
| Stockfish | `stockfish.js` / `.wasm` | Official Stockfish (GPLv3), primary analysis engine. |
| Dragon | `dragon.js` / `.wasm` | Komodo Dragon (`KOMODO_TEP`), chess.com's "Game Review" engine. |
| Explanation engine | `explanation-engine.js` / `.wasm` | Another Komodo Dragon build, used for move explanations. |
| Torch | `torch-4-lite.js` / `.wasm` | Chess.com's lightweight NNUE engine. |
| Rodent | `rodent/` | Personality-based engine (39 personalities when unlocked). |
| Maia 3 | `maia3/` | Human-move-prediction net (ONNX Runtime) at a target rating, not "best move". |
| Opening book | `book.bin` | Polyglot-style opening book. |

Premium gating (ELO caps, personality restrictions, search budgets) happens entirely at
the UI/store layer in `content.js` and the Stream Mode bundle — never inside these files.

## `project-documentation/`

Documentation only, never bundled or loaded by the browser.

| File | Content |
|---|---|
| `PROJECT_REPORT.md` | The authoritative technical reference for that version: directory map, manifest wiring, data flow, components, engine suite, network rules, deobfuscation methodology, "what's new" vs the previous version, and (unlocked build) the full account-system removal write-up. |

It is the only documentation file allowed inside a build. Repository-level documentation
lives in [`docs/`](README.md); cross-version knowledge lives in
[`knowledge-base/`](../knowledge-base/README.md).
