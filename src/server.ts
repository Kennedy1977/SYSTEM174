import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { getEnv } from "./config/env.js";
import { registerHealthRoutes } from "./modules/health/routes.js";
import { registerContentRoutes } from "./modules/content/routes.js";
import { registerCatalogRoutes } from "./modules/catalog/routes.js";
import { registerAdminRoutes } from "./modules/admin/routes.js";
import { registerSoundCloudRoutes } from "./modules/soundcloud/routes.js";

export async function buildServer() {
  const env = getEnv();
  const server = Fastify({
    logger: true,
    trustProxy: true,
  });

  await server.register(helmet, {
    global: true,
  });

  await server.register(cors, {
    origin(origin, callback) {
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed"), false);
    },
    credentials: false,
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  server.get("/", async () => ({
    service: "system174-api",
    version: "0.0.1",
    status: "ok",
    docs: [
      "/healthz",
      "/v1/sites/system174/content",
      "/v1/sites/pimpsoul/content",
      "/v1/sites/system174/catalog",
      "/v1/sites/pimpsoul/catalog",
    ],
  }));

  await registerHealthRoutes(server);
  await registerContentRoutes(server);
  await registerCatalogRoutes(server);
  await registerAdminRoutes(server);
  await registerSoundCloudRoutes(server);

  return server;
}
