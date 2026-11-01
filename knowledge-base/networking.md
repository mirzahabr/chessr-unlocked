# Networking

Extracted mechanically into `signatures/3.7.2.json`; this file interprets the list.

| Endpoint | Method | Purpose | Works unlocked? |
|---|---|---|---|
| `https://ratngdlkcvyfdmidtenx.supabase.co` | REST/GraphQL | auth, `user_settings`, `linked_accounts` | no — `initialize` is stubbed, no session exists |
| `wss://api.chessr.io/ws` | WS | analysis, Game Review, flags, auth | connects and seals; requests need a valid token |
| `<api>/health` | GET | `minExtensionVersion` update gate | yes |
| `<api>/flags` | GET | `flags`, `gatedRegions` | needs Bearer token; fails silently |
| `<api>/check-signup`, `/report-signup`, `/accounts/*`, `/guidelines/accept` | POST | signup, linking, guidelines | unreachable without an account |
| `<api>/explain` (from the explanation engine path) | POST | AI move commentary, 50/day | needs token |
| `https://opens.chessr.io/game?moves=…` | GET | opening book, 3 s timeout | yes |
| `https://api.chess.com/pub/player/…` | GET | ratings | yes |
| `https://lichess.org/api/user/…` | GET | ratings | yes |
| `https://api.worldchess.com/api/online/players/…` | GET | ratings | yes |
| `https://m1.openfpcdn.io/fingerprintjs/v…` | GET | signup fingerprinting | only on signup |
| `https://download.chessr.io/` | link | update screen target | only if the gate triggers |

REST base is derived at runtime: `VITE_CENTRAL_URL` if present, else the WebSocket URL with
`ws`→`http`, i.e. `https://api.chessr.io`.

`rules.json` blocks four outbound requests, all `xmlhttprequest`: chess.com's FairPlay
service, chess.com's `play-monitor-browser-extensions` chunk, chess.com's batched
UserActivity endpoint, and `sentry.io`. The extension hides itself from platform
anti-cheat; that is the behaviour with the real-world consequences, and it is documented in
the README rather than buried here.

There are no telemetry endpoints of Chessr's own in either bundle.
