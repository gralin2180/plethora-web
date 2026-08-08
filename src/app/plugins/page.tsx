import type { Metadata } from "next";
import Link from "next/link";
import { Terminal, Monitor, Cpu } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { AI_CATALOG } from "@/lib/ai-catalog";

export const metadata: Metadata = {
  title: "Plugins & Integrations — Plethora",
  description: "Connect Plethora with Cursor, Claude, terminal AI, and local models.",
};

const SECTIONS = [
  {
    icon: Monitor,
    title: "IDE Plugins",
    platform: "ide" as const,
    desc: "Cursor and other AI-powered IDEs",
  },
  {
    icon: Terminal,
    title: "Terminal & CLI",
    platform: "terminal" as const,
    desc: "Claude Code, Aider, and terminal agents",
  },
  {
    icon: Cpu,
    title: "Local AI",
    platform: "local" as const,
    desc: "Ollama, LM Studio, ComfyUI — run models on your machine",
  },
];

export default function PluginsPage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-white">Plugins & Integrations</h1>
          <p className="mt-2 text-zinc-500">
            Use Plethora with Cursor, Claude on terminal, local AI apps, and more.
            Our Prompt Assistant and AI Finder work everywhere.
          </p>

          <div className="mt-10 space-y-12">
            {SECTIONS.map((section) => {
              const tools = AI_CATALOG.filter((t) => t.platform === section.platform);
              return (
                <section key={section.platform}>
                  <div className="mb-4 flex items-center gap-3">
                    <section.icon className="h-6 w-6 text-violet-400" />
                    <div>
                      <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                      <p className="text-sm text-zinc-500">{section.desc}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tools.map((tool) => (
                      <div
                        key={tool.id}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                      >
                        <h3 className="font-medium text-white">{tool.name}</h3>
                        <p className="mt-1 text-sm text-zinc-500">{tool.description}</p>
                        {tool.url && (
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-xs text-violet-400 hover:underline"
                          >
                            Learn more →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-12 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-8 text-center">
            <p className="text-zinc-300">
              Browser extension & native plugins coming soon — use Prompt Assistant
              in-browser today.
            </p>
            <Link
              href="/prompt-assistant"
              className="mt-4 inline-block text-violet-400 hover:text-violet-300"
            >
              Open Prompt Assistant →
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
