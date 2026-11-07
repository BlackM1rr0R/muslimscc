// Başlıqda növbəti namaza geri sayım halqası (vau3.css §10).
// Halqa əvvəlki azandan növbəti azana qədər dolur; mərkəzdə namazın ikonu,
// yanında (≥1280px) qalan vaxt. Azana 15 dəqiqədən az qalanda halqa yavaşca
// "nəfəs alır" (yalnız transform/opacity). Klik → /prayer.
// usePrayerTimes sorğuları birləşdirir (yaddaş keşi) — ana səhifənin namaz
// kartı ilə ikinci şəbəkə sorğusu olmur. Header.jsx bunu boş vaxtda yükləyir.
import { useEffect, useState } from 'react'
import usePrayerTimes, { PRAYER_NAMES } from '../hooks/usePrayerTimes'
import { useLang } from '../contexts/LangContext'
import { pathFor } from '../seo/routes'
import Icon from './Icon'

const ICON = { fajr: 'sunrise', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }
const R = 15
const C = 2 * Math.PI * R

function fmt(ms) {
  const m = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(m / 60)
  return `${h}:${String(m % 60).padStart(2, '0')}`
}

export default function HeaderPrayerRing({ onOpen }) {
  const { lang } = useLang()
  const { next } = usePrayerTimes()
  // Dəqiqədə bir yenilənir (halqa və qalan vaxt) — saniyə sayğacı başlıqda lazım deyil
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])
  if (!next) return null

  const left = next.at - now
  const span = next.prevAt ? next.at - next.prevAt : 0
  const p = span > 0 ? Math.min(1, Math.max(0, 1 - left / span)) : 0
  const name = PRAYER_NAMES[next.key]?.[lang] || PRAYER_NAMES[next.key]?.en || next.key
  // Ekran oxuyucu adı görünən mətnlə BAŞLAYIR (axe: label-content-name-mismatch)
  const label = `${name} −${fmt(left)}, ${next.adhan}`
  const soon = left > 0 && left < 15 * 60000

  return (
    <a
      className={`hdr-btn hdr-ring${soon ? ' is-soon' : ''}`}
      href={pathFor('prayer', lang)}
      onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); onOpen?.() } }}
      aria-label={label}
      title={label}
    >
      <svg className="hdr-ring__svg" viewBox="0 0 36 36" aria-hidden="true">
        <circle className="hdr-ring__track" cx="18" cy="18" r={R} />
        <circle className="hdr-ring__bar" cx="18" cy="18" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
      </svg>
      <span className="hdr-ring__ic" aria-hidden="true"><Icon name={ICON[next.key] || 'prayer'} size={14} strokeWidth={2} /></span>
      <span className="hdr-ring__txt" aria-hidden="true"><b>{name}</b> −{fmt(left)}</span>
    </a>
  )
}
