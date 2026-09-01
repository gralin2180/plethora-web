"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Monitor, Plus, Server, Trash2 } from "lucide-react";
import {
  GPU_WORKER_NOTES,
  INFRA_ENV_HELP,
  PARSEC_NOTES,
  RUSTDESK_COMPOSE,
  type AiScaleMode,
  type RemoteHost,
  type RemoteKind,
} from "@/lib/infra-control";

const HOSTS_KEY = "plethora.infra.hosts.v1";

export function InfraControlDesk() {
  const [hosts, setHosts] = useState<RemoteHost[]>([]);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [scale, setScale] = useState<AiScaleMode>("capped");
  const [freeDaily, setFreeDaily] = useState(40);
  const [premiumMonth, setPremiumMonth] = useState(0);
  const [envScale, setEnvScale] = useState<string>("capped");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<RemoteKind>("rustdesk");
  const [address, setAddress] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HOSTS_KEY);
      if (raw) setHosts(JSON.parse(raw) as RemoteHost[]);
    } catch {
      /* */
    }
    setReady(true);
    void fetch("/api/infra/policy")
      .then((r) => r.json())
      .then((d: {
        admin?: boolean;
        policy?: { scale?: AiScaleMode; freeDaily?: number; premiumMonth?: number };
        env?: { scale?: string };
      }) => {
        setAdmin(Boolean(d.admin));
        if (d.policy?.scale) setScale(d.policy.scale);
        if (typeof d.policy?.freeDaily === "number") setFreeDaily(d.policy.freeDaily);
        if (typeof d.policy?.premiumMonth === "number") setPremiumMonth(d.policy.premiumMonth);
        if (d.env?.scale) setEnvScale(d.env.scale);
      })
      .catch(() => {
        /* */
      });
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(HOSTS_KEY, JSON.stringify(hosts));
    } catch {
      /* */
    }
  }, [hosts, ready]);

  async function savePolicy() {
    setBusy(true);
    setNote("");
    try {
      const r = await fetch("/api/infra/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scale, freeDaily, premiumMonth }),
      });
      const d = (await r.json()) as { error?: string; ok?: boolean };
      if (!r.ok) setNote(d.error || "Could not save. Admin email / env required for live scale.");
      else setNote("Policy saved for this session. Production full-scale also needs PLETHORA_ORG_AI_SCALE on the server.");
    } catch {
      setNote("Network error");
    }
    setBusy(false);
  }

  function addHost() {
    if (!name.trim() || !address.trim()) return;
    setHosts((h) => [
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        kind,
        address: address.trim(),
        notes: "",
      },
      ...h,
    ]);
    setName("");
    setAddress("");
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-400">
        Parsec and RustDesk stay those products. This desk inventories hosts, gives you a RustDesk
        relay compose, and lets an admin set AI to <strong className="text-zinc-200">capped</strong>,{" "}
        <strong className="text-zinc-200">full scale</strong>, or custom quotas. We do not run
        Parsec’s proprietary relay.
      </p>

      <section className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-5">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-cyan-300">
          <Server className="h-3.5 w-3.5" />
          AI scale (admin)
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Live server mode: <span className="text-zinc-300">{envScale}</span>
          {admin ? " · you are an admin on this account" : " · signed-in admin required to change live policy"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["capped", "Per plan / guest caps"],
              ["full", "Full scale (org pays GPU/API)"],
              ["custom", "Custom numbers"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setScale(id)}
              className={`rounded-full px-3 py-1.5 text-xs ${
                scale === id ? "bg-cyan-600 text-white" : "border border-white/15 text-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {scale === "custom" ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">
              Free msgs / user / day
              <input
                type="number"
                min={1}
                value={freeDaily}
                onChange={(e) => setFreeDaily(Number(e.target.value) || 1)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Premium msgs / user / month
              <input
                type="number"
                min={0}
                value={premiumMonth}
                onChange={(e) => setPremiumMonth(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
              />
            </label>
          </div>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void savePolicy()}
          className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          Save AI policy
        </button>
        {note ? <p className="mt-2 text-sm text-amber-200">{note}</p> : null}
        <ul className="mt-4 space-y-1 text-[11px] text-zinc-500">
          {INFRA_ENV_HELP.map((e) => (
            <li key={e.key}>
              <code className="text-zinc-400">{e.key}</code> — {e.meaning}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-violet-300">
          <Monitor className="h-3.5 w-3.5" />
          Remote hosts (this browser)
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Edit bay / GPU box"
            className="rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as RemoteKind)}
            className="rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
          >
            <option value="rustdesk">RustDesk</option>
            <option value="parsec">Parsec</option>
            <option value="ssh">SSH / tunnel</option>
            <option value="rdp">RDP</option>
          </select>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={kind === "rustdesk" ? "RustDesk ID" : kind === "parsec" ? "Parsec peer name" : "host:port"}
            className="rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          type="button"
          onClick={addHost}
          className="mt-2 inline-flex items-center gap-1 text-sm text-cyan-300"
        >
          <Plus className="h-4 w-4" /> Add host
        </button>
        <ul className="mt-3 space-y-2">
          {hosts.map((h) => (
            <li
              key={h.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-white/10 px-3 py-2"
            >
              <div>
                <p className="text-sm text-white">{h.name}</p>
                <p className="text-xs text-zinc-500">
                  {h.kind} · {h.address}
                </p>
                {h.kind === "parsec" ? (
                  <a
                    href="https://parsec.app/downloads"
                    className="text-[11px] text-violet-300 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Parsec client
                  </a>
                ) : null}
                {h.kind === "rustdesk" ? (
                  <a
                    href="https://rustdesk.com/download"
                    className="text-[11px] text-violet-300 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open RustDesk client
                  </a>
                ) : null}
              </div>
              <button type="button" onClick={() => setHosts((x) => x.filter((y) => y.id !== h.id))}>
                <Trash2 className="h-4 w-4 text-zinc-500" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            RustDesk self-host (hbbs + hbbr)
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-violet-300"
            onClick={() => void navigator.clipboard.writeText(RUSTDESK_COMPOSE)}
          >
            <Copy className="h-3 w-3" /> Copy compose
          </button>
        </div>
        <pre className="mt-2 max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-zinc-400">
          {RUSTDESK_COMPOSE}
        </pre>
        <p className="mt-2 text-xs text-zinc-500">
          Point clients at your ID/relay server. LAN gaming / GPU: Parsec is often smoother; RustDesk
          you can own. After the box is up, add Ollama in{" "}
          <Link href="/settings/backends" className="text-violet-300 hover:underline">
            Local backends
          </Link>
          .
        </p>
      </section>

      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Parsec</p>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-zinc-400">
          {PARSEC_NOTES}
        </pre>
      </section>

      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">GPU worker</p>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-zinc-400">
          {GPU_WORKER_NOTES}
        </pre>
      </section>
    </div>
  );
}
