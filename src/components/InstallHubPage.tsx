"use client";

import { useMemo, useState } from "react";
import { Copy, ExternalLink, Package, Terminal, Zap } from "lucide-react";
import {
  FREE_INSTALL_REPOS,
  INSTALL_CATEGORIES,
  type InstallCategory,
  type FreeInstallRepo,
} from "@/lib/install-repos";
import {
  AGENT_DISCOVERY_LISTS,
  HARDCORE_SCRAPER_PLAYBOOKS,
  resolveRepo,
} from "@/lib/hardcore-scrapers";

export function InstallHubPage() {
  const [cat, setCat] = useState<InstallCategory | "all">("all");
  const [hardcoreOnly, setHardcoreOnly] = useState(false);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const repos = useMemo(() => {
    return FREE_INSTALL_REPOS.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (hardcoreOnly && !r.hardcore) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        return (
          r.name.toLowerCase().includes(s) ||
          r.description.toLowerCase().includes(s) ||
          r.tags.some((t) => t.includes(s)) ||
          r.taskKeywords.some((t) => t.includes(s))
        );
      }
      return true;
    });
  }, [cat, hardcoreOnly, q]);

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start gap-3">
        <Terminal className="mt-1 h-8 w-8 text-amber-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Install Hub</h1>
          <p className="mt-1 text-zinc-500">
            Free open-source repos and install paths for local LLMs, agents, scrapers, and
            MCP — so your PC can reach more of the internet through tools you control. Windows
            desktop app is on hold; use these installs with the web app + terminals now.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Always obey site Terms, robots.txt, copyright, and law. Plethora is orchestration —
            you own how tools are used.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {INSTALL_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={`rounded-full px-3 py-1.5 text-xs transition ${
              cat === c.id ? "bg-amber-600 text-white" : "border border-white/10 text-zinc-400"
            }`}
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setHardcoreOnly(!hardcoreOnly)}
          className={`rounded-full px-3 py-1.5 text-xs transition ${
            hardcoreOnly ? "bg-red-600 text-white" : "border border-red-500/40 text-red-300"
          }`}
        >
          Hardcore only
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search installs (scrape, agent, ollama...)"
        className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600"
      />

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <Package className="h-5 w-5" /> Free repos ({repos.length})
        </h2>
        <div className="mt-4 grid gap-3">
          {repos.map((r) => (
            <RepoCard
              key={r.id}
              repo={r}
              copied={copied === r.id}
              onCopy={() => r.quickInstall && copyText(r.id, r.quickInstall)}
            />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <Zap className="h-5 w-5 text-red-400" /> Hardcore web-intel playbooks
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Stack scrapers + agents so most public internet knowledge can feed your models —
          research, competition, docs, trends.
        </p>
        <div className="mt-6 space-y-6">
          {HARDCORE_SCRAPER_PLAYBOOKS.map((pb) => (
            <article
              key={pb.id}
              className="rounded-2xl border border-red-500/25 bg-red-500/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{pb.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{pb.goal}</p>
              <p className="mt-2 text-xs text-amber-200/80">{pb.legalNote}</p>
              <p className="mt-3 text-sm text-zinc-300">
                <span className="text-zinc-500">Stack:</span> {pb.stack.join(" · ")}
              </p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-zinc-400">
                {pb.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                {pb.repoIds.map((id) => {
                  const repo = resolveRepo(id);
                  if (!repo) return null;
                  return (
                    <a
                      key={id}
                      href={repo.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-300 hover:border-red-400/50"
                    >
                      {repo.name}
                    </a>
                  );
                })}
              </div>
              <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-black/40 p-3 text-xs text-zinc-400">
                {pb.plethoraprompt}
              </pre>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-white">Discover more agents & scrapers</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Lists that keep updating online — use them to expand beyond our baked-in catalog.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {AGENT_DISCOVERY_LISTS.map((d) => (
            <a
              key={d.url}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-amber-500/30"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-white">{d.name}</p>
                <ExternalLink className="h-4 w-4 text-zinc-500" />
              </div>
              <p className="mt-1 text-xs text-zinc-500">{d.description}</p>
              <p className="mt-2 text-xs text-amber-300/80">{d.howToUse}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function RepoCard({
  repo,
  onCopy,
  copied,
}: {
  repo: FreeInstallRepo;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-white">{repo.name}</h3>
            {repo.hardcore && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300">
                HARDCORE
              </span>
            )}
            <span className="rounded-full border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-400">
              FREE
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{repo.description}</p>
        </div>
        <a
          href={repo.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Repo
        </a>
      </div>
      <p className="mt-3 text-sm text-zinc-400">
        <span className="text-zinc-300">Setup:</span> {repo.howToSetUp}
      </p>
      {repo.quickInstall && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-black/40 p-3 font-mono text-[11px] text-zinc-400">
          <code className="flex-1 whitespace-pre-wrap">{repo.quickInstall}</code>
          <button type="button" onClick={onCopy} className="shrink-0 text-zinc-300 hover:text-white">
            {copied ? "Copied" : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
      {repo.homepage && (
        <a
          href={repo.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-cyan-400 hover:underline"
        >
          Homepage →
        </a>
      )}
    </div>
  );
}
