import type { FastifyReply, FastifyRequest } from "fastify";
import { getEnv } from "../config/env.js";

function extractApiKey(request: FastifyRequest) {
  const xAdminKey = request.headers["x-admin-key"];

  if (typeof xAdminKey === "string" && xAdminKey.trim()) {
    return xAdminKey.trim();
  }

  const authHeader = request.headers.authorization ?? "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return "";
}

export function requireAdminApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const env = getEnv();

  if (!env.ADMIN_API_KEY) {
    reply.code(404).send({ error: "Not found" });
    return false;
  }

  if (extractApiKey(request) !== env.ADMIN_API_KEY) {
    reply.code(401).send({ error: "Unauthorized" });
    return false;
  }

  return true;
}
