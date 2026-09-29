# Performance

## Two separate problems

**Cold load.** Tealium is on the ad critical path exactly once: it loads the CMP, and TCF gates the auction. Slow CMP = slow first ad. This framework does not change cold load.

**Hops.** With the bus, Tealium is off the ad path entirely on every hop. The AY leg runs first; `utag.view()` is deferred.

Keep them separate when reporting. If a domain is slow at first ad, investigate the CMP chain; no `changePage` design moves that number.

## Critical path per hop

```
t0  changePage()           returns
    ├─ microtask: AY leg   → page KVs → ayManagerEnv.changePage() → auction
    └─ idle:      Tealium  → utag.view() → extensions → tags
```

## What the evidence supports

From the STEP SPA ad-latency harness (details and sources in [references/evidence.md](references/evidence.md)):

- Calling `changePage()` on every hop showed **no significant latency change** on the tested domain. The call is not a speed win by itself.
- AY **Manual** mode was the worst arm on every measure and wiped page-level GPT targeting mid-session.
- **Reset** outperformed the other automatic modes.
- Moving DOM readiness earlier (SSR) did not move time-to-first-ad. The bound is wrapper load and the auction.

## Where the win comes from

- Deleting the Tealium history shim and its per-domain branches from every JFM page.
- Removing the race between `clearTargeting()` and the next auction.
- Taking `utag.view()` and its extensions off the main thread before the auction on every hop.
- Ending per-domain hotfix work.

## How to prove it

Re-run the harness arms: current shim vs bus, same domains, same throttle. Report per-hop time-to-first-ad, rendered slots, and share of ad requests carrying correct page KVs. Cold-load numbers reported separately.
