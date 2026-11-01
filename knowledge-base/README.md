# Knowledge base

The canonical, cross-version record of what we know about the Chessr.io extension. It is
the repository's memory: each processed version re-verifies the claims here, corrects what
changed, and appends what it learned. It is **not** a copy of any version's report — reports
are per-version and frozen, this folder is cumulative.

Maintained by hand alongside every processed version. Claims are re-verified against the
restored baseline, not copied forward.

## Contents

| Path | What it holds |
|---|---|
| `architecture.md` | What kind of application this is: stack, entrypoints, shadow DOM, stores. |
| `authentication.md` | The account/plan stack, the gates around it, and what the unlock can and cannot do. |
| `engine.md` | Where analysis runs (server-side since 3.7.2), the wasm files, and the never-modify boundary. |
| `messaging.md` | The three message channels: postMessage verbs, runtime messages, sealed WebSocket frames. |
| `networking.md` | Every endpoint, what it is for, and whether it works in the unlocked build. |
| `popup.md` | Toolbar popup notes — N/A for 3.7.2 (`"action": {}`). |
| `storage.md` | `chrome.storage.local`, `localStorage`, cloud-sync path. |
| `ui.md` | Overlay surfaces, the 11 move classifications, gates, locales. |
| `unlock-manifest.json` | Every applied unlock: anchors, expected counts, transform, verification, confidence, limitations. |
| `signatures/<version>.json` | Mechanically extracted structural fingerprint ([`scripts/extract-signature.py`](../scripts/extract-signature.py)). |
| `learning-log/<version>.md` | One file per version: discoveries, disproved assumptions, tooling fixes. |
| `re-config.json` | Run configuration: default mode, approval thresholds, fidelity policy. |
| `repo-meta.json` | Repository schema version + component schema versions (drives migration). |

Only 3.7.2 is present. The 3.3.2 and 3.4.0 signatures and learning logs were removed with
the versions themselves and remain in git history.

## Auto-generated regions: retired

Up to 3.4.0 the topic files carried `<!-- BEGIN AUTO-GENERATED: … -->` fences whose hashes
lived in `.regions.json`, so an accidental hand edit could be detected. The generator that
produced those blocks is not in this repository, and the fences had become the only content
in most files. They were retired in the 3.7.2 rebuild: the prose is hand-written, the
signature is mechanically generated, and `scripts/verify.py` checks the signature and the
unlock anchors against the baseline instead. The `regions` check now skips.

## Anchor health

Every anchor in `unlock-manifest.json` is checked against the 3.7.2 baseline by
`scripts/verify.py --only anchors`. Each unlock declares `expected_count`, because "the
string occurs somewhere" is not a locator:

| Kind | Rule | Example |
|---|---|---|
| **Store state** | exactly two occurrences, one per bundle | `initializing: true,` |
| **Predicate** | exactly two occurrences, or four where the expression is used twice per bundle | `=== "free" && !` |
| **Single-bundle site** | exactly one occurrence | `"version": "3.7.2"` in `manifest.json` |

If a count changes, the baseline moved: the manifest is updated deliberately or the patch
generator stops. `scripts/unlock-3.7.2.py` fails on its own if any edit matches zero or
more than one anchor, so the two checks overlap on purpose.

## Conventions

- Relative keys and paths only. No absolute paths in any tracked file.
- Facts are evidence-tagged. A claim that cannot be verified from the shipped code is marked
  `⚠️ Unknown` with a confidence level rather than guessed.
- When the report and the knowledge base disagree, the per-version report wins for that
  version and the knowledge base is corrected.
