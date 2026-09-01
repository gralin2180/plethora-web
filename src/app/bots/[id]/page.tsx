import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { BotChatRoom } from "@/components/BotChatRoom";
import { getBot, PLETHORA_BOTS } from "@/lib/chat-bots";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return PLETHORA_BOTS.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bot = getBot(id);
  if (!bot) return { title: "Bot not found — Plethora" };
  return {
    title: `${bot.name} — Plethora bots`,
    description: bot.tagline,
  };
}

export default async function BotPage({ params }: Props) {
  const { id } = await params;
  if (!getBot(id)) notFound();
  return (
    <SiteShell>
      <BotChatRoom id={id} />
    </SiteShell>
  );
}
