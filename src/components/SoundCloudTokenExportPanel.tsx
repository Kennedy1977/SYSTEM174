"use client";

import { useState } from "react";
import ButtonPrimary from "@/components/ButtonPrimary";
import Card from "@/components/Card";

export default function SoundCloudTokenExportPanel() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState(
    "Enter the export key to fetch the current SoundCloud token pair from the live server.",
  );
  const [result, setResult] = useState("Awaiting request...");
  const [refreshToken, setRefreshToken] = useState("");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Card>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();

              const trimmedKey = key.trim();
              setRefreshToken("");

              if (!trimmedKey) {
                setStatus("Enter the export key first.");
                setResult("Awaiting request...");
                return;
              }

              setStatus("Requesting current SoundCloud tokens...");
              setResult("Loading...");

              try {
                const response = await fetch("/api/soundcloud/token-export", {
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
                  setStatus(
                    typeof payload.error === "string"
                      ? payload.error
                      : `Request failed (${response.status}).`,
                  );
                  setResult(JSON.stringify(payload, null, 2));
                  return;
                }

                const nextRefreshToken =
                  typeof payload.SOUNDCLOUD_REFRESH_TOKEN === "string"
                    ? payload.SOUNDCLOUD_REFRESH_TOKEN
                    : "";

                setRefreshToken(nextRefreshToken);
                setStatus(
                  "Tokens loaded. Copy the refresh token into your env, then remove the export key.",
                );
                setResult(JSON.stringify(payload, null, 2));
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                setStatus("Token export request failed.");
                setResult(JSON.stringify({ error: message }, null, 2));
              }
            }}
          >
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
                Export Key
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
                This must match the deployed <code>SOUNDCLOUD_TOKEN_EXPORT_KEY</code> value.
              </p>
            </label>

            <div className="flex flex-wrap gap-3">
              <ButtonPrimary type="submit">REVEAL TOKENS</ButtonPrimary>
              <button
                type="button"
                disabled={!refreshToken}
                onClick={async () => {
                  if (!refreshToken) {
                    return;
                  }

                  try {
                    await navigator.clipboard.writeText(refreshToken);
                    setStatus(
                      "Refresh token copied. Remove SOUNDCLOUD_TOKEN_EXPORT_KEY after updating your env.",
                    );
                  } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    setStatus(`Unable to copy the refresh token: ${message}`);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-[#E7EDF6] transition duration-150 ease-out hover:border-white/30 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#0A0C10] disabled:cursor-not-allowed disabled:opacity-40"
              >
                COPY REFRESH TOKEN
              </button>
            </div>
          </form>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">Use Once</p>
          <p className="mt-3 text-sm leading-relaxed text-[#AAB6C6]">
            After you copy the current token pair into your host env, delete{" "}
            <code>SOUNDCLOUD_TOKEN_EXPORT_KEY</code> from the server and redeploy or restart the
            app.
          </p>
        </Card>
        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
            Next Step
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#AAB6C6]">
            Update <code>SOUNDCLOUD_ACCESS_TOKEN</code> and{" "}
            <code>SOUNDCLOUD_REFRESH_TOKEN</code> in your persistent env with the values shown
            below.
          </p>
        </Card>
      </div>

      <div className="lg:col-span-12">
        <Card>
          <p className="text-sm text-[#AAB6C6]">{status}</p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#0A0C10]/60 p-4 text-xs leading-relaxed text-[#E7EDF6]">
            {result}
          </pre>
        </Card>
      </div>
    </div>
  );
}
