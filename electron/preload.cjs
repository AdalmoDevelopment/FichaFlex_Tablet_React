try {
  console.log("🔍 preload cargando...");

  const { contextBridge } = require("electron");
  const path = require("path");

  console.log("✅ Electron y path cargados");

  const dbPath = path.join(__dirname, "db.cjs");
  console.log("Intentando cargar DB desde:", dbPath);

  let logsDBInstance = null;

  // Función segura para crear o recrear la DB
  const initLogsDB = () => {
    try {
      delete require.cache[require.resolve(dbPath)]; // fuerza recarga si se perdió
      const dbModule = require(dbPath);
      logsDBInstance = dbModule;
      console.log("✅ DB cargada o reinicializada correctamente");
    } catch (err) {
      console.error("💥 Error inicializando LogsDB:", err);
    }
  };

  // Inicialización inmediata
  initLogsDB();

  // Exponer objeto seguro
  contextBridge.exposeInMainWorld("sqlite", {
    get logsDB() {
      if (!logsDBInstance) {
        console.warn("⚠️ logsDBInstance ausente, reinicializando...");
        initLogsDB();
      }
      return logsDBInstance;
    },
    reinit: () => {
      console.log("♻️ Reinicializando logsDB manualmente...");
      initLogsDB();
    },
  });

  console.log("✅ sqlite expuesto correctamente");
} catch (err) {
  console.error("💥 Error dentro del preload:", err);
}
