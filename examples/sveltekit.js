// +layout.svelte <script>
import { afterNavigate } from "$app/navigation";

afterNavigate(({ from }) => {
  if (!from) return; // initial load
  window.stepnetwork?.changePage(getPageData());
});
