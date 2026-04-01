import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonPrimaryProps = {
  children: ReactNode;
  href?: string;
  className?: string;
  target?: string;
  rel?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const cls =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#5CC8FF]/70 px-4 py-2 text-sm font-semibold text-[#E7EDF6] transition duration-150 ease-out hover:border-[#5CC8FF] hover:bg-[#5CC8FF]/10 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/60 focus:ring-offset-2 focus:ring-offset-[#0A0C10]";

export default function ButtonPrimary({
  children,
  href,
  className = "",
  target,
  rel,
  type = "button",
  ...buttonProps
}: ButtonPrimaryProps) {
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
