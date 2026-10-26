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

Two questions, both answered by the same test on adops.stepdev.dk:

1. **Does an explicit `changePage()` double-fire** alongside Yield Manager's automatic Reset
   detection on the same hop? Count `beforePageChange` events per navigation. If it double-fires,
   automatic SPA detection gets disabled per domain after cut-over.
2. **Is `{reset:true}` the right default** for our layouts? It rebuilds persistent chrome — anchor
   and topscroll — on every hop. Compare against bare `changePage({})` on a domain whose shell
   persists, and check whether stale units survive a navigation.

Also unconfirmed: how YM's **SPA mode: Reset** workspace setting relates to the `{reset:true}`
option. They sound like the same switch; the AY docs we hold don't say. Worth asking AY.

## History

This began as a much larger design — payload schema, subscriber bus, seven ADRs, eleven spec docs.
All of it was cut on 2026-10-26: both systems already own their data, so the only thing worth
unifying is the trigger. The original is in git at `3791a85` if the reasoning is ever needed.
