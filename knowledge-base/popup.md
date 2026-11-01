# Popup

**N/A for 3.7.2.** The manifest declares `"action": {}` — a toolbar button with no popup
page. The standalone UI is `stream.html` (Stream Mode), and all in-game UI is the injected
overlay.

Earlier versions (3.2.x and below) shipped a popup; this file is kept so a future version
that reintroduces one has a home for the notes. Confidence: high (manifest-verified
absence, `content_scripts` and `web_accessible_resources` checked).
