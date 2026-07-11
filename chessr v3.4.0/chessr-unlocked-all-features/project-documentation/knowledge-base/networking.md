<!-- BEGIN AUTO-GENERATED: overview -->
Backend endpoints are extracted mechanically by `structural_signature.py` (never authored).
Base: Supabase + `wss://api.chessr.io`. Auth/account endpoints (`/check-signup`,
`/report-signup`, `/report-banned-login`, `/accounts/link`, `/accounts/unlink`,
`/discord/*`) are removed by the unlock. Feature endpoints (`/api/explain-move`,
`/api/paddle/billing-link`, `/freetrial/*`, `/guidelines/accept`, `/health`) remain.
See `signatures/<version>.json` for the authoritative extracted list.
<!-- END AUTO-GENERATED: overview -->
