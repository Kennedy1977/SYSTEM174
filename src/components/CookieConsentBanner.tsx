"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ConsentState = {
  hasDecision: boolean;
  analytics: boolean;
  updatedAt: string | null;
};

const defaultConsentState: ConsentState = {
  hasDecision: false,
  analytics: false,
  updatedAt: null,
};

export default function CookieConsentBanner() {
  const [consentState, setConsentState] = useState<ConsentState>(defaultConsentState);
  const [forcedOpen, setForcedOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const isVisible = useMemo(() => ready && (forcedOpen || !consentState.hasDecision), [consentState.hasDecision, forcedOpen, ready]);
  const showPanel = isVisible && panelOpen;

  useEffect(() => {
    const syncFromManager = () => {
      const nextState = window.system174ConsentManager?.getState?.() ?? defaultConsentState;
      setConsentState(nextState);
      setReady(true);
    };

    const handleConsentUpdated = () => {
      syncFromManager();
    };

    const handleOpenSettings = () => {
      setForcedOpen(true);
      setPanelOpen(true);
      syncFromManager();
    };

    const handleAnalyticsReady = () => {
      syncFromManager();
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const trigger = target.closest("[data-open-cookie-settings]");
      if (!(trigger instanceof HTMLElement)) {
        return;
      }

      event.preventDefault();
      handleOpenSettings();
    };

    syncFromManager();
    const frameId = window.requestAnimationFrame(syncFromManager);
    const timeoutId = window.setTimeout(syncFromManager, 60);

    window.addEventListener("system174:consent-updated", handleConsentUpdated);
    window.addEventListener("system174:open-cookie-settings", handleOpenSettings);
    window.addEventListener("system174:analytics-ready", handleAnalyticsReady);
    document.addEventListener("click", handleDocumentClick);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      window.removeEventListener("system174:consent-updated", handleConsentUpdated);
      window.removeEventListener("system174:open-cookie-settings", handleOpenSettings);
      window.removeEventListener("system174:analytics-ready", handleAnalyticsReady);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  const saveConsent = (analyticsGranted: boolean) => {
    window.system174ConsentManager?.setAnalyticsConsent?.(analyticsGranted);
    const nextState = window.system174ConsentManager?.getState?.() ?? {
      ...defaultConsentState,
      hasDecision: true,
      analytics: analyticsGranted,
      updatedAt: new Date().toISOString(),
    };

    setConsentState(nextState);
    setForcedOpen(false);
    setPanelOpen(false);
    setReady(true);
  };

  const handleManageClick = () => {
    if (panelOpen) {
      setPanelOpen(false);
      if (consentState.hasDecision) {
        setForcedOpen(false);
      }
      return;
    }

    setForcedOpen(true);
    setPanelOpen(true);
  };

  return (
    <div
      id="cookie-consent-root"
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] px-3 sm:px-5"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <section
        id="cookie-consent-banner"
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        aria-live="polite"
        aria-hidden={isVisible ? "false" : "true"}
        data-visible={isVisible ? "true" : "false"}
        className={[
          "pointer-events-auto mx-auto w-full max-w-5xl rounded-[1.75rem] border border-[#5CC8FF]/20 bg-[#0F131A]/95 shadow-[0_28px_80px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl transition duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0",
        ].join(" ")}
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#5CC8FF]/70 to-transparent"></div>
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="label-ui">Privacy Controls</p>
              <h2
                id="cookie-consent-title"
                tabIndex={-1}
                className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white"
              >
                Analytics stays off until you say yes.
              </h2>
              <p
                id="cookie-consent-description"
                className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]"
              >
                We use one essential cookie to remember your choice and optional Google Analytics
                cookies to understand site traffic. Reject keeps analytics off. You can review the
                details in our{" "}
                <Link
                  href="/cookies"
                  className="text-accent underline decoration-[#5CC8FF]/40 underline-offset-4 transition hover:text-white"
                >
                  cookie notice
                </Link>{" "}
                and change your choice at any time.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:max-w-[22rem] lg:justify-end">
              <button
                type="button"
                data-consent-action="manage"
                aria-controls="cookie-consent-panel"
                aria-expanded={showPanel ? "true" : "false"}
                onClick={handleManageClick}
                className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E7EDF6] transition hover:border-white/30 hover:bg-white/10"
              >
                Manage settings
              </button>
              <button
                type="button"
                data-consent-action="reject"
                onClick={() => saveConsent(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/18 bg-[#0A0C10] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white/40 hover:bg-white/6"
              >
                Reject analytics
              </button>
              <button
                type="button"
                data-consent-action="accept"
                onClick={() => saveConsent(true)}
                className="inline-flex items-center justify-center rounded-full border border-[#5CC8FF]/60 bg-[#5CC8FF] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0A0C10] transition hover:border-[#8BD9FF] hover:bg-[#8BD9FF]"
              >
                Accept analytics
              </button>
            </div>
          </div>

          <div
            id="cookie-consent-panel"
            className={`mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5 ${showPanel ? "" : "hidden"}`}
          >
            <div className="grid gap-4">
              <div className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="label-ui">Required</p>
                  <h3 className="mt-2 font-display text-lg uppercase tracking-[-0.01em] text-white">
                    Necessary cookie
                  </h3>
                  <p className="mt-2 font-body text-[14px] leading-relaxed text-[#AAB6C6]">
                    Stores your consent choice so the site can respect it on future visits.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-white/14 bg-white/6 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E7EDF6]">
                  Always active
                </span>
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="label-ui">Optional</p>
                  <h3 className="mt-2 font-display text-lg uppercase tracking-[-0.01em] text-white">
                    Google Analytics
                  </h3>
                  <p className="mt-2 font-body text-[14px] leading-relaxed text-[#AAB6C6]">
                    Helps us understand visits, pages viewed, and traffic sources. It stays
                    disabled unless you turn it on.
                  </p>
                </div>
                <label className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/5 px-4 py-3 text-sm text-[#E7EDF6]">
                  <input
                    id="cookie-consent-analytics"
                    data-consent-role="analytics-toggle"
                    type="checkbox"
                    checked={consentState.analytics}
                    onChange={(event) => {
                      setConsentState((current) => ({
                        ...current,
                        analytics: event.currentTarget.checked,
                      }));
                    }}
                    className="h-5 w-5 accent-[#5CC8FF]"
                  />
                  <span>Allow analytics cookies</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 sm:justify-end">
              <Link
                href="/cookies"
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E7EDF6] transition hover:border-white/30 hover:bg-white/10"
              >
                Read cookie notice
              </Link>
              <button
                type="button"
                data-consent-action="save"
                onClick={() => saveConsent(consentState.analytics)}
                className="inline-flex items-center justify-center rounded-full border border-[#5CC8FF]/35 bg-[#15202D] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E7EDF6] transition hover:border-[#5CC8FF]/60 hover:text-white"
              >
                Save choices
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
