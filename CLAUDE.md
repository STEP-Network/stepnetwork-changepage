# CLAUDE.md — stepnetwork-changepage

One function the publisher calls when a virtual page navigation happens:
`window.stepnetwork.changePage()`. The AY wrapper (STEP) and the Tealium profile (AUD) each react to
it. It replaces navigation *detection* with a publisher *signal*.

Owner: Jakob Peters · Team: AdTech (STEP) · Counterpart: AUD (JFM Audience).

## What this repo is

Ten lines of JavaScript in [`src/changepage.js`](src/changepage.js), and a README explaining when to
call them. That is the entire deliverable. It was deliberately cut down to this on 2026-10-26 from a
much larger contract design — if a change starts reintroducing a payload schema, a subscriber
registry or a version number, that is the signal to stop and ask.

## Rules

1. **`changePage()` never throws into the caller.** A publisher's router is on the other end. Every
   leg is independently wrapped in try/catch.
2. **No page-data payload.** Both systems already hold their own page data. Adding a schema of
   page fields means something two organisations and N publishers maintain forever. The `options`
   argument is *not* that: it is Assertive Yield's own documented `{refresh, reset}` object, passed
   straight through and versioned by AY. Do not strip it, and do not grow it into a payload.
3. **AY first, everything else after.** AY is the ad path. Other consumers attach to the
   `stepnetwork:changepage` event and stay off it.
4. **No navigation detection.** No `pushState` patching, no `popstate` listener, ever. Deleting
   detection is the entire point.
5. **AY stays in Reset mode.** Manual was the worst arm on every measure in the harness —
   [`docs/references/evidence.md`](docs/references/evidence.md).
6. **`changePage()` is not a speed win by itself** and no doc may imply it is. Measured: no
   significant latency change per hop. The win is deleting the shim. This is what gets quoted in a
   meeting.
7. **ES5, no dependencies, no toolchain.** It is pasted into the AY pre-script by hand. There is
   no build and no test runner, and that is correct.
8. **Publishers install nothing.** The snippet ships in *both* the AY pre-script and the Tealium
   profile, so neither leg depends on the other's tag loading. It must stay idempotent and
   first-writer-wins (`if (!window.stepnetwork.changePage)`) or the two copies fight.
9. **Every publisher-facing example calls it guarded** — `window.stepnetwork?.changePage()`. Both
   tags can be blocked. Never document a bare call.
10. **An absent wrapper is a skip, never a queue.** Do not build `ayManagerEnv` if it is missing and
   do not buffer hops for it — a late wrapper would replay the whole session at once.

## Environment

- macOS: no `timeout`. Don't wrap long commands in it.
- Use `gh` for GitHub — it is authenticated.
- Live Tealium profile, worth re-checking before quoting:
  `https://tags.tiqcdn.com/utag/jysk-fynske-medier/partners/prod/utag.js`.

## Layout

```
README.md                       What it is, how to call it, what is open
CLAUDE.md                       You are here
AGENTS.md                       Pointer to this file
src/changepage.js               The code
docs/changepage-guide.md        Publisher-facing integration guide — this is what gets forwarded
docs/stepnetwork-changePage-guide.pdf   Same guide, rendered for sending out. Markdown is the source
docs/references/evidence.md     Measured harness results. Keep; they cost real work
```
