import type { SoundCloudDashboardData, SoundCloudPlaylist, SoundCloudTrack } from "./soundcloud";

const LEGACY_TRACK_KEYWORDS = ["andy k", "pimpsoul", "the pimpsoul project"];
const LEGACY_PLAYLIST_KEYWORDS = [
  ...LEGACY_TRACK_KEYWORDS,
  "the sounds of andy k",
  "project-99",
  "acid house",
  "house / trance / techno",
];
const SYSTEM_174_OVERRIDE_KEYWORDS = [
  "system 174",
  "174 remix",
  "174 mix",
  "174 edit",
  "174 rework",
  "from the vault",
  "-> 174",
  "→ 174",
];
const YEAR_RANGE_PATTERN = /\b(?:19|20)\d{2}\s*(?:-|\u2013)\s*(?:19|20)\d{2}\b/;

function normalizeTitle(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function includesAny(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function hasSystem174OverrideTitle(title: string | null | undefined) {
  const normalizedTitle = normalizeTitle(title);
  return includesAny(normalizedTitle, SYSTEM_174_OVERRIDE_KEYWORDS);
}

function isLegacyPlaylistTitle(title: string | null | undefined) {
  const normalizedTitle = normalizeTitle(title);
  return YEAR_RANGE_PATTERN.test(normalizedTitle) || includesAny(normalizedTitle, LEGACY_PLAYLIST_KEYWORDS);
}

function isLegacyTrackTitle(title: string | null | undefined) {
  return includesAny(normalizeTitle(title), LEGACY_TRACK_KEYWORDS);
}

function shouldIncludeTrack(track: SoundCloudTrack, legacyPlaylistTrackIds: Set<number>) {
  const legacyBranded = isLegacyTrackTitle(track.title) || legacyPlaylistTrackIds.has(track.id);
  return !legacyBranded || hasSystem174OverrideTitle(track.title);
}

function shouldIncludePlaylist(playlist: SoundCloudPlaylist) {
  return !isLegacyPlaylistTitle(playlist.title) || hasSystem174OverrideTitle(playlist.title);
}

export function buildSystem174Catalog(data: SoundCloudDashboardData): SoundCloudDashboardData {
  const legacyPlaylistTrackIds = new Set<number>();

  for (const playlist of data.playlists) {
    if (!isLegacyPlaylistTitle(playlist.title) || hasSystem174OverrideTitle(playlist.title)) {
      continue;
    }

    for (const track of playlist.tracks ?? []) {
      legacyPlaylistTrackIds.add(track.id);
    }
  }

  const visibleTracks = data.tracks.filter((track) => shouldIncludeTrack(track, legacyPlaylistTrackIds));
  const visibleTrackIds = new Set<number>(visibleTracks.map((track) => track.id));
  const tracksById = new Map<number, SoundCloudTrack>(visibleTracks.map((track) => [track.id, track]));

  const visiblePlaylists = data.playlists
    .filter((playlist) => shouldIncludePlaylist(playlist))
    .map((playlist) => ({
      ...playlist,
      tracks: playlist.tracks?.filter((playlistTrack) => {
        const track = tracksById.get(playlistTrack.id);
        if (track) {
          return visibleTrackIds.has(track.id);
        }

        const legacyBranded = isLegacyTrackTitle(playlistTrack.title);
        return !legacyBranded || hasSystem174OverrideTitle(playlistTrack.title);
      }),
    }));

  return {
    ...data,
    tracks: visibleTracks,
    playlists: visiblePlaylists,
  };
}
