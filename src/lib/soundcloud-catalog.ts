import type {
  SoundCloudCatalogAssignment,
  SoundCloudCatalogOverrideMap,
} from "./soundcloud-catalog-overrides";
import type {
  SoundCloudDashboardData,
  SoundCloudPlaylist,
  SoundCloudTrack,
} from "./soundcloud";

const PIMPSOUL_KEYWORDS = ["pimpsoul", "the pimpsoul project"];
const ANDYK_KEYWORDS = ["andy k"];
const LEGACY_TRACK_KEYWORDS = [...ANDYK_KEYWORDS, ...PIMPSOUL_KEYWORDS];
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
const YEAR_RANGE_PATTERN =
  /\b(?:19|20)\d{2}\s*(?:-|\u2013)\s*(?:19|20)\d{2}\b/;

type SoundCloudCatalogAutoAssignment = "system174" | "pimpsoul" | "andyk";
export type SoundCloudCatalogBrandTarget = Exclude<
  SoundCloudCatalogAutoAssignment,
  "andyk"
>;

export type SoundCloudCatalogEffectiveAssignment =
  | SoundCloudCatalogAutoAssignment
  | "hidden";

export type SoundCloudCatalogTrackDecision = {
  track: SoundCloudTrack;
  manualAssignment: SoundCloudCatalogAssignment;
  autoAssignment: SoundCloudCatalogAutoAssignment;
  effectiveAssignment: SoundCloudCatalogEffectiveAssignment;
  visibleOnSystem174: boolean;
  reason: string;
};

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

function hasPimpsoulKeyword(title: string | null | undefined) {
  return includesAny(normalizeTitle(title), PIMPSOUL_KEYWORDS);
}

function hasAndyKKeyword(title: string | null | undefined) {
  return includesAny(normalizeTitle(title), ANDYK_KEYWORDS);
}

function isLegacyPlaylistTitle(title: string | null | undefined) {
  const normalizedTitle = normalizeTitle(title);
  return (
    YEAR_RANGE_PATTERN.test(normalizedTitle) ||
    includesAny(normalizedTitle, LEGACY_PLAYLIST_KEYWORDS)
  );
}

function isLegacyTrackTitle(title: string | null | undefined) {
  return includesAny(normalizeTitle(title), LEGACY_TRACK_KEYWORDS);
}

function getLegacyPlaylistAssignment(
  title: string | null | undefined,
): Exclude<SoundCloudCatalogAutoAssignment, "system174"> | null {
  const normalizedTitle = normalizeTitle(title);

  if (!normalizedTitle || hasSystem174OverrideTitle(normalizedTitle)) {
    return null;
  }

  if (includesAny(normalizedTitle, PIMPSOUL_KEYWORDS)) {
    return "pimpsoul";
  }

  if (
    YEAR_RANGE_PATTERN.test(normalizedTitle) ||
    includesAny(normalizedTitle, LEGACY_PLAYLIST_KEYWORDS)
  ) {
    return "andyk";
  }

  return null;
}

function buildLegacyPlaylistTrackAssignments(playlists: SoundCloudPlaylist[]) {
  const assignments = new Map<
    number,
    Exclude<SoundCloudCatalogAutoAssignment, "system174">
  >();

  for (const playlist of playlists) {
    const assignment = getLegacyPlaylistAssignment(playlist.title);
    if (!assignment) {
      continue;
    }

    for (const track of playlist.tracks ?? []) {
      assignments.set(track.id, assignment);
    }
  }

  return assignments;
}

function getManualAssignment(
  trackId: number,
  overrides: SoundCloudCatalogOverrideMap,
): SoundCloudCatalogAssignment {
  return overrides[String(trackId)]?.assignment ?? "auto";
}

function getManualAssignmentReason(
  assignment: Exclude<SoundCloudCatalogAssignment, "auto">,
) {
  if (assignment === "system174") {
    return "Manual override: show on SYSTEM 174.";
  }

  if (assignment === "pimpsoul") {
    return "Manual override: classify under The Pimpsoul Project.";
  }

  if (assignment === "andyk") {
    return "Manual override: classify under Andy K archive material.";
  }

  return "Manual override: hide from branded catalog views.";
}

