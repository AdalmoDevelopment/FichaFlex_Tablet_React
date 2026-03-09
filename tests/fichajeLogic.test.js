import {
  getIsStartOfWorkday,
  getBreakState,
  getBreakStateWithIntensivo,
  getPauseState,
  getTripState,
  validateAction,
} from "../src/funcs/fichajeLogic";

// ─── Datos base para reutilizar ───

const baseUser = {
  in_time: "00:00:00",
  out_time: "00:00:00",
  pause_time: "00:00:00",
  restart_time: "00:00:00",
  pause: "00:00:00",
  restart: "00:00:00",
  intensivo: "no",
  dia_fichaje: "lunes",
  chofer: "no",
  inicio_viaje: "00:00:00",
  fin_viaje: "00:00:00",
};

const userWith = (overrides) => ({ ...baseUser, ...overrides });

// ─── getIsStartOfWorkday ───

describe("getIsStartOfWorkday", () => {
  test("devuelve false si in_time es 00:00:00", () => {
    expect(getIsStartOfWorkday(baseUser)).toBe(false);
  });

  test("devuelve true si ya ha fichado entrada", () => {
    expect(getIsStartOfWorkday(userWith({ in_time: "08:30:00" }))).toBe(true);
  });
});

// ─── getBreakState ───

describe("getBreakState", () => {
  test("available cuando no ha empezado ni acabado comida", () => {
    expect(getBreakState(baseUser)).toBe("available");
  });

  test("processing cuando ha empezado comida pero no acabado", () => {
    expect(
      getBreakState(userWith({ pause_time: "13:00:00", restart_time: "00:00:00" }))
    ).toBe("processing");
  });

  test("disabled cuando comida ya completada", () => {
    expect(
      getBreakState(userWith({ pause_time: "13:00:00", restart_time: "13:30:00" }))
    ).toBe("disabled");
  });

  test("disabled en sábado", () => {
    expect(getBreakState(userWith({ dia_fichaje: "sábado" }))).toBe("disabled");
  });

  test("disabled en domingo", () => {
    expect(getBreakState(userWith({ dia_fichaje: "domingo" }))).toBe("disabled");
  });
});

// ─── getBreakStateWithIntensivo ───

describe("getBreakStateWithIntensivo", () => {
  test("disabled si jornada intensiva", () => {
    expect(getBreakStateWithIntensivo(userWith({ intensivo: "si" }))).toBe(
      "disabled"
    );
  });

  test("available en jornada normal sin comida fichada", () => {
    expect(getBreakStateWithIntensivo(baseUser)).toBe("available");
  });
});

// ─── getPauseState ───

describe("getPauseState", () => {
  test("available cuando no hay pausa activa", () => {
    expect(getPauseState(baseUser)).toBe("available");
  });

  test("processing cuando hay pausa sin reinicio", () => {
    expect(
      getPauseState(userWith({ pause: "10:00:00", restart: "00:00:00" }))
    ).toBe("processing");
  });

  test("available cuando la pausa ya se reinició", () => {
    expect(
      getPauseState(userWith({ pause: "10:00:00", restart: "10:15:00" }))
    ).toBe("available");
  });
});

// ─── getTripState ───

describe("getTripState", () => {
  test("string vacío si no es chofer", () => {
    expect(getTripState(baseUser)).toBe("");
  });

  test("available para chofer sin viaje activo", () => {
    expect(getTripState(userWith({ chofer: "yes" }))).toBe("available");
  });

  test("processing para chofer con viaje en curso", () => {
    expect(
      getTripState(
        userWith({ chofer: "yes", inicio_viaje: "08:00:00", fin_viaje: "00:00:00" })
      )
    ).toBe("processing");
  });

  test("available para chofer con viaje terminado", () => {
    expect(
      getTripState(
        userWith({ chofer: "yes", inicio_viaje: "08:00:00", fin_viaje: "12:00:00" })
      )
    ).toBe("available");
  });
});

