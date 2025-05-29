const dotenv = require('dotenv');
dotenv.config();

const { app, BrowserWindow } = require('electron');
const path = require('path');

app.disableHardwareAcceleration(); // evitar errores GPU

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    kiosk: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    // En desarrollo: Vite server
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // En producción: carga archivo estático desde dist
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.focus();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
