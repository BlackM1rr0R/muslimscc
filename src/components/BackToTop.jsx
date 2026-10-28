// ═══════════════════════════════════════════════════════
// "Yuxarı qayıt" — uzun siyahıda (sonsuz sürüşmə) ekranın iki hündürlüyündən
// sonra görünür. Hamar qalxır; "hərəkəti azalt" seçilibsə dərhal.
// Klaviatura ilə basılanda fokus <main>-ə keçir (düymə gizlənəndə fokus itmir).
// Kompüterdə sağ aşağıdakı dokun ÜSTÜNDƏ, telefonda (dok yoxdur) küncdə.
// <body>-yə portal: <main>-in keçid animasiyası (transform) position: fixed-i
// özünə bağlayır — düymə ekranın yox, səhifənin küncündə qalırdı.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import '../styles/ListMore.css'

const LABEL = { az: 'Yuxarı qayıt', en: 'Back to top', ru: 'Наверх', ar: 'العودة إلى الأعلى', tr: 'Başa dön' }

function reducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

export default function BackToTop({ threshold }) {
  const { lang } = useLang()
  const label = LABEL[lang] || LABEL.en
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
    <button
      type="button"
      className={`ui-icon-btn lm-top${on ? ' is-on' : ''}`}
      onClick={toTop}
      aria-label={label}
      title={label}
      tabIndex={on ? 0 : -1}
      aria-hidden={on ? undefined : true}
    >
      <Icon name="arrowUp" size={20} />
    </button>,
    document.body
  )
}
