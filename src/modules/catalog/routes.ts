import type { FastifyInstance } from "fastify";
import { requireAdminApiKey } from "../../lib/admin-auth.js";
import { siteKeySchema } from "../content/schema.js";
import { getAssignmentsDocument, getSiteCatalog, getTracksDocument, getPlaylistsDocument, updateAssignments } from "./service.js";
import { updateAssignmentsPayloadSchema } from "./schema.js";

export async function registerCatalogRoutes(server: FastifyInstance) {
  server.get("/v1/sites/:site/catalog", async (request, reply) => {
    const parsedSite = siteKeySchema.safeParse((request.params as { site?: string }).site);
    if (!parsedSite.success) {
      reply.code(404).send({ error: "Unknown site" });
      return;
    }

    return getSiteCatalog(parsedSite.data);
  });

  server.get("/v1/sites/:site/tracks", async (request, reply) => {
    const parsedSite = siteKeySchema.safeParse((request.params as { site?: string }).site);
    if (!parsedSite.success) {
      reply.code(404).send({ error: "Unknown site" });
      return;
    }

    const catalog = await getSiteCatalog(parsedSite.data);
    return {
      site: catalog.site,
      updatedAt: catalog.updatedAt,
      trackCount: catalog.trackCount,
      tracks: catalog.tracks,
    };
  });

  server.get("/v1/sites/:site/playlists", async (request, reply) => {
    const parsedSite = siteKeySchema.safeParse((request.params as { site?: string }).site);
    if (!parsedSite.success) {
      reply.code(404).send({ error: "Unknown site" });
      return;
    }

    const catalog = await getSiteCatalog(parsedSite.data);
    return {
      site: catalog.site,
      updatedAt: catalog.updatedAt,
      playlistCount: catalog.playlistCount,
      playlists: catalog.playlists,
    };
  });

  server.get("/v1/admin/catalog/storage", async (request, reply) => {
    if (!requireAdminApiKey(request, reply)) {
      return;
    }

    const [tracks, playlists, assignments] = await Promise.all([
      getTracksDocument(),
      getPlaylistsDocument(),
      getAssignmentsDocument(),
    ]);

    return {
      tracksUpdatedAt: tracks.updatedAt,
      trackCount: tracks.tracks.length,
      playlistsUpdatedAt: playlists.updatedAt,
      playlistCount: playlists.playlists.length,
      assignmentsUpdatedAt: assignments.updatedAt,
      assignmentCount: Object.keys(assignments.assignments).length,
    };
  });

  server.put("/v1/admin/catalog/assignments", async (request, reply) => {
    if (!requireAdminApiKey(request, reply)) {
      return;
    }

    const parsedBody = updateAssignmentsPayloadSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.code(400).send({
        error: "Invalid assignments payload",
        details: parsedBody.error.flatten(),
      });
      return;
    }

    return updateAssignments(parsedBody.data.assignments);
  });
}
