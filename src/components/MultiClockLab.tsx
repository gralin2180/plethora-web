"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlarmClock,
  Clock,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Trash2,
} from "lucide-react";
import { trackToolUse } from "@/lib/self-learn";

type Kind = "timer" | "stopwatch";

type Unit = {
  id: string;
  kind: Kind;
  label: string;
  /** total duration ms for timers */
  durationMs: number;
  /** remaining (timer) or elapsed (stopwatch) when not running */
  baseMs: number;
  running: boolean;
  startedAt: number | null;
  finished: boolean;
  laps: number[];
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pad(n: number, w = 2) {
  return String(n).padStart(w, "0");
}

function formatMs(ms: number, withMs = true) {
  const t = Math.max(0, Math.floor(ms));
  const h = Math.floor(t / 3_600_000);
  const m = Math.floor((t % 3_600_000) / 60_000);
  const s = Math.floor((t % 60_000) / 1000);
  const cs = Math.floor((t % 1000) / 10);
  if (h > 0) {
    return withMs ? `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return withMs ? `${pad(m)}:${pad(s)}.${pad(cs)}` : `${pad(m)}:${pad(s)}`;
}

function parseDuration(h: number, m: number, s: number) {
  return Math.max(0, (h * 3600 + m * 60 + s) * 1000);
}

function newUnit(kind: Kind, index: number): Unit {
  const durationMs = kind === "timer" ? 5 * 60 * 1000 : 0;
  return {
    id: uid(),
    kind,
    label: kind === "timer" ? `Timer ${index}` : `Stopwatch ${index}`,
    durationMs,
    baseMs: kind === "timer" ? durationMs : 0,
    running: false,
    startedAt: null,
    finished: false,
    laps: [],
  };
}

function liveMs(u: Unit, now: number): number {
  if (u.kind === "timer") {
    if (u.finished) return 0;
    if (u.running && u.startedAt != null) {
      return Math.max(0, u.baseMs - (now - u.startedAt));
    }
    return u.baseMs;
  }
  // stopwatch
  if (u.running && u.startedAt != null) {
    return u.baseMs + (now - u.startedAt);
  }
  return u.baseMs;
}

export function MultiClockLab() {
  const [now, setNow] = useState(() => Date.now());
  const [units, setUnits] = useState<Unit[]>(() => [
    newUnit("timer", 1),
    newUnit("stopwatch", 1),
  ]);
  const [tz, setTz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 40);
    return () => clearInterval(id);
  }, []);

  // finish timers + soft beep once
  useEffect(() => {
    setUnits((prev) => {
      let changed = false;
      const next = prev.map((u) => {
        if (u.kind !== "timer" || !u.running || u.finished) return u;
        const rem = liveMs(u, now);
        if (rem <= 0) {
          changed = true;
          try {
            const ctx = new AudioContext();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = 880;
            g.gain.value = 0.08;
            o.start();
            o.stop(ctx.currentTime + 0.35);
          } catch {
            /* ignore */
          }
          return {
            ...u,
            running: false,
            startedAt: null,
            baseMs: 0,
            finished: true,
          };
        }
        return u;
      });
      return changed ? next : prev;
    });
  }, [now]);

  const clock = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date(now));
    } catch {
      return new Date(now).toLocaleString();
    }
  }, [now, tz]);

  const countTimers = units.filter((u) => u.kind === "timer").length;
  const countSw = units.filter((u) => u.kind === "stopwatch").length;

  const add = (kind: Kind) => {
    setUnits((u) => [
      ...u,
      newUnit(kind, (kind === "timer" ? countTimers : countSw) + 1),
    ]);
    trackToolUse("multi-clock", 1);
  };

  const update = (id: string, patch: Partial<Unit>) => {
    setUnits((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const remove = (id: string) => {
    setUnits((list) => (list.length <= 1 ? list : list.filter((u) => u.id !== id)));
  };

  const toggle = (u: Unit) => {
    const t = Date.now();
    if (u.running) {
      // pause
      const current = liveMs(u, t);
      update(u.id, { running: false, startedAt: null, baseMs: current });
    } else {
      if (u.kind === "timer" && (u.baseMs <= 0 || u.finished)) return;
      update(u.id, {
        running: true,
        startedAt: t,
        finished: false,
      });
      trackToolUse("multi-clock", 1);
    }
  };

  const reset = (u: Unit) => {
    update(u.id, {
      running: false,
      startedAt: null,
      baseMs: u.kind === "timer" ? u.durationMs : 0,
      finished: false,
      laps: [],
    });
  };

  const setDuration = (u: Unit, h: number, m: number, s: number) => {
    const d = parseDuration(h, m, s) || 1000;
    update(u.id, {
      durationMs: d,
      baseMs: d,
      running: false,
      startedAt: null,
      finished: false,
    });
  };

  const lap = (u: Unit) => {
    const elapsed = liveMs(u, Date.now());
    update(u.id, { laps: [...u.laps, elapsed] });
  };

  return (
    <div className="space-y-5">
      {/* Live clock */}
      <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 to-transparent p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300/90">
            <Clock className="h-3.5 w-3.5" />
            Live clock
          </p>
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="max-w-[220px] rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-zinc-300"
          >
            {[
              Intl.DateTimeFormat().resolvedOptions().timeZone,
              "UTC",
              "America/New_York",
              "America/Los_Angeles",
              "Europe/London",
              "Europe/Paris",
              "Asia/Kolkata",
              "Asia/Tokyo",
              "Australia/Sydney",
            ]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
          </select>
        </div>
        <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {clock}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => add("timer")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Timer
        </button>
        <button
          type="button"
          onClick={() => add("stopwatch")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
          Stopwatch
        </button>
        <p className="text-xs text-zinc-500">
          Run several at once — same pain point, fixed.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-1">
        {units.map((u) => {
          const display = liveMs(u, now);
          const progress =
            u.kind === "timer" && u.durationMs > 0
              ? Math.min(100, ((u.durationMs - display) / u.durationMs) * 100)
              : 0;
          const dh = Math.floor(u.durationMs / 3_600_000);
          const dm = Math.floor((u.durationMs % 3_600_000) / 60_000);
          const ds = Math.floor((u.durationMs % 60_000) / 1000);

          return (
            <div
              key={u.id}
              className={`rounded-2xl border p-4 ${
                u.finished
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-white/10 bg-black/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {u.kind === "timer" ? (
                    <Timer className="h-4 w-4 shrink-0 text-violet-400" />
                  ) : (
                    <AlarmClock className="h-4 w-4 shrink-0 text-emerald-400" />
                  )}
                  <input
                    value={u.label}
                    onChange={(e) => update(u.id, { label: e.target.value })}
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-zinc-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(u.id)}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-red-300"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p
                className={`mt-3 font-mono text-3xl font-semibold tracking-tight tabular-nums ${
                  u.finished ? "text-amber-200" : "text-white"
                }`}
              >
                {formatMs(display)}
              </p>
              {u.finished && (
                <p className="mt-1 text-xs font-medium text-amber-200">Time&apos;s up</p>
              )}

              {u.kind === "timer" && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {u.kind === "timer" && !u.running && (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  {(
                    [
                      ["h", dh],
                      ["m", dm],
                      ["s", ds],
                    ] as const
                  ).map(([key, val], i, arr) => (
                    <label key={key} className="text-[10px] uppercase text-zinc-500">
                      {key}
                      <input
                        type="number"
                        min={0}
                        max={key === "h" ? 99 : 59}
                        defaultValue={val}
                        key={`${u.id}-${u.durationMs}-${key}`}
                        onBlur={(e) => {
                          const nums = arr.map(([k, v]) =>
                            k === key ? Number(e.target.value) || 0 : v
                          );
                          // re-read from sibling inputs is hard; use duration parse from current
                          const inputs = e.currentTarget.parentElement?.parentElement?.querySelectorAll(
                            "input[type=number]"
                          );
                          const hh = Number((inputs?.[0] as HTMLInputElement)?.value) || 0;
                          const mm = Number((inputs?.[1] as HTMLInputElement)?.value) || 0;
                          const ss = Number((inputs?.[2] as HTMLInputElement)?.value) || 0;
                          setDuration(u, hh, mm, ss);
                        }}
                        className="mt-0.5 w-14 rounded-lg border border-white/10 bg-black/40 px-2 py-1 font-mono text-sm text-white"
                      />
                    </label>
                  ))}
                  <div className="flex flex-wrap gap-1 pb-0.5">
                    {[
                      ["1m", 0, 1, 0],
                      ["5m", 0, 5, 0],
                      ["10m", 0, 10, 0],
                      ["25m", 0, 25, 0],
                      ["1h", 1, 0, 0],
                    ].map(([label, h, m, s]) => (
                      <button
                        key={String(label)}
                        type="button"
                        onClick={() => setDuration(u, Number(h), Number(m), Number(s))}
                        className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-zinc-400 hover:bg-white/5"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggle(u)}
                  disabled={u.kind === "timer" && u.baseMs <= 0 && !u.running && !u.finished}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm text-white disabled:opacity-40"
                >
                  {u.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {u.running ? "Pause" : u.finished ? "Done" : "Start"}
                </button>
                <button
                  type="button"
                  onClick={() => reset(u)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
                {u.kind === "stopwatch" && (
                  <button
                    type="button"
                    onClick={() => lap(u)}
                    disabled={!u.running && u.baseMs === 0}
                    className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 disabled:opacity-40"
                  >
                    Lap
                  </button>
                )}
              </div>

              {u.laps.length > 0 && (
                <ul className="mt-3 max-h-28 space-y-1 overflow-auto font-mono text-xs text-zinc-500">
                  {[...u.laps].reverse().map((l, i) => (
                    <li key={`${u.id}-lap-${i}`}>
                      Lap {u.laps.length - i}: {formatMs(l)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
