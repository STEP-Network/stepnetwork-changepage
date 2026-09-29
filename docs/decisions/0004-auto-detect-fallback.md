# ADR-0004 — Auto-detect fallback during migration

**Status:** Open.

## Options
- **A. Manual only.** No call, no event. One code path; missing instrumentation is visible immediately. Requires a publisher release before cut-over.
- **B. Fallback behind a flag.** A separate module listens to history until the first manual call, then stands down permanently. No gap during migration; risk that the flag never gets removed.

## Recommendation
B with a dated sunset per domain (one quarter after first manual call) and a monitor that lists domains still on fallback. A is the target state.

The fallback is a separate file, never part of `stub.js`.
