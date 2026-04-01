"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ButtonPrimary from "@/components/ButtonPrimary";
import Card from "@/components/Card";

export default function AdminLoginGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(
    "Enter the admin password to access the dashboard.",
  );
  const [busy, setBusy] = useState(false);

  return (
    <Card className="mx-auto max-w-xl">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();

          const trimmedPassword = password.trim();
          if (!trimmedPassword) {
            setStatus("Enter the admin password first.");
            return;
          }

          setBusy(true);
          setStatus("Checking password...");

          try {
            const response = await fetch("/api/admin/login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              cache: "no-store",
              body: JSON.stringify({
                password: trimmedPassword,
              }),
            });

            const payload = (await response.json().catch(() => null)) as
              | { error?: string; message?: string }
              | null;

            if (!response.ok) {
              setStatus(payload?.error || "Login failed.");
              return;
            }

            setStatus(payload?.message || "Access granted.");
            router.refresh();
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setStatus(`Login request failed: ${message}`);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
            Admin Access
          </p>
          <h1 className="mt-3 font-display text-3xl uppercase tracking-[-0.015em] text-white">
            Dashboard Locked
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#AAB6C6]">
            This area is restricted. Once you unlock it, you can check SoundCloud status, refresh
            the cache, manage track assignments, and export tokens.
          </p>
        </div>

        <label className="block">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#AAB6C6]">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.currentTarget.value);
            }}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#0A0C10]/40 px-3 py-2 text-sm text-[#E7EDF6] placeholder:text-[#77849A] focus:border-[#5CC8FF]/50 focus:outline-none focus:ring-2 focus:ring-[#5CC8FF]/50"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonPrimary type="submit" disabled={busy}>
            {busy ? "UNLOCKING..." : "UNLOCK DASHBOARD"}
          </ButtonPrimary>
          <p className="text-sm text-[#AAB6C6]">{status}</p>
        </div>
      </form>
    </Card>
  );
}
