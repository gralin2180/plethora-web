"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChatMode } from "@/components/ChatMode";
import { getBot } from "@/lib/chat-bots";
import { loadAdultSession, saveAdultSession } from "@/lib/chat-personality";
import { Shield } from "lucide-react";

const AGE_KEY = "plethora.spicy.age.v1";

export function BotChatRoom({ id }: { id: string }) {
  const bot = getBot(id);
  const [adultOk, setAdultOk] = useState(!bot?.adultOnly);

  useEffect(() => {
    if (!bot?.adultOnly) {
      setAdultOk(true);
      return;
    }
    try {
      setAdultOk(localStorage.getItem(AGE_KEY) === "1" && loadAdultSession());
    } catch {
      setAdultOk(false);
    }
  }, [bot]);

  if (!bot) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-white">Bot not found.</p>
        <Link href="/bots" className="mt-4 inline-block text-sm text-violet-300 hover:underline">
          Back to bots
        </Link>
      </div>
    );
  }

  function confirmAdult() {
    saveAdultSession();
    try {
      localStorage.setItem(AGE_KEY, "1");
    } catch {
      /* */
    }
    setAdultOk(true);
  }

  if (bot.adultOnly && !adultOk) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
          <Shield className="mx-auto h-8 w-8 text-rose-300" />
          <p className="mt-3 text-lg font-medium text-white">{bot.name} is 18+</p>
          <p className="mt-2 text-sm text-zinc-500">
            Explicit companion chat. Everyone in the scene must be an adult.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={confirmAdult}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500"
            >
              I am 18+ — chat with {bot.name}
            </button>
            <Link
              href="/bots"
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-zinc-300"
            >
              Back to bots
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <ChatMode bot={bot} room={bot.adultOnly ? "spicy" : "main"} />
      </div>
    </div>
  );
}
