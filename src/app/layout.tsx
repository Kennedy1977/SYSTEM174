import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import "@/styles/global.css";
import AnalyticsBoot from "@/components/AnalyticsBoot";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import PageLifecycle from "@/components/PageLifecycle";
import PersistentSoundCloudPlayer from "@/components/PersistentSoundCloudPlayer";
import RouteTransition from "@/components/RouteTransition";
import { getSiteVariant } from "@/lib/site-config";
import {
  siteAppleTouchIconPath,
  siteDefaultDescription,
  siteFaviconIcoPath,
  siteFaviconPngPath,
  siteLocale,
  siteName,
  siteOrigin,
  siteRobots,
  siteSocialImageAlt,
  siteSocialImagePath,
  siteThemeColor,
  siteTitle,
} from "@/lib/site-meta";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: siteTitle,
  description: siteDefaultDescription,
  applicationName: siteName,
  robots: siteRobots,
  openGraph: {
    locale: siteLocale,
    type: "website",
    siteName,
    title: siteTitle,
    description: siteDefaultDescription,
    images: [
      {
        url: siteSocialImagePath,
        alt: siteSocialImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDefaultDescription,
    images: [siteSocialImagePath],
  },
  icons: {
    icon: [
      { url: siteFaviconIcoPath, sizes: "any" },
      { url: siteFaviconPngPath, type: "image/png" },
    ],
    apple: [{ url: siteAppleTouchIconPath }],
  },
};

export const viewport: Viewport = {
  themeColor: siteThemeColor,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const siteVariant = getSiteVariant();

  return (
    <html lang="en-GB">
      <body className="site-bg" data-site-variant={siteVariant}>
        <AnalyticsBoot />
        <Suspense fallback={null}>
          <PageLifecycle />
        </Suspense>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div className="site-bg-main"></div>
        <CookieConsentBanner />
        <div className="site-content">
          <Nav />
          <main id="main-content" tabIndex={-1} className="flex-1">
            <Suspense fallback={children}>
              <RouteTransition>{children}</RouteTransition>
            </Suspense>
          </main>
          <Footer />
        </div>
        <PersistentSoundCloudPlayer />
      </body>
    </html>
  );
}
