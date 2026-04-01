import type { SoundCloudDashboardData } from "@/lib/soundcloud";
import { getSoundCloudDashboardData } from "@/lib/soundcloud";

export const SOUNDCLOUD_DASHBOARD_CACHE_TTL_MS =
  7 * 24 * 60 * 60 * 1000;

export type SoundCloudDashboardCacheInfo = {
  hasCachedData: boolean;
  cachedAt: string | null;
  ageMs: number | null;
  ttlMs: number;
  expiresAt: string | null;
  isFresh: boolean;
};

export type SoundCloudDashboardRefreshResult = {
  data: SoundCloudDashboardData;
  cacheUpdated: boolean;
  usedExistingCache: boolean;
  refreshedAt: string | null;
};

type CacheEntry = {
  data: SoundCloudDashboardData;
  timestamp: number;
} | null;

let dashboardCache: CacheEntry = null;
let inflightDashboardRequest: Promise<SoundCloudDashboardData> | null = null;

function hasDashboardData(data: SoundCloudDashboardData) {
  return Boolean(data.me || data.tracks.length || data.playlists.length);
}

function isCacheFresh(entry: CacheEntry, now: number) {
  return Boolean(entry && now - entry.timestamp < SOUNDCLOUD_DASHBOARD_CACHE_TTL_MS);
}

export function getSoundCloudDashboardCacheInfo(now = Date.now()): SoundCloudDashboardCacheInfo {
  if (!dashboardCache) {
    return {
      hasCachedData: false,
      cachedAt: null,
      ageMs: null,
      ttlMs: SOUNDCLOUD_DASHBOARD_CACHE_TTL_MS,
      expiresAt: null,
      isFresh: false,
    };
  }

  const ageMs = Math.max(0, now - dashboardCache.timestamp);
  const expiresAtTimestamp = dashboardCache.timestamp + SOUNDCLOUD_DASHBOARD_CACHE_TTL_MS;

  return {
    hasCachedData: true,
    cachedAt: new Date(dashboardCache.timestamp).toISOString(),
    ageMs,
    ttlMs: SOUNDCLOUD_DASHBOARD_CACHE_TTL_MS,
    expiresAt: new Date(expiresAtTimestamp).toISOString(),
    isFresh: ageMs < SOUNDCLOUD_DASHBOARD_CACHE_TTL_MS,
  };
}

export async function getCachedSoundCloudDashboardData() {
  const now = Date.now();

  if (dashboardCache && isCacheFresh(dashboardCache, now)) {
    return dashboardCache.data;
  }

  if (inflightDashboardRequest) {
    return inflightDashboardRequest;
  }

  inflightDashboardRequest = (async () => {
    const latestData = await getSoundCloudDashboardData();

    if (hasDashboardData(latestData)) {
      dashboardCache = {
        data: latestData,
        timestamp: Date.now(),
      };
      return latestData;
    }

    if (dashboardCache) {
      return dashboardCache.data;
    }

    return latestData;
  })();

  try {
    return await inflightDashboardRequest;
  } finally {
    inflightDashboardRequest = null;
  }
}

export async function refreshSoundCloudDashboardCache(): Promise<SoundCloudDashboardRefreshResult> {
  const latestData = await getSoundCloudDashboardData();

  if (hasDashboardData(latestData)) {
    const refreshedAt = Date.now();
    dashboardCache = {
      data: latestData,
      timestamp: refreshedAt,
    };

    return {
      data: latestData,
      cacheUpdated: true,
      usedExistingCache: false,
      refreshedAt: new Date(refreshedAt).toISOString(),
    };
  }

  if (dashboardCache) {
    return {
      data: dashboardCache.data,
      cacheUpdated: false,
      usedExistingCache: true,
      refreshedAt: null,
    };
  }

  return {
    data: latestData,
    cacheUpdated: false,
    usedExistingCache: false,
    refreshedAt: null,
  };
}
