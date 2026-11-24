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
// "Vau" qatı: kursor işığı, kartların qalxması, hero aurora, oxu zolağı (utils/wow.js)
import './styles/wow.css'
// VAU 3 (dizayn v5): 3D ikonlar, sürüşmə animasiyaları, dil zolağı, CTA, footer v5
import './styles/vau3.css'
import './styles/perf-touch.css'
// Dizayn v6: src/motion komponentlərinin stilləri (.mo-*, DESIGN.md §7.3)
import './styles/motion-kit.css'
import { initReveal } from './hooks/useReveal'
import { initErrorReporting } from './utils/errorReport'
import { initWow } from './utils/wow'
import { initVau3 } from './utils/vau3'
import { whenIdle } from './utils/idle'
import { initInputModality } from './hooks/useInputModality'
import { readA11yPrefs, applyA11yPrefs, saveA11yPrefs } from './utils/a11yPrefs'
import { startUpdateWatcher } from './utils/appUpdate'
import { applyUiDict } from './i18n/load'
import { installDateLocale } from './utils/uiText'
import { parsePath, uiLang } from './seo/routes'
import { currentAsrFactor } from './utils/madhab'

// Fokus halqası yalnız klaviatura ilə (toxunuşdan sonra narıncı halqa yox)
// və [data-reveal] elementləri üçün tək qlobal IntersectionObserver
initInputModality()
// Əlavə dildə tarixlər həmin dilin formatında (lüğət aktiv olanda — utils/uiText.js)
installDateLocale()
initReveal()
initErrorReporting()
initWow()
initVau3()
// Canlı səma (v5.6): hero işığı günəşin real mövqeyini izləyir — boş vaxtda,
// ayrıca kiçik chunk (ilk render-ə təsiri yoxdur). utils/livingSky.js
whenIdle({ delay: 600 }).then(() => import('./utils/livingSky').then(m => m.initLivingSky()).catch(() => {}))

// Saxlanmış əlçatanlıq tərcihləri (şrift ölçüsü, kontrast, tema …) İLK
// RENDER-DƏN ƏVVƏL <html>-ə tətbiq olunur. PERFORMANS: panelin UI-si artıq
// tənbəl chunk-dır (AccessibilityWidget.jsx); əvvəl tərcihlər panel
// komponentinin useEffect-ində — ilk commit-dən sonra — tətbiq olunurdu.
// Yaddaşa da yazılır — əvvəl bunu dokun AccessibilityWidget-i HƏR açılışda mount anında edirdi;
// dok indi tənbəl chunk-dır (App.jsx → DockHost). Açar sinxronlanan məlumatdadır: yazı avtomatik
// sinxronizasiyanın ilk dövründən (utils/autoSync) SONRA olsa, məlumat yenidən "dəyişmiş" sayılır və
// iki cihazın birləşməsi pozulurdu (tests/e2e/sync.spec.js — "avtomatik sinxronizasiya").
{
  const a11y = readA11yPrefs()
  applyA11yPrefs(a11y)
  saveA11yPrefs(a11y)
}

// ── Service Worker qeydiyyatı (PWA) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// Yeni versiya çıxanda açıq sayt / ana ekrandakı tətbiq özü yenilənsin
startUpdateWatcher()

// /prayer/<şəhər>: prerender olunmuş statik aylıq cədvəldə əsr 1×-dir (SEO üçün düzgün). Hənəfi
// seçilibsə, React kökü əvəz edənə qədər görünən cədvəldə də əsr 2× olsun (src/seo/staticPrayerAsr.js)
{
  const pp = parsePath(window.location.pathname)
  if (pp.key === 'prayer' && pp.param && currentAsrFactor() === 2 && document.querySelector('table.seo-static__table[data-city]')) {
    import('./seo/staticPrayerAsr')
      .then((m) => m.patchStaticPrayerAsr(document, 2, uiLang(pp.lang)))
      .catch(() => { /* statik cədvəl — tətbiq onsuz da canlı vaxtı göstərəcək */ })
  }
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
// Əlavə dildə (/id/…) interfeys lüğəti də ilk render-dən əvvəl — ingiliscə
// yazılar bir anlıq görünüb dəyişməsin (src/utils/uiText.js)
Promise.all([
  preloadInitialPage(window.location.pathname).catch(() => {}),
  applyUiDict(parsePath(window.location.pathname).lang).catch(() => {}),
]).then(render)
