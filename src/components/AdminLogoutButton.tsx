"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/logout", {
          method: "POST",
          cache: "no-store",
        });
        router.refresh();
      }}
      className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.025] px-4 py-2 text-sm text-[#D9E1EC] transition duration-150 ease-out hover:border-white/22 hover:bg-white/[0.05] hover:text-white"
    >
      Lock Dashboard
    </button>
  );
}
