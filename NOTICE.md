# Third-party notices

This repository redistributes code it did not write. This file records what is inside, on
what terms, and what still has to be resolved before the repository can be published or
mirrored.

**Nothing here is legal advice.** Where a licence is marked *unverified*, it has not been
confirmed against the upstream project — check before you redistribute.

## 1. The Chessr.io application

Everything under `versions/3.7.2/chessr-original-restored/` except the libraries in §3 is
the compiled output of **Chessr.io**, a commercial browser extension: `content-scripts/`,
`chunks/`, `assets/`, `background.js`, `rules.json`, `icons/`, `stream.html`,
`manifest.json`, and the two wasm modules that ship with it
(`engine/explanation-engine.wasm`, `wasm/sealed_core_bg.wasm`).

**No licence is granted.** Chessr.io's terms do not permit redistribution, and this
repository has no permission to sublicense any of it. The code is proprietary and remains
the property of its authors. Nothing here transfers any right to it.

## 2. Engines — no longer applicable in 3.7.2

Upstream removed every vendored chess engine in 3.7.2. Stockfish.js, Komodo/Dragon,
Rodent IV, Maia 3, Torch, ONNX Runtime and the Polyglot book are **not** present, so the
GPL-3.0 and proprietary-redistribution problems recorded for earlier versions do not apply
to this tree. They still apply to those versions in git history, and to any release cut
from them.

What remains is Chessr's own:

| Component | Path | Notes |
|---|---|---|
| Explanation engine | `engine/explanation-engine.js`, `engine/explanation-engine.wasm` (26 MB) | proprietary; no licence text in the file |
| Sealed core | `wasm/sealed_core_bg.wasm`, `assets/sealed_core_bg-UdwPS9XK.wasm` | Rust/wasm-bindgen module, proprietary; used for the analysis-socket handshake |

Treat both as Chessr.io code under §1.

## 3. JavaScript libraries inside the bundles

`content-scripts/content.js` and `chunks/stream-l1H6Qjn3.js` are esbuild-style bundles that
include vendored third-party libraries — at minimum React, React DOM, the Supabase JS
client (`@supabase/supabase-js`, which itself pulls `postgrest-js`, `gotrue-js`,
`realtime-js`, `storage-js`), GSAP, FingerprintJS and React Flow. Licence headers are
stripped by the bundler, so they are not visible in the shipped files.

Most of those are MIT-licensed, and MIT requires the copyright notice to travel with the
distribution. GSAP has its own (now permissive) licence with brand-specific terms; confirm
the version before redistributing. Add a generated `THIRD-PARTY-LICENSES.txt` covering every
bundled package before publishing a release.

## 4. Tooling in `scripts/`

`scripts/` is original code written for this repository (MIT-style use permitted by the
repository's LICENSE). It is not shipped inside any extension build. The deobfuscation
pipeline it documents uses `webcrack` and `prettier`, which are not vendored here and are
installed separately when reproducing the restore.

## 5. What this repository does *not* claim

- It does not claim that redistribution of the Chessr.io code is lawful.
- It does not claim that any bundled library's notice has already been satisfied.
- It provides no warranty of any kind. **Use at your own risk** — see the
  [README's disclaimer](README.md#disclaimer).

## 6. Before publishing a release

- [ ] Add the MIT/BSD notices for the bundled JS libraries (`THIRD-PARTY-LICENSES.txt`).
- [ ] Resolve the GSAP licence for the bundled version.
- [ ] Confirm that publishing the proprietary wasm modules is acceptable to you — it is
      not permitted by Chessr.io's terms.
- [ ] Publish `SHA256SUMS.txt` next to the archive.
- [ ] Keep the README's permission and endpoint tables in sync with `manifest.json` and
      `rules.json`.
