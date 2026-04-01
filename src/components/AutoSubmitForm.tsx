"use client";

import type { FormHTMLAttributes, ReactNode } from "react";

type AutoSubmitFormProps = {
  children: ReactNode;
} & FormHTMLAttributes<HTMLFormElement>;

export default function AutoSubmitForm({
  children,
  onChange,
  ...props
}: AutoSubmitFormProps) {
  return (
    <form
      {...props}
      onChange={(event) => {
        onChange?.(event);

        const target = event.target;
        if (!(target instanceof HTMLSelectElement)) {
          return;
        }

        event.currentTarget.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
