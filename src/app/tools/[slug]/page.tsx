import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { getToolBySlug } from "@/lib/tools-registry";
import { FreeToolRunner, type FreeRunnerKind } from "@/components/FreeToolRunner";
import { PromptToolStudio } from "@/components/PromptToolStudio";
import { ToolVisitTracker } from "@/components/ToolVisitTracker";

type Props = { params: Promise<{ slug: string }> };

const FREE_RUNNERS = new Set<string>([
  "image-to-pdf",
  "image-format",
  "pdf-merge",
  "pdf-editor",
  "pdf-to-images",
  "pdf-to-doc",
  "bg-remover",
  "youtube-downloader",
  "youtube-to-captions",
  "video-converter",
  "doc-converter",
  "image-to-prompt",
  "prompt-to-image",
  "image-to-video",
  "slides-deck",
  "excel-hub",
  "csv-text-tools",
  "latex-resume",
  "ats-resume",
  "message-automation",
  "sitemap-finder",
  "sitemap-validator",
  "sitemap-urls",
  "robots-txt",
  "ping-test",
  "speed-test",
  "whats-my-ip",
  "dns-lookup",
  "multi-clock",
  "advanced-calculator",
  "build-your-tool",
  "request-tool",
  "life-planner",
  "calendar-generator",
  "local-ai-hardware",
  "local-ai-directory",
  "ai-summarizer",
  "meeting-notes-ai",
  "audio-transcribe",
]);

const APP_REDIRECTS: Record<string, string> = {
  chat: "/chat",
  "prompt-assistant": "/prompt-assistant",
  "ai-finder": "/ai-finder",
  "mcp-setup": "/mcp",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: "Tool Not Found" };

  const keywords = [...new Set([...tool.taskKeywords, ...tool.tags, tool.name, "free", "online"])];
  const title = `${tool.name} — free online | Plethora`;
  const description =
    tool.description.length > 40
      ? `${tool.description} Free to try under one roof.`
      : `${tool.name}: ${tool.description} Free online tool.`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "website",
    },
    alternates: {
      canonical: `/tools/${tool.slug}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  if (APP_REDIRECTS[slug]) {
    const { redirect } = await import("next/navigation");
    redirect(APP_REDIRECTS[slug]);
  }
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const isFreeRunner = FREE_RUNNERS.has(slug);
  const isStudio =
    tool.runner === "prompt-studio" ||
    (!isFreeRunner && tool.runner !== "app-page" && tool.runner !== "link-hub");

  return (
    <SiteShell>
      <ToolVisitTracker slug={slug} />
      <div className="px-4 py-10 sm:px-6">
          <div className={`mx-auto ${isFreeRunner ? "max-w-3xl" : "max-w-2xl"}`}>
          <Link
            href="/tools"
            className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All tools
          </Link>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02]">
            <div className="border-b border-white/5 px-6 pb-5 pt-7 sm:px-8">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">{tool.name}</h1>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    tool.isPro
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {tool.isPro ? "PRO" : "FREE"}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{tool.description}</p>
              {tool.actionHint && (
                <p className="mt-3 text-sm font-medium text-violet-300/90">{tool.actionHint}</p>
              )}
              {tool.bestModels && tool.bestModels.length > 0 && (
                <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-amber-200/80">
                  <Star className="h-3 w-3" />
                  {tool.bestModels.join(" · ")}
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-600">
                {tool.freeRunsPerDay} free runs/day · {tool.category}
              </p>
            </div>
            <div className="px-6 py-6 sm:px-8">
              {isFreeRunner ? (
                <FreeToolRunner kind={slug as FreeRunnerKind} title={tool.name} />
              ) : isStudio ? (
                <PromptToolStudio tool={tool} />
              ) : (
                <div className="rounded-xl border border-dashed border-white/20 bg-black/20 p-8 text-center">
                  <p className="text-zinc-400">
                    Open{" "}
                    <Link href="/prompt-assistant" className="text-violet-400 hover:underline">
                      Prompt Assistant
                    </Link>{" "}
                    or{" "}
                    <Link href="/chat" className="text-violet-400 hover:underline">
                      Chat
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
