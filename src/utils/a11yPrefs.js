// ═══════════════════════════════════════════════════════
// Əlçatanlıq tərcihləri — oxu, tətbiq, say (React-sız, kiçik modul)
//
// PERFORMANS: əvvəl bu məntiq AccessibilityWidget.jsx-in içində idi və
// bütün panel (5 dilin mətnləri + UI, ~33 KB JS + ~27 KB CSS) HƏR səhifənin
// əsas paketində eager yüklənirdi — yalnız tərcihləri tətbiq etmək üçün.
// İndi:
//   • bu modul (~2 KB) main.jsx-də İLK RENDER-DƏN ƏVVƏL saxlanmış tərcihləri
//     <html>-ə tətbiq edir (əvvəl useEffect-də, ilk commit-dən sonra idi —
//     böyük şrift / kontrast seçənlərdə ilk kadr "normal" görünə bilərdi);
//   • panelin UI-si (AccessibilityPanel.jsx + AccessibilityPanel.css) yalnız
//     panel açılanda yüklənir;
//   • saytda tətbiq olunan qaydalar (html.a11y-*) AccessibilityWidget.css-də
//     qalır və əvvəlki kimi əsas CSS-dədir (ilk boyamada lazımdır).
// ═══════════════════════════════════════════════════════

import { resolveSiteDark } from '../contexts/LangContext'

export const A11Y_STORAGE_KEY = 'muslim_cc_a11y_prefs_v2'

export const DEFAULT_PREFS = {
  // Text
  fontSize: 0,         // -1, 0, +1, +2, +3
  lineSpacing: 0,      // 0=normal, 1=larger, 2=xlarger
  letterSpacing: 0,    // 0=normal, 1=larger, 2=xlarger
  dyslexia: false,
  // Color & contrast
  contrast: 'normal',  // normal | high | inverted
  theme: 'auto',       // auto | light | dark | sepia
  saturation: 100,     // 0-150
  grayscale: false,
  // Visual helpers
  underlineLinks: false,
  highlightHeadings: false,
  highlightFocus: false,
  biggerCursor: false,
  readingGuide: false,
  hideImages: false,
  // Interaction
  largerTargets: false,
  readAloud: false,
  // Motion
  reduceMotion: false,
  pauseMedia: false,
}

/** Saxlanmış tərcihlər (yoxdursa / pozuqdursa — standart). */
export function readA11yPrefs() {
  try {
    const saved = localStorage.getItem(A11Y_STORAGE_KEY)
    if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) }
  } catch {}
  return DEFAULT_PREFS
}

export function saveA11yPrefs(prefs) {
  try { localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs)) } catch {}
}

/** Aktiv ayarların sayı (dok / panel nişanı). */
export function countActiveA11y(prefs) {
  let n = 0
  if (prefs.fontSize !== 0) n++
  if (prefs.lineSpacing !== 0) n++
  if (prefs.letterSpacing !== 0) n++
  if (prefs.contrast !== 'normal') n++
  if (prefs.theme !== 'auto') n++
  if (prefs.saturation !== 100) n++
  const toggles = ['dyslexia','underlineLinks','highlightHeadings','highlightFocus','biggerCursor','readingGuide','hideImages','grayscale','largerTargets','readAloud','reduceMotion','pauseMedia']
  toggles.forEach(k => { if (prefs[k]) n++ })
  return n
}

export function applyA11yPrefs(prefs) {
  if (typeof document === 'undefined') return
  const html = document.documentElement

  // Font size scaling
  html.classList.toggle('a11y-text-smaller', prefs.fontSize === -1)
  html.classList.toggle('a11y-text-larger', prefs.fontSize === 1)
  html.classList.toggle('a11y-text-xlarger', prefs.fontSize === 2)
  html.classList.toggle('a11y-text-huge', prefs.fontSize === 3)

  // Line spacing
  html.classList.toggle('a11y-line-larger', prefs.lineSpacing === 1)
  html.classList.toggle('a11y-line-xlarger', prefs.lineSpacing === 2)

  // Letter spacing
  html.classList.toggle('a11y-letter-larger', prefs.letterSpacing === 1)
  html.classList.toggle('a11y-letter-xlarger', prefs.letterSpacing === 2)

  // Contrast
  html.classList.toggle('a11y-high-contrast', prefs.contrast === 'high')
  html.classList.toggle('a11y-inverted', prefs.contrast === 'inverted')

  // Theme
  if (prefs.theme === 'dark') html.setAttribute('data-theme', 'dark')
  else if (prefs.theme === 'light') html.setAttribute('data-theme', 'light')
  else if (prefs.theme === 'sepia') html.setAttribute('data-theme', 'sepia')
  else {
    // "Avto" — saytın öz tema seçimi (header-dəki ay/günəş düyməsi) qalsın.
    // Əvvəl burada data-theme həmişə silinirdi: hər hansı əlçatanlıq ayarı
    // dəyişəndə tünd rejim səhifə yenilənənə qədər sönürdü.
    // Saytın tema qərarı (saxlanmış seçim, yoxdursa telefonun sistem rejimi) —
    // yalnız localStorage-a baxanda sistem qaranlıq olan telefonda ayar dəyişəndə sayt işıqlanırdı
    const siteDark = resolveSiteDark()
    if (siteDark) html.setAttribute('data-theme', 'dark')
    else html.removeAttribute('data-theme')
  }

  // Saturation
  html.style.setProperty('--a11y-saturation', `${prefs.saturation}%`)
  html.classList.toggle('a11y-saturation-active', prefs.saturation !== 100)

  // Toggles
  html.classList.toggle('a11y-dyslexia', prefs.dyslexia)
  html.classList.toggle('a11y-underline-links', prefs.underlineLinks)
  html.classList.toggle('a11y-highlight-headings', prefs.highlightHeadings)
  html.classList.toggle('a11y-highlight-focus', prefs.highlightFocus)
  html.classList.toggle('a11y-bigger-cursor', prefs.biggerCursor)
  html.classList.toggle('a11y-hide-images', prefs.hideImages)
  html.classList.toggle('a11y-grayscale', prefs.grayscale)
  html.classList.toggle('a11y-larger-targets', prefs.largerTargets)
  html.classList.toggle('a11y-read-aloud', prefs.readAloud)
  html.classList.toggle('a11y-reduce-motion', prefs.reduceMotion)
  html.classList.toggle('a11y-reading-guide', prefs.readingGuide)
}
