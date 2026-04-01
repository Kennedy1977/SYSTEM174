import { readDocument, writeDocument } from "../../lib/document-store.js";
import type { SiteKey } from "../content/schema.js";
import {
  catalogAssignmentsDocumentSchema,
  catalogPlaylistsDocumentSchema,
  catalogTracksDocumentSchema,
  type CatalogAssignment,
  type CatalogAssignmentsDocument,
  type CatalogPlaylistsDocument,
  type CatalogTracksDocument,
} from "./schema.js";

const TRACKS_PATH = "catalog/tracks.json";
const PLAYLISTS_PATH = "catalog/playlists.json";
const ASSIGNMENTS_PATH = "catalog/assignments.json";

export async function getTracksDocument() {
  return readDocument(TRACKS_PATH, catalogTracksDocumentSchema);
}

export async function getPlaylistsDocument() {
  return readDocument(PLAYLISTS_PATH, catalogPlaylistsDocumentSchema);
}

export async function getAssignmentsDocument() {
  return readDocument(ASSIGNMENTS_PATH, catalogAssignmentsDocumentSchema);
}

export async function saveTracksDocument(value: CatalogTracksDocument) {
  return writeDocument(TRACKS_PATH, catalogTracksDocumentSchema, value);
}

export async function savePlaylistsDocument(value: CatalogPlaylistsDocument) {
  return writeDocument(PLAYLISTS_PATH, catalogPlaylistsDocumentSchema, value);
}

function trackBelongsToSite(
  trackId: string,
  site: SiteKey,
  assignments: CatalogAssignmentsDocument,
) {
  const assignment = assignments.assignments[trackId]?.site ?? null;
  if (!assignment) {
    return false;
  }

  return assignment === site;
}

export async function getSiteCatalog(site: SiteKey) {
  const [tracksDoc, playlistsDoc, assignmentsDoc] = await Promise.all([
    getTracksDocument(),
    getPlaylistsDocument(),
    getAssignmentsDocument(),
  ]);

  const tracks = tracksDoc.tracks.filter((track) =>
    trackBelongsToSite(String(track.id), site, assignmentsDoc),
  );

  const playlists = playlistsDoc.playlists.filter((playlist) =>
    (playlist.trackIds ?? []).some((trackId) =>
      trackBelongsToSite(String(trackId), site, assignmentsDoc),
    ),
  );

  return {
    site,
    updatedAt: assignmentsDoc.updatedAt,
    trackCount: tracks.length,
    playlistCount: playlists.length,
    tracks,
    playlists,
  };
}

export async function updateAssignments(
  assignmentMap: Record<string, CatalogAssignment>,
) {
  const current = await getAssignmentsDocument();
  const updatedAt = new Date().toISOString();

  const next: CatalogAssignmentsDocument = {
    ...current,
    updatedAt,
    assignments: { ...current.assignments },
  };

  for (const [trackId, site] of Object.entries(assignmentMap)) {
    next.assignments[trackId] = {
      site,
      updatedAt,
    };
  }

  return writeDocument(
    ASSIGNMENTS_PATH,
    catalogAssignmentsDocumentSchema,
    next,
  );
}
