# Evidence

## STEP SPA ad-latency harness

Source: `STEP-Network/spa-framework` — `docs/results.md`, `docs/measurement.md`, `PLAN.md`.
Setup: 180 measured cells, 2026-09-03, headed Chrome, 4× CPU throttle, fresh context per cell, block-randomised.

| Finding | Measured |
|---|---|
| `changePage()` on every hop | No significant difference in any phase (allabolag.se) |
| AY Manual mode, per hop | +1,508 / +5,183 / +2,453 ms; 2 rendered slots vs 5 |
| AY Manual mode, targeting | Page-level GPT targeting wiped; 7 of 13 requests carried forced KV; `afterPageChange` never fired |
| Reset vs other auto modes | Reset best on every axis; Refresh slower per hop with no fill gain; Incremental lost 3 slots per hop |
| SSR ad anchors | Hydration 1,262 → 287 ms; time-to-first-ad +2 ms |
| Per-hop ad creation (allabolag) | Driven by React remounts, not YM SPA detection |

Scope caveat: most results are from one domain. Re-run on JFM SPA domains before generalising.

## Current Tealium profile

Source: live `https://tags.tiqcdn.com/utag/jysk-fynske-medier/partners/prod/utag.js`, read September 2026. See [01-problem.md](../01-problem.md).
