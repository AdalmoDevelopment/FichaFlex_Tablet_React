import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import config from "./ConfigEnv";

const NetworkContext = createContext({ isOnline: true });

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    updateOnlineStatus(); // ejecutar al montar

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

useEffect(() => {
  if (!isOnline) return;

  const interval = setInterval(async () => {
    const pending = window.sqlite.logsDB?.getPendingLogs();
    if (pending && pending.length > 0) {
      for (const log of pending) {
        try {
          await axios.put(`http://${config.url}:3000/api/update-fichaje`, {
            nfc_id: log.nfc_id,
            nombre: log.nombre,
            in_time: log.in_time,
            out_time: log.out_time,
            pause_time: log.pause_time,
            restart_time: log.restart_time,
            pause: log.pause,
            restart: log.restart,
            pauseState: log.pauseState,
            action: log.action,
            delegacion: config.delegacion,
            fechaTarget: log.fecha
          });
          window.sqlite.logsDB?.markAsSynced([log.id]);
          console.log("☁️ Log sincronizado con servidor:", log.id);
        } catch (err) {
          console.error("⚠️ Error al sincronizar log:", err.response?.data || err);
        }
      }
    }
  }, 5000); // cada 5 segundos

  return () => clearInterval(interval);
}, [isOnline]);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
