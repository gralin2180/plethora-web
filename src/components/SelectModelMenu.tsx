"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  loadConnectedAi,
  setConnectedAccountModel,
  setPreferredAi,
} from "@/lib/connected-ai";
import {
  OPENCODE_ZEN_FREE_MODELS,
  OPENROUTER_FREE_MODELS,
  defaultZenSelection,
  loadSelectedChatModel,
  saveSelectedChatModel,
  selectedModelLabel,
  type FreeModelDef,
  type SelectedChatModel,
} from "@/lib/free-models";

export function SelectModelMenu({
  zenConfigured: _zenConfigured,
  openrouterConfigured,
  connectedLabel,
}: {
  zenConfigured: boolean;
  openrouterConfigured: boolean;
  connectedLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SelectedChatModel>(defaultZenSelection);
  const [zenOnDevice, setZenOnDevice] = useState(false);
  const [orOnDevice, setOrOnDevice] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  function refresh() {
    setSelected(loadSelectedChatModel());
    const store = loadConnectedAi();
    setZenOnDevice(Boolean(store.accounts["opencode-zen"]?.apiKey));
    setOrOnDevice(Boolean(store.accounts["openrouter"]?.apiKey));
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const orReady = orOnDevice || openrouterConfigured;

  const zenList = useMemo(() => filterModels(OPENCODE_ZEN_FREE_MODELS, query), [query]);
  const orList = useMemo(() => filterModels(OPENROUTER_FREE_MODELS, query), [query]);

  function pick(next: SelectedChatModel) {
    saveSelectedChatModel(next);
    if (next.kind === "zen") {
      setConnectedAccountModel("opencode-zen", next.id);
      if (zenOnDevice) setPreferredAi("opencode-zen");
    }
    if (next.kind === "openrouter") {
      setConnectedAccountModel("openrouter", next.id);
      if (orOnDevice) setPreferredAi("openrouter");
    }
    setSelected(next);
    setOpen(false);
    setQuery("");
  }

  const label = selectedModelLabel(selected, connectedLabel);
  const isFree = selected.kind === "zen" || selected.kind === "openrouter";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-left text-[12px] text-zinc-200 hover:bg-white/[0.07]"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">{label}</span>
        {isFree && <FreeBadge />}
        <ChevronDown className="h-3 w-3 shrink-0 text-zinc-500" />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-xl border border-white/10 bg-[#16161c] shadow-2xl shadow-black/50">
          <div className="border-b border-white/10 px-3 py-2.5">
            <p className="text-sm font-semibold text-white">Select model</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Free models from OpenCode Zen — no sign-in
            </p>
            <label className="mt-2 flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-2 py-1">
              <Search className="h-3 w-3 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 focus:outline-none"
              />
            </label>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => pick({ kind: "connected" })}
              className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm ${
                selected.kind === "connected" ? "bg-white/[0.08]" : "hover:bg-white/[0.06]"
              }`}
            >
              <span className="text-zinc-200">{connectedLabel || "Connected AI"}</span>
            </button>

            <ModelGroup
              title="Free models provided by OpenCode"
              models={zenList}
              selectedId={selected.kind === "zen" ? selected.id : null}
              available
              onPick={(m) => pick({ kind: "zen", id: m.id, label: m.name })}
            />

            {orReady && (
              <ModelGroup
                title="OpenRouter free"
                models={orList}
                selectedId={selected.kind === "openrouter" ? selected.id : null}
                available
                onPick={(m) => pick({ kind: "openrouter", id: m.id, label: m.name })}
              />
            )}
          </div>

          <p className="border-t border-white/10 px-3 py-2 text-[10px] leading-snug text-zinc-600">
            Public trial models (NVIDIA / OpenCode / OpenRouter :free) stay free. We don’t sell
            that pool. Some trials may train on chats — don’t send secrets.
          </p>
        </div>
      )}
    </div>
  );
}

function ModelGroup({
  title,
  models,
  selectedId,
  available,
  onPick,
}: {
  title: string;
  models: FreeModelDef[];
  selectedId: string | null;
  available: boolean;
  onPick: (m: FreeModelDef) => void;
}) {
  if (!models.length) return null;
  return (
    <div className="mt-1">
      <p className="px-3 pb-0.5 pt-1 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
        {title}
      </p>
      <ul>
        {models.map((m) => {
          const active = selectedId === m.id;
          return (
            <li key={m.id}>
              <button
                type="button"
                disabled={!available}
                onClick={() => onPick(m)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left disabled:opacity-40 ${
                  active ? "bg-white/[0.08]" : "hover:bg-white/[0.06]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-white">{m.name}</span>
                  {m.note && (
                    <span className="block truncate text-[10px] text-zinc-600">{m.note}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {m.context && (
                    <span className="text-[10px] tabular-nums text-zinc-500">{m.context}</span>
                  )}
                  <FreeBadge />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FreeBadge() {
  return (
    <span className="shrink-0 rounded border border-zinc-600/80 bg-zinc-800/80 px-1.5 py-px text-[10px] font-medium text-zinc-400">
      Free
    </span>
  );
}

function filterModels(list: FreeModelDef[], query: string): FreeModelDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
  );
}
