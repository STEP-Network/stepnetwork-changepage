# ADR-0002 — Who owns GPT page targeting per hop

**Status:** Open — decide with AUD.

## Context
Tealium writes GPT key-values and calls `clearTargeting()` on history change. AY triggers the auction. Both act on one `googletag` instance asynchronously. The harness observed page-level targeting wiped mid-session in Manual mode (7 of 13 ad requests carrying the forced KV).

## Proposal
Whoever triggers the auction owns page targeting for that hop. The AY leg clears and sets page KVs from `snapshot.data` immediately before `changePage()`. Tealium stops calling `clearTargeting()` and writes enrichment KVs (`step_contextual`, Digiseg) as values for the next hop, via a setter the AY leg applies.

## Alternatives
- Tealium keeps writing all KVs; AY waits for a "targeting ready" signal. Re-couples the ad path to the CDP.
- Stub sets page KVs synchronously before any subscriber runs. Couples the stub to GPT.

## Consequence of proposal
Contextual on a given hop reflects the previous hop's content until enrichment returns. AUD to judge acceptability.
