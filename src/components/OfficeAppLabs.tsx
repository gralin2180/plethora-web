"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bot,
  Cable,
  Clapperboard,
  FileText,
  Layout,
  Loader2,
  MessageSquare,
  PenLine,
  Plus,
  Server,
  Sparkles,
  Trash2,
  Workflow,
} from "lucide-react";
import { InfraControlDesk } from "@/components/InfraControlDesk";
import { OfficeWordEditor } from "@/components/OfficeWordEditor";
import { PlethoraSlack } from "@/components/PlethoraSlack";
import { PlethoraTaskbot } from "@/components/PlethoraTaskbot";
import { defaultOfficeBotId, chatSystemForOfficeBot } from "@/lib/office-assistants";
import { getBot } from "@/lib/chat-bots";
import { trackToolUse } from "@/lib/self-learn";
import { runPlatformAi } from "@/lib/platform-ai-client";

async function usage(id: string) {
  try {
    trackToolUse(id, 2);
  } catch {
    /* */
  }
}

async function ai(prompt: string, system: string) {
  const r = await runPlatformAi(prompt, { customSystem: system, toolJob: true, maxTokens: 1200 });
  return r.reply || r.code || "No reply — Connect AI or BYOK.";
}

function usePersisted<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setV(JSON.parse(raw) as T);
    } catch {
      /* */
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* */
    }
  }, [key, v, ready]);
  return [v, setV] as const;
}

function AiBar({
  placeholder,
  onGo,
  busy,
}: {
  placeholder: string;
  onGo: (q: string) => void;
  busy: boolean;
}) {
  const [q, setQ] = useState("");
  return (
    <div className="flex gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && q.trim()) onGo(q.trim());
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
      />
      <button
        type="button"
        disabled={busy || !q.trim()}
        onClick={() => onGo(q.trim())}
        className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-sm text-white disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        AI
      </button>
    </div>
  );
}

export function OfficeWordLab() {
  return <OfficeWordEditor />;
}

// legacy — use OfficeWordEditor

type Card = { id: string; title: string };
type Col = { id: string; name: string; cards: Card[] };

const DEFAULT_BOARD: Col[] = [
  { id: "backlog", name: "Backlog", cards: [] },
  { id: "doing", name: "Doing", cards: [] },
  { id: "review", name: "Review", cards: [] },
  { id: "done", name: "Done", cards: [] },
];

