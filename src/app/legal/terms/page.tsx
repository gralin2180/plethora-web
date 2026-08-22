import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Terms of Service — Plethora",
  description: "Terms governing use of Plethora software and services.",
};

export default function TermsPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed text-zinc-400 sm:px-6">
        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        <p className="mt-2 text-xs text-zinc-600">Last updated: August 7, 2026 · Not legal advice; have counsel review before commercial launch.</p>

        <h2 className="mt-10 text-lg font-semibold text-white">1. What Plethora is</h2>
        <p className="mt-2">
          Plethora is a software product that helps users discover AI tools, craft prompts, set up agents
          (web, desktop, terminal, local GPU), and connect MCP/integrations. We primarily orchestrate and
          educate; third-party models and tools are not owned by Plethora.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">2. Your responsibility</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>You are solely responsible for how you use prompts, tools, directories, and automations we suggest.</li>
          <li>You must comply with all laws and third-party terms (OpenAI, Anthropic, Meta, etc.).</li>
          <li>You will not rely on Plethora as legal, medical, financial, or safety-critical advice.</li>
          <li>You verify outputs before acting in the real world (publishing, spending money, legal claims).</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-white">3. Adult & sensitive content</h2>
        <p className="mt-2">
          Plethora may show warnings for 18+ or explicit content and allow you to continue if you
          self-attest eligibility and acceptance. Warnings are not a guarantee of accuracy or legality.
          You may not use Plethora to create or seek sexual content involving minors or other clearly
          illegal content. We may refuse those requests without liability.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">4. Local models & your GPU</h2>
        <p className="mt-2">
          If you connect Ollama, LM Studio, llama.cpp, or other local endpoints, processing may stay on
          your device. You are responsible for securing your machine, API keys, and model licenses. We
          do not warrant local model quality, availability, or safety filters.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">5. Free vs paid features</h2>
        <p className="mt-2">
          Free tiers may include template prompts and limited free-API polish. Paid tiers may include
          higher-quality polish, higher limits, and unlocks. Features may change. No guarantee of
          uninterrupted free third-party APIs.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">6. No warranties</h2>
        <p className="mt-2">
          THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">7. Limitation of liability</h2>
        <p className="mt-2">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, Plethora AND ITS OPERATORS ARE NOT LIABLE FOR INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL,
          OR BUSINESS, ARISING FROM USE OF THE SERVICE, PROMPTS, THIRD-PARTY TOOLS, OR AUTOMATIONS. TOTAL
          LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM,
          OR USD $50 IF YOU PAID NOTHING.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">8. Indemnity</h2>
        <p className="mt-2">
          You agree to indemnify and hold harmless Plethora operators from claims arising from your
          content, your use of suggested tools, or your violation of these Terms or law.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">9. Third-party links</h2>
        <p className="mt-2">
          Directories and tool links (including external AI catalogs and GitHub lists) are provided for
          convenience. We do not control or endorse every listed site or model.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">10. Trading & markets</h2>
        <p className="mt-2">
          Calculators, journals, briefs, and “trade plans” are educational toys. They are not
          investment, tax, or trading advice. You can lose money. You will not sue Plethora because a
          number, model, or prompt was wrong.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">11. Accounts & sign-in</h2>
        <p className="mt-2">
          Signing in with email, Google, Apple, GitHub, Discord, or any other provider means you
          accepted these Terms, the Privacy Policy, and Acceptable Use at the checkbox on the sign-in
          form. If you do not agree, do not create an account or use the service.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-white">12. Changes</h2>
        <p className="mt-2">We may update these Terms; continued use means acceptance of the updated Terms.</p>

        <p className="mt-10">
          See also{" "}
          <Link href="/legal/privacy" className="text-violet-400 hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/legal/acceptable-use" className="text-violet-400 hover:underline">
            Acceptable Use
          </Link>
          .
        </p>
      </article>
    </SiteShell>
  );
}
