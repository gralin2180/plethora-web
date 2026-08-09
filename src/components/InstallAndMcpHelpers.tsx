"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, Terminal } from "lucide-react";
import {
  getInstallGuide,
  type InstallOs,
} from "@/lib/local-install-guides";

function CopyLine({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
      className="inline-flex items-center gap-1 text-[11px] text-violet-300 hover:underline"
    >
      {ok ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {ok ? "Copied" : "Copy"}
    </button>
  );
}

function detectOs(): InstallOs {
  if (typeof navigator === "undefined") return "windows";
  const p = navigator.platform?.toLowerCase() || "";
  const ua = navigator.userAgent.toLowerCase();
  if (p.includes("mac") || ua.includes("mac")) return "mac";
  if (p.includes("linux") || ua.includes("linux")) return "linux";
  return "windows";
}

export function BackendInstallGuide({ backendId, name }: { backendId: string; name: string }) {
  const guide = getInstallGuide(backendId);
  const [os, setOs] = useState<InstallOs>(detectOs);

  if (!guide) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-500">
        No guided install for this profile yet. Use Install / site for the vendor steps, then paste the
        localhost URL below.
      </div>
    );
  }

  const steps = guide.steps[os];

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Terminal className="h-4 w-4 text-cyan-300" />
          Install {name} on your PC
        </p>
        <div className="flex gap-1 rounded-lg border border-white/10 p-0.5">
          {(["windows", "mac", "linux"] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOs(o)}
              className={`rounded-md px-2.5 py-1 text-[11px] capitalize ${
                os === o ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white"
              }`}
            >
              {o === "mac" ? "macOS" : o}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Need first</p>
        <ul className="mt-1 space-y-0.5 text-xs text-zinc-400">
          {guide.prerequisites.map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
      </div>

      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={step.title} className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-sm font-medium text-white">
              {i + 1}. {step.title}
            </p>
            {step.detail && (
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{step.detail}</p>
            )}
            {step.command && (
              <div className="mt-2">
                <div className="mb-1 flex justify-end">
                  <CopyLine text={step.command} />
                </div>
                <pre className="overflow-x-auto rounded-lg bg-black/50 p-2.5 font-mono text-[11px] text-cyan-100/90 whitespace-pre-wrap">
                  {step.command}
                </pre>
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        <p className="text-sm font-medium text-emerald-100">{guide.verify.title}</p>
        <p className="mt-1 text-xs text-zinc-400">{guide.verify.detail}</p>
        {guide.verify.command && (
          <div className="mt-2">
            <div className="mb-1 flex justify-end">
              <CopyLine text={guide.verify.command} />
            </div>
            <pre className="overflow-x-auto rounded-lg bg-black/40 p-2 font-mono text-[11px] text-zinc-300">
              {guide.verify.command}
            </pre>
          </div>
        )}
      </div>

      <ul className="space-y-1 text-xs text-zinc-500">
        {guide.afterInstall.map((a) => (
          <li key={a}>→ {a}</li>
        ))}
      </ul>

      <a
        href={guide.docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-xs text-cyan-300 hover:underline"
      >
        Official docs / downloads
      </a>
    </div>
  );
}

export function McpBuilderLab() {
  const [name, setName] = useState("my-tools");
  const [usecase, setUsecase] = useState("Read project notes and answer questions about them");
  const [tools, setTools] = useState("list_notes, get_note, search_notes");
  const [lang, setLang] = useState<"ts" | "python">("ts");

  const scaffold = useMemo(() => buildScaffold(name, usecase, tools, lang), [name, usecase, tools, lang]);

  function download() {
    const blob = new Blob([scaffold.readme + "\n\n---\n\n" + scaffold.code], {
      type: "text/plain;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safe(name)}-mcp-starter.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Create your own MCP</h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
          Generate a local starter for a custom Model Context Protocol server. You run it on your PC;
          Claude Desktop, Cursor, and other hosts can call your tools. Free to build — you control the code.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-zinc-400">
          Server name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm text-zinc-400">
          Language
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "ts" | "python")}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          >
            <option value="ts">TypeScript (Node)</option>
            <option value="python">Python</option>
          </select>
        </label>
      </div>
      <label className="block text-sm text-zinc-400">
        Use case
        <input
          value={usecase}
          onChange={(e) => setUsecase(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
        />
      </label>
      <label className="block text-sm text-zinc-400">
        Tool names (comma-separated)
        <input
          value={tools}
          onChange={(e) => setTools(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          <Download className="h-4 w-4" /> Download starter pack
        </button>
        <CopyLine text={scaffold.config} />
      </div>

      <div>
        <p className="text-xs text-zinc-500">Host config (Claude Desktop / Cursor)</p>
        <pre className="mt-1 overflow-x-auto rounded-lg bg-black/50 p-3 text-[11px] text-zinc-300">
          {scaffold.config}
        </pre>
      </div>
      <div>
        <p className="text-xs text-zinc-500">Scaffold preview</p>
        <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-black/50 p-3 text-[11px] text-zinc-400 whitespace-pre-wrap">
          {scaffold.code.slice(0, 3500)}
          {scaffold.code.length > 3500 ? "\n…" : ""}
        </pre>
      </div>
    </div>
  );
}

function safe(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "my-tools";
}

function buildScaffold(
  name: string,
  usecase: string,
  toolsRaw: string,
  lang: "ts" | "python"
): { readme: string; code: string; config: string } {
  const id = safe(name);
  const toolList = toolsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const tools = toolList.length ? toolList : ["hello"];

  const config = `{
  "mcpServers": {
    "${id}": {
      "command": "${lang === "ts" ? "node" : "python"}",
      "args": ["${lang === "ts" ? `./${id}/dist/index.js` : `./${id}/server.py`}"]
    }
  }
}`;

  const readme = `# ${name} MCP starter

Use case: ${usecase}

## Setup
${
  lang === "ts"
    ? `1. mkdir ${id} && cd ${id}
2. npm init -y
3. npm i @modelcontextprotocol/sdk zod
4. Save server code as src/index.ts, build with tsc, or use tsx
5. Paste host config into Claude Desktop or Cursor mcp.json`
    : `1. mkdir ${id} && cd ${id}
2. python -m venv .venv && activate it
3. pip install mcp
4. Save server.py and run: python server.py (stdio)
5. Paste host config into Claude Desktop or Cursor`

}

Run only folders you trust. Never expose an MCP with shell access to the public internet.
`;

  const code =
    lang === "ts"
      ? `// ${id}/src/index.ts — MCP server starter
// Use case: ${usecase}
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "${id}", version: "0.1.0" });

${tools
  .map(
    (t) => `server.tool(
  "${t}",
  "Implements: ${usecase}",
  { query: z.string().optional() },
  async ({ query }) => ({
    content: [{ type: "text", text: "${t}: implement me. query=" + (query ?? "") }],
  })
);`
  )
  .join("\n\n")}

const transport = new StdioServerTransport();
await server.connect(transport);
`
      : `# ${id}/server.py — MCP server starter
# Use case: ${usecase}
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("${id}")

${tools
  .map(
    (t) => `@mcp.tool()
def ${t.replace(/-/g, "_")}(query: str = "") -> str:
    """${usecase}"""
    return f"${t}: implement me. query={query}"`
  )
  .join("\n\n")}

if __name__ == "__main__":
    mcp.run()
`;

  return { readme, code, config };
}

// removed unused LocalInstallGuide cast
