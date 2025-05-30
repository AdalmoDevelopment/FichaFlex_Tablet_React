import { useEffect, useState } from "react";
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

const FichajesPage = ({ onValidCard, userData}) => {

    const config = {
        empresa: import.meta.env.VITE_EMPRESA_GLOBAL  || window.env?.VITE_EMPRESA_GLOBAL || 'DEFAULT',
        delegacion: import.meta.env.VITE_DELEGACION_GLOBAL  || window.env?.VITE_DELEGACION_GLOBAL || 'DEFAULT',
        backgroundColor: import.meta.env.VITE_BACKGROUND_COLOR  || window.env?.VITE_BACKGROUND_COLOR || 'DEFAULT',
        backgroundColorOptions: import.meta.env.VITE_BACKGROUND_COLOR_OPTIONS  || window.env?.VITE_BACKGROUND_COLOR_OPTIONS || 'DEFAULT',
        textColor: import.meta.env.VITE_TEXT_COLOR  || window.env?.VITE_TEXT_COLOR || 'DEFAULT',
        textColorVersion: import.meta.env.VITE_TEXT_COLOR_VERSION  || window.env?.VITE_TEXT_COLOR_VERSION || 'DEFAULT',
        textColorDatetime: import.meta.env.VITE_TEXT_COLOR_DATETIME  || window.env?.VITE_TEXT_COLOR_DATETIME || 'DEFAULT',
        versionPrefix: import.meta.env.VITE_TAG_VERSION_PREFIX  || window.env?.VITE_TAG_VERSION_PREFIX || 'DEFAULT',
        versionSuffix: import.meta.env.VITE_TAG_VERSION_SUFFIX  || window.env?.VITE_TAG_VERSION_SUFFIX || 'DEFAULT',
        url: import.meta.env.VITE_HOST_GLOBAL  || window.env?.VITE_HOST_GLOBAL || 'DEFAULT',
    };

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
    
    const handlePressButton = (action) => {
        if (isStartOfWorkday && action === 'in' && pauseState !== 'processing'){
            showCustomToast({ type: "warning", message: "Ya has empezado la jornada" })
        } else if (pauseState === 'processing' && action !== 'pause_restart'){
            showCustomToast({ type: "warning", message: "Termina la pausa antes de seguir" })
        } else if (breakState === 'processing' && action !== 'restart'){
            showCustomToast({ type: "warning", message: "Termina la comida antes de seguir" })
        } else if (breakState === 'disabled' && userData.data.intensivo === 'si' && ( action === 'pause' || action === 'restart' )){
            showCustomToast({ type: "warning", message: "¡Jornada intensiva!" })
        } else if (breakState === 'disabled' && ( action === 'pause' || action === 'restart' )){
            showCustomToast({ type: "warning", message: "Comida ya realizada" })
        } 
        else {
            const handleRequest = async (action, message) => {
                try {
                    await axios.put(`http://${config.url}:3000/api/update-fichaje`, {
                    ...userData.data,
                    pauseState,
                    action,
                    delegacion : config.delegacion
                    });
                    showCustomToast({ type: "success", message: message })
                } catch (err) {
                    console.error("Error en la petición:", err);
                    showCustomToast({ type: "error", message: " Ha habido un error" })
                }
            };

            const curTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false, second: '2-digit' });

            if (action === 'in') {
                userData.data.in_time = curTime;
                handleRequest(action, 'Jornada iniciada')
            } else if (action === 'out') {
                if (userData.data.intensivo === 'no'){
                    if (userData.data.total_break <= '00:00:00') {
                        showCustomToast({ type: "error", message: `
                            FICHAJE ERRONEO, faltan los fichajes de la comida.
                            Cuando ello suceda de manera reiterada, nos veremos obligados
                            a enviar avisos nominales por escrito de cara a poder justificar
                            nuestro intento de cumplimiento
                            de la ley ante cualquier inspección laboral.
                        `, duration: 10000, height: '500px', width: '1000px'})
                        // playSound()
                    } else if (userData.data.total_break <= '00:20:00') {
                        showCustomToast({ type: "error", message: `
                            FICHAJE ERRONEO, descanso de comida mínimo de 30’
                            Cuando ello suceda de manera reiterada, nos veremos obligados a
                            enviar avisos nominales por escrito de cara a poder justificar
                            nuestro intento de cumplimiento de la ley ante cualquier inspección.
                        `, duration: 10000, height: '500px', width: '1000px'})
                        // playSound()
                    }
                }
                userData.data.out_time = curTime;
                handleRequest(action, 'Jornada finalizada')
            } else if (action === 'pause') {
                userData.data.pause_time = curTime;
                handleRequest(action, 'Comida iniciada')
            } else if (action === 'restart') {
                userData.data.restart_time = curTime;
                handleRequest(action, 'Comida finalizada')
            } else if (action === 'pause_restart' ){
                if (pauseState === 'available') {
                    userData.data.pause = curTime;
                    handleRequest(action, 'Pausa iniciada')
                } else {
                    userData.data.restart = curTime;
                    handleRequest(action, 'Pausa terminada')
                }
                
            }
            onValidCard(false)
        }
    }

    return (
        <div style={{
            background: `linear-gradient(rgba(255,255,255,0.0), rgba(0,0,0,0.2)), ${config.backgroundColorOptions}`,
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
                fontSize: 44,
                textAlign: 'center',
                paddingBottom: 20,
                color: config.textColor,
                opacity: 0.7
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
                        onClick={() => handlePressButton('in')}
                        className="pressed-effect"
                        style={{
                            backgroundImage: `linear-gradient${breakState !== 'processing' && pauseState !== 'processing' && isStartOfWorkday ? '(rgba(0,0,0,0.4), rgba(0,0,0,0.3))' : '(rgba(255,255,255,0.0), rgba(0,0,0,0.2))'}, url(${breakState === 'processing' || pauseState === 'processing' ? pauseHolder : buttonBackgroundByCompany.entradaImg[config.empresa]})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            borderRadius: 18,
                            width: 740,
                            height: 360,
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
                        onClick={() => handlePressButton('out')}
                        className="pressed-effect"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.0), rgba(0,0,0,0.2)), url(${(breakState === 'processing' || pauseState === 'processing') ? pauseHolder : buttonBackgroundByCompany.salidaImg[config.empresa]})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            borderRadius: 18,
                            width: 740,
                            height: 360,
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
                        onClick={() => handlePressButton('pause')}
                        className="pressed-effect"
                        style={{
                            backgroundImage: `linear-gradient${pauseState !== 'processing' && breakState === 'disabled' ? '(rgba(0,0,0,0.5), rgba(0,0,0,0.5))' : '(rgba(255,255,255,0.0), rgba(0,0,0,0.2))'}, url(${breakState === 'processing' || pauseState === 'processing' ? pauseHolder : buttonBackgroundByCompany.inicioComidaImg[config.empresa]})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            borderRadius: 18,
                            width: 740,
                            height: 360,
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
                        onClick={() => handlePressButton('restart')}                        
                        style={{
                            backgroundImage: `linear-gradient${pauseState !== 'processing' && breakState === 'disabled' ? '(rgba(0,0,0,0.5), rgba(0,0,0,0.5))' : '(rgba(255,255,255,0.0), rgba(0,0,0,0.2))'}, url(${pauseState === 'processing' ? pauseHolder : buttonBackgroundByCompany.finalComidaImg[config.empresa]})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            borderRadius: 18,
                            width: 740,
                            height: 360,
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

            {/* BOTONES PEQUEÑOS ABAJO */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                width: '100%',
                marginTop: 30,
            }}>
                {/* Iniciar Pausa */}
                <div
                    onClick={() => handlePressButton('pause_restart')}
                    className="pressed-effect"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.0), rgba(0,0,0,0.2)), url(${ breakState === 'processing'? pauseHolder  : pauseState === 'available' ? pauseImg : restartImg})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        borderRadius: 18,
                        width: 400,
                        height: 155,
                        display: 'flex',
                        alignItems: 'end',
                        justifyContent: 'center',
                        textAlign: 'center',
                        boxShadow: '0 4px 16px #0002',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 23,
                        
                }}>
                    <span style={{opacity: '80%', marginLeft : 150, marginBottom: 5
                    }}> {pauseState === 'processing' ? useRealTimePause(userData.data.pause) : ''}</span>
                    
                </div>
                <div>
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
                </div>
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
                        width: 400,
                        height: 155,
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
    )
};

export default FichajesPage;