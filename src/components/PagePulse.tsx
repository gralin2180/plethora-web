"use client";

export function PagePulse({
  title = "Loading",
  hint,
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-[#0c0c14] p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14">
            <span className="absolute inset-0 rounded-2xl border border-violet-400/40" />
            <span className="absolute inset-1 animate-spin rounded-xl border-2 border-transparent border-t-violet-400 border-r-fuchsia-400" />
            <span className="absolute inset-3 animate-pulse rounded-lg bg-violet-500/30" />
          </div>
          <div>
            <p className="text-sm font-medium tracking-wide text-violet-200">{title}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {hint || "Pulling live data — this shouldn’t take long."}
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-white/[0.04]"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
