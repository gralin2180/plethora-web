"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Bot,
  Brain,
  Cable,
  Calendar,
  Clapperboard,
  Clock,
  Code,
  Compass,
  Eraser,
  FileCode,
  FileImage,
  FileOutput,
  FilePen,
  FileText,
  FileType,
  Files,
  Film,
  FolderTree,
  Gift,
  Heart,
  ImagePlus,
  Images,
  Layers,
  Layout,
  Library,
  Lightbulb,
  ListTree,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Newspaper,
  NotebookPen,
  PenLine,
  PlayCircle,
  Plug,
  Regex,
  Repeat,
  Scale,
  ScanSearch,
  Search,
  Shield,
  Sparkles,
  Swords,
  TrendingUp,
  Type,
  UserRound,
  Users,
  Video,
  Wand2,
  Workflow,
  Zap,
  Presentation,
  Sheet,
  Table2,
  Globe,
  ShieldCheck,
  List,
  User,
  Timer,
  Calculator,
  Hammer,
  Inbox,
  CalendarDays,
  Radar,
  Gauge,
  Globe2,
  Network,
  Captions,
  Cpu,
  Mic,
  FileStack,
  Hash,
  FlaskConical,
  Flame,
  HardDrive,
  type LucideIcon,
} from "lucide-react";
import { PLATFORM_TOOLS, TOOL_CATEGORIES, searchTools } from "@/lib/tools-registry";
import {
  getForYouTools,
  getPopularTools,
  getRecentTools,
  isFavorite,
  toggleFavorite,
  trackToolUse,
} from "@/lib/self-learn";
import type { PlatformTool } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  MessageSquare,
  Search,
  MessageCircle,
  BookOpen,
  Compass,
  Bot,
  Library,
  Shield,
  FileImage,
  Images,
  Files,
  FilePen,
  FileOutput,
  FileType,
  Eraser,
  Youtube: PlayCircle,
  Film,
  FileText,
  ScanSearch,
  ImagePlus,
  Clapperboard,
  Newspaper,
  ListTree,
  Wand2,
  Type,
  Mail,
  Megaphone,
  Zap,
  Users,
  Video,
  Gift,
  Swords,
  Layout,
  Lightbulb,
  Repeat,
  PenLine,
  Layers,
  Calendar,
  Plug,
  Code,
  Brain,
  FileCode,
  Regex,
  Workflow,
  FolderTree,
  Cable,
  NotebookPen,
  Flame,
  HardDrive,
  Presentation: Presentation,
  Sheet: Sheet,
  Table: Table2,
  Globe,
  ShieldCheck,
  List,
  User,
  Timer,
  Calculator,
  Hammer,
  Inbox,
  CalendarDays,
  Radar,
  Gauge,
  Globe2,
  Network,
  Captions,
  Cpu,
  Mic,
  FileStack,
  Hash,
  FlaskConical,
  TrendingUp,
  Scale,
  Heart,
  PlayCircle,
  Building2: Layout,
  UserRound,
};

type SmartTab = "all" | "popular" | "recent" | "foryou";

function toolHref(slug: string) {
  if (slug === "prompt-assistant" || slug === "ai-finder") return `/${slug}`;
  if (slug === "chat") return "/chat";
  if (slug === "spicy-chat") return "/spicy";
  if (slug === "local-llms") return "/local-llms";
  if (slug === "mcp-setup") return "/mcp";
  return `/tools/${slug}`;
}

