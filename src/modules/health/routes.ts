import type { FastifyInstance } from "fastify";
import { getEnv } from "../../config/env.js";

export async function registerHealthRoutes(server: FastifyInstance) {
  server.get("/healthz", async () => {
    const env = getEnv();

    return {
      ok: true,
      service: "system174-api",
      nodeEnv: env.NODE_ENV,
      apiBaseUrl: env.API_BASE_URL,
      time: new Date().toISOString(),
    };
  });
}
