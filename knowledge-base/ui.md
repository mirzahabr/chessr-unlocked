# UI

The overlay is a React application mounted into a shadow root on
`<x9110e26d-app>`, with a floating action button (FAB) in the page's bottom-right corner
and a 400 px panel on the right. Everything is namespaced (`x9110e26d-*`) and the panel
carries its own design tokens, so the host page's CSS cannot leak in.

Surfaces:

- **Evaluation bar** — vertical, left of the board, hidden until a game is detected.
- **Suggestions** — ranked engine lines with arrows, win percentage and depth chip; this
  is the surface that depends on the server.
- **Performance** — move-quality breakdown across 11 classifications (book, best,
  excellent, good, inaccuracy, mistake, blunder, miss, brilliant, great, forced).
- **Game** — turn indicator, auto-move toggle (with humanised delays and CDP fallback),
  rescan, opening-book panel.
- **Début / opening** — book lookups from `opens.chessr.io`.
- **Settings** — engine selection, ELO, personality, search budget, arrows, theme, hotkeys,
  auto-play tuning, account, about.
- **Stream Mode** — the same panel full-page in `stream.html`.
- **System toasts** — small notifications in the bottom-left.
- **Gates** — sign-in, update-required, guidelines, link-account, beta-gate. The unlocked
  build removes the sign-in and link gates and neutralises the plan-driven CTAs; the
  update gate is untouched and still renders when the server demands a newer version.

Language follows `navigator.language` with eight bundled locales: en, es, pt, ru, fr, de,
it, tr.
