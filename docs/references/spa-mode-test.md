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

## What has to change

1. **Turn automatic SPA detection off per domain** as that domain moves onto the bus. Confirmed
   necessary by §1, not urgent by §2.
2. **Re-do the Manual preview** — the setting in `hCJe7HBKoPj9EWsSo` did not save.
3. Keep `{reset: true}` as what a bare `changePage()` sends (§3).
