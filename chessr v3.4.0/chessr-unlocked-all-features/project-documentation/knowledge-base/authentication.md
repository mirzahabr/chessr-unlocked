<!-- BEGIN AUTO-GENERATED: overview -->
The account system is a four-part Supabase-backed stack (auth/plan store, plan-gating
predicate `isPremium`, linked-accounts store, Discord store). The premium gate resolves
true iff plan ∈ {premium, lifetime, beta, freetrial}. The hidden login switch is
`if (!user) return <LoginScreen/>` — a non-null mock user disables it.

**Unlock (3.3.2):** permanent premium anonymous session; all auth methods stubbed (no
network); version + guidelines + link-account gates neutralized. See `unlock-manifest.json`.

> ⚠️ **Unknown** — server-side acceptance of the mock session for `/api/explain-move` and
> the review WebSocket is not verifiable from client code. Confidence: low.
<!-- END AUTO-GENERATED: overview -->

<!-- BEGIN AUTO-GENERATED: v3.4.0-update -->
**v3.4.0 update:** the account/premium architecture is confirmed structurally unchanged
from v3.3.2 — all 7 previously-cataloged unlocks re-verified applicable at high confidence
(occurrence counts identical to v3.3.2's untouched original). Two additional unlocks that
were already applied in shipped builds but never formally cataloged were added to
`unlock-manifest.json` this version: `accounts-store-stub` (linked-accounts store) and
`discord-store-stub` (Discord integration store) — both were already documented in prose
in `PROJECT_REPORT.md` §10.1.4/§10.1.5, just missing from the manifest's own bookkeeping.

**New feature discovered:** a "price increase" upsell (`FreeUpgradeModal.tsx` /
`PriceIncreasePlans.tsx`, 12 new i18n keys) was added upstream. Confirmed gated by the same
`isFree(plan, freetrialUsed, planLoading)` predicate already cataloged — no new unlock
entry required; the existing `auth-store-initial-state` entry already covers it.

**Tooling correction:** `unlock-manifest.json`'s `locate.anchors` were found to be seeded
with post-unlock strings for several entries, which cannot locate a target in a fresh,
not-yet-unlocked build. Corrected to pre-unlock anchors, verified against both v3.3.2's
original restoration and v3.4.0's fresh restoration. See `learning-log/3.4.0.md`.
<!-- END AUTO-GENERATED: v3.4.0-update -->
