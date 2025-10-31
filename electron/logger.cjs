// src/utils/logger.cjs
const fs = require("fs");
const path = require("path");

// escribe el log en la raíz del proyecto (ajusta si quieres otra ruta)
const logsPath = path.join(__dirname, "..", "logs.json");

function saveLog(entry) {
  console.log("Guardando log:", entry);
  try {
    let logs = [];
    if (fs.existsSync(logsPath)) {
      const data = fs.readFileSync(logsPath, "utf-8");
      logs = JSON.parse(data || "[]");
    }

    logs.push({
      timestamp: new Date().toISOString(),
      ...entry,
    });

    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2), "utf-8");
    console.log("✅ Log guardado en", logsPath);
  } catch (err) {
    console.error("❌ Error guardando log:", err);
  }
}

module.exports = { saveLog };
