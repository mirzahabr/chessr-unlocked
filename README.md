# Chessr.io — Reverse-Engineered Extension Repository

Restored copies of the **Chessr.io** Chrome extension (Manifest V3): obfuscator.io string
arrays and control flow are recovered and the code is Prettier-formatted, but identifiers
stay as the bundler generated them in the two large bundles. Plus a modified build with the
account system removed and every premium feature unlocked.

Every version is kept as **two parallel builds**:

| Build | Purpose | Account required? | Edit it? |
|---|---|---|---|
| [`chessr-unlocked-all-features/`](versions/3.4.0/chessr-unlocked-all-features/) | 🟢 Install this one — auth removed, all engines and limits unlocked | No | **Yes** — active development happens here |
| [`chessr-original-restored/`](versions/3.4.0/chessr-original-restored/) | Frozen reference baseline — restored and reformatted with **zero behavior changes** | Yes | **No** — diff against it, never edit |

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

## Permissions — and what the build actually does on the page

The extension asks for the heaviest permissions Manifest V3 offers. You should know what
each one is for before installing it.

| Permission | Why it is requested | What it means in practice |
|---|---|---|
| `storage` | overlay settings, widget layout, Stream Mode state | local only; cloud sync is stubbed out |
| `activeTab` | attaches to the tab you are looking at | no background browsing of your tabs |
| `declarativeNetRequest` + `rules.json` | blocks three chess.com requests: the **FairPlay service**, the **extension-detection monitor** (`play-monitor-browser-extensions`), and batched **UserActivity events** | the extension actively hides itself from chess.com's anti-cheat and extension detection. This is the part that breaks chess.com's rules most directly. |
| `debugger` | Chrome DevTools Protocol, used to send synthetic mouse moves/clicks when an injected click is not accepted by the page | can drive input inside the tab it is attached to |
| host permissions | `chess.com`, `lichess.org`, `worldchess.com`, `app.chessr.io` | reads and modifies the board and game state on those sites |
| `web_accessible_resources` | engine files, icons, `content.css` (`use_dynamic_url` on the CSS) | page scripts can load these resources |

`content-scripts/pageContext.js` runs in the page's **MAIN world**, i.e. with the same
privileges as the site's own JavaScript. `content.js` runs isolated and renders the
overlay.

## What leaves your browser

No telemetry is added by this build, but the upstream networking code is still inside the
bundles — removing the login screen does not remove the endpoints:

| Endpoint | Status in the unlocked build |
|---|---|
| `https://ratngdlkcvyfdmidtenx.supabase.co` | auth calls are stubbed; the Supabase client is still bundled |
| `wss://api.chessr.io` | Game Review WebSocket, connects with `userId=anon` |
| `/api/explain-move` | always fails without a real account |
| `fingerprint.com`, `m1.openfpcdn.io` | device-fingerprinting library is bundled (`FingerprintJS`) |
| `opens.chessr.io`, `download.chessr.io` | links used by the welcome/onboarding page |

All of the above appear in both `content-scripts/content.js` and the Stream Mode bundle —
removing the login screen did not remove the networking layer.

If you care what a third party can see, this is the list to review.

---

## Quick start

```bash
git clone https://github.com/mirzahabr/chessr-unlocked.git
```

The folder is named after the **upstream** version (`3.4.0`); the modified build reports
its own version (`3.4.0.1`), which is what `chrome://extensions/` shows.

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

## Troubleshooting

**The overlay does not appear.** Check, in order: Chromium **111 or newer** (`world:
"MAIN"` content scripts need it); the extension is enabled and not in error state on
`chrome://extensions/`; you are on one of the three supported sites; reload the page after
installing (content scripts only inject on load); the site's own layout may have changed
upstream and broken an adapter.

**Stream Mode (`stream.html`) opens blank.** This was a real bug in versions up to and
including `3.4.0`: the bundle was loaded with `type="module"`, and a deobfuscation
artifact made it throw `ReferenceError` under module strict mode. Fixed in `3.4.0.1` —
make sure `chrome://extensions/` shows that version, then reload the page.

**"Explain move" always errors.** Expected. That feature calls the real backend with a
genuine auth token; there is no server-side workaround from the client.

