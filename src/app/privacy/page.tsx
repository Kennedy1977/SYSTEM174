import Card from "@/components/Card";
import Section from "@/components/Section";
import {
  buildPageMetadata,
  siteAnalyticsMeasurementId,
  siteConsentCookieDurationDays,
  siteConsentCookieName,
  siteControllerName,
  siteHostName,
  siteName,
  sitePrivacyContactEmail,
  sitePrivacyLastUpdated,
} from "@/lib/site-meta";

export const metadata = buildPageMetadata({
  title: `Privacy Policy | ${siteName}`,
  description:
    `Privacy policy for ${siteHostName} covering analytics, cookies, technical logs, and contact by email.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Section
      title="PRIVACY POLICY"
      description={`This policy explains what personal data ${siteHostName} may process, why it is used, and what choices and rights visitors have.`}
      headingLevel={1}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <p className="label-ui">Controller</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Who is responsible
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            {siteControllerName} is responsible for this website and the personal data processed
            through it.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Privacy contact:
            <a
              href={`mailto:${sitePrivacyContactEmail}`}
              className="ml-1 text-accent underline decoration-[#5CC8FF]/40 underline-offset-4 transition hover:text-white"
            >
              {sitePrivacyContactEmail}
            </a>
          </p>
          <p className="mt-3 font-body text-[14px] leading-relaxed text-[#77849A]">
            Last updated: {sitePrivacyLastUpdated}
          </p>
        </Card>

        <Card>
          <p className="label-ui">Site Scope</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            What the site does not do
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            This site does not provide user accounts, comment areas, checkout, or on-site contact
            forms.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            The main personal data processing comes from technical website delivery, optional
            analytics, and any emails you choose to send to the published contact addresses.
          </p>
        </Card>

        <Card>
          <p className="label-ui">Your Controls</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Consent and choices
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Optional analytics is off by default and only switches on if you opt in through the
            cookie banner.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            You can reopen
            <span className="text-white"> Cookie settings </span>
            from the footer at any time.
          </p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="label-ui">Data We Process</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Technical data and logs
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            When you visit the site, our hosting and infrastructure providers may process routine
            technical data such as IP address, device and browser details, request URLs,
            timestamps, referrer information, and security or error logs.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            We use this information to deliver the website, keep it secure, troubleshoot faults,
            and protect the service from abuse.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Legal basis: legitimate interests in operating, securing, and improving the site.
          </p>
        </Card>

        <Card>
          <p className="label-ui">Data We Process</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Consent cookie
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            We use one necessary cookie named
            <span className="text-white"> {siteConsentCookieName} </span>
            to store whether you accepted or rejected optional analytics cookies.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Retention: up to {siteConsentCookieDurationDays} days.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Legal basis: legitimate interests in remembering and respecting your cookie choice.
          </p>
        </Card>

        <Card>
          <p className="label-ui">Optional Analytics</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Google Analytics 4
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            If you opt in, this site uses Google Analytics 4 with measurement ID
            <span className="text-white"> {siteAnalyticsMeasurementId} </span>
            to understand traffic levels, pages viewed, approximate location, device/browser
            trends, and how visitors move through the site.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            This may involve online identifiers and analytics cookies such as
            <span className="text-white"> _ga </span>
            and
            <span className="text-white"> _ga_* </span>
            .
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Legal basis: consent. If you reject or withdraw consent, analytics storage remains off.
          </p>
        </Card>

        <Card>
          <p className="label-ui">Contacting Us</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Email correspondence
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            If you choose to email the published contact addresses, we will process your name,
            email address, message content, and any other information you include so we can respond
            and manage the enquiry.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Email correspondence is handled through our email service providers.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Legal basis: legitimate interests in handling enquiries and managing bookings, press,
            and business communications.
          </p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="label-ui">Third Parties</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            External services and embeds
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            This site links to external platforms including SoundCloud, Spotify, Apple Music,
            Amazon Music, YouTube, YouTube Music, and Instagram. If you follow those links, those
            services process personal data under their own terms and privacy policies.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            If you play SoundCloud content through embedded or widget-based players, your browser
            will connect to SoundCloud and related services, which may receive technical data such
            as your IP address, browser details, and device information.
          </p>
        </Card>

        <Card>
          <p className="label-ui">Recipients and Transfers</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Who may receive data
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Depending on how you use the site, recipients may include our hosting and
            infrastructure providers, Google Analytics for optional site analytics, and our email
            service providers used to receive business enquiries.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Some of these providers may process data outside the UK. Where that happens, data is
            transferred under the provider&apos;s own safeguards and legal arrangements.
          </p>
        </Card>

        <Card>
          <p className="label-ui">Retention</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            How long data is kept
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Technical logs are kept for as long as reasonably necessary for security, stability,
            and troubleshooting.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Email correspondence is kept for as long as needed to deal with the enquiry and
            maintain relevant business records.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Google Analytics data is retained within Google Analytics according to the property
            retention settings configured for this website.
          </p>
        </Card>

        <Card>
          <p className="label-ui">Your Rights</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Rights and complaints
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            Subject to applicable law, you may have the right to request access, rectification,
            erasure, restriction, objection, and data portability, and to withdraw consent for
            analytics at any time.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            If you have a privacy concern, contact
            <a
              href={`mailto:${sitePrivacyContactEmail}`}
              className="ml-1 text-accent underline decoration-[#5CC8FF]/40 underline-offset-4 transition hover:text-white"
            >
              {sitePrivacyContactEmail}
            </a>
            first.
          </p>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            You also have the right to complain to the Information Commissioner&apos;s Office:
            <a
              href="https://ico.org.uk/make-a-complaint/"
              target="_blank"
              rel="noreferrer"
              className="ml-1 text-accent underline decoration-[#5CC8FF]/40 underline-offset-4 transition hover:text-white"
            >
              ico.org.uk/make-a-complaint
            </a>
            .
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <p className="label-ui">Related Notice</p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[-0.015em] text-white">
            Cookies and analytics choices
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
            For cookie-specific information, including the consent banner and analytics controls,
            see the
            <a
              href="/cookies"
              className="ml-1 text-accent underline decoration-[#5CC8FF]/40 underline-offset-4 transition hover:text-white"
            >
              cookie notice
            </a>
            .
          </p>
        </Card>
      </div>
    </Section>
  );
}
