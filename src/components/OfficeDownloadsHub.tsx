import Link from "next/link";
import { Building2, Monitor, Terminal } from "lucide-react";

export function OfficeDownloadsHub() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start gap-3">
        <Building2 className="mt-1 h-8 w-8 text-cyan-300" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-400">Suite</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Plethora Office</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            <strong className="text-zinc-200">Windows apps first.</strong> We build native Slack and
            Taskbot on your PC. Web previews come after each desktop app is finalized — not the other
            way around.
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-[#0078d4]/40 bg-gradient-to-br from-[#0078d4]/15 to-transparent p-6">
        <div className="flex items-start gap-3">
          <Monitor className="mt-0.5 h-6 w-6 text-[#0078d4]" />
          <div>
            <p className="text-lg font-semibold text-white">1. Plethora Slack — Windows app</p>
            <p className="mt-1 text-sm text-zinc-400">
              Electron app in <code className="text-zinc-300">desktop/slack/</code>. Channels, @mentions,
              screenshots, Echo AI, BYOK. Opens as a real window on your PC.
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-zinc-300">
              <p className="text-zinc-500"># Terminal 1</p>
              <p>cd desktop/slack</p>
              <p>npm install</p>
              <p>npm run build:electron</p>
              <p>npm run dev</p>
              <p className="mt-3 text-zinc-500"># Terminal 2</p>
              <p>cd desktop/slack</p>
              <p>npm run desktop</p>
              <p className="mt-3 text-zinc-500"># Build installer</p>
              <p>npm run build:win</p>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Output: <code className="text-zinc-400">desktop/slack/release/Plethora-Slack-Setup-0.1.0.exe</code>
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <p className="font-semibold text-amber-100">2. Taskbot — Windows app (next)</p>
        <p className="mt-1 text-sm text-zinc-400">
          After Slack is working on your machine. Watches chat, captures tasks, @you inbox. Folder:{" "}
          <code className="text-zinc-300">desktop/taskbot/</code> — not started yet.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Terminal className="h-4 w-4" />
          Web previews (for testing only — copies of desktop later)
        </p>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link href="/office/slack" className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-400 hover:text-white">
            Slack web preview
          </Link>
          <Link href="/office/taskbot" className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-400 hover:text-white">
            Taskbot web preview
          </Link>
          <Link href="/office/word" className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-400 hover:text-white">
            Word web preview
          </Link>
        </ul>
      </section>
    </div>
  );
}
