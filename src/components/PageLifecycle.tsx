"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PageLifecycle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";

  useEffect(() => {
    window.dispatchEvent(new Event("system174:page-load"));

    const runtimeWindow = window as typeof window & {
      system174ConsentManager?: { trackPageView?: () => void };
    };
    runtimeWindow.system174ConsentManager?.trackPageView?.();
  }, [pathname, search]);

  return null;
}
