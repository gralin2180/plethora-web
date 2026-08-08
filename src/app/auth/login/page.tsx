import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign In — Plethora",
};

export default function LoginPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-zinc-500">Sign in to track usage and save prompts.</p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <AuthForm mode="login" />
        </div>
      </div>
    </SiteShell>
  );
}
