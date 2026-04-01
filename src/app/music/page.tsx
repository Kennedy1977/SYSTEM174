import Link from "next/link";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import Card from "@/components/Card";
import Section from "@/components/Section";
import SoundCloudTrackCard from "@/components/SoundCloudTrackCard";
import { getCachedSoundCloudDashboardData } from "@/lib/soundcloud-dashboard-cache";
import { buildPageMetadata } from "@/lib/site-meta";
import { isSoundCloudPaginationEnabled } from "@/lib/site-config";
import { buildSystem174Catalog } from "@/lib/soundcloud-catalog";
import { getSoundCloudCatalogOverrides } from "@/lib/soundcloud-catalog-overrides";
import { getSoundCloudPlayerUrl } from "@/lib/soundcloud-embed";
import {
  getSearchParamValue,
  resolvePageSearchParams,
  type PageSearchParams,
} from "@/lib/next-search";

export const metadata = buildPageMetadata({
  title: "SYSTEM 174 | Music",
  description: "Tracks are synced from the connected SoundCloud account.",
  path: "/music",
});

export const dynamic = "force-dynamic";

type MusicPageProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams;
};

const TRACKS_PAGE_SIZE = 8;
const fallbackCoverUrl = "/textures/bg-main.png";

const isCoverOrBootleg = (item: { title: string }) => {
  const title = item.title.toLowerCase();
  return title.includes("cover") || title.includes("bootleg");
};

const isPrivateTrack = (item: { sharing?: string | null }) =>
  (item.sharing ?? "").toLowerCase() === "private";

const isBlockedByAccess = (item: { access?: string | null }) =>
  (item.access ?? "")
    .toLowerCase()
    .split(",")
    .map((part) => part.trim())
    .includes("blocked");

const hasTrackWord = (item: { title: string }) =>
  item.title.toLowerCase().includes("track");

const isRemixTrack = (item: { title: string }) =>
  item.title.toLowerCase().includes("remix");

