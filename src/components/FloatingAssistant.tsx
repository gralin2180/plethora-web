"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { ChatMode } from "@/components/ChatMode";
import { TOUR_EVENT } from "@/lib/product-tour";

const HISTORY_KEY = "plethora.chat.history.v1";
const POS_KEY = "plethora.fab.pos.v1";

type Pos = { x: number; y: number };

export function FloatingAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [pos, setPos] = useState<Pos | null>(null);
  const drag = useRef<{
    kind: "fab" | "panel";
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) setPos(JSON.parse(raw) as Pos);
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    const onTour = () => setOpen(false);
    window.addEventListener(TOUR_EVENT, onTour);
    return () => window.removeEventListener(TOUR_EVENT, onTour);
  }, []);

  function persist(next: Pos) {
    setPos(next);
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(next));
    } catch {
      /* */
    }
  }

  function onPointerDown(kind: "fab" | "panel", e: PointerEvent<HTMLElement>) {
    const t = e.currentTarget as HTMLElement;
    const r = t.getBoundingClientRect();
    drag.current = { kind, ox: e.clientX - r.left, oy: e.clientY - r.top, moved: false };
    t.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.ox;
    const dy = e.clientY - d.oy;
    if (Math.abs(e.movementX) + Math.abs(e.movementY) > 2) d.moved = true;
    persist({
      x: Math.max(8, Math.min(window.innerWidth - 72, dx)),
      y: Math.max(8, Math.min(window.innerHeight - 72, dy)),
    });
  }

  function onPointerUp(e: PointerEvent<HTMLElement>, kind: "fab" | "panel") {
    const d = drag.current;
    drag.current = null;
    if (kind === "fab" && d && !d.moved) setOpen((o) => !o);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* */
    }
  }

  function clearChat() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
    setChatKey((k) => k + 1);
  }

  const fabStyle = pos
    ? { left: pos.x, top: pos.y, right: "auto" as const, bottom: "auto" as const }
    : undefined;
  const panelStyle = pos
    ? {
        left: Math.max(8, pos.x - 280),
        top: Math.max(8, pos.y - 520),
        right: "auto" as const,
        bottom: "auto" as const,
      }
    : undefined;

  if (pathname && /^\/projects\/.+/.test(pathname)) return null;

  return (
    <>
      {open && (
        <div
          style={panelStyle}
          className="fixed bottom-24 right-4 z-[90] flex h-[min(560px,70vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-violet-500/40 bg-[#0b0b12] print:hidden"
        >
          <div
            className="flex cursor-grab items-center justify-between border-b border-white/10 px-3 py-2 active:cursor-grabbing"
            onPointerDown={(e) => onPointerDown("panel", e)}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => onPointerUp(e, "panel")}
          >
            <div>
              <p className="text-sm font-semibold text-white">Plethora Assistant</p>
              <p className="text-[10px] text-zinc-500">Drag the bar · guide stays on this site</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={clearChat}
                className="text-[10px] text-zinc-400 hover:text-white hover:underline"
              >
                Clear
              </button>
              <Link
                href="/chat"
                onPointerDown={(e) => e.stopPropagation()}
                className="text-[10px] text-violet-400 hover:underline"
              >
                Full chat
              </Link>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
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
        style={fabStyle}
        onPointerDown={(e) => onPointerDown("fab", e)}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => onPointerUp(e, "fab")}
        className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 cursor-grab items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-500 print:hidden active:cursor-grabbing"
        aria-label="Open Plethora assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
