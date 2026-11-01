# Messaging

Three channels.

## 1. Page ↔ overlay (`window.postMessage`)

Prefix `x9110e26d:` in this build; the prefix is randomized per build and shared by the
cross-world verbs and the CSS class names. 22 verbs are present:

`requestState`, `rescan`, `move`, `newGame`, `gameOver`, `rematch`, `ratings`, `login`,
`mode`, `open`, `toggle`, `setAnon`, `setTitle`, `initialMoves`, `regions`, `dismissed`,
`executeMove`, `executePremove`, `cancelPremoves`, `cdpClick`, `cdpMouseMove`.

Direction: page → overlay for state (`move`, `newGame`, `gameOver`, `initialMoves`,
`ratings`, `mode`, `regions`); overlay → page for actions (`executeMove`,
`executePremove`, `cancelPremoves`, `rematch`, `requestState`, `rescan`, `setAnon`,
`setTitle`, `toggle`).

## 2. Overlay → service worker (`chrome.runtime.sendMessage`)

- `fetchExtensionFile` — the worker reads `engine/explanation-engine.js` and returns its
  text (the overlay turns it into a Blob worker).
- `cdpMouseMove`, `cdpClick` — synthetic input through the `debugger` permission.
- `open_stream` — opens `stream.html`.
- `getBackgroundDiag` — returns the worker's console ring buffer (100 entries).

## 3. Overlay ↔ analysis server (WebSocket)

`wss://api.chessr.io/ws?userId=<id>`; frames are JSON, sealed after the handshake. Request
types: `suggestion_request`, `maia3_request`, `engine_eval_request`, `analysis_request`,
`chesscom_review`. Auth frame: `{type: "auth", token}`; replies include `auth_ok`,
`kex`, per-request progress/result frames, and `error` with codes such as `unauthenticated`.

Messages are queued in three places: before the socket opens, before the handshake
finishes, and before `auth_ok`. Any frame can be dropped by the server, and without a real
token the queue for analysis never drains usefully.
