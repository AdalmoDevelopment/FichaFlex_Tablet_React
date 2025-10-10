// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App


// src/App.jsx
import React, { useEffect, useState } from "react";
import MainPage from "./pages/MainPage";
import FichajesPage from "./pages/FichajesPage";
import FichajesPageOffline from "./pages/FichajesPageOffline";
import { ToastContainer } from "./components/CustomToast";
import SnowCanvas from "./components/SnowCanvas";
import { useNetwork } from "./context/NetworkContext";

const isWinter = new Date().getMonth() === 11; 

const App = () => {
  useEffect(() => {
  console.log("window.test?", window);
  window.test?.ping?.();
}, []);

  const { isOnline } = useNetwork();

  const [nfcValidated, setNfcValidated] = useState(null);
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {})
  return (
    <>
    <ToastContainer />
    
    
    {isWinter && <SnowCanvas/>}

      {!nfcValidated ? (
        <MainPage onValidCard={setNfcValidated} setUserData={setUserData} />
      ) : nfcValidated && isOnline ? (
        <FichajesPage onValidCard={setNfcValidated} userData={userData} />
      ) :
      (
        <FichajesPageOffline onValidCard={setNfcValidated} userData={userData} />
      )
      }
    </>
    
  );
};

export default App;
