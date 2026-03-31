import type { APIRoute } from "astro";
import crypto from "node:crypto";
import { getSoundCloudConnectionStatus } from "../../../lib/soundcloud";

const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

type StatusRequestBody = {
  key?: string;
};

function getEnvValue(key: string) {
  return process.env[key] ?? metaEnv[key] ?? "";
}

function makeHeaders() {
  return {
    "Cache-Control": "no-store, private",
    "Content-Type": "application/json; charset=utf-8",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: makeHeaders(),
  });
}

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function timingSafeEqual(left: string, right: string) {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function readKeyFromRequest(request: Request) {
  const bearerToken = readBearerToken(request);
  if (bearerToken) {
    return bearerToken;
  }

  const rawBody = await request.text();
  if (!rawBody) {
    return "";
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(rawBody) as StatusRequestBody;
      return parsed.key?.trim() ?? "";
    } catch {
      return "";
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return new URLSearchParams(rawBody).get("key")?.trim() ?? "";
  }

  return rawBody.trim();
}

export const GET: APIRoute = async () => {
  return json({ error: "Use POST to request SoundCloud status." }, 405);
};

export const POST: APIRoute = async ({ request }) => {
  const exportKey = getEnvValue("SOUNDCLOUD_TOKEN_EXPORT_KEY");

  if (!exportKey) {
    return notFound();
  }

  const providedKey = await readKeyFromRequest(request);

  if (!timingSafeEqual(providedKey, exportKey)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const status = await getSoundCloudConnectionStatus();

  return json({
    ...status,
    reminder:
      status.status === "ok" || status.status === "ok_missing_refresh_token"
        ? "SoundCloud requests are currently working on the live server."
        : "Reconnect via /api/soundcloud/login or restore persistent SoundCloud tokens if this status is not healthy.",
  });
};
