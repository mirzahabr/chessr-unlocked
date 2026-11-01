# Authentication and premium gating

Four moving parts:

1. **Supabase session.** Project `ratngdlkcvyfdmidtenx.supabase.co`, anon JWT inlined. The
   client persists the session in `chrome.storage.local` under `chessr-auth` and refreshes
   it automatically.
2. **Plan.** `user_settings.plan` is one of `free`, `premium`, `lifetime`, `beta`,
   `freetrial`. The premium predicate is membership in
   `{"premium","lifetime","beta","freetrial"}`; a second predicate marks `plan === "free"`
   as limited. `fetchPlan` also reads `plan_expiry`, `freetrial_used`,
   `freetrial_ended_at` and `guidelines_accepted_at`, and demotes an expired `freetrial` to
   `free` client-side.
3. **Server flags.** `GET <api>/flags` with the access token returns
   `{flags, gatedRegions}`; both land in the auth store and are re-read from `auth_ok`
   frames on the analysis socket.
4. **Linked accounts.** `linked_accounts` (platform, username, avatar, status) drives the
   "link your account" screen; a site profile missing from that list opens it.

Additional gates: an `updateRequired` screen from `GET /health`, a guidelines modal that
blocks the panel until `POST /guidelines/accept`, and a signup check
(`POST /check-signup` + FingerprintJS) against banned or disposable addresses.

## What the unlock does

The 3.7.2 patch (see `unlock-manifest.json`) seeds the auth store with a permanent local
session and `plan: "premium"`, stubs `initialize`, `fetchPlan` and `signOut`, forces the
premium predicate true and the free predicate false, and stubs `setNeedsLinking`. The login
screen, the plan-based settings limits, the upgrade prompts and the link wall disappear.

It does **not** create a Supabase session. Anything the server authorises by token remains
unauthorised: analysis, Game Review, AI explanations. This is a change from 3.4.0, where
the engines were local and the unlock was functional.
