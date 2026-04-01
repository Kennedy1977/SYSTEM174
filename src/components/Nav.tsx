"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/data/site";
import { siteNavLabel } from "@/lib/site-meta";

export default function Nav() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const desktopNavRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDetailsElement | null>(null);
  const navLinkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const previousActiveHrefRef = useRef<string | null>(null);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    visible: false,
  });
  const [indicatorMoving, setIndicatorMoving] = useState(false);

  const activeHref = useMemo(() => {
    return (
      navLinks.find((link) =>
        link.href === "/"
          ? currentPath === "/"
          : currentPath === link.href || currentPath.startsWith(`${link.href}/`),
      )?.href ?? null
    );
  }, [currentPath]);

  useEffect(() => {
    mobileMenuRef.current?.removeAttribute("open");
  }, [currentPath]);

  useEffect(() => {
    const previousActiveHref = previousActiveHrefRef.current;
    previousActiveHrefRef.current = activeHref;

    if (!previousActiveHref || !activeHref || previousActiveHref === activeHref) {
      return;
    }

    setIndicatorMoving(true);
    const timeoutId = window.setTimeout(() => {
      setIndicatorMoving(false);
    }, 420);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeHref]);

  useEffect(() => {
    const updateIndicator = () => {
      const navContainer = desktopNavRef.current;
      const activeLink = activeHref ? navLinkRefs.current[activeHref] : null;

      if (!navContainer || !activeLink) {
        setIndicator((current) => (current.visible ? { ...current, visible: false } : current));
        return;
      }

      const containerRect = navContainer.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();

      setIndicator({
        left: linkRect.left - containerRect.left,
        width: linkRect.width,
        visible: true,
      });
    };

    const animationFrame = window.requestAnimationFrame(updateIndicator);
    const handleResize = () => {
      updateIndicator();
    };

    window.addEventListener("resize", handleResize);

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateIndicator) : null;
    if (desktopNavRef.current) {
      resizeObserver?.observe(desktopNavRef.current);
    }

    if (activeHref) {
      const activeLink = navLinkRefs.current[activeHref];
      if (activeLink) {
        resizeObserver?.observe(activeLink);
      }
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [activeHref]);

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0C10]/70 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
          {siteNavLabel}
        </Link>
        <div ref={desktopNavRef} className="relative hidden items-center gap-2 lg:flex">
          {navLinks.map((link) => {
            const isActive = activeHref === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(node) => {
                  navLinkRefs.current[link.href] = node;
                }}
                aria-current={isActive ? "page" : undefined}
                className={`relative z-10 inline-flex h-11 items-center rounded-full border px-5 text-sm tracking-[0.01em] transition-[color,border-color,background-color,transform] duration-250 ease-out ${
                  isActive
                    ? "border-transparent bg-transparent text-[#5CC8FF]"
                    : "border-white/16 bg-white/[0.025] text-[#E3E9F2] hover:border-white/28 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-0 h-11 overflow-visible rounded-full transition-[transform,width,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              indicator.visible ? "opacity-100" : "opacity-0"
            }`}
            style={{
              top: "50%",
              width: `${indicator.width}px`,
              transform: `translate3d(${indicator.left}px, -50%, 0)`,
            }}
          >
            <span
              data-moving={indicatorMoving ? "true" : "false"}
              className="nav-pill-motion block h-full w-full rounded-full border border-[#5CC8FF]/55 bg-[#5CC8FF]/10 shadow-[0_0_0_1px_rgba(92,200,255,0.05),0_0_26px_rgba(92,200,255,0.16)]"
            />
          </span>
        </div>

        <details ref={mobileMenuRef} className="group relative lg:hidden">
          <summary
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded border border-white/15 text-[#AAB6C6] transition hover:border-white/30 hover:text-[#E7EDF6]"
          >
            <span className="sr-only">Toggle navigation menu</span>
            <svg
              className="h-5 w-5 group-open:hidden"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
            <svg
              className="hidden h-5 w-5 group-open:block"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
            </svg>
          </summary>
          <div className="absolute right-0 top-11 w-[min(18rem,calc(100vw-2.5rem))] rounded-xl border border-white/10 bg-[#0F131A]/95 p-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
            {navLinks.map((link) => {
              const isActive = activeHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm text-[#AAB6C6] transition hover:bg-white/5 hover:text-[#E7EDF6] ${
                    isActive ? "bg-white/5 text-[#E7EDF6]" : ""
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </details>
      </div>
    </nav>
  );
}
