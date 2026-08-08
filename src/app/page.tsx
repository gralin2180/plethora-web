import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { HomePage } from "@/components/HomePage";

export const metadata: Metadata = {
  title: "Plethora — All AI Tools Under One Roof",
  description:
    "Free AI tools for every skill level — beginners to experts. Prompt assistant, AI finder, MCP hub, and 50+ utilities.",
};

export default function Page() {
  return (
    <SiteShell>
      <HomePage />
    </SiteShell>
  );
}
