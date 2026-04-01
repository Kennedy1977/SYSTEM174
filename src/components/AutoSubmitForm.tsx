"use client";

import {
  startTransition,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type AutoSubmitFormProps = {
  children: ReactNode;
  submitOnSelectChange?: boolean;
  replaceHistory?: boolean;
  preserveScroll?: boolean;
} & FormHTMLAttributes<HTMLFormElement>;

function buildQueryString(form: HTMLFormElement) {
  const params = new URLSearchParams();

  for (const [key, value] of new FormData(form).entries()) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      continue;
    }

    params.set(key, trimmedValue);
  }

  return params.toString();
}

export default function AutoSubmitForm({
  children,
  onChange,
  onSubmit,
  action,
  submitOnSelectChange = true,
  replaceHistory = true,
  preserveScroll = true,
  ...props
}: AutoSubmitFormProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  const navigateWithForm = (form: HTMLFormElement) => {
    const targetPath =
      typeof action === "string" && action.trim() ? action.trim() : pathname;
    const query = buildQueryString(form);
    const target = query ? `${targetPath}?${query}` : targetPath;
    const current = `${window.location.pathname}${window.location.search}`;

    if (target === current) {
      return;
    }

    startTransition(() => {
      if (replaceHistory) {
        router.replace(target, { scroll: !preserveScroll ? true : false });
        return;
      }

      router.push(target, { scroll: !preserveScroll ? true : false });
    });
  };

  return (
    <form
      {...props}
      action={action}
      onChange={(event) => {
        onChange?.(event);

        if (!submitOnSelectChange) {
          return;
        }

        const target = event.target;
        if (!(target instanceof HTMLSelectElement)) {
          return;
        }

        navigateWithForm(event.currentTarget);
      }}
      onSubmit={(event) => {
        onSubmit?.(event);

        if (event.defaultPrevented) {
          return;
        }

        event.preventDefault();
        navigateWithForm(event.currentTarget);
      }}
    >
      {children}
    </form>
  );
}
