"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import ButtonPrimary from "@/components/ButtonPrimary";
import ButtonSecondary from "@/components/ButtonSecondary";
import Card from "@/components/Card";
import { getSoundCloudPlayerUrl } from "@/lib/soundcloud-embed";
import type { SoundCloudCatalogAssignment } from "@/lib/soundcloud-catalog-overrides";

type CatalogItem = {
  id: number;
  title: string;
  genre: string;
  artworkUrl: string;
  createdAt: string;
  permalinkUrl: string;
  playbackCount: number;
  favoriteCount: number;
  manualAssignment: SoundCloudCatalogAssignment;
  autoAssignment: Exclude<SoundCloudCatalogAssignment, "auto" | "hidden">;
  effectiveAssignment: Exclude<SoundCloudCatalogAssignment, "auto">;
  visibleOnSystem174: boolean;
  reason: string;
  updatedAt: string | null;
};

type CatalogPayload = {
  message?: string;
  storage: {
    resolvedPath: string;
    configuredPath: string;
    usingDefaultPath: boolean;
  };
  backup: {
    exportedAt: string;
    assignmentCount: number;
    overrides: Record<
      string,
      {
        assignment: Exclude<SoundCloudCatalogAssignment, "auto">;
        updatedAt: string;
      }
    >;
  };
  summary: {
    totalTracks: number;
    manualAssignments: number;
    system174: number;
    pimpsoul: number;
    andyk: number;
    hidden: number;
  };
  items: CatalogItem[];
};

const assignmentOptions: Array<{
  value: SoundCloudCatalogAssignment;
  label: string;
}> = [
  { value: "auto", label: "Auto" },
  { value: "system174", label: "SYSTEM 174" },
  { value: "pimpsoul", label: "The Pimpsoul Project" },
  { value: "andyk", label: "Andy K / Archive" },
  { value: "hidden", label: "Hidden" },
];

const viewFilters = [
  { value: "all", label: "All tracks" },
  { value: "system174", label: "SYSTEM 174" },
  { value: "pimpsoul", label: "The Pimpsoul Project" },
  { value: "andyk", label: "Andy K / Archive" },
  { value: "hidden", label: "Hidden" },
  { value: "manual", label: "Manual only" },
] as const;

type ViewFilter = (typeof viewFilters)[number]["value"];

type CatalogBackup = CatalogPayload["backup"];

const browserBackupStorageKey = "system174.soundcloud.catalog-backup";

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatBrandLabel(value: Exclude<SoundCloudCatalogAssignment, "auto">) {
  if (value === "system174") {
    return "SYSTEM 174";
  }

  if (value === "pimpsoul") {
    return "The Pimpsoul Project";
  }

  if (value === "andyk") {
    return "Andy K / Archive";
  }

  return "Hidden";
}

function formatTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function buildBackupFromCatalog(catalog: CatalogPayload): CatalogBackup {
  const overrides: CatalogBackup["overrides"] = {};

  for (const item of catalog.items) {
    if (item.manualAssignment === "auto") {
      continue;
    }

    overrides[String(item.id)] = {
      assignment: item.manualAssignment,
      updatedAt: item.updatedAt ?? new Date().toISOString(),
    };
  }

  return {
    exportedAt: new Date().toISOString(),
    assignmentCount: Object.keys(overrides).length,
    overrides,
  };
}

function buildBackupFilename() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `system174-soundcloud-track-assignments-${stamp}.json`;
}

