// api/index.js
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv'; 
dotenv.config();
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { graphClient } from './outlook/getCredentials.js';
const require = createRequire(import.meta.url);
const { version } = require('../package.json');
const { anticiposPreset } = require('./presets/mailPresets')
const fs = require('fs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
  try {
    await db.query('SELECT 1'); // keep-alive
    // console.log(`[${new Date().toISOString()}] Keep-alive enviado`);

    const delegacion = process.env.VITE_DELEGACION_GLOBAL;

    try {
      // 1. Verificar si la delegación ya existe
      const [rows] = await db.query(
        'SELECT id FROM tablets WHERE delegacion = ?',
        [delegacion]
      );

      let tabletId;
      if (rows.length > 0) {
        tabletId = rows[0].id;

        // 2. Si existe, actualizar last_conn
        await db.query(
          'UPDATE tablets SET version = ?, last_conn = NOW() WHERE delegacion = ?',
          [version, delegacion]
        );
      } else {
        // 3. Si no existe, insertar
        const [insertResult] = await db.query(
          'INSERT INTO tablets (delegacion, version, last_conn) VALUES (?, ?, NOW())',
          [delegacion, version]
        );
        tabletId = insertResult.insertId;
      }

      // 4. Ahora que tenemos el tabletId, cerramos un log abierto si existiera
      await db.query(
        `UPDATE tablets_logs 
         SET time_fixed = NOW()
         WHERE id_tablet = ?
           AND time_fixed IS NULL
           AND id = (
             SELECT id FROM (
               SELECT MAX(id) AS id
               FROM tablets_logs
               WHERE id_tablet = ? AND time_fixed IS NULL
             ) AS sub
           )`,
        [tabletId, tabletId]
      );

    } catch (error) {
      console.error('Error en operación con base de datos:', error);
    }

  } catch (err) {
    console.error('Error manteniendo conexión: ', err);
  }
}, 6000);

app.post('/api/validate', async (req, res) => {
  const { cardNumber } = req.body;
  
  if (!cardNumber) {
    return res.status(400).json({ error: 'Falta cardNumber' });
  }
  try {
    const [rows] = await db.query(`
      SELECT
        u.id as id_user,
        u.nombre,
        u.chofer,
        rn.in_time,
        rn.pause_time,
        rn.restart_time,
        rn.out_time,
        p.pause,
        p.restart,
        timediff(rn.restart_time, rn.pause_time) as total_break,
        ifnull(rv.inicio, '00:00:00') as inicio_viaje,
        ifnull(rv.fin, '00:00:00') as fin_viaje,
        rv.vehiculos_matricula as last_vehicle,
        rn.intensivo,
        rn.dia_fichaje,
        ra.id as advance_id,
        ra.accepted as advance_accepted,
        ra.user_notified,
        ra.amount as advance_amount

      FROM users u
      LEFT JOIN registros_new rn 
          ON u.nombre = rn.usuario
      LEFT JOIN (
          SELECT p1.*
          FROM pausas p1
          INNER JOIN (
              SELECT registro_id, MAX(id) AS last_id
              FROM pausas
              GROUP BY registro_id
          ) p2 ON p1.id = p2.last_id
      ) p ON rn.id = p.registro_id
      LEFT JOIN (
          SELECT rv1.*
          FROM registros_vehiculos rv1
          INNER JOIN (
              SELECT registro_id, MAX(id) AS last_id
              FROM registros_vehiculos
              GROUP BY registro_id
          ) rv2 ON rv1.id = rv2.last_id
      ) rv ON rn.id = rv.registro_id
      LEFT JOIN (
          SELECT ra1.*
          FROM registros_anticipos ra1
          INNER JOIN (
              SELECT id_user, MAX(id) AS last_id
              FROM registros_anticipos
              GROUP BY id_user
          ) ra2 ON ra1.id = ra2.last_id
      ) ra ON u.id = ra.id_user
      WHERE u.nfc_id = ?
        AND rn.fecha = CURDATE()
      ORDER BY rn.id DESC
      LIMIT 1;
    `, [cardNumber]);

    if (rows.length === 0) {
      console.log('nop')
      return res.status(404).json({ valid: false, message: 'Tarjeta no válida' });
    }
    console.log("Esto sera userData: ", rows[0])
    await db.query('UPDATE registros_anticipos SET user_notified = 1 where id = ?',
    [ rows[0].advance_id ]);

    return res.json({ valid: true, data: rows[0] });
  } catch (error) {
    console.log('nop')
    console.error(error);
    return res.status(500).json({ error: 'Error en la base de datos' });
  }
});

