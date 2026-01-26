const dotenv = require('dotenv');
dotenv.config();

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { saveLog } = require("./logger.cjs");

app.disableHardwareAcceleration();

app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

let mainWindow = null;

require(path.join(__dirname, '../api/index.js'));

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return; // evita crear ventanas duplicadas
  }

  mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    kiosk: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    }
  });

  const url = process.env.VITE_ENV === 'development'
    ? 'http://localhost:5173'
    : path.join(__dirname, '..', 'dist', 'index.html');

  if (process.env.VITE_ENV === 'development') {
    mainWindow.loadURL(url);
  } else {
    mainWindow.loadFile(url);
  }

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    saveLog({ action: "renderer-crash", details });
    console.error("Renderer crashed:", details);

    safeRestartWindow();
  });

  mainWindow.webContents.on('unresponsive', () => {
    saveLog({ action: "renderer-unresponsive" });
    console.error("Renderer unresponsive");
  });

  mainWindow.on('closed', () => {
    saveLog({ action: "window-closed" });
    mainWindow = null;
  });
}

function safeRestartWindow() {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy();
    }
  } catch (e) {}

  mainWindow = null;
  setTimeout(createWindow, 1500);
}

app.whenReady().then(() => {
  saveLog({ action: "app-started" });
  createWindow();
});

app.on('window-all-closed', () => {
  saveLog({ action: "window-all-closed" });
  safeRestartWindow(); //kiosk nunca muere
});

// Watchdog kiosk
setInterval(() => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    saveLog({ action: "watchdog-restart" });
    safeRestartWindow();
  }
}, 5000);

// Errores globales Node
process.on('uncaughtException', err => {
  saveLog({ action: "uncaughtException", error: err.message });
  console.error("uncaughtException:", err);
});

process.on('unhandledRejection', err => {
  saveLog({ action: "unhandledRejection", error: err });
  console.error("unhandledRejection:", err);
});
