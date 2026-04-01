import crypto from "node:crypto";
import { getSoundCloudTokenSnapshot } from "@/lib/soundcloud";

export const dynamic = "force-dynamic";

type ExportRequestBody = {
  key?: string;
};

function getEnvValue(key: string) {
  return process.env[key] ?? "";
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
      const parsed = JSON.parse(rawBody) as ExportRequestBody;
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

export async function GET() {
  return json({ error: "Use POST to export tokens." }, 405);
}

export async function POST(request: Request) {
  const exportKey = getEnvValue("SOUNDCLOUD_TOKEN_EXPORT_KEY");

  if (!exportKey) {
    return notFound();
  }

  const providedKey = await readKeyFromRequest(request);

  if (!timingSafeEqual(providedKey, exportKey)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const snapshot = await getSoundCloudTokenSnapshot();

  if (!snapshot.hasAccessToken && !snapshot.hasRefreshToken) {
    return json(
      { error: "No SoundCloud tokens are available on the server yet." },
      404,
    );
  }

  return json({
    SOUNDCLOUD_ACCESS_TOKEN: snapshot.accessToken,
    SOUNDCLOUD_REFRESH_TOKEN: snapshot.refreshToken,
    reminder:
      "Copy these values into your persistent environment, then remove SOUNDCLOUD_TOKEN_EXPORT_KEY from the server.",
  });
}
