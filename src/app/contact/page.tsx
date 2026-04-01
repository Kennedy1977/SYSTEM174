import Card from "@/components/Card";
import Section from "@/components/Section";
import SocialPlatformIcon from "@/components/SocialPlatformIcon";
import { getSiteVariant } from "@/lib/site-config";
import { buildPageMetadata, siteName } from "@/lib/site-meta";

export const metadata = buildPageMetadata({
  title: `${siteName} | Contact`,
  description: `Management and verified platform links for ${siteName}.`,
  path: "/contact",
});

const system174Links = [
  {
    label: "SoundCloud",
    platform: "soundcloud" as const,
    href: "https://soundcloud.com/system174",
    note: "Direct profile",
  },
  {
    label: "Spotify",
    platform: "spotify" as const,
    href: "https://open.spotify.com/artist/3atPE4TuVWhu8uV9p0QbH6",
    note: "Verified artist page",
  },
  {
    label: "Apple Music",
    platform: "apple-music" as const,
    href: "https://music.apple.com/gb/artist/system-174/1882690381",
    note: "Verified artist page",
  },
  {
    label: "Amazon Music",
    platform: "amazon-music" as const,
    href: "https://music.amazon.co.uk/artists/B0GR9Z1SFX/system-174",
    note: "UK artist page",
  },
] as const;

const pimpsoulLinks = [
  {
    label: "SoundCloud",
    platform: "soundcloud" as const,
    href: "https://soundcloud.com/pimpsoul-project",
    note: "Direct profile",
  },
  {
    label: "Apple Music",
    platform: "apple-music" as const,
    href: "https://music.apple.com/gb/artist/the-pimpsoul-project/1750852619",
    note: "Artist page",
  },
  {
    label: "Amazon Music",
    platform: "amazon-music" as const,
    href: "https://music.amazon.com/artists/B0D5FP86SF/the-pimpsoul-project",
    note: "Artist page",
  },
  {
    label: "YouTube",
    platform: "youtube" as const,
    href: "https://www.youtube.com/@PIMPSOUL",
    note: "Channel",
  },
  {
    label: "YouTube Music",
    platform: "youtube-music" as const,
    href: "https://music.youtube.com/channel/UC1Vsx7jaPa0oXfvC9QLNZaA",
    note: "Channel",
  },
  {
    label: "Instagram",
    platform: "instagram" as const,
    href: "https://www.instagram.com/thepimpsoulproject/",
    note: "Profile",
  },
] as const;

export default function ContactPage() {
  const siteVariant = getSiteVariant();
  const isPimpsoulSite = siteVariant === "pimpsoul";
  const siteLinks = isPimpsoulSite ? pimpsoulLinks : system174Links;
  const introParagraphs = isPimpsoulSite
    ? [
        "Archive and platform links for The Pimpsoul Project.",
        "Use these links for the standalone catalogue and official artist outlets connected to this project.",
      ]
    : [
        "The active project. Dark, DJ-focused drum & bass built for pressure, with the current artist pages verified across the main streaming platforms below.",
        "Use these links for the live artist identity, current releases, and the active catalogue.",
      ];
  const notes = isPimpsoulSite
    ? [
        "This page only lists The Pimpsoul Project outlets and archive links connected to that catalogue.",
        "YouTube, YouTube Music, Instagram, Apple Music, Amazon Music, and SoundCloud are included where they were identified for this project.",
      ]
    : [
        "This page only lists SYSTEM 174 outlets and current artist links.",
        "Verified for SYSTEM 174: SoundCloud, Spotify, Apple Music, and Amazon Music. Amazon appears to use region-specific artist URLs, so this page uses the UK artist page.",
      ];

  return (
    <Section
      title="CONTACT"
      description={`Management and verified platform links for ${siteName}.`}
      headingLevel={1}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
              ARTIST LINKS
            </p>
            <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.01em] text-white">
              {siteName}
            </h2>
            {introParagraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]"
              >
                {paragraph}
              </p>
            ))}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {siteLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#0A0C10]/40 px-4 py-3 transition duration-150 ease-out hover:border-[#5CC8FF]/50 hover:bg-[#5CC8FF]/5"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-[#E7EDF6] transition-colors group-hover:text-[#5CC8FF]">
                    <SocialPlatformIcon platform={link.platform} className="h-6 w-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-body text-sm text-[#E7EDF6]">
                      {link.label}
                    </span>
                    <span className="mt-1 block text-xs text-[#77849A]">{link.note}</span>
                  </span>
                </a>
              ))}
            </div>
          </Card>

          <Card>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
              Management
            </p>
            <p className="mt-3 text-sm text-[#AAB6C6]">UNIT 174 MANAGEMENT</p>
            <a
              href="mailto:mgmt@umsl.co.uk"
              className="mt-1 inline-block text-base text-[#E7EDF6] transition-colors hover:text-[#5CC8FF]"
            >
              mgmt@umsl.co.uk
            </a>
            <p className="mt-4 font-body text-[14px] leading-relaxed text-[#77849A]">
              For bookings, press, radio, or release enquiries, use the management address above.
            </p>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <Card>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">NOTES</p>
            {notes.map((note) => (
              <p
                key={note}
                className="mt-3 font-body text-[14px] leading-relaxed text-[#AAB6C6]"
              >
                {note}
              </p>
            ))}
            {!isPimpsoulSite ? (
              <p className="mt-4 font-body text-[14px] leading-relaxed text-[#77849A]">
                I did not find a clearly verified official Instagram, YouTube, or Bandcamp profile
                for SYSTEM 174 during this pass, so they are left off rather than guessed.
              </p>
            ) : null}
          </Card>
        </div>
      </div>
    </Section>
  );
}
