"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PagePulse } from "@/components/PagePulse";
import { loadSelfLearn } from "@/lib/self-learn";
import { getToolBySlug } from "@/lib/tools-registry";

type Payload = {
  signedIn?: boolean;
  chat?: { role: string; content: string; created?: string }[];
  tools?: { tool_id: string; run_count: number; usage_date?: string }[];
  api?: { tool_id?: string; created_at?: string; metadata?: unknown }[];
};

export function HistoryClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [localTools, setLocalTools] = useState<{ slug: string; n: number }[]>([]);
  const [localChat, setLocalChat] = useState<{ role: string; content: string }[]>([]);

  useEffect(() => {
    try {
      const s = loadSelfLearn();
      setLocalTools(
        Object.entries(s.toolCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([slug, n]) => ({ slug, n }))
      );
    } catch {
      /* */
    }
    try {
      const raw = localStorage.getItem("plethora.chat.history.v1");
      if (raw) {
        const msgs = JSON.parse(raw) as { role: string; content: string }[];
        setLocalChat(msgs.filter((m) => m.role !== "system").slice(-30).reverse());
      }
    } catch {
      /* */
    }
    void fetch("/api/account/history")
      .then((r) => r.json())
      .then((d: Payload) => setData(d))
      .catch(() => setData({}));
  }, []);

  if (!data) return <PagePulse title="Loading history" hint="Tools, chats, and API-style runs from this account and this browser." />;

  const cloudTools = data.tools || [];
  const cloudChat = data.chat || [];
  const api = data.api || [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
          Activity
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">History</h1>
        <p className="mt-2 text-sm text-zinc-400">
          What you used: Plethora tools, chat, and API-style runs. Browser-only usage stays on this
          device if you’re not signed in.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-white">Tools & services</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          {cloudTools.length === 0 && localTools.length === 0 && (
            <li className="text-zinc-500">No tool runs yet.</li>
          )}
          {cloudTools.map((t) => (
            <li key={`${t.tool_id}-${t.usage_date}`} className="flex justify-between gap-3">
              <span>{t.tool_id}</span>
              <span className="text-zinc-500">
                {t.run_count}× {t.usage_date || ""}
              </span>
            </li>
          ))}
          {localTools.map((t) => (
            <li key={t.slug} className="flex justify-between gap-3">
              <Link href={`/tools/${t.slug}`} className="text-violet-300 hover:underline">
                {getToolBySlug(t.slug)?.name || t.slug}
              </Link>
              <span className="text-zinc-500">{t.n}× this browser</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-white">API / tool-run log</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          {api.length === 0 && <li className="text-zinc-500">No API-style runs stored yet.</li>}
          {api.map((r, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>{r.tool_id || "run"}</span>
              <span className="text-zinc-500">{r.created_at || ""}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-white">Chat</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {(cloudChat.length ? cloudChat : localChat).map((m, i) => (
            <li key={i}>
              <p className="text-[11px] uppercase text-zinc-500">{m.role}</p>
              <p className="text-zinc-200">{m.content}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
