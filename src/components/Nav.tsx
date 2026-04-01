"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/data/site";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0C10]/70 backdrop-blur"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
          SYSTEM 174
        </Link>
        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`text-sm text-[#AAB6C6] transition duration-150 ease-out hover:text-[#E7EDF6] ${
                  isActive
                    ? "relative text-[#E7EDF6] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:bg-[#5CC8FF]"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <details className="group relative lg:hidden">
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
              const isActive = pathname === link.href;
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
