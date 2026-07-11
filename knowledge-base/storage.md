<!-- BEGIN AUTO-GENERATED: overview -->
State lives in `chrome.storage.local` (keys extracted in the signature, e.g. `chessr_widget`,
`chessr_stream_state`, `chessr_stream_open`, `chessr-auth` in Stream Mode), `localStorage`
(menu position, cosmetic flags), and `sessionStorage` (login-trigger anti-repeat). The unlock
neutralizes the Supabase `user_settings` cloud sync path (fails silently, falls back to local).
<!-- END AUTO-GENERATED: overview -->
