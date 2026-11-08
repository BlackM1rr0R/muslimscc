// ═══════════════════════════════════════════════════════
// AzanMoment (v5.7) — azan oxunanda tam ekran "azan anı" (bütün sayt, App.jsx, boş vaxtda)
//
// • utils/azanAudio səsi çalanda açılır: həmin namazın səması (sübh — şəfəq,
//   zöhr — mavi gün, əsr — qızılı, məğrib — qürub, işa — ulduzlu gecə), minarə və
//   günbəz silueti, hilal. Ortada namazın adı və azanın sözləri — səslə EYNİ anda.
// • Sözlər yalnız ərəbcədir (tərcümə yoxdur — dini mətn qaydası). Mətn: Əbu Davud 499
//   (Abdullah ibn Zeydin hədisi) — standart azan, 12 sətir.
// • Sətirlərin vaxtı public/audio/azan.mp3-ün özündən ölçülüb (səs/fasilə zərfi,
//   86.5 s — 12 hissə). Başqa səs faylı qoyulsa — LINES-in vaxtları yenidən ölçülməlidir.
// • "Dayandır" səsi kəsir və bağlayır; "Gizlət" — səs davam edir. Esc — gizlət.
// • Hərəkət azaldılıbsa — animasiyasız, eyni məzmun.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { onAzanChange, azanState, stopAzan } from '../utils/azanAudio'
import { PRAYER_NAMES } from '../hooks/usePrayerTimes'
import { LINES, lineAt } from '../utils/azanLines'
import '../styles/AzanMoment.css'

const KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const T = {
  az: { title: 'Azan vaxtıdır', stop: 'Dayandır', hide: 'Gizlət', src: 'Azan · Əbu Davud 499' },
  en: { title: 'It is time for the adhan', stop: 'Stop', hide: 'Hide', src: 'Adhan · Abu Dawud 499' },
  ru: { title: 'Время азана', stop: 'Остановить', hide: 'Скрыть', src: 'Азан · Абу Дауд 499' },
  ar: { title: 'حان وقت الأذان', stop: 'إيقاف', hide: 'إخفاء', src: 'الأذان · أبو داود 499' },
  tr: { title: 'Ezan vakti', stop: 'Durdur', hide: 'Gizle', src: 'Ezan · Ebu Davud 499' },
}

/** Səs hansı namaz üçündür: açar namaz adıdırsa o, yoxsa günün saatına görə */
function prayerKey(key) {
  if (KEYS.includes(key)) return key
  const h = new Date().getHours()
  return h < 9 ? 'fajr' : h < 15 ? 'dhuhr' : h < 17 ? 'asr' : h < 19 ? 'maghrib' : 'isha'
}

const STARS = Array.from({ length: 40 }, (_, i) => ({ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 60}%`, '--d': `${(i % 7) * 0.4}s`, '--s': `${1 + (i % 3)}px` }))

export default function AzanMoment() {
  const { lang } = useLang()
  const t = pickUi(T, lang)
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [st, setSt] = useState(() => azanState())
  const raf = useRef(0)
  const btnRef = useRef(null)

  useEffect(() => onAzanChange((playing) => {
    setSt(azanState())
    if (playing) { setOpen(true); setHidden(false) } else setOpen(false)
  }), [])

  // Oxunduqca vaxtı izlə (saniyədə ~4 dəfə kifayətdir)
  useEffect(() => {
    if (!open || hidden) return undefined
    let last = 0
    const tick = (n) => {
      if (n - last > 250) { last = n; setSt(azanState()) }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [open, hidden])

  useEffect(() => {
    if (!open || hidden) return undefined
    btnRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') setHidden(true) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, hidden])

  if (!open || hidden || typeof document === 'undefined') return null
  const k = prayerKey(st.key)
  const name = PRAYER_NAMES[k]?.[lang] || PRAYER_NAMES[k]?.en || k
  const idx = lineAt(st.time)
  const line = idx >= 0 ? LINES[idx][1] : ''
  const pct = st.duration ? Math.min(1, st.time / st.duration) : 0

  return createPortal(
    <div className={`azm azm--${k}`} role="dialog" aria-modal="true" aria-label={`${t.title} — ${name}`} data-testid="azan-moment">
      <div className="azm-sky" aria-hidden="true">
        {(k === 'isha' || k === 'fajr') && <div className="azm-stars">{STARS.map((s, i) => <i key={i} style={s} />)}</div>}
        <div className="azm-sun" />
        <svg className="azm-moon" viewBox="0 0 40 40"><path d="M27 6a15 15 0 1 0 7 25A13 13 0 1 1 27 6z" /></svg>
        {/* Minarə və günbəzlər — siluet (canlı təsvir yoxdur) */}
        <svg className="azm-city" viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice">
          {/* sol minarə: gövdə, şərəfə (eyvan), konus, hilal */}
          <path d="M84 160V62h-3v-6h18v6h-3v98zM80 56l10-26 10 26zM90 30v-6" />
          <path d="M90 14a5 5 0 1 0 4 8 4 4 0 1 1-4-8z" />
          {/* mərkəzi günbəz + kasnaq */}
          <path d="M130 160v-40h12a58 58 0 0 1 116 0h12v40z" />
          <path d="M200 54v-8M200 36a5 5 0 1 0 4 8 4 4 0 1 1-4-8z" />
          {/* sağ minarə */}
          <path d="M304 160V72h-3v-6h18v6h-3v88zM300 66l10-24 10 24zM310 42v-6" />
          <path d="M310 26a5 5 0 1 0 4 8 4 4 0 1 1-4-8z" />
          {/* kiçik günbəzlər və divar */}
          <path d="M0 160v-22h30a26 26 0 0 1 48 0h6v22zM336 160v-18a24 24 0 0 1 48 0h16v18zM270 160v-14h34v14z" />
        </svg>
      </div>
      <div className="azm-body">
        <p className="azm-ey">{t.title}</p>
        <h2 className="azm-name">{name}</h2>
        <p className="azm-line" lang="ar" dir="rtl" key={idx} aria-live="polite">{line}</p>
        <ol className="azm-dots" aria-hidden="true">
          {LINES.map((_, i) => <li key={i} className={i < idx ? 'is-done' : i === idx ? 'is-on' : ''} />)}
        </ol>
        <div className="azm-bar" aria-hidden="true"><i style={{ transform: `scaleX(${pct})` }} /></div>
        <div className="azm-btns">
          <button ref={btnRef} type="button" className="ui-btn ui-btn--primary" onClick={() => { stopAzan(); setOpen(false) }} data-testid="azan-stop">
            <Icon name="pause" className="ui-btn__icon" /> {t.stop}
          </button>
          <button type="button" className="ui-btn ui-btn--ghost azm-hide" onClick={() => setHidden(true)}>
            <Icon name="close" className="ui-btn__icon" /> {t.hide}
          </button>
        </div>
        <small className="azm-src">{t.src}</small>
      </div>
    </div>,
    document.body,
  )
}
