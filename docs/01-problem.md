# Problem

## Current state (observed in the published profile)

Profile: `jysk-fynske-medier/partners/prod` — `https://tags.tiqcdn.com/utag/jysk-fynske-medier/partners/prod/utag.js`

- A pre-loader extension monkey-patches `history.pushState` and `history.replaceState`, keeps its own listener array, and exposes `window.addHistoryChangeListener()` / `window.removeHistoryChangeListener()`.
- A six-domain dedup list debounces `replaceState` by 50 ms: `deal.dk, spot.dk, sweetdeal.dk, sweet.dk, avisfordele.dk, gastroweek.dk`.
- `golf.dk` runs a separate, older branch of the shim.
- `boligsiden.dk` is excluded from `replaceState` firing, and separately sets `noview = false` once a consent cookie exists.
- `isSpaSite` is set in the UDO from a hardcoded hostname list.
- Ad-relevant callbacks registered on the listener: `clear_targeting` (`pubads().clearTargeting()`), Digiseg re-targeting, Neuwo contextual re-fetch writing `step_contextual` to GPT.
- None of these notify the AY wrapper. The wrapper runs its own automatic SPA detection on the same history events.

> Re-verify against the live file before quoting in a meeting; the profile republishes independently of this repo.

## Why it fails

1. **Two detectors, one event.** Both systems infer the same navigation from browser history, milliseconds apart, with no defined order.
2. **History is a poor signal.** `replaceState` fires for query-string updates, scroll restoration, analytics params. Each false positive needs a per-domain rule.
3. **Exceptions accumulate in a shared file.** Every hostname branch ships to every JFM property.
4. **GPT targeting is raced.** `clearTargeting()` from the Tealium side and the next auction from the AY side have no ordering guarantee.
5. **Engineering cost is per domain and recurring.**
