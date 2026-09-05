const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
app.setPath("userData", path.join(app.getPath("appData"), "Plethora", "Office"));
const distIndex = path.join(__dirname, "../dist/index.html");
const useBuiltUi = fs.existsSync(distIndex);
const iconPath = path.join(__dirname, "../build/icon.png");
function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 800, minHeight: 560,
    title: "Trace",
    icon: fs.existsSync(iconPath) ? iconPath : undefined, backgroundColor: "#12141a",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false },
  });
  win.setMenuBarVisibility(false);
  if (!app.isPackaged && !useBuiltUi) win.loadURL("http://localhost:5177");
  else win.loadFile(distIndex);
  win.webContents.setWindowOpenHandler(({ url }: { url: string }) => { shell.openExternal(url); return { action: "deny" }; });
}
app.whenReady().then(() => {
  if (process.platform === "win32") app.setAppUserModelId("com.plethora.trace");
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
