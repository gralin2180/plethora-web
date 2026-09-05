const fs = require("fs");
const path = require("path");

const root = path.join(__dirname);
const apps = ["slack", "scout", "draft", "grid", "trace", "nook", "mail"];

for (const app of apps) {
  const mainPath = path.join(root, app, "electron", "main.ts");
  const pkgPath = path.join(root, app, "package.json");
  if (!fs.existsSync(mainPath)) continue;

  let src = fs.readFileSync(mainPath, "utf8");
  const appId = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, "utf8")).build?.appId : null;

  if (!src.includes("iconPath")) {
    src = src.replace(
      /const useBuiltUi = fs\.existsSync\(distIndex\);/,
      "const useBuiltUi = fs.existsSync(distIndex);\nconst iconPath = path.join(__dirname, \"../build/icon.png\");"
    );
  }

  if (!src.includes("fs.existsSync(iconPath)")) {
    src = src.replace(
      /(title: "[^"]+",)(\s*backgroundColor:)/,
      "$1\n    icon: fs.existsSync(iconPath) ? iconPath : undefined,$2"
    );
    src = src.replace(
      /(title: "[^"]+",)\s+(backgroundColor:)/,
      "$1\n    icon: fs.existsSync(iconPath) ? iconPath : undefined,\n    $2"
    );
  }

  if (appId && !src.includes("setAppUserModelId")) {
    src = src.replace(
      /app\.whenReady\(\)\.then\(\(\) => \{/,
      `app.whenReady().then(() => {\n  if (process.platform === "win32") app.setAppUserModelId("${appId}");`
    );
  }

  fs.writeFileSync(mainPath, src);

  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (pkg.build?.win) {
      pkg.build.win.icon = "build/icon.png";
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    }
  }

  console.log("patched", app);
}