**My settings disappeared.** Account and cloud sync are stubbed out, so configuration
lives in `chrome.storage.local` under a per-extension ID. Removing or reinstalling the
extension clears it.

**Two extensions with the same name are installed.** Fixed in this revision: the unlocked
build is now named `Chessr.io Unlocked` with version `3.4.0.1`, so it is distinguishable
from the untouched `3.4.0` baseline.

**Everything is slow to clone.** The engines are ~184 MB per build and are duplicated on
purpose. Use a release archive instead of cloning.

## FAQ

**Will I get banned?** Possibly. The build blocks chess.com's FairPlay and
extension-detection requests (see [Permissions](#permissions--and-what-the-build-actually-does-on-the-page)),
which is exactly the behaviour those systems exist to catch. Lichess and worldchess have
their own rules. There is no safe account to test on.

**Is my data sent anywhere?** The endpoints above still exist in the bundle. Auth is
stubbed, so nothing account-related is submitted, but the fingerprinting library and the
Game Review WebSocket are still there.

**Do I need an account?** No. That is the whole point of this build.

**Does it work in Firefox / Safari?** No. It depends on Chromium MV3 features (MAIN-world
content scripts, `declarativeNetRequest`, CDP via `debugger`). Chrome and other
Chromium-based browsers, 111+.

**Why is the repository ~130 MB?** Six chess engines ship inside every build, and every
build has to stay self-contained to remain loadable. See
[`docs/repository-layout.md`](docs/repository-layout.md).

---

## Repository layout

```
Chessr/
├── README.md                        Project index (this file)
├── NOTICE.md                        Third-party components and their licence status
├── LICENSE                          No rights granted; scope of the notices
├── CHANGELOG.md                     What changed per version, and whether to reinstall
├── .gitignore / .gitattributes / .editorconfig
│                                    Repo hygiene (junk, binaries, LF everywhere)
├── .github/workflows/verify.yml     CI: runs the validation checklist below
├── scripts/                         Repo tooling (verify, region hashes, anchors)
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
| [`NOTICE.md`](NOTICE.md) | Which third-party components ship here, under what licence, and what is still unresolved |
| [`knowledge-base/README.md`](knowledge-base/README.md) | What we know about the extension across versions, and how that knowledge is maintained |
| [`versions/<v>/…/project-documentation/PROJECT_REPORT.md`](versions/3.4.0/chessr-original-restored/project-documentation/PROJECT_REPORT.md) | Authoritative per-version technical reference (architecture, wiring, deobfuscation history, unlocks) |

---

## Working on the repository

- **Do not change behaviour in `chessr-original-restored/`.** It is the behavior-preserving
  baseline; every difference in the unlocked build must be explainable as a diff against
  it. The one exception is a **restoration fix** — when the deobfuscation pass changed what
  the shipped build did (see
  [`docs/repository-layout.md` rule 2a](docs/repository-layout.md#2a-restoration-fixes-are-allowed-product-changes-are-not)).
  Record it in the report and the changelog; never add features there.
- **Never edit `engine/`.** It is third-party code, byte-identical to the shipped build.
- **Keep documentation out of builds.** Add repository notes to `docs/`; add
  product knowledge to `knowledge-base/`.
- **Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before sending a patch.**
- **Validate before committing** — run `python3 scripts/verify.py` (same checklist as
  [`docs/repository-layout.md`](docs/repository-layout.md#validation-checklist-for-a-version));
  CI runs it on every push and pull request.

---

## License status

- **The Chessr.io application code is not licensed to you.** It is proprietary and this
  repository grants no rights to it. Nothing here may be redistributed, sublicensed or
  sold.
- **The bundled engines are third-party.** Stockfish is GPL-3.0 and ships here without the
  GPL text or a source offer; Komodo Dragon is commercial; several other engines are
  unverified. [`NOTICE.md`](NOTICE.md) lists every file and what still has to be resolved.
- **There is no warranty of any kind**, express or implied, including fitness for a
  particular purpose.

[`LICENSE`](LICENSE) spells this out, and [`NOTICE.md`](NOTICE.md) is the file-by-file
inventory. Short version: no licence is granted for anything in this repository, and it is
a study archive rather than a distributable product.

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
