/**
 * Plethora Office — product names (Plethora Chat, Docs, etc.)
 * Internal folder ids stay stable for paths and routes.
 */

export type OfficeAppId = "relay" | "scout" | "draft" | "grid" | "trace" | "nook" | "mail";

export type OfficeAppMeta = {
  id: OfficeAppId;
  name: string;
  inspiredBy: string;
  tagline: string;
  desktopFolder: string;
  webHref: string;
  installerBaseName: string;
};

export const OFFICE_APP_NAMES: Record<OfficeAppId, OfficeAppMeta> = {
  relay: {
    id: "relay",
    name: "Plethora Chat",
    inspiredBy: "team chat",
    tagline: "Team messaging with Echo AI, channels, and @mentions.",
    desktopFolder: "desktop/slack",
    webHref: "/office/slack",
    installerBaseName: "Plethora-Chat-Setup",
  },
  scout: {
    id: "scout",
    name: "Plethora Tasks",
    inspiredBy: "task capture",
    tagline: "Watches Chat — tasks, notes, screenshots, and your @inbox.",
    desktopFolder: "desktop/scout",
    webHref: "/office/taskbot",
    installerBaseName: "Plethora-Tasks-Setup",
  },
  draft: {
    id: "draft",
    name: "Plethora Docs",
    inspiredBy: "documents",
    tagline: "Rich editor with Quill AI on your PC.",
    desktopFolder: "desktop/draft",
    webHref: "/office/word",
    installerBaseName: "Plethora-Docs-Setup",
  },
  grid: {
    id: "grid",
    name: "Plethora Boards",
    inspiredBy: "kanban",
    tagline: "Boards for production, IT, and drops.",
    desktopFolder: "desktop/grid",
    webHref: "/office/boards",
    installerBaseName: "Plethora-Boards-Setup",
  },
  trace: {
    id: "trace",
    name: "Plethora Flow",
    inspiredBy: "flow diagrams",
    tagline: "Process and pipeline flows from a brief.",
    desktopFolder: "desktop/trace",
    webHref: "/office/flow",
    installerBaseName: "Plethora-Flow-Setup",
  },
  nook: {
    id: "nook",
    name: "Plethora Rooms",
    inspiredBy: "light channels",
    tagline: "Simple rooms on this device.",
    desktopFolder: "desktop/nook",
    webHref: "/office/rooms",
    installerBaseName: "Plethora-Rooms-Setup",
  },
  mail: {
    id: "mail",
    name: "Plethora Mail",
    inspiredBy: "email",
    tagline: "Inbox, compose, and AI-drafted replies on your PC.",
    desktopFolder: "desktop/mail",
    webHref: "/office/mail",
    installerBaseName: "Plethora-Mail-Setup",
  },
};

export function officeApp(id: OfficeAppId): OfficeAppMeta {
  return OFFICE_APP_NAMES[id];
}

export const LEGACY_ROUTE_LABELS: Record<string, string> = {
  slack: OFFICE_APP_NAMES.relay.name,
  taskbot: OFFICE_APP_NAMES.scout.name,
  word: OFFICE_APP_NAMES.draft.name,
  boards: OFFICE_APP_NAMES.grid.name,
  flow: OFFICE_APP_NAMES.trace.name,
  rooms: OFFICE_APP_NAMES.nook.name,
  mail: OFFICE_APP_NAMES.mail.name,
};
