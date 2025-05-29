const { contextBridge } = require('electron');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Ruta del .env fuera del paquete, editable por cada tablet
const envPath = path.join(__dirname, '..', '.env');

let env = {};

if (fs.existsSync(envPath)) {
  const parsed = dotenv.parse(fs.readFileSync(envPath));
  env = parsed;
}

contextBridge.exposeInMainWorld('env', env);
