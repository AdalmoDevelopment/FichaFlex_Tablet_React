import React, { useEffect, useState } from "react";
import MainPage from "./pages/MainPage";
import FichajesPage from "./pages/FichajesPage";
import FichajesPageOffline from "./pages/FichajesPageOffline";
import { ToastContainer } from "./components/CustomToast";
import SnowCanvas from "./components/SnowCanvas";
import { useNetwork } from "./context/NetworkContext";
import { useOfflineStore } from "./context/OfflineStoreContext";

const isWinter = new Date().getMonth() === 11;

const App = () => {
  useEffect(() => {
    console.log("window.test?", window);
    window.test?.ping?.();
  }, []);

  const { resetStore } = useOfflineStore();
  const { isOnline } = useNetwork();

  const [nfcValidated, setNfcValidated] = useState(null);
  const [userData, setUserData] = useState(null);

  // 🧹 LIMPIEZA AUTOMÁTICA DIARIA
  useEffect(() => {
    const checkAndClean = () => {
      const lastCleanDate = localStorage.getItem("lastCleanDate");
      const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

      if (lastCleanDate !== today) {
        console.log("🧹 Nuevo día detectado — limpiando store y userdata");
        setNfcValidated(null); // 🔹 Volver a la pantalla principal
        resetStore();
        setUserData(null);
        localStorage.setItem("lastCleanDate", today);
      }
    };
 
    checkAndClean();
 
    const interval = setInterval(checkAndClean, 60 * 100);

    return () => clearInterval(interval);
  }, [resetStore]);

  return (
    <>
      <ToastContainer />

      {isWinter && <SnowCanvas />}

      {!nfcValidated ? (
        <MainPage onValidCard={setNfcValidated} setUserData={setUserData} />
      ) : nfcValidated && isOnline ? (
        <FichajesPage onValidCard={setNfcValidated} userData={userData} />
      ) 
      :  
      (
        <MainPage onValidCard={setNfcValidated} setUserData={setUserData} />
        //   <FichajesPageOffline onValidCard={setNfcValidated} userData={userData} />
      )
      }
    </>
  );
};

export default App;
