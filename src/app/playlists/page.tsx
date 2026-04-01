import Link from "next/link";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import Card from "@/components/Card";
import Section from "@/components/Section";
import { getCachedSoundCloudDashboardData } from "@/lib/soundcloud-dashboard-cache";
import { buildPageMetadata, siteName } from "@/lib/site-meta";
import { getSiteVariant, isSoundCloudPaginationEnabled } from "@/lib/site-config";
import { buildBrandCatalog } from "@/lib/soundcloud-catalog";
import { getSoundCloudCatalogOverrides } from "@/lib/soundcloud-catalog-overrides";
import { getSoundCloudPlayerUrl } from "@/lib/soundcloud-embed";
import {
  getSearchParamValue,
  resolvePageSearchParams,
  type PageSearchParams,
} from "@/lib/next-search";

export const metadata = buildPageMetadata({
  title: `${siteName} | Playlists`,
  description: "All SoundCloud playlists, synced automatically.",
  path: "/playlists",
});

export const dynamic = "force-dynamic";

type PlaylistsPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

const PLAYLISTS_PAGE_SIZE = 12;
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

export default async function PlaylistsPage({
  searchParams,
}: PlaylistsPageProps) {
  const params = await resolvePageSearchParams(searchParams);
  const siteVariant = getSiteVariant();
  const [dashboardData, catalogOverrides] = await Promise.all([
    getCachedSoundCloudDashboardData(),
    getSoundCloudCatalogOverrides(),
  ]);
  const soundcloud = buildBrandCatalog(
    dashboardData,
    catalogOverrides,
    siteVariant === "pimpsoul" ? "pimpsoul" : "system174",
  );
  const playlists = soundcloud.playlists;
  const fallbackCoverUrl =
    siteVariant === "pimpsoul"
      ? "/textures/bg-pimpsoul.png"
      : "/textures/bg-main.png";

  const selectedGenre = getSearchParamValue(params, "genre").trim();
  const selectedGenreKey = selectedGenre.toLowerCase();
  const search = getSearchParamValue(params, "q").trim();
  const searchKey = search.toLowerCase();
  const selectedPlaylistIdRaw = Number(getSearchParamValue(params, "playlist") || "");
  const selectedPlaylistId = Number.isFinite(selectedPlaylistIdRaw)
    ? selectedPlaylistIdRaw
    : null;
  const paginationEnabled = isSoundCloudPaginationEnabled();
  const rawPage = Number(getSearchParamValue(params, "page") || "1");
  const requestedPage = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;

  const visiblePlaylists = playlists.filter((playlist) => !isCoverOrBootleg(playlist));
  const allGenres = Array.from(
    new Set(
      visiblePlaylists.map((playlist) => (playlist.genre ?? "").trim()).filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const byGenre = selectedGenre
    ? visiblePlaylists.filter(
        (playlist) =>
          (playlist.genre ?? "").trim().toLowerCase() === selectedGenreKey,
      )
    : visiblePlaylists;

  const filteredPlaylists = searchKey
    ? byGenre.filter((playlist) =>
        playlist.title.toLowerCase().includes(searchKey),
      )
    : byGenre;

  const selectedPlaylist = selectedPlaylistId
    ? visiblePlaylists.find((playlist) => playlist.id === selectedPlaylistId) ?? null
    : null;

  const totalPages = Math.max(1, Math.ceil(filteredPlaylists.length / PLAYLISTS_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * PLAYLISTS_PAGE_SIZE;

  const buildUrl = (overrides?: {
    genre?: string | null;
    q?: string | null;
    playlist?: number | null;
    page?: number | null;
  }) => {
    const urlParams = new URLSearchParams();
    const genre =
      overrides?.genre === undefined ? selectedGenre : overrides.genre ?? "";
    const q = overrides?.q === undefined ? search : overrides.q ?? "";
    const playlistId =
      overrides?.playlist === undefined
        ? selectedPlaylist?.id ?? null
        : overrides.playlist;
    const page =
      overrides?.page === undefined
        ? paginationEnabled
          ? currentPage
          : null
        : overrides.page;

    if (genre) urlParams.set("genre", genre);
    if (q) urlParams.set("q", q);
    if (paginationEnabled && page && page > 1) {
      urlParams.set("page", String(page));
    }
    if (playlistId) urlParams.set("playlist", String(playlistId));

    const query = urlParams.toString();
    return query ? `/playlists?${query}` : "/playlists";
  };

  const visibleLibraryPlaylists = paginationEnabled
    ? filteredPlaylists.slice(startIndex, startIndex + PLAYLISTS_PAGE_SIZE)
    : filteredPlaylists;

  const selectedPlaylistVisibleTracks = (selectedPlaylist?.tracks ?? []).filter(
    (track) => !isPrivateTrack(track) && !isBlockedByAccess(track),
  );

  return (
    <Section
      title="PLAYLISTS"
      description="All SoundCloud playlists, synced automatically."
      headingLevel={1}
    >
      {!selectedPlaylist ? (
        <div className="mb-10 rounded-2xl border border-white/10 bg-[#11151C]/70 p-5 sm:p-6">
          <AutoSubmitForm
            method="get"
            action="/playlists"
            className="grid grid-cols-1 gap-4 md:max-w-sm"
          >
            {search ? <input type="hidden" name="q" value={search} /> : null}
            <div>
              <label htmlFor="playlist-filter-genre" className="label-ui">
                Genre
              </label>
              <select
                id="playlist-filter-genre"
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
          </AutoSubmitForm>
        </div>
      ) : null}

      <div className="mb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl uppercase tracking-[-0.01em] md:text-2xl">
              {selectedPlaylist ? selectedPlaylist.title : "Playlist Library"}
            </h2>
            {selectedPlaylist ? (
              <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#AAB6C6]">
                <Link
                  href={buildUrl({ playlist: null })}
                  className="transition duration-150 ease-out hover:text-[#E7EDF6]"
                >
                  Playlist Library
                </Link>
                <span>/</span>
                <span className="text-[#E7EDF6]">{selectedPlaylist.title}</span>
              </div>
            ) : null}
          </div>

          {!selectedPlaylist ? (
            <AutoSubmitForm
              method="get"
              action="/playlists"
              submitOnSelectChange={false}
              className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
            >
              <label htmlFor="playlist-search" className="sr-only">
                Search playlists
              </label>
              <input
                type="search"
                name="q"
                id="playlist-search"
                defaultValue={search}
                placeholder="Search playlists"
                className="w-full rounded-xl border border-white/10 bg-[#0A0C10]/40 px-3 py-2 text-sm text-[#E7EDF6] placeholder:text-[#77849A] focus:border-[#5CC8FF]/50 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/50 sm:w-64"
              />
              {selectedGenre ? (
                <input type="hidden" name="genre" value={selectedGenre} />
              ) : null}
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1A2230] px-4 py-2 text-sm font-semibold text-[#E7EDF6] transition duration-150 ease-out hover:border-white/20 hover:bg-[#1A2230]/80 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/40 focus:ring-offset-2 focus:ring-offset-[#0A0C10]"
              >
                Search
              </button>
              {search ? (
                <Link
                  href={buildUrl({ q: null, page: null })}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#AAB6C6] transition duration-150 ease-out hover:border-white/20 hover:text-[#E7EDF6]"
                >
                  Clear
                </Link>
              ) : null}
            </AutoSubmitForm>
          ) : null}
        </div>

        {selectedPlaylist ? (
          <div className="mt-4 space-y-3">
            <Link
              href={buildUrl({ playlist: null })}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#AAB6C6] transition duration-150 ease-out hover:border-[#5CC8FF]/40 hover:text-[#E7EDF6]"
            >
              Back to Playlist Library
            </Link>
            {selectedPlaylistVisibleTracks.length === 0 ? (
              <Card>
                <p className="font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                  No tracks were returned for this playlist.
                </p>
              </Card>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#11151C]/70 p-4 sm:p-5">
                <p className="label-ui">Tracks</p>
                <div className="mt-3 divide-y divide-white/10">
                  {selectedPlaylistVisibleTracks.map((track, index) => {
                    const sourceUrl = `https://api.soundcloud.com/tracks/${track.id}`;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        data-sc-source={sourceUrl}
                        data-sc-play={getSoundCloudPlayerUrl(sourceUrl)}
                        data-sc-pause={getSoundCloudPlayerUrl(sourceUrl, false)}
                        data-sc-title={track.title ?? `Track ${index + 1}`}
                        data-sc-artwork={selectedPlaylist.artwork_url ?? ""}
                        className="flex w-full items-center justify-between gap-3 py-3 text-left transition duration-150 ease-out hover:bg-white/[0.02]"
                        aria-label={`Play ${track.title ?? `Track ${index + 1}`}`}
                      >
                        <span className="text-sm text-[#E7EDF6]">
                          <span className="mr-2 text-[#77849A]">{index + 1}.</span>
                          {track.title ?? `Track ${index + 1}`}
                        </span>
                        <span
                          data-icon-toggle
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#5CC8FF]/60 bg-[#0A0C10]/70 text-[#E7EDF6]"
                        >
                          ▶
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <Card>
            <p className="font-body text-[15px] leading-relaxed text-[#AAB6C6]">
              No playlists match the current filters.
            </p>
          </Card>
        ) : (
          <>
            <div
              id="playlists-grid"
              className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
            >
              {visibleLibraryPlaylists.map((playlist) => (
                <article
                  key={playlist.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#11151C]/60 transition duration-150 ease-out hover:border-[#5CC8FF]/40"
                >
                  <Link
                    href={buildUrl({ playlist: playlist.id })}
                    className="block"
                    aria-label={`Open ${playlist.title}`}
                  >
                    <div
                      className="relative aspect-square w-full bg-[#1A2230] bg-cover bg-center"
                      style={{ backgroundImage: `url('${fallbackCoverUrl}')` }}
                    >
                      {playlist.artwork_url ? (
                        <img
                          src={playlist.artwork_url}
                          alt={playlist.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover opacity-95 transition duration-150 ease-out group-hover:opacity-100"
                        />
                      ) : null}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition duration-150 ease-out group-hover:opacity-100">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#5CC8FF]/60 bg-[#0A0C10]/70 text-[#E7EDF6]">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="p-3">
                    <p className="text-sm font-semibold tracking-tight text-[#E7EDF6]">
                      {playlist.title}
                    </p>
                    {playlist.genre ? (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#77849A]">
                        {playlist.genre}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
            {paginationEnabled && totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#11151C]/70 p-3">
                <Link
                  href={buildUrl({ page: currentPage - 1 })}
                  className={[
                    "inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition duration-150 ease-out",
                    currentPage <= 1
                      ? "pointer-events-none border-white/10 text-[#77849A]"
                      : "border-white/10 bg-[#1A2230] text-[#AAB6C6] hover:border-[#5CC8FF]/40 hover:text-[#E7EDF6]",
                  ].join(" ")}
                >
                  Previous
                </Link>
                <p className="text-xs uppercase tracking-[0.12em] text-[#AAB6C6]">
                  Page {currentPage} / {totalPages}
                </p>
                <Link
                  href={buildUrl({ page: currentPage + 1 })}
                  className={[
                    "inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition duration-150 ease-out",
                    currentPage >= totalPages
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