function getAutoAssignment(
  track: SoundCloudTrack,
  legacyPlaylistAssignments: Map<
    number,
    Exclude<SoundCloudCatalogAutoAssignment, "system174">
  >,
): Pick<SoundCloudCatalogTrackDecision, "autoAssignment" | "reason"> {
  if (hasSystem174OverrideTitle(track.title)) {
    return {
      autoAssignment: "system174",
      reason: "Auto: matched a SYSTEM 174 remix/edit/rework keyword.",
    };
  }

  if (hasPimpsoulKeyword(track.title)) {
    return {
      autoAssignment: "pimpsoul",
      reason: "Auto: matched The Pimpsoul Project title keyword.",
    };
  }

  if (hasAndyKKeyword(track.title)) {
    return {
      autoAssignment: "andyk",
      reason: "Auto: matched Andy K title keyword.",
    };
  }

  const playlistAssignment = legacyPlaylistAssignments.get(track.id);
  if (playlistAssignment) {
    return {
      autoAssignment: playlistAssignment,
      reason:
        playlistAssignment === "pimpsoul"
          ? "Auto: matched a legacy The Pimpsoul Project playlist."
          : "Auto: matched an Andy K/archive playlist.",
    };
  }

  return {
    autoAssignment: "system174",
    reason: "Auto: no legacy brand match found, so it stays on SYSTEM 174.",
  };
}

function shouldIncludePlaylist(playlist: SoundCloudPlaylist) {
  return (
    !isLegacyPlaylistTitle(playlist.title) ||
    hasSystem174OverrideTitle(playlist.title)
  );
}

function shouldIncludePlaylistForTarget(
  playlist: SoundCloudPlaylist,
  target: SoundCloudCatalogBrandTarget,
) {
  if (target === "system174") {
    return shouldIncludePlaylist(playlist);
  }

  return hasPimpsoulKeyword(playlist.title);
}

export function buildTrackCatalogDecisions(
  data: SoundCloudDashboardData,
  overrides: SoundCloudCatalogOverrideMap = {},
): SoundCloudCatalogTrackDecision[] {
  const legacyPlaylistAssignments = buildLegacyPlaylistTrackAssignments(
    data.playlists,
  );

  return data.tracks.map((track) => {
    const manualAssignment = getManualAssignment(track.id, overrides);
    const autoDecision = getAutoAssignment(track, legacyPlaylistAssignments);
    const effectiveAssignment =
      manualAssignment === "auto"
        ? autoDecision.autoAssignment
        : manualAssignment;

    return {
      track,
      manualAssignment,
      autoAssignment: autoDecision.autoAssignment,
      effectiveAssignment,
      visibleOnSystem174: effectiveAssignment === "system174",
      reason:
        manualAssignment === "auto"
          ? autoDecision.reason
          : getManualAssignmentReason(manualAssignment),
    };
  });
}

export function buildSystem174Catalog(
  data: SoundCloudDashboardData,
  overrides: SoundCloudCatalogOverrideMap = {},
): SoundCloudDashboardData {
  return buildBrandCatalog(data, overrides, "system174");
}

export function buildPimpsoulCatalog(
  data: SoundCloudDashboardData,
  overrides: SoundCloudCatalogOverrideMap = {},
): SoundCloudDashboardData {
  return buildBrandCatalog(data, overrides, "pimpsoul");
}

export function buildBrandCatalog(
  data: SoundCloudDashboardData,
  overrides: SoundCloudCatalogOverrideMap = {},
  target: SoundCloudCatalogBrandTarget = "system174",
): SoundCloudDashboardData {
  const decisions = buildTrackCatalogDecisions(data, overrides);
  const visibleTracks = decisions
    .filter((decision) => decision.effectiveAssignment === target)
    .map((decision) => decision.track);
  const visibleTrackIds = new Set<number>(
    visibleTracks.map((track) => track.id),
  );
  const decisionsById = new Map<number, SoundCloudCatalogTrackDecision>(
    decisions.map((decision) => [decision.track.id, decision]),
  );
  const tracksById = new Map<number, SoundCloudTrack>(
    visibleTracks.map((track) => [track.id, track]),
  );

  const visiblePlaylists = data.playlists
    .map((playlist) => ({
      ...playlist,
      tracks: playlist.tracks?.filter((playlistTrack) => {
        const track = tracksById.get(playlistTrack.id);
        if (track) {
          return visibleTrackIds.has(track.id);
        }

        const decision = decisionsById.get(playlistTrack.id);
        if (decision) {
          return decision.effectiveAssignment === target;
        }

        const legacyBranded = isLegacyTrackTitle(playlistTrack.title);
        if (target === "system174") {
          return (
            !legacyBranded || hasSystem174OverrideTitle(playlistTrack.title)
          );
        }

        return hasPimpsoulKeyword(playlistTrack.title);
      }),
    }))
    .filter(
      (playlist) =>
        (playlist.tracks?.length ?? 0) > 0 ||
        shouldIncludePlaylistForTarget(playlist, target),
    );

  return {
    ...data,
    tracks: visibleTracks,
    playlists: visiblePlaylists,
  };
}
