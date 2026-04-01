"use client";

import { useState } from "react";
import ButtonPrimary from "@/components/ButtonPrimary";
import ButtonSecondary from "@/components/ButtonSecondary";
import Card from "@/components/Card";
import SoundCloudCatalogManager from "@/components/SoundCloudCatalogManager";

export default function SoundCloudStatusPanel() {
  const [summary, setSummary] = useState(
    "Use the dashboard tools below to check live SoundCloud status on the server.",
  );
  const [result, setResult] = useState("Awaiting request...");
  const [busyAction, setBusyAction] = useState<"status" | "refresh" | null>(null);

  const runRequest = async (path: string, action: "status" | "refresh") => {
    setBusyAction(action);
    setSummary(
      action === "refresh"
        ? "Refreshing SoundCloud cache from live API data..."
        : "Checking live SoundCloud status...",
    );
    setResult("Loading...");

    try {
      const response = await fetch(path, {
        method: "POST",
        cache: "no-store",
      });

      const raw = await response.text();
      let payload: Record<string, unknown> = { error: raw || "Unexpected response" };

      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        // Keep the raw response fallback above.
      }

      if (!response.ok) {
        setSummary(
          typeof payload.error === "string"
            ? payload.error
            : `Request failed (${response.status}).`,
        );
        setResult(JSON.stringify(payload, null, 2));
        return;
      }

      setSummary(
        typeof payload.message === "string"
          ? payload.message
          : action === "refresh"
            ? "Cache refreshed."
            : "Status loaded.",
      );
      setResult(JSON.stringify(payload, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSummary(
        action === "refresh"
          ? "SoundCloud cache refresh failed."
          : "SoundCloud status request failed.",
      );
      setResult(JSON.stringify({ error: message }, null, 2));
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div id="connection-status" className="scroll-mt-28 lg:col-span-7">
        <Card>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              await runRequest("/api/soundcloud/status", "status");
            }}
          >
            <p className="text-sm leading-relaxed text-[#AAB6C6]">
              This checks whether the live server has SoundCloud OAuth config, whether it has
              tokens, whether real requests to SoundCloud are still working, and what state the
              cached catalog data is currently in.
            </p>

            <div className="flex flex-wrap gap-3">
              <ButtonPrimary type="submit" disabled={busyAction !== null}>
                {busyAction === "status" ? "CHECKING..." : "CHECK STATUS"}
              </ButtonPrimary>
              <ButtonSecondary
                type="button"
                disabled={busyAction !== null}
                onClick={() => {
                  void runRequest("/api/soundcloud/cache-refresh", "refresh");
                }}
              >
                {busyAction === "refresh" ? "REFRESHING..." : "REFRESH CACHE"}
              </ButtonSecondary>
            </div>
          </form>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">Checks</p>
          <p className="mt-3 text-sm leading-relaxed text-[#AAB6C6]">
            This reports whether the live server has SoundCloud OAuth config, whether it has
            tokens, whether real requests to SoundCloud are still working, and what state the
            7-day catalog cache is currently in.
          </p>
        </Card>
        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
            Safe Output
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#AAB6C6]">
            Status details only. No access token or refresh token is returned by this page.
          </p>
        </Card>
        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
            Cache Control
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#AAB6C6]">
            Use <span className="text-white">REFRESH CACHE</span> after posting a new track or
            playlist to SoundCloud if you want the public catalog pages to update immediately
            instead of waiting for the 7-day cache window.
          </p>
        </Card>
      </div>

      <div id="status-output" className="scroll-mt-28 lg:col-span-12">
        <Card>
          <p className="text-sm text-[#AAB6C6]">{summary}</p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0A0C10]/60 p-4 text-xs leading-relaxed text-[#E7EDF6]">
            {result}
          </pre>
        </Card>
      </div>

      <div id="track-assignment" className="scroll-mt-28 lg:col-span-12">
        <SoundCloudCatalogManager />
      </div>
    </div>
  );
}
