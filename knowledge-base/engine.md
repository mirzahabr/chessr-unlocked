# Engines and analysis

## 3.7.2 ships no chess engine

The package contains three wasm files and nothing else executable:

| File | Size | Role |
|---|---|---|
| `engine/explanation-engine.wasm` (+ `.js` glue) | 26 MB | local natural-language commentary, invoked through a Blob worker |
| `wasm/sealed_core_bg.wasm` | 157 KB | Rust handshake/sealing module for the analysis socket; the wasm-bindgen glue is inlined into `content.js` |
| `assets/sealed_core_bg-UdwPS9XK.wasm` | 157 KB | duplicate of the above, referenced from the asset URL |

Stockfish, Komodo/Dragon, Rodent IV, Maia 3, Torch and the ONNX runtime that shipped
through 3.4.0 are gone.

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
