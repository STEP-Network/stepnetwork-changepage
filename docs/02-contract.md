# Contract

**Version: 0 (draft)** — keep in sync with `CONTRACT_VERSION` in `src/stub.js`.

## Publisher API

### `window.stepnetwork.changePage(data?)`

Call once per virtual navigation, **after** the new view's DOM is committed.

- **Do** call it on client-side route changes.
- **Do not** call it on the initial document load. Cold load is handled by each system's own bootstrap.
- **Do not** call it for in-page state changes that are not a new page (tabs, filters, modals) unless the product considers them a pageview. That is a publisher decision, documented per domain.
- `data` — page payload. See [03-payload-schema.md](03-payload-schema.md). Pass the complete payload each time; nothing is inherited from the previous hop.
- Returns `undefined` synchronously. Never throws.

### Install

The stub must execute **before** `utag.js` and the AY wrapper, and must ship in the publisher's own bundle or as an inline snippet. It must not ship inside either vendor tag: if a tag is blocked, the global must still exist so the publisher's call does not throw.

## Subscriber API (internal)

### `window.stepnetwork.subscribe(name, handler, options?)`

- `name` — unique string (`"ay"`, `"tealium"`). Re-subscribing with the same name replaces the handler.
- `handler(snapshot)` — called once per hop, in its own task.
- `options.replay` — `"latest"` (default) or `"none"`. On subscribe, `"latest"` delivers the most recent snapshot if one exists. Never delivers more than one.
- `options.defer` — `false` (default) delivers on a microtask; `true` delivers on idle / next macrotask. Tealium subscribes with `defer: true`.

### Guarantees

1. `changePage()` returns before any subscriber runs.
2. Each handler runs in isolation. An exception is caught, logged, and counted; other handlers run regardless.
3. Snapshots are frozen. Subscribers cannot mutate what other subscribers see.
4. `seq` is strictly increasing per document.
5. Duplicate calls for the same URL and `content_id` within 100 ms collapse into one snapshot.

### Observability

- Each call dispatches `CustomEvent("stepnetwork:changepage", { detail: snapshot })` on `window` after subscribers are scheduled. For debugging and third-party listeners; not a delivery guarantee.
- `performance.mark("stepnetwork:changepage:<seq>")` per call.
- `window.stepnetwork.debug = true` logs each delivery with timings.

## Naming

`window.stepnetwork` follows existing STEP system naming. Subject to change because Tealium runs on all JFM properties, not only STEP-monetised ones. See [decisions/0005-global-name.md](decisions/0005-global-name.md). Whatever name is chosen, the stub registers the final name and one alias from day one.