function downloadBackupPayload(backup: CatalogBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildBackupFilename();
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export default function SoundCloudCatalogManager() {
  const [status, setStatus] = useState(
    "Load the full SoundCloud catalog here, then decide which tracks belong to SYSTEM 174, The Pimpsoul Project, or the archive.",
  );
  const [catalog, setCatalog] = useState<CatalogPayload | null>(null);
  const [browserBackup, setBrowserBackup] = useState<CatalogBackup | null>(null);
  const [busyAction, setBusyAction] = useState<
    "load" | "save" | "import" | "restore" | null
  >(null);
  const [search, setSearch] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [pendingAssignments, setPendingAssignments] = useState<
    Record<number, SoundCloudCatalogAssignment>
  >({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const dirtyCount = Object.keys(pendingAssignments).length;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(browserBackupStorageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as CatalogBackup;
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.exportedAt === "string" &&
        typeof parsed.assignmentCount === "number" &&
        parsed.overrides &&
        typeof parsed.overrides === "object"
      ) {
        setBrowserBackup(parsed);
      }
    } catch {
      // Ignore malformed browser backups and keep the dashboard usable.
    }
  }, []);

  const visibleItems = useMemo(() => {
    if (!catalog) {
      return [];
    }

    const searchKey = search.trim().toLowerCase();

    return catalog.items.filter((item) => {
      const currentAssignment = pendingAssignments[item.id] ?? item.manualAssignment;
      const effectiveAssignment =
        currentAssignment === "auto" ? item.autoAssignment : currentAssignment;

      const matchesSearch =
        !searchKey ||
        item.title.toLowerCase().includes(searchKey) ||
        String(item.id).includes(searchKey);

      if (!matchesSearch) {
        return false;
      }

      if (viewFilter === "manual") {
        return currentAssignment !== "auto";
      }

      if (viewFilter === "all") {
        return true;
      }

      return effectiveAssignment === viewFilter;
    });
  }, [catalog, pendingAssignments, search, viewFilter]);

  const persistBrowserBackup = (nextCatalog: CatalogPayload) => {
    const nextBackup = buildBackupFromCatalog(nextCatalog);

    if (nextBackup.assignmentCount === 0) {
      return;
    }

    window.localStorage.setItem(
      browserBackupStorageKey,
      JSON.stringify(nextBackup),
    );
    setBrowserBackup(nextBackup);
  };

  const applyCatalogPayload = (nextCatalog: CatalogPayload, nextStatus: string) => {
    setCatalog(nextCatalog);
    setPendingAssignments({});
    setStatus(nextStatus);
    persistBrowserBackup(nextCatalog);
  };

  const loadCatalog = async () => {
    setBusyAction("load");
    setStatus("Loading the full SoundCloud track list...");

    try {
      const response = await fetch("/api/soundcloud/catalog-manager", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "list",
        }),
      });

      const raw = await response.text();
      let payload: Record<string, unknown> = { error: raw || "Unexpected response" };

      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        // Keep raw fallback.
      }

      if (!response.ok) {
        setStatus(
          typeof payload.error === "string"
            ? payload.error
            : `Catalog request failed (${response.status}).`,
        );
        return;
      }

      const nextCatalog = payload as unknown as CatalogPayload;
      applyCatalogPayload(
        nextCatalog,
        typeof nextCatalog.message === "string"
          ? nextCatalog.message
          : "Track catalog loaded.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Track catalog request failed: ${message}`);
    } finally {
      setBusyAction(null);
    }
  };

  const saveAssignments = async () => {
    const updates = Object.entries(pendingAssignments).map(([trackId, assignment]) => ({
      trackId: Number(trackId),
      assignment,
    }));

    if (!updates.length) {
      setStatus("There are no unsaved assignment changes.");
      return;
    }

    setBusyAction("save");
    setStatus("Saving track assignments...");

    try {
      const response = await fetch("/api/soundcloud/catalog-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          action: "save",
          assignments: updates,
        }),
      });

      const raw = await response.text();
      let payload: Record<string, unknown> = { error: raw || "Unexpected response" };

      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        // Keep raw fallback.
      }

      if (!response.ok) {
        setStatus(
          typeof payload.error === "string"
            ? payload.error
            : `Save failed (${response.status}).`,
        );
        return;
      }

      const nextCatalog = payload as unknown as CatalogPayload;
      applyCatalogPayload(
        nextCatalog,
        typeof nextCatalog.message === "string"
          ? nextCatalog.message
          : "Assignments saved.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Saving assignments failed: ${message}`);
    } finally {
      setBusyAction(null);
    }
  };

  const downloadBackup = (sourceCatalog: CatalogPayload | null = catalog) => {
    if (!sourceCatalog) {
      setStatus("Load the track list first so the dashboard can build a backup file.");
      return;
    }

    const backup = buildBackupFromCatalog(sourceCatalog);
    if (backup.assignmentCount === 0) {
      setStatus("There are no manual track assignments to back up yet.");
      return;
    }

    downloadBackupPayload(backup);
    setStatus(`Downloaded backup with ${backup.assignmentCount} saved track assignments.`);
  };

  const importBackup = async (
    backup: unknown,
    action: "import" | "restore",
    successPrefix: string,
  ) => {
    setBusyAction(action);
    setStatus(
      action === "restore"
        ? "Restoring track assignments from the browser backup..."
        : "Importing saved track assignments...",
    );

    try {
      const response = await fetch("/api/soundcloud/catalog-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          action: "import",
          backup,
        }),
      });

      const raw = await response.text();
      let payload: Record<string, unknown> = { error: raw || "Unexpected response" };

      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        // Keep raw fallback.
      }

      if (!response.ok) {
        setStatus(
          typeof payload.error === "string"
            ? payload.error
            : `Import failed (${response.status}).`,
        );
        return;
      }

      const nextCatalog = payload as unknown as CatalogPayload;
      applyCatalogPayload(
        nextCatalog,
        typeof nextCatalog.message === "string"
          ? `${successPrefix} ${nextCatalog.message}`
          : `${successPrefix} Track assignments restored.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Import failed: ${message}`);
    } finally {
      setBusyAction(null);
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      await importBackup(parsed, "import", `${file.name}:`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Could not read backup file: ${message}`);
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
              Track Catalog
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#AAB6C6]">{status}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonSecondary
              type="button"
              disabled={busyAction !== null}
              onClick={() => {
                void loadCatalog();
              }}
            >
              {busyAction === "load"
                ? "LOADING..."
                : catalog
                  ? "RELOAD TRACK LIST"
                  : "LOAD TRACK LIST"}
            </ButtonSecondary>
            <ButtonSecondary
              type="button"
              disabled={busyAction !== null || !catalog}
              onClick={() => {
                downloadBackup();
              }}
            >
              DOWNLOAD BACKUP
            </ButtonSecondary>
            <ButtonSecondary
              type="button"
              disabled={busyAction !== null}
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              {busyAction === "import" ? "IMPORTING..." : "IMPORT BACKUP"}
            </ButtonSecondary>
            <ButtonPrimary
              type="button"
              disabled={busyAction !== null || dirtyCount === 0}
              onClick={() => {
                void saveAssignments();
              }}
            >
              {busyAction === "save"
                ? "SAVING..."
                : dirtyCount > 0
                  ? `SAVE ${dirtyCount} CHANGE${dirtyCount === 1 ? "" : "S"}`
                  : "SAVE CHANGES"}
            </ButtonPrimary>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-[#77849A]">
          These assignments only control what this website shows. They do not rename, move, or
          edit anything on SoundCloud itself.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            void handleImportFile(event);
          }}
          className="sr-only"
        />
      </Card>

      {browserBackup ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
                Browser Backup
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#AAB6C6]">
                This browser is holding a local backup with {browserBackup.assignmentCount} saved
                track assignment{browserBackup.assignmentCount === 1 ? "" : "s"} from{" "}
                {formatTimestamp(browserBackup.exportedAt)}.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonSecondary
                type="button"
                disabled={busyAction !== null}
                onClick={() => {
                  void importBackup(
                    browserBackup,
                    "restore",
                    "Browser backup restored.",
                  );
                }}
              >
                {busyAction === "restore" ? "RESTORING..." : "RESTORE BROWSER BACKUP"}
              </ButtonSecondary>
              <ButtonSecondary
                type="button"
                disabled={busyAction !== null}
                onClick={() => {
                  downloadBackupPayload(browserBackup);
                  setStatus(
                    `Downloaded browser backup with ${browserBackup.assignmentCount} saved track assignments.`,
                  );
                }}
              >
                DOWNLOAD BROWSER BACKUP
              </ButtonSecondary>
            </div>
          </div>
        </Card>
      ) : null}

      {catalog ? (
        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
            Assignment Storage
          </p>
          <p className="mt-2 break-all text-sm leading-relaxed text-[#AAB6C6]">
            Current storage path: <span className="text-white">{catalog.storage.resolvedPath}</span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[#77849A]">
            {catalog.storage.usingDefaultPath
              ? "This server is using the default local JSON file. If Hostinger redeploys onto a fresh filesystem, these assignments can reset unless you restore a backup or move SOUNDCLOUD_CATALOG_OVERRIDES_PATH to persistent storage."
              : "This server is using SOUNDCLOUD_CATALOG_OVERRIDES_PATH. Keep that path on persistent storage if you want assignments to survive redeploys."}
          </p>
        </Card>
      ) : null}

      {catalog ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Card>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#77849A]">Tracks</p>
              <p className="mt-3 text-2xl text-white">{catalog.summary.totalTracks}</p>
            </Card>
            <Card>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#77849A]">Manual</p>
              <p className="mt-3 text-2xl text-white">{catalog.summary.manualAssignments}</p>
            </Card>
            <Card>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#77849A]">SYSTEM 174</p>
              <p className="mt-3 text-2xl text-[#5CC8FF]">{catalog.summary.system174}</p>
            </Card>
            <Card>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#77849A]">Pimpsoul</p>
              <p className="mt-3 text-2xl text-white">{catalog.summary.pimpsoul}</p>
            </Card>
            <Card>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#77849A]">Andy K</p>
              <p className="mt-3 text-2xl text-white">{catalog.summary.andyk}</p>
            </Card>
            <Card>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#77849A]">Hidden</p>
              <p className="mt-3 text-2xl text-white">{catalog.summary.hidden}</p>
            </Card>
          </div>

          <Card>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
                  Search
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.currentTarget.value);
                  }}
                  placeholder="Track title or SoundCloud ID"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0A0C10]/40 px-3 py-2 text-sm text-[#E7EDF6] placeholder:text-[#77849A] focus:border-[#5CC8FF]/50 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/50"
                />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
                  View
                </span>
                <select
                  value={viewFilter}
                  onChange={(event) => {
                    setViewFilter(event.currentTarget.value as ViewFilter);
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0A0C10]/40 px-3 py-2 text-sm text-[#E7EDF6] focus:border-[#5CC8FF]/50 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/50"
                >
                  {viewFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end justify-start lg:justify-end">
                <ButtonSecondary
                  type="button"
                  disabled={dirtyCount === 0}
                  onClick={() => {
                    setPendingAssignments({});
                    setStatus("Unsaved changes discarded.");
                  }}
                >
                  DISCARD UNSAVED
                </ButtonSecondary>
              </div>
            </div>

            <p className="mt-4 text-xs text-[#77849A]">
              Showing {visibleItems.length} of {catalog.summary.totalTracks} tracks.
            </p>
          </Card>

          <div className="space-y-4">
            {visibleItems.map((item) => {
              const selectedAssignment =
                pendingAssignments[item.id] ?? item.manualAssignment;
              const effectiveAssignment =
                selectedAssignment === "auto"
                  ? item.autoAssignment
                  : selectedAssignment;
              const visibleOnSystem174 = effectiveAssignment === "system174";
              const hasUnsavedChange = pendingAssignments[item.id] !== undefined;
              const detailText = hasUnsavedChange
                ? `Unsaved change: ${formatBrandLabel(effectiveAssignment)} will be applied after saving.`
                : item.reason;
              const playUrl = getSoundCloudPlayerUrl(item.permalinkUrl);
              const pauseUrl = getSoundCloudPlayerUrl(item.permalinkUrl, false);

              return (
                <Card key={item.id} className="space-y-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#77849A]">
                        Track #{item.id}
                      </p>
                      <h3 className="mt-2 text-lg leading-snug text-white">{item.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#AAB6C6]">
                        <span>Created: {formatDate(item.createdAt)}</span>
                        <span>Genre: {item.genre || "Unspecified"}</span>
                        <span>Plays: {formatNumber(item.playbackCount)}</span>
                        <span>Likes: {formatNumber(item.favoriteCount)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#AAB6C6]">
                        Auto: {formatBrandLabel(item.autoAssignment)}
                      </span>
                      <span className="rounded-full border border-[#5CC8FF]/25 bg-[#5CC8FF]/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#DDF5FF]">
                        Current: {formatBrandLabel(effectiveAssignment)}
                      </span>
                      {hasUnsavedChange ? (
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-amber-100">
                          Unsaved
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed text-[#AAB6C6]">{detailText}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          data-sc-source={item.permalinkUrl}
                          data-sc-play={playUrl}
                          data-sc-pause={pauseUrl}
                          data-sc-title={item.title}
                          data-sc-artwork={item.artworkUrl}
                          data-sc-href={item.permalinkUrl}
                          className="inline-flex items-center gap-2 rounded-full border border-[#5CC8FF]/35 bg-[#5CC8FF]/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#DDF5FF] transition duration-150 ease-out hover:border-[#5CC8FF]/60 hover:bg-[#5CC8FF]/14"
                          aria-label={`Play ${item.title}`}
                        >
                          <span
                            data-icon-toggle
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#5CC8FF]/60 bg-[#0A0C10]/70 text-[11px] text-white"
                          >
                            ▶
                          </span>
                          <span>Play</span>
                        </button>
                        <span>
                          Visible on SYSTEM 174: {visibleOnSystem174 ? "Yes" : "No"}
                        </span>
                        {item.updatedAt ? (
                          <span>Last saved: {formatDate(item.updatedAt)}</span>
                        ) : null}
                        <a
                          href={item.permalinkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#5CC8FF] transition hover:text-[#8FDFFF]"
                        >
                          Open on SoundCloud
                        </a>
                      </div>
                    </div>

                    <label className="block">
                      <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
                        Website Assignment
                      </span>
                      <select
                        value={selectedAssignment}
                        onChange={(event) => {
                          const nextAssignment =
                            event.currentTarget.value as SoundCloudCatalogAssignment;

                          setPendingAssignments((current) => {
                            const next = { ...current };
                            if (nextAssignment === item.manualAssignment) {
                              delete next[item.id];
                            } else {
                              next[item.id] = nextAssignment;
                            }
                            return next;
                          });
                        }}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0A0C10]/40 px-3 py-2 text-sm text-[#E7EDF6] focus:border-[#5CC8FF]/50 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/50"
                      >
                        {assignmentOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </Card>
              );
            })}

            {visibleItems.length === 0 ? (
              <Card>
                <p className="text-sm leading-relaxed text-[#AAB6C6]">
                  No tracks match the current search and view filters.
                </p>
              </Card>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
