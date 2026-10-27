/*! stepnetwork changePage — deployed in the AY pre-script (yieldManagerPreScript.js).
 *  This file is the deployed code verbatim. Publishers install nothing and call
 *  window.stepnetwork?.changePage(). Keep it byte-identical to production. */
window.stepnetwork = window.stepnetwork || {};
if (!window.stepnetwork.changePage) {
  window.stepnetwork.changePage = function (options) {
    var opts = options || { reset: true };
    try {
      if (window.ayManagerEnv && window.ayManagerEnv.cmd) {
        window.ayManagerEnv.cmd.push(function () { window.ayManagerEnv.changePage(opts); });
      }
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('stepnetwork:changepage', { detail: opts }));
    } catch (e) {}
  };
}
