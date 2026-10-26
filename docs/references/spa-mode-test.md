# SPA mode test — allabolag.se, 2026-10-26

Live test against AY Manager previews on `allabolag.se/segmentering`, desktop 1920×1080, consent
accepted. Five slots on the page: `billboard_1`, `billboard_4`, `sticky_1`, `topscroll_desktop`,
`anchor`.

Hops were simulated with `history.pushState()` on a single document. **The content DOM did not
actually change** — a real navigation swaps DOM and may re-instance more units than observed here.
Labelled **measured** throughout; the caveat applies to every row.

## 1. Automatic detection is live and does not dedup

Preview `sfHourbWGZdRvA6ZA.vhXkJyLR7g2CzvyHH`, `spa.mode: "RESET"`.

| Action | YM flows | Our calls |
|---|---|---|
| `pushState` only | 1 | 0 |
| `changePage()` only | 1 | 1 |
| `pushState` + `changePage()` | **2** | 1 |

Flows are additive. AY does not collapse an explicit `changePage()` into a concurrent automatic
flow. **This is the answer to the open question: automatic detection must be off on any domain
using the bus.**

## 2. The double-fire costs no duplicate ad requests

Measured through a full double-fire hop:

```
flows: 2 · ourCalls: 1
adRequestsByUnit: { anchor:1, sticky_1:1, billboard_1:1, topscroll_desktop:1 }
duplicateRequests: []
```

The two flows land ~110 ms apart and every auction fires after the second, so flow 2 supersedes
flow 1 before anything leaves the browser. **The double-fire is wasted work and a timing-dependent
race, not a revenue defect.** The ~110 ms gap is the safety margin and is not guaranteed — on a
slower device flow 1 could complete an auction before flow 2 tears it down. Disable auto-detect at
cut-over, but it is cleanup, not an emergency.

## 3. Mode comparison — why the default is `{reset: true}`

Run without `pushState`, isolating the mode from auto-detect:

| Call | Ad requests | Units re-instanced |
|---|---|---|
| `changePage()` → `{reset:true}` | **4** | 1 (`anchor`) |
| `changePage({})` → AY default | **0** | 0 |
| `changePage({refresh:true})` | 4 | 0 |

**AY's default mode did nothing at all.** Nothing had left the DOM and no placement conditions had
changed, so it found no work. On a SPA whose shell persists across route changes, a bare
`changePage({})` leaves the previous page's ads live and unrefreshed. This is the measured basis for
`{reset: true}` being what a bare `changePage()` sends.

## 4. The "Manual" preview did not take

Preview `sfHourbWGZdRvA6ZA.hCJe7HBKoPj9EWsSo` was created to set SPA mode to Manual. Read from the
live page:

```js
ayManagerEnv.settings.yieldScriptSettings.spa.mode   // => "RESET"
```

It is still RESET, and behaved identically to preview 1: `pushState` produced 1 flow and a 4-unit
auction 148 ms later. An idle control (7 s, no trigger) produced 0 flows, so nothing ambient is
firing — the flow is caused by `pushState`.

`history.pushState` is patched by AY's own minified code on this page.

**Cross-checked on `boligsiden.dk`** with the same preview id. Same entity
(`sfHourbWGZdRvA6ZA`), preview applies cross-domain, and `spa.mode` reads `"RESET"` there too. So
the setting is entity-level and the Manual change did not save — it is not domain-specific.

## 5. The target state works

Simulated by restoring a pristine `history.pushState` from a same-origin iframe, which neutralises
both AY's detection and the Tealium shim:

| Action | YM flows | Ad requests |
|---|---|---|
| `pushState` | **0** | 0 |
| `changePage()` | **1** | 4, all units served |

`afterPageChange` fired on the explicit call. This is the publisher-signal-only model behaving as
designed.

## 6. Other observations

- **Page-level GPT targeting drops on the first hop**, 17 keys → 12, then holds steady at 12 across
  subsequent hops. Not investigated further. Worth a look before cut-over.
- **Ad-free pages carry no tags at all.** On `/info/om-allabolag-se/` there is no `ay.delivery`
  script, no `tiqcdn` script, no `googletag` and no `utag`. So those pages do not demonstrate the
  AY/Tealium coupling gap — there is nothing there to report to either way.
- **Adblock asymmetry remains untested.** The case for installing the snippet in the Tealium profile
  as well rests on AY being blocked while Tealium is not. That needs an adblocker to prove.

## 7. Manual mode — confirmed working, boligsiden.dk

Preview `sfHourbWGZdRvA6ZA.CpEmmpz7LYRxCNWcs`, read live from the page:

```js
ayManagerEnv.settings.yieldScriptSettings.spa   // => { mode: "manual" }
```

Note the value is lowercase `"manual"`, where the automatic setting reads uppercase `"RESET"`.

### Automatic detection is off

| Action | Flows | Ad requests |
|---|---|---|
| Idle, 7 s, no trigger | 0 | 1 (refresh control) |
| `pushState` only | **0** | 0 |
| **Real client-side navigation** (listing → property) | **0** | 1 |
| `changePage()` explicit | **1** | 1 |

`pushState` is inert, and so is a genuine route change. The explicit call is the only thing that
produces a flow. `afterPageChange` fires on it.

### `changePage()` after a real navigation behaves correctly

Listing → property page, DOM genuinely swapped, then `changePage()`:

- 1 flow, `afterPageChange` fired
- `rectangle_1` re-requested and re-filled
- slot count held at 2, **no duplicate paths** — no double-injection
- targeting keys 18 → **24**, i.e. the call *restores* targeting rather than wiping it

### The default mode leaves stale ads — measured on a real navigation

Same site, second listing → property navigation:

| After the nav | Flows | Ad requests | Outcome |
|---|---|---|---|
| nothing called | 0 | 0 | — |
| `changePage({})` (AY default) | 1 | **0** | previous property's `rectangle_1:filled` still live |
| `changePage()` (`{reset:true}`) | 1 | **1** | re-requested, re-filled |

§3 showed this on a synthetic hop where the DOM had not changed, which was a weak test. This is the
same result on a genuine client-side navigation with a swapped DOM: **AY's default mode runs a flow
and requests nothing, leaving the previous page's ad on the new page.** `{reset: true}` as the
default for a bare `changePage()` is confirmed.

### One thing to be aware of

On boligsiden.dk the slot set changed across a client-side navigation **with zero flows** —
`sticky_1 + billboard_1` became `rectangle_1 + billboard_2`, with an ad request, before any
`changePage()` was called. Something other than the page-change flow is injecting and refreshing
units there (placement triggers or refresh controls). It means ads partially appear to "work"
across SPA navigation without the bus, which could mask a missing `changePage()` call during
rollout. Verify per domain rather than assuming a visible ad means the call landed.

## What has to change

1. **Set SPA mode to `manual` per domain** as that domain moves onto the bus. Confirmed necessary
   by §1 (flows are additive) and confirmed working by §7.
2. Keep `{reset: true}` as what a bare `changePage()` sends — §7 confirms it on a real navigation.
3. **Check each domain for non-changePage ad injection** before cut-over (§7, last note).
