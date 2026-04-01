import Card from "@/components/Card";
import Section from "@/components/Section";
import {
  buildPageMetadata,
  siteAnalyticsMeasurementId,
  siteConsentCookieDurationDays,
  siteConsentCookieName,
} from "@/lib/site-meta";

export const metadata = buildPageMetadata({
  title: "Cookie Notice | SYSTEM 174",
  description:
    "Cookie notice for system174.co.uk covering essential consent storage and optional Google Analytics.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <Section
      title="COOKIE NOTICE"
      description="This page explains what the site stores, why it is used, and how you can change your cookie choice."
      headingLevel={1}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <p className="label-ui">Strictly Necessary</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Consent preference
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Cookie name: <span className="text-white">{siteConsentCookieName}</span>
          </p>
          <p className="mt-2 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Purpose: remembers whether you accepted or rejected optional analytics cookies so the
            site can respect your choice.
          </p>
          <p className="mt-2 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Retention: up to {siteConsentCookieDurationDays} days.
          </p>
        </Card>

        <Card>
          <p className="label-ui">Optional Analytics</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Google Analytics 4
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Measurement ID: <span className="text-white">{siteAnalyticsMeasurementId}</span>
          </p>
          <p className="mt-2 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            If you accept analytics, Google Analytics may use first-party cookies such as
            <span className="text-white"> _ga </span>
            and
            <span className="text-white"> _ga_* </span>
            to distinguish users and sessions and help us understand traffic and page usage.
          </p>
          <p className="mt-2 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            If you reject analytics, those analytics cookies stay off and the site continues to
            work normally.
          </p>
        </Card>

        <Card>
          <p className="label-ui">Your Choice</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Change consent anytime
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Use the
            <span className="text-white"> Cookie settings </span>
            control in the footer to reopen the consent panel and update your choice.
          </p>
          <p className="mt-2 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Deleting browser cookies may remove your saved preference, in which case the banner
            will appear again on your next visit.
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <p className="label-ui">More Information</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            How this works on SYSTEM 174
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            The Google tag loads site-wide, but analytics storage is denied by default. Analytics
            is only enabled after an explicit opt-in choice, and you can reverse that choice later
            from the footer controls.
          </p>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Our broader privacy information is available in the
            <a
              href="/privacy"
              className="ml-1 text-accent underline decoration-[#5CC8FF]/40 underline-offset-4 transition hover:text-white"
            >
              privacy policy
            </a>
            .
          </p>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Google explains Consent Mode and Analytics cookie usage here:
            <a
              href="https://developers.google.com/tag-platform/security/guides/consent?consentmode=advanced"
              target="_blank"
              rel="noreferrer"
              className="ml-1 text-accent underline decoration-[#5CC8FF]/40 underline-offset-4 transition hover:text-white"
            >
              Consent Mode guide
            </a>
            <span className="mx-2 text-[#5B6678]">/</span>
            <a
              href="https://support.google.com/analytics/answer/11397207"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline decoration-[#5CC8FF]/40 underline-offset-4 transition hover:text-white"
            >
              GA4 cookie usage
            </a>
          </p>
        </Card>
      </div>
    </Section>
  );
}
