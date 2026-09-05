/**
 * Office AI teammates — maps bots + actions to Plethora Office apps.
 */

import { PLETHORA_BOTS, getBot, botSystemForChat, type ChatBot } from "./chat-bots";

export type OfficeAiAction =
  | "draft"
  | "rewrite"
  | "shorten"
  | "expand"
  | "tone_pro"
  | "tone_casual"
  | "outline"
  | "proofread";

export const OFFICE_AI_ACTIONS: { id: OfficeAiAction; label: string; hint: string }[] = [
  { id: "draft", label: "Draft", hint: "Write from your brief" },
  { id: "rewrite", label: "Rewrite", hint: "Clearer, same meaning" },
  { id: "shorten", label: "Shorten", hint: "Cut fluff" },
  { id: "expand", label: "Expand", hint: "More detail" },
  { id: "tone_pro", label: "More formal", hint: "Executive tone" },
  { id: "tone_casual", label: "More casual", hint: "Human voice" },
  { id: "outline", label: "Outline", hint: "Headings + bullets" },
  { id: "proofread", label: "Proofread", hint: "Grammar + flow" },
];

export const OFFICE_BOT_IDS = [
  "quill",
  "muse",
  "sage",
  "kira",
  "ledger",
  "director",
  "stitch",
  "cipher",
  "echo",
  "nova",
] as const;

export function officeBots(): ChatBot[] {
  const set = new Set(OFFICE_BOT_IDS);
  return PLETHORA_BOTS.filter((b) => set.has(b.id as (typeof OFFICE_BOT_IDS)[number]));
}

export function defaultOfficeBotId(app: string): string {
  const map: Record<string, string> = {
    word: "quill",
    boards: "sage",
    rooms: "echo",
    slack: "echo",
    taskbot: "sage",
    flow: "kira",
    design: "muse",
    cut: "director",
    connect: "ledger",
    infra: "cipher",
  };
  return map[app] || "quill";
}

export function officeBotForApp(app: string): ChatBot {
  return getBot(defaultOfficeBotId(app)) || officeBots()[0];
}

export function actionPrompt(action: OfficeAiAction, ctx: {
  title: string;
  body: string;
  userNote?: string;
  selection?: string;
}): { user: string; system: string } {
  const doc = `Title: ${ctx.title}\n\n${ctx.body.slice(0, 12000)}`;
  const sel = ctx.selection?.trim();
  const base = sel
    ? `Selected text:\n${sel}\n\nFull document for context:\n${doc}`
    : doc;

  const system = `You are an in-document AI for Plethora Office Word (not Microsoft Word).
Return ONLY the replacement document body as clean HTML: <p>, <h1>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>.
No markdown fences. No preamble. No "Here is".`;

  switch (action) {
    case "draft":
      return {
        system,
        user: `Brief: ${ctx.userNote || "Write a solid first draft."}\n\n${base}`,
      };
    case "rewrite":
      return {
        system,
        user: `Rewrite for clarity and flow. Keep facts.\n${sel ? `Rewrite selection only, return full doc with selection replaced.\n` : ""}${base}`,
      };
    case "shorten":
      return {
        system,
        user: `Shorten ~30%. Keep meaning.\n${base}`,
      };
    case "expand":
      return {
        system,
        user: `Expand with useful detail and examples.\n${base}`,
      };
    case "tone_pro":
      return {
        system,
        user: `Make tone more formal / executive. Same structure.\n${base}`,
      };
    case "tone_casual":
      return {
        system,
        user: `Make tone warmer and more conversational. Still professional.\n${base}`,
      };
    case "outline":
      return {
        system,
        user: `Turn into an outline with H2/H3 and bullet lists. Keep title as H1.\n${base}`,
      };
    case "proofread":
      return {
        system,
        user: `Fix grammar, punctuation, awkward phrasing. Minimal content changes.\n${base}`,
      };
    default:
      return { system, user: base };
  }
}

export function chatSystemForOfficeBot(botId: string, app: string): string {
  const bot = getBot(botId);
  if (!bot) return "You are a Plethora Office assistant. Be concise.";
  const ctx =
    app === "slack"
      ? "You are in Plethora Slack (Slack-inspired team chat). Reply in chat message style — short, threaded-friendly. Extract action items when asked."
      : app === "taskbot"
        ? "You help organize tasks and notes captured from team chat."
        : `You are embedded in Plethora Office app: ${app}. Help with docs, copy, structure. When editing, return HTML body only if they ask to replace the doc.`;
  return `${botSystemForChat(bot)}

${ctx}`;
}
