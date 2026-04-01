import {
  getAdminDashboardPassword,
  hasAuthorizedAdminSession,
  matchesAdminPassword,
} from "@/lib/admin-auth";
import {
  getSoundCloudDashboardCacheInfo,
  refreshSoundCloudDashboardCache,
} from "@/lib/soundcloud-dashboard-cache";

export const dynamic = "force-dynamic";

type RefreshRequestBody = {
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
      const parsed = JSON.parse(rawBody) as RefreshRequestBody;
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
  return json({ error: "Use POST to refresh the SoundCloud cache." }, 405);
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

  const refresh = await refreshSoundCloudDashboardCache();
  const cache = getSoundCloudDashboardCacheInfo();
  const hasData = Boolean(
    refresh.data.me || refresh.data.tracks.length || refresh.data.playlists.length,
  );

  return json({
    action: "cache_refresh",
    cacheUpdated: refresh.cacheUpdated,
    usedExistingCache: refresh.usedExistingCache,
    refreshedAt: refresh.refreshedAt,
    hasData,
    me: refresh.data.me,
    trackCount: refresh.data.tracks.length,
    playlistCount: refresh.data.playlists.length,
    cache,
    message: refresh.cacheUpdated
      ? "SoundCloud cache refreshed from live API data."
      : refresh.usedExistingCache
        ? "Live refresh returned no usable data, so the existing SoundCloud cache was kept."
        : "Live refresh returned no usable data and no previous cache was available.",
    reminder:
      "The catalog pages now use this cached data until the next manual refresh, deploy/restart, or 7-day expiry.",
  });
}
