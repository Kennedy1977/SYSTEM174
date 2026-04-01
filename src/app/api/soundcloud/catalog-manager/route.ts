import {
  getAdminDashboardPassword,
  hasAuthorizedAdminSession,
  matchesAdminPassword,
} from "@/lib/admin-auth";
import { getCachedSoundCloudDashboardData } from "@/lib/soundcloud-dashboard-cache";
import {
  buildTrackCatalogDecisions,
  type SoundCloudCatalogTrackDecision,
} from "@/lib/soundcloud-catalog";
import {
  getSoundCloudCatalogOverrides,
  updateSoundCloudCatalogAssignments,
  type SoundCloudCatalogAssignment,
  type SoundCloudCatalogOverrideMap,
} from "@/lib/soundcloud-catalog-overrides";

export const dynamic = "force-dynamic";

type CatalogListRequest = {
  key?: string;
  action?: "list";
};

type CatalogSaveRequest = {
  key?: string;
  action?: "save";
  assignments?: Array<{
    trackId?: number;
    assignment?: SoundCloudCatalogAssignment;
  }>;
};

type CatalogRequest = CatalogListRequest | CatalogSaveRequest;

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

async function readBody(request: Request) {
  const rawBody = await request.text();
  if (!rawBody) {
    return null;
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawBody) as CatalogRequest;
    } catch {
      return null;
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(rawBody);
    return {
      key: params.get("key") ?? "",
      action: params.get("action") ?? "list",
    } as CatalogRequest;
  }

  return null;
}

async function readKeyFromRequest(
  request: Request,
  body: CatalogRequest | null,
) {
  const bearerToken = readBearerToken(request);
  if (bearerToken) {
    return bearerToken;
  }

  return body?.key?.trim() ?? "";
}

function buildCatalogPayload(
  decisions: SoundCloudCatalogTrackDecision[],
  overrides: SoundCloudCatalogOverrideMap,
) {
  const items = [...decisions]
    .sort(
      (left, right) =>
        new Date(right.track.created_at).getTime() -
        new Date(left.track.created_at).getTime(),
    )
    .map((decision) => ({
      id: decision.track.id,
      title: decision.track.title,
      genre: decision.track.genre ?? "",
      createdAt: decision.track.created_at,
      permalinkUrl: decision.track.permalink_url,
      playbackCount: decision.track.playback_count ?? 0,
      favoriteCount: decision.track.favoritings_count ?? 0,
      manualAssignment: decision.manualAssignment,
      autoAssignment: decision.autoAssignment,
      effectiveAssignment: decision.effectiveAssignment,
      visibleOnSystem174: decision.visibleOnSystem174,
      reason: decision.reason,
      updatedAt: overrides[String(decision.track.id)]?.updatedAt ?? null,
    }));

  return {
    checkedAt: new Date().toISOString(),
    summary: {
      totalTracks: items.length,
      manualAssignments: items.filter((item) => item.manualAssignment !== "auto")
        .length,
      system174: items.filter((item) => item.effectiveAssignment === "system174")
        .length,
      pimpsoul: items.filter((item) => item.effectiveAssignment === "pimpsoul")
        .length,
      andyk: items.filter((item) => item.effectiveAssignment === "andyk").length,
      hidden: items.filter((item) => item.effectiveAssignment === "hidden").length,
    },
    items,
  };
}

function isAssignment(value: unknown): value is SoundCloudCatalogAssignment {
  return (
    value === "auto" ||
    value === "system174" ||
    value === "pimpsoul" ||
    value === "andyk" ||
    value === "hidden"
  );
}

function normalizeAssignments(
  value: CatalogSaveRequest["assignments"],
): Array<{
  trackId: number;
  assignment: SoundCloudCatalogAssignment;
}> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const trackId = Number(entry?.trackId);
      const assignment = entry?.assignment;

      if (!Number.isFinite(trackId) || !isAssignment(assignment)) {
        return null;
      }

      return {
        trackId,
        assignment,
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        trackId: number;
        assignment: SoundCloudCatalogAssignment;
      } => entry !== null,
    );
}

export async function GET() {
  return json(
    { error: "Use POST to manage the SoundCloud track catalog." },
    405,
  );
}

export async function POST(request: Request) {
  const adminPassword = getAdminDashboardPassword();

  if (!adminPassword) {
    return notFound();
  }

  const body = await readBody(request);
  if (!hasAuthorizedAdminSession(request)) {
    const providedKey = await readKeyFromRequest(request, body);
    if (!matchesAdminPassword(providedKey)) {
      return json({ error: "Unauthorized" }, 401);
    }
  }

  const action = body?.action ?? "list";

  if (action === "save") {
    const assignments = normalizeAssignments(
      (body as CatalogSaveRequest | null)?.assignments,
    );

    if (!assignments.length) {
      return json({ error: "No valid assignments were provided." }, 400);
    }

    const overrides = await updateSoundCloudCatalogAssignments(assignments);
    const data = await getCachedSoundCloudDashboardData();
    const decisions = buildTrackCatalogDecisions(data, overrides);

    return json({
      message: `Saved ${assignments.length} track assignment${
        assignments.length === 1 ? "" : "s"
      }.`,
      ...buildCatalogPayload(decisions, overrides),
    });
  }

  const [data, overrides] = await Promise.all([
    getCachedSoundCloudDashboardData(),
    getSoundCloudCatalogOverrides(),
  ]);
  const decisions = buildTrackCatalogDecisions(data, overrides);

  return json({
    message: "Loaded full SoundCloud track catalog for admin review.",
    ...buildCatalogPayload(decisions, overrides),
  });
}
