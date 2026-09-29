import { nextTick } from "vue";

export function installStepnetwork(router, getPageData) {
  router.afterEach((to, from) => {
    if (from.matched.length === 0) return; // initial navigation
    nextTick(() => window.stepnetwork?.changePage(getPageData(to)));
  });
}
