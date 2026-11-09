// ═══════════════════════════════════════════════════════
// BadgeToast (v5.7) — "Yeni nişan" bildirişi (bütün sayt üçün, App.jsx, boş vaxtda yüklənir)
//
// • utils/badges → 'qm-badge' hadisəsi: yeni qazanılan nişanlar növbə ilə, hər biri ~5 s.
// • Nişanları yoxlama: ilk açılışda (boş vaxtda), namaz qeyd ediləndə və səhifəyə
//   qayıdanda (bir az gözləyib, bir dəfə). Uğur anlarında celebrate() da çağırır.
// • Medal fırlanaraq gəlir (yalnız transform/opacity); toxunanda /analytics rəfi açılır.
// • v6 (src/motion): bildiriş yay kimi qalxır, növbəti gələndə köhnəsi qısa çıxır
//   (AnimatePresence mode="wait") — əvvəl çıxış animasiyası yox idi.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pathFor } from '../seo/routes'
import { PRAYER_SYNC_EVENT } from '../utils/prayerTracker'
import { BADGE_EVENT, syncBadges } from '../utils/badges'
import { pickUi } from '../utils/uiText'
import { whenIdle } from '../utils/idle'
import { isPlainClick } from './PageLink'
import Icon from './Icon'
import '../styles/BadgeShelf.css'
import { AnimatePresence, m } from 'motion/react'
import { SPRING, DUR, exitT } from '../motion/presets'

const T = {
  az: { new: 'Yeni nişan', see: 'Rəfə bax', close: 'Bağla' },
  en: { new: 'New badge', see: 'See shelf', close: 'Close' },
  ru: { new: 'Новый значок', see: 'Все значки', close: 'Закрыть' },
  ar: { new: 'وسام جديد', see: 'عرض الأوسمة', close: 'إغلاق' },
  tr: { new: 'Yeni rozet', see: 'Rafa bak', close: 'Kapat' },
}
const SHOW_MS = 5200

export default function BadgeToast() {
  const { lang } = useLang()
  const t = pickUi(T, lang)
  const navigate = useNavigate()
  const [queue, setQueue] = useState([])
  const timer = useRef(0)

  useEffect(() => {
    const on = (e) => { if (Array.isArray(e.detail) && e.detail.length) setQueue(q => [...q, ...e.detail]) }
    window.addEventListener(BADGE_EVENT, on)
    let t1 = 0
    const later = () => { clearTimeout(t1); t1 = setTimeout(() => syncBadges(), 1200) }
    const vis = () => { if (document.visibilityState === 'visible') later() }
    whenIdle({ delay: 2500 }).then(() => syncBadges())
    window.addEventListener(PRAYER_SYNC_EVENT, later)
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearTimeout(t1)
      window.removeEventListener(BADGE_EVENT, on)
      window.removeEventListener(PRAYER_SYNC_EVENT, later)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])

  const cur = queue[0]
  useEffect(() => {
    if (!cur) return
    timer.current = setTimeout(() => setQueue(q => q.slice(1)), SHOW_MS)
    return () => clearTimeout(timer.current)
  }, [cur])

  const href = `${pathFor('analytics', lang)}#an-ach`
  const name = cur ? pickUi(cur.name, lang) : ''
  return (
    <AnimatePresence mode="wait">
    {cur && (
    <m.div className="bdg-toast" role="status" data-testid="badge-toast" key={cur.id}
      initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING.bouncy }}
      exit={{ opacity: 0, y: 16, scale: 0.97, transition: exitT(DUR.md) }}>
      <a className="bdg-toast__main" href={href}
        onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); setQueue([]); navigate(href) } }}>
        <span className={`bdg-medal bdg-medal--${cur.tier} bdg-medal--sm`} aria-hidden="true">
          <Icon name={cur.icon} size={18} />
        </span>
        <span className="bdg-toast__txt">
          <small>{t.new}</small>
          <b>{name}</b>
        </span>
        <span className="bdg-toast__see">{t.see}</span>
      </a>
      <button type="button" className="bdg-toast__x" onClick={() => setQueue(q => q.slice(1))} aria-label={t.close}>
        <Icon name="close" size={14} />
      </button>
    </m.div>
    )}
    </AnimatePresence>
  )
}
