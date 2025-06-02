// api/index.js
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

setInterval(async () => {
  try{
    await db.query('SELECT 1')
    console.log(`[${new Date().toISOString()}] Keep-alive enviado`);  
  } catch(err) {
    console.error('Error manteniendo conexión: ', err)
  }
}, 60000)

app.post('/api/validate', async (req, res) => {
  const { cardNumber } = req.body;

  if (!cardNumber) {
    return res.status(400).json({ error: 'Falta cardNumber' });
  }
  try {
    const [rows] = await db.query(`
      SELECT 
        u.nombre,
        rn.in_time,
        rn.pause_time,
        rn.restart_time,
        rn.out_time,
        p.pause,
        p.restart,
        timediff(rn.restart_time, rn.pause_time) as total_break,
        rn.intensivo,
        rn.dia_fichaje
      FROM users u
      LEFT JOIN registros_new rn
        ON u.nombre = rn.usuario
      LEFT JOIN (
        SELECT * FROM pausas
        ORDER BY id DESC
      ) p ON rn.id = p.registro_id
      WHERE u.nfc_id = ?
        AND fecha = CURDATE()
      LIMIT 1;
    `, [cardNumber]);

    if (rows.length === 0) {
      console.log('nop')
      return res.status(404).json({ valid: false, message: 'Tarjeta no válida' });
    }

    return res.json({ valid: true, data: rows[0] });
  } catch (error) {
    console.log('nop')
    console.error(error);
    return res.status(500).json({ error: 'Error en la base de datos' });
  }
});

app.put('/api/update-fichaje', async (req, res) => {
  const { nombre, in_time, out_time, pause_time, restart_time, pause, restart, pauseState, action, delegacion } = req.body;
  console.log(req.body)
  const conn = await db.getConnection();
  await conn.beginTransaction();

  const salida_nocturna = action === 'out' && in_time !== '00:00:00' && out_time < '08:00:00'
  const query = `
      UPDATE registros_new
      SET in_time = ?, out_time = ?, pause_time = ?, restart_time = ?, delegacion_fichaje = ?
      WHERE usuario = ? AND fecha = CURDATE()${salida_nocturna ? '-1' : ''}
    `
  console.log('la query es: ' + query)
  try {
    await conn.query(query, [in_time, out_time, pause_time, restart_time, delegacion, nombre]);

    if (action === 'pause_restart' ) {
      if (pauseState === 'available') {
        await conn.query(`
          INSERT INTO pausas (registro_id, pause)
          VALUES (
            (SELECT id FROM registros_new WHERE usuario = ? AND fecha = CURDATE() LIMIT 1),
            ?
          )
        `, [nombre, pause]);
      } else if (pauseState === 'processing') {
        const [rows] = await conn.query(`
          SELECT p.id FROM pausas p
          JOIN registros_new rn ON p.registro_id = rn.id
          WHERE rn.usuario = ? AND rn.fecha = CURDATE()
          ORDER BY p.id DESC LIMIT 1
        `, [nombre]);

        if (rows.length > 0) {
          await conn.query(`
            UPDATE pausas SET restart = ? WHERE id = ?
          `, [restart, rows[0].id]);
        }
      }
    }

    await conn.commit();
    res.json({ success: true });

  } catch (err) {
    await conn.rollback();
    console.error("Error actualizando fichaje:", err);
    res.status(500).json({ error: "Error en la base de datos" });
  } finally {
    conn.release();
  }
});

app.listen(PORT, () => {
  console.log(`API backend escuchando en http://localhost:${PORT}`);
});
