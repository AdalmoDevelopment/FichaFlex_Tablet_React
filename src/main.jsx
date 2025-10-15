import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NetworkProvider } from "./context/NetworkContext";
import { OfflineStoreProvider } from './context/OfflineStoreContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OfflineStoreProvider>
      <NetworkProvider>      
        <App />
      </NetworkProvider>
    </OfflineStoreProvider>
  </StrictMode>,
)
