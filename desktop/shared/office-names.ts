/** Customer-facing Plethora Office names — keep in sync with src/lib/office-app-names.ts */

export type OfficeAppKey = "chat" | "tasks" | "docs" | "boards" | "flow" | "rooms" | "mail";

export const OFFICE_NAMES: Record<
  OfficeAppKey,
  { name: string; short: string; letter: string; accent: string; tagline: string }
> = {
  chat: {
    name: "Plethora Chat",
    short: "Chat",
    letter: "C",
    accent: "#611f69",
    tagline: "Team messaging with AI teammates, channels, and @mentions.",
  },
  tasks: {
    name: "Plethora Tasks",
    short: "Tasks",
    letter: "T",
    accent: "#f59e0b",
    tagline: "Capture tasks from Chat — inbox, notes, and quick scans.",
  },
  docs: {
    name: "Plethora Docs",
    short: "Docs",
    letter: "D",
    accent: "#2d6a4f",
    tagline: "Write documents on your PC with Quill AI and clean export.",
  },
  boards: {
    name: "Plethora Boards",
    short: "Boards",
    letter: "B",
    accent: "#0891b2",
    tagline: "Kanban boards for production, IT, and creative drops.",
  },
  flow: {
    name: "Plethora Flow",
    short: "Flow",
    letter: "F",
    accent: "#7c3aed",
    tagline: "Map workflows from a brief — edit steps, export Mermaid.",
  },
  rooms: {
    name: "Plethora Rooms",
    short: "Rooms",
    letter: "R",
    accent: "#ea580c",
    tagline: "Light chat rooms with Plethora Bots on this device.",
  },
  mail: {
    name: "Plethora Mail",
    short: "Mail",
    letter: "M",
    accent: "#2563eb",
    tagline: "Local inbox, compose, and AI-drafted replies.",
  },
};
