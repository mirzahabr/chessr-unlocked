# Contributing

This is a one-maintainer archive of a reverse-engineered extension. Contributions are
welcome in the forms that actually help: corrections to the documentation, repository
tooling, and verified findings about the extension's behaviour.

## Before you open a PR

```bash
python3 scripts/verify.py     # must exit 0 (warnings are fine)
```

CI runs the same command and fails if the run modifies tracked files.

## What is easy to accept

- **Factual corrections** — a claim in `README.md`, `docs/` or `knowledge-base/` that the
  code contradicts. Include the check you ran, not just the conclusion.
- **Repository tooling** — `scripts/`, CI, packaging. Keep it dependency-free (stdlib
  Python, POSIX shell); this repository must stay buildable with nothing installed.
- **A new version** — follow `docs/repository-layout.md` §"Adding a new version" exactly,
  including the knowledge-base updates.

## What will be rejected

- **`engine/` changes of any kind.** It is vendored third-party code, byte-identical to
  the shipped build.
- **Feature work in the baseline.** `chessr-original-restored/` may only change to fix a
  restoration defect (rule 2a in `docs/repository-layout.md`).
- **Anything that adds network calls, telemetry or new permissions** without saying so in
  the README's permissions table.
- **Reformatting commits.** `content.js` and the Stream Mode bundle are pre-reformatted
  output; a whole-file diff hides the actual change.

## Reporting a bug

Open an issue and include:

1. the version from `chrome://extensions/` (`3.4.0.1`, not just "latest");
2. your Chrome/Chromium version and OS;
3. which site (chess.com / lichess / worldchess) and which page;
4. console errors from the page **and** from the extension's service worker
   (`chrome://extensions/` → Details → service worker → Inspect);
5. what you expected vs what happened.

"Doesn't work" cannot be debugged; the five lines above usually can.

## Security and licensing

Do not open a public issue for a security problem — see [`LICENSE`](LICENSE) and
[`NOTICE.md`](NOTICE.md) for the terms, and contact the maintainer directly.

By contributing you confirm the contribution is your own work and can be included under
the same terms as the rest of the repository (see [`LICENSE`](LICENSE)).
