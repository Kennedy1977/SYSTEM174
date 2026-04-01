import ButtonSecondary from "@/components/ButtonSecondary";
import Card from "@/components/Card";
import MediaDownloadCard from "@/components/MediaDownloadCard";
import Section from "@/components/Section";
import { mediaDownloads } from "@/data/site";
import { getSiteVariant } from "@/lib/site-config";
import { buildPageMetadata, siteName } from "@/lib/site-meta";

export const metadata = buildPageMetadata({
  title: `${siteName} | Media`,
  description: "Press assets and documents for promoters, venues, and editorial.",
  path: "/media",
});

export default function MediaPage() {
  const siteVariant = getSiteVariant();
  const shortBio =
    siteVariant === "pimpsoul"
      ? "The Pimpsoul Project delivers bass-led crossover pressure, hybrid club structures, and techno x drum & bass movement."
      : "SYSTEM 174 engineers dark, high-pressure sets optimized for industrial rooms and peak-hour endurance.";

  return (
    <Section
      title="MEDIA KIT"
      description="Press assets and documents for promoters, venues, and editorial."
      headingLevel={1}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
        <div className="md:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            {mediaDownloads.map((item) => (
              <MediaDownloadCard key={item.title} item={item} />
            ))}
          </div>
        </div>
        <div className="space-y-6 md:col-span-4">
          <Card>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
              Short Bio
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#AAB6C6]">
              {shortBio}
            </p>
            <div className="mt-4">
              <ButtonSecondary>COPY</ButtonSecondary>
            </div>
          </Card>
          <Card>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
              Booking
            </p>
            <p className="mt-3 text-sm text-[#AAB6C6]">booking@controlled-detonation.com</p>
          </Card>
        </div>
      </div>
    </Section>
  );
}