// ─── validateAction ───

describe("validateAction", () => {
  test("permite entrada si no ha fichado aún", () => {
    const result = validateAction("in", baseUser, true);
    expect(result.allowed).toBe(true);
  });

  test("bloquea entrada duplicada", () => {
    const user = userWith({ in_time: "08:00:00" });
    const result = validateAction("in", user, true);
    expect(result.allowed).toBe(false);
    expect(result.warning).toBe("Ya has empezado la jornada");
  });

  test("bloquea salida sin haber iniciado jornada", () => {
    const result = validateAction("out", baseUser, true);
    expect(result.allowed).toBe(false);
    expect(result.warning).toBe("Inicia la jornada antes de fichar salida");
  });

  test("bloquea salida duplicada", () => {
    const user = userWith({ in_time: "08:00:00", out_time: "17:00:00" });
    const result = validateAction("out", user, true);
    expect(result.allowed).toBe(false);
    expect(result.warning).toBe("Ya has fichado la salida");
  });

  test("bloquea acciones durante pausa activa excepto pause_restart", () => {
    const user = userWith({
      in_time: "08:00:00",
      pause: "10:00:00",
      restart: "00:00:00",
    });
    expect(validateAction("out", user, true).allowed).toBe(false);
    expect(validateAction("out", user, true).warning).toBe(
      "Termina la pausa antes de seguir"
    );
    // pause_restart sí está permitido
    expect(validateAction("pause_restart", user, true).allowed).toBe(true);
  });

  test("bloquea acciones durante comida activa excepto restart", () => {
    const user = userWith({
      in_time: "08:00:00",
      pause_time: "13:00:00",
      restart_time: "00:00:00",
    });
    expect(validateAction("out", user, true).allowed).toBe(false);
    expect(validateAction("out", user, true).warning).toBe(
      "Termina la comida antes de seguir"
    );
    // restart sí está permitido
    expect(validateAction("restart", user, true).allowed).toBe(true);
  });

  test("bloquea iniciar comida sin haber iniciado jornada", () => {
    const result = validateAction("pause", baseUser, true);
    expect(result.allowed).toBe(false);
    expect(result.warning).toBe("Inicia la jornada antes de fichar comida");
  });

  test("permite iniciar comida si jornada ya iniciada", () => {
    const user = userWith({ in_time: "08:00:00" });
    const result = validateAction("pause", user, true);
    expect(result.allowed).toBe(true);
  });

  test("bloquea finalizar comida no iniciada (online)", () => {
    const user = userWith({ in_time: "08:00:00" });
    const result = validateAction("restart", user, true);
    expect(result.allowed).toBe(false);
    expect(result.warning).toBe("No se puede acabar una comida no iniciada");
  });

  test("permite finalizar comida no iniciada offline (sin validación server)", () => {
    const user = userWith({ in_time: "08:00:00" });
    const result = validateAction("restart", user, false);
    expect(result.allowed).toBe(true);
  });

  test("permite salida normal", () => {
    const user = userWith({ in_time: "08:00:00" });
    const result = validateAction("out", user, true);
    expect(result.allowed).toBe(true);
  });

  test("permite comida completa: pause -> restart", () => {
    // Primero pause
    const user1 = userWith({ in_time: "08:00:00" });
    expect(validateAction("pause", user1, true).allowed).toBe(true);

    // Luego restart
    const user2 = userWith({
      in_time: "08:00:00",
      pause_time: "13:00:00",
      restart_time: "00:00:00",
    });
    expect(validateAction("restart", user2, true).allowed).toBe(true);
  });

  test("permite entrada durante pausa processing (reinicio de jornada)", () => {
    const user = userWith({
      in_time: "08:00:00",
      pause: "10:00:00",
      restart: "00:00:00",
    });
    // in durante pausa processing -> bloqueado por "Termina la pausa"
    const result = validateAction("in", user, true);
    expect(result.allowed).toBe(false);
  });
});