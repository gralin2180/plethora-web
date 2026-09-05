# Plethora Office — Windows desktop apps

| App | Folder | Port | Role |
|-----|--------|------|------|
| **Relay** | `desktop/slack/` | 5173 | Team chat + Echo AI |
| **Scout** | `desktop/scout/` | 5174 | Tasks from Relay |
| **Draft** | `desktop/draft/` | 5175 | Documents + Quill AI |
| **Grid** | `desktop/grid/` | 5176 | Kanban boards |
| **Trace** | `desktop/trace/` | 5177 | Flow / Mermaid |
| **Nook** | `desktop/nook/` | 5178 | Light channels + bots |
| **Mail** | `desktop/mail/` | 5179 | Inbox & compose + AI drafts |

Shared: `desktop/shared/` — AI client, theme, Plethora Bots panel  
Data: `%APPDATA%\Plethora\Office\` (syncs across all Office apps)

## Install everything

```powershell
cd desktop
.\setup-all.ps1
```

## Run one app

```powershell
cd desktop/draft   # or grid, trace, nook, slack, scout
npm run build:renderer
npm run build:electron
npm run start
```

## Build Windows installer

```powershell
npm run build:win
# Output: release/Draft-Setup-0.1.0.exe (etc.)
```
