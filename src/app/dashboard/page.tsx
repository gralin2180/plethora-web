import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteShell } from "@/components/SiteShell";
import {
  getSkillLevelLabel,
  getRecommendedToolsForSkill,
  type SkillLevel,
} from "@/lib/skill-levels";
import { PLATFORM_TOOLS } from "@/lib/tools-registry";
import { ArrowRight, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard — Plethora",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_complete) redirect("/onboarding");

  const skillLevel = (profile.skill_level as SkillLevel) ?? "beginner";
  const recommendedIds = getRecommendedToolsForSkill(skillLevel);
  const recommendedTools = PLATFORM_TOOLS.filter((t) =>
    recommendedIds.includes(t.slug)
  );

  const { data: usageRows } = await supabase
    .from("usage_daily")
    .select("tool_id, run_count")
    .eq("user_id", user.id)
    .eq("usage_date", new Date().toISOString().split("T")[0]);

  const totalRunsToday =
    usageRows?.reduce((sum, row) => sum + row.run_count, 0) ?? 0;

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Hey, {profile.display_name ?? "there"}
            </h1>
            <p className="mt-1 text-zinc-500">
              {getSkillLevelLabel(skillLevel)} · {profile.subscription_plan} plan ·{" "}
              {totalRunsToday} runs today
            </p>
          </div>
          {profile.subscription_plan === "free" && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
            >
              <Zap className="h-4 w-4" />
              Upgrade plan
            </Link>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
            <h2 className="font-semibold text-white">Recommended for your level</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Picked for {getSkillLevelLabel(skillLevel).toLowerCase()} users
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {recommendedTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={
                    tool.slug === "prompt-assistant" || tool.slug === "ai-finder"
                      ? `/${tool.slug}`
                      : `/tools/${tool.slug}`
                  }
                  className="rounded-xl border border-white/10 p-4 hover:border-violet-500/40"
                >
                  <p className="font-medium text-white">{tool.name}</p>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                    {tool.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-semibold text-white">Quick actions</h2>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/ai-finder"
                    className="flex items-center justify-between text-sm text-zinc-400 hover:text-white"
                  >
                    Find AI for a task <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/prompt-assistant"
                    className="flex items-center justify-between text-sm text-zinc-400 hover:text-white"
                  >
                    Fix my prompt <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/onboarding"
                    className="flex items-center justify-between text-sm text-zinc-400 hover:text-white"
                  >
                    Change skill level <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
                {skillLevel === "advanced" || skillLevel === "expert" ? (
                  <li>
                    <Link
                      href="/hardcore"
                      className="flex items-center justify-between text-sm text-red-400 hover:text-red-300"
                    >
                      Hardcore bundle <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>

            {usageRows && usageRows.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="font-semibold text-white">Today&apos;s usage</h2>
                <ul className="mt-4 space-y-2">
                  {usageRows.map((row) => (
                    <li
                      key={row.tool_id}
                      className="flex justify-between text-sm text-zinc-400"
                    >
                      <span>{row.tool_id}</span>
                      <span>{row.run_count} runs</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
