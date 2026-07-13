import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Restaura a rota original quando o GitHub Pages redireciona via 404.html
const redirect = sessionStorage.getItem('spa-redirect')
if (redirect) {
  sessionStorage.removeItem('spa-redirect')
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const target = redirect.startsWith(base) ? redirect : base + redirect
  if (target !== location.pathname + location.search + location.hash) {
    window.history.replaceState(null, '', target)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
