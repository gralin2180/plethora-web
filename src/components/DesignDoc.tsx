"use client";

import { Printer } from "lucide-react";

export function DesignDoc() {
  return (
    <article className="design-print mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <style>{`
        @media print {
          header, footer, [data-floating], .no-print { display: none !important; }
          body { background: #fff !important; color: #111 !important; }
          .design-print { color: #111; max-width: none; padding: 0; }
          .design-print h1, .design-print h2, .design-print h3 { color: #111 !important; }
          .design-print p, .design-print li, .design-print td, .design-print th { color: #222 !important; }
          .design-card { border: 1px solid #ddd !important; background: #fff !important; }
          .design-muted { color: #555 !important; }
          a { color: #111 !important; text-decoration: underline; }
        }
      `}</style>

      <div className="no-print mb-8 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
          Product design
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
        >
          <Printer className="h-4 w-4" />
          Save as PDF
        </button>
      </div>

      <p className="text-xs text-zinc-500 design-muted">Plethora · Architecture · 20 Aug 2026</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How AI runs in Plethora
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-400 design-muted">
        Two surfaces. The Windows app is an OpenCode-shaped coding assistant on the PC. The web roof
        talks to the public free gateway on a daily cap. Paid plans buy models we pay for, then a
        slow cheap fallback, then extra usage. We do not resell NVIDIA / OpenCode trial access.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Two surfaces</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="design-card rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Windows app</p>
            <p className="mt-1 text-sm font-semibold text-white">Coding assistant</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400 design-muted">
              Same job as OpenCode: files, terminal, sessions, connect a provider, pick a model.
              Prefer a local model (Ollama / llama.cpp, small GGUF on weak PCs). Not Cursor. Not an
              OpenCode clone. Repo work stays on the machine.
            </p>
            <p className="mt-3 text-[11px] text-zinc-500">Status: specced · not shipped yet</p>
          </div>
          <div className="design-card rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">Web app</p>
            <p className="mt-1 text-sm font-semibold text-white">Public free gateway</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400 design-muted">
              Chat, prompts, Write it, resume solver, custom tools. No sign-in for the free pool
              (daily cap). Paid SKUs are models we buy. Live today.
            </p>
            <p className="mt-3 text-[11px] text-zinc-500">Status: live on /chat · /tools · /design</p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Web rule (one sentence)</h2>
        <p className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-zinc-300 design-card">
          Unpaid: public free pool (capped, fail-fast). Pro: included paid models we buy. Then
          slower cheap models. Then extra usage / key. Never silent overage. Do not sell trial-pool
          access as a paid SKU.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Request path</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            { n: "1", t: "User asks", d: "Chat, prompt polish, resume solver, Write it, custom tool." },
            { n: "2", t: "Lane", d: "BYOK → included paid → free pool → slow fallback." },
            { n: "3", t: "Answer", d: "Picked model first, then at most two backups. Short timeout." },
            { n: "4", t: "If empty", d: "Sheet: extra usage, subscribe, or paste an API key." },
          ].map((s) => (
            <li key={s.n} className="design-card rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{s.n}</p>
              <p className="mt-1 text-sm font-semibold text-white">{s.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400 design-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">What uses the web gateway</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 design-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Surface</th>
                <th className="px-4 py-2 font-medium">Path</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {[
                ["Chat + floating assistant", "/chat · same selected model"],
                ["Prompt Assistant polish", "/api/polish → free chain"],
                ["Tool “Write it” studios", "/api/chat via runPlatformAi"],
                ["LaTeX resume ATS Solver", "/api/chat via runPlatformAi"],
                ["Build your own AI tool", "/api/chat via runPlatformAi"],
              ].map(([a, b]) => (
                <tr key={a} className="border-t border-white/5">
                  <td className="px-4 py-2 font-medium text-white">{a}</td>
                  <td className="px-4 py-2 text-zinc-400 design-muted">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-zinc-500 design-muted">
          Offline utilities (PDF merge, image compress, regex, CSV) never hit this pipeline. The
          Windows coding app does not send your repo through this gateway.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Free model order</h2>
        <p className="mt-2 text-sm text-zinc-400 design-muted">
          Selected model is tried first. Then every remaining free model, in this list.
        </p>
        <ol className="mt-3 space-y-1 text-sm text-zinc-300">
          {[
            "Laguna S 2.1",
            "Nemotron 3.5 Lightning",
            "DeepSeek V4 Flash",
            "Nemotron 3 Ultra",
            "Hy3",
            "MiMo V2.5",
            "Big Pickle",
            "OpenRouter / Groq free (if a platform key exists)",
          ].map((name, i) => (
            <li key={name} className="flex gap-3">
              <span className="w-6 tabular-nums text-zinc-600">{i + 1}.</span>
              <span>{name}</span>
              {i < 7 && <span className="ml-auto text-xs text-zinc-500">128K · Free</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">When the pool is exhausted</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400 design-muted">
          The product does not invent an answer. It shows one sheet everywhere (chat, tools, polish):
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          <li>
            <strong className="font-medium text-white">External API key</strong> — BYOK at Settings →
            AI keys, or Connect ChatGPT / Copilot. Unlimited on their account.
          </li>
          <li>
            <strong className="font-medium text-white">Pay as you go</strong> — try packs ($2 / $5 /
            $12) for extra premium messages without a monthly bill.
          </li>
          <li>
            <strong className="font-medium text-white">Subscribe</strong> — Pro / Team / Hardcore
            include a monthly premium budget, then fall back to free models again.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Money model</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { t: "Free", d: "No account. Rotate free models. Stop when the pool is empty." },
            { t: "Pay as you go", d: "Try packs. Extra usage, no subscription. Already on /pricing." },
            { t: "Subscribe", d: "Pro $19 · Team $49 · Hardcore $39. Included premium budget, then free again." },
          ].map((c) => (
            <div key={c.t} className="design-card rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">{c.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400 design-muted">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Windows coding app (OpenCode-shaped)</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400 design-muted">
          When shipped, this is the place for assistant + coding: open a folder, run terminal, pick
          a model, connect a provider. Local first so a weak PC can use a 1B–4B Q4 GGUF instead of
          waiting on the public pool.
        </p>
        <ol className="mt-3 space-y-1 text-sm text-zinc-300">
          <li>1. Local Ollama / llama.cpp / LM Studio (small quant on shit specs).</li>
          <li>2. User-connected ChatGPT, Copilot, or BYOK — keys stay on the device.</li>
          <li>3. Optional web free models for cheap chat only — not for dumping the whole repo.</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Honesty</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-400 design-muted">
          <li>Users do not paste an OpenCode key to use the free list.</li>
          <li>Some trial models may train on chats — don’t send secrets.</li>
          <li>Claude.ai Pro login is blocked for third parties. API / OpenRouter only.</li>
          <li>We do not impersonate another product’s client. We identify as Plethora.</li>
          <li>The Windows app is Plethora’s coding surface, not Cursor and not OpenCode itself.</li>
        </ul>
      </section>

      <p className="mt-12 text-xs text-zinc-600 design-muted">
        Canonical product context: PROJECT_CONTEXT.md §16–17 · Live web: /chat · Pricing: /pricing
      </p>
    </article>
  );
}
