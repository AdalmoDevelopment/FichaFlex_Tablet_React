import { showCustomToast } from "../components/CustomToast";
import { useOfflineStore } from "../context/OfflineStoreContext";
import { useNetwork } from "../context/NetworkContext";
import config from "../context/ConfigEnv";
import axios from "axios";

export const useHandlePressButton = () => {
  const { isOnline } = useNetwork();
  const { addUserIfNotExists, updateUser } = useOfflineStore();

  const handlePressButton = (action, userData, onValidCard) => {

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
 
  const curTime = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit", 
    second: "2-digit",
  });

  // Aseguramos que este user exista en el store
  addUserIfNotExists(userData.data.nfc_id);

        if (isStartOfWorkday && action === 'in' && pauseState !== 'processing'){
            showCustomToast({ type: "warning", message: "Ya has empezado la jornada" })
        } else if (pauseState === 'processing' && action !== 'pause_restart'){
            showCustomToast({ type: "warning", message: "Termina la pausa antes de seguir" })
        } else if (breakState === 'processing' && action !== 'restart'){
            showCustomToast({ type: "warning", message: "Termina la comida antes de seguir" })
        }
        //  else if (breakState === 'disabled' && userData.data.intensivo === 'si' && ( action === 'pause' || action === 'restart' )){
        //     showCustomToast({ type: "warning", message: "¡Jornada intensiva!" })
        // }
         else if (breakState === 'disabled' && ( action === 'pause' || action === 'restart' )){
            showCustomToast({ type: "warning", message: "Comida ya realizada" })
        } else if ( action === 'restart' && userData.data.pause_time === '00:00:00' ){
            showCustomToast({ type: "warning", message: "No se puede acabar una comida no iniciada" })
        } else {
            if (isOnline) {
                    if (action === 'in') {
                        userData.data.in_time = curTime;
                        updateUser(userData.data.nfc_id, { in_time: curTime }); // Para el store local
                        handleRequest(action, 'Jornada iniciada')
                    } else if (action === 'out') {
                        const currentMonth = new Date().getMonth(); // 0 = enero, 7 = agosto

                        if (currentMonth !== 7 && userData.data.intensivo === 'no'){
                            if (userData.data.pause_time === '00:00:00' && userData.data.restart_time === '00:00:00' && userData.data.in_time !== '00:00:00') {
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
                        updateUser(userData.data.nfc_id, { out_time: curTime }); // Para el store local
                        handleRequest(action, 'Jornada finalizada')
                    } else if (action === 'pause') {
                        userData.data.pause_time = curTime;
                        updateUser(userData.data.nfc_id, { pause_time: curTime }); // Para el store local
                        handleRequest(action, 'Comida iniciada')
                    } else if (action === 'restart') {
                        userData.data.restart_time = curTime;
                        updateUser(userData.data.nfc_id, { restart_time: curTime }); // Para el store local
                        handleRequest(action, 'Comida finalizada')
                    } else if (action === 'pause_restart' ){
                        if (pauseState === 'available') {
                            userData.data.pause = curTime;
                            updateUser(userData.data.nfc_id, { pause: curTime, restart: '00:00:00' });
                            handleRequest(action, 'Pausa iniciada')
                        } else {
                            userData.data.restart = curTime;
                            updateUser(userData.data.nfc_id, { restart: curTime });
                            handleRequest(action, 'Pausa terminada')
                        }
                        
                    }
            } else { 
                if (action === "in") {
                    updateUser(userData.data.nfc_id, { in_time: curTime });
                    showCustomToast({ type: "success", message: "Jornada iniciada" });
                } else if (action === "out") {
                    updateUser(userData.data.nfc_id, { out_time: curTime });
                    showCustomToast({ type: "success", message: "Jornada finalizada" });
                } else if (action === "pause") {
                    updateUser(userData.data.nfc_id, { pause_time: curTime });
                    showCustomToast({ type: "success", message: "Comida iniciada" });
                } else if (action === "restart") {
                    updateUser(userData.data.nfc_id, { restart_time: curTime });
                    showCustomToast({ type: "success", message: "Comida finalizada" });
                } else if (action === "pause_restart") {
                    if (pauseState === "available") {
                    updateUser(userData.data.nfc_id, { pause: curTime });
                    showCustomToast({ type: "success", message: "Pausa iniciada" });
                    } else {
                    updateUser(userData.data.nfc_id, { restart: curTime });
                    showCustomToast({ type: "success", message: "Pausa terminada" });
                    }
                } 

                    if (action !== "pause_restart") {
                        window.sqlite.logsDB?.saveOfflineLog({
                        data: userData.data,
                        field: `${action}_time`,
                        value: curTime
                    });
                }
            }
            
            onValidCard(false);            
        }  


    };

  return handlePressButton;

}

