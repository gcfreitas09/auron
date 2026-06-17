import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("auron", {
  version: "0.1.0"
});
