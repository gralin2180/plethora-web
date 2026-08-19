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
    const paragraphs = t ? t.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
    const readingMin = words / 200;
    const speakingMin = words / 130;
    const freq: Record<string, number> = {};
    for (const w of t.toLowerCase().match(/[a-z0-9']+/g) || []) {
      if (w.length < 4) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
    const keywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return { words, chars, charsNoSpace, sentences, paragraphs, readingMin, speakingMin, keywords };
  }, [text]);

  return (
    <Shell title="Word & character counter" blurb="Same stats as WordCounter.net — reading time, speaking time, keyword density. Nothing leaves this tab.">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        placeholder="Paste a draft, essay, or caption…"
        onBlur={() => text && void usage("word-counter")}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Words", stats.words],
          ["Characters", stats.chars],
          ["No spaces", stats.charsNoSpace],
          ["Sentences", stats.sentences],
          ["Paragraphs", stats.paragraphs],
          ["Read", `${stats.readingMin < 1 ? `${Math.round(stats.readingMin * 60)}s` : `${stats.readingMin.toFixed(1)}m`}`],
          ["Speak", `${stats.speakingMin < 1 ? `${Math.round(stats.speakingMin * 60)}s` : `${stats.speakingMin.toFixed(1)}m`}`],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-white/10 p-3">
            <p className="text-[11px] text-zinc-500">{l}</p>
            <p className="text-xl font-semibold tabular-nums text-white">{v}</p>
          </div>
        ))}
      </div>
      {stats.keywords.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500">Top words</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {stats.keywords.map(([w, n]) => (
              <span key={w} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                {w} · {n}
              </span>
            ))}
          </div>
        </div>
      )}
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
      sentence: t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(),
      camel: t
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+([a-z0-9])/g, (_, c: string) => c.toUpperCase())
        .replace(/^[A-Z]/, (c) => c.toLowerCase()),
      snake: t.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w_]/g, ""),
      kebab: t.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
      constant: t.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^\w_]/g, ""),
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
  const parsed = useMemo(() => {
    try {
      return { ok: true as const, value: JSON.parse(raw), err: "" };
    } catch (e) {
      return { ok: false as const, value: null, err: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [raw]);
  const pretty = parsed.ok ? JSON.stringify(parsed.value, null, 2) : "";
  const mini = parsed.ok ? JSON.stringify(parsed.value) : "";

  return (
    <Shell title="JSON formatter" blurb="Live validate like jsonformatter.org — pretty, minify, copy. Your data stays here.">
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={8}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white"
      />
      <p className={`text-xs ${parsed.ok ? "text-emerald-400" : "text-red-400"}`}>
        {parsed.ok ? `Valid · ${mini.length} minified chars` : parsed.err}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!parsed.ok}
          onClick={() => {
            setRaw(pretty);
            void usage("json-formatter");
          }}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
        >
          Pretty
        </button>
        <button
          type="button"
          disabled={!parsed.ok}
          onClick={() => {
            setRaw(mini);
            void usage("json-formatter");
          }}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 disabled:opacity-40"
        >
          Minify
        </button>
        <CopyMini text={parsed.ok ? pretty : raw} onCopy={() => void usage("json-formatter")} />
      </div>
      {parsed.ok && (
        <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-300">
          {pretty}
        </pre>
      )}
    </Shell>
  );
}

export function UuidLab() {
  const [n, setN] = useState(5);
  const [list, setList] = useState<string[]>([]);
  function gen(count = n) {
    const next = Array.from({ length: Math.min(100, Math.max(1, count)) }, () => crypto.randomUUID());
    setList(next);
    void usage("uuid-generator");
  }
  return (
    <Shell title="UUID generator" blurb="Cryptographically random v4 UUIDs — same job as uuidgenerator.net, no ads, no upload.">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={1}
          max={100}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-20 rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
        />
        <button type="button" onClick={() => gen()} className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white">
          Generate
        </button>
        <CopyMini text={list.join("\n")} onCopy={() => void usage("uuid-generator")} />
      </div>
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
  const reverse = useMemo(() => (a === 0 ? 0 : (b / a) * 100), [a, b]);

  return (
    <Shell title="Percentage calculator" blurb="X% of Y, percent change, and “B is what % of A” — calculator.net coverage, no clutter.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-zinc-400">
          X
          <input type="number" value={a} onChange={(e) => setA(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-zinc-400">
          Y
          <input type="number" value={b} onChange={(e) => setB(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white" />
        </label>
      </div>
      <div className="space-y-1 rounded-xl border border-white/10 p-4 text-sm text-zinc-300">
        <p>
          {a}% of {b} = <strong className="text-white">{of.toFixed(4)}</strong>
        </p>
        <p>
          Change from {b} → {a}: <strong className="text-white">{change.toFixed(2)}%</strong>
        </p>
        <p>
          {b} is <strong className="text-white">{reverse.toFixed(2)}%</strong> of {a}
        </p>
      </div>
    </Shell>
  );
}

export function PasswordLab() {
  const [len, setLen] = useState(20);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [nums, setNums] = useState(true);
  const [syms, setSyms] = useState(true);
  const [pwd, setPwd] = useState("");

  function gen() {
    const sets = [
      lower ? "abcdefghijkmnopqrstuvwxyz" : "",
      upper ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "",
      nums ? "23456789" : "",
      syms ? "!@#$%^&*_-+=?" : "",
    ].filter(Boolean);
    const all = sets.join("");
    if (!all) return;
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    const chars = Array.from(bytes, (b, i) => {
      const pool = sets[i % sets.length] || all;
      return pool[b % pool.length];
    });
    for (let i = chars.length - 1; i > 0; i--) {
      const j = bytes[i] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setPwd(chars.join(""));
    void usage("password-generator");
  }

  const entropy = useMemo(() => {
    let n = 0;
    if (lower) n += 23;
    if (upper) n += 24;
    if (nums) n += 8;
    if (syms) n += 14;
    return Math.round(len * Math.log2(Math.max(n, 2)));
  }, [len, lower, upper, nums, syms]);

  return (
    <Shell title="Password generator" blurb="Like Bitwarden’s generator: on-device CSPRNG, no history stored.">
      <label className="block text-xs text-zinc-500">
        Length {len}
        <input type="range" min={8} max={64} value={len} onChange={(e) => setLen(Number(e.target.value))} className="mt-1 w-full" />
      </label>
      <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
        {[
          ["a-z", lower, setLower],
          ["A-Z", upper, setUpper],
          ["2-9", nums, setNums],
          ["symbols", syms, setSyms],
        ].map(([label, on, set]) => (
          <label key={label as string} className="flex items-center gap-1.5">
            <input type="checkbox" checked={on as boolean} onChange={(e) => (set as (v: boolean) => void)(e.target.checked)} />
            {label as string}
          </label>
        ))}
      </div>
      <button type="button" onClick={gen} className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white">
        Generate
      </button>
      {pwd && (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white">
          <span className="min-w-0 flex-1 break-all">{pwd}</span>
          <CopyMini text={pwd} />
        </div>
      )}
      <p className="text-[11px] text-zinc-500">~{entropy} bits of entropy</p>
    </Shell>
  );
}

export function RegexLab() {
  const [pattern, setPattern] = useState("[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}");
  const [flags, setFlags] = useState("gi");
  const [sample, setSample] = useState("Write ada@x.com and also bad@@mail");
  const result = useMemo(() => {
    try {
      const re = new RegExp(pattern, flags);
      const matches = [...sample.matchAll(re)].map((m) => ({ text: m[0], index: m.index ?? 0 }));
      return { ok: true as const, matches, err: "" };
    } catch (e) {
      return { ok: false as const, matches: [] as { text: string; index: number }[], err: e instanceof Error ? e.message : "bad regex" };
    }
  }, [pattern, flags, sample]);

  return (
    <Shell title="Regex tester" blurb="regex101-lite: pattern, flags, live matches on a sample. Explain via Chat if you want.">
      <label className="text-xs text-zinc-500">
        Pattern
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white"
        />
      </label>
      <label className="text-xs text-zinc-500">
        Flags
        <input
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          className="mt-1 w-24 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white"
        />
      </label>
      <textarea
        value={sample}
        onChange={(e) => setSample(e.target.value)}
        rows={5}
        className="w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-white"
      />
      <p className={`text-xs ${result.ok ? "text-emerald-400" : "text-red-400"}`}>
        {result.ok ? `${result.matches.length} match(es)` : result.err}
      </p>
      {result.matches.length > 0 && (
        <ul className="space-y-1 text-xs text-zinc-300">
          {result.matches.slice(0, 40).map((m, i) => (
            <li key={`${m.index}-${i}`} className="rounded-lg bg-white/5 px-2 py-1 font-mono">
              {m.text} <span className="text-zinc-500">@ {m.index}</span>
            </li>
          ))}
        </ul>
      )}
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