export function ToolsGrid() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("category");
  const [category, setCategory] = useState<string>(
    initialCat && (TOOL_CATEGORIES as readonly string[]).includes(initialCat)
      ? initialCat
      : "All"
  );
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<SmartTab>("all");
  const [tick, setTick] = useState(0);
  const gridAnchorRef = useRef<HTMLDivElement>(null);

  function selectCategory(cat: string) {
    setCategory(cat);
    setTab("all");
    requestAnimationFrame(() => {
      document.getElementById("tools-category-tabs")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  useEffect(() => {
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    const c = searchParams.get("category");
    if (c && (TOOL_CATEGORIES as readonly string[]).includes(c)) setCategory(c);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list: PlatformTool[];
    if (tab === "popular") list = getPopularTools(48);
    else if (tab === "recent") list = getRecentTools(48);
    else if (tab === "foryou") list = getForYouTools(48);
    else list = q.trim() ? searchTools(q) : PLATFORM_TOOLS;

    if (q.trim() && tab !== "all") {
      const qq = q.trim().toLowerCase();
      list = list.filter((t) =>
        `${t.name} ${t.description} ${t.tags.join(" ")}`.toLowerCase().includes(qq)
      );
    }

    if (category !== "All") list = list.filter((t) => t.category === category);
    return list;
  }, [category, q, tab, tick]);

  const freeUtils = PLATFORM_TOOLS.filter((t) => t.category === "Free Utilities");
  const aiTools = PLATFORM_TOOLS.filter((t) => t.category === "AI Tools");

  const smartTabs: { id: SmartTab; label: string; icon: LucideIcon }[] = [
    { id: "all", label: "All", icon: Layers },
    { id: "popular", label: "Popular", icon: TrendingUp },
    { id: "recent", label: "Recent", icon: Clock },
    { id: "foryou", label: "For you", icon: UserRound },
  ];

  return (
    <>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tools — PDF, captions, local AI, resume…"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {smartTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setTick((n) => n + 1);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition ${
              tab === t.id
                ? "bg-cyan-600 text-white"
                : "border border-white/10 text-zinc-400 hover:border-cyan-500/40"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "recent" && filtered.length === 0 && (
        <p className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-500">
          Open any tool once — it appears here. Self-learn stays on your device.
        </p>
      )}
      {tab === "foryou" && (
        <p className="mb-4 text-xs text-zinc-500">
          Your recent usage + chat topics + favorites — middleman memory on this device only.
        </p>
      )}
      {tab === "popular" && (
        <p className="mb-4 text-xs text-zinc-500">
          Global demand seeds plus what this browser actually uses (like TAAFT trending, but yours).
        </p>
      )}

      {tab === "all" && !q.trim() && (
        <>
          <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-semibold text-white">Free utilities</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Everyday converters &amp; utilities — PDFs, network checks, planners. No model required.
                </p>
              </div>
              <button
                type="button"
                onClick={() => selectCategory("Free Utilities")}
                className="text-xs text-emerald-400 hover:underline"
              >
                View all utilities
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {freeUtils.slice(0, 12).map((t) => {
                const Icon = ICONS[t.icon] ?? Zap;
                return (
                  <Link
                    key={t.id}
                    href={toolHref(t.slug)}
                    onClick={() => trackToolUse(t.slug)}
                    className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-black/30 px-3 py-3 text-sm text-emerald-100/90 transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                      <Icon className="h-4 w-4 text-emerald-300" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t.name}</span>
                      {t.actionHint && (
                        <span className="block truncate text-[11px] text-zinc-500">{t.actionHint}</span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mb-8 overflow-hidden rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-semibold text-white">AI tools</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Captions, local GPU stacks, summarizers, prompts, chat — separate from plain utilities.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/settings/backends"
                  className="text-xs text-violet-300 hover:underline"
                >
                  Local AI backends
                </Link>
                <button
                  type="button"
                  onClick={() => selectCategory("AI Tools")}
                  className="text-xs text-violet-300 hover:underline"
                >
                  View all AI tools
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {aiTools.slice(0, 12).map((t) => {
                const Icon = ICONS[t.icon] ?? Sparkles;
                return (
                  <Link
                    key={t.id}
                    href={toolHref(t.slug)}
                    data-tour={`tool-${t.slug}`}
                    onClick={() => trackToolUse(t.slug)}
                    className="flex items-center gap-3 rounded-xl border border-violet-500/25 bg-black/30 px-3 py-3 text-sm text-violet-100/90 transition hover:border-violet-400/40 hover:bg-violet-500/10"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                      <Icon className="h-4 w-4 text-violet-300" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t.name}</span>
                      {t.actionHint && (
                        <span className="block truncate text-[11px] text-zinc-500">{t.actionHint}</span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div id="tools-category-tabs" ref={gridAnchorRef} className="mb-6 flex scroll-mt-24 flex-wrap gap-2">
        {TOOL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => selectCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              category === cat
                ? cat === "AI Tools"
                  ? "bg-violet-600 text-white"
                  : cat === "Free Utilities"
                    ? "bg-emerald-600 text-white"
                    : "bg-violet-600 text-white"
                : "border border-white/10 text-zinc-400 hover:border-white/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="mb-3 text-xs text-zinc-600">
        {filtered.length} tool{filtered.length === 1 ? "" : "s"}
        {q.trim() ? ` matching “${q.trim()}”` : ""}
        {tab !== "all" ? ` · ${tab}` : ""}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tool) => {
          const Icon = ICONS[tool.icon] ?? Sparkles;
          const fav = isFavorite(tool.slug);
          return (
            <div
              key={tool.id}
              data-tour={`tool-${tool.slug}`}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-violet-500/40 hover:bg-violet-500/5"
            >
              <button
                type="button"
                title={fav ? "Unfavorite" : "Favorite"}
                onClick={() => {
                  toggleFavorite(tool.slug);
                  setTick((n) => n + 1);
                }}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-600 hover:bg-white/5 hover:text-rose-400"
              >
                <Heart className={`h-3.5 w-3.5 ${fav ? "fill-rose-400 text-rose-400" : ""}`} />
              </button>
              <Link
                href={toolHref(tool.slug)}
                onClick={() => trackToolUse(tool.slug)}
                className="flex flex-1 flex-col"
              >
                <div className="flex items-start gap-3 pr-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-violet-300 group-hover:border-violet-500/30">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-white group-hover:text-violet-100">
                        {tool.name}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          tool.isPro
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {tool.isPro ? "PRO" : "FREE"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{tool.description}</p>
                  </div>
                </div>
                {tool.category === "AI Tools" || tool.runner === "prompt-studio" ? (
                  <p className="mt-3 text-[11px] text-zinc-500">Free pool · Connect · your API key</p>
                ) : tool.bestModels?.[0] ? (
                  <p className="mt-3 text-[11px] text-zinc-500">{tool.bestModels[0]}</p>
                ) : null}
                <div className="mt-auto flex items-center justify-between pt-4 text-[11px] text-zinc-600">
                  <span>{tool.category}</span>
                  <span
                    title={`${tool.freeRunsPerDay} free uses per day on the Free plan (resets daily). Paid plans raise this limit.`}
                  >
                    {tool.freeRunsPerDay}/day free
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-zinc-500">
          Nothing matched. Try “youtube”, “writer”, or open a tool so Recent can learn.
        </p>
      )}
    </>
  );
}
