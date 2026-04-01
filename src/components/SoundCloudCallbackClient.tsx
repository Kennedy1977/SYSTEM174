"use client";

import { useEffect, useState } from "react";

function readCookieValue(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export default function SoundCloudCallbackClient() {
  const [status, setStatus] = useState("Finalizing OAuth handshake...");

  useEffect(() => {
    const run = async () => {
      const query = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith("#")
        ? new URLSearchParams(window.location.hash.slice(1))
        : new URLSearchParams();
      const hrefMatch = window.location.href.match(/[?&]code=([^&#]+)/);

      const code =
        query.get("code") ||
        hash.get("code") ||
        (hrefMatch ? decodeURIComponent(hrefMatch[1]) : "") ||
        readCookieValue("sc_oauth_code");
      const error = query.get("error") || hash.get("error") || "";
      const errorDescription =
        query.get("error_description") || hash.get("error_description") || "";

      if (error) {
        setStatus(
          `SoundCloud error: ${error}${errorDescription ? ` (${errorDescription})` : ""}`,
        );
        return;
      }

      if (!code) {
        setStatus("No OAuth code detected in callback URL or cookie.");
        return;
      }

      try {
        const response = await fetch(
          `/api/soundcloud/exchange?code=${encodeURIComponent(code)}`,
          {
            method: "GET",
          },
        );

        if (!response.ok) {
          const text = await response.text();
          setStatus(`Token exchange failed: ${text}`);
          return;
        }

        window.location.href = "/?sc=connected";
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatus(`Token exchange failed: ${message}`);
      }
    };

    void run();
  }, []);

  return (
    <section className="mx-auto max-w-3xl px-5 py-24 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl uppercase tracking-[-0.015em] md:text-4xl">
        Connecting SoundCloud
      </h1>
      <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">{status}</p>
    </section>
  );
}
