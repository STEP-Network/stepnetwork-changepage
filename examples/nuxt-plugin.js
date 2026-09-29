export default defineNuxtPlugin((nuxtApp) => {
  let first = true;
  nuxtApp.hook("page:finish", () => {
    if (first) { first = false; return; }
    window.stepnetwork?.changePage(getPageData());
  });
});
