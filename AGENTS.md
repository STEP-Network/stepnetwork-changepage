# AGENTS.md

**The rules live in [CLAUDE.md](CLAUDE.md). Read it first, then [WORKFLOW.md](WORKFLOW.md) and
[PLAN.md](PLAN.md).**

This file exists so agents that look for `AGENTS.md` by convention land somewhere correct. It is a
pointer, not a second copy — the seven invariants and the ownership boundaries were moved into
`CLAUDE.md` precisely because they are the content that must never drift between two files.

| You want | Read |
|---|---|
| What this repo is, the seven invariants, ownership boundaries, layout | [CLAUDE.md](CLAUDE.md) |
| How to work: carve-outs, task lifecycle, the review gate, validation tiers | [WORKFLOW.md](WORKFLOW.md) |
| Architecture, status, milestones, the task board, open questions | [PLAN.md](PLAN.md) |
| The public API being versioned | [docs/02-contract.md](docs/02-contract.md) |
| Why a decision is what it is | [docs/decisions/](docs/decisions/) |

## The short version

This repo is documentation-first: **the docs are the product**, `src/` is the executable illustration
of the docs. The deliverable is a contract that two organisations and N publishers implement against.

Three rules that catch most mistakes:

1. **`changePage()` never throws into the caller and returns synchronously.** A publisher's router is
   on the other end.
2. **Do not edit the other team's leg to fix your own problem.** `src/subscriber-tealium.js` and
   `docs/05-subscriber-tealium.md` are AUD's. Change the contract instead, via an ADR.
3. **The stub does no navigation detection.** Not now, not "just as a safety net". Deleting detection
   is the entire project.
