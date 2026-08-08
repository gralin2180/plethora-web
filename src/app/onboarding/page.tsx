import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteShell } from "@/components/SiteShell";
import { SkillLevelPicker } from "@/components/SkillLevelPicker";
import type { SkillLevel } from "@/lib/skill-levels";

export const metadata: Metadata = {
  title: "Choose Your Level — Plethora",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signup");

  const { data: profile } = await supabase
    .from("profiles")
    .select("skill_level, onboarding_complete")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_complete) redirect("/dashboard");

  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold text-white">What&apos;s your AI level?</h1>
        <p className="mt-2 text-zinc-500">
          We tailor tools, recommendations, and complexity to match — whether you&apos;re
          brand new or running terminal agents daily.
        </p>
        <div className="mt-8">
          <SkillLevelPicker
            initialLevel={(profile?.skill_level as SkillLevel) ?? "beginner"}
          />
        </div>
      </div>
    </SiteShell>
  );
}
