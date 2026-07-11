# engine/ — THIRD-PARTY, NEVER MODIFIED

Every file in this folder is bundled third-party code (except `maia3/maia3-worker.js`,
which is first-party but already clean/readable and left untouched anyway). No
deobfuscation, reformatting, renaming, or editing is ever performed here, in any version —
this is a hard boundary. Documentation only; see `project-documentation/PROJECT_REPORT.md`
§6 for full detail.

| Engine | Files | What it is |
|---|---|---|
| Stockfish | `stockfish.js/.wasm` | Official Stockfish 18 (GPLv3), primary deep-analysis engine. |
| Dragon | `dragon.js/.wasm` | Komodo Dragon (`KOMODO_TEP`), chess.com's own "Game Review" engine. |
| Explanation engine | `explanation-engine.js/.wasm` | Another Komodo Dragon build, used for natural-language move explanations. |
| Torch | `torch-4-lite.js/.wasm` | Chess.com's own lightweight NNUE engine. |
| Rodent | `rodent/` | Personality-based engine. |
| Maia 3 | `maia3/` | Human-move-prediction neural net (ONNX Runtime), predicts moves at a target rating rather than "best" moves. |
| Opening book | `book.bin` | Polyglot-style binary opening book. |
