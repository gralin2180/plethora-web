"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Download, GitBranch, Plus, Smartphone, Trash2 } from "lucide-react";
import { listMiniApps } from "@/lib/mini-apps";

export type FlowNode = {
  id: string;
  title: string;
  kind: "input" | "transform" | "decision" | "output" | "action";
  note: string;
};

const PRESETS: Record<string, FlowNode[]> = {
  "message-automation": [
    { id: "n1", title: "Trigger", kind: "input", note: "New lead / schedule / webhook" },
    { id: "n2", title: "Message A", kind: "action", note: "First touch copy" },
    { id: "n3", title: "Wait / branch", kind: "decision", note: "Replied? open?" },
    { id: "n4", title: "Follow-up", kind: "action", note: "If no reply" },
    { id: "n5", title: "Done / handoff", kind: "output", note: "CRM note" },
  ],
  "image-to-video": [
    { id: "n1", title: "Stills", kind: "input", note: "1–N reference images" },
    { id: "n2", title: "Motion brief", kind: "transform", note: "Camera + pace" },
    { id: "n3", title: "Timeline", kind: "transform", note: "Beats / duration" },
    { id: "n4", title: "Render path", kind: "output", note: "FFmpeg or generator" },
  ],
  "build-your-tool": [
    { id: "n1", title: "Brief", kind: "input", note: "What the app should do" },
    { id: "n2", title: "Rules", kind: "transform", note: "Custom prompt + chips" },
    { id: "n3", title: "Generate", kind: "decision", note: "Free pool / Connect / BYOK" },
    { id: "n4", title: "Preview + modify", kind: "output", note: "Chatbox for edits" },
  ],
  "video-converter": [
    { id: "n1", title: "Source file", kind: "input", note: "Upload or path" },
    { id: "n2", title: "Codec / size", kind: "transform", note: "Target format" },
    { id: "n3", title: "Command", kind: "output", note: "FFmpeg string" },
  ],
  "life-planner": [
    { id: "n1", title: "Goals", kind: "input", note: "What matters this quarter" },
    { id: "n2", title: "Blocks", kind: "transform", note: "Time buckets" },
    { id: "n3", title: "Tradeoffs", kind: "decision", note: "Drop / keep" },
    { id: "n4", title: "Weekly plan", kind: "output", note: "Checklist" },
  ],
  "local-ai-hardware": [
    { id: "n1", title: "Hardware", kind: "input", note: "VRAM · RAM · OS" },
    { id: "n2", title: "Workload", kind: "transform", note: "Chat / image / code" },
    { id: "n3", title: "Stack pick", kind: "decision", note: "Ollama / …" },
    { id: "n4", title: "Install path", kind: "output", note: "Install Hub steps" },
  ],
  "excel-hub": [
    { id: "n1", title: "Sheet / CSV", kind: "input", note: "Paste or file" },
    { id: "n2", title: "Clean", kind: "transform", note: "Headers · types" },
    { id: "n3", title: "Formula / pivot idea", kind: "transform", note: "What to compute" },
    { id: "n4", title: "Export", kind: "output", note: "CSV · steps" },
  ],
};

const kindTone: Record<FlowNode["kind"], string> = {
  input: "border-cyan-400/50 bg-cyan-500/10",
  transform: "border-violet-400/50 bg-violet-500/10",
  decision: "border-amber-400/50 bg-amber-500/10",
  action: "border-fuchsia-400/50 bg-fuchsia-500/10",
  output: "border-emerald-400/50 bg-emerald-500/10",
};

function exportScript(nodes: FlowNode[], toolName: string): string {
  const lines = [`# ${toolName} — workflow plan`, "", "This is a checklist, not an installable app.", ""];
  nodes.forEach((n, i) => {
    lines.push(`${i + 1}. [${n.kind.toUpperCase()}] ${n.title}`);
    if (n.note) lines.push(`   ${n.note}`);
  });
  return lines.join("\n");
}

function Connector({ vertical }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <svg className="mx-auto h-8 w-6 text-violet-400 md:hidden" viewBox="0 0 24 32" aria-hidden>
        <path
          d="M12 2 C12 10, 12 14, 12 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="2" r="3" fill="#22d3ee" />
        <polygon points="12,30 8,22 16,22" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      className="hidden h-[7.5rem] w-14 shrink-0 md:block"
      viewBox="0 0 56 120"
      aria-hidden
    >
      <path
        d="M 4 60 C 22 28, 34 92, 52 60"
        fill="none"
        stroke="#a78bfa"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <circle cx="4" cy="60" r="4" fill="#22d3ee" />
      <circle cx="52" cy="60" r="4" fill="#a78bfa" />
      <polygon points="52,60 44,55 44,65" fill="#a78bfa" />
    </svg>
  );
}

