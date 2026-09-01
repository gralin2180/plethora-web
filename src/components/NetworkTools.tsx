"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Copy,
  Gauge,
  Globe2,
  Loader2,
  Network,
  Radar,
  RefreshCw,
} from "lucide-react";
import { trackToolUse } from "@/lib/self-learn";

async function usage(toolId: string) {
  try {
    trackToolUse(toolId, 2);
    await fetch("/api/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId }),
    });
  } catch {
    /* ignore */
  }
}

function formatMbps(bytes: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return Math.round(((bytes * 8) / seconds / 1_000_000) * 100) / 100;
}

function Shell({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{blurb}</p>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
        {value}
        {unit ? <span className="ml-1 text-sm font-normal text-zinc-400">{unit}</span> : null}
      </p>
    </div>
  );
}

/* ——— Ping ——— */

type PingSample = { ms: number; status: number; ok: boolean; error?: string };

export function PingTestLab() {
  const [target, setTarget] = useState("cloudflare.com");
  const [count, setCount] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [samples, setSamples] = useState<PingSample[]>([]);
  const [stats, setStats] = useState<{ min: number; max: number; avg: number; lossPct: number } | null>(
    null
  );
  const [note, setNote] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    setSamples([]);
    setStats(null);
    try {
      const res = await fetch("/api/network/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ping failed");
      setSamples(data.samples || []);
      setStats(data.stats);
      setNote(data.note || "");
      await usage("ping-test");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ping failed");
    }
    setBusy(false);
  }

  return (
    <Shell
      title="Ping / latency test"
      blurb="HTTP/HTTPS round-trip from Plethora’s edge to a public host (not ICMP — browsers cannot send true ping packets)."
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="hostname or URL"
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
        />
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        >
          {[3, 4, 5, 8, 10].map((n) => (
            <option key={n} value={n}>
              {n} probes
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || !target.trim()}
          onClick={() => void run()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          Run ping
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {note && !error && <p className="text-xs text-zinc-500">{note}</p>}

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Min" value={String(stats.min)} unit="ms" />
          <StatCard label="Avg" value={String(stats.avg)} unit="ms" />
          <StatCard label="Max" value={String(stats.max)} unit="ms" />
          <StatCard label="Loss" value={String(stats.lossPct)} unit="%" />
        </div>
      )}

      {samples.length > 0 && (
        <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
          {samples.map((s, i) => (
            <li
              key={i}
              className="flex items-center justify-between px-4 py-2.5 text-sm tabular-nums"
            >
              <span className="text-zinc-500">#{i + 1}</span>
              <span className={s.ok ? "text-emerald-400" : "text-red-400"}>
                {s.ok ? `${s.ms} ms · HTTP ${s.status}` : `fail · ${s.error || "error"}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

/* ——— Speed test ——— */

export function SpeedTestLab() {
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [latency, setLatency] = useState<number | null>(null);
  const [down, setDown] = useState<number | null>(null);
  const [up, setUp] = useState<number | null>(null);
  const [error, setError] = useState("");

  const measureLatency = useCallback(async () => {
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      const res = await fetch(`/api/network/download?bytes=0&_=${Date.now()}-${i}`, {
        cache: "no-store",
      });
      await res.arrayBuffer();
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const mid = times[Math.floor(times.length / 2)] ?? 0;
    return Math.round(mid * 10) / 10;
  }, []);

  const measureDownload = useCallback(async (bytes: number) => {
    const t0 = performance.now();
    const res = await fetch(`/api/network/download?bytes=${bytes}&_=${Date.now()}`, {
      cache: "no-store",
    });
    const buf = await res.arrayBuffer();
    const sec = (performance.now() - t0) / 1000;
    return formatMbps(buf.byteLength, sec);
  }, []);

  const measureUpload = useCallback(async (bytes: number) => {
    const body = new Uint8Array(bytes);
    let seed = 0x12345678;
    for (let i = 0; i < bytes; i++) {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      body[i] = seed & 0xff;
    }
    const t0 = performance.now();
    const res = await fetch("/api/network/upload", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body,
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Upload test failed");
    await res.json();
    const sec = (performance.now() - t0) / 1000;
    return formatMbps(bytes, sec);
  }, []);

  async function run() {
    setBusy(true);
    setError("");
    setLatency(null);
    setDown(null);
    setUp(null);
    setProgress(5);
    try {
      setPhase("Measuring latency…");
      const lat = await measureLatency();
      setLatency(lat);
      setProgress(25);

      setPhase("Download test…");
      // Warm small, then larger payload
      await measureDownload(50_000);
      setProgress(40);
      const d1 = await measureDownload(750_000);
      setProgress(55);
      const d2 = await measureDownload(1_500_000);
      setDown(Math.max(d1, d2));
      setProgress(70);

      setPhase("Upload test…");
      const u1 = await measureUpload(400_000);
      setProgress(88);
      const u2 = await measureUpload(900_000);
      setUp(Math.max(u1, u2));
      setProgress(100);
      setPhase("Done");
      await usage("speed-test");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speed test failed");
      setPhase("");
    }
    setBusy(false);
  }

  return (
    <Shell
      title="Internet speed test"
      blurb="Estimate download, upload, and latency against this Plethora deployment (your ISP path to Vercel). Good for a quick check — not a lab-certified meter."
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
        {busy ? phase || "Running…" : "Start speed test"}
      </button>

      {(busy || progress > 0) && (
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Latency"
          value={latency != null ? String(latency) : "—"}
          unit={latency != null ? "ms" : undefined}
        />
        <StatCard
          label="Download"
          value={down != null ? String(down) : "—"}
          unit={down != null ? "Mbps" : undefined}
        />
        <StatCard
          label="Upload"
          value={up != null ? String(up) : "—"}
          unit={up != null ? "Mbps" : undefined}
        />
      </div>

      <p className="text-xs text-zinc-600">
        Tip: run twice and use the higher download number — first run can be colder on serverless.
      </p>
    </Shell>
  );
}

/* ——— What's my IP ——— */

type IpInfo = {
  ip: string;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  timezone?: string | null;
  asOrganization?: string | null;
  protocol?: string | null;
  userAgent?: string | null;
  acceptLanguage?: string | null;
};

export function MyIpLab() {
  const [info, setInfo] = useState<IpInfo | null>(null);
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    try {
      const res = await fetch("/api/network/ip", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read IP");
      setInfo(data);
      await usage("whats-my-ip");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyIp() {
    if (!info?.ip) return;
    try {
      await navigator.clipboard.writeText(info.ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const rows: { label: string; value: string }[] = info
    ? [
        { label: "Public IP", value: info.ip },
        { label: "Country", value: info.country || "—" },
        { label: "Region", value: info.region || "—" },
        { label: "City", value: info.city || "—" },
        { label: "Timezone", value: info.timezone || "—" },
        { label: "Network / ASN", value: info.asOrganization || "—" },
        { label: "Browser online", value: online ? "Yes" : "No" },
        { label: "Language", value: info.acceptLanguage || "—" },
      ]
    : [];

  return (
    <Shell
      title="What's my IP"
      blurb="Your public address as seen by this site, plus rough geo and network hints from the edge."
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void load()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200 hover:border-violet-500/40 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
        <button
          type="button"
          onClick={() => void copyIp()}
          disabled={!info?.ip}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm text-white hover:bg-violet-500 disabled:opacity-50"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied" : "Copy IP"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {info && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Your IP</p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-white">{info.ip}</p>
          <dl className="mt-5 grid gap-2 sm:grid-cols-2">
            {rows.slice(1).map((r) => (
              <div key={r.label} className="rounded-xl border border-white/5 px-3 py-2">
                <dt className="text-[11px] text-zinc-500">{r.label}</dt>
                <dd className="mt-0.5 truncate text-sm text-zinc-200">{r.value}</dd>
              </div>
            ))}
          </dl>
          {info.userAgent && (
            <p className="mt-4 break-all text-[11px] leading-relaxed text-zinc-600">{info.userAgent}</p>
          )}
        </div>
      )}
    </Shell>
  );
}

/* ——— DNS lookup ——— */

export function DnsLookupLab() {
  const [host, setHost] = useState("example.com");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<{
    host: string;
    addresses?: { address: string; family: number }[];
    records?: Record<string, unknown>;
    lookupError?: string;
  } | null>(null);

  async function run() {
    setBusy(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/network/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "DNS failed");
      setData(json);
      await usage("dns-lookup");
    } catch (e) {
      setError(e instanceof Error ? e.message : "DNS failed");
    }
    setBusy(false);
  }

  return (
    <Shell
      title="DNS lookup"
      blurb="Resolve A/AAAA/MX/TXT and more for any public domain."
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="domain.com"
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
          onKeyDown={(e) => {
            if (e.key === "Enter") void run();
          }}
        />
        <button
          type="button"
          disabled={busy || !host.trim()}
          onClick={() => void run()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
          Lookup
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {data?.lookupError && (
        <p className="text-sm text-amber-400">A/AAAA lookup: {data.lookupError}</p>
      )}

      {data?.addresses && data.addresses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.addresses.map((a) => (
            <span
              key={`${a.address}-${a.family}`}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-300"
            >
              {a.address}
              <span className="ml-1 text-emerald-500/70">v{a.family}</span>
            </span>
          ))}
        </div>
      )}

      {data?.records && (
        <div className="space-y-2">
          {Object.entries(data.records).map(([type, value]) => {
            if (value == null) return null;
            const text =
              typeof value === "string"
                ? value
                : Array.isArray(value)
                  ? value
                      .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
                      .join("\n")
                  : JSON.stringify(value, null, 2);
            return (
              <div key={type} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  {type}
                </p>
                <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-zinc-300">
                  {text}
                </pre>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

/* ——— Full internet diagnostics desk ——— */

type DiagTab = "overview" | "speed" | "ping" | "dns" | "ip";

export function InternetDiagnosticsLab() {
  const [tab, setTab] = useState<DiagTab>("overview");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [ip, setIp] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [down, setDown] = useState<number | null>(null);
  const [up, setUp] = useState<number | null>(null);
  const [pingAvg, setPingAvg] = useState<number | null>(null);
  const [pingLoss, setPingLoss] = useState<number | null>(null);

  async function runFull() {
    setBusy(true);
    setError("");
    setProgress(5);
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    try {
      setPhase("Public IP…");
      const ipRes = await fetch("/api/network/ip", { cache: "no-store" });
      const ipJson = await ipRes.json();
      if (ipRes.ok) setIp(ipJson.ip || null);
      setProgress(15);

      setPhase("Latency…");
      const times: number[] = [];
      for (let i = 0; i < 4; i++) {
        const t0 = performance.now();
        const r = await fetch(`/api/network/download?bytes=0&_=${Date.now()}-${i}`, {
          cache: "no-store",
        });
        await r.arrayBuffer();
        times.push(performance.now() - t0);
      }
      times.sort((a, b) => a - b);
      setLatency(Math.round((times[Math.floor(times.length / 2)] ?? 0) * 10) / 10);
      setProgress(30);

      setPhase("Edge ping (cloudflare.com)…");
      const pingRes = await fetch("/api/network/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "cloudflare.com", count: 4 }),
      });
      const pingJson = await pingRes.json();
      if (pingRes.ok && pingJson.stats) {
        setPingAvg(pingJson.stats.avg);
        setPingLoss(pingJson.stats.lossPct);
      }
      setProgress(45);

      setPhase("Download…");
      const dl = async (bytes: number) => {
        const t0 = performance.now();
        const r = await fetch(`/api/network/download?bytes=${bytes}&_=${Date.now()}`, {
          cache: "no-store",
        });
        const buf = await r.arrayBuffer();
        return formatMbps(buf.byteLength, (performance.now() - t0) / 1000);
      };
      await dl(50_000);
      const d1 = await dl(750_000);
      setProgress(65);
      const d2 = await dl(1_500_000);
      setDown(Math.max(d1, d2));
      setProgress(75);

      setPhase("Upload…");
      const ul = async (bytes: number) => {
        const body = new Uint8Array(bytes);
        let seed = 0xabcdef01;
        for (let i = 0; i < bytes; i++) {
          seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
          body[i] = seed & 0xff;
        }
        const t0 = performance.now();
        const r = await fetch("/api/network/upload", {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body,
          cache: "no-store",
        });
        if (!r.ok) throw new Error("Upload failed");
        await r.json();
        return formatMbps(bytes, (performance.now() - t0) / 1000);
      };
      const u1 = await ul(400_000);
      setProgress(90);
      const u2 = await ul(900_000);
      setUp(Math.max(u1, u2));
      setProgress(100);
      setPhase("Done");
      await usage("internet-diagnostics");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Diagnostics failed");
      setPhase("");
    }
    setBusy(false);
  }

  const tabs: { id: DiagTab; label: string; icon: typeof Gauge }[] = [
    { id: "overview", label: "Full check", icon: Activity },
    { id: "speed", label: "Speed", icon: Gauge },
    { id: "ping", label: "Ping", icon: Radar },
    { id: "dns", label: "DNS", icon: Network },
    { id: "ip", label: "My IP", icon: Globe2 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Internet diagnostics</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Speed test, latency, public IP, DNS, and host ping — one desk. Numbers are against this
          Plethora edge (not a lab meter).
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                tab === t.id
                  ? "bg-cyan-600 text-white"
                  : "border border-white/15 text-zinc-400 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <div className="space-y-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => void runFull()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
            {busy ? phase || "Running…" : "Run full diagnostics"}
          </button>

          {(busy || progress > 0) && (
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Browser online" value={online ? "Yes" : "No"} />
            <StatCard label="Public IP" value={ip || "—"} />
            <StatCard
              label="Latency"
              value={latency != null ? String(latency) : "—"}
              unit={latency != null ? "ms" : undefined}
            />
            <StatCard
              label="Download"
              value={down != null ? String(down) : "—"}
              unit={down != null ? "Mbps" : undefined}
            />
            <StatCard
              label="Upload"
              value={up != null ? String(up) : "—"}
              unit={up != null ? "Mbps" : undefined}
            />
            <StatCard
              label="Edge ping avg"
              value={pingAvg != null ? String(pingAvg) : "—"}
              unit={pingAvg != null ? "ms" : undefined}
            />
          </div>
          {pingLoss != null ? (
            <p className="text-xs text-zinc-500">HTTP probe loss to Cloudflare: {pingLoss}%</p>
          ) : null}
        </div>
      ) : null}

      {tab === "speed" ? <SpeedTestLab /> : null}
      {tab === "ping" ? <PingTestLab /> : null}
      {tab === "dns" ? <DnsLookupLab /> : null}
      {tab === "ip" ? <MyIpLab /> : null}
    </div>
  );
}

/* icons re-export for grid mapping helpers */
export const NetworkToolMeta = {
  Activity,
  Gauge,
  Globe2,
  Network,
};
