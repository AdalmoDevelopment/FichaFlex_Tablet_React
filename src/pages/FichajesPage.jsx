import { use, useEffect, useState } from "react";
import axios from "axios";
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
import version from '../../package.json';
import soundalert from '../assets/audio/soundalert.wav'
import { processVehicleTrip } from "../funcs/DriverFuncs";
import VehicleModal from "../components/VehicleModal";
import Icon from '@mdi/react';
import { mdiTruckCheck, mdiTruckFast  } from '@mdi/js';
import { useOfflineStore } from "../context/OfflineStoreContext";
import config from "../context/ConfigEnv";
import { useHandlePressButton } from "../funcs/useHandlePressButton";

const FichajesPage = ({ onValidCard, userData}) => {

    const { addUserIfNotExists, updateUser, offlineUsers } = useOfflineStore();

      const handlePressButton  = useHandlePressButton();

    {`
        Hay 4 condiciones en los fichajes:
        isStartOfWorkday: true/false, si se ficha es true no se puede fichar entrada otra vez.
        breakState: "available"(se puede fichar comida) | "processing"(obliga a acabarla) | "disabled"(ya no deja hacerla pues ya está hecha), 
        pauseState: "available"(se puede empezar pausa) | "processing"(obliga a acabarla) ,
    `}

    const buttonBackgroundByCompany = {
        entradaImg : {
            adalmo: entradaImgAdalmo,
            ferrimet: entradaImgFerrimet,
            dra: entradaImgDRA
        },
        salidaImg : {
            adalmo: salidaImgAdalmo,
            ferrimet: salidaImgFerrimet,
            dra: salidaImgDRA
        },
        inicioComidaImg : {
            adalmo: inicioComidaImgAdalmo,
            ferrimet: inicioComidaImgFerrimet,
            dra: inicioComidaImgDRA
        },
        finalComidaImg : {
            adalmo: finalComidaImgAdalmo,
            ferrimet: finalComidaImgFerrimet,
            dra: finalComidaImgDRA
        }
    };

    const [modalOpen, setModalOpen] = useState(false);
    const [vehicleList, setVehicleList] = useState([]);

    useEffect(() => {
        const fetchVehicleInfo = async () => {
            try {
            const response = await axios.post(`http://${config.url}:3000/vehiculos`);
            const vehicles = response.data
            .map(vehicle => ({
                label: vehicle.matricula,
                value: vehicle.matricula,
            }));
            setVehicleList(vehicles);
            // showCustomToast ({ type: "success", message: "Vehículos cargados correctamente" + JSON.stringify(vehicles) });
            } catch (error) {
                console.log(`http://${config.url}:3000/vehiculos`)
            console.error('Error fetching vehicle options:', error);
            }
        };
        fetchVehicleInfo();
    },[]);

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
    
    const playSound = () => {
        const audio = new Audio(soundalert); // Ruta relativa desde /public
        audio.play();
    };


    const isStartOfWorkday = userData.data.in_time !== '00:00:00' 
    const breakState = 
        userData.data.intensivo === 'si' || userData.data.dia_fichaje === 'sábado' || userData.data.dia_fichaje === 'domingo' ? 
        'disabled' :
        userData.data.pause_time === '00:00:00' && userData.data.restart_time === '00:00:00' ?
        'available' :
        userData.data.pause_time !== '00:00:00' && userData.data.restart_time === '00:00:00' ?
        'processing' :
        'disabled';
    const pauseState =
        userData.data.pause !== '00:00:00' && userData.data.restart === '00:00:00' ?
        'processing' :
        'available'
    const tripState =
        userData.data.chofer !== 'yes' ? '' :
        userData.data.inicio_viaje !== '00:00:00' && userData.data.fin_viaje === '00:00:00' ?
        'processing' :
        'available'
    
    // const handlePressButton = (action) => {
    //     addUserIfNotExists(userData.data.nfc_id)

    //     if (isStartOfWorkday && action === 'in' && pauseState !== 'processing'){
    //         showCustomToast({ type: "warning", message: "Ya has empezado la jornada" })
    //     } else if (pauseState === 'processing' && action !== 'pause_restart'){
    //         showCustomToast({ type: "warning", message: "Termina la pausa antes de seguir" })
    //     } else if (breakState === 'processing' && action !== 'restart'){
    //         showCustomToast({ type: "warning", message: "Termina la comida antes de seguir" })
    //     } else if (breakState === 'disabled' && userData.data.intensivo === 'si' && ( action === 'pause' || action === 'restart' )){
    //         showCustomToast({ type: "warning", message: "¡Jornada intensiva!" })
    //     } else if (breakState === 'disabled' && ( action === 'pause' || action === 'restart' )){
    //         showCustomToast({ type: "warning", message: "Comida ya realizada" })
    //     } 
    //     else {
    //         const handleRequest = async (action, message) => {
    //             try {
    //                 await axios.put(`http://${config.url}:3000/api/update-fichaje`, {
    //                 ...userData.data,
    //                 pauseState,
    //                 action,
    //                 delegacion : config.delegacion
    //                 });
    //                 showCustomToast({ type: "success", message: message })
    //             } catch (err) {
    //                 console.error("Error en la petición:", err);
    //                 showCustomToast({ type: "error", message: " Ha habido un error" })
    //             }
    //         };

    //         const curTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false, second: '2-digit' });

    //         if (action === 'in') {
    //             userData.data.in_time = curTime;
    //             updateUser(userData.data.nfc_id, { in_time: curTime }); // Para el store local
    //             handleRequest(action, 'Jornada iniciada')
    //         } else if (action === 'out') {
    //             const currentMonth = new Date().getMonth(); // 0 = enero, 7 = agosto

    //             if (currentMonth !== 7 && userData.data.intensivo === 'no'){
    //                 if (userData.data.total_break <= '00:00:00') {
    //                     showCustomToast({ type: "error", message: `
    //                         FICHAJE ERRONEO, faltan los fichajes de la comida.
    //                         Cuando ello suceda de manera reiterada, nos veremos obligados
    //                         a enviar avisos nominales por escrito de cara a poder justificar
    //                         nuestro intento de cumplimiento
    //                         de la ley ante cualquier inspección laboral.
    //                     `, duration: 10000, height: '500px', width: '1000px'})
    //                     // playSound()
    //                 } else if (userData.data.total_break <= '00:20:00') {
    //                     showCustomToast({ type: "error", message: `
    //                         FICHAJE ERRONEO, descanso de comida mínimo de 30’
    //                         Cuando ello suceda de manera reiterada, nos veremos obligados a
    //                         enviar avisos nominales por escrito de cara a poder justificar
    //                         nuestro intento de cumplimiento de la ley ante cualquier inspección.
    //                     `, duration: 10000, height: '500px', width: '1000px'})
    //                     // playSound()
    //                 }
    //             }
    //             userData.data.out_time = curTime;
    //             updateUser(userData.data.nfc_id, { out_time: curTime }); // Para el store local
    //             handleRequest(action, 'Jornada finalizada')
    //         } else if (action === 'pause') {
    //             userData.data.pause_time = curTime;
    //             updateUser(userData.data.nfc_id, { pause_time: curTime }); // Para el store local
    //             handleRequest(action, 'Comida iniciada')
    //         } else if (action === 'restart') {
    //             userData.data.restart_time = curTime;
    //             updateUser(userData.data.nfc_id, { restart_time: curTime }); // Para el store local
    //             handleRequest(action, 'Comida finalizada')
    //         } else if (action === 'pause_restart' ){
    //             if (pauseState === 'available') {
    //                 userData.data.pause = curTime;
    //                 handleRequest(action, 'Pausa iniciada')
    //             } else {
    //                 userData.data.restart = curTime;
    //                 handleRequest(action, 'Pausa terminada')
    //             }
                
    //         }
    //         onValidCard(false)
    //     }
    // }

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
                Bienvenido {userData.data.nombre}, selecciona la opción:
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
                        onClick={() => handlePressButton('in', userData, onValidCard)}
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
                        onClick={() => handlePressButton('out', userData, onValidCard)}
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
                        onClick={() => handlePressButton('pause', userData, onValidCard)}
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
                        onClick={() => handlePressButton('restart', userData, onValidCard)}                        
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
            {/* <div>{JSON.stringify(offlineUsers)}</div>
            <div>{JSON.stringify(userData)}</div> */}
            
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
                <div
                    onClick={() => handlePressButton('pause_restart', userData, onValidCard)}
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
                    
                </div>
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
                {userData.data.chofer === 'yes' &&
                    <div
                        onClick={() => setModalOpen(true)}
                        className="pressed-effect hover:siz"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.0), rgba(0,0,0,0.2))`,
                            backgroundColor: tripState !== 'processing' ? '#0562F7' : '#0049BE',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            borderRadius: 100,
                            width: '17vh',
                            height: '17vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 16px #0002',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 48,
                        }}
                    >
                        {/* {userData.data.inicio_viaje}
                        <br />
                        {userData.data.fin_viaje} */}
                        
                        {tripState === 'processing' ? <Icon path={mdiTruckCheck} size={'85%'} /> : <Icon path={mdiTruckFast} size={'85%'} />}
                    </div>

                }

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
            <VehicleModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                vehicleList={vehicleList}
                userData={userData}
                onValidCard={onValidCard}
                tripState={tripState}
            />

        </div>
        
    )
};

export default FichajesPage;