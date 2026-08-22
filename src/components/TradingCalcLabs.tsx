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

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="text-xs text-amber-200/80">
        Education only — not financial, investment, or tax advice. Markets can wipe you. You size
        and trade at your own risk.
      </p>
      {children}
    </div>
  );
}

function Num({
  label,
  value,
  set,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
}) {
  return (
    <label className="text-sm text-zinc-400">
      {label}
      <input
        type="number"
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
      />
    </label>
  );
}

export function TradePnlLab() {
  const [side, setSide] = useState<"long" | "short">("long");
  const [entry, setEntry] = useState(100);
  const [exit, setExit] = useState(108);
  const [qty, setQty] = useState(10);
  const [feePct, setFeePct] = useState(0.1);
  const r = useMemo(() => {
    const gross = side === "long" ? (exit - entry) * qty : (entry - exit) * qty;
    const notional = (Math.abs(entry) + Math.abs(exit)) * qty;
    const fees = notional * (feePct / 100);
    const net = gross - fees;
    const ret = entry * qty ? (net / (entry * qty)) * 100 : 0;
    return { gross, fees, net, ret };
  }, [side, entry, exit, qty, feePct]);
  return (
    <Shell title="Trade P&L">
      <div className="flex gap-2">
        {(["long", "short"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${
              side === s ? "bg-emerald-600 text-white" : "border border-white/10 text-zinc-400"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Num label="Entry" value={entry} set={setEntry} />
        <Num label="Exit" value={exit} set={setExit} />
        <Num label="Quantity" value={qty} set={setQty} />
        <Num label="Round-trip fees %" value={feePct} set={setFeePct} />
      </div>
      <div className="rounded-xl border border-white/10 p-4 text-sm">
        <p>
          Gross <strong className="text-white">${r.gross.toFixed(2)}</strong>
        </p>
        <p>
          Fees <span className="text-zinc-400">${r.fees.toFixed(2)}</span>
        </p>
        <p>
          Net <strong className="text-white">${r.net.toFixed(2)}</strong> ({r.ret.toFixed(2)}% on
          notional)
        </p>
        <button type="button" className="mt-2 text-xs text-violet-300" onClick={() => void usage("trade-pnl")}>
          Log run
        </button>
      </div>
    </Shell>
  );
}

export function LeverageLiqLab() {
  const [entry, setEntry] = useState(50000);
  const [lev, setLev] = useState(10);
  const [side, setSide] = useState<"long" | "short">("long");
  const [mm, setMm] = useState(0.5);
  const liq = useMemo(() => {
    const m = mm / 100;
    if (lev <= 1) return entry;
    if (side === "long") return entry * (1 - 1 / lev + m);
    return entry * (1 + 1 / lev - m);
  }, [entry, lev, side, mm]);
  return (
    <Shell title="Leverage / liquidation (approx.)">
      <p className="text-xs text-zinc-500">
        Isolated-style estimate. Exchanges add funding, fees, and different MM. Check your venue.
      </p>
      <div className="flex gap-2">
        {(["long", "short"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${
              side === s ? "bg-cyan-600 text-white" : "border border-white/10 text-zinc-400"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Num label="Entry" value={entry} set={setEntry} />
        <Num label="Leverage (x)" value={lev} set={setLev} />
        <Num label="Maint. margin %" value={mm} set={setMm} />
      </div>
      <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-white">
        Approx. liq ≈ <strong>{liq.toFixed(2)}</strong>
      </p>
      <button type="button" className="text-xs text-violet-300" onClick={() => void usage("leverage-liq")}>
        Log run
      </button>
    </Shell>
  );
}

export function DcaLab() {
  const [each, setEach] = useState(100);
  const [n, setN] = useState(12);
  const [ret, setRet] = useState(8);
  const out = useMemo(() => {
    const r = ret / 100 / 12;
    let v = 0;
    for (let i = 0; i < n; i++) v = (v + each) * (1 + r);
    return { invested: each * n, value: v };
  }, [each, n, ret]);
  return (
    <Shell title="DCA / compound sketch">
      <div className="grid gap-3 sm:grid-cols-3">
        <Num label="Amount each period" value={each} set={setEach} />
        <Num label="Periods" value={n} set={setN} />
        <Num label="Assumed annual % " value={ret} set={setRet} />
      </div>
      <p className="text-sm text-zinc-300">
        Invested ${out.invested.toFixed(0)} → toy future value{" "}
        <strong className="text-white">${out.value.toFixed(2)}</strong> if the assumed return is
        real (it often isn’t).
      </p>
      <button type="button" className="text-xs text-violet-300" onClick={() => void usage("dca-calculator")}>
        Log run
      </button>
    </Shell>
  );
}

export function PipLab() {
  const [lots, setLots] = useState(1);
  const [pip, setPip] = useState(0.0001);
  const [quote, setQuote] = useState(1);
  const [size, setSize] = useState(100000);
  const val = useMemo(() => lots * size * pip * quote, [lots, pip, quote, size]);
  return (
    <Shell title="Pip / lot value">
      <div className="grid gap-3 sm:grid-cols-2">
        <Num label="Lots" value={lots} set={setLots} />
        <Num label="Contract size" value={size} set={setSize} />
        <Num label="Pip size" value={pip} set={setPip} />
        <Num label="Quote conversion (1 if USD quote)" value={quote} set={setQuote} />
      </div>
      <p className="text-sm text-white">
        ≈ ${val.toFixed(2)} per pip
      </p>
      <button type="button" className="text-xs text-violet-300" onClick={() => void usage("pip-calculator")}>
        Log run
      </button>
    </Shell>
  );
}

export function KellyLab() {
  const [win, setWin] = useState(55);
  const [rr, setRr] = useState(1.5);
  const k = useMemo(() => {
    const p = win / 100;
    const b = rr;
    const f = p - (1 - p) / b;
    return Math.max(0, f);
  }, [win, rr]);
  return (
    <Shell title="Kelly fraction (toy)">
      <p className="text-xs text-zinc-500">
        Full Kelly is aggressive. Many people use half or quarter. Past win-rate is not future
        win-rate.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Num label="Win % (estimate)" value={win} set={setWin} />
        <Num label="Avg win / avg loss" value={rr} set={setRr} />
      </div>
      <p className="text-sm text-white">
        Full Kelly ≈ <strong>{(k * 100).toFixed(1)}%</strong> of bankroll · half Kelly{" "}
        {((k / 2) * 100).toFixed(1)}%
      </p>
      <button type="button" className="text-xs text-violet-300" onClick={() => void usage("kelly-sizer")}>
        Log run
      </button>
    </Shell>
  );
}
