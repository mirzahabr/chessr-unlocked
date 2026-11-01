# Engines and analysis

## Upstream 3.7.2 ships no chess engine

The package contains three wasm files and nothing else executable:

| File | Size | Role |
|---|---|---|
| `engine/explanation-engine.wasm` (+ `.js` glue) | 26 MB | local natural-language commentary, invoked through a Blob worker |
| `wasm/sealed_core_bg.wasm` | 157 KB | Rust handshake/sealing module for the analysis socket; the wasm-bindgen glue is inlined into `content.js` |
| `assets/sealed_core_bg-UdwPS9XK.wasm` | 157 KB | duplicate of the above, referenced from the asset URL |

Stockfish, Komodo/Dragon, Rodent IV, Maia 3, Torch and the ONNX runtime that shipped
through 3.4.0 are gone from the package.

## What this repository adds back

Because a login-free client with no engine cannot analyse, the unlocked build grafts the
3.4.0 UCI engines back in — a documented forced measure, **not** upstream code:

- `versions/3.7.2/vendor/local-engines.js` — the Komodo/Dragon and Stockfish classes from
  the 3.4.0 restoration, spliced in front of the server engine by the patch;
- `scripts/install-local-engines.sh` — copies `dragon.js/.wasm`, `stockfish.js/.wasm` and
  `book.bin` (54 MB) from git history into the built `engine/` folder;
- the factory tries the local engine first and falls back to the server path when the
  assets are absent, so a `--no-local-engines` build behaves exactly like patched upstream.

Verified in headless Chromium at depth 15 with MultiPV 3: Komodo 262 ms (e2e4 +0.58,
g1f3 +0.41, d2d4 +0.29), Stockfish 214 ms (e2e4 +0.31, g1f3 +0.21, d2d4 +0.21). Two
transplant fixes are recorded in the vendor file: strength options must only be set when
limiting is requested (an unconditional `UCI Elo` clamped Komodo to depth 2), and Stockfish
scores must be converted from pawns to centipawns (3.4.0 emitted pawns while the UI divides
by 100).

## Where analysis happens now

The client sends requests over `wss://api.chessr.io/ws` and renders the replies:

- `suggestion_request` — engine id, FEN, move list, multiPv, target ELO, personality,
  limitStrength, variety, dynamism, kingSafety, search mode/nodes/depth/movetime.
- `maia3_request`, `engine_eval_request`, `analysis_request` — evaluation and game analysis.
- `chesscom_review` — Game Review, with `chesscom_review_progress` / `_result` /
  `_cache_miss` replies carrying the quota object.

Replies are sealed frames (`{d: sealed_core.open(...)}`) and are only dequeued after an
`auth_ok` frame. Everything analysis-related is therefore server-authorised.

## Client-side, still local

- ELO ranges are metadata in the client: Komodo 400–3500, Stockfish 1320–3500, Rodent
  800–2800, Maia 3 600–2600. The premium predicate decides whether the full range is
  selectable; the actual strength is whatever the server honours.
- Opening-book lookups: `GET https://opens.chessr.io/game?moves=…` with a 3 s timeout.
- The explanation engine's own quota (default 50/day) is returned by the server and shown in
  the UI.

## Hard boundary

`engine/` (in versions that have one) and the wasm files are third-party binaries: never
reformatted, renamed or patched. In 3.7.2 the only engine-directory file is the explanation
engine, and the unlock does not touch it.
