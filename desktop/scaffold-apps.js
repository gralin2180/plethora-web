const fs = require("fs");
const path = require("path");

const root = path.join(__dirname);
const apps = [
  { id: "draft", name: "Draft", port: 5175, color: "#2d6a4f", glyph: "D", appId: "com.plethora.draft", desc: "Rich documents with Quill AI." },
  { id: "grid", name: "Grid", port: 5176, color: "#0891b2", glyph: "G", appId: "com.plethora.grid", desc: "Kanban boards for production." },
  { id: "trace", name: "Trace", port: 5177, color: "#7c3aed", glyph: "T", appId: "com.plethora.trace", desc: "Process flows and Mermaid export." },
  { id: "nook", name: "Nook", port: 5178, color: "#ea580c", glyph: "N", appId: "com.plethora.nook", desc: "Light channels with AI teammates." },
  { id: "mail", name: "Mail", port: 5179, color: "#2563eb", glyph: "M", appId: "com.plethora.mail", desc: "Email inbox and compose on your PC." },
];

const preload = `const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("plethoraDesktop", {
  platform: process.platform,
  isDesktop: true,
  apiBase: process.env.PLETHORA_API_URL || "https://plethora-ten.vercel.app",
});`;

function mainTs(a) {
  return `const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
app.setPath("userData", path.join(app.getPath("appData"), "Plethora", "Office"));
const distIndex = path.join(__dirname, "../dist/index.html");
const useBuiltUi = fs.existsSync(distIndex);
function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 800, minHeight: 560,
    title: "${a.name}", backgroundColor: "#12141a",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false },
  });
  win.setMenuBarVisibility(false);
  if (!app.isPackaged && !useBuiltUi) win.loadURL("http://localhost:${a.port}");
  else win.loadFile(distIndex);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
`;
}

for (const a of apps) {
  const dir = path.join(root, a.id);
  fs.mkdirSync(path.join(dir, "electron"), { recursive: true });
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });

  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(
      {
        name: a.id,
        productName: a.name,
        version: "0.1.0",
        description: a.desc,
        main: "dist-electron/main.js",
        author: "Plethora",
        private: true,
        scripts: {
          dev: "vite",
          "build:renderer": "vite build",
          "build:electron": "tsc -p tsconfig.electron.json",
          "build:win": "npm run build:renderer && npm run build:electron && electron-builder --win --x64",
          desktop: "npm run build:electron && electron .",
          start: "electron .",
          postinstall: "node node_modules/electron/install.js",
        },
        build: {
          appId: a.appId,
          productName: a.name,
          directories: { output: "release" },
          files: ["dist/**/*", "dist-electron/**/*"],
          win: { target: [{ target: "nsis", arch: ["x64"] }], artifactName: `${a.name}-Setup-\${version}.\${ext}` },
          nsis: { oneClick: false, allowToChangeInstallationDirectory: true, artifactName: `${a.name}-Setup-\${version}.exe` },
        },
        devDependencies: {
          "@types/react": "^19",
          "@types/react-dom": "^19",
          "@vitejs/plugin-react": "^4.3.4",
          electron: "^34.0.0",
          "electron-builder": "^25.1.8",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          typescript: "^5",
          vite: "^6.0.0",
        },
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(dir, "vite.config.ts"),
    `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "dist", emptyOutDir: true },
  resolve: { alias: { "@shared": path.resolve(__dirname, "../shared") } },
  server: { port: ${a.port}, strictPort: true },
});
`
  );

  fs.writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          isolatedModules: true,
          jsx: "react-jsx",
          strict: true,
          noEmit: true,
          baseUrl: ".",
          paths: { "@shared/*": ["../shared/*"] },
        },
        include: ["src", "../shared"],
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(dir, "tsconfig.electron.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "CommonJS",
          outDir: "dist-electron",
          rootDir: "electron",
          strict: true,
          skipLibCheck: true,
          esModuleInterop: true,
        },
        include: ["electron"],
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(dir, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${a.name}</title></head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>`
  );

  fs.writeFileSync(path.join(dir, ".gitignore"), "node_modules/\ndist/\ndist-electron/\nrelease/\n");
  fs.writeFileSync(path.join(dir, "electron/main.ts"), mainTs(a));
  fs.writeFileSync(path.join(dir, "electron/preload.ts"), preload);
  fs.writeFileSync(
    path.join(dir, "src/main.tsx"),
    `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyTheme, loadTheme } from "@shared/theme";
import "./styles.css";
applyTheme(loadTheme());
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
`
  );
  fs.writeFileSync(path.join(dir, "src/styles.css"), `@import "../../shared/app-styles.css";\n`);

  console.log("scaffolded", a.id);
}
