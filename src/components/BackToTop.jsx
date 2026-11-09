// ═══════════════════════════════════════════════════════
// "Yuxarı qayıt" — uzun siyahıda (sonsuz sürüşmə) ekranın iki hündürlüyündən
// sonra görünür. Hamar qalxır; "hərəkəti azalt" seçilibsə dərhal.
// Klaviatura ilə basılanda fokus <main>-ə keçir (düymə gizlənəndə fokus itmir).
// Kompüterdə sağ aşağıdakı dokun ÜSTÜNDƏ, telefonda (dok yoxdur) küncdə.
// <body>-yə portal: <main>-in keçid animasiyası (transform) position: fixed-i
// özünə bağlayır — düymə ekranın yox, səhifənin küncündə qalırdı.
// v6 (src/motion): görünəndə yay kimi "qalxır", gizlənəndə qısa çıxır (AnimatePresence) —
// gizli ikən DOM-da yoxdur (fokus/oxucu üçün əlavə aria-hidden lazım deyil).
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import '../styles/ListMore.css'
import { isLiteDevice } from '../utils/liteDevice'
import { pickUi } from '../utils/uiText'
import { AnimatePresence, m } from 'motion/react'
import { SPRING, DUR, exitT } from '../motion/presets'

const LABEL = { az: 'Yuxarı qayıt', en: 'Back to top', ru: 'Наверх', ar: 'العودة إلى الأعلى', tr: 'Başa dön' }

function reducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || isLiteDevice() } catch { return false }
}

export default function BackToTop({ threshold }) {
  const { lang } = useLang()
  const label = pickUi(LABEL, lang, 'en')
  const [on, setOn] = useState(false)

  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const limit = threshold ?? Math.max(900, window.innerHeight * 2)
      setOn(window.scrollY > limit)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check) }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [threshold])

  const toTop = (e) => {
    const instant = reducedMotion()
    window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' })
    // Klaviatura ilə (detail 0) basılıbsa fokusu məzmunun əvvəlinə köçür
    if (e.detail === 0) document.getElementById('qm-main')?.focus({ preventScroll: true })
  }

  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {on && (
        <m.button
          key="top"
          type="button"
          className="ui-icon-btn lm-top lm-top--motion is-on"
          onClick={toTop}
          aria-label={label}
          title={label}
          initial={{ opacity: 0, y: 14, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING.bouncy }}
          exit={{ opacity: 0, y: 10, scale: 0.9, transition: exitT(DUR.sm) }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.92 }}
        >
          {/* Səhifənin oxunan payı — halqa (wow.css → .lm-top__ring, scroll-timeline) */}
          <svg className="lm-top__ring" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
            <circle cx="18" cy="18" r="16.5" pathLength="100" />
          </svg>
          <Icon name="arrowUp" size={20} />
        </m.button>
      )}
    </AnimatePresence>,
    document.body
  )
}
