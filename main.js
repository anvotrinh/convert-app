const {
  app,
  BrowserWindow,
  globalShortcut,
  screen,
  ipcMain,
} = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
let win;
let size;
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  size = primaryDisplay.workAreaSize;
  win = new BrowserWindow({
    width: 800,
    height: 600,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  win.loadFile("./index.html");
  minWinID = win.id;
}

const iconName = path.join(__dirname, "iconForDragAndDrop.png");
const icon = fs.createWriteStream(iconName);

https.get("https://img.icons8.com/ios/452/drag-and-drop.png", (response) => {
  response.pipe(icon);
});

app.whenReady().then(() => {
  createWindow();
});

ipcMain.on("ondragstart", (event, filePath) => {
  console.log(filePath);
  event.sender.startDrag({
    file: filePath,
    icon: iconName,
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
