# PLAN.md — stepnetwork-changepage

Architecture, status, milestones, the task board and every open question. Read with
[CLAUDE.md](CLAUDE.md) (rules) and [WORKFLOW.md](WORKFLOW.md) (how to work).

Status: **contract v0, draft.** v0 holds until the five open ADRs in §7 close with AUD.

---

## 1. What it is

One function the publisher calls once per virtual navigation:

```js
window.stepnetwork.changePage({
  page_type: "article",
  page_name: "Erhverv: Fynsk bilforhandler havner i problemer",
  section_name: "erhverv",
  content_id: "3812194"
});
```

That is the entire publisher surface. No history listeners, no wrapper API, no `utag` reference.

**The thing being replaced.** Today the Tealium profile `jysk-fynske-medier/partners/prod`
monkey-patches `history.pushState` / `replaceState`, exposes
`addHistoryChangeListener()`, debounces `replaceState` by 50 ms for six domains
(`deal.dk`, `spot.dk`, `sweetdeal.dk`, `sweet.dk`, `avisfordele.dk`, `gastroweek.dk`), runs an older
branch for `golf.dk`, excludes `boligsiden.dk`, and drives `isSpaSite` off a hardcoded hostname list
— while the AY wrapper independently sniffs the same history events. Two uncoordinated guesses per
navigation, with `clearTargeting()` racing the next auction. Full detail:
[docs/01-problem.md](docs/01-problem.md).

**Why the publisher signals.** They are the only party that knows a new view has actually rendered.
Everything else is inference from a browser API that also fires for query-string updates, scroll
restoration and analytics params — which is exactly why the exception list exists and keeps growing.

## 2. Architecture

```
publisher router → changePage(data)  ── returns synchronously, never throws
                          │
                     frozen snapshot { v, seq, ts, url, path, referrer, data }
                          │
                          ├─ microtask ──→ AY subscriber      → page KVs → ayManagerEnv.changePage()
                          ├─ idle      ──→ Tealium subscriber → utag.view(obj)
                          └─ CustomEvent("stepnetwork:changepage")   (observability only)
```

Four principles, in priority order:

1. **The wrapper is priority.** It serves the ads. Nothing on the ad path waits on the CDP.
2. **Subscribers are independent.** Either can be absent, late, or throw without affecting the other
   or the publisher's app.
3. **The call carries the page.** Subscribers read page data from the snapshot, not from each other's
   globals. This is what removes the `utag.data` freshness race.
4. **The publisher signals; we detect nothing.** Detection is removed, not relocated.

The seven invariants that encode this are in [CLAUDE.md](CLAUDE.md). They are not restated here.

## 3. The three legs

| Leg | File | Ships in | Owner | Timing |
|---|---|---|---|---|
| **Bus** | `src/stub.js` | the publisher's own bundle, before `utag.js` and the AY wrapper | joint | synchronous |
| **AY** | `src/subscriber-ay.js` | the AY Yield Manager wrapper bootstrap | STEP | microtask |
| **Tealium** | `src/subscriber-tealium.js` | the Tealium profile, as an extension | AUD | idle / `defer: true` |

Three deploy vehicles, three release cadences, three owners. The contract is the only thing holding
them together — which is why `docs/02-contract.md` and `docs/03-payload-schema.md` are joint files
and why a version bump is a carve-out (WORKFLOW.md §2).

**The bus provides, and only provides:** frozen deep-copied snapshots; a strictly increasing `seq`;
per-subscriber try/catch with an error counter; 100 ms dedup on `url` + `content_id`; replay of at
most the latest snapshot to a late subscriber; `performance.mark("stepnetwork:changepage:<seq>")`;
a `CustomEvent` mirror that is explicitly **not** a delivery guarantee.

## 4. Status — what exists today

| Piece | State |
|---|---|
| Specification (`docs/00`–`10`) | Drafted, internally consistent, STEP-side |
| Contract v0 (`docs/02`, `docs/03`) | Draft. Field names unconfirmed (ADR-0006) |
| `src/stub.js` | Reference implementation, complete against the v0 contract |
| `src/subscriber-ay.js` | Reference, complete. Depends on ADR-0002 landing as proposed |
| `src/subscriber-tealium.js` | Reference only — AUD writes the real one as a profile extension |
| `examples/` | Next.js (app + pages), Nuxt, Vue Router, SvelteKit, hash router |
| ADRs | 7 written: 2 accepted, 1 proposed, **4 open** — see §7 |
| Evidence | `docs/references/evidence.md`, from `STEP-Network/spa-framework`, 2026-09-03 |
| Distribution | **Nothing.** No package, no minified build, no snippet artefact |
| Validation | `scripts/check-docs.mjs` only |
| Real-world usage | **Zero domains.** Not one navigation has gone through this bus |

