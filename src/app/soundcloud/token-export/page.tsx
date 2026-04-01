import Section from "@/components/Section";
import SoundCloudTokenExportPanel from "@/components/SoundCloudTokenExportPanel";
import { buildPageMetadata } from "@/lib/site-meta";

export const metadata = buildPageMetadata({
  title: "SYSTEM 174 | SoundCloud Token Export",
  description: "Temporary admin utility for exporting the current SoundCloud OAuth token pair.",
  path: "/soundcloud/token-export",
  robots: "noindex,nofollow",
});

export default function SoundCloudTokenExportPage() {
  return (
    <Section
      title="TOKEN EXPORT"
      description="Temporary admin utility. Set SOUNDCLOUD_TOKEN_EXPORT_KEY on the server, enter it here, copy the current tokens into your persistent env, then remove the export key again."
      headingLevel={1}
    >
      <SoundCloudTokenExportPanel />
    </Section>
  );
}
