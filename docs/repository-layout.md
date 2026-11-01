# Repository layout and conventions

## Design in one paragraph

The repository is an **archive of versions**, not an application. Each version is a
frozen pair of builds: a faithful baseline (`chessr-original-restored`) and the
modified build that is actually used (`chessr-unlocked-all-features`). Everything that
is not a build — the knowledge base and the reports — lives outside the build folders so it
never ships and never drifts between the two copies.

```
Chessr/
├── README.md                     Project index
├── .gitattributes                Binary handling + vendored-engine language hints
├── .gitignore                    OS junk, release archives, Chrome runtime cache
├── docs/                         Repository documentation (this folder)
├── knowledge-base/               Canonical cross-version knowledge
└── versions/
    └── <semver>/
        ├── README.md             Version overview: install, unlocks, limitations
        ├── chessr-original-restored/        Frozen baseline (never edited)
        └── chessr-unlocked-all-features/    Active build (where changes happen)
```

## Rules

### 1. One folder per version, semver only

`versions/<major>.<minor>.<patch>/` — no prefixes, no spaces, no "latest" alias. The
highest semver is the current version; the one below it is kept because every report
and unlock is validated against it. Old versions are never deleted: they are the
evidence trail for how the extension evolved.

### 2. Exactly two builds per version, with stable names

| Folder | Contract |
|---|---|
| `chessr-original-restored/` | Behavior-preserving restoration of the shipped build. **Read-only.** Deobfuscated and reformatted, nothing else. It is what the unlocked build is diffed against. |
| `chessr-unlocked-all-features/` | The same tree with the account system removed and premium limits lifted. All changes land here. |

Both folders must have an **identical file layout**. The only expected differences are
the modified files listed in the version's `PROJECT_REPORT.md` §10. Verify with:

```bash
diff -rq --exclude=engine versions/3.4.0/chessr-original-restored \
                     versions/3.4.0/chessr-unlocked-all-features
```

### 3. Builds contain only what Chrome loads

A build folder is a loadable extension:

```
manifest.json  rules.json  stream.html  background.js
content-scripts/  chunks/  assets/  icons/  engine/
project-documentation/PROJECT_REPORT.md      ← the one allowed exception
```

Do **not** add READMEs, notes, screenshots, or scratch files inside a build. They are
packaged into release archives and loaded by the browser. File-by-file orientation
belongs in [`code-map.md`](code-map.md).

`_metadata/` is Chrome's own cache of `rules.json` (declarativeNetRequest). It is
generated on load, is not source, and is git-ignored — never commit it.

### 4. `engine/` is third-party and untouchable

The chess engines (Stockfish, Komodo Dragon, Torch, Rodent, Maia 3, ONNX Runtime, the
opening book) are vendored binaries and are **never** reformatted, renamed, or unlocked.
Premium gating lives in the UI/store layer, not in engine code. Every validation script
excludes `engine/`.

**Why the same `engine/` tree exists in every build.** Each build must stay a
self-contained, directly loadable extension and a self-contained release archive, so the
engines cannot be symlinked or hoisted into a shared folder — that breaks `Load unpacked`
on Windows and any extracted tarball. The duplication is therefore intentional: about
190 MB per build. Git stores identical blobs once, so the repository history does not
grow four times; only the working tree does. Do not "optimise" this away.

### 5. One canonical knowledge base

`knowledge-base/` at the repository root is the single source of truth for cross-version
knowledge. It is not copied into version folders — a snapshot inside a build is a second
copy that silently goes stale. Per-version facts belong in that version's
`PROJECT_REPORT.md`.

Some blocks are fenced and marked as generated:

```markdown
<!-- BEGIN AUTO-GENERATED: <region-id> -->
… content owned by tooling …
<!-- END AUTO-GENERATED: <region-id> -->
```

Text outside those fences is manual and is never overwritten. Region hashes used for
drift detection live in `knowledge-base/.regions.json`, keyed by **repo-relative** path
(`knowledge-base/architecture.md#overview`) so the file survives clones and moves.