That last row governs everything. This is a well-argued design with no production contact.

## 5. The performance claim — stated precisely

Measured, 180 cells, 4× CPU throttle, block-randomised, mostly on allabolag.se
([docs/references/evidence.md](docs/references/evidence.md)):

- **Calling `changePage()` per hop produced no significant latency change.** The call is not a speed
  win by itself. Any doc, deck or meeting note implying otherwise is wrong.
- **AY Manual mode was the worst arm on every measure** — +1,508 / +5,183 / +2,453 ms per hop,
  2 rendered slots vs 5, page-level GPT targeting wiped mid-session, `afterPageChange` never fired.
  Hence ADR-0003: stay in Reset.
- **Reset beat the other automatic modes** on every axis.
- **Moving DOM readiness earlier (SSR) did not move time-to-first-ad.** The bound is wrapper load and
  the auction.

**Where the win actually is:** deleting the history shim and its per-domain branches from every JFM
page; ending the `clearTargeting()` / auction race; getting `utag.view()` and its extensions off the
main thread before the auction on every hop; ending recurring per-domain hotfix work.

**Cold load is a separate problem and stays one.** Tealium is on the ad critical path exactly once,
because it loads the CMP and TCF gates the auction. No `changePage` design moves that number. Report
the two separately, always.

## 6. Build plan

### M0 — Specification  ✅ `built`
The docs, ADRs, reference implementation and framework examples currently in the repo.

### M1 — Repo is a working autonomous build environment  🔄 `in progress`
**DoD:** `CLAUDE.md`, `WORKFLOW.md`, `PLAN.md` in place and mutually consistent; `AGENTS.md` reduced
to a pointer; `scripts/check-docs.mjs` green; CI runs it on push and PR; repo exists in the org with
history; every contract guarantee traced to a line of `stub.js` and back.

### M2 — Contract v1, signed by AUD  `next`
**DoD:** all five open ADRs closed with a decision and a date; payload field names confirmed against
the AUD data layer standard and EventStream attribute names; `CONTRACT_VERSION` → 1 in `stub.js` and
`docs/02-contract.md` in one commit; `docs/08-ownership.md` reflects who actually signed.
**Gate:** the AUD sign-off gate (WORKFLOW.md §7). Bundled — these questions go to a meeting.

### M3 — Distribution  `after M2`
**DoD:** a minified stub artefact with a stated byte budget; an inline `<script>` snippet publishers
can paste; a decision and owner for the npm package name (`@stepnetwork/changepage` is a placeholder
in the docs, not a reserved name); `docs/10-publisher-integration.md` updated to reference real
artefacts instead of "TBD"; the browser smoke checks from WORKFLOW.md §5 written down and runnable.
Only here does a toolchain become justified.

### M4 — Pilot domain  `after M3`
**DoD:** one JFM SPA domain running the bus in dual-run per [docs/09-rollout.md](docs/09-rollout.md);
the four acceptance criteria met; the domain's hostname removed from the legacy shim branches and the
`isSpaSite` list; before/after numbers for per-hop time-to-first-ad and share of ad requests carrying
correct page KVs.
**Gate:** the pilot gate. Nothing runs on a real property without confirmation.

## 7. Open questions

Each is exactly one ADR. Nothing here is decidable inside this repo.

| # | Question | ADR | Blocked on | Why it matters |
|---|---|---|---|---|
| Q1 | Who owns GPT page targeting per hop? Proposal: whoever triggers the auction — the AY leg clears and sets page KVs from the snapshot; Tealium stops calling `clearTargeting()` and writes enrichment as values for the **next** hop | [0002](docs/decisions/0002-gpt-targeting-owner.md) | AUD | The one piece of genuinely shared mutable state. Consequence if accepted: contextual on a hop reflects the previous hop's content until enrichment returns — AUD judges acceptability |
| Q2 | Auto-detect fallback during migration: manual-only (A) or a flagged fallback module that stands down after the first manual call (B)? Recommendation: **B**, with a dated per-domain sunset one quarter after first manual call, and a monitor listing domains still on fallback | [0004](docs/decisions/0004-auto-detect-fallback.md) | AUD + Jakob | B risks the flag never being removed — i.e. the detection this project exists to delete, living on indefinitely. A is the target state either way |
| Q3 | Global name: `window.stepnetwork` vs a neutral/JFM-level namespace vs both with an alias | [0005](docs/decisions/0005-global-name.md) | AUD | Tealium runs on all JFM properties, including ones STEP does not monetise. Renaming after publishers ship is expensive — so v0 must register the canonical name **and** one alias |
| Q4 | Payload field names vs the AUD data layer standard and EventStream attribute names; which fields are required per page type | [0006](docs/decisions/0006-payload-field-names.md) | AUD | Current draft fields are reverse-engineered from keys the profile reads today. Gates contract v1 |
| Q5 | On SPA sites with `noview = true`, how is the cold-load `utag.view()` fired today, and does it stay profile-owned? | [0007](docs/decisions/0007-initial-load.md) | AUD | ADR-0007 says publishers call on hops only. If cold load is not actually covered profile-side on some domain, that domain loses its first pageview |

