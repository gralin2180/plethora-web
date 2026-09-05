/**
 * Plethora Office desktop apps — Windows first, Mac later.
 * Web apps ship first; installers land under /public/downloads when ready.
 */

export type DesktopPlatform = "windows" | "mac" | "linux";

export type DesktopAppStatus = "available" | "beta" | "coming_soon";

export type OfficeDesktopApp = {
  id: string;
  name: string;
  like: string;
  tagline: string;
  webHref: string;
  /** Relative path under /public or absolute https URL */
  downloadPath?: string;
  version?: string;
  sizeLabel?: string;
  /** Set true only after the .exe is in public/downloads */
  installerReady?: boolean;
  featured?: boolean;
  platforms: {
    platform: DesktopPlatform;
    status: DesktopAppStatus;
    downloadPath?: string;
    version?: string;
    sizeLabel?: string;
    notes?: string;
  }[];
  aiFunnel: boolean;
};

export const OFFICE_DESKTOP_APPS: OfficeDesktopApp[] = [
  {
    id: "slack",
    name: "Plethora Slack",
    like: "Slack",
    tagline:
      "Team chat with AI teammate, @mentions, threads, and Taskbot sync. Free models + BYOK + Plethora tokens.",
    webHref: "/office/slack",
    version: "0.1.0-web",
    aiFunnel: true,
    featured: true,
    installerReady: false,
    platforms: [
      {
        platform: "windows",
        status: "beta",
        downloadPath: "/downloads/Plethora-Slack-Setup-0.1.0.exe",
        version: "0.1.0-beta",
        sizeLabel: "~85 MB",
        notes: "Preview installer — syncs with web workspace on this device. Mac build next.",
      },
      {
        platform: "mac",
        status: "coming_soon",
        notes: "Apple Silicon + Intel — after Windows beta stabilizes.",
      },
    ],
  },
  {
    id: "taskbot",
    name: "Taskbot",
    like: "Slack + AI task capture",
    tagline:
      "Watches Plethora Slack chats — tasks, notes, screenshots, and an @you inbox from mentions.",
    webHref: "/office/taskbot",
    version: "0.1.0-web",
    aiFunnel: true,
    featured: true,
    installerReady: false,
    platforms: [
      {
        platform: "windows",
        status: "beta",
        downloadPath: "/downloads/Plethora-Taskbot-Setup-0.1.0.exe",
        version: "0.1.0-beta",
        sizeLabel: "~72 MB",
        notes: "Pairs with Plethora Slack. Standalone tray app coming in same bundle.",
      },
      {
        platform: "mac",
        status: "coming_soon",
      },
    ],
  },
  {
    id: "word",
    name: "Plethora Word",
    like: "Microsoft Word",
    tagline: "Rich editor + Quill AI teammate. Export HTML.",
    webHref: "/office/word",
    aiFunnel: true,
    featured: true,
    platforms: [
      {
        platform: "windows",
        status: "coming_soon",
        notes: "Desktop shell wraps the web editor with offline cache.",
      },
      { platform: "mac", status: "coming_soon" },
    ],
  },
  {
    id: "boards",
    name: "Plethora Boards",
    like: "Trello",
    tagline: "Kanban for IT, production, fashion drops, film units.",
    webHref: "/office/boards",
    aiFunnel: true,
    platforms: [
      { platform: "windows", status: "coming_soon" },
      { platform: "mac", status: "coming_soon" },
    ],
  },
  {
    id: "rooms",
    name: "Plethora Rooms",
    like: "Slack (light)",
    tagline: "Simple channels on this device — superseded by Plethora Slack desktop.",
    webHref: "/office/rooms",
    aiFunnel: true,
    platforms: [
      { platform: "windows", status: "coming_soon" },
      { platform: "mac", status: "coming_soon" },
    ],
  },
  {
    id: "flow",
    name: "Plethora Flow",
    like: "Lucidchart / Miro",
    tagline: "Process and pipeline flow from a brief.",
    webHref: "/office/flow",
    aiFunnel: true,
    platforms: [
      { platform: "windows", status: "coming_soon" },
      { platform: "mac", status: "coming_soon" },
    ],
  },
];

export function getDesktopApp(id: string): OfficeDesktopApp | undefined {
  return OFFICE_DESKTOP_APPS.find((a) => a.id === id);
}

export function platformLabel(p: DesktopPlatform): string {
  if (p === "windows") return "Windows";
  if (p === "mac") return "macOS";
  return "Linux";
}
