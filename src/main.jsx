import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App, { preloadInitialPage } from './App.jsx'
// Öz-hostinqli şriftlər — globals.css-dən ƏVVƏL (bax: src/assets/fonts/fonts.css).
// Əvvəl index.html-də render-blocking Google Fonts <link>-i idi.
import './assets/fonts/fonts.css'
import './styles/globals.css'
import './styles/heroes.css'
// Hərəkət tokenləri, toxunuş rəyi, səhifə keçidi və mobil UI dəsti (.m-row, .m-check …)
import './styles/motion.css'
import { initReveal } from './hooks/useReveal'
import { initInputModality } from './hooks/useInputModality'
import { readA11yPrefs, applyA11yPrefs } from './utils/a11yPrefs'

// Fokus halqası yalnız klaviatura ilə (toxunuşdan sonra narıncı halqa yox)
// və [data-reveal] elementləri üçün tək qlobal IntersectionObserver
initInputModality()
initReveal()

// Saxlanmış əlçatanlıq tərcihləri (şrift ölçüsü, kontrast, tema …) İLK
// RENDER-DƏN ƏVVƏL <html>-ə tətbiq olunur. PERFORMANS: panelin UI-si artıq
// tənbəl chunk-dır (AccessibilityWidget.jsx); əvvəl tərcihlər panel
// komponentinin useEffect-ində — ilk commit-dən sonra — tətbiq olunurdu.
applyA11yPrefs(readA11yPrefs())

// ── Service Worker qeydiyyatı (PWA) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

function render() {
  const root = ReactDOM.createRoot(document.getElementById('root'))
  // PERFORMANS (TBT): ilk render startTransition ilə — React render fazasını
  // ~5 ms-lik hissələrə bölür və aralarda brauzerə nəfəs verir. Əvvəl ana
  // səhifənin ilk render-i tək uzun tapşırıq idi (Lighthouse mobil: ~490 ms).
  React.startTransition(() => {
    root.render(
      <React.StrictMode>
        {/* v7 davranışını indidən qəbul edirik — konsoldakı "future flag" xəbərdarlıqları çıxmır */}
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    )
  })
}

// Ana səhifənin chunk-ı (lazy, prerender HTML-də modulepreload) hazır olanda
// render — ilk kadrda spinner/CLS olmasın (bax: App.jsx → preloadInitialPage).
// Yükləmə uğursuz olsa belə render olunur (React.lazy özü yenidən cəhd edir).
preloadInitialPage(window.location.pathname, window.location.hash).catch(() => {}).then(render)
