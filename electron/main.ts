
import { app, BrowserWindow } from "electron";
import path from "path";
import { initDatabase } from "./db/schema";
import { registerAuthHandlers } from "./ipc/auth";
import { registerProductHandlers } from "./ipc/products";
import { registerCategoryHandlers } from "./ipc/categories";
import { registerStockHandlers } from "./ipc/stock";
import { registerTransactionHandlers } from "./ipc/transactions";
import { registerUserHandlers } from "./ipc/users";
import { registerReportHandlers } from "./ipc/reports";
import { registerDashboardHandlers } from "./ipc/dashboard";
import { registerSettingsHandlers } from "./ipc/settings";

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, "../src/assets/android-chrome-512x512.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(async () => {
  await initDatabase();
  registerAuthHandlers();
  registerProductHandlers();
  registerCategoryHandlers();
  registerStockHandlers();
  registerTransactionHandlers();
  registerUserHandlers();
  registerReportHandlers();
  registerDashboardHandlers();
  registerSettingsHandlers();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
