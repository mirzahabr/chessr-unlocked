# Third-party notices

This repository redistributes code it did not write. This file records what is
inside, on what terms, and what still has to be resolved before the repository
can be published or mirrored.

**Nothing here is legal advice.** Where a licence is marked *unverified*, it has
not been confirmed against the upstream project — check before you redistribute.

## 1. The Chessr.io application

The `content-scripts/`, `chunks/`, `assets/`, `background.js`, `rules.json` and
`manifest.json` files are the compiled output of **Chessr.io**, a commercial
browser extension. They are included for study and modification only.

**No licence is granted.** Chessr.io's terms of service do not permit
redistribution, and this repository has no permission to sublicense any of it.
The code is proprietary and remains the property of its authors. Nothing in this
repository transfers any right to it.

## 2. Bundled engines and runtime

| Component | Path | Copyright notice in the file | Licence status | Action |
|---|---|---|---|---|
| Stockfish.js 18 | `engine/stockfish.js`, `engine/stockfish.wasm` | `Stockfish.js 18 (c) 2026, Chess.com, LLC`; `Stockfish (c) T. Romstad, M. Costalba, J. Kiiski` | Stockfish is **GPL-3.0**; this is Chess.com's build of it. **No GPL text and no source offer are included here.** | Add `LICENSE-STOCKFISH` (GPL-3.0) and a written offer/pointer to the corresponding source, or drop the binary. |
| Komodo Dragon | `engine/dragon.js`, `engine/dragon.wasm` | none found | **Proprietary / commercial.** Redistribution is almost certainly not permitted. | Highest legal risk in this repository. Remove from any public distribution unless you have written permission. |
| Rodent IV | `engine/rodent/*` | none found | *Unverified.* Rodent is distributed by its author; the terms of the shipped build were not checked. | Confirm with the upstream author before redistributing. |
| Maia 3 | `engine/maia3/model.onnx`, `maia3-worker.js`, `all_moves*.json` | none found | *Unverified.* Model weights often carry their own licence, separate from the code. | Confirm the weights' licence, not just the engine's. |
| Torch 4 | `engine/torch-4-lite.js`, `engine/torch-4-lite.wasm` | none found | *Unverified.* | Confirm with upstream. |
| ONNX Runtime | `engine/maia3/ort/*` | `Copyright (c) Microsoft Corporation. All rights reserved.` | **MIT** | Add the MIT notice and copyright line. |
| Polyglot opening book | `engine/book.bin` | none found | *Unverified.* | Confirm the book's provenance. |
| Explanation engine | `engine/explanation-engine.js`, `.wasm` | none found | *Unverified.* | Confirm with upstream. |

## 3. JavaScript libraries inside the bundles

`content-scripts/content.js` and `chunks/*.js` are esbuild/Vite bundles that
include vendored third-party libraries — at minimum React, immer and the
Supabase client, plus whatever those pull in. Their licence headers are stripped
by the bundler, so they are not visible in the shipped files.

Those libraries are MIT-licensed and MIT requires the copyright notice to travel
with the distribution. Add a generated `THIRD-PARTY-LICENSES.txt` covering every
bundled package before publishing a release.

## 4. What this repository does *not* claim

- It does not claim that redistribution of the Chessr.io code is lawful.
- It does not claim that any engine above may be redistributed.
- It provides no warranty of any kind. **Use at your own risk** — see the
  [README's Disclaimer](README.md#disclaimer).

## 5. Before publishing a release

- [ ] Stockfish GPL-3.0 text + source offer present, or binary removed.
- [ ] Komodo Dragon removed or written permission on file.
- [ ] Every *unverified* row above checked and resolved.
- [ ] MIT/BSD notices for bundled JS libraries included.
- [ ] `SHA256SUMS.txt` published next to the archive.
- [ ] README "License status" section matches this file.
