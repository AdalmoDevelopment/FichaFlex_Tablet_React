import axios from 'axios';
import { showCustomToast } from '../components/CustomToast';

export async function processVehicleTrip({userData, selectedVehicle, kmsSubmit, kmsProximaRevisionManual}) {
  
  const URL = import.meta.env.VITE_HOST_GLOBAL  || window.env?.VITE_HOST_GLOBAL || 'DEFAULT';

  console.log('processVehicleTrip called with:' + `http://${URL}:3000/procesarRegistrosVehiculos`, { userData, URL, selectedVehicle, kmsSubmit, kmsProximaRevisionManual });  
  console.log('Usuario:',  userData.data.nombre);

  try {
      const response = await axios.post(`http://${URL}:3000/procesarRegistrosVehiculos`, { 
        usuario: userData.data.nombre,
        inicio_viaje: userData.data.inicio_viaje,
        fin_viaje: userData.data.fin_viaje,
        selectedVehicle, 
        kmsSubmit, 
        kmsProximaRevisionManual
    });

      if (response.data.success) {
        showCustomToast({ type: "success", message: 'Viaje realizado' })
      } else {
        console.error('Error al procesar el registro vehiculo');
        showCustomToast({ type: "error", message: " Ha habido un error" + response.data.message });
      }
    } catch (error) {
      console.error('Error al procesar el registro vehiculo', error);
      showCustomToast({ type: "error", message: ` Ha habido un error: ${error}` })
    }
}
