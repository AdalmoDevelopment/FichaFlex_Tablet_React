/**
 * Lógica de negocio pura para el cálculo de estados de fichaje.
 * Extraída de FichajesPage y useHandlePressButton para poder testearla.
 */

export function getIsStartOfWorkday(userData) {
  return userData.in_time !== "00:00:00";
}

export function getBreakState(userData) {
  if (
    userData.dia_fichaje === "sábado" ||
    userData.dia_fichaje === "domingo"
  ) {
    return "disabled";
  }
  if (
    userData.pause_time === "00:00:00" &&
    userData.restart_time === "00:00:00"
  ) {
    return "available";
  }
  if (
    userData.pause_time !== "00:00:00" &&
    userData.restart_time === "00:00:00"
  ) {
    return "processing";
  }
  return "disabled";
}

export function getBreakStateWithIntensivo(userData) {
  if (
    userData.intensivo === "si" ||
    userData.dia_fichaje === "sábado" ||
    userData.dia_fichaje === "domingo"
  ) {
    return "disabled";
  }
  if (
    userData.pause_time === "00:00:00" &&
    userData.restart_time === "00:00:00"
  ) {
    return "available";
  }
  if (
    userData.pause_time !== "00:00:00" &&
    userData.restart_time === "00:00:00"
  ) {
    return "processing";
  }
  return "disabled";
}

export function getPauseState(userData) {
  if (
    userData.pause !== "00:00:00" &&
    userData.restart === "00:00:00"
  ) {
    return "processing";
  }
  return "available";
}

export function getTripState(userData) {
  if (userData.chofer !== "yes") return "";
  if (
    userData.inicio_viaje !== "00:00:00" &&
    userData.fin_viaje === "00:00:00"
  ) {
    return "processing";
  }
  return "available";
}

/**
 * Determina qué acción/validación aplicar al pulsar un botón de fichaje.
 * Retorna { allowed: boolean, warning?: string }
 */
export function validateAction(action, userData, isOnline) {
  const isStartOfWorkday = getIsStartOfWorkday(userData);
  const breakState = getBreakStateWithIntensivo(userData);
  const pauseState = getPauseState(userData);

  if (isStartOfWorkday && action === "in" && pauseState !== "processing") {
    return { allowed: false, warning: "Ya has empezado la jornada" };
  }
  if (action === "out" && !isStartOfWorkday) {
    return { allowed: false, warning: "Inicia la jornada antes de fichar salida" };
  }
  if (action === "out" && userData.out_time !== "00:00:00") {
    return { allowed: false, warning: "Ya has fichado la salida" };
  }
  if (pauseState === "processing" && action !== "pause_restart") {
    return { allowed: false, warning: "Termina la pausa antes de seguir" };
  }
  if (breakState === "processing" && action !== "restart") {
    return { allowed: false, warning: "Termina la comida antes de seguir" };
  }
  if (action === "pause" && !isStartOfWorkday) {
    return { allowed: false, warning: "Inicia la jornada antes de fichar comida" };
  }
  if (
    action === "restart" &&
    userData.pause_time === "00:00:00" &&
    isOnline
  ) {
    return {
      allowed: false,
      warning: "No se puede acabar una comida no iniciada",
    };
  }

  return { allowed: true };
}