# stepnetwork-changepage

One call the publisher makes on a virtual page navigation. It replaces the Tealium `pushState` shim
and AY's own navigation sniffing — two uncoordinated guesses per navigation — with one signal.

```js
window.stepnetwork?.changePage();
```

No payload: AY and Tealium each already hold their own page data. Only the trigger is shared.

## Install

Publishers install nothing. [`src/changepage.js`](src/changepage.js) is the deployed code verbatim
— keep the file and the AY pre-script byte-identical.

**Both teams ship the same snippet, into their own tag.**

| Tag | Who | What they add |
|---|---|---|
| AY pre-script (`yieldManagerPreScript.js`) | STEP | the snippet |
| Tealium profile, early | AUD | the snippet **and** a listener |

```js
// AUD, in the Tealium profile, after the snippet
window.addEventListener('stepnetwork:changepage', function (e) {
  // AUD's business entirely — e.detail is the options object
});
```

The snippet is self-guarding (`if (!window.stepnetwork.changePage)`), so whichever tag loads first
defines it and the other finds it already there. Adding it to a second tag is safe and needs no
coordination. Because the AY leg inside it is itself guarded, a copy installed by Tealium still
drives AY correctly once the wrapper is up.

Shipping it in both tags is what makes the two systems independent: the function exists if *either*
tag loaded, so an adblocked or late AY wrapper no longer costs AUD their pageviews.

> **AUD must not define their own `changePage`.** There is one function, not one per system, and
> first writer wins. If Tealium defines its own version and loads before the AY pre-script, our
> guard sees the function already exists and the AY leg is never installed — ads stop refreshing on
> every SPA hop, silently and with no error. On a consent-gated site, Tealium loading first is the
> normal ordering. Ship the identical snippet and attach a listener.

Publishers still call it guarded (`?.`), since both tags can be blocked.

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

**Adblock asymmetry is unmeasured** — whether an adblocker that kills `ay.delivery` leaves
`tiqcdn.com` alive. It is the sharpest argument for AUD shipping the snippet, but the load-order
case above already justifies it on its own.

## Publisher guide

[`docs/changepage-guide.md`](docs/changepage-guide.md) · [PDF](docs/stepnetwork-changePage-guide.pdf) — forwarded to publisher developers.
