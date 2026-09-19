import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/globals.css'
import './styles/heroes.css'
// Hərəkət tokenləri, toxunuş rəyi, səhifə keçidi və mobil UI dəsti (.m-row, .m-check …)
import './styles/motion.css'
import { initReveal } from './hooks/useReveal'
import { initInputModality } from './hooks/useInputModality'

// Fokus halqası yalnız klaviatura ilə (toxunuşdan sonra narıncı halqa yox)
// və [data-reveal] elementləri üçün tək qlobal IntersectionObserver
initInputModality()
initReveal()

// ── Service Worker qeydiyyatı (PWA) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* v7 davranışını indidən qəbul edirik — konsoldakı "future flag" xəbərdarlıqları çıxmır */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
