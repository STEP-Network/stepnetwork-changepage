# stepnetwork-changepage

One publisher-called function for SPA virtual pageviews, consumed independently by the Assertive Yield wrapper (STEP) and Tealium iQ / EventStream (JFM Audience).

```js
// Publisher: call once per virtual navigation, after the new view has rendered.
window.stepnetwork.changePage({
  page_type: "article",
  page_name: "Erhverv: Fynsk bilforhandler havner i problemer",
  section_name: "erhverv",
  content_id: "3812194"
});
```

That is the entire publisher surface. No history listeners, no wrapper API, no `utag` reference.

## Why

Every SPA domain today gets a bespoke navigation-detection hotfix. The Tealium profile patches `history.pushState` / `replaceState` and carries hostname-specific branches; the AY wrapper separately sniffs the same history events. Two uncoordinated guesses per navigation, tuned per domain. See [docs/01-problem.md](docs/01-problem.md).

## Principles

1. **The wrapper is priority.** It serves the ads. Nothing on the ad path waits on the CDP.
2. **Subscribers are independent.** AY and Tealium each subscribe to the bus and react on their own clock. Either can be absent, late, or throw without affecting the other or the publisher's app.
3. **The call carries the page.** Subscribers read page-level data from the event snapshot, not from each other's globals.
4. **The publisher signals; we detect nothing.** Navigation detection is removed, not relocated.

## Layout

```
CLAUDE.md                       Rules for agents working in this repo — canonical
WORKFLOW.md                     How work is run here
PLAN.md                         Status, milestones, task board, open questions
AGENTS.md                       Pointer to CLAUDE.md
docs/
  00-overview.md                Architecture in one page
  01-problem.md                 Current state and why it fails
  02-contract.md                Public API — the thing we version
  03-payload-schema.md          Event snapshot and payload fields
  04-subscriber-ay.md           AY leg (STEP owns)
  05-subscriber-tealium.md      Tealium leg (AUD owns)
  06-failure-modes.md           Absent / late / throwing dependencies
  07-performance.md             Critical path, cold load vs hop, evidence
  08-ownership.md               Who ships and maintains what
  09-rollout.md                 Per-domain migration and fallback
  10-publisher-integration.md   What we hand to publisher developers
  decisions/                    ADRs — accepted and open
  references/                   Evidence and third-party facts, with sources
src/
  stub.js                       Reference bus (publisher-installed)
  subscriber-ay.js              Reference AY subscriber
  subscriber-tealium.js         Reference Tealium subscriber
examples/                       Framework wiring: Next.js, Vue/Nuxt, SvelteKit, hash router
scripts/check-docs.mjs          Contract-version sync + relative-link integrity (CI)
```

## Status

Draft. Contract is **v0** until the five open decisions in [docs/decisions/](docs/decisions/) are closed with AUD.
Not one navigation has gone through this bus in production yet.

Status, milestones and the task board live in [PLAN.md](PLAN.md); how work is run here is [WORKFLOW.md](WORKFLOW.md).
