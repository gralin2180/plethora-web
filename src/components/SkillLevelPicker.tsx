"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SKILL_LEVELS, type SkillLevel } from "@/lib/skill-levels";
import { Check } from "lucide-react";

export function SkillLevelPicker({
  initialLevel,
  onComplete,
}: {
  initialLevel?: SkillLevel;
  onComplete?: () => void;
}) {
  const [selected, setSelected] = useState<SkillLevel>(initialLevel ?? "beginner");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ skill_level: selected, onboarding_complete: true })
      .eq("id", user.id);

    setSaving(false);
    onComplete?.();
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {SKILL_LEVELS.map((level) => (
        <button
          key={level.id}
          type="button"
          onClick={() => setSelected(level.id)}
          className={`w-full rounded-xl border p-5 text-left transition ${
            selected === level.id
              ? "border-violet-500 bg-violet-500/10"
              : "border-white/10 bg-white/[0.02] hover:border-white/20"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-white">{level.label}</p>
              <p className="mt-0.5 text-sm text-violet-300/80">{level.tagline}</p>
              <p className="mt-2 text-sm text-zinc-500">{level.description}</p>
            </div>
            {selected === level.id && (
              <Check className="h-5 w-5 shrink-0 text-violet-400" />
            )}
          </div>
        </button>
      ))}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-violet-600 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Continue to dashboard"}
      </button>
    </div>
  );
}
