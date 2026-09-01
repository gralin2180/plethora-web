"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Sparkles } from "lucide-react";
import {
  OFFICE_APPS,
  OFFICE_DESKS,
  OFFICE_INDUSTRIES,
  officeAppsForIndustry,
  type OfficeDesk,
} from "@/lib/plethora-office";
import { officeLicenseFor, parsePlanId, type OfficeLicense } from "@/lib/plans";

export function OfficeSuite() {
  const [industry, setIndustry] = useState<string>("all");
  const [desk, setDesk] = useState<OfficeDesk | "all">("all");
  const [license, setLicense] = useState<OfficeLicense>("web");

  const apps = useMemo(() => {
    const base = industry === "all" ? OFFICE_APPS : officeAppsForIndustry(industry);
    if (desk === "all") return base;
    return base.filter((a) => a.desk === desk);
  }, [industry, desk]);

  const pack = OFFICE_INDUSTRIES.find((i) => i.id === industry);

  useEffect(() => {
    void fetch("/api/chat", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { signedIn?: boolean; entitlement?: { plan?: string } }) => {
        if (!d.signedIn) setLicense("web");
        else setLicense(officeLicenseFor(parsePlanId(d.entitlement?.plan)));
      })
      .catch(() => setLicense("web"));
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start gap-3">
        <Building2 className="mt-1 h-8 w-8 text-cyan-300" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-400">Suite</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Plethora Office</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            AI-driven office apps for IT, game dev, media, production, fashion, and film. Inspired by
            Word, Slack, Trello, Figma, OBS, Excel, PowerPoint — not those products. Browser rooms;
            heavy media still finishes on your machine.
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            Sold like a suite: free web apps, paid Personal / Business for commercial use — we are
            not Microsoft 365.
          </p>
        </div>
      </div>

      <div
        className={`mt-6 rounded-2xl border p-4 sm:flex sm:items-center sm:justify-between ${
          license === "web"
            ? "border-amber-500/30 bg-amber-500/10"
            : "border-cyan-500/25 bg-cyan-500/5"
        }`}
      >
        <div>
          <p className="text-sm font-medium text-white">
            {license === "web"
              ? "Free Office — personal / evaluation"
              : license === "personal"
                ? "Office Personal — commercial, one person"
                : "Office Business — studio / shop license"}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {license === "web"
              ? "Apps stay free in the browser. Paid plans add a commercial license and more AI in Chat + Office."
              : "Commercial use of this suite is included on your plan. Pro / Team include the matching Office license."}
          </p>
        </div>
        <Link
          href="/pricing#office"
          className="mt-3 inline-flex shrink-0 rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white hover:bg-cyan-500 sm:mt-0"
        >
          {license === "web" ? "See Office plans" : "Manage plan"}
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIndustry("all")}
          className={`rounded-full px-3 py-1.5 text-xs ${
            industry === "all" ? "bg-cyan-600 text-white" : "border border-white/15 text-zinc-400"
          }`}
        >
          All desks
        </button>
        {OFFICE_INDUSTRIES.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => setIndustry(i.id)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              industry === i.id ? "bg-cyan-600 text-white" : "border border-white/15 text-zinc-400"
            }`}
          >
            {i.name}
          </button>
        ))}
      </div>

      {pack ? (
        <p className="mt-3 text-sm text-zinc-500">
          {pack.blurb}{" "}
          {pack.extraHrefs.map((e) => (
            <Link key={e.href} href={e.href} className="mr-3 text-violet-300 hover:underline">
              {e.label}
            </Link>
          ))}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setDesk("all")}
          className={`rounded-full px-2.5 py-1 text-[11px] ${
            desk === "all" ? "bg-white/15 text-white" : "text-zinc-500 hover:text-white"
          }`}
        >
          Every app
        </button>
        {OFFICE_DESKS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDesk(d.id)}
            className={`rounded-full px-2.5 py-1 text-[11px] ${
              desk === d.id ? "bg-white/15 text-white" : "text-zinc-500 hover:text-white"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((a) => (
          <li key={a.id}>
            <Link
              href={a.href}
              className="flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4 hover:border-cyan-500/40"
            >
              <p className="text-sm font-medium text-white">{a.name}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">Like {a.like}</p>
              <p className="mt-2 flex-1 text-sm text-zinc-400">{a.tagline}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-300">
                <Sparkles className="h-3 w-3" />
                Open
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
