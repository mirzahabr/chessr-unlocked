# chunks/

Contains the Stream Mode React app bundle, loaded by `../stream.html`. The filename carries
a content-derived hash suffix that changes on every build (`stream-CcAo12Z7.js` in v3.4.0,
`stream-Cq9Ik-VD.js` in v3.3.2) — don't hard-code a specific hash; read it from
`stream.html`'s `<script src>` instead.

Near-identical component/engine code to `content-scripts/content.js`, but built as a
separate entry point since it runs as its own extension page (not injected into a game
page) and therefore syncs with the live game tab via `chrome.storage.local` rather than
`window.postMessage`. Untouched, original behavior in this build.
