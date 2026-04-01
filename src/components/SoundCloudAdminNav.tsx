"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import Card from "@/components/Card";

type SoundCloudAdminNavProps = {
  showStatusSections?: boolean;
};

const pageLinks = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
  },
  {
    href: "/admin/dashboard/tokens",
    label: "Token Export",
  },
] as const;

const statusSectionLinks = [
  {
    href: "#connection-status",
    label: "Check Status",
  },
  {
    href: "#status-output",
    label: "JSON Output",
  },
  {
    href: "#track-assignment",
    label: "Track Assignment",
  },
] as const;

function getLinkClasses(active: boolean) {
  return `inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm transition duration-150 ease-out ${
    active
      ? "border-[#5CC8FF]/45 bg-[#5CC8FF]/10 text-[#DDF5FF]"
      : "border-white/12 bg-white/[0.025] text-[#D9E1EC] hover:border-white/22 hover:bg-white/[0.05] hover:text-white"
  }`;
}

export default function SoundCloudAdminNav({
  showStatusSections = false,
}: SoundCloudAdminNavProps) {
  const pathname = usePathname() ?? "";

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
            Dashboard Navigation
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pageLinks.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={getLinkClasses(active)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <AdminLogoutButton />
      </div>

      {showStatusSections ? (
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#77849A]">
            Jump To
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {statusSectionLinks.map((link) => (
              <a key={link.href} href={link.href} className={getLinkClasses(false)}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
