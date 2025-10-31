// src/pages/FichajesPageOffline.jsx
import { useEffect, useState } from "react";
import entradaImgAdalmo from '../assets/adalmo_ul.png';
import salidaImgAdalmo  from '../assets/adalmo_ur.png';
import inicioComidaImgAdalmo  from '../assets/adalmo_dl.png';
import finalComidaImgAdalmo  from '../assets/adalmo_dr.png';

import entradaImgFerrimet from '../assets/ferrimet_ul.png';
import salidaImgFerrimet  from '../assets/ferrimet_ur.png';
import inicioComidaImgFerrimet  from '../assets/ferrimet_dl.png';
import finalComidaImgFerrimet  from '../assets/ferrimet_dr.png';

import entradaImgDRA from '../assets/dra_ul.png';
import salidaImgDRA  from '../assets/dra_ur.png';
import inicioComidaImgDRA  from '../assets/dra_dl.png';
import finalComidaImgDRA from '../assets/dra_dr.png';

import pauseImg from '../assets/screen_pausa_jornada.png';
import restartImg from '../assets/screen_reinicio_jornada.png';
import salirImg from '../assets/screen_salir.png';
import pauseHolder from '../assets/pause_holder.png';
import { showCustomToast } from "../components/CustomToast";
import soundalert from '../assets/audio/soundalert.wav';
import Icon from '@mdi/react';
import { mdiTruckCheck, mdiTruckFast } from '@mdi/js';
import { useOfflineStore } from "../context/OfflineStoreContext";
import config from "../context/ConfigEnv";
import { useHandlePressButton } from "../funcs/useHandlePressButton";

const FichajesPageOffline = ({ onValidCard, userData }) => {

  const { addUserIfNotExists, updateUser, offlineUsers } = useOfflineStore();

  const handlePressButton  = useHandlePressButton();

  const buttonBackgroundByCompany = {
    entradaImg : { adalmo: entradaImgAdalmo, ferrimet: entradaImgFerrimet, dra: entradaImgDRA },
    salidaImg : { adalmo: salidaImgAdalmo, ferrimet: salidaImgFerrimet, dra: salidaImgDRA },
    inicioComidaImg : { adalmo: inicioComidaImgAdalmo, ferrimet: inicioComidaImgFerrimet, dra: inicioComidaImgDRA },
    finalComidaImg : { adalmo: finalComidaImgAdalmo, ferrimet: finalComidaImgFerrimet, dra: finalComidaImgDRA }
  };

//   const playSound = () => new Audio(soundalert).play();

  const isStartOfWorkday = userData.data.in_time !== '00:00:00';
  const breakState =
    userData.data.intensivo === 'si' || ["sábado", "domingo"].includes(userData.data.dia_fichaje)
      ? 'disabled'
      : userData.data.pause_time === '00:00:00' && userData.data.restart_time === '00:00:00'
        ? 'available'
        : userData.data.pause_time !== '00:00:00' && userData.data.restart_time === '00:00:00'
          ? 'processing'
          : 'disabled';
  const pauseState =
    userData.data.pause !== '00:00:00' && userData.data.restart === '00:00:00'
      ? 'processing'
      : 'available';

// const handlePressButton  = (action) => {
//   const curTime = new Date().toLocaleTimeString("es-ES", {
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });

//   // Aseguramos que este user exista en el store
//   addUserIfNotExists(userData.data.nfc_id);
 
//   if (action === "in") {
//     updateUser(userData.data.nfc_id, { in_time: curTime });
//     showCustomToast({ type: "success", message: "Jornada iniciada" });
//   } else if (action === "out") {
//     updateUser(userData.data.nfc_id, { out_time: curTime });
//     showCustomToast({ type: "success", message: "Jornada finalizada" });
//   } else if (action === "pause") {
//     updateUser(userData.data.nfc_id, { pause_time: curTime });
//     showCustomToast({ type: "success", message: "Comida iniciada" });
//   } else if (action === "restart") {
//     updateUser(userData.data.nfc_id, { restart_time: curTime });
//     showCustomToast({ type: "success", message: "Comida finalizada" });
//   } else if (action === "pause_restart") {
//     if (pauseState === "available") {
//       updateUser(userData.data.nfc_id, { pause: curTime });
//       showCustomToast({ type: "success", message: "Pausa iniciada" });
//     } else {
//       updateUser(userData.data.nfc_id, { restart: curTime });
//       showCustomToast({ type: "success", message: "Pausa terminada" });
//     }
//   }
//     if (action !== "pause_restart") {
//         window.sqlite.logsDB?.saveOfflineLog({
//         data: userData.data,
//         field: `${action}_time`,
//         value: curTime
//         });
//     }


