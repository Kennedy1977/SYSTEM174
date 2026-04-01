import type { FastifyInstance } from "fastify";
import { requireAdminApiKey } from "../../lib/admin-auth.js";
import {
  siteContentSchema,
  siteKeySchema,
} from "./schema.js";
import { getSiteContent, saveSiteContent } from "./service.js";

export async function registerContentRoutes(server: FastifyInstance) {
  server.get("/v1/sites/:site/content", async (request, reply) => {
    const parsedSite = siteKeySchema.safeParse((request.params as { site?: string }).site);

    if (!parsedSite.success) {
      reply.code(404).send({ error: "Unknown site" });
      return;
    }

    return getSiteContent(parsedSite.data);
  });

  server.put("/v1/admin/sites/:site/content", async (request, reply) => {
    if (!requireAdminApiKey(request, reply)) {
      return;
    }

    const parsedSite = siteKeySchema.safeParse((request.params as { site?: string }).site);
    if (!parsedSite.success) {
      reply.code(404).send({ error: "Unknown site" });
      return;
    }

    const parsedBody = siteContentSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.code(400).send({
        error: "Invalid content payload",
        details: parsedBody.error.flatten(),
      });
      return;
    }

    return saveSiteContent(parsedSite.data, parsedBody.data);
  });
}