export default async function MusicPage({ searchParams }: MusicPageProps) {
  const params = await resolvePageSearchParams(searchParams);
  const [dashboardData, catalogOverrides] = await Promise.all([
    getCachedSoundCloudDashboardData(),
    getSoundCloudCatalogOverrides(),
  ]);
  const soundcloud = buildSystem174Catalog(dashboardData, catalogOverrides);
  const tracks = soundcloud.tracks;
  const playlists = soundcloud.playlists;

  const selectedGenre = getSearchParamValue(params, "genre").trim();
  const selectedGenreKey = selectedGenre.toLowerCase();
  const remixParam = getSearchParamValue(params, "remix").trim().toLowerCase();
  const showRemix = remixParam === "on";
  const sortParam = getSearchParamValue(params, "sort").trim().toLowerCase();
  const sortBy =
    sortParam === "plays" || sortParam === "likes" ? sortParam : "newest";
  const trackSearch = getSearchParamValue(params, "q").trim();
  const trackSearchKey = trackSearch.toLowerCase();
  const paginationEnabled = isSoundCloudPaginationEnabled();
  const rawPage = Number(getSearchParamValue(params, "page") || "1");
  const requestedPage = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;

  const curatedTracks = tracks.filter(
    (track) =>
      !isPrivateTrack(track) &&
      !isBlockedByAccess(track) &&
      !isCoverOrBootleg(track) &&
      !hasTrackWord(track),
  );
  const remixFilteredTracks = curatedTracks.filter((track) =>
    showRemix ? isRemixTrack(track) : !isRemixTrack(track),
  );

  const allGenres = Array.from(
    new Set(
      [...tracks, ...playlists]
        .map((item) => (item.genre ?? "").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const filteredTracks = selectedGenre
    ? remixFilteredTracks.filter(
        (track) => (track.genre ?? "").trim().toLowerCase() === selectedGenreKey,
      )
    : remixFilteredTracks;

  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === "plays") {
      return (b.playback_count ?? 0) - (a.playback_count ?? 0);
    }
    if (sortBy === "likes") {
      return (b.favoritings_count ?? 0) - (a.favoritings_count ?? 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const searchedTracks = trackSearchKey
    ? sortedTracks.filter((track) =>
        track.title.toLowerCase().includes(trackSearchKey),
      )
    : sortedTracks;

  const totalTrackPages = Math.max(
    1,
    Math.ceil(searchedTracks.length / TRACKS_PAGE_SIZE),
  );
  const currentTrackPage = Math.min(requestedPage, totalTrackPages);
  const trackStartIndex = (currentTrackPage - 1) * TRACKS_PAGE_SIZE;

  const buildMusicUrl = (overrides?: {
    genre?: string | null;
    remix?: boolean;
    sort?: "newest" | "plays" | "likes";
    q?: string | null;
    page?: number | null;
  }) => {
    const urlParams = new URLSearchParams();
    const genre =
      overrides?.genre === undefined ? selectedGenre : overrides.genre ?? "";
    const remix =
      overrides?.remix === undefined ? showRemix : overrides.remix;
    const nextSort = overrides?.sort === undefined ? sortBy : overrides.sort;
    const q = overrides?.q === undefined ? trackSearch : overrides.q ?? "";
    const page =
      overrides?.page === undefined
        ? paginationEnabled
          ? currentTrackPage
          : null
        : overrides.page;

    if (genre) urlParams.set("genre", genre);
    if (remix) urlParams.set("remix", "on");
    if (nextSort && nextSort !== "newest") urlParams.set("sort", nextSort);
    if (q) urlParams.set("q", q);
    if (paginationEnabled && page && page > 1) {
      urlParams.set("page", String(page));
    }

    const query = urlParams.toString();
    return query ? `/music?${query}` : "/music";
  };

  const visibleTracks = (
    paginationEnabled
      ? searchedTracks.slice(trackStartIndex, trackStartIndex + TRACKS_PAGE_SIZE)
      : searchedTracks
  ).map((track) => ({
    id: track.id,
    title: track.title,
    genre: track.genre ?? "",
    artworkUrl: track.artwork_url ?? "",
    sourceUrl: track.permalink_url,
    playUrl: getSoundCloudPlayerUrl(track.permalink_url),
    pauseUrl: getSoundCloudPlayerUrl(track.permalink_url, false),
    href: track.permalink_url,
  }));

  return (
    <Section
      title="MUSIC"
      description="Tracks are synced from your connected SoundCloud account."
      headingLevel={1}
    >
      <div className="mb-10 rounded-2xl border border-white/10 bg-[#11151C]/70 p-5 sm:p-6">
        <AutoSubmitForm
          method="get"
          action="/music"
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {trackSearch ? <input type="hidden" name="q" value={trackSearch} /> : null}
          <div>
            <label htmlFor="music-filter-genre" className="label-ui">
              Genre
            </label>
            <select
              id="music-filter-genre"
              name="genre"
              defaultValue={selectedGenre}
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#1A2230] px-3 py-3 text-sm text-[#E7EDF6] focus:border-[#5CC8FF]/50 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/50"
            >
              <option value="">All genres</option>
              {allGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="music-filter-remix" className="label-ui">
              Track Filter
            </label>
            <select
              id="music-filter-remix"
              name="remix"
              defaultValue={showRemix ? "on" : "off"}
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#1A2230] px-3 py-3 text-sm text-[#E7EDF6] focus:border-[#5CC8FF]/50 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/50"
            >
              <option value="off">Originals</option>
              <option value="on">Remixes</option>
            </select>
          </div>
          <div>
            <label htmlFor="music-filter-sort" className="label-ui">
              Sort
            </label>
            <select
              id="music-filter-sort"
              name="sort"
              defaultValue={sortBy}
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#1A2230] px-3 py-3 text-sm text-[#E7EDF6] focus:border-[#5CC8FF]/50 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/50"
            >
              <option value="newest">Newest</option>
              <option value="plays">Most plays</option>
              <option value="likes">Most likes</option>
            </select>
          </div>
        </AutoSubmitForm>
      </div>

      <div className="mb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-xl uppercase tracking-[-0.01em] md:text-2xl">
            Tracks
          </h2>
          <AutoSubmitForm
            method="get"
            action="/music"
            submitOnSelectChange={false}
            className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
          >
            <label htmlFor="track-search" className="sr-only">
              Search tracks
            </label>
            <input
              type="search"
              name="q"
              id="track-search"
              defaultValue={trackSearch}
              placeholder="Search tracks"
              className="w-full rounded-xl border border-white/10 bg-[#0A0C10]/40 px-3 py-2 text-sm text-[#E7EDF6] placeholder:text-[#77849A] focus:border-[#5CC8FF]/50 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/50 sm:w-64"
            />
            {selectedGenre ? (
              <input type="hidden" name="genre" value={selectedGenre} />
            ) : null}
            {showRemix ? <input type="hidden" name="remix" value="on" /> : null}
            {sortBy !== "newest" ? (
              <input type="hidden" name="sort" value={sortBy} />
            ) : null}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1A2230] px-4 py-2 text-sm font-semibold text-[#E7EDF6] transition duration-150 ease-out hover:border-white/20 hover:bg-[#1A2230]/80 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/40 focus:ring-offset-2 focus:ring-offset-[#0A0C10]"
            >
              Search
            </button>
            {trackSearch ? (
              <Link
                href={buildMusicUrl({ q: null, page: null })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#AAB6C6] transition duration-150 ease-out hover:border-white/20 hover:text-[#E7EDF6]"
              >
                Clear
              </Link>
            ) : null}
          </AutoSubmitForm>
        </div>

        {searchedTracks.length === 0 ? (
          <Card className="mt-4">
            <p className="font-body text-[15px] leading-relaxed text-[#AAB6C6]">
              No tracks match the current genre, remix, and search filters.
            </p>
          </Card>
        ) : (
          <>
            <div
              id="music-grid"
              className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4"
            >
              {visibleTracks.map((track) => (
                <SoundCloudTrackCard
                  key={track.id}
                  title={track.title}
                  genre={track.genre}
                  artworkUrl={track.artworkUrl}
                  fallbackCoverUrl={fallbackCoverUrl}
                  sourceUrl={track.sourceUrl}
                  playUrl={track.playUrl}
                  pauseUrl={track.pauseUrl}
                  trackHref={track.href}
                />
              ))}
            </div>
            {paginationEnabled && totalTrackPages > 1 ? (
              <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#11151C]/70 p-3">
                <Link
                  href={buildMusicUrl({ page: currentTrackPage - 1 })}
                  className={[
                    "inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition duration-150 ease-out",
                    currentTrackPage <= 1
                      ? "pointer-events-none border-white/10 text-[#77849A]"
                      : "border-white/10 bg-[#1A2230] text-[#AAB6C6] hover:border-[#5CC8FF]/40 hover:text-[#E7EDF6]",
                  ].join(" ")}
                >
                  Previous
                </Link>
                <p className="text-xs uppercase tracking-[0.12em] text-[#AAB6C6]">
                  Page {currentTrackPage} / {totalTrackPages}
                </p>
                <Link
                  href={buildMusicUrl({ page: currentTrackPage + 1 })}
                  className={[
                    "inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition duration-150 ease-out",
                    currentTrackPage >= totalTrackPages
                      ? "pointer-events-none border-white/10 text-[#77849A]"
                      : "border-white/10 bg-[#1A2230] text-[#AAB6C6] hover:border-[#5CC8FF]/40 hover:text-[#E7EDF6]",
                  ].join(" ")}
                >
                  Next
                </Link>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Section>
  );
}
