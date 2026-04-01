"use client";

import { useState } from "react";
import ButtonPrimary from "@/components/ButtonPrimary";
import Card from "@/components/Card";

export default function SoundCloudStatusPanel() {
  const [key, setKey] = useState("");
  const [summary, setSummary] = useState(
    "Enter the admin key to check the current SoundCloud status on the live server.",
  );
  const [result, setResult] = useState("Awaiting request...");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Card>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();

              const trimmedKey = key.trim();
              if (!trimmedKey) {
                setSummary("Enter the admin key first.");
                setResult("Awaiting request...");
                return;
              }

              setSummary("Checking live SoundCloud status...");
              setResult("Loading...");

              try {
                const response = await fetch("/api/soundcloud/status", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  cache: "no-store",
                  body: JSON.stringify({ key: trimmedKey }),
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
                  typeof payload.message === "string" ? payload.message : "Status loaded.",
                );
                setResult(JSON.stringify(payload, null, 2));
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                setSummary("SoundCloud status request failed.");
                setResult(JSON.stringify({ error: message }, null, 2));
              }
            }}
          >
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
                Admin Key
              </span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Temporary server-side export key"
                value={key}
                onChange={(event) => {
                  setKey(event.currentTarget.value);
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0A0C10]/40 px-3 py-2 text-sm text-[#E7EDF6] placeholder:text-[#77849A] focus:border-[#5CC8FF]/50 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/50"
              />
              <p className="mt-2 text-xs text-[#77849A]">
                This uses the deployed <code>SOUNDCLOUD_TOKEN_EXPORT_KEY</code> value, but it
                does not expose raw token values.
              </p>
            </label>

            <div className="flex flex-wrap gap-3">
              <ButtonPrimary type="submit">CHECK STATUS</ButtonPrimary>
            </div>
          </form>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">Checks</p>
          <p className="mt-3 text-sm leading-relaxed text-[#AAB6C6]">
            This reports whether the live server has SoundCloud OAuth config, whether it has
            tokens, and whether real requests to SoundCloud are still working.
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
      </div>

      <div className="lg:col-span-12">
        <Card>
          <p className="text-sm text-[#AAB6C6]">{summary}</p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0A0C10]/60 p-4 text-xs leading-relaxed text-[#E7EDF6]">
            {result}
          </pre>
        </Card>
      </div>
    </div>
  );
}