**Also open, not yet ADRs — needs AY, not AUD:**

- **Q6.** Does an explicit `ayManagerEnv.changePage()` double-fire alongside automatic Reset detection
  on the same hop, and how does AY dedup? If it does double-fire, automatic detection must be
  disabled per domain after cut-over — and per-domain SPA mode override is itself unconfirmed.
- **Q7.** Do `beforePageChange` / `afterPageChange` fire for explicit calls in Reset mode?

Both gate the AY leg's correctness and both are cheap to answer once someone asks AY. Raise as ADR-0008
if the answer implies a contract change.

## 8. Task board

Statuses: `todo → in-progress → review → done`, plus `parked(reason)` /
`blocked-on-aud(q)` / `blocked-on-jakob(q)`. One task `in-progress` at a time.

| id | Task | Milestone | Status |
|---|---|---|---|
| T-01 | Workflow system: CLAUDE.md, WORKFLOW.md, PLAN.md, AGENTS.md pointer | M1 | `done` |
| T-02 | `scripts/check-docs.mjs` — contract version sync + relative link integrity | M1 | `done` |
| T-03 | CI workflow running T-02 on push and PR | M1 | `done` |
| T-04 | Create `STEP-Network/stepnetwork-changepage` (internal), push history | M1 | `done` |
| T-05 | Contract trace: every guarantee in `docs/02-contract.md` ↔ a line in `src/stub.js`, both directions. Record gaps as findings, not fixes | M1 | `todo` |
| T-06 | Browser smoke harness for the six stub guarantees (WORKFLOW.md §5) — plain HTML, no toolchain | M1 | `todo` |
| T-07 | Re-verify `docs/01-problem.md` against the live profile; stamp it with a fetch date | M1 | `todo` |
| T-08 | Register the canonical global **and one alias** in `stub.js` per ADR-0005's constraint — the alias is required in v0 regardless of which name wins | M1 | `blocked-on-aud(Q3)` |
| T-09 | Bundle Q1–Q5 into one AUD agenda document with a recommendation per question | M2 | `todo` |
| T-10 | Ask AY Q6 + Q7; record answers in `docs/references/assertive-yield.md` with a date | M2 | `blocked-on-jakob(who asks AY)` |
| T-11 | Close ADRs 0002, 0004, 0005, 0006, 0007 with decisions and dates | M2 | `blocked-on-aud` |
| T-12 | Bump contract to v1 in `stub.js` + `docs/02-contract.md`, one commit | M2 | `blocked-on-aud(Q1–Q5)` |
| T-13 | Minified stub artefact + inline snippet + stated byte budget | M3 | `todo` |
| T-14 | npm package name decision and publishing owner | M3 | `blocked-on-jakob` |
| T-15 | Pilot domain selection and dual-run instrumentation | M4 | `blocked-on-jakob` |

## 9. Log

- **2026-09-29 — M1 opened.** Repo created in `STEP-Network` (internal) from the existing draft.
  Workflow system ported from `trigger-wall`, re-weighted from blast-radius-on-a-page to contract
  integrity and the STEP/AUD boundary. `AGENTS.md`'s seven invariants promoted into `CLAUDE.md` as
  canonical; `AGENTS.md` reduced to a pointer for non-Claude agents. `scripts/check-docs.mjs` added
  to enforce the one invariant the repo already stated but could not check — contract version sync —
  plus relative-link integrity, since the docs are the product. T-01 through T-04 done. Nothing has
  been validated against a live AY workspace or Tealium profile; every vendor claim in `docs/` is
  still either vendor-documented or assumed, and labelled as such.
