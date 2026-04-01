import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonSecondaryProps = {
  children: ReactNode;
  href?: string;
  className?: string;
  target?: string;
  rel?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const cls =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1A2230] px-4 py-2 text-sm font-semibold text-[#E7EDF6] transition duration-150 ease-out hover:border-white/20 hover:bg-[#1A2230]/80 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/40 focus:ring-offset-2 focus:ring-offset-[#0A0C10]";

export default function ButtonSecondary({
  children,
  href,
  className = "",
  target,
  rel,
  type = "button",
  ...buttonProps
}: ButtonSecondaryProps) {
  const classes = `${cls} ${className}`.trim();

  if (href) {
    const isExternal = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:");
    if (isExternal) {
      return (
        <a href={href} className={classes} target={target} rel={rel}>
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
