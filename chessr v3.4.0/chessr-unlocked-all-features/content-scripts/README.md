# content-scripts/

Five files, three different execution worlds. See `project-documentation/PROJECT_REPORT.md`
§3/§5.2/§5.3 for the full detail — this is a quick orientation.

| File | World | Responsibility |
|---|---|---|
| `pageContext.js` | MAIN, `document_start` | The three platform adapters (chess.com/lichess/worldchess). Only file that talks to each site's own game/board objects directly. |
| `content.js` | Isolated (default) | The React overlay app: engines, eval bar, arrows, markers, FAB, auth store, settings. Largest file in the extension. In this build, the auth/plan/accounts/Discord stores are stubbed — see the report §10. |
| `content.css` | — | Stylesheet for everything `content.js` renders. |
| `chesscomAnon.js` | MAIN, `document_start` | Blurs on-page usernames ("anonymous mode"), chess.com only. |
| `chesscomFakeTitle.js` | MAIN, `document_start` | Injects a cosmetic fake FIDE title badge, chess.com only. |

`pageContext.js` and the two cosmetic scripts run in the page's own MAIN world (required to
see the site's own JS globals); `content.js` runs isolated (needs `chrome.*` APIs). They talk
to each other via `window.postMessage` with `chessr:*`-prefixed message types — see the
report §4 for the full message vocabulary.
