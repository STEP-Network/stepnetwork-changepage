# CLAUDE.md — stepnetwork-changepage

One publisher-called function for SPA virtual pageviews — `window.stepnetwork.changePage(data)` —
consumed independently by the Assertive Yield wrapper (STEP) and the Tealium iQ / EventStream profile
(JFM Audience). It replaces navigation *detection* with a publisher *signal*.

Owner: Jakob Peters · Team: AdTech (STEP) · Counterpart: AUD (JFM Audience).

**Read on session start:** [PLAN.md](PLAN.md) — architecture, milestones, the task board and every
open question. [WORKFLOW.md](WORKFLOW.md) — how to work.

## ⚠️ What this repo is

**Documentation-first. The docs are the product; `src/` is the executable illustration of the docs.**
The deliverable is a *contract* that two teams and N publishers implement against — not an
application. Reasoning that treats this like a normal web app is wrong.

A contract defect does not throw. It silently ships wrong page targeting to every ad request on every
JFM SPA property, or drops a publisher's pageviews, and nobody sees a stack trace. **The review gate
here is contract integrity, not runtime crashes.**

## ⚠️ Where this code runs

Three files, three deploy vehicles, three owners — none of them us at runtime:

| File | Ships in | Owned by |
|---|---|---|
| `src/stub.js` | the **publisher's own bundle**, before `utag.js` and the AY wrapper | authored jointly, installed by the publisher |
| `src/subscriber-ay.js` | the **AY Yield Manager** wrapper bootstrap | STEP |
| `src/subscriber-tealium.js` | the **Tealium profile** as an extension | AUD |

- The stub must **not** ship inside either vendor tag. If a tag is blocked, the global must still
  exist so the publisher's `changePage()` call does not throw into their router.
- Each subscriber registers **from inside its own host's bootstrap**, so it exists only when that
  host does. Never create another vendor's global.
- ES5, IIFE, zero dependencies. This runs in publisher bundles we do not control.

## Hard rules

- **ACTION NEEDED footer**: every user-facing message ends with `**ACTION NEEDED:** <items>` or
  `**ACTION NEEDED:** none — building autonomously (<next>)`.

### The seven invariants

Any change that breaks one of these is wrong, regardless of what else it improves. A diff that
violates one is a BLOCKER, not a discussion.

1. **`changePage()` never throws into the caller and returns synchronously.** All subscriber work
   happens after it returns. The publisher's router is on the other end of this call.
2. **Subscriber isolation is absolute.** A subscriber failing, being absent, or loading late has
   **no effect** on any other subscriber, and none on the publisher.
3. **Nothing on the ad-serving path waits on Tealium.** The AY leg is a microtask; the Tealium leg is
   `defer: true`. Never reorder this. The wrapper is priority — it serves the ads.
4. **Page-level data comes from the event snapshot.** The AY leg must not read page fields from
   `utag.data` — it may still hold the previous hop. `utag.data` is fine for session/audience
   enrichment, where a one-hop lag is harmless.
5. **The stub does no navigation detection.** No `pushState` patching, no `popstate` listener, ever,
   in `stub.js`. Fallback detection, if it exists, is a separate, flagged, sunsetted module
   (ADR-0004). Detection is *removed*, not relocated — that is the entire point of the project.
6. **AY stays in Reset mode.** The bus does not require Manual mode. Manual was the worst arm on
   every measure in the harness (ADR-0003, `docs/references/evidence.md`).
7. **Late subscribers receive at most the latest snapshot, never a backlog.** A replayed queue means
   a late wrapper fires every hop of the session at once.

### Working rules

- **Ownership boundaries are real.** `src/stub.js`, `docs/02-contract.md`, `docs/03-payload-schema.md`
  are **joint** — changes need STEP *and* AUD sign-off. `src/subscriber-ay.js` +
  `docs/04-subscriber-ay.md` are STEP. `src/subscriber-tealium.js` + `docs/05-subscriber-tealium.md`
  are AUD. **Never edit the other team's subscriber to fix your own problem.** Change the contract
  instead, via an ADR.

