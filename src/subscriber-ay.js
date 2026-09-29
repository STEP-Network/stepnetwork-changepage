/* Reference AY subscriber (STEP). Register from inside the AY wrapper bootstrap,
   so it only exists when the wrapper does. */
(function (w) {
  "use strict";
  var initAt = Date.now(); // wrapper bootstrap time; cold init covers the current page

  function pageTargeting(data) {
    // Page-level KVs come from the snapshot, never from utag.data (freshness race).
    return {
      page_type: data.page_type,
      section: data.section_name,
      content_id: data.content_id
    };
  }

  function onChangePage(snap) {
    if (snap.ts < initAt) return; // replayed hop predates wrapper init

    var kv = pageTargeting(snap.data);
    var env = w.ayManagerEnv;
    if (!env || !env.cmd) return; // wrapper not present: do not create its queue

    env.cmd.push(function () {
      // ADR-0002 (open): AY leg owns page targeting for the hop it triggers.
      if (w.googletag && w.googletag.pubads) {
        var pa = w.googletag.pubads();
        pa.clearTargeting();
        for (var k in kv) if (kv[k] != null) pa.setTargeting(k, String(kv[k]));
      }
      env.changePage();
    });
  }

  if (w.stepnetwork && w.stepnetwork.subscribe) {
    w.stepnetwork.subscribe("ay", onChangePage, { replay: "latest", defer: false });
  }
})(window);
