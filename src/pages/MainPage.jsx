import { useEffect, useRef, useState } from "react";
import axios from "axios";
import screenAdalmo from '../assets/screen_adalmo.png';
import screenFerrimet from '../assets/screen_ferrimet.png';
import screenDRA from '../assets/screen_dra.png';
import version from '../../package.json';
import NetworkStatus from "../components/NetworkStatus";
import { showCustomToast } from "../components/CustomToast";
import ClipLoader from "react-spinners/ClipLoader";
import { useNetwork } from "../context/NetworkContext";  
import { useOfflineStore } from "../context/OfflineStoreContext";

const MainPage = ({ onValidCard, setUserData }) => {

  const { addUserIfNotExists, updateUser, offlineUsers } = useOfflineStore();

  const { isOnline } = useNetwork();

  const inputRef = useRef(null);
  const [cardBuffer, setCardBuffer] = useState("");
  const [loading, setLoading] = useState(false);
  const [tries, setTries] = useState(0);

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
	textColorTime: import.meta.env.VITE_TEXT_COLOR_TIME,

  };

	const backgroundByCompany = {
		adalmo: screenAdalmo,
		ferrimet: screenFerrimet,
		dra: screenDRA
	};
  
  useEffect(() => {
	// Siempre enfocar el input al montar
	inputRef.current?.focus();

	const focusInterval = setInterval(() => {
	  if (document.activeElement !== inputRef.current) {
		inputRef.current?.focus();
	  }
	}, 1000); // mantiene el foco cada 1s

	return () => clearInterval(focusInterval);
  }, []);

const handleKeyDown = async (e) => {
  setLoading(true);

  if (e.key === "Enter") {
    if (cardBuffer.length >= 7) {
      if (isOnline) {
        // 🔹 flujo online normal
        try {
          const response = await axios.post(`http://${config.url}:3000/api/validate`, {
            cardNumber: cardBuffer
          });

          if (response.data.valid) {

			if (response.data.data.user_notified === 0 && response.data.data.advance_accepted !== null) {
				showCustomToast({
					type: response.data.data.advance_accepted === 1 ? 'success'
						: 'warning',
					message: `El anticipo de ${response.data.data.advance_amount}€ 
						socilitado ha sido ${response.data.data.advance_accepted === 1 ? 'aceptado': 'denegado'
					}`,
					duration : 6000 
				});
			}

			onValidCard(true);

			// 🔹 Mezclar datos de DB con offline
			const offlineData = offlineUsers[cardBuffer] || {};

			const allowMergeFields = ["in_time", "out_time", "pause_time", "restart_time"];

			const filteredOffline = Object.fromEntries(
				Object.entries(offlineUsers[cardBuffer] || {}).filter(([key, value]) =>
					allowMergeFields.includes(key) && value && value !== "00:00:00"
				)
			);

			const merged = {
				...response.data.data,
				// Comentado porque causa conflictos
				// ...filteredOffline, // offline tiene prioridad
				nfc_id: cardBuffer 
			};

			setUserData({ data: merged });

			// opcional: actualizar también el store para mantenerlo fresco
			updateUser(cardBuffer, merged);

			console.log(`${time.getDate()} ${meses[time.getMonth()]} ${time.getFullYear()} ✅ Tarjeta válida ${cardBuffer}:`, merged);

			setTries(0);
          } else {
            console.log("❌ Tarjeta no encontrada en el servidor:", cardBuffer);
            showCustomToast({ type: "error", message: "Tarjeta no encontrada en el servidor" });
          }
        } catch (err) {
          console.error(`Error al validar tarjeta ${cardBuffer}:`, err);

		  setTries(tries + 1);

		  if (tries >= 3) {
			showCustomToast({ type: "warning", message: `Error conectando. Inténtalo de nuevo.` });
			setTries(0);
		  }
        }
      } else {
		showCustomToast({ type: "error", message: "Dispositivo sin conexión." });
        console.error(`Intento de acción sin conexión, tarjeta: ${cardBuffer}`);
	  }	  
	
	// Lógica offline comentada temporalmente:
	//   else {
    //     // 🔹 flujo offline → placeholder
    //     console.log("📴 Validación offline con tarjeta:", cardBuffer);

	// 	// 📴 Validación offline
	// 	onValidCard(true);

	// 	// 🔹 ¿Ya existe este usuario en el store?
	// 	if (offlineUsers[cardBuffer]) {
	// 	// Ya lo tenías → usa esos datos
	// 	setUserData({
	// 		data: {
	// 		...offlineUsers[cardBuffer],
	// 		nfc_id: cardBuffer
	// 		}
	// 	});
	// 	} else {
	// 	// No existe → créalo en el store y en userData
	// 	addUserIfNotExists(cardBuffer);

	// 	setUserData({
	// 		data: {
	// 		nfc_id: cardBuffer,
	// 		in_time: "00:00:00",
	// 		out_time: "00:00:00",
	// 		pause_time: "00:00:00",
	// 		restart_time: "00:00:00",
	// 		pause: "00:00:00",
	// 		restart: "00:00:00",
	// 		intensivo: "no",
	// 		dia_fichaje: "lunes",
	// 		}
	// 	});
	// 	}

    //     showCustomToast({ type: "success", message: "Tarjeta validada (modo offline)" });

    //   }
	  
	  setCardBuffer(""); // Limpia después de cada intento 
    }
  } else {
    // Solo acumula si es un carácter imprimible
    if (e.key.length === 1) {
      setCardBuffer((prev) => prev + e.key);
    }
  }

  setLoading(false);
}; 