export function OfficeBoardsLab() {
  const [cols, setCols] = usePersisted<Col[]>("plethora.office.boards", DEFAULT_BOARD);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  function addCard() {
    const t = draft.trim();
    if (!t) return;
    setCols((c) =>
      c.map((col, i) =>
        i === 0 ? { ...col, cards: [{ id: crypto.randomUUID(), title: t }, ...col.cards] } : col
      )
    );
    setDraft("");
  }

  function move(id: string, dir: -1 | 1) {
    setCols((prev) => {
      const next = prev.map((c) => ({ ...c, cards: [...c.cards] }));
      let from = -1;
      let idx = -1;
      next.forEach((c, i) => {
        const j = c.cards.findIndex((x) => x.id === id);
        if (j >= 0) {
          from = i;
          idx = j;
        }
      });
      if (from < 0) return prev;
      const to = from + dir;
      if (to < 0 || to >= next.length) return prev;
      const [card] = next[from].cards.splice(idx, 1);
      next[to].cards.unshift(card);
      return next;
    });
  }

  async function breakDown(q: string) {
    setBusy(true);
    await usage("office-boards");
    const reply = await ai(
      q,
      "Return 6-12 short kanban card titles, one per line, no numbers or bullets. Production / IT / film / fashion ok."
    );
    const lines = reply
      .split("\n")
      .map((l) => l.replace(/^[\d.)\-*]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 12);
    setCols((c) =>
      c.map((col, i) =>
        i === 0
          ? {
              ...col,
              cards: [...lines.map((title) => ({ id: crypto.randomUUID(), title })), ...col.cards],
            }
          : col
      )
    );
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">Inspired by Trello — not Trello. Cards stay in this browser.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addCard();
          }}
          placeholder="New card…"
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={addCard}
          className="inline-flex items-center gap-1 rounded-xl bg-cyan-700 px-3 py-2 text-sm text-white"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <AiBar placeholder="Break “summer lookbook shoot” into cards…" onGo={breakDown} busy={busy} />
      <div className="grid gap-3 md:grid-cols-4">
        {cols.map((col, ci) => (
          <div
            key={col.id}
            className={`rounded-2xl border p-3 ${
              ci === 0
                ? "border-zinc-500/30 bg-zinc-500/5"
                : ci === 1
                  ? "border-cyan-500/30 bg-cyan-500/5"
                  : ci === 2
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-emerald-500/30 bg-emerald-500/5"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{col.name}</p>
            <ul className="mt-2 space-y-2">
              {col.cards.map((card) => (
                <li key={card.id} className="rounded-xl border border-white/10 bg-black/40 px-2 py-2">
                  <p className="text-sm text-zinc-200">{card.title}</p>
                  <div className="mt-1 flex gap-1">
                    <button
                      type="button"
                      className="text-[10px] text-zinc-500 hover:text-white"
                      onClick={() => move(card.id, -1)}
                      disabled={ci === 0}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="text-[10px] text-zinc-500 hover:text-white"
                      onClick={() => move(card.id, 1)}
                      disabled={ci === cols.length - 1}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-[10px] text-rose-400/80"
                      onClick={() =>
                        setCols((c) =>
                          c.map((x) => ({ ...x, cards: x.cards.filter((k) => k.id !== card.id) }))
                        )
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

type Msg = { role: "user" | "bot"; text: string };
type Channel = { id: string; name: string; msgs: Msg[] };

export function OfficeRoomsLab() {
  const [channels, setChannels] = usePersisted<Channel[]>("plethora.office.rooms", [
    { id: "general", name: "general", msgs: [] },
    { id: "prod", name: "production", msgs: [] },
  ]);
  const [active, setActive] = useState("general");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [botId, setBotId] = useState(defaultOfficeBotId("rooms"));
  const ch = channels.find((c) => c.id === active) || channels[0];
  const bot = getBot(botId);

  function addChannel() {
    const name = window.prompt("Channel name?");
    if (!name?.trim()) return;
    const id = name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 24);
    setChannels((c) => [...c, { id, name: name.trim(), msgs: [] }]);
    setActive(id);
  }

  async function send() {
    const text = input.trim();
    if (!text || !ch) return;
    setInput("");
    const history = [...ch.msgs, { role: "user" as const, text }].slice(-80);
    setChannels((all) => all.map((c) => (c.id === ch.id ? { ...c, msgs: history } : c)));
    setBusy(true);
    await usage("office-rooms");
    const reply = await ai(
      `Channel #${ch.name}\n${history
        .slice(-8)
        .map((m) => `${m.role}: ${m.text}`)
        .join("\n")}\n\nReply as ${bot?.name || "teammate"}.`,
      chatSystemForOfficeBot(botId, "rooms")
    );
    setChannels((all) =>
      all.map((c) =>
        c.id === ch.id ? { ...c, msgs: [...history, { role: "bot" as const, text: reply }].slice(-80) } : c
      )
    );
    setBusy(false);
  }

  return (
    <div className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-white/10 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-1 sm:flex-row">
      <aside className="w-full shrink-0 space-y-1 sm:w-44">
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Channels</p>
        {channels.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm ${
              c.id === active ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-white/5"
            }`}
          >
            #{c.name}
          </button>
        ))}
        <button type="button" onClick={addChannel} className="text-xs text-violet-300">
          + channel
        </button>
        <div className="mt-3 border-t border-white/10 pt-3">
          <label className="text-[10px] uppercase text-zinc-500">AI teammate</label>
          <select
            value={botId}
            onChange={(e) => setBotId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-2 py-1.5 text-xs text-white"
          >
            {["echo", "sage", "nova", "kira", "quill", "ledger"].map((id) => {
              const b = getBot(id);
              if (!b) return null;
              return (
                <option key={id} value={id}>
                  {b.glyph} {b.name}
                </option>
              );
            })}
          </select>
          {bot ? <p className="mt-1 text-[10px] text-zinc-600">{bot.tagline}</p> : null}
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-white/10 bg-black/30 p-3">
        <p className="text-xs text-zinc-500">
          #{ch?.name} · {bot ? `${bot.glyph} ${bot.name}` : "teammate"} · local only
        </p>
        <div className="mt-2 min-h-[220px] flex-1 space-y-2 overflow-auto">
          {ch?.msgs.map((m, i) => (
            <p
              key={i}
              className={`rounded-xl px-3 py-2 text-sm ${
                m.role === "user" ? "ml-8 bg-cyan-800/50 text-white" : "mr-6 border border-white/10 text-zinc-200"
              }`}
            >
              {m.text}
            </p>
          ))}
          {busy ? <p className="text-xs text-zinc-500">Teammate typing…</p> : null}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
            placeholder="Message…"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy}
            className="rounded-xl bg-violet-600 px-3 py-2 text-sm text-white"
          >
            Send
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

type Step = { id: string; label: string };

