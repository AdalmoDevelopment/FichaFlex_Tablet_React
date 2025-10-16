import React, { createContext, useContext, useState } from "react";

// Estructura inicial: objeto vacío
// {
//   "1234": {
//     in_time: '00:00:00',
//     out_time: '00:00:00',
//     pause_time: '00:00:00',
//     restart_time: '00:00:00',
//     pause: false,
//     restart: false
//   }
// }
const OfflineStoreContext = createContext({});

export const OfflineStoreProvider = ({ children }) => {
  const [offlineUsers, setOfflineUsers] = useState({});

  // 🔹 añadir usuario si no existe
  const addUserIfNotExists = (cardNumber) => {

    try {
      setOfflineUsers((prev) => {
        if (prev[cardNumber]) return prev;
        return {
          ...prev,
          [cardNumber]: {
            in_time: '00:00:00',
            out_time: '00:00:00',
            pause_time: '00:00:00',
            restart_time: '00:00:00',
            pause: '00:00:00',
            restart: '00:00:00',
          },
        };
      }); 
    } catch (error) {
      console.log(error)
    }
  };

  // 🔹 actualizar un campo del usuario
  const updateUser = (cardNumber, updates) => {
    setOfflineUsers((prev) => ({
      ...prev,
      [cardNumber]: {
        ...prev[cardNumber],
        ...updates,
      },
    }));
  };

  // 🔹 resetear toda la store
  const resetStore = () => setOfflineUsers({});

  return (
    <OfflineStoreContext.Provider
      value={{ offlineUsers, addUserIfNotExists, updateUser, resetStore }}
    >
      {children}
    </OfflineStoreContext.Provider>
  );
};

export const useOfflineStore = () => useContext(OfflineStoreContext);
