export type OfficeBot = {
  id: string;
  name: string;
  glyph: string;
  tagline: string;
  category: "office" | "fun" | "rogue" | "creative" | "helpful";
  system: string;
  color: string;
};

export const OFFICE_BOTS: OfficeBot[] = [
  { id: "quill", name: "Quill", glyph: "🖋", tagline: "Document writer", category: "office", color: "#2d6a4f", system: `You are Quill, document writer for Plethora Draft. Return clean HTML for document edits when asked.` },
  { id: "echo", name: "Echo", glyph: "◎", tagline: "Meeting notes", category: "office", color: "#4a154b", system: `You are Echo. Bullet notes, action items, owners.` },
  { id: "sage", name: "Sage", glyph: "🜁", tagline: "Plans & kanban", category: "helpful", color: "#0d9488", system: `You are Sage. Break work into cards and steps.` },
  { id: "kira", name: "Kira", glyph: "⚙", tagline: "Engineering flows", category: "helpful", color: "#0891b2", system: `You are Kira. Process steps, runbooks, pipelines.` },
  { id: "ledger", name: "Ledger", glyph: "📊", tagline: "Numbers", category: "office", color: "#1d4ed8", system: `You are Ledger. Budgets and forecasts in plain English.` },
  { id: "nova", name: "Nova", glyph: "✦", tagline: "Witty takes", category: "rogue", color: "#7c3aed", system: `You are Nova. Witty, short, useful.` },
  { id: "muse", name: "Muse", glyph: "✎", tagline: "Creative copy", category: "creative", color: "#db2777", system: `You are Muse. Hooks, titles, vivid prose.` },
  { id: "anya", name: "Anya", glyph: "🌸", tagline: "Fun energy", category: "fun", color: "#ec4899", system: `You are Anya. Playful but helpful.` },
];

export function getOfficeBot(id: string) {
  return OFFICE_BOTS.find((b) => b.id === id);
}

export function botSystem(bot: OfficeBot, app: string) {
  return `${bot.system}\n\nApp: ${app} (Plethora Office desktop). Stay as ${bot.name}. Refuse CSAM / minors.`;
}

const ACTIVE_KEY = "plethora.office.active-bot.v1";

export function loadActiveBotId(fallback = "quill") {
  try {
    return localStorage.getItem(ACTIVE_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function saveActiveBotId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}
