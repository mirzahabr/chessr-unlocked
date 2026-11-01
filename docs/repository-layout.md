# Repository layout and conventions

## 1. The shape

```
versions/<upstream-version>/
├── README.md                      install notes, what is unlocked, limitations
├── build.json                     identity of the build the series produces
├── patches/0000-unlocked.patch    the unlock, generated, reviewable
└── chessr-original-restored/      the loadable baseline (never edited)
    └── project-documentation/PROJECT_REPORT.md
```

There is one version in the tree at a time. When a new upstream release is processed, the
old version folder is removed — it stays in git history — and the repository is rebuilt
around the new one. Carrying several 190 MB baselines was the reason the layout was
rewritten in 2026-11; 3.7.2 is 31 MB, so the cost of removal is now low anyway, but the
convention is unchanged: one current version, history in git.

## 2. Baseline versus build

`chessr-original-restored/` is frozen. It is what Chrome loads, what the patch diffs
against, and what the report describes. **Do not edit it** except for a documented
restoration fix (see §3).

The unlocked build is never committed. It is produced by:

```bash
bash scripts/build-unlocked.sh 3.7.2     # -> dist/chessr-unlocked-all-features-3.7.2/
```

## 3. Restoration fixes are allowed; product changes are not

"Read-only" means *do not change behaviour*, not *never touch*. The pipeline (webcrack +
Prettier) can itself introduce a defect — the 3.4.0 Stream Mode crash came from
`var f; f = function(){}` being rewritten into a block-scoped function declaration. When
the baseline is provably less faithful than the shipped build, fixing the baseline is
correct; working around it in the patch would make every later diff lie.

The bar: the change restores behaviour the shipped build already had, it is recorded in
`PROJECT_REPORT.md` and `CHANGELOG.md`, and it adds or removes no feature, permission or UI.
Anything else belongs in the patch series.

Pretty-printing `manifest.json` and `rules.json` is in this category: bytes differ, behaviour
does not.

## 4. Builds contain only what Chrome loads

```
manifest.json  rules.json  stream.html  background.js
content-scripts/  chunks/  assets/  icons/  engine/  wasm/
project-documentation/PROJECT_REPORT.md      ← the one allowed exception
```

No READMEs, notes, screenshots or scratch files inside a build: they ship in release
archives and are loaded by the browser. `_metadata/` is Chrome's own cache and is ignored.

## 5. The patch layer

The patch is generated from two trees, never hand-edited:

```bash
cp -R work/unlocked versions/3.7.2/chessr-unlocked-all-features
scripts/make-patches.sh 3.7.2
rm -rf versions/3.7.2/chessr-unlocked-all-features
```

`scripts/unlock-3.7.2.py` is the source of the edits: it copies the baseline, applies nine
anchored changes to three files, and fails if an anchor is missing or ambiguous. Regenerate
after changing it, then rebuild and re-verify:

```bash
python3 scripts/unlock-3.7.2.py versions/3.7.2/chessr-original-restored work/unlocked
cp -R work/unlocked versions/3.7.2/chessr-unlocked-all-features
scripts/make-patches.sh 3.7.2 && rm -rf versions/3.7.2/chessr-unlocked-all-features
scripts/build-unlocked.sh 3.7.2
python3 scripts/unlock-3.7.2.py --check dist/chessr-unlocked-all-features-3.7.2
```

**A hand-edit to a generated build is always temporary.** Fold it into the generator, or it
disappears on the next rebuild. `scripts/verify.py --only patches` is the safety net: it
applies the committed series to a copy of the baseline and compares the result with
`build.json`, and fails if `engine/` appears in a diff header.

## 6. One canonical knowledge base

Cross-version facts live in `knowledge-base/` and nowhere else. Per-version facts live in
that version's report. When they disagree, the report wins for its version and the knowledge
base is corrected. The signature and the unlock anchors are machine-checked; the prose is
not, so it is re-read against the code whenever a version is processed.

## 7. Naming and git hygiene

- Folders are named after the **upstream** version (`3.7.2`); the build reports
  `<upstream>.<patch>` (`3.7.2.1`).
- Tags: `v<version>-unlocked`.
- No file above 90 MiB is committed (`scripts/verify.py --only size-guard`). 3.7.2 is well
  inside that; a future version that vendors engines again will not be, and the baseline
  would have to move out of git or into LFS — decide before processing it.
- `dist/`, `work/`, `versions/*/chessr-unlocked-all-features/` and `_metadata/` are ignored.
- Commit messages describe the change to the repository, not the reverse-engineering
  session that produced it.

## 8. Release checklist

- [ ] `python3 scripts/verify.py` — every check passes.
- [ ] `scripts/build-unlocked.sh <v>` from a clean checkout; load it with **Load unpacked**.
- [ ] `docs/verification.md` smoke test re-run against the new build; observed output updated.
- [ ] `PROJECT_REPORT.md` re-read against the code; §9 validation section refreshed.
- [ ] `CHANGELOG.md` top entry matches `build.json`.
- [ ] `knowledge-base/signatures/<v>.json` regenerated with `scripts/extract-signature.py`.
- [ ] `knowledge-base/unlock-manifest.json` anchors re-checked (`--only anchors`).
- [ ] Archive `chessr-unlocked-all-features-<v>.tar.gz` + `SHA256SUMS.txt` built from the
      patched tree only — never from a hand-edited folder.
