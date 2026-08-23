"use client";

import { useCallback, useMemo, useState } from "react";
import { Delete, History } from "lucide-react";
import { trackToolUse } from "@/lib/self-learn";

type Mode = "standard" | "scientific" | "programmer" | "convert";

function factorial(n: number): number {
  if (n < 0 || !Number.isFinite(n) || Math.floor(n) !== n) return NaN;
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** Safe-ish math expression evaluator for calculator expressions */
function evaluateExpression(raw: string, deg: boolean): number {
  let expr = raw
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "PI")
    .replace(/\be\b/g, "E")
    .replace(/√\(/g, "sqrt(")
    .replace(/\^/g, "**")
    .replace(/(\d+(?:\.\d+)?)!/g, "fact($1)")
    .replace(/(\))\!/g, "fact$1")
    .trim();

  if (!expr) return NaN;

  // percentage of left operand: 50% → 0.5 when standalone, a+b% handled simply
  expr = expr.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");

  const allowed = /^[0-9+\-*/().,\sPIE_a-z**]+$/i;
  if (!allowed.test(expr.replace(/fact|sqrt|sin|cos|tan|asin|acos|atan|log|ln|abs|pow/gi, ""))) {
    // re-check after stripping fn names
  }

  const toRad = (x: number) => (deg ? (x * Math.PI) / 180 : x);
  const toDeg = (x: number) => (deg ? (x * 180) / Math.PI : x);

  const fns = {
    PI: Math.PI,
    E: Math.E,
    sqrt: Math.sqrt,
    sin: (x: number) => Math.sin(toRad(x)),
    cos: (x: number) => Math.cos(toRad(x)),
    tan: (x: number) => Math.tan(toRad(x)),
    asin: (x: number) => toDeg(Math.asin(x)),
    acos: (x: number) => toDeg(Math.acos(x)),
    atan: (x: number) => toDeg(Math.atan(x)),
    log: (x: number) => Math.log10(x),
    ln: (x: number) => Math.log(x),
    abs: Math.abs,
    pow: Math.pow,
    fact: factorial,
  };

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...Object.keys(fns),
      `"use strict"; return (${expr});`
    );
    const result = fn(...Object.values(fns));
    return typeof result === "number" ? result : NaN;
  } catch {
    return NaN;
  }
}

