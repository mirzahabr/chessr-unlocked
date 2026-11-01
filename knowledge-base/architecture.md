# Architecture

Chessr.io 3.7.2 is a Manifest V3 extension built with WXT (Vite-based), React and
zustand-style stores. Two entrypoints carry the application: `content-scripts/content.js`
(isolated world, renders the overlay inside a shadow root) and `chunks/stream-l1H6Qjn3.js`
(the same application compiled for `stream.html`). `pageContext.js` runs in the page's MAIN
world and owns the three site adapters; `background.js` is a service worker with five
message handlers.

The overlay lives in a shadow root attached to a custom element named after the build
namespace (`<x9110e26d-app>`), and every CSS class carries the same prefix
(`x9110e26d-panel`, `x9110e26d-fab`, …). The namespace is randomized per build; it also
prefixes the `window.postMessage` verbs, so host-page code cannot listen for stable names.

State is split across stores created by one factory: auth/plan (user, session, plan, flags,
gatedRegions), engine settings, game/board, accounts, Discord membership, version gate,
review + quota, explanation cache and UI layout. Persistence is `chrome.storage.local` plus
the host page's `localStorage`. i18n is hand-rolled with eight locales.

The build is an esbuild-style bundle (CJS interop prelude, `__commonJS`-shaped helpers)
rather than webpack or plain Rollup output. Identifiers in the restored baseline remain as
the bundler generated them.

Since 3.7.2 the application is a thin client: no chess engine ships in the package, and
analysis arrives over a sealed WebSocket. See [`engine.md`](engine.md) and
[`networking.md`](networking.md).
