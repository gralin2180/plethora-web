# Plethora Slack — Windows app

Native Windows desktop app (Electron). **Build this first.** Web version at `/office/slack` is a preview copy — not the source of truth.

## Run on your PC (dev)

```powershell
cd desktop/slack
npm install
npm run build:electron
npm run dev
```

In a **second terminal** (same folder):

```powershell
npm run start
```

The Slack window opens on your desktop — not in a browser tab.

## Build Windows installer (.exe)

```powershell
cd desktop/slack
npm install
npm run build:win
```

Output: `desktop/slack/release/Plethora-Slack-Setup-0.1.0.exe`

Copy to web downloads (optional):

```powershell
copy release\Plethora-Slack-Setup-0.1.0.exe ..\..\public\downloads\
```

Then set `installerReady: true` for slack in `src/lib/office-desktop-apps.ts`.

## AI billing

Same as Plethora web:

1. **Free pool** — calls `https://plethora-ten.vercel.app/api/chat`
2. **BYOK** — Settings → paste API key
3. **Plethora tokens** — sign in on web / future desktop auth

## Taskbot

@mentions are queued in `localStorage` (`plethora.taskbot.inbox.v1`) for the **Taskbot Windows app** (next).

## Stack

- Electron 34
- React 19 + Vite
- Data on this PC (localStorage in app user data)
