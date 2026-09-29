/* Reference Tealium subscriber (AUD owns the real one, as a profile extension).
   Requires utag_cfg_ovrd.noview = true set before utag.js on SPA domains. */
(function (w) {
  "use strict";

  function onChangePage(snap) {
    if (!w.utag || typeof w.utag.view !== "function") return;
    var obj = {};
    for (var k in snap.data) obj[k] = snap.data[k];
    if (!obj.tealium_event) obj.tealium_event = "page_view";
    obj.virtual_pageview = true;
    obj.pageview_sequence = snap.seq;
    w.utag.view(obj); // utag_data is not reused: obj must be complete
    // Enrichment (Neuwo, Digiseg) runs from here and writes values for the next hop.
    // It must not call googletag.pubads().clearTargeting() — see ADR-0002.
  }

  if (w.stepnetwork && w.stepnetwork.subscribe) {
    w.stepnetwork.subscribe("tealium", onChangePage, { replay: "latest", defer: true });
  }
})(window);