useEffect(() => {
  inputRef.current?.focus();
}, []);


 const [time, setTime] = useState(new Date());

  useEffect(() => {
	const intervalo = setInterval(() => setTime(new Date()), 1000);
	return () => clearInterval(intervalo);
  }, []);

  const meses = [
	'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
	'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const fecha = `${time.getDate()} ${meses[time.getMonth()]} ${time.getFullYear()}`;
  const hora = time.toLocaleTimeString('es-ES', { hour12: false });

  return (
	<div style={{
	background: config.backgroundColor || '#000',
	width: '100vw',
	height: '100vh',
	overflow: 'hidden',           // 👈 fuerza a evitar scroll
	position: 'relative',
	fontFamily: 'Montserrat, Arial, sans-serif',
	margin: 0,
	padding: 0,
	}}>
	  <div style={{
		position: 'absolute',
		top: '90%',
		left: '48%',
		fontSize: 26,
		color: config.textColorVersion,
		opacity: 0.7
	  }}>{loading && <ClipLoader color="gray" size={100} />}</div> 

	  {/* Fecha top-left */}
	  <div style={{
		position: 'absolute',
		top: 30,
		left: 30,
		fontSize: 60,
		fontWeight: 'bold',
		color: config.textColorDatetime,
		opacity: 0.8
	  }}>
		{fecha} {/* <p style={{fontSize: 10}}>{JSON.stringify(window.sqlite.logsDB?.getPendingLogs())}</p> */}
	  </div>
	  {/* Hora top-right */}
	  <div style={{
		position: 'absolute',
		top: 30,
		right: 30,
		fontSize: 60,
		fontWeight: 'bold',
		color: config.textColorTime,
		opacity: 0.8
	  }}>
		{hora}
	  </div>
	  <div style={{
		margin: 'auto',
		height: '100%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	  }}>
		<img
		src={backgroundByCompany[config.empresa]}
		alt="Logo"
		style={{ width: '70%', height: 'auto' }}
		/>
		
	  </div>
	  {/* <div>{JSON.stringify(offlineUsers)}</div> */}
	  {/* Esquina inferior derecha */}
	  <div style={{
		position: 'absolute',
		right: 24,
		bottom: 18,
		fontSize: 26,
		color: config.textColorVersion,
		opacity: 0.8
	  }}>
		{config.versionPrefix}{' '}v{version.version}{config.versionSuffix}
	  </div>

	  	<div style={{
		position: 'absolute',
		bottom: 30,
		left: 30,
		fontSize: 60,
		fontWeight: 'bold',
		color: 'white',
		opacity: 0.5,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
	  }}>
	  <NetworkStatus />

	  </div>
	    <input
			ref={inputRef}
			value={cardBuffer}
			type="text"
			defaultValue={''}
			onKeyDown={handleKeyDown}
			style={{
			position: "absolute",
			pointerEvents: "none",
			opacity: 0
			}}
			autoFocus
		/>
	  
	</div>
	
  )
};

export default MainPage;
