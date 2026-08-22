"use client";

import { useMemo, useState, type ReactNode } from "react";
import { trackToolUse } from "@/lib/self-learn";

async function usage(id: string) {
  try {
    trackToolUse(id, 1);
    await fetch("/api/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId: id }),
    });
  } catch {
    /* */
  }
}

function Shell({ title, blurb, children }: { title: string; blurb: string; children: ReactNode }) {
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

export function TimestampLab() {
  const [ms, setMs] = useState(() => Date.now());
  const d = new Date(ms);
  return (
    <Shell title="Unix timestamp" blurb="Seconds and milliseconds. Runs in your browser.">
      <input
        type="number"
        value={ms}
        onChange={(e) => setMs(Number(e.target.value))}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
      />
      <p className="text-sm text-zinc-300">{d.toISOString()}</p>
      <p className="text-xs text-zinc-500">Seconds: {Math.floor(ms / 1000)}</p>
      <button
        type="button"
        className="text-xs text-violet-300"
        onClick={() => {
          setMs(Date.now());
          void usage("timestamp-converter");
        }}
      >
        Now
      </button>
    </Shell>
  );
}

export function Base64Lab() {
  const [raw, setRaw] = useState("");
  const [b64, setB64] = useState("");
  const [err, setErr] = useState("");
  return (
    <Shell title="Base64 encode / decode" blurb="Local. Don’t paste secrets you care about into a shared PC.">
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        placeholder="Plain text"
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-xl bg-violet-600 px-3 py-2 text-sm text-white"
          onClick={() => {
            setErr("");
            setB64(btoa(unescape(encodeURIComponent(raw))));
            void usage("base64-coder");
          }}
        >
          Encode
        </button>
        <button
          type="button"
          className="rounded-xl border border-white/10 px-3 py-2 text-sm"
          onClick={() => {
            try {
              setErr("");
              setRaw(decodeURIComponent(escape(atob(b64 || raw))));
            } catch {
              setErr("Could not decode");
            }
          }}
        >
          Decode
        </button>
      </div>
      {err && <p className="text-sm text-rose-400">{err}</p>}
      <textarea
        value={b64}
        onChange={(e) => setB64(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-zinc-300"
        placeholder="Base64"
      />
    </Shell>
  );
}

export function HashLab() {
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  async function run() {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    setOut([...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""));
    void usage("hash-generator");
  }
  return (
    <Shell title="SHA-256 hash" blurb="Web Crypto in this browser. Not for password storage by itself.">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      />
      <button type="button" onClick={() => void run()} className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white">
        Hash
      </button>
      {out && <p className="break-all font-mono text-xs text-cyan-200">{out}</p>}
    </Shell>
  );
}

export function UrlEncodeLab() {
  const [v, setV] = useState("");
  return (
    <Shell title="URL encode / decode" blurb="encodeURIComponent in the browser.">
      <textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-xl bg-violet-600 px-3 py-2 text-sm text-white"
          onClick={() => {
            setV(encodeURIComponent(v));
            void usage("url-encoder");
          }}
        >
          Encode
        </button>
        <button
          type="button"
          className="rounded-xl border border-white/10 px-3 py-2 text-sm"
          onClick={() => setV(decodeURIComponent(v))}
        >
          Decode
        </button>
      </div>
    </Shell>
  );
}

function lum(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return 0;
  const n = parseInt(h, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function ContrastLab() {
  const [fg, setFg] = useState("#f4f4f5");
  const [bg, setBg] = useState("#09090b");
  const ratio = useMemo(() => {
    const L1 = lum(fg);
    const L2 = lum(bg);
    const hi = Math.max(L1, L2);
    const lo = Math.min(L1, L2);
    return (hi + 0.05) / (lo + 0.05);
  }, [fg, bg]);
  return (
    <Shell title="Color contrast" blurb="WCAG-ish contrast ratio. AA body text wants 4.5:1.">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-zinc-400">
          Text
          <input
            value={fg}
            onChange={(e) => setFg(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-white"
          />
        </label>
        <label className="text-sm text-zinc-400">
          Background
          <input
            value={bg}
            onChange={(e) => setBg(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-white"
          />
        </label>
      </div>
      <div className="rounded-xl p-6 text-center" style={{ background: bg, color: fg }}>
        Sample text — {ratio.toFixed(2)}:1 {ratio >= 4.5 ? "· AA" : "· fail AA body"}
      </div>
      <button type="button" className="text-xs text-violet-300" onClick={() => void usage("color-contrast")}>
        Log run
      </button>
    </Shell>
  );
}

const UNITS: Record<string, number> = {
  m: 1,
  km: 1000,
  mi: 1609.34,
  ft: 0.3048,
  kg: 1,
  lb: 0.453592,
  c: 1,
};

export function UnitLab() {
  const [n, setN] = useState(1);
  const [from, setFrom] = useState("km");
  const [to, setTo] = useState("mi");
  const out = useMemo(() => {
    if (from === "c" && to === "f") return n * 1.8 + 32;
    if (from === "f" && to === "c") return (n - 32) / 1.8;
    const len = ["m", "km", "mi", "ft"];
    const mass = ["kg", "lb"];
    if (len.includes(from) && len.includes(to)) return (n * UNITS[from]) / UNITS[to];
    if (mass.includes(from) && mass.includes(to)) return (n * UNITS[from]) / UNITS[to];
    return n;
  }, [n, from, to]);
  const opts = ["km", "mi", "m", "ft", "kg", "lb", "c", "f"];
  return (
    <Shell title="Unit converter" blurb="Length, mass, and a simple °C/°F path. Browser math.">
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
        />
        <select value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-2 text-white">
          {opts.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-white/10 bg-black/40 px-2 text-white">
          {opts.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      <p className="text-xl font-semibold text-white">{out.toFixed(4)}</p>
      <button type="button" className="text-xs text-violet-300" onClick={() => void usage("unit-converter")}>
        Log run
      </button>
    </Shell>
  );
}

export function ImageCompressLab() {
  const [q, setQ] = useState(0.7);
  const [url, setUrl] = useState("");
  async function onFile(f: File | undefined) {
    if (!f) return;
    const img = await createImageBitmap(f);
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    c.getContext("2d")?.drawImage(img, 0, 0);
    setUrl(c.toDataURL("image/jpeg", q));
    void usage("image-compress");
  }
  return (
    <Shell title="Image compress (JPEG)" blurb="Resize stays original pixels; quality slider. Stays on this device.">
      <input type="file" accept="image/*" onChange={(e) => void onFile(e.target.files?.[0])} />
      <label className="block text-sm text-zinc-400">
        Quality {q}
        <input
          type="range"
          min={0.2}
          max={0.95}
          step={0.05}
          value={q}
          onChange={(e) => setQ(Number(e.target.value))}
          className="w-full"
        />
      </label>
      {url && (
        <a href={url} download="compressed.jpg" className="text-sm text-violet-300">
          Download JPEG
        </a>
      )}
    </Shell>
  );
}

export function LoremLab() {
  const [n, setN] = useState(3);
  const para =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
  const text = Array.from({ length: Math.min(12, Math.max(1, n)) }, () => para).join("\n\n");
  return (
    <Shell title="Lorem ipsum" blurb="Placeholder copy. Reddit still asks for this weekly.">
      <input
        type="number"
        value={n}
        onChange={(e) => setN(Number(e.target.value))}
        className="w-24 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
      />
      <textarea readOnly value={text} rows={8} className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-zinc-300" />
      <button type="button" className="text-xs text-violet-300" onClick={() => void usage("lorem-ipsum")}>
        Log run
      </button>
    </Shell>
  );
}

export function TextDiffLab() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const lines = useMemo(() => {
    const la = a.split("\n");
    const lb = b.split("\n");
    const max = Math.max(la.length, lb.length);
    const rows: { t: string; k: string }[] = [];
    for (let i = 0; i < max; i++) {
      if (la[i] === lb[i]) rows.push({ t: la[i] ?? "", k: "same" });
      else {
        if (la[i] != null) rows.push({ t: "- " + la[i], k: "del" });
        if (lb[i] != null) rows.push({ t: "+ " + lb[i], k: "add" });
      }
    }
    return rows;
  }, [a, b]);
  return (
    <Shell title="Line diff" blurb="Naive line-by-line. For real git diffs use git. Good enough for copy tweaks.">
      <div className="grid gap-3 sm:grid-cols-2">
        <textarea value={a} onChange={(e) => setA(e.target.value)} rows={8} className="rounded-xl border border-white/10 bg-black/40 p-2 text-sm text-white" />
        <textarea value={b} onChange={(e) => setB(e.target.value)} rows={8} className="rounded-xl border border-white/10 bg-black/40 p-2 text-sm text-white" />
      </div>
      <pre className="max-h-56 overflow-auto rounded-xl bg-black/50 p-3 text-xs">
        {lines.map((l, i) => (
          <div
            key={i}
            className={l.k === "add" ? "text-emerald-400" : l.k === "del" ? "text-rose-400" : "text-zinc-400"}
          >
            {l.t}
          </div>
        ))}
      </pre>
      <button type="button" className="text-xs text-violet-300" onClick={() => void usage("text-diff")}>
        Log run
      </button>
    </Shell>
  );
}
