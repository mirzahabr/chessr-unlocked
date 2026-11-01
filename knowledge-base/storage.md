# Storage

## `chrome.storage.local`

| Key | Written by | What it holds |
|---|---|---|
| `chessr-auth` | Supabase storage adapter | serialized session (access/refresh token) |
| `chessr-profile-id` | account/link flow | resolved profile id for the current site account |
| `chessr-pending-confirm-email` | signup flow | email awaiting confirmation |
| settings/layout keys | UI stores | widget pins, font size, overlay toggles, Stream Mode state |

The Supabase client is configured with `storageKey: "chessr-auth"` and a custom storage
adapter that proxies `chrome.storage.local` — so the session survives restarts and is
readable by any script with extension storage access.

## `localStorage`

The host page's storage is used for cosmetic state that should follow the page origin:
menu position, anonymous-mode toggle, fake-title setting, and a login-trigger anti-repeat
flag in `sessionStorage`.

## Cloud sync

Layouts can be pushed to `user_settings` via `loadFromCloud`, but only when a real session
exists. In the unlocked build these calls fail with 401 and are swallowed by the existing
`try/catch`, leaving the local copy authoritative.
