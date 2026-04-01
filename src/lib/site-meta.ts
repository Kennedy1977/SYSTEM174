import type { Metadata } from "next";

export const siteName = "SYSTEM 174";
export const siteTitle = "SYSTEM 174 | Official Site";
export const siteDefaultDescription =
  "SYSTEM 174 is the current drum & bass project of Andy K - 174 BPM pressure, dark DJ-focused tracks, and connected legacy material from Andy K and The Pimpsoul Project.";
export const siteThemeColor = "#000000";
export const siteLocale = "en_GB";
export const siteRobots =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
export const siteSocialImagePath = "/assets/img/system174-social-share.jpg";
export const siteSocialImageAlt = "SYSTEM 174 official artist artwork";
export const siteFaviconIcoPath = "/favicon.ico";
export const siteFaviconPngPath = "/assets/img/favicon-512.png";
export const siteAppleTouchIconPath = "/assets/img/apple-touch-icon.png";
export const siteAnalyticsMeasurementId = "G-0EDDDZ0WGG";
export const siteConsentCookieName = "system174_cookie_consent";
export const siteConsentCookieDurationDays = 180;
export const siteControllerName = "Andy K trading as SYSTEM 174";
export const sitePrivacyContactEmail = "mgmt@umsl.co.uk";
export const sitePrivacyLastUpdated = "31 March 2026";
export const siteOrigin = process.env.SITE_URL ?? "https://system174.co.uk";
const siteOriginBase = siteOrigin.replace(/\/+$/, "");

export function getAbsoluteSiteUrl(pathname = "/") {
  return new URL(pathname, siteOrigin).toString();
}

type BuildPageMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  robots?: string;
};

export function buildPageMetadata({
  title = siteTitle,
  description = siteDefaultDescription,
  path = "/",
  robots = siteRobots,
}: BuildPageMetadataInput = {}): Metadata {
  return {
    metadataBase: new URL(siteOrigin),
    title,
    description,
    robots,
    alternates: {
      canonical: path,
    },
    openGraph: {
      locale: siteLocale,
      type: "website",
      siteName,
      title,
      description,
      url: path,
      images: [
        {
          url: siteSocialImagePath,
          alt: siteSocialImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteSocialImagePath],
    },
  };
}

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteOriginBase}/#website`,
      url: `${siteOriginBase}/`,
      name: "SYSTEM 174",
      alternateName: "System 174",
      inLanguage: "en-GB",
    },
    {
      "@type": "ProfilePage",
      "@id": `${siteOriginBase}/#webpage`,
      url: `${siteOriginBase}/`,
      name: "SYSTEM 174 | Official Site",
      isPartOf: {
        "@id": `${siteOriginBase}/#website`,
      },
      mainEntity: {
        "@id": `${siteOriginBase}/#system174`,
      },
      mentions: [{ "@id": `${siteOriginBase}/#andyk` }, { "@id": `${siteOriginBase}/#pimpsoul` }],
      description:
        "SYSTEM 174 is the current active drum and bass project of Andy K. Andy K and The Pimpsoul Project are connected archive and legacy identities by the same artist.",
    },
    {
      "@type": "Person",
      "@id": `${siteOriginBase}/#andyk-artist`,
      name: "Andy K",
      url: `${siteOriginBase}/`,
      description:
        "Electronic music producer and creator of SYSTEM 174, Andy K, and The Pimpsoul Project.",
    },
    {
      "@type": "MusicGroup",
      "@id": `${siteOriginBase}/#system174`,
      name: "SYSTEM 174",
      alternateName: "System 174",
      url: `${siteOriginBase}/`,
      description:
        "SYSTEM 174 is the current active drum and bass project of Andy K, focused on dark, controlled, DJ-functional 174 BPM music.",
      genre: ["Drum and Bass", "Jungle", "Breakbeat", "Techno"],
      founder: {
        "@id": `${siteOriginBase}/#andyk-artist`,
      },
      member: {
        "@id": `${siteOriginBase}/#andyk-artist`,
      },
      sameAs: [
        "https://soundcloud.com/system174",
        "https://music.apple.com/gb/artist/system-174/1882690381",
        "https://open.spotify.com/artist/3atPE4TuVWhu8uV9p0QbH6",
        "https://music.amazon.co.uk/artists/B0GR9Z1SFX/system-174",
      ],
    },
    {
      "@type": "MusicGroup",
      "@id": `${siteOriginBase}/#pimpsoul`,
      name: "The Pimpsoul Project",
      url: `${siteOriginBase}/#the-pimpsoul-project`,
      description:
        "A completed techno x drum and bass crossover project by Andy K active from 2023 to 2025.",
      founder: {
        "@id": `${siteOriginBase}/#andyk-artist`,
      },
      member: {
        "@id": `${siteOriginBase}/#andyk-artist`,
      },
      sameAs: [
        "https://soundcloud.com/pimpsoul-project",
        "https://music.apple.com/gb/artist/the-pimpsoul-project/1750852619",
        "https://music.amazon.com/artists/B0D5FP86SF/the-pimpsoul-project",
        "https://www.youtube.com/@PIMPSOUL",
        "https://music.youtube.com/channel/UC1Vsx7jaPa0oXfvC9QLNZaA",
        "https://www.instagram.com/thepimpsoulproject/",
      ],
    },
    {
      "@type": "MusicGroup",
      "@id": `${siteOriginBase}/#andyk`,
      name: "Andy K",
      url: `${siteOriginBase}/#andy-k`,
      description:
        "Archive identity for underground electronic material by Andy K from 1996 to 2015.",
      founder: {
        "@id": `${siteOriginBase}/#andyk-artist`,
      },
      member: {
        "@id": `${siteOriginBase}/#andyk-artist`,
      },
    },
  ],
} as const;
