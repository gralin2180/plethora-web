"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, UserRound } from "lucide-react";
import { assessContentSafety } from "@/lib/content-safety";
import {
  deleteSpicyAvatar,
  loadActiveAvatarId,
  loadSpicyAvatars,
  setActiveAvatarId,
  shrinkPhoto,
  upsertSpicyAvatar,
  VOICE_LABELS,
  type SpicyAvatar,
  type SpicyVoice,
} from "@/lib/spicy-avatars";

export function SpicyAvatarStudio({
  onSelect,
}: {
  onSelect: (a: SpicyAvatar | null) => void;
}) {
  const [list, setList] = useState<SpicyAvatar[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [look, setLook] = useState("");
  const [traits, setTraits] = useState("");
  const [voice, setVoice] = useState<SpicyVoice>("warm-f");
  const [photo, setPhoto] = useState<string | undefined>();
  const [err, setErr] = useState<string | null>(null);

  function refresh() {
    const next = loadSpicyAvatars();
    setList(next);
    const id = loadActiveAvatarId();
    setActive(id);
    const found = next.find((x) => x.id === id) || null;
    onSelect(found);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      setPhoto(await shrinkPhoto(file));
    } catch {
      setErr("Couldn’t use that image.");
    }
  }

  function create() {
    const blob = `${name} ${look} ${traits}`;
    const safety = assessContentSafety(blob);
    if (safety.hardBlock) {
      setErr(safety.message);
      return;
    }
    if (!name.trim() || !traits.trim()) {
      setErr("Name and traits are required.");
      return;
    }
    const a: SpicyAvatar = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim().slice(0, 48),
      look: look.trim().slice(0, 280),
      traits: traits.trim().slice(0, 600),
      voice,
      photo,
      createdAt: new Date().toISOString(),
    };
    upsertSpicyAvatar(a);
    setActiveAvatarId(a.id);
    setName("");
    setLook("");
    setTraits("");
    setPhoto(undefined);
    setErr(null);
    refresh();
  }

  return (
    <div className="rounded-2xl border border-rose-500/20 bg-black/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">Avatars</p>
      <p className="mt-1 text-xs text-zinc-500">
        Saved on this device. Pick one, then chat — Speak reads the last reply in their voice.
      </p>

      <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
        {list.length === 0 ? (
          <p className="text-xs text-zinc-600">None yet.</p>
        ) : (
          list.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${
                active === a.id
                  ? "border-rose-500/50 bg-rose-500/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => {
                  setActiveAvatarId(a.id);
                  setActive(a.id);
                  onSelect(a);
                }}
              >
                {a.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.photo} alt="" className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <UserRound className="h-8 w-8 rounded-lg border border-white/10 p-1.5 text-zinc-500" />
                )}
                <span className="truncate text-sm text-white">{a.name}</span>
              </button>
              <button
                type="button"
                className="text-zinc-500 hover:text-rose-300"
                aria-label={`Delete ${a.name}`}
                onClick={() => {
                  deleteSpicyAvatar(a.id);
                  refresh();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-xs font-medium text-zinc-400">New avatar</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
      />
      <input
        value={look}
        onChange={(e) => setLook(e.target.value)}
        placeholder="Look (adults only)"
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
      />
      <textarea
        value={traits}
        onChange={(e) => setTraits(e.target.value)}
        placeholder="Traits — how they talk, what they like"
        rows={3}
        className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
      />
      <select
        value={voice}
        onChange={(e) => setVoice(e.target.value as SpicyVoice)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      >
        {(Object.keys(VOICE_LABELS) as SpicyVoice[]).map((k) => (
          <option key={k} value={k}>
            {VOICE_LABELS[k]}
          </option>
        ))}
      </select>
      <label className="mt-2 block text-xs text-zinc-500">
        Optional photo
        <input
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-xs text-zinc-400"
          onChange={(e) => void onPhoto(e.target.files?.[0])}
        />
      </label>
      {err ? <p className="mt-2 text-xs text-rose-300">{err}</p> : null}
      <button
        type="button"
        onClick={create}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2 text-sm font-medium text-white hover:bg-rose-500"
      >
        <Plus className="h-4 w-4" />
        Save avatar
      </button>
    </div>
  );
}
