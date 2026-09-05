const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("plethoraDesktop", {
  platform: process.platform,
  isDesktop: true,
  apiBase: process.env.PLETHORA_API_URL || "https://plethora-ten.vercel.app",
});