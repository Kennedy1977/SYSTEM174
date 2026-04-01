import type { ReactNode } from "react";
import Section from "@/components/Section";
import AdminLoginGate from "@/components/AdminLoginGate";
import {
  ADMIN_SESSION_COOKIE_NAME,
  isAdminDashboardConfigured,
  isAdminSessionTokenValid,
} from "@/lib/admin-auth";
import { cookies } from "next/headers";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!isAdminDashboardConfigured()) {
    return (
      <Section
        title="ADMIN DASHBOARD"
        description="Protected admin access is not configured on the server yet."
        headingLevel={1}
      >
        <div className="max-w-3xl rounded-2xl border border-white/10 bg-[#11151C]/70 p-6 text-sm leading-relaxed text-[#AAB6C6] shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)]">
          Set <code>ADMIN_DASHBOARD_PASSWORD</code> on the server to enable the new admin route.
          If you do not set it, the dashboard falls back to <code>SOUNDCLOUD_TOKEN_EXPORT_KEY</code>.
        </div>
      </Section>
    );
  }

  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value ?? "";

  if (!isAdminSessionTokenValid(sessionToken)) {
    return (
      <Section
        title="ADMIN DASHBOARD"
        description="This area is protected behind a password screen."
        headingLevel={1}
      >
        <AdminLoginGate />
      </Section>
    );
  }

  return <>{children}</>;
}
