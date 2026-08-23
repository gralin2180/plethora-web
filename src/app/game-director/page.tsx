import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { GameEngineStudio } from "@/components/GameEngineStudio";
import { Gamepad2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Game Director — make games with AI | Plethora",
  description:
    "Production desk for games: pitch, GDD, systems, art, assets, audio, Godot 4, and web slices. Prompts + local file refs — not a browser Unity compiler.",
};

export default function GameDirectorPage() {
  return (
    <SiteShell>
      <div className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
              <Gamepad2 className="h-3.5 w-3.5" />
              Game Director
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Make games with prompts — not twenty tabs
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
              A first-class producer desk: pipeline chips from pitch to build, Godot 4 first, web
              slice when you need a quick playable. Uploads store file names on your device only.
              Generators via MCP stay credit-based later.
            </p>
          </div>
          <GameEngineStudio />
        </div>
      </div>
    </SiteShell>
  );
}
