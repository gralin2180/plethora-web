"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AtSign,
  CheckCircle2,
  Circle,
  Image,
  Loader2,
  NotebookPen,
  Sparkles,
  Trash2,
} from "lucide-react";
import { OfficeAiBillingStrip } from "@/components/OfficeAiBillingStrip";
import { OFFICE_APP_NAMES } from "@/lib/office-app-names";
import {
  itemsForTab,
  loadTaskbot,
  removeItem,
  saveTaskbot,
  scanSlackWithAi,
  toggleItemDone,
  type TaskbotItem,
  type TaskbotState,
} from "@/lib/taskbot";
import { loadSlackProfile, loadSlackWorkspace } from "@/lib/plethora-slack";
import { trackToolUse } from "@/lib/self-learn";

const relay = OFFICE_APP_NAMES.relay;
const scout = OFFICE_APP_NAMES.scout;

type Tab = "all" | "tasks" | "notes" | "screenshots" | "mentions";

const TABS: { id: Tab; label: string; icon: typeof Circle }[] = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "tasks", label: "Tasks", icon: CheckCircle2 },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "screenshots", label: "Screenshots", icon: Image },
  { id: "mentions", label: "@ For you", icon: AtSign },
];

function ItemCard({
  item,
  onToggle,
  onRemove,
}: {
  item: TaskbotItem;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      className={`rounded-xl border p-3 ${
        item.status === "done"
          ? "border-white/5 bg-black/20 opacity-60"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start gap-2">
        <button type="button" onClick={onToggle} className="mt-0.5 shrink-0 text-zinc-400 hover:text-emerald-300">
          {item.status === "done" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-violet-600/30 px-2 py-0.5 text-[10px] uppercase text-violet-200">
              {item.type}
            </span>
            {item.priority === "high" ? (
              <span className="text-[10px] text-rose-300">high</span>
            ) : null}
            {item.aiGenerated ? (
              <span className="text-[10px] text-cyan-400">AI</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-zinc-200">{item.text}</p>
          {item.imageDataUrl ? (
            <img
              src={item.imageDataUrl}
              alt=""
              className="mt-2 max-h-40 rounded-lg border border-white/10"
            />
          ) : null}
          <p className="mt-2 text-[10px] text-zinc-500">
            #{item.source.channelName} · {item.source.authorName}
            {item.assignee ? ` · @${item.assignee}` : ""}
            {item.due ? ` · due ${item.due}` : ""}
          </p>
          {item.tags?.length ? (
            <p className="mt-1 text-[10px] text-zinc-600">{item.tags.map((t) => `#${t}`).join(" ")}</p>
          ) : null}
        </div>
        <button type="button" onClick={onRemove} className="text-zinc-600 hover:text-rose-400">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

export function PlethoraTaskbot() {
  const [state, setState] = useState<TaskbotState | null>(null);
  const [tab, setTab] = useState<Tab>("mentions");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [profile, setProfile] = useState({ userId: "me", handle: "you", displayName: "You" });

  const refresh = useCallback(() => setState(loadTaskbot()), []);

  useEffect(() => {
    setProfile(loadSlackProfile());
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("plethora:taskbot-updated", onUpdate);
    window.addEventListener("plethora:slack-updated", onUpdate);
    return () => {
      window.removeEventListener("plethora:taskbot-updated", onUpdate);
      window.removeEventListener("plethora:slack-updated", onUpdate);
    };
  }, [refresh]);

  const items = state ? itemsForTab(state, tab) : [];

  async function scanAll() {
    setBusy(true);
    const ws = loadSlackWorkspace();
    const { state: next, note: n } = await scanSlackWithAi(ws, { limit: 80 });
    setState(next);
    setNote(n);
    setBusy(false);
    void trackToolUse("office-taskbot", 3);
  }

  function setAutoScan(v: boolean) {
    if (!state) return;
    const next = { ...state, autoScan: v };
    setState(next);
    saveTaskbot(next);
  }

  if (!state) {
    return <p className="text-sm text-zinc-500">Loading {scout.name}…</p>;
  }

  return (
    <div className="space-y-4">
      <OfficeAiBillingStrip appName={scout.name} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-zinc-500">
            Watches{" "}
            <Link href={relay.webHref} className="text-violet-300 hover:underline">
              {relay.name}
            </Link>{" "}
            — tasks, notes, screenshots, and{" "}
            <span className="text-amber-200">@{profile.handle}</span> mentions.
          </p>
          {state.lastScanAt ? (
            <p className="mt-1 text-[10px] text-zinc-600">
              Last AI scan: {new Date(state.lastScanAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={state.autoScan}
              onChange={(e) => setAutoScan(e.target.checked)}
            />
            Auto-scan new messages
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void scanAll()}
            className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Scan {relay.name} now
          </button>
        </div>
      </div>

      {note ? (
        <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          {note}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
              tab === id
                ? id === "mentions"
                  ? "bg-amber-600 text-white"
                  : "bg-violet-600 text-white"
                : "border border-white/15 text-zinc-400 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {id === "mentions" ? (
              <span className="ml-1 rounded-full bg-black/30 px-1.5 text-[10px]">
                @{profile.handle}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "mentions" ? (
        <p className="text-xs text-zinc-500">
          Everything where someone @mentioned{" "}
          <strong className="text-amber-200">@{profile.handle}</strong> in {relay.name}.
        </p>
      ) : null}

      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-zinc-500">
            {tab === "mentions"
              ? `No @${profile.handle} mentions yet — post in ${relay.name} with @${profile.handle}.`
              : `Nothing captured yet. Chat in ${relay.name} or run Scan.`}
          </li>
        ) : (
          items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onToggle={() => {
                const next = toggleItemDone(state, item.id);
                setState(next);
                saveTaskbot(next);
              }}
              onRemove={() => {
                const next = removeItem(state, item.id);
                setState(next);
                saveTaskbot(next);
              }}
            />
          ))
        )}
      </ul>

      <p className="text-[10px] text-zinc-600">
        Desktop {scout.name} app:{" "}
        <Link href="/office" className="text-cyan-400 hover:underline">
          Windows download
        </Link>
        . Mac later.
      </p>
    </div>
  );
}
