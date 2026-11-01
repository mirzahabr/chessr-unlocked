# Chessr.io — reverse-engineered extension repository

Source-recovered copies of the **Chessr.io** Chrome extension (Manifest V3), plus a patched
build with the account system removed from the client. The current version is **3.7.2**;
earlier versions were removed from the tree when 3.7.2 was processed and remain in git
history.

- `versions/3.7.2/chessr-original-restored/` — the shipped extension with obfuscator.io
  string arrays decoded and the code Prettier-formatted. Behaviour unchanged; it is the
  reference baseline.
- `versions/3.7.2/patches/0000-unlocked.patch` — the unlock, as one reviewable diff.
- `scripts/build-unlocked.sh 3.7.2` — applies the series → `dist/chessr-unlocked-all-features-3.7.2/`,
  the folder you load.

Nothing here is affiliated with Chessr.io or with any chess platform.

---

## Read this first: 3.7.2 moved the analysis to the server

Through 3.4.0 the extension shipped ~184 MB of chess engines and computed everything
locally, which is why the previous unlock could genuinely deliver full-strength analysis
without an account.

**3.7.2 ships no engine.** The only wasm files left are the AI-commentary engine and a
157 KB Rust "sealed core" that seals the WebSocket protocol. Suggestions, evaluations,
Maia 3, server personalities and Game Review are computed by `wss://api.chessr.io` and sent
back over that socket. The client asks; the server answers.

So the unlocked build gives you:

- ✅ no login screen, permanent **Premium** UI state
- ✅ every engine selectable, full ELO range (400–3500), no upgrade prompts
- ✅ no "link your account" wall, no guidelines gate
- ✅ the overlay, board adapters, anonymous mode and fake title badge, unchanged

and it does not give you:

- ❌ move suggestions, evaluations or Game Review — those need a real subscription session
  on Chessr's server
- ❌ AI move explanations beyond the server's 50/day quota

Treat it as an unauthenticated **UI** unlock. This is much less than the 3.4.0 build
delivered, and the difference is upstream's design change, not a gap in the patch.

---

## Versions

| Version | Status | Unlock patch | Technical report |
|---|---|---|---|
| **3.7.2** | 🟢 Current — builds `3.7.2.1` | [`patches/0000-unlocked.patch`](versions/3.7.2/patches/0000-unlocked.patch) | [PROJECT_REPORT.md](versions/3.7.2/chessr-original-restored/project-documentation/PROJECT_REPORT.md) |

Each version folder has its own [`README.md`](versions/3.7.2/README.md) with install notes,
the list of unlocked behaviour and the limitations that apply to it.

---

## Quick start

```bash
bash scripts/build-unlocked.sh 3.7.2
```

Requires `bash` and `patch` (macOS, Linux, Git Bash). The build folder is named after the
upstream version (`3.7.2`); the extension reports its own version (`3.7.2.1`), which is what
`chrome://extensions/` shows.

1. Open `chrome://extensions/`, enable **Developer mode**.
2. **Load unpacked** → `dist/chessr-unlocked-all-features-3.7.2/`.
3. Open chess.com, lichess.org or worldchess.com; the floating button appears bottom-right.

To see the stock behaviour, load `versions/3.7.2/chessr-original-restored/` instead — it
asks you to sign in.

