import type { ElementType, ReactNode } from "react";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type SectionProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  headingLevel?: HeadingLevel;
};

export default function Section({
  children,
  title,
  description,
  headingLevel = 2,
}: SectionProps) {
  const HeadingTag = `h${headingLevel}` as ElementType;

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
      {(title || description) && (
        <header className="mb-6 sm:mb-8">
          {title ? (
            <HeadingTag className="font-display text-3xl uppercase tracking-[-0.015em] md:text-4xl">
              {title}
            </HeadingTag>
          ) : null}
          {description ? (
            <p className="mt-3 max-w-2xl font-body text-[15px] leading-relaxed text-[#AAB6C6]">
              {description}
            </p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
}
