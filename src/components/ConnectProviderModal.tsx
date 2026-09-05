"use client";

import { GetStartedAiClient } from "@/components/GetStartedAiClient";
import { X } from "lucide-react";

export function ConnectProviderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/75 p-4 pt-8 sm:pt-12">
      <div className="relative w-full max-w-lg">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 right-0 z-10 rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white sm:-right-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <GetStartedAiClient embedded onClose={onClose} />
      </div>
    </div>
  );
}
