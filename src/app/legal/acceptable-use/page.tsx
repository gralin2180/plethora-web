import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Acceptable Use — Plethora",
  description: "What is allowed, what is refused, and adult content policy.",
};

export default function AcceptableUsePage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed text-zinc-400 sm:px-6">
        <h1 className="text-3xl font-bold text-white">Acceptable Use Policy</h1>
        <p className="mt-2 text-xs text-zinc-600">Last updated: August 7, 2026</p>

        <h2 className="mt-10 text-lg font-semibold text-white">Allowed</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Learning AI, marketing, coding, research, business, creative work.</li>
          <li>Adult / 18+ content between consenting adults, with on-product warnings.</li>
          <li>Sensitive fiction/research topics after warnings where shown.</li>
          <li>Local model use on hardware you control.</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-white">Refused (hard)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Sexual content involving minors (any format).</li>
          <li>Assistance aimed at committing violent crimes, terrorism, or large-scale illegal fraud.</li>
          <li>Malware designed to harm others’ systems without authorization.</li>
          <li>Attempts to bypass security of Plethora or steal other users’ data.</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-white">We do not “parent” adult use</h2>
        <p className="mt-2">
          Outside hard illegal categories, Plethora prefers warnings + user choice over silent
          censorship. Third-party models may still refuse; that is their policy, not always ours.
        </p>

        <p className="mt-10">
          <Link href="/legal/terms" className="text-violet-400 hover:underline">
            Back to Terms
          </Link>
        </p>
      </article>
    </SiteShell>
  );
}