### 6. Relative paths everywhere

Tracked files must not contain absolute paths (`/Users/…`, `C:\…`). They break on any
other machine and leak local directory names. This applies to `.regions.json`, scripts,
and reports.

## Where does a new file go?

| You are adding… | Put it in |
|---|---|
| A note about the repository, tooling, or conventions | `docs/` |
| Knowledge about the extension that holds across versions | `knowledge-base/` |
| A per-version technical finding | that version's `PROJECT_REPORT.md` |
| A change to the extension | `versions/<v>/chessr-unlocked-all-features/` |
| Anything Chrome would load | inside a build folder, mirroring the path Chrome expects |

## Adding a new version

Keep the archive linear — one new folder per upstream release:

1. **Restore.** Copy the incoming build into `versions/<semver>/chessr-original-restored/`
   and deobfuscate/reformat it with zero behavior changes. It is the reference everything
   else is diffed against.
2. **Fork the build.** Copy that tree to `versions/<semver>/chessr-unlocked-all-features/`
   and re-apply every unlock catalogued in `knowledge-base/unlock-manifest.json`, using the
   recorded anchors and transforms. Re-verify each one against the previous version's
   restored tree; anything unconfirmed stays marked `Unknown`, never guessed.
3. **Diff and document.** Diff the previous version's restored tree against the new one and
   write the "What's New" section of `project-documentation/PROJECT_REPORT.md`, inheriting
   the previous report's structure and section numbering.
4. **Update knowledge.** Refresh `knowledge-base/` (`signatures/<semver>.json`,
   `learning-log/<semver>.md`, `unlock-manifest.json`, topic docs) and the version
   `README.md`. See [`../knowledge-base/README.md`](../knowledge-base/README.md).
5. **Validate and commit.** Run the checklist below; the version root must contain exactly
   `README.md` plus the two build folders.

## Release packaging

A release is a tarball of exactly one build, named after the build and the version:

```bash
cd versions/3.4.0
tar -czf ../../dist/chessr-unlocked-all-features-3.4.0.tar.gz chessr-unlocked-all-features
```

Include `project-documentation/` (the report is part of the release's documentation);
exclude nothing else — the folder is already clean by rule 3. `dist/` is git-ignored.

## Git hygiene

- `*.wasm`, `*.onnx`, `*.bin`, `*.data`, images and archives are declared binary in
  `.gitattributes`; never force-add them as text.
- Engine trees are marked `linguist-vendored` so repository statistics reflect the
  project's own code.
- Do not commit `.DS_Store`, `_metadata/`, `dist/`, `__pycache__/`, or `*.tar.gz`
  (all ignored).

## Validation checklist for a version

Run from the repository root, substituting the version under test:

```bash
V=versions/3.4.0
# 1. Layout: version root holds README.md + exactly the two builds
ls -A "$V"
# 2. Non-engine scripts parse
find "$V" -name '*.js' -not -path '*/engine/*' -exec node --check {} \;
# 3. Manifest and network rules are valid JSON
for f in "$V"/chessr-*/manifest.json "$V"/chessr-*/rules.json; do
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1]))" "$f" || echo "INVALID: $f"
done
# 4. Diff between the builds matches the report's §10 list
diff -rq --exclude=engine "$V/chessr-original-restored" "$V/chessr-unlocked-all-features"
# 5. No live auth call left in the unlocked build
grep -rn "auth\.signInWithPassword\|auth\.signUp(" "$V/chessr-unlocked-all-features" --include='*.js'
```

Manual pass:

- [ ] `diff -rq --exclude=engine` between the two builds matches the report's §10 list.
- [ ] `engine/` byte-identical between the two builds.
- [ ] No absolute paths in repository-authored files (vendored bundles may legitimately
      embed the upstream author's build paths):
      `grep -rn "/Users/" . --exclude-dir=.git --include=*.md --include=*.json --include=*.py --include=*.sh`
- [ ] No `_metadata/` or `.DS_Store` tracked: `git ls-files | grep -E "_metadata|DS_Store"`
