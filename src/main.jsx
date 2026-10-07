import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { NetworkProvider } from "./context/NetworkContext";
import { OfflineStoreProvider } from './context/OfflineStoreContext.jsx';

// Sin timeout, una petición a la API que no responde deja la tablet esperando para siempre
// (spinner fijo, buffer de tarjeta sin limpiar) hasta reiniciar la app
axios.defaults.timeout = 15000;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OfflineStoreProvider>
      <NetworkProvider>      
        <App />
      </NetworkProvider>
    </OfflineStoreProvider>
  </StrictMode>,
)
