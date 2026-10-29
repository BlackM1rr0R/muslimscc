import { useState, useEffect, lazy, Suspense } from 'react'
import { useLang } from '../contexts/LangContext'
import { readA11yPrefs, saveA11yPrefs, applyA11yPrefs, countActiveA11y } from '../utils/a11yPrefs'
// Saytda tətbiq olunan qaydalar (html.a11y-*) — ilk boyamada lazımdır, eager
import '../styles/AccessibilityWidget.css'

// PERFORMANS: panelin UI-si (5 dilin mətnləri, bütün idarəedicilər və onların
// CSS-i) ayrıca chunk-dır və yalnız panel açılanda yüklənir — əvvəl hər
// səhifənin əsas paketində idi (~33 KB JS + ~20 KB CSS xam). Bu komponent
// isə əvvəlki kimi HƏMİŞƏ render olunur (FloatingDock): tərcihlərin state-i,
// <html>-ə tətbiqi və panel bağlı olanda da işləyən köməkçilər buradadır.
const loadPanel = () => import('./AccessibilityPanel')
const AccessibilityPanel = lazy(loadPanel)

/**
 * Əlçatanlıq paneli + saytda tətbiq olunan tərcihlər.
 *
 * Tərcihlər (şrift ölçüsü, kontrast və s.) panel bağlı olanda da tətbiq
 * olunur — ona görə bu komponent həmişə render edilməlidir. Saxlanmış
 * tərcihlər ilk render-dən ƏVVƏL main.jsx-də tətbiq olunur (utils/a11yPrefs.js).
 *
 * İki rejim:
 *  • İdarə olunan — `open` prop verilir (FloatingDock). Öz üzən düyməsini
 *    göstərmir; bağlananda `onClose()` çağırılır.
 *  • Köhnə (müstəqil) — prop yoxdur: öz düyməsi ilə açılır.
 *
 * @param {{ open?: boolean, onClose?: () => void, onActiveCountChange?: (n: number) => void }} props
 */
export default function AccessibilityWidget({ open: openProp, onClose, onActiveCountChange } = {}) {
  const { lang } = useLang()

  const controlled = openProp !== undefined
  const [openState, setOpenState] = useState(false)
  const open = controlled ? Boolean(openProp) : openState
  const setOpen = (value) => {
    if (controlled) { if (!value) onClose?.() }
    else setOpenState(value)
  }

  const [prefs, setPrefs] = useState(readA11yPrefs)

  useEffect(() => {
    applyA11yPrefs(prefs)
    saveA11yPrefs(prefs)
  }, [prefs])

  // Reading guide line
  useEffect(() => {
    if (!prefs.readingGuide) return
    const guide = document.createElement('div')
    guide.className = 'a11y-guide-line'
    document.body.appendChild(guide)
    const onMove = (e) => { guide.style.top = `${e.clientY}px` }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      guide.remove()
    }
  }, [prefs.readingGuide])

  // Read aloud — clicking any text reads it
  useEffect(() => {
    if (!prefs.readAloud) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const onClick = (e) => {
      // Skip clicks inside the widget itself
      if (e.target.closest('.a11y-panel, .a11y-fab, .qm-dock, button, input, select, textarea, a')) return
      const text = e.target.innerText || e.target.textContent
      if (!text || text.length < 3 || text.length > 800) return
      e.preventDefault()
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text.trim())
      const langMap = { az:'az-AZ', en:'en-US', ru:'ru-RU', ar:'ar-SA', tr:'tr-TR' }
      u.lang = langMap[lang] || 'en-US'
      u.rate = 0.95
      window.speechSynthesis.speak(u)
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.speechSynthesis?.cancel()
    }
  }, [prefs.readAloud, lang])

  // Pause media (auto-play)
  useEffect(() => {
    if (!prefs.pauseMedia) return
    const stopMedia = () => {
      document.querySelectorAll('video, audio').forEach(m => { try { m.pause() } catch {} })
    }
    stopMedia()
    const interval = setInterval(stopMedia, 500)
    return () => clearInterval(interval)
  }, [prefs.pauseMedia])

  const activeCount = countActiveA11y(prefs)

  // Aktiv ayar sayını dok menyusuna ötür (nişan üçün)
  useEffect(() => {
    onActiveCountChange?.(activeCount)
  }, [activeCount, onActiveCountChange])

  // Panel chunk-ı: idarə olunan rejimdə yalnız açıq ikən; müstəqil rejimdə
  // FAB da paneldədir — həmişə. Yüklənərkən heç nə göstərilmir (əvvəlki kimi
  // panel açılanda öz animasiyası ilə görünür).
  if (controlled && !open) return null
  return (
    <Suspense fallback={null}>
      <AccessibilityPanel
        open={open}
        setOpen={setOpen}
        controlled={controlled}
        setOpenState={setOpenState}
        prefs={prefs}
        setPrefs={setPrefs}
        activeCount={activeCount}
      />
    </Suspense>
  )
}

/** Panel chunk-ını əvvəlcədən yüklə (məs. boş vaxtda) — açılış gecikməsin. */
export const preloadAccessibilityPanel = () => loadPanel().catch(() => {})
