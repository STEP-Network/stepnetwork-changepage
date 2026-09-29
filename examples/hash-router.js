// Legacy hash routers: call after the app has rendered the new view,
// not directly on hashchange (render may be async).
function onViewRendered() {
  window.stepnetwork && window.stepnetwork.changePage(getPageData());
}
