"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Download, Sparkles } from "lucide-react";
import { trackToolUse } from "@/lib/self-learn";

function downloadText(name: string, text: string, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
}

const AREAS = [
  "Study / exams",
  "Job / office",
  "Business / shop",
  "Family & home",
  "Health / fitness",
  "Side skill / content",
  "Rest & sleep",
] as const;

export function DailyLifePlanner() {
  const [name, setName] = useState("");
  const [wake, setWake] = useState("06:30");
  const [sleep, setSleep] = useState("22:30");
  const [focusHours, setFocusHours] = useState("3");
  const [areas, setAreas] = useState<string[]>(["Study / exams", "Family & home"]);
  const [musts, setMusts] = useState("");
  const [chaos, setChaos] = useState("");
  const [language, setLanguage] = useState<"en" | "hinglish">("hinglish");
  const [plan, setPlan] = useState("");

  function toggleArea(a: string) {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function build() {
    const blocks = [
      { t: wake, label: "Wake + water + 5-min stretch" },
      { t: addMins(wake, 30), label: "Breakfast / chai / prepare bag" },
    ];
    const focus = Math.min(8, Math.max(1, Number(focusHours) || 3));
    let cursor = addMins(wake, 90);
    const top = areas.slice(0, 3);
    for (let i = 0; i < focus; i++) {
      const area = top[i % Math.max(1, top.length)] || "Deep work";
      blocks.push({ t: cursor, label: `Focus block ${i + 1}: ${area}` });
      cursor = addMins(cursor, 50);
      blocks.push({ t: cursor, label: "Break 10 min (walk / stretch / water)" });
      cursor = addMins(cursor, 10);
    }
    blocks.push({ t: addMins(cursor, 0), label: "Meals / family / commute buffer" });
    blocks.push({ t: addMins(sleep, -60), label: "Wind-down — phone away from bed if possible" });
    blocks.push({ t: sleep, label: "Sleep target" });

    const mustList = musts
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const chaosList = chaos
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const hinglish = language === "hinglish";
    const head = hinglish
      ? `# Aaj / is hafte ka simple plan${name ? ` — ${name}` : ""}`
      : `# Daily life plan${name ? ` — ${name}` : ""}`;

    const body = [
      head,
      "",
      hinglish
        ? "Rule: pehle zaroori kaam, phir deep focus, phir family/rest. AI ne draft kiya — aap adjust karo."
        : "Rule: must-dos first, then deep focus, then family/rest. AI-style draft — adjust to reality.",
      "",
      "## Focus areas",
      ...areas.map((a) => `- ${a}`),
      "",
      "## Must finish today",
      ...(mustList.length ? mustList.map((m, i) => `${i + 1}. ${m}`) : ["- (add your non-negotiables)"]),
      "",
      "## Suggested day timeline",
      ...blocks.map((b) => `- **${b.t}** — ${b.label}`),
      "",
      "## Parking lot (later / maybe)",
      ...(chaosList.length ? chaosList.map((c) => `- ${c}`) : ["- (optional brain dump)"]),
      "",
      "## Evening 5-minute review",
      hinglish
        ? "- 1 cheez jo acchi gayi\n- 1 cheez kal better\n- Kal ka sabse zaroori 1 kaam likho"
        : "- 1 win\n- 1 improve tomorrow\n- Write tomorrow’s #1 priority",
      "",
      "---",
      "Made with Plethora Daily life planner · stay kind to yourself.",
    ].join("\n");

    setPlan(body);
    trackToolUse("life-planner", 2);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Dump real life in → get a day plan you can screenshot. Works for students, jobs, shops, parents —
        especially when free time is scarce.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-zinc-500">
          Name (optional)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-zinc-500">
          Language of plan
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en" | "hinglish")}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="hinglish">Simple English + Hinglish headers</option>
            <option value="en">English only</option>
          </select>
        </label>
        <label className="text-xs text-zinc-500">
          Wake
          <input
            type="time"
            value={wake}
            onChange={(e) => setWake(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-zinc-500">
          Sleep target
          <input
            type="time"
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-zinc-500 sm:col-span-2">
          Deep focus blocks (hours)
          <input
            type="number"
            min={1}
            max={8}
            value={focusHours}
            onChange={(e) => setFocusHours(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
      </div>
      <div>
        <p className="text-xs text-zinc-500">Areas of life this week</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {AREAS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleArea(a)}
              className={`rounded-full px-2.5 py-1 text-xs ${
                areas.includes(a) ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <label className="block text-xs text-zinc-500">
        Must finish today (one per line)
        <textarea
          value={musts}
          onChange={(e) => setMusts(e.target.value)}
          rows={3}
          placeholder={"Finish chapter 4\nCall distributor\nSchool form"}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>
      <label className="block text-xs text-zinc-500">
        Brain dump / optional noise
        <textarea
          value={chaos}
          onChange={(e) => setChaos(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>
      <button
        type="button"
        onClick={build}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white"
      >
        <ClipboardList className="h-4 w-4" />
        Generate my day plan
      </button>
      {plan && (
        <>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-black/50 p-3 text-xs text-zinc-200">
            {plan}
          </pre>
          <button
            type="button"
            onClick={() => downloadText("plethora-day-plan.md", plan)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300"
          >
            <Download className="h-4 w-4" /> Download
          </button>
        </>
      )}
    </div>
  );
}

function addMins(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  let total = h * 60 + m + mins;
  total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

type CalEvent = { date: string; title: string; time?: string };

export function CalendarGenerator() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [eventsRaw, setEventsRaw] = useState("");
  const [title, setTitle] = useState("My month");
  const [out, setOut] = useState("");
  const [ics, setIcs] = useState("");

  const grid = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const days = new Date(year, month, 0).getDate();
    const startPad = first.getDay(); // 0 Sun
    const cells: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  function parseEvents(): CalEvent[] {
    return eventsRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // YYYY-MM-DD title | or DD title
        const m = line.match(/^(\d{4}-\d{2}-\d{2}|\d{1,2})\s+(.+)$/);
        if (!m) return null;
        let date = m[1];
        if (!date.includes("-")) {
          date = `${year}-${String(month).padStart(2, "0")}-${String(Number(date)).padStart(2, "0")}`;
        }
        const rest = m[2];
        const tm = rest.match(/^(\d{1,2}:\d{2})\s+(.+)$/);
        if (tm) return { date, time: tm[1], title: tm[2] };
        return { date, title: rest };
      })
      .filter(Boolean) as CalEvent[];
  }

  function generate() {
    const events = parseEvents();
    const monthName = new Date(year, month - 1).toLocaleString(undefined, { month: "long" });
    const byDay: Record<number, CalEvent[]> = {};
    for (const e of events) {
      const d = Number(e.date.split("-")[2]);
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(e);
    }

    const lines = [
      `# ${title} — ${monthName} ${year}`,
      "",
      "```",
      "Su Mo Tu We Th Fr Sa",
    ];
    let row = "";
    grid.forEach((d, i) => {
      row += d == null ? "   " : String(d).padStart(2, " ") + " ";
      if ((i + 1) % 7 === 0) {
        lines.push(row.trimEnd());
        row = "";
      }
    });
    lines.push("```", "", "## Events");
    if (!events.length) lines.push("- (none yet — add lines like `15 Project due` or `2026-08-20 10:00 Exam`)");
    else {
      for (const e of events.sort((a, b) => a.date.localeCompare(b.date))) {
        lines.push(`- **${e.date}**${e.time ? ` ${e.time}` : ""} — ${e.title}`);
      }
    }
    lines.push("", "## By day", "");
    for (let d = 1; d <= new Date(year, month, 0).getDate(); d++) {
      if (byDay[d]?.length) {
        lines.push(`### ${monthName} ${d}`);
        byDay[d].forEach((e) => lines.push(`- ${e.time ? e.time + " " : ""}${e.title}`));
        lines.push("");
      }
    }

    const text = lines.join("\n");
    setOut(text);

    // ICS
    const icsLines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Plethora//Calendar//EN"];
    for (const e of events) {
      const [y, mo, da] = e.date.split("-").map(Number);
      const dt = `${y}${String(mo).padStart(2, "0")}${String(da).padStart(2, "0")}`;
      let dtStart = `${dt}`;
      let dtEnd = `${dt}`;
      if (e.time) {
        const [hh, mm] = e.time.split(":").map(Number);
        dtStart = `${dt}T${String(hh).padStart(2, "0")}${String(mm).padStart(2, "0")}00`;
        const endM = hh * 60 + mm + 60;
        const eh = Math.floor(endM / 60) % 24;
        const em = endM % 60;
        dtEnd = `${dt}T${String(eh).padStart(2, "0")}${String(em).padStart(2, "0")}00`;
        icsLines.push(
          "BEGIN:VEVENT",
          `UID:${e.date}-${e.title.slice(0, 12).replace(/\W/g, "")}@plethora`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:${e.title.replace(/\n/g, " ")}`,
          "END:VEVENT"
        );
      } else {
        icsLines.push(
          "BEGIN:VEVENT",
          `UID:${e.date}-${e.title.slice(0, 12).replace(/\W/g, "")}@plethora`,
          `DTSTART;VALUE=DATE:${dtStart}`,
          `DTEND;VALUE=DATE:${dtStart}`,
          `SUMMARY:${e.title.replace(/\n/g, " ")}`,
          "END:VEVENT"
        );
      }
    }
    icsLines.push("END:VCALENDAR");
    setIcs(icsLines.join("\r\n"));
    trackToolUse("calendar-generator", 2);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Month grid + event list → markdown calendar and optional .ics for Google / phone calendar.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs text-zinc-500 sm:col-span-3">
          Calendar title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-zinc-500">
          Year
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || year)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-zinc-500">
          Month
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value) || 1)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-500">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d}>{d}</div>
        ))}
        {grid.map((d, i) => (
          <div
            key={i}
            className={`rounded-md py-1.5 font-mono text-xs ${
              d ? "bg-white/5 text-zinc-200" : "text-transparent"
            }`}
          >
            {d ?? "."}
          </div>
        ))}
      </div>

      <label className="block text-xs text-zinc-500">
        Events (one per line)
        <textarea
          value={eventsRaw}
          onChange={(e) => setEventsRaw(e.target.value)}
          rows={5}
          placeholder={"15 Project due\n20 10:00 Exam\n2026-08-25 Family function"}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white"
        />
      </label>
      <button
        type="button"
        onClick={generate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white"
      >
        <CalendarDays className="h-4 w-4" />
        Generate calendar
      </button>
      {out && (
        <>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-black/50 p-3 text-xs text-zinc-200">
            {out}
          </pre>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadText("plethora-calendar.md", out)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300"
            >
              <Download className="h-4 w-4" /> .md
            </button>
            {ics && (
              <button
                type="button"
                onClick={() => downloadText("plethora-events.ics", ics, "text/calendar")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300"
              >
                <Download className="h-4 w-4" /> .ics (phone calendar)
              </button>
            )}
          </div>
        </>
      )}
      <p className="flex items-start gap-2 text-[11px] text-zinc-600">
        <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
        Pair with Learn → daily plan lesson for “when” to work, and multi-timer when blocks start.
      </p>
    </div>
  );
}
