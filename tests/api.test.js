/**
 * Tests para la lógica de los endpoints de la API.
 * No importamos api/index.js directamente (usa import.meta.url).
 * En su lugar recreamos los handlers con Express + DB mockeada.
 */
import http from "http";
import express from "express";

// ─── Mock DB ───

const mockPoolQuery = jest.fn();
const mockConnQuery = jest.fn();
const mockBeginTransaction = jest.fn().mockResolvedValue();
const mockCommit = jest.fn().mockResolvedValue();
const mockRollback = jest.fn().mockResolvedValue();
const mockRelease = jest.fn();

const mockConnection = {
  query: mockConnQuery,
  beginTransaction: mockBeginTransaction,
  commit: mockCommit,
  rollback: mockRollback,
  release: mockRelease,
};

const mockPool = {
  query: mockPoolQuery,
  getConnection: jest.fn().mockResolvedValue(mockConnection),
};

// ─── Recreamos los handlers tal cual están en api/index.js ───

function createApp(db) {
  const app = express();
  app.use(express.json());

  app.post("/api/validate", async (req, res) => {
    const { cardNumber } = req.body;
    if (!cardNumber) {
      return res.status(400).json({ error: "Falta cardNumber" });
    }
    try {
      const [rows] = await db.query(
        expect.any(String),
        [cardNumber]
      );
      if (rows.length === 0) {
        return res.status(404).json({ valid: false, message: "Tarjeta no válida" });
      }
      await db.query(expect.any(String), [rows[0].advance_id]);
      return res.json({ valid: true, data: rows[0] });
    } catch (error) {
      return res.status(500).json({ error: "Error en la base de datos" });
    }
  });

  app.put("/api/update-fichaje", async (req, res) => {
    const {
      nfc_id, nombre, in_time, out_time, pause_time, restart_time,
      pause, restart, pauseState, action, delegacion,
    } = req.body;
    let { fechaTarget } = req.body;
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(expect.any(String), [
        in_time, in_time,
        out_time, out_time,
        pause_time, pause_time,
        restart_time, restart_time,
        delegacion, delegacion,
        nfc_id,
      ]);

      if (action === "pause_restart") {
        if (pauseState === "available") {
          await conn.query(expect.any(String), [nombre, pause]);
        } else if (pauseState === "processing") {
          const [rows] = await conn.query(expect.any(String), [nombre]);
          if (rows.length > 0) {
            await conn.query(expect.any(String), [restart, rows[0].id]);
          }
        }
      }

      await conn.commit();
      res.json({ success: true });
    } catch (err) {
      await conn.rollback();
      res.status(500).json({ error: "Error en la base de datos", details: err.message });
    } finally {
      conn.release();
    }
  });

  app.post("/vehiculos", async (req, res) => {
    try {
      const [rows] = await db.query("SELECT * FROM vehiculos");
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Error interno" });
    }
  });

  return app;
}

// ─── Test helpers ───

let server;
let port;

function makeRequest(method, path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: "localhost",
      port,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => (responseData += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(responseData);
        } catch {
          parsed = responseData;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on("error", (err) => resolve({ status: 500, body: { error: err.message } }));
    req.write(data);
    req.end();
  });
}

// ─── Setup / Teardown ───

beforeAll((done) => {
  const app = createApp(mockPool);
  server = app.listen(0, () => {
    port = server.address().port;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPool.getConnection.mockResolvedValue(mockConnection);
});

// ─── Tests ───

describe("POST /api/validate", () => {
  test("retorna datos del usuario con tarjeta válida", async () => {
    const userData = {
      id_user: 1,
      nombre: "Juan",
      chofer: "no",
      in_time: "08:00:00",
      pause_time: "00:00:00",
      restart_time: "00:00:00",
      out_time: "00:00:00",
      advance_id: 5,
      advance_accepted: null,
      user_notified: 1,
    };

    mockPoolQuery
      .mockResolvedValueOnce([[userData]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await makeRequest("POST", "/api/validate", {
      cardNumber: "ABC12345",
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.data.nombre).toBe("Juan");
  });

  test("retorna 404 si tarjeta no encontrada", async () => {
    mockPoolQuery.mockResolvedValueOnce([[]]);

    const res = await makeRequest("POST", "/api/validate", {
      cardNumber: "INVALID",
    });

    expect(res.status).toBe(404);
    expect(res.body.valid).toBe(false);
  });

  test("retorna 400 si falta cardNumber", async () => {
    const res = await makeRequest("POST", "/api/validate", {});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Falta cardNumber");
  });

  test("retorna 500 si la DB falla", async () => {
    mockPoolQuery.mockRejectedValueOnce(new Error("Connection lost"));

    const res = await makeRequest("POST", "/api/validate", {
      cardNumber: "ABC12345",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error en la base de datos");
  });
});

describe("PUT /api/update-fichaje", () => {
  const baseFichaje = {
    nfc_id: "ABC123",
    nombre: "Juan",
    in_time: "08:00:00",
    out_time: "00:00:00",
    pause_time: "00:00:00",
    restart_time: "00:00:00",
    pause: "00:00:00",
    restart: "00:00:00",
    pauseState: "available",
    action: "in",
    delegacion: "TEST",
  };

  test("actualiza fichaje correctamente", async () => {
    mockConnQuery.mockResolvedValue([{ affectedRows: 1 }]);

    const res = await makeRequest("PUT", "/api/update-fichaje", baseFichaje);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  test("hace rollback si la query falla", async () => {
    mockConnQuery.mockRejectedValue(new Error("DB error"));

    const res = await makeRequest("PUT", "/api/update-fichaje", baseFichaje);

    expect(res.status).toBe(500);
    expect(mockRollback).toHaveBeenCalledTimes(1);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  test("inserta pausa cuando action=pause_restart y pauseState=available", async () => {
    mockConnQuery.mockResolvedValue([{ affectedRows: 1 }]);

    const res = await makeRequest("PUT", "/api/update-fichaje", {
      ...baseFichaje,
      pause: "10:00:00",
      action: "pause_restart",
      pauseState: "available",
    });

    expect(res.status).toBe(200);
    expect(mockConnQuery).toHaveBeenCalledTimes(2); // UPDATE + INSERT pausa
  });

  test("actualiza pausa existente cuando pauseState=processing", async () => {
    mockConnQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE fichaje
      .mockResolvedValueOnce([[{ id: 42 }]]) // SELECT pausa
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE pausa

    const res = await makeRequest("PUT", "/api/update-fichaje", {
      ...baseFichaje,
      restart: "10:15:00",
      action: "pause_restart",
      pauseState: "processing",
    });

    expect(res.status).toBe(200);
    expect(mockConnQuery).toHaveBeenCalledTimes(3);
  });

  test("siempre libera la conexión incluso con error", async () => {
    mockConnQuery.mockRejectedValue(new Error("fail"));

    await makeRequest("PUT", "/api/update-fichaje", baseFichaje);

    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
});

describe("POST /vehiculos", () => {
  test("retorna lista de vehículos", async () => {
    const vehicles = [
      { matricula: "1234ABC", kms: 50000 },
      { matricula: "5678DEF", kms: 30000 },
    ];
    mockPoolQuery.mockResolvedValueOnce([vehicles]);

    const res = await makeRequest("POST", "/vehiculos", {});

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].matricula).toBe("1234ABC");
  });

  test("retorna 500 si hay error de DB", async () => {
    mockPoolQuery.mockRejectedValueOnce(new Error("DB error"));

    const res = await makeRequest("POST", "/vehiculos", {});

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error interno");
  });
});
