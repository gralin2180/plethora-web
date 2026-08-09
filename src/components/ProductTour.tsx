"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import {
  TOUR_EVENT,
  TOUR_STEPS,
  finishProductTour,
  type TourStep,
} from "@/lib/product-tour";
import { X } from "lucide-react";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;

function queryTarget(id: string | null): HTMLElement | null {
  if (!id || typeof document === "undefined") return null;
  const nodes = document.querySelectorAll(`[data-tour="${id}"]`);
  for (const node of nodes) {
    const el = node as HTMLElement;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      continue;
    }
    const r = el.getBoundingClientRect();
    if (r.width >= 2 && r.height >= 2) return el;
  }
  return (nodes[0] as HTMLElement) || null;
}

function measure(el: HTMLElement | null): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 && r.height < 2) return null;
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

export function ProductTour() {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step: TourStep | undefined = TOUR_STEPS[index];
  const total = TOUR_STEPS.length;

  const refresh = useCallback(() => {
    if (!step) return;
    const el = queryTarget(step.target);
    if (el) {
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      // wait a frame for scroll/layout
      requestAnimationFrame(() => setRect(measure(el)));
    } else {
      setRect(null);
    }
  }, [step]);

  useEffect(() => {
    const onStart = () => {
      setIndex(0);
      setActive(true);
    };
    window.addEventListener(TOUR_EVENT, onStart);
    return () => window.removeEventListener(TOUR_EVENT, onStart);
  }, []);

  useLayoutEffect(() => {
    if (!active) return;
    refresh();
    // Auto-skip targets that aren't on this page/layout so the tour never feels broken
    if (!step?.target) return;
    const el = queryTarget(step.target);
    if (!el && index < total - 1) {
      const t = window.setTimeout(() => setIndex((i) => i + 1), 50);
      return () => clearTimeout(t);
    }
  }, [active, index, refresh, step, total]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => refresh();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, refresh]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index]);

  function close() {
    setActive(false);
    setIndex(0);
    setRect(null);
    finishProductTour();
  }

  function next() {
    if (index >= total - 1) {
      close();
      return;
    }
    setIndex((i) => i + 1);
  }

  function back() {
    setIndex((i) => Math.max(0, i - 1));
  }

  if (!active || !step) return null;

  const dialoguePos = dialoguePosition(step, rect);

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Site tour">
      {/* dim + hole */}
      <div className="absolute inset-0" onClick={close} aria-hidden>
        {rect ? (
          <>
            <div className="absolute inset-x-0 top-0 bg-black/70" style={{ height: Math.max(0, rect.top) }} />
            <div
              className="absolute left-0 bg-black/70"
              style={{
                top: rect.top,
                width: Math.max(0, rect.left),
                height: rect.height,
              }}
            />
            <div
              className="absolute right-0 bg-black/70"
              style={{
                top: rect.top,
                left: rect.left + rect.width,
                height: rect.height,
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 bg-black/70"
              style={{ top: rect.top + rect.height }}
            />
            <div
              className="pointer-events-none absolute rounded-xl ring-2 ring-violet-400 ring-offset-2 ring-offset-transparent shadow-[0_0_0_4px_rgba(139,92,246,0.25)] animate-pulse"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-black/70" />
        )}
      </div>

      {/* dialogue card */}
      <div
        className="pointer-events-auto absolute z-[201] w-[min(360px,calc(100vw-1.5rem))] rounded-2xl border border-violet-500/40 bg-[#12121c] p-4 shadow-2xl shadow-black/50"
        style={dialoguePos}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-violet-400">
              Step {index + 1} of {total}
            </p>
            <h2 className="text-base font-semibold text-white">{step.title}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-zinc-300">{step.dialogue}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={close}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={back}
              disabled={index === 0}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-30"
            >
              Back
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
            >
              {index >= total - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
        {/* progress pips */}
        <div className="mt-3 flex flex-wrap justify-center gap-1">
          {TOUR_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1 w-3 rounded-full ${i === index ? "bg-violet-500" : i < index ? "bg-violet-500/40" : "bg-white/10"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function dialoguePosition(
  step: TourStep,
  rect: Rect | null
): CSSProperties {
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardW = Math.min(360, vw - 24);

  if (!rect || step.placement === "center" || !step.target) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const preferTop = step.placement === "top";
  let top = preferTop ? rect.top - 12 : rect.top + rect.height + 12;
  let left = rect.left + rect.width / 2 - cardW / 2;
  left = Math.max(12, Math.min(left, vw - cardW - 12));

  // flip if overflowing viewport
  if (!preferTop && top + 220 > vh) {
    top = rect.top - 12;
    // position from bottom of card conceptually — keep simple absolute top
    top = Math.max(12, rect.top - 200);
  }
  if (preferTop && top < 12) {
    top = rect.top + rect.height + 12;
  }
  top = Math.max(12, Math.min(top, vh - 240));

  return { top, left, width: cardW };
}
