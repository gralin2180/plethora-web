"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Copy, Check } from "lucide-react";
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
    /* ignore */
  }
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

export function PositionSizeLab() {
  const [account, setAccount] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(100);
  const [stop, setStop] = useState(95);

  const result = useMemo(() => {
    const riskCash = account * (riskPct / 100);
    const perUnit = Math.abs(entry - stop);
    if (perUnit <= 0) return null;
    const units = riskCash / perUnit;
    return {
      riskCash,
      perUnit,
      units: Math.floor(units * 1000) / 1000,
      notional: Math.floor(units * entry * 100) / 100,
    };
  }, [account, riskPct, entry, stop]);

  return (
    <Shell
      title="Position size"
      blurb="Educational calculator only — not financial advice. Size so a stop hits your planned risk."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["Account equity", account, setAccount],
            ["Risk %", riskPct, setRiskPct],
            ["Entry price", entry, setEntry],
            ["Stop price", stop, setStop],
          ] as const
        ).map(([label, val, set]) => (
          <label key={label} className="text-sm text-zinc-400">
            {label}
            <input
              type="number"
              value={val}
              onChange={(e) => set(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
          </label>
        ))}
      </div>
      {result && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm text-zinc-200">
          <p>
            Risk amount: <strong className="text-white">${result.riskCash.toFixed(2)}</strong>
          </p>
          <p className="mt-1">
            Position size: <strong className="text-white">{result.units}</strong> units
          </p>
          <p className="mt-1 text-zinc-500">
            Approx notional ${result.notional.toFixed(2)} · risk/unit ${result.perUnit.toFixed(4)}
          </p>
          <button
            type="button"
            className="mt-3 text-xs text-violet-300"
            onClick={() => void usage("position-size")}
          >
            Log free-run usage
          </button>
        </div>
      )}
    </Shell>
  );
}

export function RiskRewardLab() {
  const [entry, setEntry] = useState(50);
  const [stop, setStop] = useState(48);
  const [target, setTarget] = useState(56);

  const rr = useMemo(() => {
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    if (risk <= 0) return null;
    return Math.round((reward / risk) * 100) / 100;
  }, [entry, stop, target]);

  return (
    <Shell title="Risk / reward" blurb="How many R is your target vs stop? Educational only.">
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["Entry", entry, setEntry],
            ["Stop", stop, setStop],
            ["Target", target, setTarget],
          ] as const
        ).map(([label, val, set]) => (
          <label key={label} className="text-sm text-zinc-400">
            {label}
            <input
              type="number"
              value={val}
              onChange={(e) => set(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
          </label>
        ))}
      </div>
      <p className="text-2xl font-semibold text-white">
        {rr != null ? `${rr} R` : "—"}
        <span className="ml-2 text-sm font-normal text-zinc-500">reward / risk</span>
      </p>
      <button type="button" className="text-xs text-violet-300" onClick={() => void usage("risk-reward")}>
        Log free-run usage
      </button>
    </Shell>
  );
}

export function WordCounterLab() {
  const [text, setText] = useState("");
  const stats = useMemo(() => {
    const t = text.trim();
    const words = t ? t.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const sentences = t ? t.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
    return { words, chars, charsNoSpace, sentences };
  }, [text]);

  return (
    <Shell title="Word & character counter" blurb="Runs only in your browser.">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        placeholder="Paste text…"
        onBlur={() => text && void usage("word-counter")}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Words", stats.words],
          ["Characters", stats.chars],
          ["No spaces", stats.charsNoSpace],
          ["Sentences", stats.sentences],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-white/10 p-3">
            <p className="text-[11px] text-zinc-500">{l}</p>
            <p className="text-xl font-semibold tabular-nums text-white">{v}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function CaseConverterLab() {
  const [text, setText] = useState("");
  const variants = useMemo(() => {
    const t = text;
    return {
      upper: t.toUpperCase(),
      lower: t.toLowerCase(),
      title: t.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()),
      snake: t.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w_]/g, ""),
      kebab: t.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
    };
  }, [text]);

  return (
    <Shell title="Case converter" blurb="Transform casing instantly.">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      />
      {Object.entries(variants).map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-2 rounded-lg border border-white/10 px-3 py-2">
          <div>
            <p className="text-[10px] uppercase text-zinc-500">{k}</p>
            <p className="break-all text-sm text-zinc-200">{v || "—"}</p>
          </div>
          <CopyMini text={v} onCopy={() => void usage("case-converter")} />
        </div>
      ))}
    </Shell>
  );
}

export function JsonFormatterLab() {
  const [raw, setRaw] = useState('{"hello":"world"}');
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  function pretty() {
    try {
      setOut(JSON.stringify(JSON.parse(raw), null, 2));
      setErr("");
      void usage("json-formatter");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid JSON");
    }
  }
  function minify() {
    try {
      setOut(JSON.stringify(JSON.parse(raw)));
      setErr("");
      void usage("json-formatter");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  return (
    <Shell title="JSON formatter" blurb="Validate, pretty-print, or minify.">
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={6}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white"
      />
      <div className="flex gap-2">
        <button type="button" onClick={pretty} className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white">
          Pretty
        </button>
        <button type="button" onClick={minify} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300">
          Minify
        </button>
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      {out && (
        <pre className="overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-300">{out}</pre>
      )}
    </Shell>
  );
}

export function UuidLab() {
  const [list, setList] = useState<string[]>([]);
  function gen(n = 5) {
    const next = Array.from({ length: n }, () => crypto.randomUUID());
    setList(next);
    void usage("uuid-generator");
  }
  return (
    <Shell title="UUID generator" blurb="Secure v4 UUIDs via Web Crypto.">
      <button type="button" onClick={() => gen(5)} className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white">
        Generate 5
      </button>
      <ul className="space-y-1 font-mono text-sm text-zinc-300">
        {list.map((u) => (
          <li key={u} className="flex justify-between gap-2 rounded-lg border border-white/10 px-3 py-1.5">
            {u}
            <CopyMini text={u} />
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function PercentageLab() {
  const [a, setA] = useState(25);
  const [b, setB] = useState(200);
  const of = useMemo(() => (b * a) / 100, [a, b]);
  const change = useMemo(() => (b === 0 ? 0 : ((a - b) / Math.abs(b)) * 100), [a, b]);

  return (
    <Shell title="Percentage calculator" blurb="X% of Y and percent change from B → A.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-zinc-400">
          X (%)
          <input type="number" value={a} onChange={(e) => setA(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-zinc-400">
          Y (base)
          <input type="number" value={b} onChange={(e) => setB(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white" />
        </label>
      </div>
      <p className="text-sm text-zinc-300">
        {a}% of {b} = <strong className="text-white">{of.toFixed(4)}</strong>
      </p>
      <p className="text-sm text-zinc-300">
        Change from {b} to {a}: <strong className="text-white">{change.toFixed(2)}%</strong>
      </p>
      <button type="button" className="text-xs text-violet-300" onClick={() => void usage("percentage-calc")}>
        Log free-run usage
      </button>
    </Shell>
  );
}

function CopyMini({ text, onCopy }: { text: string; onCopy?: () => void }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        onCopy?.();
        setTimeout(() => setOk(false), 1000);
      }}
      className="text-zinc-500 hover:text-white"
    >
      {ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
