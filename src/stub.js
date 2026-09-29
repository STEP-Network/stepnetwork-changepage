/*! stepnetwork changePage bus — reference implementation, contract v0 */
(function (w) {
  "use strict";
  var CONTRACT_VERSION = 0;
  var DEDUP_MS = 100;
  var ns = (w.stepnetwork = w.stepnetwork || {});
  if (ns.__bus) return; // already installed

  var subs = {};
  var last = null;
  var seq = 0;
  var prevUrl = null;
  var errors = 0;

  function log() {
    if (ns.debug && w.console) console.log.apply(console, ["[stepnetwork]"].concat([].slice.call(arguments)));
  }

  function freeze(o) {
    if (o && typeof o === "object" && !Object.isFrozen(o)) {
      Object.freeze(o);
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) freeze(o[k]);
    }
    return o;
  }

  function copy(d) {
    try { return JSON.parse(JSON.stringify(d || {})); } catch (e) { return {}; }
  }

  var idle = w.requestIdleCallback
    ? function (fn) { w.requestIdleCallback(fn, { timeout: 1000 }); }
    : function (fn) { setTimeout(fn, 0); };
  var micro = w.queueMicrotask
    ? function (fn) { w.queueMicrotask(fn); }
    : function (fn) { Promise.resolve().then(fn); };

  function deliver(name, snap) {
    var s = subs[name];
    if (!s) return;
    (s.defer ? idle : micro)(function () {
      if (subs[name] !== s) return; // replaced meanwhile
      var t = performance.now();
      try { s.fn(snap); } catch (e) {
        errors++;
        if (w.console) console.error("[stepnetwork] subscriber '" + name + "' threw", e);
      }
      log(name, "seq", snap.seq, (performance.now() - t).toFixed(1) + "ms");
    });
  }

  function changePage(data) {
    try {
      var url = w.location.href;
      var d = copy(data);
      if (last && last.url === url && last.data.content_id === d.content_id && Date.now() - last.ts < DEDUP_MS) {
        log("dedup", url);
        return;
      }
      seq++;
      var snap = freeze({
        v: CONTRACT_VERSION,
        seq: seq,
        ts: Date.now(),
        url: url,
        path: w.location.pathname,
        referrer: prevUrl || document.referrer || "",
        data: d
      });
      prevUrl = url;
      last = snap;
      try { performance.mark("stepnetwork:changepage:" + seq); } catch (e) {}
      for (var n in subs) deliver(n, snap);
      try { w.dispatchEvent(new CustomEvent("stepnetwork:changepage", { detail: snap })); } catch (e) {}
    } catch (e) {
      errors++;
      if (w.console) console.error("[stepnetwork] changePage failed", e);
    }
  }

  function subscribe(name, fn, opts) {
    if (typeof name !== "string" || typeof fn !== "function") return;
    opts = opts || {};
    subs[name] = { fn: fn, defer: !!opts.defer };
    if ((opts.replay || "latest") === "latest" && last) deliver(name, last);
  }

  function unsubscribe(name) { delete subs[name]; }

  ns.__bus = true;
  ns.version = CONTRACT_VERSION;
  ns.changePage = changePage;
  ns.subscribe = subscribe;
  ns.unsubscribe = unsubscribe;
  ns.getLast = function () { return last; };
  ns.stats = function () { return { seq: seq, errors: errors, subscribers: Object.keys(subs) }; };
})(window);
