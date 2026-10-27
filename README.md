# stepnetwork-changepage

One call the publisher makes on a virtual page navigation. It replaces the Tealium `pushState` shim
and AY's own navigation sniffing — two uncoordinated guesses per navigation — with one signal.

```js
window.stepnetwork?.changePage();
```

No payload: AY and Tealium each already hold their own page data. Only the trigger is shared.

## Install

Publishers install nothing. Each team installs into its own tag.

| File | Goes in | Owner |
|---|---|---|
| [`src/changepage.js`](src/changepage.js) | both tags, identical copy | shared, frozen |
| [`src/handler-ay.js`](src/handler-ay.js) | `yieldManagerPreScript.js` | STEP |
| [`src/handler-tealium.js`](src/handler-tealium.js) | Tealium profile | AUD |

Whichever tag loads first defines the snippet; each team then registers its own handler under its
own key, so a tag that re-runs overwrites rather than duplicating. Neither side depends on the
other, and an absent system registers nothing. The global exists only if a tag loaded, so publishers
call it guarded (`?.`).

The shared snippet passes `options` through untouched — it carries no vendor's semantics, which is
what lets it stay frozen while either handler changes.

## Modes

The AY handler reads AY's own `{refresh, reset}`:

| Call | AY gets | For |
|---|---|---|
| `changePage()` | `{reset:true}` | a real navigation |
| `changePage({})` | AY default | infinite scroll |
| `changePage({refresh:true})` | refresh survivors | rarely — bypasses refresh controls |

`{reset:true}` is the default because AY's default mode only removes units whose conditions stopped
holding or that left the DOM. A SPA whose shell persists would keep the previous page's ads.

## Rollout

Set **`spa.mode: "manual"`** per domain as it moves onto the bus, so `changePage()` is the only
trigger. Automatic detection does not dedup against an explicit call.

- **Not a latency win.** The win is deleting the shim and its per-domain branches. Don't claim speed.
- **A visible ad doesn't prove the call landed.** Some domains inject ads outside the changePage
  flow. Verify with `beforePageChange` counts.

## Publisher guide

[`docs/changepage-guide.md`](docs/changepage-guide.md) · [PDF](docs/stepnetwork-changePage-guide.pdf) — forwarded to publisher developers.