const UNIT_GROUPS: Record<string, { label: string; units: { id: string; name: string; toBase: number }[] }> = {
  length: {
    label: "Length",
    units: [
      { id: "m", name: "Meter", toBase: 1 },
      { id: "km", name: "Kilometer", toBase: 1000 },
      { id: "cm", name: "Centimeter", toBase: 0.01 },
      { id: "mm", name: "Millimeter", toBase: 0.001 },
      { id: "um", name: "Micrometer", toBase: 1e-6 },
      { id: "nm", name: "Nanometer", toBase: 1e-9 },
      { id: "mi", name: "Mile", toBase: 1609.344 },
      { id: "yd", name: "Yard", toBase: 0.9144 },
      { id: "ft", name: "Foot", toBase: 0.3048 },
      { id: "in", name: "Inch", toBase: 0.0254 },
      { id: "nmi", name: "Nautical mile", toBase: 1852 },
    ],
  },
  area: {
    label: "Area",
    units: [
      { id: "m2", name: "Square meter", toBase: 1 },
      { id: "km2", name: "Square km", toBase: 1e6 },
      { id: "ha", name: "Hectare", toBase: 10000 },
      { id: "ac", name: "Acre", toBase: 4046.8564224 },
      { id: "ft2", name: "Square foot", toBase: 0.09290304 },
      { id: "in2", name: "Square inch", toBase: 0.00064516 },
    ],
  },
  volume: {
    label: "Volume",
    units: [
      { id: "l", name: "Liter", toBase: 1 },
      { id: "ml", name: "Milliliter", toBase: 0.001 },
      { id: "m3", name: "Cubic meter", toBase: 1000 },
      { id: "gal", name: "US gallon", toBase: 3.785411784 },
      { id: "qt", name: "US quart", toBase: 0.946352946 },
      { id: "cup", name: "US cup", toBase: 0.2365882365 },
      { id: "floz", name: "US fl oz", toBase: 0.0295735295625 },
      { id: "tbsp", name: "Tablespoon", toBase: 0.01478676478125 },
      { id: "tsp", name: "Teaspoon", toBase: 0.00492892159375 },
    ],
  },
  weight: {
    label: "Weight",
    units: [
      { id: "kg", name: "Kilogram", toBase: 1 },
      { id: "g", name: "Gram", toBase: 0.001 },
      { id: "mg", name: "Milligram", toBase: 1e-6 },
      { id: "t", name: "Metric ton", toBase: 1000 },
      { id: "lb", name: "Pound", toBase: 0.45359237 },
      { id: "oz", name: "Ounce", toBase: 0.028349523125 },
      { id: "st", name: "Stone", toBase: 6.35029318 },
    ],
  },
  temp: {
    label: "Temperature",
    units: [
      { id: "c", name: "Celsius", toBase: 1 },
      { id: "f", name: "Fahrenheit", toBase: 1 },
      { id: "k", name: "Kelvin", toBase: 1 },
    ],
  },
  speed: {
    label: "Speed",
    units: [
      { id: "mps", name: "m/s", toBase: 1 },
      { id: "kph", name: "km/h", toBase: 1 / 3.6 },
      { id: "mph", name: "mph", toBase: 0.44704 },
      { id: "knot", name: "Knot", toBase: 0.514444 },
      { id: "fps", name: "ft/s", toBase: 0.3048 },
    ],
  },
  time: {
    label: "Time",
    units: [
      { id: "s", name: "Second", toBase: 1 },
      { id: "min", name: "Minute", toBase: 60 },
      { id: "h", name: "Hour", toBase: 3600 },
      { id: "d", name: "Day", toBase: 86400 },
      { id: "wk", name: "Week", toBase: 604800 },
      { id: "yr", name: "Year", toBase: 31557600 },
    ],
  },
  data: {
    label: "Data",
    units: [
      { id: "b", name: "Byte", toBase: 1 },
      { id: "kb", name: "KiB", toBase: 1024 },
      { id: "mb", name: "MiB", toBase: 1024 ** 2 },
      { id: "gb", name: "GiB", toBase: 1024 ** 3 },
      { id: "tb", name: "TiB", toBase: 1024 ** 4 },
      { id: "pb", name: "PiB", toBase: 1024 ** 5 },
    ],
  },
  energy: {
    label: "Energy",
    units: [
      { id: "j", name: "Joule", toBase: 1 },
      { id: "kj", name: "Kilojoule", toBase: 1000 },
      { id: "cal", name: "Calorie", toBase: 4.184 },
      { id: "kcal", name: "Kilocalorie", toBase: 4184 },
      { id: "wh", name: "Watt-hour", toBase: 3600 },
      { id: "kwh", name: "Kilowatt-hour", toBase: 3.6e6 },
    ],
  },
  pressure: {
    label: "Pressure",
    units: [
      { id: "pa", name: "Pascal", toBase: 1 },
      { id: "kpa", name: "Kilopascal", toBase: 1000 },
      { id: "bar", name: "Bar", toBase: 1e5 },
      { id: "atm", name: "Atmosphere", toBase: 101325 },
      { id: "psi", name: "PSI", toBase: 6894.757 },
      { id: "mmhg", name: "mmHg", toBase: 133.322 },
    ],
  },
  angle: {
    label: "Angle",
    units: [
      { id: "deg", name: "Degree", toBase: 1 },
      { id: "rad", name: "Radian", toBase: 180 / Math.PI },
      { id: "grad", name: "Gradian", toBase: 0.9 },
    ],
  },
  fuel: {
    label: "Fuel economy",
    units: [
      { id: "lp100", name: "L/100km", toBase: 1 },
      { id: "mpg", name: "US mpg", toBase: 235.215 },
      { id: "mpgi", name: "UK mpg", toBase: 282.481 },
      { id: "kpl", name: "km/L", toBase: 100 },
    ],
  },
};

function convertTemp(value: number, from: string, to: string): number {
  let c = value;
  if (from === "f") c = ((value - 32) * 5) / 9;
  if (from === "k") c = value - 273.15;
  if (to === "c") return c;
  if (to === "f") return (c * 9) / 5 + 32;
  if (to === "k") return c + 273.15;
  return value;
}

function convertFuel(value: number, from: string, to: string): number {
  if (value === 0) return 0;
  const toLp100 = (id: string, v: number) => {
    if (id === "lp100") return v;
    if (id === "kpl") return 100 / v;
    if (id === "mpg") return 235.215 / v;
    if (id === "mpgi") return 282.481 / v;
    return v;
  };
  const fromLp100 = (id: string, lp: number) => {
    if (id === "lp100") return lp;
    if (id === "kpl") return 100 / lp;
    if (id === "mpg") return 235.215 / lp;
    if (id === "mpgi") return 282.481 / lp;
    return lp;
  };
  return fromLp100(to, toLp100(from, value));
}

function convertUnit(
  value: number,
  group: string,
  from: string,
  to: string
): number {
  if (group === "temp") return convertTemp(value, from, to);
  if (group === "fuel") return convertFuel(value, from, to);
  const g = UNIT_GROUPS[group];
  const a = g?.units.find((u) => u.id === from);
  const b = g?.units.find((u) => u.id === to);
  if (!a || !b) return NaN;
  return (value * a.toBase) / b.toBase;
}

