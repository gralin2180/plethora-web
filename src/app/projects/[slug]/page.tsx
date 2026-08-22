"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getMiniApp, type MiniApp } from "@/lib/mini-apps";
import { ExternalLink, LayoutGrid } from "lucide-react";

export default function MiniAppPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug || "");
  const [app, setApp] = useState<MiniApp | null | undefined>(undefined);

  useEffect(() => {
    setApp(getMiniApp(slug));
    const onStore = () => setApp(getMiniApp(slug));
    window.addEventListener("storage", onStore);
    return () => window.removeEventListener("storage", onStore);
  }, [slug]);

  if (app === undefined) {
    return <p className="p-8 text-sm text-zinc-500">Loading app…</p>;
  }

  if (!app) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-white">App not on this device</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Mini-apps are saved in this browser. Open Chat and ask to build it again, or pick one
          from your list.
        </p>
        <Link href="/projects" className="mt-6 inline-block text-sm text-violet-300 hover:underline">
          Your projects
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[#080810]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{app.title}</p>
          <p className="truncate text-[11px] text-zinc-500">
            plethora-ten.vercel.app/projects/{app.slug}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-300 hover:bg-white/5"
          >
            <LayoutGrid className="h-3 w-3" />
            All
          </Link>
          <a
            href={`/projects/${app.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-300 hover:bg-white/5"
          >
            <ExternalLink className="h-3 w-3" />
            Window
          </a>
        </div>
      </div>
      <iframe
        title={app.title}
        srcDoc={app.html}
        sandbox="allow-scripts allow-same-origin allow-modals"
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
