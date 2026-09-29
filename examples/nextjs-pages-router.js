import { useRouter } from "next/router";
import { useEffect } from "react";

export function useStepnetworkPageview(getPageData) {
  const router = useRouter();
  useEffect(() => {
    const onDone = () => window.stepnetwork?.changePage(getPageData());
    router.events.on("routeChangeComplete", onDone);
    return () => router.events.off("routeChangeComplete", onDone);
  }, [router.events]);
}
