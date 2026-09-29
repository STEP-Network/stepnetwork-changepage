# Tealium subscriber (AUD)

Reference: [src/subscriber-tealium.js](../src/subscriber-tealium.js). AUD owns the real implementation in the profile.

## Behaviour per hop

1. Build the view object: `snapshot.data` + `tealium_event` default + `virtual_pageview` + `pageview_sequence`.
2. `utag.view(obj)`.
3. Run enrichment (Neuwo, Digiseg) and write results for the **next** hop.

Subscribes with `defer: true` so it never competes with the AY leg for the main thread.

## Vendor behaviour to design around (Tealium docs)

- `utag_cfg_ovrd.noview = true` must be set before `utag.js` loads to stop the automatic view on SPA sites.
- `utag.view()` does not reuse `utag_data`. Pass the complete object every time.
- On `utag.view()`, Global and Tag-scoped extensions run. **Pre-loader and DOM Ready extensions do not.** Any logic in those scopes will not run on a hop.
- utag.js 4.52+ includes a native early-event queue for calls before load.

## Migration tasks

1. Audit every extension's scope. List anything in Pre-loader or DOM Ready that must run per hop. Most likely source of silent data loss.
2. Move `clear_targeting`, Digiseg and Neuwo callbacks from `addHistoryChangeListener` to the bus subscriber.
3. Stop GPT writes that race the auction (ADR-0002).
4. Retire the history shim, dedup list, golf.dk branch, boligsiden exclusion and `isSpaSite` list per domain as each domain moves to the bus.
5. Register the subscriber inside the profile so it exists only when `utag.js` does.
