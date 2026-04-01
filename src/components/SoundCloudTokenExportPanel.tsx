"use client";

import { useState } from "react";
import ButtonPrimary from "@/components/ButtonPrimary";
import Card from "@/components/Card";

export default function SoundCloudTokenExportPanel() {
  const [status, setStatus] = useState(
    "Use this tool to fetch the current SoundCloud token pair from the live server.",
  );
  const [result, setResult] = useState("Awaiting request...");
  const [refreshToken, setRefreshToken] = useState("");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div id="token-export-tools" className="scroll-mt-28 lg:col-span-7">
        <Card>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();

              setRefreshToken("");

              setStatus("Requesting current SoundCloud tokens...");
              setResult("Loading...");

              try {
                const response = await fetch("/api/soundcloud/token-export", {
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
                  "Tokens loaded. Copy the refresh token into your env, then lock the dashboard when you are done.",
                );
                setResult(JSON.stringify(payload, null, 2));
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                setStatus("Token export request failed.");
                setResult(JSON.stringify({ error: message }, null, 2));
              }
            }}
          >
            <p className="text-sm leading-relaxed text-[#AAB6C6]">
              Because you are already inside the password-protected admin dashboard, this page can
              reveal the current SoundCloud token pair directly.
            </p>

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
                      "Refresh token copied. Update your env, then lock the dashboard when finished.",
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
            After you copy the current token pair into your host env, lock the dashboard again if
            you do not need further admin access.
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
