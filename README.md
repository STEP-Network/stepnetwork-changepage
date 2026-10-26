# stepnetwork-changepage

One function the publisher calls when a virtual page navigation happens.

```js
window.stepnetwork.changePage();
```

That is the whole thing. No page payload — AY and Tealium each already hold their own page data. The
only thing being unified is *when* a navigation happened.

## The mode argument

`changePage()` passes Assertive Yield's own `{refresh, reset}` object straight through.

| Call | Sends | Use for |
|---|---|---|
| `changePage()` | `{reset:true}` | a real navigation — remove every unit, re-inject |
| `changePage({})` | AY default | infinite scroll — keep units that are still valid |
| `changePage({refresh:true})` | refresh survivors | rarely; it applies `ignoreRefreshLimits` |

**Why `{reset:true}` is the default.** AY's default mode only removes units whose conditions stopped
holding or that left the DOM. On a SPA where the layout shell persists and only the content swaps,
the ad containers survive — so the units survive unrefreshed, and the new article renders the
previous article's ads against the new pageview. Silent, and exactly what this project exists to
delete.

`{refresh:true}` is deliberately not the default: it bypasses refresh controls, so a fast-navigating
user would generate an unlimited auction per unit per hop.

## For publishers

[`docs/changepage-guide.md`](docs/changepage-guide.md) — integration guide, and the
[PDF](docs/stepnetwork-changePage-guide.pdf) of the same. That is the document to forward to a
publisher's developers; it covers install, the modes, when to call, and framework wiring.

## The code

[`src/changepage.js`](src/changepage.js). Installed **twice**, by us, in both tags:

| Where | Who |
|---|---|
| AY pre-script (`yieldManagerPreScript.js`) | STEP |
| Tealium profile, early | AUD |

Publishers install nothing. The snippet is idempotent and first-writer-wins, so whichever tag loads
first defines the function and the other finds it already there.

**Why both.** If it lived only in the AY pre-script, a blocked or late wrapper would mean no global,
no event, and Tealium hears nothing — on adblocked pages, on non-monetised JFM domains, and on any
navigation that beats the async wrapper load. Installing in both decouples the Tealium leg from AY
entirely.

The global is still absent if *neither* tag loaded, so publishers call it guarded —
`window.stepnetwork?.changePage()`. The guide leads with that.

## What each side does

| | |
|---|---|
| **AY** (STEP) | the snippet calls `ayManagerEnv.changePage()` through `ayManagerEnv.cmd` |
| **Tealium** (AUD) | listens for `stepnetwork:changepage` on `window`, calls `utag.view()` |

AY goes first because it is the ad path. Everything else is a listener and off that path.

## Calling it

Once per client-side route change, after the new view has rendered. Not on initial document load —
each system's own bootstrap covers that.

- Next.js app router — a `useEffect` on `usePathname()`
- Vue Router / Nuxt — `router.afterEach()`
- SvelteKit — `afterNavigate()`

## Replaces

The Tealium profile's `history.pushState` / `replaceState` shim with its per-domain branches, and the
AY wrapper's separate sniffing of the same events. Two uncoordinated guesses per navigation, tuned
per domain, become one call.

## Two things measured, worth not re-litigating

From [`docs/references/evidence.md`](docs/references/evidence.md) (180 cells, 4× CPU throttle):

- **Calling `changePage()` per hop is not a latency win by itself.** No significant change. The win
  is deleting the history shim and its per-domain branches. Don't claim speed in a meeting.
- **AY Manual mode was the worst arm on every measure.** Stay in Reset.

## Open

**Answered 2026-10-26** — see [`docs/references/spa-mode-test.md`](docs/references/spa-mode-test.md).
Measured live on allabolag.se:

- An explicit `changePage()` **does** double-fire against automatic Reset detection — the flows are
  additive, AY does not dedup. Automatic detection has to be off per domain at cut-over.
- The double-fire costs **no duplicate ad requests**, so it is cleanup rather than an emergency.
- AY's default mode produced **zero ad requests** on a persistent-shell SPA, which is the measured
  basis for a bare `changePage()` sending `{reset: true}`.
- With detection neutralised, the model works exactly as designed: `pushState` inert,
  `changePage()` = one flow and a full auction.

Still open:

1. **Set SPA mode to Manual.** The preview created for this still read `spa.mode: "RESET"` on both
   allabolag.se and boligsiden.dk, so it did not save.
2. **Page-level GPT targeting drops 17 → 12 keys on the first hop**, then holds. Not investigated.
3. **Adblock asymmetry** — AY blocked while Tealium is not — is the case for installing the snippet
   in the Tealium profile too, and it is untested.

## History

This began as a much larger design — payload schema, subscriber bus, seven ADRs, eleven spec docs.
All of it was cut on 2026-10-26: both systems already own their data, so the only thing worth
unifying is the trigger. The original is in git at `3791a85` if the reasoning is ever needed.
