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
	}, 500); // mantiene el foco cada 0.5s

	return () => clearInterval(focusInterval);
  }, []);

const handleKeyDown = async (e) => {
  setLoading(true);
  console.log("A ver si llega");

  if (e.key === "Enter") {
    if (cardBuffer.length >= 7) {
      if (isOnline) {
        // 🔹 flujo online normal
        try {
          const response = await axios.post(`http://${config.url}:3000/api/validate`, {
            cardNumber: cardBuffer
          });

          if (response.data.valid) {
			onValidCard(true);

			// 🔹 Mezclar datos de DB con offline
			const offlineData = offlineUsers[cardBuffer] || {};
			const merged = {
				...response.data.data,
				...offlineData, // offline tiene prioridad
			};

			setUserData({ data: merged });

			// opcional: actualizar también el store para mantenerlo fresco
			updateUser(cardBuffer, merged);

			console.log("✅ Tarjeta válida:", merged);
          } else {
            console.log("❌ Tarjeta no válida");
            showCustomToast({ type: "error", message: "Tarjeta no válida" });
          }
        } catch (err) {
          console.error("Error al validar tarjeta:", err);
          showCustomToast({ type: "error", message: `Error conectando con la base de datos: ${err}` });
        } finally {
          setCardBuffer(""); // Limpia después de cada intento
        }
      } else {
        // 🔹 flujo offline → placeholder
        console.log("📴 Validación offline con tarjeta:", cardBuffer);

		// 📴 Validación offline
		onValidCard(true);

		// 🔹 ¿Ya existe este usuario en el store?
		if (offlineUsers[cardBuffer]) {
		// Ya lo tenías → usa esos datos
		setUserData({
			data: {
			...offlineUsers[cardBuffer],
			nfc_id: cardBuffer
			}
		});
		} else {
		// No existe → créalo en el store y en userData
		addUserIfNotExists(cardBuffer);

		setUserData({
			data: {
			nfc_id: cardBuffer,
			in_time: "00:00:00",
			out_time: "00:00:00",
			pause_time: "00:00:00",
			restart_time: "00:00:00",
			pause: "00:00:00",
			restart: "00:00:00",
			intensivo: "no",
			dia_fichaje: "lunes",
			}
		});
		}

        showCustomToast({ type: "success", message: "Tarjeta validada (modo offline)" });
        setCardBuffer("");
      }
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
		{fecha} <p style={{fontSize: 10}}>{JSON.stringify(window.sqlite.logsDB?.getPendingLogs())}</p>
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
