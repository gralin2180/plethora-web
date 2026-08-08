import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Plethora",
  description: "How Plethora handles data, local backends, and free/paid APIs.",
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed text-zinc-400 sm:px-6">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-xs text-zinc-600">Last updated: August 7, 2026</p>

        <h2 className="mt-10 text-lg font-semibold text-white">Data we may process</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Account data if you sign up (email, auth IDs via Supabase).</li>
          <li>Usage metrics (which tools you run, counts) for limits and product improvement.</li>
          <li>Prompts/tasks sent to our polish API when you use free or paid cloud polish.</li>
          <li>Billing metadata if you pay (handled by payment processors when connected).</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-white">Local GPU backends</h2>
        <p className="mt-2">
          Profiles for Ollama, LM Studio, llama.cpp, and custom endpoints are intended to stay in your
          browser/desktop storage by default. We do not want your local model traffic unless you
          explicitly use a cloud polish path.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">Third parties</h2>
        <p className="mt-2">
          When you open Claude, ChatGPT, directories, or other sites, their policies apply. When free/paid
          polish calls a model provider, that provider processes the draft prompt.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">Security</h2>
        <p className="mt-2">
          We aim to use industry-standard practices (HTTPS, access control, least privilege). No method
          is 100% secure. Report issues responsibly.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">Your choices</h2>
        <p className="mt-2">
          Use template-only mode and local backends to minimize cloud sharing. Delete your account when
          account deletion is enabled in dashboard flows.
        </p>

        <p className="mt-10">
          <Link href="/legal/terms" className="text-violet-400 hover:underline">
            Terms of Service
          </Link>
        </p>
      </article>
    </SiteShell>
  );
}
