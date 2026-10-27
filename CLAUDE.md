# CLAUDE.md — stepnetwork-changepage

One call, `window.stepnetwork?.changePage()`, that AY (STEP) and Tealium (AUD) each react to
independently. Replaces navigation *detection* with a publisher *signal*.

Owner: Jakob Peters · AdTech (STEP) · Counterpart: AUD (JFM Audience).

## What this repo is

A tiny JS snippet plus two per-team handlers in `src/`, an internal guide (`README.md`) and a
publisher guide (`docs/changepage-guide.md`). Cut down from a much larger contract design: if a
change reintroduces a payload schema, a snapshot, a sequence number or a version field, stop and ask.

## Rules

1. **`changePage()` never throws into the caller.** A publisher's router is on the other end.
2. **No page-data payload.** Both systems already hold their own. `options` is AY's `{refresh,
   reset}` object, passed through and versioned by AY — not a payload, and not to be grown into one.
3. **The legs are independent and symmetric.** Each team registers its own handler under its own key
   from its own tag. Never put one team's behaviour in the other's handler.
4. **The shared snippet stays vendor-neutral.** It passes `options` through untouched. A default
   belongs in the handler that understands it — that is what lets the shared file stay frozen.
5. **No navigation detection.** No `pushState` patching, no `popstate` listener, ever.
6. **Never create another vendor's global.** Guard on it; if it is absent, do nothing.
7. **Publishers install nothing** and every publisher-facing example calls it guarded.
8. **ES5, no dependencies, no toolchain.** It is pasted into vendor tags by hand.

## Layout

```
README.md                       Internal guide — install, modes, rollout
docs/changepage-guide.md        Publisher guide — what gets forwarded
docs/stepnetwork-changePage-guide.pdf   Rendered from the markdown via headless Chrome.
                                Markdown is the source; re-render when the guide changes.
src/changepage.js               Shared snippet
src/handler-ay.js               STEP
src/handler-tealium.js          AUD
```
