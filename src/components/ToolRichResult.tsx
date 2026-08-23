"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

export type CalendarDay = {
  d: number;
  type: string;
  hook: string;
  cta: string;
};

function extractJson(raw: string): unknown | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const blob = fenced?.[1] || raw;
  const start = blob.indexOf("{");
  const end = blob.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(blob.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function parseCalendarDays(raw: string): CalendarDay[] {
  const json = extractJson(raw) as { days?: unknown } | null;
  if (json && Array.isArray(json.days)) {
    return json.days
      .map((row) => {
        const r = row as Record<string, unknown>;
        const d = Number(r.d ?? r.day ?? r.Day);
        if (!Number.isFinite(d)) return null;
        return {
          d,
          type: String(r.type ?? r.contentType ?? r.format ?? "Post"),
          hook: String(r.hook ?? r.topic ?? r.title ?? ""),
          cta: String(r.cta ?? r.CTA ?? ""),
        };
      })
      .filter((x): x is CalendarDay => Boolean(x))
      .sort((a, b) => a.d - b.d);
  }

  const days: CalendarDay[] = [];
  const table = raw.match(/^\|.+\|$/gm);
  if (table && table.length > 2) {
    for (const line of table.slice(2)) {
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      const n = parseInt(cells[0]?.replace(/\D/g, "") || "", 10);
      if (!Number.isFinite(n)) continue;
      days.push({
        d: n,
        type: cells[1] || "Post",
        hook: cells[2] || "",
        cta: cells[3] || "",
      });
    }
  }

  const lineRe =
    /(?:^|\n)\s*(?:day\s*)?(\d{1,2})\s*[:.\-–]\s*(.+)/gi;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(raw))) {
    const d = Number(m[1]);
    if (days.some((x) => x.d === d)) continue;
    const rest = m[2].trim();
    const [type, ...restParts] = rest.split(/[—–|:]\s*/);
    days.push({
      d,
      type: type.slice(0, 24) || "Post",
      hook: (restParts.join(" — ") || rest).slice(0, 180),
      cta: "",
    });
  }
  return days.sort((a, b) => a.d - b.d);
}

function typeTone(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("reel") || t.includes("short") || t.includes("tiktok"))
    return "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/30";
  if (t.includes("stor")) return "bg-amber-500/20 text-amber-100 border-amber-500/30";
  if (t.includes("live")) return "bg-rose-500/20 text-rose-100 border-rose-500/30";
  if (t.includes("email") || t.includes("news"))
    return "bg-sky-500/20 text-sky-100 border-sky-500/30";
  return "bg-violet-500/20 text-violet-100 border-violet-500/30";
}

export function ToolRichResult({
  text,
  slug,
}: {
  text: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);
  const days = useMemo(() => parseCalendarDays(text), [text]);
  const calendarish =
    slug.includes("calendar") ||
    slug.includes("planner") ||
    slug.includes("fitness-program") ||
    days.length >= 14;

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <p className="text-xs font-medium text-zinc-400">
          {calendarish && days.length ? `${days.length}-day board` : "Result"}
        </p>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex items-center gap-1 text-xs text-violet-300"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {calendarish && days.length >= 7 ? (
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
          {days.map((day) => (
            <article
              key={day.d}
              className="flex min-h-[8.5rem] flex-col rounded-xl border border-white/10 bg-black/50 p-2.5"
            >
              <div className="mb-1.5 flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold tabular-nums text-white">
                  Day {day.d}
                </span>
                <span
                  className={`rounded-full border px-1.5 py-px text-[9px] font-medium ${typeTone(day.type)}`}
                >
                  {day.type}
                </span>
              </div>
              <p className="flex-1 text-[11px] leading-snug text-zinc-200">{day.hook}</p>
              {day.cta ? (
                <p className="mt-2 border-t border-white/5 pt-1.5 text-[10px] text-violet-300">
                  {day.cta}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-2 p-4 text-sm leading-relaxed text-zinc-200">
          {text.split(/\n{2,}/).map((block, i) => {
            const heading = block.match(/^#{1,3}\s+(.+)/);
            if (heading) {
              return (
                <h3 key={i} className="pt-2 text-base font-semibold text-white">
                  {heading[1]}
                </h3>
              );
            }
            if (/^\s*[-*•]/.test(block) || /^\s*\d+\./.test(block)) {
              return (
                <ul key={i} className="space-y-1 pl-1">
                  {block.split("\n").map((line, j) => (
                    <li
                      key={j}
                      className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[13px]"
                    >
                      {line.replace(/^\s*[-*•]\s*/, "").replace(/^\s*\d+\.\s*/, "")}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-[13px] text-zinc-300">
                {block}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
