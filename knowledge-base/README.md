# Knowledge base

The canonical, cross-version record of what we know about the Chessr.io extension.
It is the repository's memory: each processed version re-verifies the claims here,
corrects what changed, and appends what it learned. It is **not** a copy of any
version's report — reports are per-version and frozen, this folder is cumulative.

Maintained by hand alongside every processed version — claims are re-verified and
corrected as part of the release process, never copied forward from an old report.

## Contents

| Path | What it holds |
|---|---|
| `architecture.md` | What kind of application this is: stack, entry points, build shape. |
| `authentication.md` | The account/premium system and how it was neutralized, per version. |
| `engine.md` | The bundled engine suite and the hard "never modify" boundary. |
| `messaging.md` | MAIN-world ↔ isolated-world message vocabulary. |
| `networking.md` | Backend endpoints, which are removed by the unlock and which remain. |
| `popup.md` | Popup/entrypoint notes for versions that ship one (3.3.2 does not). |
| `storage.md` | `chrome.storage.local`, `localStorage`, and `sessionStorage` usage. |
| `ui.md` | Overlay surface and the 11 move-quality classifications. |
| `unlock-manifest.json` | Every applied unlock: anchors, transform, verification, confidence, version introduced/last verified, known limitations. |
| `signatures/<version>.json` | Mechanically extracted structural fingerprint (message types, storage keys, endpoints, APIs) per version. `source_build` says which of the two builds it describes — currently always the baseline, since the unlocked build intentionally differs. |
| `learning-log/<version>.md` | One file per version: discoveries, confirmed/disproven assumptions, tooling fixes. |
| `re-config.json` | Run configuration: default mode, approval thresholds, fidelity policy. |
| `repo-meta.json` | Repository schema version + component schema versions (drives migration). |
| `.regions.json` | Hashes of the auto-generated regions, for manual-edit drift detection. |

## Auto-generated regions

Some blocks are fenced and marked as generated (they are kept as delivered by the
documentation pass; edit only the text outside them):

```markdown
<!-- BEGIN AUTO-GENERATED: overview -->
… generated block …
<!-- END AUTO-GENERATED: overview -->
```

Everything outside the fences is manual. Each fenced block's last generated hash is
stored in `.regions.json` under a **repository-relative** key, for example
`knowledge-base/authentication.md#overview`. If the current block no longer hashes to the
stored value, a human edited it — treat the block as authoritative and do not overwrite
it.

## Status of this folder

The structure is complete; the prose is not. As of the 2026-11 quality pass the eight
topic files hold 74 lines in total — roughly one paragraph each — and every word of it sits
inside an auto-generated fence, so no block has been hand-edited yet. Treat them as
orientation, not as a substitute for the per-version report: `architecture.md`,
`messaging.md`, `storage.md` and `ui.md` are `stub`-level; `authentication.md` and
`engine.md` carry the most substance.

## Anchor health

`unlock-manifest.json` anchors are checked against the version's baseline by
`scripts/verify.py --only anchors`. One anchor was broken (it also failed to match the
baseline) and has been rewritten. Four remain *ambiguous* — they match many places, so they
locate a subsystem rather than a site:

| Entry | Anchor | Baseline occurrences |
|---|---|---:|
| `auth-store-initial-state` | `plan: "free"` | 10 |
| `auth-store-initial-state` | `user: null` | 96 |
| `auth-store-initial-state` | `session: null` | 84 |
| `discord-store-stub` | `inGuild: null,` | 4 |

The verifier reports these as warnings, not failures. Replacing them needs the surrounding
`locate.role` to be narrowed first — do not "fix" them by adding a count and calling it a
locator.

## Conventions

- **Relative keys and paths only.** No absolute paths in any tracked file.
- **Facts are evidence-tagged.** A claim that cannot be verified from the shipped code is
  marked `⚠️ Unknown` with a confidence level rather than guessed.
- **Newest version wins for current behavior**; older statements stay, prefixed with the
  version they describe, so the history remains readable.
- **JSON shapes are versioned.** Changing a key in `unlock-manifest.json`, `repo-meta.json`
  or `.regions.json` means bumping the corresponding `schema_version` **and**
  `repo-meta.json`'s `components` entry, and updating every reader in the same commit —
  never an ad-hoc edit. `scripts/verify.py --only schemas` fails when the two disagree.
- **Anchors may declare `expected_count`.** When present, the verifier fails unless the
  baseline contains exactly that many occurrences, so a locator cannot drift silently.
  Absent means "count not pinned"; more than three matches without a pin is a warning.

## Reading order for a newcomer

1. [`../docs/code-map.md`](../docs/code-map.md) — what the files are.
2. `architecture.md` then `ui.md` — what the product does.
3. `authentication.md` + `unlock-manifest.json` — what was changed and why.
4. `learning-log/` — how the understanding evolved, including mistakes and dead ends.
