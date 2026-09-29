# WORKFLOW.md — Autonomous build workflow

Adapted from `trigger-wall`'s `WORKFLOW.md`, itself adapted from `automated-lazy-loading`'s, itself
from the GAM MCP's, itself from STEP's `dev-tasks` plugin philosophy. Single-repo,
single-developer-agent context: state lives in `PLAN.md` + git history, not on a Monday board. The
stance, gates and review loop carry over; the ceremony does not.

What is different here, and why this file is not a copy of the trigger-wall one: **that project ships
JavaScript that runs inside someone else's web page. This one ships a *contract* that two
organisations and N publishers implement against.** Trigger-wall's gates are weighted toward blast
radius on a publisher's page. These are weighted toward *contract integrity* and *the boundary
between STEP and AUD*.

The failure mode that matters here is quiet. A wrong wall breaks a page and someone files a ticket.
A wrong contract ships correct-looking code to three deploy vehicles owned by three parties, and the
symptom is ad requests carrying the previous hop's targeting on every JFM SPA property, for months,
with no error in any console. **Nothing in this repo throws when it is wrong.** Review accordingly.

## 1. The stance: autonomous by default

Work the milestone lifecycle end-to-end without pausing between phases. One continuous workflow:
pick task → implement → simplify → self-review → validate → document → commit → next. No
"should I proceed?" intermissions — silence means proceed; Jakob interrupts to redirect.

**Communication:** one terse line starting a phase, one line finishing it, findings surfaced
concisely mid-work. Never end a turn on an unexecuted promise.

**ACTION NEEDED footer (mandatory):** every user-facing message ENDS with exactly one of
`**ACTION NEEDED:** <numbered, specific items>` or
`**ACTION NEEDED:** none — building autonomously (<what runs next>)`.
Deferred items ("at the M2 gate you'll need…") are not ACTION NEEDED now. Always last, always bold.

## 2. Carve-outs — the ONLY reasons to stop and ask

| Trigger | Action |
|---|---|
| **A change to a JOINT file** — `src/stub.js`, `docs/02-contract.md`, `docs/03-payload-schema.md` | Draft it, then confirm. These need AUD sign-off, not just ours. Never quietly widen the contract. |
| **Editing the other team's leg** — `src/subscriber-tealium.js`, `docs/05-subscriber-tealium.md` | Don't. Raise an ADR against the contract instead. If the task genuinely requires it, confirm first. |
| **Anything that runs on a real publisher domain** — installing the stub on a live property, enabling a bus subscriber in the live AY workspace or Tealium profile, retiring a hostname from the legacy shim | Confirm first. Always. Someone else's readers and someone else's revenue are on the other end. |
| **Anything that writes to AY, GAM or Tealium** — workspace config, a profile republish, a targeting key | Confirm first. This repo *specifies*; it does not provision. Reads are free. |
| **Closing an open ADR** | The five open ADRs are owed to AUD, not decidable here. Propose a resolution in the ADR; do not flip its status to Accepted alone. |
| **A contract version bump** | Confirm. v0 → v1 is a promise to publishers who have already shipped a call. |
| **Destructive / irreversible** — force-push, history rewrite, deleting an ADR or a reference | Confirm first. Never as a workaround for a blocker. An ADR is superseded, never deleted. |
| **Scope expansion** — work exceeds what PLAN.md scopes | Surface the delta in 1–2 sentences before doing it. |
| **External-system contact** — Slack, email, publisher or AY/AUD contact | Confirm both action and content. |
| **Hidden trade-offs** — multiple legitimate paths with materially different downstream consequences | Present 2 options + a recommendation; Jakob picks. Routine engineering choices are NOT this. |
| **Missing context** — needs a credential, an AY/Tealium UI action, or a product decision not answerable from PLAN.md | Ask the specific question (§6). Don't guess. |
| **Stuck** — real blocker after honest fix attempts | Park the task, work something else, ping with the Stuck format. |

