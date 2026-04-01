import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#77849A]">© 2026 System 174</p>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#AAB6C6]">
          <button type="button" data-open-cookie-settings className="transition hover:text-white">
            Cookie settings
          </button>
          <Link href="/privacy" className="transition hover:text-white">
            Privacy policy
          </Link>
          <Link href="/cookies" className="transition hover:text-white">
            Cookie notice
          </Link>
        </div>
      </div>
    </footer>
  );
}
