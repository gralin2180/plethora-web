"use client";

import { useCallback, useMemo, useState } from "react";
import { GitBranch, Plus, Trash2, Play } from "lucide-react";

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
    { id: "n1", title: "Input type", kind: "input", note: "Text / file / URL" },
    { id: "n2", title: "Parse", kind: "transform", note: "Normalize data" },
    { id: "n3", title: "Logic", kind: "decision", note: "Rules or AI step" },
    { id: "n4", title: "Output", kind: "output", note: "Copy / download" },
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
  input: "border-cyan-500/40 bg-cyan-500/10",
  transform: "border-violet-500/40 bg-violet-500/10",
  decision: "border-amber-500/40 bg-amber-500/10",
  action: "border-fuchsia-500/40 bg-fuchsia-500/10",
  output: "border-emerald-500/40 bg-emerald-500/10",
};

function exportScript(nodes: FlowNode[], toolName: string): string {
  const lines = [
    `# ${toolName} node pipeline`,
    `# Generated in Plethora — edit freely`,
    "",
  ];
  nodes.forEach((n, i) => {
    lines.push(`${i + 1}. [${n.kind.toUpperCase()}] ${n.title}`);
    if (n.note) lines.push(`   ${n.note}`);
  });
  return lines.join("\n");
}

export function NodeWorkflowCanvas({
  slug,
  toolName,
}: {
  slug: string;
  toolName: string;
}) {
  const initial = useMemo(
    () => PRESETS[slug] ?? PRESETS["build-your-tool"],
    [slug]
  );
  const [nodes, setNodes] = useState<FlowNode[]>(initial);
  const [selected, setSelected] = useState<string | null>(initial[0]?.id ?? null);
  const [exportText, setExportText] = useState("");

  const selectedNode = nodes.find((n) => n.id === selected) ?? null;

  const updateSelected = useCallback(
    (patch: Partial<FlowNode>) => {
      if (!selected) return;
      setNodes((prev) =>
        prev.map((n) => (n.id === selected ? { ...n, ...patch } : n))
      );
    },
    [selected]
  );

  function addNode() {
    const id = `n_${Date.now()}`;
    setNodes((prev) => [
      ...prev,
      { id, title: "New step", kind: "transform", note: "Describe this step" },
    ]);
    setSelected(id);
  }

  function removeSelected() {
    if (!selected || nodes.length <= 1) return;
    setNodes((prev) => prev.filter((n) => n.id !== selected));
    setSelected(null);
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#070712] shadow-[0_0_80px_-20px_rgba(34,211,238,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-violet-600/10 to-transparent px-5 py-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-cyan-300" />
          <div>
            <p className="text-sm font-semibold text-white">Node pipeline</p>
            <p className="text-xs text-zinc-500">
              Graph for this tool — tap a node, rewrite it, export a plan. Not the App Maker.
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
            Add node
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
            onClick={() => setExportText(exportScript(nodes, toolName))}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
          >
            <Play className="h-3.5 w-3.5" />
            Export plan
          </button>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_240px]">
        <div className="relative min-h-[240px] overflow-x-auto border-b border-white/5 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:22px_22px] p-5 lg:border-b-0 lg:border-r">
          <div
            className="pointer-events-none absolute left-10 right-10 top-[5.2rem] hidden h-[2px] bg-gradient-to-r from-cyan-400/0 via-violet-400/70 to-amber-400/0 md:block"
            aria-hidden
          />
          <ul className="relative flex min-w-max flex-col gap-3 md:flex-row md:items-start md:gap-6">
            {nodes.map((node, i) => (
              <li key={node.id} className="flex items-center gap-2 md:flex-col md:gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(node.id)}
                  className={`w-full min-w-[150px] max-w-[190px] rounded-2xl border px-3 py-3 text-left shadow-[0_12px_40px_-18px_rgba(0,0,0,0.9)] transition md:w-44 ${
                    kindTone[node.kind]
                  } ${
                    selected === node.id
                      ? "scale-[1.03] ring-2 ring-cyan-300/80"
                      : "hover:brightness-110"
                  }`}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-[10px] text-white">
                    {i + 1}
                  </span>
                  <span className="ml-1.5 text-[10px] uppercase tracking-wide text-zinc-400">
                    {node.kind}
                  </span>
                  <span className="mt-1 block text-sm font-medium text-white">
                    {node.title}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[11px] text-zinc-500">
                    {node.note}
                  </span>
                </button>
                {i < nodes.length - 1 && (
                  <span className="text-cyan-500/70 md:hidden" aria-hidden>
                    ↓
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Inspector
          </p>
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
                  onChange={(e) =>
                    updateSelected({ kind: e.target.value as FlowNode["kind"] })
                  }
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

      {exportText && (
        <div className="border-t border-white/5 px-5 py-4">
          <p className="mb-2 text-xs font-medium text-zinc-400">Exported plan</p>
          <pre className="max-h-40 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-300 whitespace-pre-wrap">
            {exportText}
          </pre>
          <button
            type="button"
            className="mt-2 text-xs text-violet-400 hover:text-violet-300"
            onClick={() => {
              void navigator.clipboard?.writeText(exportText);
            }}
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </section>
  );
}