export function OfficeFlowLab() {
  const [steps, setSteps] = usePersisted<Step[]>("plethora.office.flow", [
    { id: "1", label: "Intake" },
    { id: "2", label: "Make" },
    { id: "3", label: "Review" },
    { id: "4", label: "Ship" },
  ]);
  const [busy, setBusy] = useState(false);

  async function gen(q: string) {
    setBusy(true);
    await usage("office-flow");
    const reply = await ai(
      q,
      "Return 4-10 process steps, one short label per line, no numbers. Pipelines for film, fashion, IT, games ok."
    );
    const lines = reply
      .split("\n")
      .map((l) => l.replace(/^[\d.)\-*]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 12);
    if (lines.length) setSteps(lines.map((label, i) => ({ id: String(i + 1), label })));
    setBusy(false);
  }

  const mermaid = `flowchart LR\n${steps.map((s, i) => `  s${i}["${s.label.replace(/"/g, "")}"]`).join("\n")}\n${steps
    .slice(0, -1)
    .map((_, i) => `  s${i} --> s${i + 1}`)
    .join("\n")}`;

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">Flow creator — not Lucid / Miro. Export Mermaid into any diagram app.</p>
      <AiBar placeholder="Fashion drop pipeline… film dailies… IT incident…" onGo={gen} busy={busy} />
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-700 text-xs text-white">
              {i + 1}
            </span>
            <input
              value={s.label}
              onChange={(e) =>
                setSteps((st) => st.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))
              }
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
            />
          </li>
        ))}
      </ol>
      <pre className="overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-zinc-400">
        {mermaid}
      </pre>
      <button
        type="button"
        className="text-sm text-violet-300"
        onClick={() => void navigator.clipboard.writeText(mermaid)}
      >
        Copy Mermaid
      </button>
    </div>
  );
}

type Frame = { id: string; name: string; w: number; h: number; notes: string };

export function OfficeDesignLab() {
  const [frames, setFrames] = usePersisted<Frame[]>("plethora.office.design", [
    { id: "hero", name: "Hero / key", w: 1920, h: 1080, notes: "" },
  ]);
  const [busy, setBusy] = useState(false);

  async function gen(q: string) {
    setBusy(true);
    await usage("office-design");
    const reply = await ai(
      q,
      "Return 4-8 layout frames as lines: NAME | WIDTHxHEIGHT | notes. Fashion lookbook, game HUD, film storyboard, web ok."
    );
    const parsed: Frame[] = [];
    for (const line of reply.split("\n")) {
      const m = line.match(/([^|]+)\|?\s*(\d{2,5})\s*[x×]\s*(\d{2,5})\s*\|?\s*(.*)/i);
      if (!m) continue;
      parsed.push({
        id: crypto.randomUUID(),
        name: m[1].replace(/^[\d.)\-*]+\s*/, "").trim(),
        w: Number(m[2]),
        h: Number(m[3]),
        notes: (m[4] || "").trim(),
      });
    }
    if (parsed.length) setFrames(parsed);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Layout board inspired by Figma — not Figma. No live vector canvas; frames + notes + export to a real editor.
      </p>
      <AiBar placeholder="Mobile app screens… lookbook spreads… HUD…" onGo={gen} busy={busy} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {frames.map((f) => (
          <li key={f.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div
              className="mb-2 rounded-lg border border-dashed border-violet-500/30 bg-violet-500/5"
              style={{ aspectRatio: `${Math.max(f.w, 1)} / ${Math.max(f.h, 1)}`, maxHeight: 120 }}
            />
            <input
              value={f.name}
              onChange={(e) =>
                setFrames((all) => all.map((x) => (x.id === f.id ? { ...x, name: e.target.value } : x)))
              }
              className="w-full bg-transparent text-sm font-medium text-white"
            />
            <p className="text-[11px] text-zinc-500">
              {f.w}×{f.h}
            </p>
            <textarea
              value={f.notes}
              onChange={(e) =>
                setFrames((all) => all.map((x) => (x.id === f.id ? { ...x, notes: e.target.value } : x)))
              }
              rows={2}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-zinc-300"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

type Clip = { id: string; name: string; inn: string; out: string; note: string };

export function OfficeCutLab() {
  const [clips, setClips] = usePersisted<Clip[]>("plethora.office.cut", []);
  const [busy, setBusy] = useState(false);

  async function gen(q: string) {
    setBusy(true);
    await usage("office-cut");
    const reply = await ai(
      q,
      "Return a shot list, one per line: NAME | IN | OUT | note. Times like 00:12. Film / ads / game trailer ok."
    );
    const parsed: Clip[] = [];
    for (const line of reply.split("\n")) {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length < 2) continue;
      parsed.push({
        id: crypto.randomUUID(),
        name: parts[0].replace(/^[\d.)\-*]+\s*/, ""),
        inn: parts[1] || "00:00",
        out: parts[2] || "00:05",
        note: parts[3] || "",
      });
    }
    if (parsed.length) setClips(parsed);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Edit desk inspired by Premiere / CapCut — not those apps. Shot list here;{" "}
        <Link href="/tools/video-recorder" className="text-violet-300 hover:underline">
          Capture
        </Link>{" "}
        for record;{" "}
        <Link href="/tools/video-converter" className="text-violet-300 hover:underline">
          converter
        </Link>{" "}
        / ffmpeg for the heavy cut.
      </p>
      <AiBar placeholder="15s product ad… film trailer beats…" onGo={gen} busy={busy} />
      <button
        type="button"
        className="text-xs text-cyan-300"
        onClick={() =>
          setClips((c) => [
            ...c,
            { id: crypto.randomUUID(), name: "Clip", inn: "00:00", out: "00:04", note: "" },
          ])
        }
      >
        + clip row
      </button>
      <ul className="space-y-2">
        {clips.map((c) => (
          <li key={c.id} className="grid gap-2 rounded-xl border border-white/10 p-2 sm:grid-cols-4">
            <input
              value={c.name}
              onChange={(e) =>
                setClips((all) => all.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))
              }
              className="rounded-lg bg-zinc-900 px-2 py-1 text-sm text-white"
            />
            <input
              value={c.inn}
              onChange={(e) =>
                setClips((all) => all.map((x) => (x.id === c.id ? { ...x, inn: e.target.value } : x)))
              }
              className="rounded-lg bg-zinc-900 px-2 py-1 text-sm text-white"
            />
            <input
              value={c.out}
              onChange={(e) =>
                setClips((all) => all.map((x) => (x.id === c.id ? { ...x, out: e.target.value } : x)))
              }
              className="rounded-lg bg-zinc-900 px-2 py-1 text-sm text-white"
            />
            <input
              value={c.note}
              onChange={(e) =>
                setClips((all) => all.map((x) => (x.id === c.id ? { ...x, note: e.target.value } : x)))
              }
              className="rounded-lg bg-zinc-900 px-2 py-1 text-sm text-white"
              placeholder="note"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OfficeConnectLab() {
  const [csv, setCsv] = usePersisted("plethora.office.connect.csv", "name,status\n");
  const [hook, setHook] = usePersisted("plethora.office.connect.hook", "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const post = useCallback(async () => {
    if (!hook.startsWith("https://")) {
      setNote("Paste an https webhook URL you own.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "plethora-office", csv: csv.slice(0, 20_000) }),
      });
      setNote(`Posted: HTTP ${res.status}`);
      await usage("office-connect");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }, [csv, hook]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Integrator — not Excel Online / Zapier. CSV lives here; webhook is a POST you confirm. Sheets:{" "}
        <Link href="/tools/excel-hub" className="text-violet-300 hover:underline">
          Excel hub
        </Link>
        . Agents:{" "}
        <Link href="/mcp" className="text-violet-300 hover:underline">
          MCP
        </Link>
        .
      </p>
      <label className="block text-xs text-zinc-500">
        Webhook URL
        <input
          value={hook}
          onChange={(e) => setHook(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
          placeholder="https://…"
        />
      </label>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={8}
        className="w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-zinc-300"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void post()}
        className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        {busy ? "Sending…" : "POST CSV as JSON"}
      </button>
      {note ? <p className="text-sm text-amber-200">{note}</p> : null}
    </div>
  );
}

export function OfficeNativeApp({ id }: { id: string }) {
  const map: Record<string, { icon: typeof FileText; node: ReactNode }> = {
    word: { icon: FileText, node: <OfficeWordLab /> },
    slack: { icon: MessageSquare, node: <PlethoraSlack /> },
    taskbot: { icon: Bot, node: <PlethoraTaskbot /> },
    boards: { icon: Layout, node: <OfficeBoardsLab /> },
    rooms: { icon: MessageSquare, node: <OfficeRoomsLab /> },
    flow: { icon: Workflow, node: <OfficeFlowLab /> },
    design: { icon: PenLine, node: <OfficeDesignLab /> },
    cut: { icon: Clapperboard, node: <OfficeCutLab /> },
    connect: { icon: Cable, node: <OfficeConnectLab /> },
    infra: { icon: Server, node: <InfraControlDesk /> },
  };
  const hit = map[id];
  if (!hit) {
    return (
      <p className="text-sm text-zinc-400">
        Unknown office app.{" "}
        <Link href="/office" className="text-violet-300">
          Back to Office
        </Link>
      </p>
    );
  }
  const Icon = hit.icon;
  return (
    <div>
      <p className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wide text-cyan-300">
        <Icon className="h-3.5 w-3.5" />
        Plethora Office
      </p>
      {hit.node}
    </div>
  );
}
