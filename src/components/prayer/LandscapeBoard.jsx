// ═══════════════════════════════════════════════════════
// LandscapeBoard (v5.8) — telefonu yan çevirəndə tam ekran "məscid lövhəsi" (/prayer)
//
//   <LandscapeBoard times={{ fajr:'05:42', … }} names={…} next={{ key, at }} city="Bakı" hijri="…" lang="az" />
//
// • Yalnız telefonda: (orientation: landscape) and (max-height: 520px) — planşet və
//   kompüterdə açılmır. Telefon yenidən dik tutulanda özü bağlanır.
// • İri saat (saniyə ilə), 5 vaxt + günəş, növbəti namaza geri sayım (zolaqla).
// • "Bağla" — bu çevrilmə üçün gizlənir; növbəti dəfə yan çevirəndə yenə açılır.
// • Ekranın sönməməsi: Screen Wake Lock (dəstəklənirsə), bağlananda buraxılır.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import '../../styles/LandscapeBoard.css'

const T = {
  az: { close: 'Bağla', next: 'Növbəti', left: 'qalıb' },
  en: { close: 'Close', next: 'Next', left: 'left' },
  ru: { close: 'Закрыть', next: 'Следующий', left: 'осталось' },
  ar: { close: 'إغلاق', next: 'التالية', left: 'متبقٍّ' },
  tr: { close: 'Kapat', next: 'Sıradaki', left: 'kaldı' },
}
const KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
const MQ = '(orientation: landscape) and (max-height: 520px) and (pointer: coarse)'
const pad = (n) => String(n).padStart(2, '0')

export default function LandscapeBoard({ times, names, next, city, hijri, lang = 'az' }) {
  const t = pickUi(T, lang)
  const [on, setOn] = useState(false)
  const [, tick] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia?.(MQ)
    if (!mq) return undefined
    const upd = () => setOn(mq.matches)
    upd()
    mq.addEventListener?.('change', upd)
    return () => mq.removeEventListener?.('change', upd)
  }, [])

  useEffect(() => {
    if (!on) return undefined
    const id = setInterval(() => tick(x => x + 1), 1000)
    let lock = null
    navigator.wakeLock?.request?.('screen').then(l => { lock = l }).catch(() => {})
    const onKey = (e) => { if (e.key === 'Escape') setOn(false) }
    window.addEventListener('keydown', onKey)
    return () => { clearInterval(id); lock?.release?.().catch(() => {}); window.removeEventListener('keydown', onKey) }
  }, [on])

  if (!on || !times || typeof document === 'undefined') return null
  const now = new Date()
  const left = next?.at ? Math.max(0, next.at - now.getTime()) : 0
  const h = Math.floor(left / 3.6e6), m = Math.floor((left % 3.6e6) / 6e4), s = Math.floor((left % 6e4) / 1e3)
  const nm = (k) => names?.[k] || k

  return createPortal(
    <div className="lsb" role="dialog" aria-modal="true" aria-label={city} data-testid="landscape-board">
      <button type="button" className="lsb__x" onClick={() => setOn(false)} aria-label={t.close}><Icon name="close" size={18} /></button>
      <div className="lsb__left">
        <div className="lsb__city">{city}{hijri ? <span> · {hijri}</span> : null}</div>
        <div className="lsb__clock ui-num">{pad(now.getHours())}:{pad(now.getMinutes())}<small>:{pad(now.getSeconds())}</small></div>
        {next && (
          <div className="lsb__next">
            <span>{t.next}: <b>{nm(next.key)}</b></span>
            <span className="ui-num lsb__cd">{h > 0 ? `${h}:` : ''}{pad(m)}:{pad(s)} {t.left}</span>
          </div>
        )}
      </div>
      <ol className="lsb__list">
        {KEYS.map(k => (
          <li key={k} className={`${next?.key === k ? 'is-next' : ''}${k === 'sunrise' ? ' is-aux' : ''}`}>
            <span>{nm(k)}</span><b className="ui-num">{times[k] || '--:--'}</b>
          </li>
        ))}
      </ol>
    </div>,
    document.body,
  )
}