//   onValidCard(false);
// };


    const useRealTimePause = (horaInicio) => {
        const [pausa, setPausa] = useState("00:00:00");
        

        useEffect(() => {
            const toSec = h => h.split(":").reduce((a, b) => a * 60 + +b);

            const update = () => {
            const ahora = new Date();
            const horaActual = ahora.toTimeString().split(" ")[0];

            const diff = toSec(horaActual) - toSec(horaInicio);
            const h = String(Math.floor(diff / 3600)).padStart(2, "0");
            const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
            const s = String(diff % 60).padStart(2, "0");

            setPausa(`${h}:${m}:${s}`);
            };

            update(); // llama al inicio
            const interval = setInterval(update, 1000);
            return () => clearInterval(interval);
        }, [horaInicio]);

        return pausa;
    }; 

  return (
        <div style={{
            background: `linear-gradient(rgba(255,255,255,0.0), rgba(0,0,0,0.1)), ${config.backgroundColorOptions}`,
            minHeight: '100vh',
            width: '100vw',
            height: '100vh',
            fontFamily: 'sans-serif',
            padding: 30,
            overflow: 'hidden',
            position: 'relative',
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',

        }}>
            {/* BIENVENIDA */}
            <h2 style={{
                fontWeight: 700,
                fontSize: 22,
                textAlign: 'center',
                paddingBottom: 20,
                color: config.textColor,
                opacity: 0.8
            }}> 
                Bienvenido, selecciona la opción:
            </h2>

            {/* BOTONES GRANDES CENTRO */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 30,
                height: '80%'
            }}>
                {/* Primera fila */}
                <div style={{ display: 'flex', gap: 60 }}>
                    {/* Entrada Jornada */}
                    <div
                        onClick={() => handlePressButton ('in', userData, onValidCard)}
                        className="pressed-effect"
                        style={{
                            backgroundImage: `linear-gradient${breakState !== 'processing' && pauseState !== 'processing' && isStartOfWorkday ? '(rgba(0,0,0,0.4), rgba(0,0,0,0.3))' : '(rgba(255,255,255,0.0), rgba(0,0,0,0.2))'}, url(${breakState === 'processing' || pauseState === 'processing' ? pauseHolder : buttonBackgroundByCompany.entradaImg[config.empresa]})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            borderRadius: 18,
                            width: '70vh',
                            height: '30vh',
                            display: 'flex',
                            alignItems: 'end',
                            justifyContent: 'center',
                            textAlign: 'center',
                            boxShadow: '0 4px 16px #0002',
                        }}
                    >
                        {breakState !== 'processing' && pauseState !== 'processing' && userData.data.in_time !== '00:00:00' &&
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 30, opacity: '20%'}}>
                                {userData.data.in_time}
                            </span>
                        }

                    </div>
                    {/* Salida Jornada */}
                    <div 
                        onClick={() => handlePressButton ('out', userData, onValidCard)}
                        className="pressed-effect"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.0), rgba(0,0,0,0.2)), url(${(breakState === 'processing' || pauseState === 'processing') ? pauseHolder : buttonBackgroundByCompany.salidaImg[config.empresa]})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            borderRadius: 18,
                            width: '70vh',
                            height: '30vh',
                            display: 'flex',
                            alignItems: 'end',
                            justifyContent: 'center',
                            textAlign: 'center',
                            boxShadow: '0 4px 16px #0002'
                    }}>
                        {breakState !== 'processing' && pauseState !== 'processing' && userData.data.out_time !== '00:00:00' &&
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 30, opacity: '20%'}}>
                                {userData.data.out_time}
                            </span>
                        }

                    </div>
                </div>
                {/* Segunda fila */}
                <div style={{ display: 'flex', gap: 60 }}>
                    {/* Inicio Comida */}
                    <div
                        onClick={() => handlePressButton ('pause', userData, onValidCard)}
                        className="pressed-effect"
                        style={{
                            backgroundImage: `linear-gradient${pauseState !== 'processing' && breakState === 'disabled' ? '(rgba(0,0,0,0.5), rgba(0,0,0,0.5))' : '(rgba(255,255,255,0.0), rgba(0,0,0,0.2))'}, url(${breakState === 'processing' || pauseState === 'processing' ? pauseHolder : buttonBackgroundByCompany.inicioComidaImg[config.empresa]})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            borderRadius: 18,
                            width: '70vh',
                            height: '30vh',
                            display: 'flex',
                            alignItems: 'end',
                            justifyContent: 'center',
                            textAlign: 'center',
                            boxShadow: '0 4px 16px #0002'
                    }}>
                        {breakState !== 'processing' && pauseState !== 'processing' && userData.data.pause_time !== '00:00:00' &&
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 30, opacity: '20%'}}>
                                {userData.data.pause_time}
                            </span>
                        }

                    </div>
                    {/* Final Comida */}
                    <div
                        className="pressed-effect"
                        onClick={() => handlePressButton ('restart', userData, onValidCard)}                        
                        style={{
                            backgroundImage: `linear-gradient${pauseState !== 'processing' && breakState === 'disabled' ? '(rgba(0,0,0,0.5), rgba(0,0,0,0.5))' : '(rgba(255,255,255,0.0), rgba(0,0,0,0.2))'}, url(${pauseState === 'processing' ? pauseHolder : buttonBackgroundByCompany.finalComidaImg[config.empresa]})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            borderRadius: 18,
                            width: '70vh',
                            height: '30vh',
                            display: 'flex',
                            alignItems: 'end',
                            justifyContent: 'center',
                            textAlign: 'center',
                            boxShadow: '0 4px 16px #0002'
                    }}>
                        {breakState !== 'processing' && pauseState !== 'processing' && userData.data.restart_time !== '00:00:00' &&
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 30, opacity: '20%'}}>
                                {userData.data.restart_time}
                            </span>
                        }

                    </div>
                </div>
            </div>
            
            {/* <div>Offlineusers {JSON.stringify(offlineUsers)}</div>
            <div>Userdata {JSON.stringify(userData)}</div>             */}
            
            {/* BOTONES PEQUEÑOS ABAJO */}
            
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                width: '100%',
                marginTop: 20,
            }}>
                {/* Iniciar Pausa */}
                {/* <div
                    onClick={() => handlePressButton ('pause_restart')}
                    className="pressed-effect"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.0), rgba(0,0,0,0.2)), url(${ breakState === 'processing'? pauseHolder  : pauseState === 'available' ? pauseImg : restartImg})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        borderRadius: 18,
                        width: '45vh',
                        height: '17vh',
                        display: 'flex',
                        alignItems: 'end',
                        justifyContent: 'center',
                        textAlign: 'center',
                        boxShadow: '0 4px 16px #0002',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 43,
                        
                }}>
                    <span style={{opacity: '80%', marginLeft : 160, marginBottom: 0
                    }}> {pauseState === 'processing' ? useRealTimePause(userData.data.pause) : ''}</span>
                    
                </div> */}
                {/* <div>
                    <h2 style={{
                        fontWeight: 700,
                        fontSize: 35,
                        textAlign: 'center',
                        paddingBottom: 20,
                        color: config.textColorVersion,
                        opacity: 0.7,
                    }}> 
                        {config.versionPrefix}{' '}v{version.version}{config.versionSuffix}
                        
                    </h2>
                </div> */}

                {/* Salir */}
                <div
                    onClick={() => onValidCard(false)}
                    className="pressed-effect"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.0), rgba(0,0,0,0.2)), url(${salirImg})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        borderRadius: 18,
                        width: '45vh',
                        height: '17vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px #0002',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 48,
                        paddingLeft: 80
                    }}>
                </div>
            </div>

        </div>
  );
};

export default FichajesPageOffline;
