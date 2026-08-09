"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock, Plug, Sparkles } from "lucide-react";
import { getRecentTools } from "@/lib/self-learn";
import type { PlatformTool } from "@/lib/types";

function toolHref(slug: string) {
  if (slug === "prompt-assistant" || slug === "ai-finder") return `/${slug}`;
  if (slug === "chat") return "/chat";
  if (slug === "mcp-setup") return "/mcp";
  return `/tools/${slug}`;
}

/** Sticky re-entry rails — recent tools + MCP CTA */
export function StickyRails() {
  const [recent, setRecent] = useState<PlatformTool[]>([]);

  useEffect(() => {
    setRecent(getRecentTools(6));
  }, []);

  return (
    <div className="space-y-3">
      {recent.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <Clock className="h-3.5 w-3.5" /> Continue where you left off
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recent.map((t) => (
              <Link
                key={t.id}
                href={toolHref(t.slug)}
                className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-200 hover:border-violet-500/40"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <Plug className="h-4 w-4 text-emerald-400" />
            Stickier than another chat tab
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Add <strong className="font-medium text-zinc-300">Plethora MCP</strong> to Claude Desktop
            or Cursor — search tools, captions, SEO, prompts from inside your AI.
          </p>
        </div>
        <Link
          href="/mcp#plethora-mcp"
          className="mt-3 inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 sm:mt-0"
        >
          <Sparkles className="h-4 w-4" />
          Install Plethora MCP
        </Link>
      </div>
    </div>
  );
}
