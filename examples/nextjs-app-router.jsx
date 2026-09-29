"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function StepnetworkPageview({ getPageData }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; } // cold load handled by tags
    window.stepnetwork?.changePage(getPageData());
  }, [pathname, search]);

  return null;
}