**What NOT to stop on:** phase transitions, picking the next task when priority is clear,
re-confirming settled decisions, wording and structure of STEP-owned docs, adding a framework example,
a failing `check-docs` run (fix it), re-reading the live Tealium profile, choosing between two
equivalent phrasings.

**When in doubt: fix-and-retry.** Three consecutive failed attempts on the same failure → step back
and try a different angle. Still blocked and it gates the milestone → Stuck protocol. Blocked but
non-gating → park in `PLAN.md` with a note, continue elsewhere.

## 3. Task lifecycle & state

`PLAN.md` §8 is the board. Statuses: `todo → in-progress → review → done`
(+ `parked(reason)` / `blocked-on-aud(question)` / `blocked-on-jakob(question)`).
One task `in-progress` at a time.

1. **Claim** — mark `in-progress` in PLAN.md §8.
2. **Plan** — non-trivial tasks get a 3–6 bullet mini-plan in the entry; consider 2–3 alternatives
   before settling. Test the idea, don't agree with it — including my own first one.
3. **Implement** — smallest correct change, match repo idioms, no speculative code.
4. **Simplify (§4a), then self-review (§4b)** — `/simplify` on the diff first, then the spawned
   reviewer. Loop until PASS.
5. **Validate** (§5) — all applicable tiers green.
6. **Document** — `PLAN.md` if the architecture, the board or an open question changed.
7. **Commit + push** — conventional message referencing the PLAN.md id
   (`docs(contract): tighten replay guarantee [T-07]`). Working tree clean at task end. Push at
   every task close.
8. **Close** — mark `done` with a one-line result. At milestone end: run the DoD from PLAN.md,
   write a log entry, then the review gate (§7).

**Session discipline:** never end a session with `PLAN.md` out of sync with reality.

## 4. Simplify, then self-review (both mandatory before any commit of substance)

### 4a. The simplification gate — run this FIRST

**Run `/simplify` on the diff before spawning the reviewer.** Not optional, not "if it looks
bloated". Then answer these three, in writing, in the task entry:

1. **What did I build that nothing currently requires?** Speculative contract options, unused payload
   fields, subscriber options with one caller, a doc section covering a case nobody has hit. Delete
   it. Later can add it.
2. **Is there a shorter version that is equally correct?** Not shorter-and-cleverer — shorter. This
   applies to prose as hard as to code: `docs/10-publisher-integration.md` gets forwarded to people
   who owe us nothing.
3. **Which of the two governing facts does this serve?** The framework must (a) let a publisher
   signal one navigation and have both systems react correctly and independently, (b) without either
   system's failure, absence or lateness costing the other or the publisher anything. If a change
   serves neither, it is scope.

**Every option added to the contract is permanent.** `stub.js` has exactly two subscriber options
(`replay`, `defer`) and both have a named consumer. A third needs a named consumer before it exists,
not after. **A contract surface that exists to be used later is a BLOCKER, not a POLISH.**

### 4b. Self-review (mandatory)

Spawn a **read-only reviewer subagent** on the diff — the author does not grade their own work in the
same context. It reports; the main session fixes and re-runs until pass. Three consecutive rounds
each introducing a NEW blocker → step back and redesign.

