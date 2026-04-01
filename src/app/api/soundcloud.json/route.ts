import { getCachedSoundCloudDashboardData } from "@/lib/soundcloud-dashboard-cache";
import { buildSystem174Catalog } from "@/lib/soundcloud-catalog";
import { getSoundCloudCatalogOverrides } from "@/lib/soundcloud-catalog-overrides";

export const dynamic = "force-dynamic";

export async function GET() {
  const [dashboardData, catalogOverrides] = await Promise.all([
    getCachedSoundCloudDashboardData(),
    getSoundCloudCatalogOverrides(),
  ]);
  const data = buildSystem174Catalog(dashboardData, catalogOverrides);
  const hasData = Boolean(data.me || data.tracks.length || data.playlists.length);

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": hasData
        ? "public, max-age=300, stale-while-revalidate=86400"
        : "no-store",
    },
  });
}
