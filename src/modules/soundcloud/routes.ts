import type { FastifyInstance } from "fastify";
import { requireAdminApiKey } from "../../lib/admin-auth.js";
import {
  exchangeCodeForTokens,
  getSoundCloudAuthorizeUrl,
  getSoundCloudStatus,
  getSoundCloudSyncStateDocumentPath,
  markSyncRequested,
  updateSoundCloudTokens,
} from "./service.js";

export async function registerSoundCloudRoutes(server: FastifyInstance) {
  server.get("/v1/admin/soundcloud/login", async (_request, reply) => {
    const authorizeUrl = getSoundCloudAuthorizeUrl();
    return reply.redirect(authorizeUrl);
  });

  server.get("/v1/admin/soundcloud/callback", async (request, reply) => {
    const code = (request.query as { code?: string; error?: string }).code?.trim();
    const oauthError = (request.query as { code?: string; error?: string }).error?.trim();

    if (oauthError) {
      reply.code(400).send({
        error: "SoundCloud authorization failed",
        details: oauthError,
      });
      return;
    }

    if (!code) {
      reply.code(400).send({
        error: "Missing authorization code",
      });
      return;
    }

    try {
      const tokens = await exchangeCodeForTokens(code);
      reply.send({
        ok: true,
        message: "SoundCloud tokens stored successfully.",
        hasAccessToken: Boolean(tokens.accessToken),
        hasRefreshToken: Boolean(tokens.refreshToken),
      });
    } catch (error) {
      reply.code(500).send({
        error: "SoundCloud code exchange failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  server.get("/v1/admin/soundcloud/status", async (request, reply) => {
    if (!requireAdminApiKey(request, reply)) {
      return;
    }

    return getSoundCloudStatus();
  });

  server.post("/v1/admin/soundcloud/tokens", async (request, reply) => {
    if (!requireAdminApiKey(request, reply)) {
      return;
    }

    try {
      return await updateSoundCloudTokens(request.body);
    } catch (error) {
      reply.code(400).send({
        error: "Invalid SoundCloud token payload",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  server.post("/v1/admin/soundcloud/sync", async (request, reply) => {
    if (!requireAdminApiKey(request, reply)) {
      return;
    }

    try {
      return await markSyncRequested();
    } catch (error) {
      reply.code(500).send({
        error: "SoundCloud sync failed",
        message: error instanceof Error ? error.message : "Unknown error",
        syncStateDocument: getSoundCloudSyncStateDocumentPath(),
      });
    }
  });
}