**Checklist (8 points, weighted to this project's failure modes):**

1. **The seven invariants hold** (CLAUDE.md). Walk them one by one against the diff; do not assert
   "no change" without checking. Specifically: does anything on this path make `changePage()` able to
   throw, or able to do work before it returns? Does the AY leg read a page field from anywhere but
   the snapshot? Did any detection creep into `stub.js`?
2. **Isolation survives the failure matrix.** For each dependency — AY absent, AY late, Tealium
   absent, Tealium late, a subscriber throwing, the stub missing, a double call, a call before render
   — does the diff still produce the outcome in `docs/06-failure-modes.md`? Ask specifically: **what
   happens if this subscriber's host never loads at all?** The answer must be "nothing, for everyone
   else."
3. **Ordering is intact.** AY on a microtask, Tealium on idle. Nothing on the ad path newly waits on
   the CDP. A change that makes the Tealium leg observable to the AY leg — or vice versa — is a
   BLOCKER, however convenient.
4. **The snapshot stays immutable and non-replaying.** Frozen deep, copied not referenced, `seq`
   strictly increasing, replay delivers at most one. A subscriber must not be able to mutate what
   another subscriber sees.
5. **Ownership boundaries respected.** Did this diff touch a JOINT or AUD-owned file? If yes, is
   there an ADR, and is it flagged for sign-off? Fixing our problem inside their file is a BLOCKER
   even when the code is right.
6. **Docs and code agree.** `CONTRACT_VERSION` vs `docs/02-contract.md`. Guarantees listed in the
   contract vs what `stub.js` actually does — including the dedup window, the replay rule and the
   `CustomEvent` mirror. A guarantee documented but not implemented is worse than an undocumented
   one: publishers build on it.
7. **Claims are sourced and labelled.** Any number traces to `docs/references/evidence.md` with its
   origin. Measured / vendor-documented / assumed is stated. Re-check: does any new sentence imply
   `changePage()` is a latency win? Does anything conflate cold load with hops?
8. **One question, one ADR.** No new TODOs scattered in prose. `docs/decisions/README.md` table
   matches the ADR files' actual statuses.

**Triage:** **BLOCKER** (invariant violated, isolation broken, ordering inverted, ownership breach,
doc/code divergence, an unsourced number, a fabricated vendor behaviour — must fix),
**IMPROVEMENT** (fix if <10 lines, low risk, in touched files), **POLISH** (decline with a one-line
reason). A regression introduced by a fix round is always BLOCKER.

## 5. Validation tiers

There is no test runner, and adding one before M3 is scope. Validation here is mechanical checks plus
adversarial reading — stated honestly as such.

| Tier | What | When required |
|---|---|---|
| **Docs check** | `node scripts/check-docs.mjs` — contract version sync between `src/stub.js` and `docs/02-contract.md`; every relative markdown link resolves | Every change. Never red |
| **Contract trace** | For each guarantee in `docs/02-contract.md`, point at the line in `src/stub.js` that provides it, and vice versa for every behaviour the stub has | Every change to a JOINT file |
| **Failure matrix walk** | Every row of `docs/06-failure-modes.md` re-argued against the change | Every `src/` change |
| **Browser smoke** | Load `stub.js` + both subscribers in a page, call `changePage()` twice, assert: returns before subscribers, AY fires before Tealium, throwing subscriber doesn't stop the other, dedup collapses the double call, late `subscribe()` gets exactly one replay | Every `stub.js` change |
| **Vendor re-verification** | Re-read the live Tealium profile and the AY docs in `docs/references/` before relying on a vendor behaviour | Before quoting vendor behaviour anywhere |
| **Real path — AY** | Against a live AY workspace: explicit `changePage()` in Reset mode does not double-fire, `beforePageChange`/`afterPageChange` do fire | Milestone DoD (ADR-0003 open item) |
| **Real path — Tealium** | Against a real profile: `utag.view()` on a hop runs Global and Tag-scoped extensions; nothing needed lives in Pre-loader or DOM Ready scope | Milestone DoD (AUD-owned) |
| **Per-domain acceptance** | The four criteria in `docs/09-rollout.md` | Every domain cut-over |

**Before changing anything vendor-facing, read `docs/references/`.** It is the version-controlled
record of what AY and Tealium actually documented, with sources. Re-deriving a vendor contract from
memory wastes a session and usually lands on the wrong answer.

**Self-validation before human validation.** Cross-check by independent paths where possible — a
guarantee asserted by the contract doc AND by the stub source AND by a browser smoke run. Only what
genuinely needs human eyes, or AUD's, goes to a gate.

## 6. Hard locks → ping Jakob (the Stuck protocol)

Known hard-lock classes:
- **AUD decisions**: the five open ADRs — GPT targeting owner (0002), fallback module (0004), global
  name (0005), payload field names (0006), cold-load ownership (0007). None are decidable here.
- **Tealium**: profile access, extension-scope audit, a profile republish, EventStream mapping.
- **AY**: whether explicit `changePage()` double-fires alongside automatic Reset detection; per-domain
  SPA mode override. Needs AY, via STEP's account contact.
- **Publisher**: any domain installing the stub; the pilot domain choice.
- **Distribution**: the npm org / package name for the stub, and who publishes it.
- **Credentials/env**: anything not already in the repo.
- **Anything that runs on a real publisher domain** (see §2).

**Ping format:** what I tried → what I learned → the specific decision or action needed → my concrete
recommendation. Never "I'm not sure" — always a recommendation. Mark the task `blocked-on-aud` or
`blocked-on-jakob` in `PLAN.md` and keep building anything not gated by it. **Bundle the AUD
questions** — they go to a meeting, not a DM, so batch them into the next gate rather than pinging
piecemeal.

## 7. Review gates (milestone ends)

Ping only when the gate carries a decision or needs human eyes; otherwise it is a silent gate — a
`PLAN.md` log entry, and work continues.

**The three mandatory gates, because they leave this repo:**
- **The AUD sign-off gate** — before the contract is called v1. The joint files are not ours alone,
  and an unsigned contract that publishers have already built against is the expensive failure.
- **The vendor-behaviour gate** — before a doc asserts what AY or Tealium does on a hop, it has been
  observed or found in the vendor's own documentation. Reasoning from the reference implementation
  is not evidence about the vendor.
- **The pilot gate** — before the bus carries a single real navigation on a real property.

Gate reports are concise and honest: what shipped, checks run **including failures**, bundled
questions, what starts next.

## 8. Subagent roles

| Agent | Purpose | Access |
|---|---|---|
| **self-reviewer** | §4b checklist on a diff; reports only, never edits | read-only (`.claude/agents/self-reviewer.md`) |
| **profile-prober** | Fetch and read the live Tealium profile / vendor docs to verify a behaviour before writing it down, AND record the finding in `docs/references/` with its source and fetch date in the same pass | read-only web + `docs/references/` |
| **doc-updater** | Diff → targeted doc edits | `docs/` only |

Spawn when work would flood context or can run in parallel. The main session stays orchestrator and
owns `PLAN.md`, commits and gates.

## 9. Quality guardrails (always on)

- **Cite primary sources, read directly.** A decision resting on a specific external artefact — a
  vendor doc line, the live profile, a harness result — must be checked at the source. `gh api`,
  `gh repo view` and a direct fetch of `utag.js` beat both a summary and memory. A secondary summary
  is a lead, not evidence.
- **Subagent replies truncate at ~4KB.** Have research agents write to a file and reply with a short
  summary.
- **Honest reporting**: failed checks reported as failures; skipped steps named; "done" only when
  verified. No silent caps or quiet degradations. **"The reference implementation does X" is not
  "AY does X"** — the first is a file in this repo, the second is a vendor claim needing a source.
- **A vendor behaviour is assumed until observed.** Say "verified against the live profile on
  <date>" or say "assumed" — never imply the former. Everything in `docs/references/` carries where
  it came from.
- **Numbers carry their origin.** Every measurement lives in `docs/references/evidence.md` with its
  setup, date and scope caveat. The harness results are mostly from one domain (allabolag.se); any
  doc generalising them to JFM must say so.
- **Simplest thing that meets the objective.** The objective is: the publisher signals one
  navigation, both systems react correctly and independently, and neither can hurt the other or the
  publisher. Before adding a contract option, a payload field, a subscriber hook or a doc page, state
  which part of that sentence requires it. If none does, don't.
- **No placeholder implementations.** If a path cannot be built yet, it is absent and it is in
  `PLAN.md`.
- **Detection stays deleted.** Any pressure toward "just listen to history as well, for safety" is
  the problem this project exists to end. The fallback in ADR-0004 is a separate, flagged, dated
  module — never a line in `stub.js`.
- **Memory**: durable decisions go in an ADR; open questions and board state go in `PLAN.md` — not
  just chat.
