const dotenv = require('dotenv');
dotenv.config();

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { saveLog } = require("./logger.cjs");  // 👈 importa aquí

app.disableHardwareAcceleration(); // evitar errores GPU

let mainWindow;

require(path.join(__dirname, '../api/index.js'));

function createWindow() {
 console.log("📂 __dirname:", __dirname);
  console.log("📂 preload path:", path.join(__dirname, 'preload.cjs'));
  console.log("📂 preload exists:", require('fs').existsSync(path.join(__dirname, 'preload.cjs')));

  
  mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    kiosk: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // 👈 esto
    }
  });

  if (process.env.VITE_ENV === 'development') {
    // En desarrollo: Vite server
    console.log("En desarrollo: Vite server")
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // En producción: carga archivo estático desde dist
    console.log("En producción: carga archivo estático desde dist")
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.focus();
    mainWindow.webContents.openDevTools()
  });
}

app.whenReady().then(() => {
  saveLog({ action: "app-started" }); // ✅ funciona
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