export function NodeWorkflowCanvas({
  slug,
  toolName,
}: {
  slug: string;
  toolName: string;
}) {
  const initial = useMemo(() => PRESETS[slug] ?? PRESETS["build-your-tool"], [slug]);
  const [nodes, setNodes] = useState<FlowNode[]>(initial);
  const [selected, setSelected] = useState<string | null>(initial[0]?.id ?? null);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selected) ?? null;
  const plan = exportScript(nodes, toolName);
  const isMaker = slug === "build-your-tool";

  const updateSelected = useCallback(
    (patch: Partial<FlowNode>) => {
      if (!selected) return;
      setNodes((prev) => prev.map((n) => (n.id === selected ? { ...n, ...patch } : n)));
    },
    [selected]
  );

  function addNode() {
    const id = `n_${Date.now()}`;
    setNodes((prev) => [...prev, { id, title: "New step", kind: "transform", note: "Describe this step" }]);
    setSelected(id);
  }

  function removeSelected() {
    if (!selected || nodes.length <= 1) return;
    setNodes((prev) => prev.filter((n) => n.id !== selected));
    setSelected(null);
  }

  function copyPlan() {
    void navigator.clipboard?.writeText(plan);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadPlan() {
    const blob = new Blob([plan], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}-plan.md`;
    a.click();
  }

  function downloadLatestHtml() {
    const app = listMiniApps()[0];
    if (!app) return;
    const blob = new Blob([app.html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${app.slug}.html`;
    a.click();
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#070712]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-cyan-300" />
          <div>
            <p className="text-sm font-semibold text-white">How this tool flows</p>
            <p className="text-xs text-zinc-500">
              Cards on a canvas, wired port-to-port. Edit a step, then share the plan.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addNode}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
          <button
            type="button"
            onClick={removeSelected}
            disabled={!selected || nodes.length <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
          <button
            type="button"
            onClick={() => setExportOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
          >
            <Download className="h-3.5 w-3.5" />
            Share / install
          </button>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_240px]">
        <div className="min-h-[260px] overflow-x-auto border-b border-white/5 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:22px_22px] p-5 lg:border-b-0 lg:border-r">
          <ul className="flex min-w-max flex-col items-stretch md:flex-row md:items-center">
            {nodes.map((node, i) => (
              <li key={node.id} className="flex flex-col items-center md:flex-row md:items-center">
                <button
                  type="button"
                  onClick={() => setSelected(node.id)}
                  className={`relative w-full min-w-[168px] rounded-2xl border px-3 py-3 text-left shadow-[0_12px_40px_-18px_rgba(0,0,0,0.9)] transition md:w-44 ${
                    kindTone[node.kind]
                  } ${selected === node.id ? "ring-2 ring-cyan-300/80" : "hover:brightness-110"}`}
                >
                  <span className="pointer-events-none absolute left-[-5px] top-1/2 hidden h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] md:block" />
                  <span className="pointer-events-none absolute right-[-5px] top-1/2 hidden h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_10px_#a78bfa] md:block" />
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-[10px] text-white">
                    {i + 1}
                  </span>
                  <span className="ml-1.5 text-[10px] uppercase tracking-wide text-zinc-400">
                    {node.kind}
                  </span>
                  <span className="mt-1 block text-sm font-medium text-white">{node.title}</span>
                  <span className="mt-1 line-clamp-2 text-[11px] text-zinc-500">{node.note}</span>
                </button>
                {i < nodes.length - 1 && (
                  <>
                    <Connector vertical />
                    <Connector />
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Inspector</p>
          {selectedNode ? (
            <>
              <label className="block text-xs text-zinc-400">
                Title
                <input
                  value={selectedNode.title}
                  onChange={(e) => updateSelected({ title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Kind
                <select
                  value={selectedNode.kind}
                  onChange={(e) => updateSelected({ kind: e.target.value as FlowNode["kind"] })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm text-white outline-none"
                >
                  <option value="input">input</option>
                  <option value="transform">transform</option>
                  <option value="decision">decision</option>
                  <option value="action">action</option>
                  <option value="output">output</option>
                </select>
              </label>
              <label className="block text-xs text-zinc-400">
                Note
                <textarea
                  value={selectedNode.note}
                  onChange={(e) => updateSelected({ note: e.target.value })}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </label>
            </>
          ) : (
            <p className="text-xs text-zinc-500">Select a node to edit.</p>
          )}
        </div>
      </div>

      {exportOpen && (
        <div className="space-y-3 border-t border-white/10 px-5 py-4">
          <p className="text-sm font-medium text-white">Share / install</p>
          <p className="text-xs leading-relaxed text-zinc-400">
            <strong className="text-zinc-200">Export plan</strong> was a markdown checklist of these
            nodes — useful for docs, not a compiled program. We cannot push a listing to the App
            Store, Play Store, or a Windows installer from this graph.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyPlan}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5"
            >
              {copied ? "Copied plan" : "Copy checklist"}
            </button>
            <button
              type="button"
              onClick={downloadPlan}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5"
            >
              Download .md
            </button>
            {isMaker ? (
              <>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-500"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Open generated app
                </Link>
                <button
                  type="button"
                  onClick={downloadLatestHtml}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5"
                >
                  Download .html
                </button>
              </>
            ) : (
              <Link href="/tools/build-your-tool" className="text-xs text-violet-300 hover:underline">
                Need a real app? Use AI App Maker
              </Link>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Phone / desktop “app”: open the generated page → browser menu →{" "}
            <strong className="text-zinc-300">Add to Home Screen / Install</strong> (PWA). That is
            the honest path. Native store builds need Xcode / Play Console separately.
          </p>
        </div>
      )}
    </section>
  );
}
