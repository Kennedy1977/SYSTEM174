import Link from "next/link";
import Card from "@/components/Card";
import Section from "@/components/Section";
import ShowRow from "@/components/ShowRow";
import { pastShows, upcomingShows } from "@/data/site";
import { buildPageMetadata, siteName } from "@/lib/site-meta";
import {
  getSearchParamValue,
  resolvePageSearchParams,
  type PageSearchParams,
} from "@/lib/next-search";

export const metadata = buildPageMetadata({
  title: `${siteName} | Shows`,
  description: "Upcoming runs first. Past dates available below.",
  path: "/shows",
});

type ShowsPageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams;
};

export default async function ShowsPage({ searchParams }: ShowsPageProps) {
  const params = await resolvePageSearchParams(searchParams);
  const view = getSearchParamValue(params, "view") === "past" ? "past" : "upcoming";

  return (
    <Section
      title="SHOWS"
      description="Upcoming runs first. Past dates available below."
      headingLevel={1}
    >
      <div className="mb-6 inline-flex rounded-xl border border-white/10 bg-[#11151C]/70 p-1">
        <Link
          href="/shows?view=upcoming"
          aria-current={view === "upcoming" ? "page" : undefined}
          className={[
            "rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] transition duration-150 ease-out",
            view === "upcoming"
              ? "border border-[#5CC8FF]/70 text-[#E7EDF6]"
              : "text-[#AAB6C6] hover:text-[#E7EDF6]",
          ].join(" ")}
        >
          Upcoming
        </Link>
        <Link
          href="/shows?view=past"
          aria-current={view === "past" ? "page" : undefined}
          className={[
            "rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] transition duration-150 ease-out",
            view === "past"
              ? "border border-[#5CC8FF]/70 text-[#E7EDF6]"
              : "text-[#AAB6C6] hover:text-[#E7EDF6]",
          ].join(" ")}
        >
          Past
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
        <div className="md:col-span-12">
          <Card>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
              {view === "upcoming" ? "Upcoming" : "Past"}
            </p>
            {(view === "upcoming" ? upcomingShows : pastShows).map((show) => (
              <ShowRow key={`${show.date}-${show.city}-${show.venue}`} show={show} />
            ))}
          </Card>
        </div>
      </div>
    </Section>
  );
}
