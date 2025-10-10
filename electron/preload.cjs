try {
  console.log("🔍 preload cargando...");

  const { contextBridge } = require("electron");
  const path = require("path");

  console.log("✅ Electron y path cargados");

  const dbPath = path.join(__dirname, "db.cjs");
  console.log("Intentando cargar DB desde:", dbPath);
  const logsDB = require(dbPath);

  console.log("✅ DB cargada correctamente");

  contextBridge.exposeInMainWorld("sqlite", {
    logsDB,
  })

  console.log("✅ test expuesto correctamente");
} catch (err) {
  console.error("💥 Error dentro del preload:", err);
}
