import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ToolAiLane } from "@/components/ToolAiLane";
import { SiteShell } from "@/components/SiteShell";
import { getToolBySlug } from "@/lib/tools-registry";
import { FreeToolRunner, type FreeRunnerKind } from "@/components/FreeToolRunner";
import { PromptToolStudio } from "@/components/PromptToolStudio";
import { ToolVisitTracker } from "@/components/ToolVisitTracker";
import { NodeWorkflowCanvas } from "@/components/NodeWorkflowCanvas";
import { NODE_GRAPH_SLUGS } from "@/lib/tool-how-it-works";

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
  "email-manager",
  "video-recorder",
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
  "position-size",
  "risk-reward",
  "word-counter",
  "case-converter",
  "json-formatter",
  "uuid-generator",
  "percentage-calc",
  "custom-assistant",
  "password-generator",
  "regex-helper",
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
          <div className={`mx-auto ${slug === "build-your-tool" ? "max-w-6xl" : isFreeRunner ? "max-w-3xl" : "max-w-2xl"}`}>
          <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All tools
          </Link>
          <Link href="/projects" className="text-sm text-violet-300 hover:underline">
            Projects
          </Link>
          <Link href="/chat" className="text-sm text-zinc-500 hover:text-white">
            Chat
          </Link>
          </div>
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
              {(tool.category === "AI Tools" ||
                tool.runner === "prompt-studio" ||
                slug === "build-your-tool") && <ToolAiLane />}
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                <span className="text-zinc-400">{tool.freeRunsPerDay} free uses per day</span>
                {" · "}
                {tool.category}
                {" · "}
                on Free plan this is how many times you can run this tool each day (resets daily;
                higher limits on paid plans). Browser-only tools still work offline when the page is
                loaded.
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

          {NODE_GRAPH_SLUGS.has(slug) && (
            <NodeWorkflowCanvas slug={slug} toolName={tool.name} />
          )}
        </div>
      </div>
    </SiteShell>
  );
}
