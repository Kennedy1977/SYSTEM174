"use client";

import { useEffect } from "react";
import {
  siteAnalyticsMeasurementId,
  siteConsentCookieDurationDays,
  siteConsentCookieName,
} from "@/lib/site-meta";

export default function AnalyticsBoot() {
  useEffect(() => {
    const runtimeWindow = window;

    const analyticsMeasurementId = siteAnalyticsMeasurementId;
    const consentCookieName = siteConsentCookieName;
    const consentCookieMaxAge = siteConsentCookieDurationDays * 24 * 60 * 60;

    runtimeWindow.dataLayer = runtimeWindow.dataLayer || [];
    runtimeWindow.gtag =
      runtimeWindow.gtag ||
      function gtag(...args: unknown[]) {
        runtimeWindow.dataLayer?.push(args);
      };

    const deniedConsentState = {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    } as const;

    const readCookie = (name: string) => {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
      return match ? decodeURIComponent(match[1]) : null;
    };

    const writeCookie = (name: string, value: string, maxAge: number) => {
      const parts = [`${name}=${encodeURIComponent(value)}`, `Max-Age=${maxAge}`, "Path=/", "SameSite=Lax"];
      if (window.location.protocol === "https:") {
        parts.push("Secure");
      }
      document.cookie = parts.join("; ");
    };

    const expireCookie = (name: string, domain?: string) => {
      const parts = [`${name}=`, "Expires=Thu, 01 Jan 1970 00:00:00 GMT", "Max-Age=0", "Path=/", "SameSite=Lax"];
      if (domain) {
        parts.push(`Domain=${domain}`);
      }
      if (window.location.protocol === "https:") {
        parts.push("Secure");
      }
      document.cookie = parts.join("; ");
    };

    const getCookieDomainCandidates = () => {
      const hostname = window.location.hostname;
      const hostParts = hostname.split(".");
      if (hostParts.length < 2) {
        return [hostname];
      }

      const baseDomain = hostParts.slice(-2).join(".");
      return Array.from(new Set([hostname, `.${hostname}`, baseDomain, `.${baseDomain}`]));
    };

    const clearAnalyticsCookies = () => {
      const measurementSuffix = analyticsMeasurementId.replace(/^G-/, "");
      const cookieNames = ["_ga", `_ga_${measurementSuffix}`];
      const domains = [undefined, ...getCookieDomainCandidates()];
      for (const cookieName of cookieNames) {
        for (const domain of domains) {
          expireCookie(cookieName, domain);
        }
      }
    };

    const parseStoredConsent = () => {
      const rawValue = readCookie(consentCookieName);
      if (!rawValue) return null;

      try {
        const parsed = JSON.parse(rawValue);
        if (typeof parsed?.analytics !== "boolean") {
          return null;
        }

        return {
          analytics: parsed.analytics,
          updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
        };
      } catch {
        return null;
      }
    };

    const getStoredConsentState = () => {
      const parsed = parseStoredConsent();
      return {
        hasDecision: Boolean(parsed),
        analytics: parsed?.analytics === true,
        updatedAt: parsed?.updatedAt ?? null,
      };
    };

    const applyGoogleConsent = (analyticsGranted: boolean) => {
      if (!analyticsGranted) {
        clearAnalyticsCookies();
      }

      runtimeWindow.gtag?.("consent", "update", {
        ...deniedConsentState,
        analytics_storage: analyticsGranted ? "granted" : "denied",
      });
    };

    const trackPageView = () => {
      const consentState = getStoredConsentState();
      if (!consentState.analytics) return;

      const pageKey = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (runtimeWindow.__system174LastTrackedPage === pageKey) {
        return;
      }

      runtimeWindow.__system174LastTrackedPage = pageKey;
      runtimeWindow.gtag?.("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_path: `${window.location.pathname}${window.location.search}`,
      });
    };

    runtimeWindow.system174ConsentManager = {
      cookieName: consentCookieName,
      cookieMaxAge: consentCookieMaxAge,
      getState: getStoredConsentState,
      setAnalyticsConsent: (analyticsGranted: boolean) => {
        writeCookie(
          consentCookieName,
          JSON.stringify({
            analytics: Boolean(analyticsGranted),
            updatedAt: new Date().toISOString(),
            version: 1,
          }),
          consentCookieMaxAge,
        );

        applyGoogleConsent(Boolean(analyticsGranted));

        const state = getStoredConsentState();
        window.dispatchEvent(new CustomEvent("system174:consent-updated", { detail: state }));

        if (state.analytics) {
          trackPageView();
        }
      },
      openSettings: () => {
        window.dispatchEvent(new Event("system174:open-cookie-settings"));
      },
      trackPageView,
    };

    window.dispatchEvent(new Event("system174:analytics-ready"));

    if (!runtimeWindow.__system174AnalyticsInitialized) {
      runtimeWindow.gtag?.("consent", "default", {
        ...deniedConsentState,
        wait_for_update: 500,
      });

      const storedConsentState = getStoredConsentState();
      if (storedConsentState.hasDecision) {
        applyGoogleConsent(storedConsentState.analytics);
      }

      runtimeWindow.gtag?.("set", "ads_data_redaction", true);
      runtimeWindow.gtag?.("js", new Date());
      runtimeWindow.gtag?.("config", analyticsMeasurementId, {
        anonymize_ip: true,
        send_page_view: false,
      });

      runtimeWindow.__system174AnalyticsInitialized = true;
    }

    if (!document.querySelector(`script[data-gtag-id="${analyticsMeasurementId}"]`)) {
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsMeasurementId}`;
      script.async = true;
      script.dataset.gtagId = analyticsMeasurementId;
      document.head.appendChild(script);
    }
  }, []);

  return null;
}
