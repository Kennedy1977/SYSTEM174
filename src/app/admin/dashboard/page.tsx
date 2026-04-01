import Section from "@/components/Section";
import SoundCloudAdminNav from "@/components/SoundCloudAdminNav";
import SoundCloudStatusPanel from "@/components/SoundCloudStatusPanel";
import { buildPageMetadata, siteName } from "@/lib/site-meta";

export const metadata = buildPageMetadata({
  title: `${siteName} | Admin Dashboard`,
  description:
    "Protected admin utility for checking live SoundCloud connection health, refreshing the cache, and assigning tracks.",
  path: "/admin/dashboard",
  robots: "noindex,nofollow",
});

export default function AdminDashboardPage() {
  return (
    <Section
      title="ADMIN DASHBOARD"
      description="Protected SoundCloud admin area for connection checks, cache control, and track assignment."
      headingLevel={1}
    >
      <div className="mb-6 sm:mb-8">
        <SoundCloudAdminNav showStatusSections />
      </div>
      <SoundCloudStatusPanel />
    </Section>
  );
}