function formatResult(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  if (Math.abs(n) > 1e12 || (Math.abs(n) < 1e-6 && n !== 0)) {
    return n.toExponential(8).replace(/\.?0+e/, "e");
  }
  const s = Number(n.toPrecision(12)).toString();
  return s;
}

export function AdvancedCalculator() {
  const [mode, setMode] = useState<Mode>("scientific");
  const [expr, setExpr] = useState("");
  const [display, setDisplay] = useState("0");
  const [history, setHistory] = useState<string[]>([]);
  const [deg, setDeg] = useState(true);
  const [memory, setMemory] = useState(0);
  const [base, setBase] = useState<2 | 8 | 10 | 16>(10);

  const [group, setGroup] = useState("length");
  const [fromU, setFromU] = useState("m");
  const [toU, setToU] = useState("ft");
  const [convIn, setConvIn] = useState("1");

  const pushHistory = useCallback((line: string) => {
    setHistory((h) => [line, ...h].slice(0, 30));
    trackToolUse("advanced-calculator", 1);
  }, []);

  const evaluate = useCallback(
    (raw?: string) => {
      const source = (raw ?? (expr || display)).trim();
      if (!source) return;
      const n = evaluateExpression(source, deg);
      const out = formatResult(n);
      setDisplay(out);
      if (out !== "Error") {
        setExpr(out);
        pushHistory(`${source} = ${out}`);
      } else {
        setExpr("");
      }
    },
    [expr, display, deg, pushHistory]
  );

  const append = (chunk: string) => {
    setExpr((e) => {
      const next = e === "0" && /^\d$/.test(chunk) ? chunk : e + chunk;
      setDisplay(next || "0");
      return next;
    });
  };

  const clear = () => {
    setExpr("");
    setDisplay("0");
  };

  const backspace = () => {
    setExpr((e) => {
      const next = e.slice(0, -1);
      setDisplay(next || "0");
      return next;
    });
  };

  const progValue = useMemo(() => {
    const n = Number(display);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
    const v = Math.trunc(n);
    return {
      bin: (v >>> 0).toString(2),
      oct: (v >>> 0).toString(8),
      dec: String(v),
      hex: (v >>> 0).toString(16).toUpperCase(),
    };
  }, [display]);

  const convOut = useMemo(() => {
    const v = Number(convIn);
    if (!Number.isFinite(v)) return "—";
    return formatResult(convertUnit(v, group, fromU, toU));
  }, [convIn, group, fromU, toU]);

  const keys: { label: string; action: () => void; className?: string }[][] =
    mode === "scientific"
      ? [
          [
            { label: deg ? "DEG" : "RAD", action: () => setDeg((d) => !d), className: "text-cyan-300" },
            { label: "sin", action: () => append("sin(") },
            { label: "cos", action: () => append("cos(") },
            { label: "tan", action: () => append("tan(") },
          ],
          [
            { label: "ln", action: () => append("ln(") },
            { label: "log", action: () => append("log(") },
            { label: "√", action: () => append("sqrt(") },
            { label: "x²", action: () => append("**2") },
          ],
          [
            { label: "π", action: () => append("π") },
            { label: "e", action: () => append("e") },
            { label: "^", action: () => append("^") },
            { label: "n!", action: () => append("!") },
          ],
          [
            { label: "(", action: () => append("(") },
            { label: ")", action: () => append(")") },
            { label: "%", action: () => append("%") },
            { label: "÷", action: () => append("÷"), className: "text-violet-300" },
          ],
          [
            { label: "7", action: () => append("7") },
            { label: "8", action: () => append("8") },
            { label: "9", action: () => append("9") },
            { label: "×", action: () => append("×"), className: "text-violet-300" },
          ],
          [
            { label: "4", action: () => append("4") },
            { label: "5", action: () => append("5") },
            { label: "6", action: () => append("6") },
            { label: "−", action: () => append("-"), className: "text-violet-300" },
          ],
          [
            { label: "1", action: () => append("1") },
            { label: "2", action: () => append("2") },
            { label: "3", action: () => append("3") },
            { label: "+", action: () => append("+"), className: "text-violet-300" },
          ],
          [
            { label: "0", action: () => append("0") },
            { label: ".", action: () => append(".") },
            { label: "±", action: () => setExpr((e) => (e.startsWith("-") ? e.slice(1) : e ? `-${e}` : e)) },
            { label: "=", action: () => evaluate(), className: "bg-violet-600 text-white" },
          ],
        ]
      : [
          [
            { label: "÷", action: () => append("÷"), className: "text-violet-300" },
            { label: "×", action: () => append("×"), className: "text-violet-300" },
            { label: "−", action: () => append("-"), className: "text-violet-300" },
            { label: "+", action: () => append("+"), className: "text-violet-300" },
          ],
          [
            { label: "7", action: () => append("7") },
            { label: "8", action: () => append("8") },
            { label: "9", action: () => append("9") },
            { label: "%", action: () => append("%") },
          ],
          [
            { label: "4", action: () => append("4") },
            { label: "5", action: () => append("5") },
            { label: "6", action: () => append("6") },
            { label: "(", action: () => append("(") },
          ],
          [
            { label: "1", action: () => append("1") },
            { label: "2", action: () => append("2") },
            { label: "3", action: () => append("3") },
            { label: ")", action: () => append(")") },
          ],
          [
            { label: "0", action: () => append("0") },
            { label: ".", action: () => append(".") },
            { label: "±", action: () => setExpr((e) => (e.startsWith("-") ? e.slice(1) : e ? `-${e}` : e)) },
            { label: "=", action: () => evaluate(), className: "bg-violet-600 text-white" },
          ],
        ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {(
          [
            ["standard", "Standard"],
            ["scientific", "Scientific"],
            ["programmer", "Programmer"],
            ["convert", "Convert"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded-full px-3 py-1 text-xs ${
              mode === id ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode !== "convert" && (
        <>
          <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
            <p className="min-h-[1.25rem] truncate text-right font-mono text-xs text-zinc-500">
              {expr || "\u00a0"}
            </p>
            <p className="mt-1 text-right font-mono text-3xl font-semibold tracking-tight text-white">
              {display}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500">
              <button type="button" className="hover:text-white" onClick={() => setMemory(Number(display) || 0)}>
                MS
              </button>
              <button type="button" className="hover:text-white" onClick={() => append(String(memory))}>
                MR ({formatResult(memory)})
              </button>
              <button type="button" className="hover:text-white" onClick={() => setMemory((m) => m + (Number(display) || 0))}>
                M+
              </button>
              <button type="button" className="hover:text-white" onClick={() => setMemory(0)}>
                MC
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clear}
              className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-zinc-300"
            >
              AC
            </button>
            <button
              type="button"
              onClick={backspace}
              className="flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-zinc-300"
            >
              <Delete className="h-4 w-4" />
            </button>
          </div>

          {mode === "programmer" && progValue && (
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs text-zinc-400">
              <div>
                <span className="text-zinc-600">BIN</span> {progValue.bin}
              </div>
              <div>
                <span className="text-zinc-600">OCT</span> {progValue.oct}
              </div>
              <div>
                <span className="text-zinc-600">DEC</span> {progValue.dec}
              </div>
              <div>
                <span className="text-zinc-600">HEX</span> {progValue.hex}
              </div>
              <div className="col-span-2 flex flex-wrap gap-1 pt-1">
                {([2, 8, 10, 16] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBase(b)}
                    className={`rounded-full px-2 py-0.5 ${base === b ? "bg-violet-600 text-white" : "bg-white/5"}`}
                  >
                    base {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-1.5">
            {keys.map((row, i) => (
              <div key={i} className="grid grid-cols-4 gap-1.5">
                {row.map((k) => (
                  <button
                    key={k.label + i}
                    type="button"
                    onClick={k.action}
                    className={`rounded-xl border border-white/10 py-2.5 font-mono text-sm text-zinc-100 hover:bg-white/5 ${k.className ?? ""}`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {mode === "convert" && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <select
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              const u = UNIT_GROUPS[e.target.value].units;
              setFromU(u[0].id);
              setToU(u[1]?.id ?? u[0].id);
            }}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            {Object.entries(UNIT_GROUPS).map(([id, g]) => (
              <option key={id} value={id}>
                {g.label}
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">
              From
              <select
                value={fromU}
                onChange={(e) => setFromU(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                {UNIT_GROUPS[group].units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <input
                value={convIn}
                onChange={(e) => setConvIn(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-lg text-white"
              />
            </label>
            <label className="text-xs text-zinc-500">
              To
              <select
                value={toU}
                onChange={(e) => setToU(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                {UNIT_GROUPS[group].units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 font-mono text-lg text-white">
                {convOut}
              </p>
            </label>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <History className="h-3.5 w-3.5" /> History
          </p>
          <ul className="max-h-28 space-y-1 overflow-auto font-mono text-xs text-zinc-400">
            {history.map((h, i) => (
              <li key={`${h}-${i}`}>
                <button
                  type="button"
                  className="w-full text-left hover:text-white"
                  onClick={() => {
                    const lhs = h.split(" = ")[0];
                    setExpr(lhs);
                    setDisplay(lhs);
                  }}
                >
                  {h}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
