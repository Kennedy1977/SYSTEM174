import Section from "@/components/Section";
import SoundCloudAdminNav from "@/components/SoundCloudAdminNav";
import SoundCloudTokenExportPanel from "@/components/SoundCloudTokenExportPanel";
import { buildPageMetadata } from "@/lib/site-meta";

export const metadata = buildPageMetadata({
  title: "SYSTEM 174 | Admin Token Export",
  description:
    "Protected admin utility for exporting the current SoundCloud OAuth token pair.",
  path: "/admin/dashboard/tokens",
  robots: "noindex,nofollow",
});

export default function AdminDashboardTokensPage() {
  return (
    <Section
      title="TOKEN EXPORT"
      description="Protected admin utility for copying the current SoundCloud token pair into persistent server environment settings."
      headingLevel={1}
    >
      <div className="mb-6 sm:mb-8">
        <SoundCloudAdminNav />
      </div>
      <SoundCloudTokenExportPanel />
    </Section>
  );
}
