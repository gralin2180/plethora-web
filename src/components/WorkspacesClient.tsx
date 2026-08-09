"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Trash2,
  MonitorSmartphone,
  StickyNote,
  Loader2,
} from "lucide-react";
import { getOrCreateDeviceKey, guessDeviceLabel } from "@/lib/device";

type Workspace = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  updated_at: string;
};

type Device = {
  id: string;
  label: string | null;
  last_seen_at: string;
  device_key: string;
};

type Item = {
  id: string;
  title: string | null;
  body: string | null;
  kind: string;
  tool_slug: string | null;
};

export function WorkspacesClient() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [limit, setLimit] = useState(2);
  const [plan, setPlan] = useState("free");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceLimit, setDeviceLimit] = useState(3);
  const [note, setNote] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [thisKey, setThisKey] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, dRes] = await Promise.all([
        fetch("/api/workspaces"),
        fetch("/api/devices"),
      ]);
      const w = await wRes.json();
      const d = await dRes.json();

      if (w.code === "schema" || d.code === "schema") {
        setError(
          "Run supabase/workspaces_devices.sql in the Supabase SQL Editor, then refresh."
        );
      } else if (!wRes.ok && w.error) {
        setError(w.error);
      }

      setWorkspaces(w.workspaces || []);
      setLimit(w.limit ?? 2);
      setPlan(w.plan || "free");
      if ((w.workspaces || []).length && !selectedId) {
        setSelectedId(w.workspaces[0].id);
      }
      setDevices(d.devices || []);
      setDeviceLimit(d.limit ?? 3);

      // register heartbeat
      await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceKey: getOrCreateDeviceKey(),
          label: guessDeviceLabel(),
        }),
      });
      setThisKey(getOrCreateDeviceKey());
    } catch {
      setError("Could not load account data.");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    void (async () => {
      const res = await fetch(
        `/api/workspaces/items?workspaceId=${encodeURIComponent(selectedId)}`
      );
      const data = await res.json();
      setItems(data.items || []);
    })();
  }, [selectedId]);

  async function createWorkspace() {
    const name = newName.trim() || "New workspace";
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create workspace");
      return;
    }
    setNewName("");
    setWorkspaces((prev) => [data.workspace, ...prev]);
    setSelectedId(data.workspace.id);
  }

  async function deleteWorkspace(id: string) {
    const res = await fetch(`/api/workspaces?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Cannot delete (default workspace stays)");
      return;
    }
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function addNote() {
    if (!selectedId || !note.trim()) return;
    const res = await fetch("/api/workspaces/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: selectedId,
        kind: "note",
        title: "Note",
        body: note.trim(),
      }),
    });
    const data = await res.json();
    if (res.ok && data.item) {
      setItems((prev) => [...prev, data.item]);
      setNote("");
    }
  }

  async function removeDevice(id: string) {
    await fetch(`/api/devices?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading account…
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <FolderKanban className="h-4 w-4 text-violet-400" />
              Workspaces
            </h2>
            <span className="text-[11px] text-zinc-500">
              {workspaces.length}/{limit} · {plan}
            </span>
          </div>
          <ul className="space-y-1">
            {workspaces.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(w.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedId === w.id
                      ? "bg-violet-600/30 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="truncate">
                    {w.name}
                    {w.is_default ? " ★" : ""}
                  </span>
                  {!w.is_default && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteWorkspace(w.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          void deleteWorkspace(w.id);
                        }
                      }}
                      className="text-zinc-600 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New name"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => void createWorkspace()}
              className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          {selectedId ? (
            <>
              <h3 className="font-semibold text-white">
                {workspaces.find((w) => w.id === selectedId)?.name || "Workspace"}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Pins, notes, and later graph drafts — tied to your account.
              </p>
              <div className="mt-4 flex gap-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Add a note…"
                  className="min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => void addNote()}
                  className="self-end rounded-xl bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
                >
                  Save
                </button>
              </div>
              <ul className="mt-6 space-y-2">
                {items.length === 0 && (
                  <li className="text-sm text-zinc-600">No items yet.</li>
                )}
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="flex gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-sm text-zinc-300"
                  >
                    <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    <span className="whitespace-pre-wrap">{it.body || it.title}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Create or select a workspace.</p>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <MonitorSmartphone className="h-4 w-4 text-cyan-400" />
            Devices on this account
          </h2>
          <span className="text-[11px] text-zinc-500">
            {devices.length}/{deviceLimit} seats · free ≈ 3, more on paid
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Soft seat limit for signed-in browsers. Remove idle devices to free a seat.
        </p>
        <ul className="mt-4 divide-y divide-white/5">
          {devices.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <p className="text-zinc-200">
                  {d.label || "Browser"}
                  {d.device_key === thisKey && (
                    <span className="ml-2 text-[11px] text-emerald-400">this device</span>
                  )}
                </p>
                <p className="text-xs text-zinc-600">
                  Last seen {new Date(d.last_seen_at).toLocaleString()}
                </p>
              </div>
              {d.device_key !== thisKey && (
                <button
                  type="button"
                  onClick={() => void removeDevice(d.id)}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
          {devices.length === 0 && (
            <li className="py-3 text-sm text-zinc-600">No devices registered yet.</li>
          )}
        </ul>
        <p className="mt-4 text-xs text-zinc-600">
          Need more seats?{" "}
          <Link href="/pricing" className="text-violet-400 hover:underline">
            Upgrade plan
          </Link>
        </p>
      </section>
    </div>
  );
}
