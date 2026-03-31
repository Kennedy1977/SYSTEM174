export const siteName = "SYSTEM 174";
export const siteTitle = "SYSTEM 174 | Official Site";
export const siteDefaultDescription =
  "SYSTEM 174 is the current drum & bass project of Andrew Kennedy - 174 BPM pressure, dark DJ-focused tracks, and connected legacy material from Andy K and The Pimpsoul Project.";
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
export const siteControllerName = "Andrew Kennedy trading as SYSTEM 174";
export const sitePrivacyContactEmail = "mgmt@umsl.co.uk";
export const sitePrivacyLastUpdated = "31 March 2026";

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://system174.co.uk/#website",
      url: "https://system174.co.uk/",
      name: "SYSTEM 174",
      alternateName: "System 174",
      inLanguage: "en-GB",
    },
    {
      "@type": "ProfilePage",
      "@id": "https://system174.co.uk/#webpage",
      url: "https://system174.co.uk/",
      name: "SYSTEM 174 | Official Site",
      isPartOf: {
        "@id": "https://system174.co.uk/#website",
      },
      mainEntity: {
        "@id": "https://system174.co.uk/#system174",
      },
      mentions: [{ "@id": "https://system174.co.uk/#andyk" }, { "@id": "https://system174.co.uk/#pimpsoul" }],
      description:
        "SYSTEM 174 is the current active drum and bass project of Andrew Kennedy. Andy K and The Pimpsoul Project are connected archive and legacy identities by the same artist.",
    },
    {
      "@type": "Person",
      "@id": "https://system174.co.uk/#andrewkennedy",
      name: "Andrew Kennedy",
      url: "https://system174.co.uk/",
      description:
        "Electronic music producer and creator of SYSTEM 174, Andy K, and The Pimpsoul Project.",
    },
    {
      "@type": "MusicGroup",
      "@id": "https://system174.co.uk/#system174",
      name: "SYSTEM 174",
      alternateName: "System 174",
      url: "https://system174.co.uk/",
      description:
        "SYSTEM 174 is the current active drum and bass project of Andrew Kennedy, focused on dark, controlled, DJ-functional 174 BPM music.",
      genre: ["Drum and Bass", "Jungle", "Breakbeat", "Techno"],
      founder: {
        "@id": "https://system174.co.uk/#andrewkennedy",
      },
      member: {
        "@id": "https://system174.co.uk/#andrewkennedy",
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
      "@id": "https://system174.co.uk/#pimpsoul",
      name: "The Pimpsoul Project",
      url: "https://system174.co.uk/#the-pimpsoul-project",
      description:
        "A completed techno x drum and bass crossover project by Andrew Kennedy active from 2023 to 2025.",
      founder: {
        "@id": "https://system174.co.uk/#andrewkennedy",
      },
      member: {
        "@id": "https://system174.co.uk/#andrewkennedy",
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
      "@id": "https://system174.co.uk/#andyk",
      name: "Andy K",
      url: "https://system174.co.uk/#andy-k",
      description:
        "Archive identity for underground electronic material by Andrew Kennedy from 1996 to 2015.",
      founder: {
        "@id": "https://system174.co.uk/#andrewkennedy",
      },
      member: {
        "@id": "https://system174.co.uk/#andrewkennedy",
      },
    },
  ],
} as const;
