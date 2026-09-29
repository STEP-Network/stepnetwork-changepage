# Tealium facts used

Source: Tealium documentation on single-page applications and `utag.view()`.

- Set `window.utag_cfg_ovrd = { noview: true }` before `utag.js` to suppress the automatic view.
- `utag.view(data)` per virtual pageview; `utag_data` is not reused, so pass the full object.
- Global and Tag-scoped extensions run on `utag.view`; Pre-loader and DOM Ready extensions do not.
- utag.js 4.52+ queues `utag.view` / `utag.link` calls made before load.

Re-verify against current Tealium docs when utag.js is upgraded.
