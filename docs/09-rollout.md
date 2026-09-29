# Rollout

Per domain:

1. **Prepare** — AUD audits extension scopes; STEP confirms AY behaviour for explicit `changePage()` in Reset mode.
2. **Install stub** — publisher adds stub + one `changePage()` call at their router hook.
3. **Dual run** — bus subscribers live, legacy history shim still active but its ad-side callbacks disabled for that hostname. Compare pageview counts and ad requests per hop.
4. **Cut over** — remove hostname from legacy shim branches and `isSpaSite` list.
5. **Sunset fallback** — if the fallback module (ADR-0004) was enabled, disable it within one quarter of the domain's first manual call.

## Acceptance per domain

- Tealium hop pageviews within an agreed tolerance of the publisher's router navigations.
- Every hop ad request carries the current hop's page KVs.
- No per-hop increase in time-to-first-ad versus baseline.
- Zero uncaught errors attributed to the stub or subscribers.