app.put('/api/update-fichaje', async (req, res) => {
  const { nfc_id, nombre, in_time, out_time, pause_time, restart_time, pause, restart, pauseState, action, delegacion } = req.body;
  let { fechaTarget } = req.body;
  console.log('Datos:', req.body)
  const conn = await db.getConnection();
  await conn.beginTransaction();

  let fechaTargetSQL;

  if (action === 'out' && in_time && out_time < '08:00:00') {
    console.log("🕒 Fichaje nocturno detectado, aplicando fecha del día anterior");
    fechaTargetSQL = 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
  } else if (fechaTarget) {
    fechaTargetSQL = `'${fechaTarget}'`;
  } else {
    fechaTargetSQL = 'CURDATE()';
  }

  const query = `
    UPDATE registros_new 
    JOIN users ON registros_new.id_user = users.id
    SET 
      in_time = CASE WHEN ? <> '00:00:00' THEN ? ELSE in_time END,
      out_time = CASE WHEN ? <> '00:00:00' THEN ? ELSE out_time END,
      pause_time = CASE WHEN ? <> '00:00:00' THEN ? ELSE pause_time END,
      restart_time = CASE WHEN ? <> '00:00:00' THEN ? ELSE restart_time END,
      delegacion_fichaje = CASE WHEN ? IS NOT NULL THEN ? ELSE delegacion_fichaje END
    WHERE users.nfc_id = ? AND fecha = ${fechaTargetSQL}
  `;
  console.log('la query es: ' + query)
  try {
    await conn.query(query, [
      in_time, in_time,             // para el primer CASE
      out_time, out_time,           // segundo CASE
      pause_time, pause_time,       // tercero
      restart_time, restart_time,   // cuarto
      delegacion, delegacion,       // quinto
      nfc_id                        // WHERE usuario = ?
    ]);

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

    console.error("❌ ERROR actualizando fichaje:");
    console.error("Mensaje:", err.message);
    console.error("Código:", err.code);
    console.error("Stack:", err.stack);
    console.error("Datos recibidos:", JSON.stringify(req.body, null, 2));

    res.status(500).json({ 
      error: "Error en la base de datos", 
      details: err.message 
    });
  } finally {
    conn.release();
  }
});

app.post('/procesarRegistrosVehiculos', async (req, res) => {
  console.log('Procesando registro de vehículo:', req.body);
  let {
    usuario,
    inicio_viaje,
    fin_viaje,
    selectedVehicle,
    kmsSubmit,
    kmsProximaRevisionManual
  } = req.body;
  
  const esViajeEnCurso = inicio_viaje !== '00:00:00' && fin_viaje === '00:00:00';

  if (kmsProximaRevisionManual === '') {
    kmsProximaRevisionManual = null;
  }
  const conn = await db.getConnection();
  try {

    await conn.beginTransaction();

    // 1. Obtener registro_id
    const [registroRows] = await conn.query(
      'SELECT id FROM registros_new WHERE usuario = ? AND fecha = CURDATE()',
      [usuario]
    );
    if (registroRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    }

    const registroId = registroRows[0].id;
    console.log('Registro ID:', registroId);

    // 2. Actualizar tabla vehiculos
    await conn.query(
      `UPDATE vehiculos
        SET 
          kms = ?, 
          kms_proxima_revision = CASE 
            WHEN ? IS NOT NULL THEN ?
            ELSE kms_proxima_revision
          END
        WHERE matricula = ?;
      `,
      [kmsSubmit, kmsProximaRevisionManual, kmsProximaRevisionManual, selectedVehicle]
    );

    // 3. Actualizar registros_new
    await conn.query(
      'UPDATE registros_new SET matricula = ?, kms_prox_revision = ? WHERE usuario = ? AND fecha = CURDATE()',
      [selectedVehicle, kmsProximaRevisionManual, usuario]
    );

    // 4. Insertar o actualizar viaje
    if (esViajeEnCurso) {
      // Finalizar viaje
      await conn.query(
        `
        UPDATE registros_vehiculos 
        SET fin = CURTIME(), vehiculos_matricula = ?, kms_out = ?
        WHERE registro_id = ?
        ORDER BY id DESC LIMIT 1
      `,
        [selectedVehicle, kmsSubmit, registroId]
      );
    } else {
      // Nuevo viaje
      await conn.query(
        `
        INSERT INTO registros_vehiculos (vehiculos_matricula, kms_in, inicio, registro_id)
        VALUES (?, ?, CURTIME(), ?)
      `,
        [selectedVehicle, kmsSubmit, registroId]
      );
    }

    await conn.commit();
    res.status(200).json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error en /procesarRegistrosVehiculos:', err);
    res.status(500).json({ success: false, message: 'Error procesando registro de vehículo' });
  } finally {
    conn.release();
  }
});

app.post('/vehiculos', async (req, res) => {
  console.log('Recibiendo solicitud de vehículos');

  try {
    const [rows] = await db.query('SELECT * FROM vehiculos');

    res.json(rows);
  } catch (error) {
    console.error('Error en la base de datos:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/procesarAnticipos', async (req, res) => {
  const { id_user, nombre, amount, delegacion } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO registros_anticipos (id_user, amount) VALUES (?, ?)',
      [id_user, amount]
    );

    res.status(200).json({ success: true, message: 'Éxito al insertar registro anticipos ' });

    if(graphClient){
      let htmlTemplate = anticiposPreset({id_user, nombre, amount, delegacion, id_registro: result.insertId})

      graphClient
        .api(`/users/${process.env.ADVANCES_FROM_MAIL}/sendMail`)
        .post({
          message: {
            subject: 'Petición anticipo FichaFlex',
            body: {
              contentType: 'HTML',
              content: htmlTemplate,
            },
            toRecipients: process.env.ADVANCES_TO_MAIL
              .split(',')
              .map(email => ({
                emailAddress: {
                  address: email.trim()
                }
              })),
            attachments: [{
              '@odata.type': '#microsoft.graph.fileAttachment',
              name: 'firma.png',
              contentId: 'fichaflexImage',
              isInline: true,
              contentBytes: fs.readFileSync(
                path.resolve(__dirname, '../src/assets/FichAdalmoFlexCompress.png')
              ).toString('base64'),
            }]
          },
          saveToSentItems: false,
        });

    }
  } catch (err) {
    console.error('Error al insertar registro anticipos ', err)
    res.status(500).json({ success: false, message: 'Error al insertar registro anticipos ' });
  }
});

app.listen(PORT, () => {
  console.log(`API backend escuchando en http://localhost:${PORT}`);
});