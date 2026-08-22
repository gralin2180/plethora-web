"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listMiniApps, type MiniApp } from "@/lib/mini-apps";

export function ProjectsList() {
  const [apps, setApps] = useState<MiniApp[]>([]);
  useEffect(() => {
    setApps(listMiniApps());
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-white">Your apps</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Built from Chat. Each one lives at a clean URL — source stays out of the transcript.
      </p>
      {apps.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">
          Nothing yet. In Chat, ask to build a tracker or web app.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {apps.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/projects/${a.slug}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:border-violet-500/40"
              >
                <span>
                  <span className="block font-medium text-white">{a.title}</span>
                  <span className="text-[11px] text-zinc-500">/projects/{a.slug}</span>
                </span>
                <span className="text-xs text-violet-300">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