- **The contract version is a two-file atomic edit.** `CONTRACT_VERSION` in `src/stub.js` and the
  version line in `docs/02-contract.md` move together, in the same commit. CI enforces this
  (`scripts/check-docs.mjs`).

- **State facts with a source.** Measured numbers live in `docs/references/evidence.md` with where
  they came from; every other doc links to it rather than restating. Label every claim **measured**,
  **documented by vendor**, or **assumed**. An assumption presented as a measurement is a BLOCKER.

- **Every open question lives in exactly one ADR with status `Open`.** Do not scatter TODOs through
  the docs. Five ADRs are open right now — see [PLAN.md](PLAN.md) §7.

- **`changePage()` is not a speed win by itself** and the docs must never imply it is. The harness
  measured no significant latency change from calling it per hop. The win is deleting the Tealium
  history shim and its per-domain branches, ending the `clearTargeting()`/auction race, and moving
  `utag.view()` off the main thread before the auction. Claiming otherwise in a doc is a BLOCKER —
  it is what gets quoted in a meeting.

- **Cold load and hops are separate problems.** Tealium is on the ad critical path exactly once, at
  cold load, because it loads the CMP. No `changePage` design moves that number. Never report them
  as one.

- **No placeholder implementations.** A stub that returns a plausible value is worse than a missing
  function. If a path cannot be built yet, it is absent and it is in PLAN.md.

- **Build only what is technically needed.** `/simplify` runs on every diff before review
  (WORKFLOW.md §4a). The publisher surface is four lines of integration code; keep it that way. Every
  added option on the contract is an option two teams and N publishers must implement forever.

- **English. Plain, matter-of-fact. No marketing language.**

## Commands

```bash
node scripts/check-docs.mjs    # contract-version sync + relative-link integrity. Must be clean before any commit.
```

There is no build, no test runner and no `package.json` — and that is correct today. `src/` is
reference JavaScript that ships inside other people's bundles. **Do not add a toolchain until
PLAN.md M3 scopes the npm package.**

## Environment

- **The repo path contains a space** (`…/SPA unified framework/stepnetwork-changepage`). Quote every
  path in every shell command.
- **macOS: no `timeout`.** Don't wrap long commands in it.
- Use `gh` for GitHub — it is authenticated. The GitHub MCP server is unreliable here.
- The live Tealium profile is readable and worth re-checking before quoting:
  `https://tags.tiqcdn.com/utag/jysk-fynske-medier/partners/prod/utag.js`. It republishes
  independently of this repo.

## Layout

```
PLAN.md                         ← architecture, milestones, task board, open questions
WORKFLOW.md                     ← how to work
CLAUDE.md                       ← you are here (canonical rules)
AGENTS.md                       ← pointer to this file, for non-Claude agents
docs/
  00-overview.md                Architecture in one page
  01-problem.md                 Current state and why it fails
  02-contract.md                Public API — the thing we version  [JOINT]
  03-payload-schema.md          Event snapshot and payload fields  [JOINT]
  04-subscriber-ay.md           AY leg                             [STEP]
  05-subscriber-tealium.md      Tealium leg                        [AUD]
  06-failure-modes.md           Absent / late / throwing dependencies
  07-performance.md             Critical path, cold load vs hop, evidence
  08-ownership.md               Who ships and maintains what
  09-rollout.md                 Per-domain migration and fallback
  10-publisher-integration.md   What we hand to publisher developers — kept short, it gets forwarded
  decisions/                    ADRs. Five open. Contract is v0 until they close with AUD
  references/                   Evidence and third-party facts, with sources
src/
  stub.js                       The bus                            [JOINT]
  subscriber-ay.js              Reference AY subscriber            [STEP]
  subscriber-tealium.js         Reference Tealium subscriber       [AUD]
examples/                       Framework wiring: Next.js, Vue/Nuxt, SvelteKit, hash router
scripts/check-docs.mjs          The only check that exists. Keep it that way until M3
```

## Conventions

- Conventional commits, referencing the PLAN.md task id:
  `docs(contract): close ADR-0006 field names [T-12]`, `fix(stub): …`.
- ES5 in `src/`. No transpiler, no bundler, no runtime dependency.
- Markdown links between docs are relative and CI-checked. Don't hand-wave a path.
