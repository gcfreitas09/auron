import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "node:path";
import { listenForLocalVoiceCommand } from "./localSpeech";

const DEV_SERVER_URL = "http://localhost:5173";

app.commandLine.appendSwitch("enable-features", "WebSpeechAPI");

function configureMediaPermissions() {
  const allowedPermissions = new Set(["audioCapture", "media", "microphone"]);

  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      callback(allowedPermissions.has(permission));
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission) => allowedPermissions.has(permission)
  );
}

function configureVoiceIpc() {
  ipcMain.handle("auron:listen-local-command", () =>
    listenForLocalVoiceCommand()
  );
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#050816",
    autoHideMenuBar: true,
    title: "AURON",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  if (!app.isPackaged) {
    void window.loadURL(DEV_SERVER_URL);
  } else {
    void window.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  configureMediaPermissions();
  configureVoiceIpc();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
