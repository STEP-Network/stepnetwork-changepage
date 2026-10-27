/*! stepnetwork changePage — identical copy in the AY pre-script and the Tealium profile.
 *  Idempotent, and vendor-neutral: options are passed through untouched. */
window.stepnetwork = window.stepnetwork || {};
window.stepnetwork.handlers = window.stepnetwork.handlers || {};
window.stepnetwork.changePage = window.stepnetwork.changePage || function (options) {
  var hs = window.stepnetwork.handlers;
  for (var k in hs) {
    if (Object.prototype.hasOwnProperty.call(hs, k)) {
      try { hs[k](options); } catch (e) {}
    }
  }
};
