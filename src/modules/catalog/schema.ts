import { z } from "zod";
import { siteKeySchema } from "../content/schema.js";

export const catalogAssignmentSchema = z.enum([
  "system174",
  "pimpsoul",
  "andyk",
  "hidden",
]);

export const trackSchema = z.object({
  id: z.union([z.number().int(), z.string()]),
  title: z.string(),
  genre: z.string().optional().default(""),
  artworkUrl: z.string().optional().default(""),
  permalinkUrl: z.string().optional().default(""),
  createdAt: z.string().optional().default(""),
  updatedAt: z.string().optional().default(""),
  source: z.enum(["soundcloud", "manual"]).default("soundcloud"),
});

export const playlistSchema = z.object({
  id: z.union([z.number().int(), z.string()]),
  title: z.string(),
  genre: z.string().optional().default(""),
  artworkUrl: z.string().optional().default(""),
  permalinkUrl: z.string().optional().default(""),
  trackIds: z.array(z.union([z.number().int(), z.string()])).default([]),
  createdAt: z.string().optional().default(""),
  updatedAt: z.string().optional().default(""),
  source: z.enum(["soundcloud", "manual"]).default("soundcloud"),
});

export const catalogTracksDocumentSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  tracks: z.array(trackSchema),
});

export const catalogPlaylistsDocumentSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  playlists: z.array(playlistSchema),
});

export const catalogAssignmentsDocumentSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  assignments: z.record(
    z.string(),
    z.object({
      site: catalogAssignmentSchema,
      updatedAt: z.string(),
    }),
  ),
});

export const updateAssignmentsPayloadSchema = z.object({
  assignments: z.record(z.string(), catalogAssignmentSchema),
});

export const siteCatalogResponseSchema = z.object({
  site: siteKeySchema,
  updatedAt: z.string(),
  trackCount: z.number().int(),
  playlistCount: z.number().int(),
  tracks: z.array(trackSchema),
  playlists: z.array(playlistSchema),
});

export type CatalogAssignment = z.infer<typeof catalogAssignmentSchema>;
export type CatalogTracksDocument = z.infer<typeof catalogTracksDocumentSchema>;
export type CatalogPlaylistsDocument = z.infer<typeof catalogPlaylistsDocumentSchema>;
export type CatalogAssignmentsDocument = z.infer<typeof catalogAssignmentsDocumentSchema>;
