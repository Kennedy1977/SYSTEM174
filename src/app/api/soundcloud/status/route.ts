import {
  getAdminDashboardPassword,
  hasAuthorizedAdminSession,
  matchesAdminPassword,
} from "@/lib/admin-auth";
import { getSoundCloudConnectionStatus } from "@/lib/soundcloud";
import { getSoundCloudDashboardCacheInfo } from "@/lib/soundcloud-dashboard-cache";

export const dynamic = "force-dynamic";

type StatusRequestBody = {
  key?: string;
};

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

export async function GET() {
  return json({ error: "Use POST to request SoundCloud status." }, 405);
}

export async function POST(request: Request) {
  const adminPassword = getAdminDashboardPassword();

  if (!adminPassword) {
    return notFound();
  }

  if (!hasAuthorizedAdminSession(request)) {
    const providedKey = await readKeyFromRequest(request);

    if (!matchesAdminPassword(providedKey)) {
      return json({ error: "Unauthorized" }, 401);
    }
  }

  const status = await getSoundCloudConnectionStatus();

  return json({
    ...status,
    cache: getSoundCloudDashboardCacheInfo(),
    reminder:
      status.status === "ok" || status.status === "ok_missing_refresh_token"
        ? "SoundCloud requests are currently working on the live server."
        : "Reconnect via /api/soundcloud/login or restore persistent SoundCloud tokens if this status is not healthy.",
  });
}
