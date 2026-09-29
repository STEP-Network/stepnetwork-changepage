# AY subscriber (STEP)

Reference: [src/subscriber-ay.js](../src/subscriber-ay.js)

## Behaviour per hop

1. Resolve page-level targeting from `snapshot.data`.
2. Apply page key-values to GPT (see ADR-0002 on who owns GPT targeting).
3. Call `ayManagerEnv.changePage()` through `ayManagerEnv.cmd`.

Runs on a microtask, not deferred. This is the ad path.

## Rules

- **Do not read page fields from `utag.data`.** It may still hold the previous hop. `utag.data` is acceptable for session and audience enrichment, where a one-hop lag is harmless.
- **Do not create `ayManagerEnv` if the wrapper has not announced itself.** Creating `{cmd: []}` and pushing into it means a late-loading wrapper replays every queued hop at once. Subscribe with `replay: "latest"`, and register the subscriber from inside the wrapper's own bootstrap so it only exists once the wrapper does.
- **Skip replay that predates wrapper init.** If the wrapper bootstrapped after the latest hop, its cold init already covers the current page; replaying would double-reset.
- **Keep SPA mode Reset.** `changePage()` is an explicit notification alongside automatic mode, not a switch to Manual. See ADR-0003.
- `changePage()` must only run once the new DOM is in place. The contract pushes that responsibility to the publisher's call timing.

## Open with AY

- Whether an explicit `changePage()` alongside automatic Reset mode double-fires on the same hop, and how AY dedups. If it does, disable automatic detection per domain once the domain is on the bus. Needs AY confirmation; per-domain mode override is an open question with them.
- Confirm `beforePageChange` / `afterPageChange` fire for explicit calls in Reset mode.
