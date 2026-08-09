"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrCreateDeviceKey, guessDeviceLabel } from "@/lib/device";
import { MonitorSmartphone, X } from "lucide-react";

/**
 * Heartbeats device seat after login. Soft limit — allows browsing but surfaces
 * a banner when the plan's max devices is exceeded.
 */
export function DeviceSeatGuard({ enabled }: { enabled: boolean }) {
  const [limitHit, setLimitHit] = useState<{
    message: string;
    limit: number;
    devices: { id: string; label: string | null; last_seen_at: string }[];
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [schemaHint, setSchemaHint] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function beat() {
      try {
        const res = await fetch("/api/devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceKey: getOrCreateDeviceKey(),
            label: guessDeviceLabel(),
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.code === "schema") {
          setSchemaHint(true);
          return;
        }
        if (res.status === 403 && data.code === "device_limit") {
          setLimitHit({
            message: data.error || "Device limit reached",
            limit: data.limit,
            devices: data.devices || [],
          });
        } else {
          setLimitHit(null);
        }
      } catch {
        /* offline / no auth cookie */
      }
    }

    void beat();
    const t = setInterval(() => void beat(), 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [enabled]);

  if (!enabled || dismissed) return null;

  if (schemaHint) {
    return (
      <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100/90">
        Device seats need a one-time SQL deploy — run{" "}
        <code className="rounded bg-black/30 px-1">supabase/workspaces_devices.sql</code> in
        your Supabase project.{" "}
        <button type="button" className="underline" onClick={() => setDismissed(true)}>
          Dismiss
        </button>
      </div>
    );
  }

  if (!limitHit) return null;

  async function revoke(id: string) {
    await fetch(`/api/devices?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceKey: getOrCreateDeviceKey(),
        label: guessDeviceLabel(),
      }),
    });
    if (res.ok) setLimitHit(null);
    else {
      const data = await res.json();
      if (data.code === "device_limit") {
        setLimitHit({
          message: data.error,
          limit: data.limit,
          devices: data.devices || [],
        });
      }
    }
  }

  return (
    <div className="border-b border-rose-500/30 bg-rose-950/40 px-4 py-3">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-2 text-sm text-rose-100">
          <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{limitHit.message}</p>
            <p className="mt-1 text-xs text-rose-200/70">
              Free accounts have a few concurrent browsers; paid plans unlock more. Remove a
              device below or{" "}
              <Link href="/pricing" className="underline hover:text-white">
                upgrade
              </Link>
              .
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {limitHit.devices.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4">
                  <span className="text-rose-100/90">
                    {d.label || "Device"} · last{" "}
                    {new Date(d.last_seen_at).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => void revoke(d.id)}
                    className="text-rose-300 underline hover:text-white"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="self-end text-rose-300/80 hover:text-white sm:self-start"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
