/** Generate electron main.ts content for a Plethora Office desktop app */
export function electronMainSource(opts: {
  title: string;
  devPort: number;
  bg: string;
  width?: number;
  height?: number;
}) {
  const { title, devPort, bg, width = 1200, height = 800 } = opts;
  return `const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");

app.setPath("userData", path.join(app.getPath("appData"), "Plethora", "Office"));

const distIndex = path.join(__dirname, "../dist/index.html");
const useBuiltUi = fs.existsSync(distIndex);

function createWindow() {
  const win = new BrowserWindow({
    width: ${width},
    height: ${height},
    minWidth: 800,
    minHeight: 560,
    title: "${title}",
    backgroundColor: "${bg}",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  if (!app.isPackaged && !useBuiltUi) win.loadURL("http://localhost:${devPort}");
  else win.loadFile(distIndex);
  if (process.env.PLETHORA_DEVTOOLS === "1") win.webContents.openDevTools({ mode: "detach" });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
`;
}

export const DESKTOP_APPS = [
  { id: "draft", name: "Draft", folder: "draft", port: 5175, color: "#2d6a4f", glyph: "D", appId: "com.plethora.draft" },
  { id: "grid", name: "Grid", folder: "grid", port: 5176, color: "#0891b2", glyph: "G", appId: "com.plethora.grid" },
  { id: "trace", name: "Trace", folder: "trace", port: 5177, color: "#7c3aed", glyph: "T", appId: "com.plethora.trace" },
  { id: "nook", name: "Nook", folder: "nook", port: 5178, color: "#ea580c", glyph: "N", appId: "com.plethora.nook" },
] as const;
