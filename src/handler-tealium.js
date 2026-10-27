/*! Tealium handler — AUD owns this (reference only; AUD writes the real one).
 *  Goes in the Tealium profile, after the shared snippet. */
window.stepnetwork.handlers.tealium = function () {
  if (window.utag && window.utag.view) window.utag.view(window.utag.data || {});
};
