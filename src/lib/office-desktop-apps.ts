/**
 * Plethora Office desktop apps — Windows first, Mac later.
 */

import { OFFICE_APP_NAMES, type OfficeAppId } from "./office-app-names";

export type DesktopPlatform = "windows" | "mac" | "linux";

export type DesktopAppStatus = "available" | "beta" | "coming_soon";

export type OfficeDesktopApp = {
  id: OfficeAppId | string;
  name: string;
  like: string;
  tagline: string;
  webHref: string;
  downloadPath?: string;
  version?: string;
  sizeLabel?: string;
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
    id: "relay",
    name: OFFICE_APP_NAMES.relay.name,
    like: OFFICE_APP_NAMES.relay.inspiredBy,
    tagline: OFFICE_APP_NAMES.relay.tagline + " Free models + BYOK + Plethora tokens.",
    webHref: OFFICE_APP_NAMES.relay.webHref,
    version: "0.1.0",
    aiFunnel: true,
    featured: true,
    installerReady: false,
    platforms: [
      {
        platform: "windows",
        status: "beta",
        downloadPath: "/downloads/Plethora-Chat-Setup-0.1.0.exe",
        version: "0.1.0-beta",
        sizeLabel: "~85 MB",
        notes: `Native app in ${OFFICE_APP_NAMES.relay.desktopFolder}/`,
      },
      { platform: "mac", status: "coming_soon" },
    ],
  },
  {
    id: "scout",
    name: OFFICE_APP_NAMES.scout.name,
    like: OFFICE_APP_NAMES.scout.inspiredBy,
    tagline: OFFICE_APP_NAMES.scout.tagline,
    webHref: OFFICE_APP_NAMES.scout.webHref,
    version: "0.1.0",
    aiFunnel: true,
    featured: true,
    installerReady: false,
    platforms: [
      {
        platform: "windows",
        status: "beta",
        downloadPath: "/downloads/Plethora-Tasks-Setup-0.1.0.exe",
        version: "0.1.0-beta",
        sizeLabel: "~72 MB",
        notes: `Pairs with ${OFFICE_APP_NAMES.relay.name}. ${OFFICE_APP_NAMES.scout.desktopFolder}/`,
      },
      { platform: "mac", status: "coming_soon" },
    ],
  },
  {
    id: "draft",
    name: OFFICE_APP_NAMES.draft.name,
    like: OFFICE_APP_NAMES.draft.inspiredBy,
    tagline: OFFICE_APP_NAMES.draft.tagline,
    webHref: OFFICE_APP_NAMES.draft.webHref,
    aiFunnel: true,
    featured: true,
    platforms: [
      { platform: "windows", status: "coming_soon" },
      { platform: "mac", status: "coming_soon" },
    ],
  },
  {
    id: "grid",
    name: OFFICE_APP_NAMES.grid.name,
    like: OFFICE_APP_NAMES.grid.inspiredBy,
    tagline: OFFICE_APP_NAMES.grid.tagline,
    webHref: OFFICE_APP_NAMES.grid.webHref,
    aiFunnel: true,
    platforms: [
      { platform: "windows", status: "coming_soon" },
      { platform: "mac", status: "coming_soon" },
    ],
  },
  {
    id: "trace",
    name: OFFICE_APP_NAMES.trace.name,
    like: OFFICE_APP_NAMES.trace.inspiredBy,
    tagline: OFFICE_APP_NAMES.trace.tagline,
    webHref: OFFICE_APP_NAMES.trace.webHref,
    aiFunnel: true,
    platforms: [
      { platform: "windows", status: "coming_soon" },
      { platform: "mac", status: "coming_soon" },
    ],
  },
  {
    id: "nook",
    name: OFFICE_APP_NAMES.nook.name,
    like: OFFICE_APP_NAMES.nook.inspiredBy,
    tagline: OFFICE_APP_NAMES.nook.tagline,
    webHref: OFFICE_APP_NAMES.nook.webHref,
    aiFunnel: true,
    platforms: [
      { platform: "windows", status: "coming_soon" },
      { platform: "mac", status: "coming_soon" },
    ],
  },
  {
    id: "mail",
    name: OFFICE_APP_NAMES.mail.name,
    like: OFFICE_APP_NAMES.mail.inspiredBy,
    tagline: OFFICE_APP_NAMES.mail.tagline,
    webHref: OFFICE_APP_NAMES.mail.webHref,
    version: "0.1.0",
    aiFunnel: true,
    featured: true,
    installerReady: false,
    platforms: [
      {
        platform: "windows",
        status: "beta",
        downloadPath: "/downloads/Plethora-Mail-Setup-0.1.0.exe",
        version: "0.1.0-beta",
        sizeLabel: "~70 MB",
        notes: `Local inbox in ${OFFICE_APP_NAMES.mail.desktopFolder}/`,
      },
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
