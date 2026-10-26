/*! stepnetwork changePage
 *  Installed by STEP in the Assertive Yield pre-script (yieldManagerPreScript.js)
 *  AND by AUD in the Tealium profile, early. Publishers install nothing.
 *
 *  Idempotent and first-writer-wins: whichever tag loads first defines the
 *  function, the other finds it already there. That is what decouples the
 *  Tealium leg from the AY wrapper loading at all.
 *
 *  The global is still absent if NEITHER tag loaded, so publishers call it
 *  guarded: window.stepnetwork?.changePage()
 *
 *  options is Assertive Yield's own documented object, passed straight through:
 *    changePage()               → { reset: true }  — a new page: tear down, re-inject
 *    changePage({})             → AY default       — infinite scroll: keep what is valid
 *    changePage({refresh:true}) → refresh survivors
 */
window.stepnetwork = window.stepnetwork || {};
if (!window.stepnetwork.changePage) {
  window.stepnetwork.changePage = function (options) {
    var opts = options || { reset: true };
    // AY leg — ad path. Absent wrapper is a skip, never a queue.
    try {
      if (window.ayManagerEnv && window.ayManagerEnv.cmd) {
        window.ayManagerEnv.cmd.push(function () { window.ayManagerEnv.changePage(opts); });
      }
    } catch (e) {}
    // Everyone else attaches here, off the ad path
    try {
      window.dispatchEvent(new CustomEvent('stepnetwork:changepage', { detail: opts }));
    } catch (e) {}
  };
}
