# Plethora Office — Windows desktop apps

**Order:** Windows native apps first → web copies later.

| App | Folder | Status |
|-----|--------|--------|
| **Slack** | `desktop/slack/` | **Start here** — Electron Windows app |
| **Taskbot** | `desktop/taskbot/` | After Slack is solid |

## Slack on your PC

```powershell
cd desktop/slack
npm install
npm run build:electron
npm run dev
```

Second terminal: `npm run desktop`

Build `.exe`: `npm run build:win`

See `desktop/slack/README.md`.
