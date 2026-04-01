import SoundCloudCallbackClient from "@/components/SoundCloudCallbackClient";
import { buildPageMetadata } from "@/lib/site-meta";

export const metadata = buildPageMetadata({
  title: "SYSTEM 174 | SoundCloud Callback",
  description: "Finalizing the SoundCloud OAuth handshake.",
  path: "/soundcloud/callback",
  robots: "noindex,nofollow",
});

export default function SoundCloudCallbackPage() {
  return <SoundCloudCallbackClient />;
}
