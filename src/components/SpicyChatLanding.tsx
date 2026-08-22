"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, HardDrive, Hammer, Shield, Wrench } from "lucide-react";
import { ChatMode } from "@/components/ChatMode";
import { SpicyAvatarStudio } from "@/components/SpicyAvatarStudio";
import { saveAdultSession, loadAdultSession } from "@/lib/chat-personality";
import type { SpicyAvatar } from "@/lib/spicy-avatars";

const AGE_KEY = "plethora.spicy.age.v1";

export function SpicyChatLanding() {
  const [ok, setOk] = useState(false);
  const [companion, setCompanion] = useState<SpicyAvatar | null>(null);

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

  if (!ok) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
          <Shield className="mx-auto h-8 w-8 text-rose-300" />
          <p className="mt-3 text-lg font-medium text-white">Spicy chat is 18+</p>
          <p className="mt-2 text-sm text-zinc-500">
            Explicit companion chat. Everyone in the scene must be an adult. If you are not 18,
            leave.
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
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden sm:h-[calc(100dvh-4rem)]">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3 py-3 sm:px-4 lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-2">
          <ChatMode embedded room="spicy" companion={companion} />
        </div>
        <aside className="flex max-h-[42vh] w-full shrink-0 flex-col gap-3 overflow-y-auto lg:max-h-none lg:w-72">
          <SpicyAvatarStudio onSelect={setCompanion} />
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Also here</p>
          {[
            {
              href: "/",
              icon: Flame,
              title: "Home",
              body: "Tools and rooms on one desk.",
            },
            {
              href: "/local-llms",
              icon: HardDrive,
              title: "Private local LLMs",
              body: "Run the model on your GPU.",
            },
            {
              href: "/tools",
              icon: Wrench,
              title: "Free tools",
              body: "Captions, PDF, Shorts cutter.",
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
              className="block rounded-2xl border border-white/10 bg-white/[0.03] p-3 hover:border-rose-500/30"
            >
              <x.icon className="mb-1.5 h-4 w-4 text-rose-300" />
              <p className="text-sm font-medium text-white">{x.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{x.body}</p>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}
