"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Plus, UserRound } from "lucide-react";
import { assessContentSafety } from "@/lib/content-safety";
import {
  deleteSpicyAvatar,
  loadActiveAvatarId,
  loadSpicyAvatars,
  setActiveAvatarId,
  shrinkPhoto,
  speakAsAvatar,
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
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [look, setLook] = useState("");
  const [traits, setTraits] = useState("");
  const [voice, setVoice] = useState<SpicyVoice>("warm-f");
  const [photo, setPhoto] = useState<string | undefined>();
  const [err, setErr] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function refresh(keepForm = false) {
    const next = loadSpicyAvatars();
    setList(next);
    const id = loadActiveAvatarId();
    setActive(id);
    const found = next.find((x) => x.id === id) || null;
    onSelect(found);
    if (!keepForm) setMenuId(null);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuId(null);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      setPhoto(await shrinkPhoto(file));
    } catch {
      setErr("Couldn’t use that image.");
    }
  }

  function fillForm(a: SpicyAvatar) {
    setEditingId(a.id);
    setName(a.name);
    setLook(a.look);
    setTraits(a.traits);
    setVoice(a.voice);
    setPhoto(a.photo);
    setErr(null);
    setMenuId(null);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setLook("");
    setTraits("");
    setVoice("warm-f");
    setPhoto(undefined);
    setErr(null);
  }

  function save() {
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
      id: editingId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim().slice(0, 48),
      look: look.trim().slice(0, 280),
      traits: traits.trim().slice(0, 600),
      voice,
      photo,
      createdAt: list.find((x) => x.id === editingId)?.createdAt || new Date().toISOString(),
    };
    upsertSpicyAvatar(a);
    setActiveAvatarId(a.id);
    resetForm();
    refresh();
  }

  function duplicate(a: SpicyAvatar) {
    const copy: SpicyAvatar = {
      ...a,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `${a.name} copy`.slice(0, 48),
      createdAt: new Date().toISOString(),
    };
    upsertSpicyAvatar(copy);
    setActiveAvatarId(copy.id);
    setMenuId(null);
    refresh();
  }

  return (
    <div className="rounded-2xl border border-rose-500/20 bg-black/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">Avatars</p>
      <p className="mt-1 text-xs text-zinc-500">
        Saved on this device. Pick one to chat. ⋮ for edit, photo, speak, or delete.
      </p>

      <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
        {list.length === 0 ? (
          <p className="text-xs text-zinc-600">None yet.</p>
        ) : (
          list.map((a) => (
            <div
              key={a.id}
              className={`relative flex items-center gap-2 rounded-xl border px-2 py-1.5 ${
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
                  <img src={a.photo} alt="" className="h-9 w-9 rounded-lg object-cover" />
                ) : (
                  <UserRound className="h-9 w-9 rounded-lg border border-white/10 p-1.5 text-zinc-500" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm text-white">{a.name}</span>
                  <span className="block truncate text-[10px] text-zinc-500">
                    {VOICE_LABELS[a.voice]}
                  </span>
                </span>
              </button>
              <div className="relative" ref={menuId === a.id ? menuRef : undefined}>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  aria-label={`Options for ${a.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuId(menuId === a.id ? null : a.id);
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuId === a.id ? (
                  <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#16161f] py-1 shadow-xl">
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-white/10"
                      onClick={() => fillForm(a)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-white/10"
                      onClick={() => {
                        speakAsAvatar(`Hey, I’m ${a.name}.`, a.voice);
                        setMenuId(null);
                      }}
                    >
                      Speak
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-white/10"
                      onClick={() => duplicate(a)}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left text-sm text-rose-300 hover:bg-white/10"
                      onClick={() => {
                        deleteSpicyAvatar(a.id);
                        if (editingId === a.id) resetForm();
                        refresh();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-xs font-medium text-zinc-400">
        {editingId ? "Edit avatar" : "New avatar"}
      </p>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="mt-2 h-20 w-20 rounded-xl object-cover" />
      ) : null}
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
        Photo
        <input
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-xs text-zinc-400"
          onChange={(e) => void onPhoto(e.target.files?.[0])}
        />
      </label>
      {err ? <p className="mt-2 text-xs text-rose-300">{err}</p> : null}
      <div className="mt-3 flex gap-2">
        {editingId ? (
          <button
            type="button"
            onClick={resetForm}
            className="flex-1 rounded-xl border border-white/15 py-2 text-sm text-zinc-300"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          onClick={save}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2 text-sm font-medium text-white hover:bg-rose-500"
        >
          <Plus className="h-4 w-4" />
          {editingId ? "Save changes" : "Save avatar"}
        </button>
      </div>
    </div>
  );
}
