# ADR-0001 — Publisher-signalled bus with independent subscribers

**Status:** Accepted by STEP. Pending AUD.

## Context
Four architectures were considered: a single STEP façade that calls both systems in sequence; Tealium as hub with AY subscribing to `utag.view`; a shared bus with independent subscribers; and centralised auto-detection with per-domain config.

## Decision
Shared bus. Publisher calls `window.stepnetwork.changePage(data)`. AY and Tealium subscribe independently and proxy into `ayManagerEnv.changePage()` and `utag.view()` respectively.

## Why not the others
- **Sequential façade:** a missing or throwing Tealium takes down the AY leg.
- **Tealium as hub:** puts CDP execution on the ad path on every hop.
- **Auto-detect with config:** keeps the guesswork; exceptions move to a config file.

## Consequences
- Ordering between systems becomes a freshness problem, resolved by passing the payload (rule 4).
- GPT targeting is the one shared state; see ADR-0002.
