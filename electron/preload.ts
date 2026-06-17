import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("auron", {
  version: "0.1.0",
  listenForLocalVoiceCommand: () =>
    ipcRenderer.invoke("auron:listen-local-command")
});
