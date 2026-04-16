import { app, shell, BrowserWindow, ipcMain, nativeTheme, dialog } from "electron";
import { join } from "path";
import Store from "electron-store";
import { autoUpdater } from "electron-updater";
import type { UpdaterStatus } from "../../shared/types";

import { registerSqsHandlers } from "./handlers/sqsHandlers";
import { registerS3Handlers } from "./handlers/s3Handlers";
import { registerSecretsManagerHandlers } from "./handlers/secretsManagerHandlers";
import { registerDynamoDbHandlers } from "./handlers/dynamoDbHandlers";
import { registerCloudFormationHandlers } from "./handlers/cloudFormationHandlers";
import { registerSsmHandlers } from "./handlers/ssmHandlers";
import { registerSnsHandlers } from "./handlers/snsHandlers";
import { registerEventBridgeHandlers } from "./handlers/eventBridgeHandlers";
import { registerSchedulerHandlers } from "./handlers/schedulerHandlers";
import { registerSesHandlers } from "./handlers/sesHandlers";
import { registerKmsHandlers } from "./handlers/kmsHandlers";
import { registerIamHandlers } from "./handlers/iamHandlers";
import { registerStsHandlers } from "./handlers/stsHandlers";
import { registerApigwHandlers } from "./handlers/apigwHandlers";
import { registerFirehoseHandlers } from "./handlers/firehoseHandlers";
import { registerLambdaHandlers } from "./handlers/lambdaHandlers";
import { registerCloudWatchHandlers } from "./handlers/cloudWatchHandlers";
import { registerRedshiftHandlers } from "./handlers/redshiftHandlers";
import { registerKinesisHandlers } from "./handlers/kinesisHandlers";
import { registerOpenSearchHandlers } from "./handlers/openSearchHandlers";
import { registerEc2Handlers } from "./handlers/ec2Handlers";
import { registerTranscribeHandlers } from "./handlers/transcribeHandlers";
import { registerRoute53Handlers } from "./handlers/route53Handlers";
import { registerAcmHandlers } from "./handlers/acmHandlers";
import { registerSwfHandlers } from "./handlers/swfHandlers";
import { registerSfnHandlers } from "./handlers/sfnHandlers";
import { registerSupportHandlers } from "./handlers/supportHandlers";
import { registerResourceGroupsHandlers } from "./handlers/resourceGroupsHandlers";
import { registerConfigHandlers } from "./handlers/configHandlers";
import { registerR53ResolverHandlers } from "./handlers/r53resolverHandlers";
import { registerS3ControlHandlers } from "./handlers/s3ControlHandlers";
import type { Theme } from "../../shared/themes";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

const store = new Store<{
  endpoint: string;
  region: string;
  theme: Theme;
  iconMode: "lucide" | "aws";
  autoUpdate: boolean;
}>({
  defaults: {
    endpoint: "http://localhost:4566",
    region: "ap-southeast-2",
    theme: "dark",
    iconMode: "lucide",
    autoUpdate: true,
  },
});

// Suppress electron-updater's default logger
autoUpdater.logger = null;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function pushUpdaterStatus(status: UpdaterStatus) {
  mainWindow?.webContents.send("updater:status", status);
}

autoUpdater.on("checking-for-update", () => {
  pushUpdaterStatus({ status: "checking" });
});
autoUpdater.on("update-available", (info) => {
  pushUpdaterStatus({ status: "available", version: info.version });
});
autoUpdater.on("update-not-available", () => {
  pushUpdaterStatus({ status: "not-available" });
});
autoUpdater.on("download-progress", (progress) => {
  pushUpdaterStatus({ status: "downloading", percent: Math.round(progress.percent) });
});
autoUpdater.on("update-downloaded", (info) => {
  pushUpdaterStatus({ status: "ready", version: info.version });
});
autoUpdater.on("error", (err) => {
  pushUpdaterStatus({ status: "error", message: err.message });
});

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    backgroundColor: "#0f172a",
    icon: join(__dirname, "../../build/icon.png"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow!.show();
    if (!isDev && store.get("autoUpdate")) {
      setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 3000);
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// --- Window controls ---
ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.restore();
  else mainWindow?.maximize();
});
ipcMain.handle("window:close", () => mainWindow?.close());
ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized() ?? false);

// --- Theme ---
ipcMain.handle("theme:get", () => store.get("theme"));
ipcMain.handle("theme:set", (_event, theme: Theme) => {
  store.set("theme", theme);
  nativeTheme.themeSource = theme === 'light' ? 'light' : 'dark';
});

// --- Icon mode ---
ipcMain.handle("iconMode:get", () => store.get("iconMode"));
ipcMain.handle("iconMode:set", (_event, mode: "lucide" | "aws") => {
  store.set("iconMode", mode);
});

// --- Settings persistence ---
ipcMain.handle("settings:get", () => ({
  endpoint: store.get("endpoint"),
  region: store.get("region"),
}));

ipcMain.handle("settings:save", (_event, endpoint: string, region: string) => {
  store.set("endpoint", endpoint);
  store.set("region", region);
});

// --- Auto-updater ---
ipcMain.handle("updater:get-version", () => app.getVersion());
ipcMain.handle("updater:get-auto-update", () => store.get("autoUpdate"));
ipcMain.handle("updater:set-auto-update", (_event, value: boolean) => {
  store.set("autoUpdate", value);
});
ipcMain.handle("updater:check", () => {
  if (isDev) return;
  autoUpdater.checkForUpdates().catch(() => {});
});
ipcMain.handle("updater:install", () => {
  autoUpdater.quitAndInstall();
});

// --- Dialog helpers ---
ipcMain.handle("dialog:openFiles", async () => {
  if (!mainWindow) return { canceled: true, filePaths: [] };
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    title: "Select files to upload",
  });
  return result;
});

ipcMain.handle("dialog:saveFile", async (_event, defaultName: string) => {
  if (!mainWindow) return { canceled: true, filePath: undefined };
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    title: "Save file",
  });
  return result;
});

// --- Service handlers ---
registerSqsHandlers(ipcMain, (endpoint, region) => {
  store.set("endpoint", endpoint);
  store.set("region", region);
});
registerS3Handlers(ipcMain);
registerSecretsManagerHandlers(ipcMain);
registerDynamoDbHandlers(ipcMain);
registerCloudFormationHandlers(ipcMain);
registerSsmHandlers(ipcMain);
registerSnsHandlers(ipcMain);
registerEventBridgeHandlers(ipcMain);
registerSchedulerHandlers(ipcMain);
registerSesHandlers(ipcMain);
registerKmsHandlers(ipcMain);
registerIamHandlers(ipcMain);
registerStsHandlers(ipcMain);
registerApigwHandlers(ipcMain);
registerFirehoseHandlers(ipcMain);
registerLambdaHandlers(ipcMain);
registerCloudWatchHandlers(ipcMain);
registerRedshiftHandlers(ipcMain);
registerKinesisHandlers(ipcMain);
registerOpenSearchHandlers(ipcMain);
registerEc2Handlers(ipcMain);
registerTranscribeHandlers(ipcMain);
registerRoute53Handlers(ipcMain);
registerAcmHandlers(ipcMain);
registerSwfHandlers(ipcMain);
registerSfnHandlers(ipcMain);
registerSupportHandlers(ipcMain);
registerResourceGroupsHandlers(ipcMain);
registerConfigHandlers(ipcMain);
registerR53ResolverHandlers(ipcMain);
registerS3ControlHandlers(ipcMain);
