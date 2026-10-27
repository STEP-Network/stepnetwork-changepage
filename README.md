# stepnetwork-changepage

One call the publisher makes on a virtual page navigation. It replaces the Tealium `pushState` shim
and AY's own navigation sniffing — two uncoordinated guesses per navigation — with one signal.

```js
window.stepnetwork?.changePage();
```

No payload: AY and Tealium each already hold their own page data. Only the trigger is shared.

## Install

Publishers install nothing. [`src/changepage.js`](src/changepage.js) is deployed in the AY
pre-script (`yieldManagerPreScript.js`), entity-wide. **It is the deployed code verbatim — keep the
two byte-identical.**

The function calls AY directly and dispatches `stepnetwork:changepage` on `window` for everyone
else. AUD attaches to that event in the Tealium profile:

```js
window.addEventListener('stepnetwork:changepage', function (e) {
  // AUD's business entirely — e.detail is the options object
});
```

It defines itself once (`if (!window.stepnetwork.changePage)`), so a tag re-run cannot duplicate it.

**Known limitation.** Because the function ships in the AY pre-script, it does not exist if the AY
wrapper is blocked or has not loaded — and then Tealium gets nothing either. Publishers call it
guarded (`?.`) so that is a no-op rather than an error in their router. Decoupling the two would
mean shipping the snippet in the Tealium profile as well; not done, see Open.

## Modes

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

## Open

**AY and Tealium are not independent.** Tealium's leg depends on our dispatch, and on the AY wrapper
loading at all. Shipping the same snippet in the Tealium profile would decouple them. Untested, and
the case for it rests on adblock asymmetry — AY blocked while Tealium is not — which has not been
measured.

## Publisher guide

[`docs/changepage-guide.md`](docs/changepage-guide.md) · [PDF](docs/stepnetwork-changePage-guide.pdf) — forwarded to publisher developers.
