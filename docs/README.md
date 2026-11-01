# Documentation index

This folder documents **the repository itself** — how it is organised, how to work in it,
and how its pieces relate. It deliberately does not describe the extension's internals; that
lives one level down, closer to the code.

| Document | Scope |
|---|---|
| [`repository-layout.md`](repository-layout.md) | Directory structure, naming rules, invariants, adding a version, release packaging, git hygiene |
| [`code-map.md`](code-map.md) | What every file inside a build is for |
| [`verification.md`](verification.md) | Static checklist plus the headless-Chromium smoke test, with observed output |
| [`quality-audit.md`](quality-audit.md) | Historical audit of the pre-3.7.2 layout (Russian). Superseded — read only for the reasoning behind the current conventions |

## Where documentation lives

Documentation is split by audience and lifetime. Put a note in the wrong place and it will
either rot or ship inside the extension.

| Question | Where the answer belongs |
|---|---|
| How is this repository structured? | `docs/` (here) |
| What does `content-scripts/content.js` do? | [`code-map.md`](code-map.md) |
| What did we learn about the extension across versions? | [`../knowledge-base/`](../knowledge-base/README.md) |
| What exactly changed in version *X*, and how was it unlocked? | `versions/<X>/…/project-documentation/PROJECT_REPORT.md` |
| How do I explain this version in one page? | `versions/<X>/README.md` |

Repository-level files that are not documentation have their own homes: third-party
licensing in [`../NOTICE.md`](../NOTICE.md) and [`../LICENSE`](../LICENSE), release history
in [`../CHANGELOG.md`](../CHANGELOG.md), contribution rules in
[`../CONTRIBUTING.md`](../CONTRIBUTING.md), automation in [`../scripts/`](../scripts).

Two hard rules:

1. **No repository-level docs inside a build folder.** Build folders are what Chrome loads
   (plus their own report), so anything added there ships in release archives.
2. **No duplicated knowledge.** Each fact has exactly one canonical home; other places link
   to it instead of repeating it.

## Conventions

- Written in English; keep paragraphs short and headings meaningful.
- Use relative links only — no absolute paths — so the repository stays portable between
  machines.
- Version-specific statements say so explicitly ("in v3.7.2 …") — the repository holds
  several versions at once in principle, one in practice since the 3.7.2 rebuild.
- `PROJECT_REPORT.md` is authoritative for product facts; `knowledge-base/` is
  authoritative for cross-version knowledge. If they disagree, the report wins for that
  version and the knowledge base gets corrected.
