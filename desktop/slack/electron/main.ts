const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");

// Share localStorage + prefs between Relay, Scout, and future Office desktop apps
const sharedUserData = path.join(app.getPath("appData"), "Plethora", "Office");
app.setPath("userData", sharedUserData);

const isDev = !app.isPackaged;
const distIndex = path.join(__dirname, "../dist/index.html");
const useBuiltUi = fs.existsSync(distIndex);
const iconPath = path.join(__dirname, "../build/icon.png");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: "Plethora Chat",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: "#1a1d21",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setMenuBarVisibility(false);

  if (isDev && !useBuiltUi) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(distIndex);
  }

  if (process.env.PLETHORA_DEVTOOLS === "1") {
    win.webContents.openDevTools({ mode: "detach" });
  }

  win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  if (process.platform === "win32") app.setAppUserModelId("com.plethora.relay");
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
