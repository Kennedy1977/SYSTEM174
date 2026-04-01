import { z } from "zod";

export const soundCloudIntegrationDocumentSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  oauth: z.object({
    clientId: z.string().default(""),
    clientSecretConfigured: z.boolean().default(false),
    redirectUri: z.string().default(""),
  }),
  tokens: z.object({
    accessToken: z.string().default(""),
    refreshToken: z.string().default(""),
    updatedAt: z.string().nullable(),
  }),
  sync: z.object({
    status: z.enum(["idle", "running", "failed", "ok"]).default("idle"),
    lastSyncAt: z.string().nullable(),
    message: z.string().nullable(),
  }),
});

export const updateSoundCloudTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const soundCloudTrackSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  genre: z.string().nullable().optional(),
  sharing: z.string().nullable().optional(),
  access: z.string().nullable().optional(),
  playback_count: z.number().nullable().optional(),
  favoritings_count: z.number().nullable().optional(),
  artwork_url: z.string().nullable(),
  permalink_url: z.string(),
  created_at: z.string(),
});

export const soundCloudPlaylistSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  genre: z.string().nullable().optional(),
  artwork_url: z.string().nullable(),
  permalink_url: z.string(),
  created_at: z.string(),
  tracks: z
    .array(
      z.object({
        id: z.number().int(),
        title: z.string().optional(),
        sharing: z.string().nullable().optional(),
        access: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

export const soundCloudMeSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  avatar_url: z.string().nullable(),
  permalink_url: z.string(),
});

export const soundCloudDashboardDataSchema = z.object({
  me: soundCloudMeSchema.nullable(),
  tracks: z.array(soundCloudTrackSchema),
  playlists: z.array(soundCloudPlaylistSchema),
});

export type SoundCloudIntegrationDocument = z.infer<
  typeof soundCloudIntegrationDocumentSchema
>;
