import Section from "@/components/Section";
import SoundCloudStatusPanel from "@/components/SoundCloudStatusPanel";
import { buildPageMetadata } from "@/lib/site-meta";

export const metadata = buildPageMetadata({
  title: "SYSTEM 174 | SoundCloud Status",
  description: "Temporary admin utility for checking live SoundCloud connection health.",
  path: "/soundcloud/status",
  robots: "noindex,nofollow",
});

export default function SoundCloudStatusPage() {
  return (
    <Section
      title="SOUNDCLOUD STATUS"
      description="Temporary admin utility. Set SOUNDCLOUD_TOKEN_EXPORT_KEY on the server, enter it here, and check whether the live SoundCloud configuration, tokens, and API requests are healthy."
      headingLevel={1}
    >
      <SoundCloudStatusPanel />
    </Section>
  );
}
