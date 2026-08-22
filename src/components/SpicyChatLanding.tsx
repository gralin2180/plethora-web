"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, HardDrive, Hammer, Shield, Wrench } from "lucide-react";
import { ChatMode } from "@/components/ChatMode";
import { saveAdultSession, loadAdultSession } from "@/lib/chat-personality";

const AGE_KEY = "plethora.spicy.age.v1";

export function SpicyChatLanding() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    try {
      setOk(localStorage.getItem(AGE_KEY) === "1" && loadAdultSession());
    } catch {
      /* */
    }
  }, []);

  function confirm() {
    saveAdultSession();
    try {
      localStorage.setItem(AGE_KEY, "1");
    } catch {
      /* */
    }
    setOk(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 overflow-hidden rounded-3xl border border-rose-500/25 bg-gradient-to-br from-rose-600/20 via-[#160b12] to-[#080810] p-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-300">
          <Flame className="h-3.5 w-3.5" />
          18+ AI chat
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
          Spicy AI chat — girlfriend energy, dirty talk, roleplay
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400">
          Free NSFW companion chat for adults. Confirm you are 18+. Sexual content involving
          minors is blocked. After you land, the rest of Plethora is one click: tools, local
          models on your PC, App Maker.
        </p>
      </div>

      {!ok ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
          <Shield className="mx-auto h-8 w-8 text-rose-300" />
          <p className="mt-3 text-lg font-medium text-white">Are you 18 or older?</p>
          <p className="mt-2 text-sm text-zinc-500">
            This room is explicit on purpose. Everyone in the scene must be an adult. If you are
            not 18, leave.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={confirm}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500"
            >
              I am 18+ — enter
            </button>
            <Link
              href="/"
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-zinc-300"
            >
              Take me home
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="min-h-[560px] rounded-2xl border border-white/10 bg-black/30 p-3">
            <ChatMode embedded room="spicy" />
          </div>
          <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Also in Plethora
            </p>
            {[
              {
                href: "/",
                icon: Flame,
                title: "Your desk",
                body: "Home remembers your tools and apps.",
              },
              {
                href: "/local-llms",
                icon: HardDrive,
                title: "Private local LLMs",
                body: "Run the spicy model on your GPU — we never see the weights.",
              },
              {
                href: "/tools",
                icon: Wrench,
                title: "Free tools",
                body: "Captions, PDF, Shorts cutter, converters.",
              },
              {
                href: "/tools/build-your-tool",
                icon: Hammer,
                title: "App Maker",
                body: "Build a web app, then chat to change it.",
              },
            ].map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-rose-500/30"
              >
                <x.icon className="mb-2 h-4 w-4 text-rose-300" />
                <p className="text-sm font-medium text-white">{x.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{x.body}</p>
              </Link>
            ))}
          </aside>
        </div>
      )}
    </div>
  );
}
