import { getSoundCloudDashboardData } from "@/lib/soundcloud";
import { buildSystem174Catalog } from "@/lib/soundcloud-catalog";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 600 * 1000;

type CacheEntry = {
  data: Awaited<ReturnType<typeof getSoundCloudDashboardData>>;
  timestamp: number;
} | null;

let cache: CacheEntry = null;

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return new Response(JSON.stringify(cache.data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  const data = buildSystem174Catalog(await getSoundCloudDashboardData());
  const hasData = Boolean(data.me || data.tracks.length || data.playlists.length);
  if (hasData) {
    cache = { data, timestamp: now };
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": hasData ? "public, max-age=60" : "no-store",
    },
  });
}
