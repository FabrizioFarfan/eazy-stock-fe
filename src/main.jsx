import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// Captura beforeinstallprompt lo antes posible (ver utils/installApp.js)
import './utils/installApp.js'

// SW mínimo sin cache: solo para que Brave/Android ofrezcan instalar la app
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
