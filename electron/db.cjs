const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "local.db");
const db = new Database(dbPath);

// 🧱 Crear tabla (una fila por usuario+fecha)
db.prepare(`
  CREATE TABLE IF NOT EXISTS offline_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nfc_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    in_time TEXT DEFAULT '00:00:00',
    out_time TEXT DEFAULT '00:00:00',
    pause_time TEXT DEFAULT '00:00:00',
    restart_time TEXT DEFAULT '00:00:00',
    synced INTEGER DEFAULT 0,
    timestamp TEXT
  )
`).run();

/**
 * Inserta o actualiza un registro de fichaje offline.
 * Si ya existe una fila con el mismo nfc_id + fecha → actualiza los campos.
 * Si no existe → crea una nueva.
 */
function saveOfflineLog({ data, field, value }) {
  const fecha = data?.fecha || new Date().toISOString().split("T")[0];
  const nfc_id = data.nfc_id;

  const existing = db
    .prepare(`SELECT id FROM offline_logs WHERE nfc_id = ? AND fecha = ?`)
    .get(nfc_id, fecha);

  if (existing) {
    // Solo actualiza el campo específico que cambió
    const stmt = db.prepare(`
      UPDATE offline_logs
      SET ${field} = ?, synced = 0, timestamp = ?
      WHERE nfc_id = ? AND fecha = ?
    `);
    stmt.run(value, new Date().toISOString(), nfc_id, fecha);

    console.log(`📝 Campo ${field} actualizado para ${nfc_id} (${fecha})`);
  } else {
    // Inserta un registro nuevo
    const insertStmt = db.prepare(`
      INSERT INTO offline_logs (nfc_id, fecha, ${field}, timestamp)
      VALUES (?, ?, ?, ?)
    `);
    insertStmt.run(nfc_id, fecha, value, new Date().toISOString());

    console.log(`🆕 Registro creado para ${nfc_id} (${fecha}) con campo ${field}`);
  }
}


function getPendingLogs() {
  return db.prepare(`SELECT * FROM offline_logs WHERE synced = 0`).all();
}

function markAsSynced(ids) {
  if (!ids || ids.length === 0) return;
  const stmt = db.prepare(`UPDATE offline_logs SET synced = 1 WHERE id = ?`);
  ids.forEach(id => stmt.run(id));
}

module.exports = { saveOfflineLog, getPendingLogs, markAsSynced };
