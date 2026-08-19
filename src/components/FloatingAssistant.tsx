"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import { ChatMode } from "@/components/ChatMode";
import { TOUR_EVENT } from "@/lib/product-tour";

const HISTORY_KEY = "plethora.chat.history.v1";

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);

  // Clear the panel so tour highlights aren't buried under the chat card
  useEffect(() => {
    const onTour = () => setOpen(false);
    window.addEventListener(TOUR_EVENT, onTour);
    return () => window.removeEventListener(TOUR_EVENT, onTour);
  }, []);

  function clearChat() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
    setChatKey((k) => k + 1);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[90] flex h-[min(560px,70vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-violet-500/40 bg-[#0b0b12] print:hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-white">Plethora Assistant</p>
              <p className="text-[10px] text-zinc-500">One roof · tools · anything</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearChat}
                className="text-[10px] text-zinc-400 hover:text-white hover:underline"
              >
                Clear
              </button>
              <Link href="/chat" className="text-[10px] text-violet-400 hover:underline">
                Full chat
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 p-2">
            <ChatMode key={chatKey} embedded />
          </div>
        </div>
      )}

      <button
        type="button"
        data-tour="fab-assistant"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-500 print:hidden"
        aria-label="Open Plethora assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