> **Risk.** This is an unofficial build. It blocks chess.com's FairPlay, extension-detection
> and UserActivity reporting (see [Permissions](#permissions)). Using chess assistance in
> live games breaks the rules of every platform it supports and can get accounts banned.
> There is no safe account to test on.

---

## Permissions

| Permission | Why it is requested | What it means |
|---|---|---|
| `storage` | overlay settings, widget layout, Stream Mode state | local only |
| `activeTab` | attaches to the tab you are on | no background tab access |
| `declarativeNetRequest` + `rules.json` | blocks chess.com's **FairPlay** service, the **extension-detection monitor**, batched **UserActivity** events, and `sentry.io` | the extension actively hides itself from chess.com anti-cheat |
| `debugger` | Chrome DevTools Protocol, used for synthetic mouse moves when a click is rejected | can drive input inside the attached tab |
| host permissions | chess.com, lichess.org, worldchess.com, app.chessr.io | reads and modifies board state on those sites |
| `web_accessible_resources` | engine files, icons, `content.css` (`use_dynamic_url`) | page scripts can load these resources |

`content-scripts/pageContext.js` and the two chess.com cosmetic scripts run in the page's
**MAIN** world; `content.js` runs isolated and renders the overlay in a shadow root.

## What leaves your browser

The upstream networking layer is intact — removing the login screen does not remove the
endpoints:

| Endpoint | Status in the unlocked build |
|---|---|
| `https://ratngdlkcvyfdmidtenx.supabase.co` | auth calls are never made (initialize is stubbed); the client is still bundled |
| `wss://api.chessr.io/ws` | connects and runs the sealed handshake; authenticates as nobody, so analysis answers are up to the server |
| `https://api.chessr.io` | `/health` version gate, `/flags`, `/accounts/*`, `/guidelines/accept`, `/explain` |
| `https://opens.chessr.io/game` | opening-book lookups |
| `https://m1.openfpcdn.io/fingerprintjs/*` | FingerprintJS, only used by signup — unreachable here |
| `https://download.chessr.io/` | update link in the "update required" screen |

Expect 401s in the console from requests made with the placeholder session. They are the
direct consequence of having no account, and the reason the panel works but analysis does
not.

---

## Validation

`scripts/verify.py` runs the repository checklist offline: JS syntax on every build, JSON
validity, relative links and heading anchors, unlock anchors against the baseline, patch
round-trip, schema versions, structural signatures, version/changelog agreement.

```bash
python3 scripts/verify.py            # full run
python3 scripts/verify.py --verbose  # plus warning detail
```

Beyond static checks, the baseline and build were loaded in headless Chromium and driven
over CDP: the baseline renders the sign-in form, the unlocked build renders the analysis
panel badged Premium with no auth form. See
[`docs/verification.md`](docs/verification.md) for the procedure and output.

---

## Troubleshooting

**The overlay does not appear.** Check that the extension is enabled, that you are on one of
the three supported sites, and reload the page after installing — content scripts only
inject on load. Chromium 111+ is required for MAIN-world content scripts.

**The panel says "Waiting for a game" forever.** Expected on a page with no recognisable
chess board, and expected whenever the site's DOM has changed upstream.

**Nothing appears in Suggestions.** Expected without a subscription: the server has no
authorised user to answer for. See the top of this file.

**Stream Mode opens blank.** `stream.html` loads its bundle as an ES module. The bundled copy
parses as a module; if you edit it, keep it strict-mode clean.

**Two extensions with the same name.** The unlocked build is named `Chessr.io Unlocked`
(`3.7.2.1`); the baseline keeps the upstream name (`3.7.2`), so they are distinguishable.

---

## Disclaimer

This is an unofficial, unsupported modification. It is not affiliated with, endorsed by, or
authorised by Chessr.io, chess.com, lichess.org or worldchess.com, and it gives no warranty
of any kind. The extension hides itself from platform anti-cheat, and using chess assistance
in live games breaks the rules of every platform it supports — accounts can be banned, and
the person doing it carries that risk. Nothing in this repository claims that redistribution
of the Chessr.io code is lawful; see [`NOTICE.md`](NOTICE.md).

---

## Repository layout

```
Chessr/
├── README.md                        Project index (this file)
├── CHANGELOG.md                     What changed, per build
├── NOTICE.md / LICENSE              Third-party components; no rights granted
├── docs/                            Documentation about the repository itself
│   ├── README.md                    Documentation index
│   ├── repository-layout.md         Structure, conventions, release packaging
│   ├── code-map.md                  What every file inside a build does
│   ├── verification.md              How the builds were smoke-tested
│   └── quality-audit.md             Historical audit of the previous layout
├── knowledge-base/                  Cross-version knowledge — canonical, curated
│   ├── architecture.md … ui.md      Per-subsystem notes
│   ├── unlock-manifest.json         Every unlock, with anchors and evidence
│   ├── signatures/3.7.2.json        Extracted structural fingerprint
│   ├── learning-log/3.7.2.md        What this version taught us
│   └── re-config.json / repo-meta.json / .regions.json
├── scripts/
│   ├── build-unlocked.sh            baseline + patch series → dist/
│   ├── make-patches.sh              build + baseline → patch series
│   ├── unlock-3.7.2.py              the generator behind the patch
│   └── verify.py                    the executable checklist
└── versions/
    └── 3.7.2/
        ├── README.md
        ├── build.json
        ├── patches/0000-unlocked.patch
        └── chessr-original-restored/    loadable baseline + PROJECT_REPORT.md
```

Design rules, invariants and the release checklist live in
[`docs/repository-layout.md`](docs/repository-layout.md). What each file inside a build does
is in [`docs/code-map.md`](docs/code-map.md).

---

## FAQ

**Will I get banned?** Possibly. The build blocks the requests chess.com's FairPlay and
extension-detection systems rely on, which is exactly the behaviour those systems exist to
catch. Lichess and worldchess have their own rules.

**Do I need an account?** No — for the UI. For analysis, yes, and the client cannot change
that.

**Does it work in Firefox or Safari?** No. It needs Chromium MV3: MAIN-world content
scripts, `declarativeNetRequest`, CDP through `debugger`.

**Why did the repository shrink?** 3.7.2 ships 32.6 MB instead of ~190 MB because the
engines left the package, so the whole build fits in git and the patch is 482 lines against a
31 MB baseline.
