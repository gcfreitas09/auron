"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const DEV_SERVER_URL = "http://localhost:5173";
function createMainWindow() {
    const window = new electron_1.BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 960,
        minHeight: 640,
        backgroundColor: "#050816",
        autoHideMenuBar: true,
        title: "AURON",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    if (!electron_1.app.isPackaged) {
        void window.loadURL(DEV_SERVER_URL);
    }
    else {
        void window.loadFile(node_path_1.default.join(__dirname, "dist", "index.html"));
    }
}
electron_1.app.whenReady().then(() => {
    createMainWindow();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
