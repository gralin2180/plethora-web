"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import {
  OPENCODE_ZEN_FREE_MODELS,
  OPENROUTER_FREE_MODELS,
  type FreeModelDef,
} from "@/lib/free-models";
import { filterEnabledModels, isModelEnabled, setModelEnabled } from "@/lib/model-prefs";

type Props = {
  open: boolean;
  onClose: () => void;
  onConnectProvider: () => void;
  openrouterConfigured: boolean;
};

export function ManageModelsModal({
  open,
  onClose,
  onConnectProvider,
  openrouterConfigured,
}: Props) {
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onUp = () => setTick((n) => n + 1);
    window.addEventListener("plethora:models-updated", onUp);
    return () => window.removeEventListener("plethora:models-updated", onUp);
  }, [open]);

  const zen = useMemo(() => {
    void tick;
    return filterModels(OPENCODE_ZEN_FREE_MODELS, query);
  }, [query, tick]);

  const orList = useMemo(() => {
    void tick;
    return filterModels(OPENROUTER_FREE_MODELS, query);
  }, [query, tick]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div
        className="flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#161616] shadow-2xl"
        role="dialog"
        aria-labelledby="manage-models-title"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 id="manage-models-title" className="text-sm font-semibold text-white">
            Manage models
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onConnectProvider}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-white/5"
            >
              <Plus className="h-3.5 w-3.5" />
              Connect provider
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="px-4 pt-2 text-[11px] text-zinc-500">
          Customize which models appear in the model selector.
        </p>

        <label className="mx-4 mt-2 flex items-center gap-2 rounded-lg border border-sky-500/50 bg-black/40 px-3 py-2">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search models"
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
          />
        </label>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          <ToggleGroup title="OpenCode Zen" models={zen} source="zen" onToggle={() => setTick((n) => n + 1)} />
          {(openrouterConfigured || orList.length) && (
            <ToggleGroup
              title="OpenRouter free"
              models={orList}
              source="openrouter"
              onToggle={() => setTick((n) => n + 1)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleGroup({
  title,
  models,
  source,
  onToggle,
}: {
  title: string;
  models: FreeModelDef[];
  source: "zen" | "openrouter";
  onToggle: () => void;
}) {
  if (!models.length) return null;
  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-black/30">
      <p className="border-b border-white/5 px-3 py-2 text-[11px] font-medium text-zinc-500">{title}</p>
      <ul>
        {models.map((m) => {
          const on = isModelEnabled(source, m.id);
          return (
            <li key={m.id} className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2.5 last:border-0">
              <span className="min-w-0 text-sm text-white">{m.name}</span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => {
                  setModelEnabled(source, m.id, !on);
                  onToggle();
                }}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-sky-500" : "bg-zinc-700"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ManageModelsLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 border-t border-white/10 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/[0.06]"
    >
      <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
      Manage models
    </button>
  );
}

function filterModels(list: FreeModelDef[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
}
