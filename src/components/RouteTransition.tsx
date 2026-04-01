"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type RouteTransitionProps = {
  children: ReactNode;
};

export default function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const routeKey = search ? `${pathname}?${search}` : pathname;

  return (
    <div key={routeKey} className="route-transition-in">
      {children}
    </div>
  );
}
