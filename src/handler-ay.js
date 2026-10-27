/*! AY handler — STEP owns this. Goes in yieldManagerPreScript.js, after the shared snippet.
 *  Owns AY's default: a bare changePage() means a new page, so reset. */
window.stepnetwork.handlers.ay = function (options) {
  var opts = options || { reset: true };
  if (window.ayManagerEnv && window.ayManagerEnv.cmd) {
    window.ayManagerEnv.cmd.push(function () { window.ayManagerEnv.changePage(opts); });
  }
};
