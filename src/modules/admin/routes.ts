import type { FastifyInstance } from "fastify";
import { getEnv } from "../../config/env.js";
import { requireAdminApiKey } from "../../lib/admin-auth.js";
import { getDocumentPath } from "../../lib/document-store.js";

export async function registerAdminRoutes(server: FastifyInstance) {
  server.get("/v1/admin/storage", async (request, reply) => {
    if (!requireAdminApiKey(request, reply)) {
      return;
    }

    const env = getEnv();

    return {
      apiBaseUrl: env.API_BASE_URL,
      dataDir: env.DATA_DIR_ABSOLUTE,
      documents: {
        system174: getDocumentPath("sites/system174.json"),
        pimpsoul: getDocumentPath("sites/pimpsoul.json"),
        tracks: getDocumentPath("catalog/tracks.json"),
        playlists: getDocumentPath("catalog/playlists.json"),
        assignments: getDocumentPath("catalog/assignments.json"),
        soundcloud: getDocumentPath("integrations/soundcloud.json"),
        syncState: getDocumentPath("sync/state.json"),
      },
    };
  });
}
