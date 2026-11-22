import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(<App />)

// Modo app: funciona sin internet y se puede instalar en PC y celular
if ('serviceWorker' in navigator && import.meta.env?.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
