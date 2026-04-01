import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SoundCloudCatalogAssignment =
  | "auto"
  | "system174"
  | "pimpsoul"
  | "andyk"
  | "hidden";

export type SoundCloudCatalogOverrideEntry = {
  assignment: Exclude<SoundCloudCatalogAssignment, "auto">;
  updatedAt: string;
};

export type SoundCloudCatalogOverrideMap = Record<
  string,
  SoundCloudCatalogOverrideEntry
>;

type PersistedCatalogOverrides = Partial<{
  overrides: Record<string, unknown>;
  trackAssignments: Record<string, unknown>;
}>;

function getEnvValue(key: string) {
  return process.env[key] ?? "";
}

export function getSoundCloudCatalogOverridesPath() {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    getEnvValue("SOUNDCLOUD_CATALOG_OVERRIDES_PATH") ||
      ".soundcloud.catalog-overrides.json",
  );
}

function normalizeAssignment(
  value: unknown,
): Exclude<SoundCloudCatalogAssignment, "auto"> | null {
  return value === "system174" ||
    value === "pimpsoul" ||
    value === "andyk" ||
    value === "hidden"
    ? value
    : null;
}

function normalizeEntry(value: unknown): SoundCloudCatalogOverrideEntry | null {
  if (typeof value === "string") {
    const assignment = normalizeAssignment(value);
    if (!assignment) {
      return null;
    }

    return {
      assignment,
      updatedAt: new Date(0).toISOString(),
    };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entry = value as Record<string, unknown>;
  const assignment = normalizeAssignment(entry.assignment);
  if (!assignment) {
    return null;
  }

  return {
    assignment,
    updatedAt:
      typeof entry.updatedAt === "string" && entry.updatedAt
        ? entry.updatedAt
        : new Date(0).toISOString(),
  };
}

function normalizeOverrides(value: unknown): SoundCloudCatalogOverrideMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const normalized: SoundCloudCatalogOverrideMap = {};

  for (const [trackId, entry] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const parsed = normalizeEntry(entry);
    if (parsed) {
      normalized[trackId] = parsed;
    }
  }

  return normalized;
}

export async function getSoundCloudCatalogOverrides(): Promise<SoundCloudCatalogOverrideMap> {
  try {
    const raw = await readFile(getSoundCloudCatalogOverridesPath(), "utf-8");
    const parsed = JSON.parse(raw) as PersistedCatalogOverrides | unknown;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const payload = parsed as PersistedCatalogOverrides;
      return normalizeOverrides(payload.overrides ?? payload.trackAssignments);
    }

    return normalizeOverrides(parsed);
  } catch (error) {
    if ((error as { code?: string }).code !== "ENOENT") {
      console.warn("[soundcloud] unable to read catalog overrides", error);
    }

    return {};
  }
}

async function writeSoundCloudCatalogOverrides(
  overrides: SoundCloudCatalogOverrideMap,
) {
  const payload = {
    generated_at: new Date().toISOString(),
    overrides,
  };

  const overridesPath = getSoundCloudCatalogOverridesPath();
  await mkdir(path.dirname(overridesPath), { recursive: true });
  await writeFile(overridesPath, JSON.stringify(payload, null, 2), "utf-8");
}

export async function updateSoundCloudCatalogAssignments(
  updates: Array<{
    trackId: number;
    assignment: SoundCloudCatalogAssignment;
  }>,
) {
  const current = await getSoundCloudCatalogOverrides();
  const next: SoundCloudCatalogOverrideMap = { ...current };
  const updatedAt = new Date().toISOString();

  for (const update of updates) {
    const key = String(update.trackId);

    if (update.assignment === "auto") {
      delete next[key];
      continue;
    }

    next[key] = {
      assignment: update.assignment,
      updatedAt,
    };
  }

  await writeSoundCloudCatalogOverrides(next);
  return next;
}
