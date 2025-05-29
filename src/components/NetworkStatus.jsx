// src/components/NetworkStatus.jsx
import React, { useEffect, useState, useRef } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { showCustomToast } from "./CustomToast";
import toast from "react-hot-toast";

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const toastIdRef = useRef(null); // para poder cerrar el toast después

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);

      if (!online && !toastIdRef.current) {
        // Mostrar toast persistente
        toastIdRef.current = toast.error("Intentando reconectar", {
          duration: Infinity,
        });
      } else if (online && toastIdRef.current) {
        // Cerrar toast si vuelve la conexión
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Ejecutar al montar también
    updateOnlineStatus();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return (
    <div className="network-status">
      {isOnline ? (
        <Wifi size={60} className="text-gray-300" />
      ) : (
        <WifiOff size={60} className="text-red-300" />
      )}
    </div>
  );
};

export default NetworkStatus;
