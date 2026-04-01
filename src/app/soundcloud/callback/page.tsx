import SoundCloudCallbackClient from "@/components/SoundCloudCallbackClient";
import { buildPageMetadata, siteName } from "@/lib/site-meta";

export const metadata = buildPageMetadata({
  title: `${siteName} | SoundCloud Callback`,
  description: "Finalizing the SoundCloud OAuth handshake.",
  path: "/soundcloud/callback",
  robots: "noindex,nofollow",
});

export default function SoundCloudCallbackPage() {
  return <SoundCloudCallbackClient />;
}
