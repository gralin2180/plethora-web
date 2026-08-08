"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  HardDrive,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import type { User as SupaUser } from "@supabase/supabase-js";

type NavItem = {
  href: string;
  label: string;
  tour: string;
  hint?: string;
  accent?: "local" | "hardcore";
};

/** Primary destinations — keep the bar short */
const PRIMARY: NavItem[] = [
  { href: "/tools", label: "Tools", tour: "nav-tools" },
  { href: "/learn", label: "Learn", tour: "nav-learn" },
  { href: "/chat", label: "Chat", tour: "nav-chat" },
  { href: "/ai-finder", label: "Finder", tour: "nav-ai-finder" },
  { href: "/pricing", label: "Pricing", tour: "nav-pricing" },
];

/** Everything else lives under More — no duplicates on the bar */
const MORE: NavItem[] = [
  {
    href: "/prompt-assistant",
    label: "Prompt Assistant",
    tour: "nav-prompt",
    hint: "Messy idea → sharp prompt",
  },
  {
    href: "/install",
    label: "Install Hub",
    tour: "nav-install",
    hint: "Apps & local stack",
  },
  {
    href: "/mcp",
    label: "MCP Hub",
    tour: "nav-mcp",
    hint: "Servers for Cursor / Claude",
  },
  {
    href: "/settings/backends",
    label: "Local AI",
    tour: "nav-backends",
    hint: "Your GPU & backends",
    accent: "local",
  },
  {
    href: "/settings/personal",
    label: "Personal context",
    tour: "nav-personal",
    hint: "What the assistant should know",
  },
  {
    href: "/hardcore",
    label: "Hardcore",
    tour: "nav-hardcore",
    hint: "Full access tier",
    accent: "hardcore",
  },
];

function linkTone(href: string, pathname: string, accent?: NavItem["accent"]) {
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  if (accent === "hardcore") {
    return active ? "text-red-300" : "text-red-400/90 hover:text-red-300";
  }
  if (accent === "local") {
    return active ? "text-cyan-300" : "text-cyan-400/90 hover:text-cyan-300";
  }
  return active ? "text-white" : "text-zinc-400 hover:text-white";
}

export function Header({ user = null }: { user?: SupaUser | null }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreMenuId = useId();

  useEffect(() => {
    setMoreOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMoreOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b12]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          data-tour="logo"
          className="flex shrink-0 items-center gap-2 font-semibold text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>Plethora</span>
        </Link>

        {/* Desktop primary + more */}
        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex"
          aria-label="Main"
        >
          {PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${linkTone(item.href, pathname)}`}
            >
              {item.label}
            </Link>
          ))}

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls={moreMenuId}
              onClick={() => setMoreOpen((v) => !v)}
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
                moreOpen || MORE.some((m) => pathname.startsWith(m.href))
                  ? "text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              More
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${moreOpen ? "rotate-180" : ""}`}
              />
            </button>
            {moreOpen && (
              <div
                id={moreMenuId}
                role="menu"
                className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-[#12121a] p-1.5 shadow-2xl shadow-black/50"
              >
                {MORE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    data-tour={item.tour}
                    onClick={() => setMoreOpen(false)}
                    className={`block rounded-lg px-3 py-2 transition hover:bg-white/5 ${linkTone(item.href, pathname, item.accent)}`}
                  >
                    <span className="block text-sm font-medium">{item.label}</span>
                    {item.hint && (
                      <span className="mt-0.5 block text-[11px] font-normal text-zinc-500">
                        {item.hint}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/settings/backends"
            data-tour="link-backends"
            className="hidden items-center gap-1.5 rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1.5 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20 sm:inline-flex"
            title="Local AI backends"
          >
            <HardDrive className="h-3.5 w-3.5" />
            Local AI
          </Link>
          <UserMenu user={user} />
          <button
            type="button"
            className="inline-flex rounded-lg border border-white/10 p-2 text-zinc-300 hover:bg-white/5 md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0b0b12] md:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-3 py-3" aria-label="Mobile">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Main
            </p>
            {PRIMARY.map((item) => (
              <Link
                key={`m-${item.href}`}
                href={item.href}
                data-tour={item.tour}
                className={`block rounded-lg px-3 py-2.5 text-sm ${linkTone(item.href, pathname)}`}
              >
                {item.label}
              </Link>
            ))}
            <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              More
            </p>
            {MORE.map((item) => (
              <Link
                key={`m-${item.href}`}
                href={item.href}
                data-tour={item.tour}
                className={`block rounded-lg px-3 py-2.5 text-sm ${linkTone(item.href, pathname, item.accent)}`}
              >
                <span className="font-medium">{item.label}</span>
                {item.hint && (
                  <span className="mt-0.5 block text-[11px] font-normal text-zinc-500">
                    {item.hint}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#080810]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <p className="font-semibold text-white">Plethora</p>
            <p className="mt-2 text-sm text-zinc-500">
              Find it. Run it. One roof. Tools, prompts, local AI — stop tab-hopping.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/settings/backends"
                data-tour="link-backends"
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
              >
                <HardDrive className="h-4 w-4" />
                Local AI backends →
              </Link>
              <Link
                href="/settings/personal"
                data-tour="link-personal"
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 hover:text-violet-300"
              >
                Personal context →
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/learn" className="hover:text-white">
                  Learn how to use AI
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-white">
                  All Tools
                </Link>
              </li>
              <li>
                <Link href="/ai-finder" className="hover:text-white">
                  AI Finder
                </Link>
              </li>
              <li>
                <Link href="/install" className="hover:text-white">
                  Install Hub
                </Link>
              </li>
              <li>
                <Link href="/mcp" className="hover:text-white">
                  MCP Servers
                </Link>
              </li>
              <li>
                <Link href="/learn" className="hover:text-white">
                  Learn AI
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">For Everyone</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li>Creators & solopreneurs</li>
              <li>Marketers & ad teams</li>
              <li>Developers & builders</li>
              <li>Office · Excel · slides</li>
              <li>
                <Link href="/hardcore" className="text-red-400/80 hover:text-red-300">
                  Hardcore All-Access →
                </Link>
              </li>
              <li>
                <Link href="/pricing#enterprise" className="hover:text-white">
                  Enterprise
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/legal/terms" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/legal/acceptable-use" className="hover:text-white">
                  Acceptable Use
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} Plethora. Educational tooling — you are responsible for how
          you use AI.{" "}
          <Link href="/legal/terms" className="hover:text-zinc-400">
            Terms
          </Link>
        </p>
      </div>
    </footer>
  );
}
