import type { Metadata } from "next";
import { getSiteVariant } from "./site-config";
import { siteContent } from "./site-content";

const siteVariant = getSiteVariant();

export const siteName = siteContent.name;
export const siteNavLabel = siteContent.navLabel;
export const siteTitle = siteContent.title;
export const siteDefaultDescription = siteContent.defaultDescription;
export const siteThemeColor = "#000000";
export const siteLocale = "en_GB";
export const siteRobots =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
export const siteSocialImagePath = "/assets/img/system174-social-share.jpg";
export const siteSocialImageAlt = siteContent.socialImageAlt;
export const siteFaviconIcoPath = "/favicon.ico";
export const siteFaviconPngPath = "/assets/img/favicon-512.png";
export const siteAppleTouchIconPath = "/assets/img/apple-touch-icon.png";
export const siteAnalyticsMeasurementId = "G-0EDDDZ0WGG";
export const siteConsentCookieName = siteContent.consentCookieName;
export const siteConsentCookieDurationDays = 180;
export const siteControllerName = siteContent.controllerName;
export const sitePrivacyContactEmail = "mgmt@umsl.co.uk";
export const sitePrivacyLastUpdated = "31 March 2026";
export const siteOrigin =
  process.env.SITE_URL ??
  (siteVariant === "pimpsoul"
    ? "https://pimpsoul.co.uk"
    : "https://system174.co.uk");
export const siteHostName = new URL(siteOrigin).hostname;
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
      name: siteName,
      alternateName: siteContent.musicGroupAlternateName ?? siteName,
      inLanguage: "en-GB",
    },
    {
      "@type": "ProfilePage",
      "@id": `${siteOriginBase}/#webpage`,
      url: `${siteOriginBase}/`,
      name: siteTitle,
      isPartOf: {
        "@id": `${siteOriginBase}/#website`,
      },
      mainEntity: {
        "@id": `${siteOriginBase}/#${siteContent.musicGroupId}`,
      },
      description: siteContent.profileDescription,
    },
    {
      "@type": "Person",
      "@id": `${siteOriginBase}/#andyk-artist`,
      name: "Andy K",
      url: `${siteOriginBase}/`,
      description: siteContent.personDescription,
    },
    {
      "@type": "MusicGroup",
      "@id": `${siteOriginBase}/#${siteContent.musicGroupId}`,
      name: siteContent.musicGroupName,
      alternateName: siteContent.musicGroupAlternateName,
      url: `${siteOriginBase}/`,
      description: siteContent.musicGroupDescription,
      genre: siteContent.musicGroupGenre,
      founder: {
        "@id": `${siteOriginBase}/#andyk-artist`,
      },
      member: {
        "@id": `${siteOriginBase}/#andyk-artist`,
      },
      sameAs: siteContent.sameAs,
    },
  ],
} as const;
