// ═══════════════════════════════════════════════════════
// AmbientSound (v6.9) — "Fon səsi" çipi + seçim paneli (Quran, Mushaf, Zikr)
// Səslər cihazda sintez olunur (utils/ambient.js) — fayl yüklənmir, musiqi yoxdur.
// Səhifədən çıxanda səs dayanır.
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { AMBIENT_KINDS, playAmbient, stopAmbient, setAmbientVolume, ambientVolume, ambientKind, onAmbientChange } from '../utils/ambient'
import { pickUi } from '../utils/uiText'
import '../styles/AmbientSound.css'

const T = {
  az: { btn: 'Fon səsi', title: 'Sakit fon səsi', off: 'Söndür', vol: 'Səs səviyyəsi', rain: 'Yağış', wind: 'Külək', sea: 'Dəniz', night: 'Gecə', note: 'Təbiət səsləri cihazda yaradılır — musiqi yoxdur, internet sərf olunmur.' },
  en: { btn: 'Ambience', title: 'Calm background sound', off: 'Turn off', vol: 'Volume', rain: 'Rain', wind: 'Wind', sea: 'Sea', night: 'Night', note: 'Nature sounds are generated on your device — no music, no data used.' },
  ru: { btn: 'Фон', title: 'Спокойный фоновый звук', off: 'Выключить', vol: 'Громкость', rain: 'Дождь', wind: 'Ветер', sea: 'Море', night: 'Ночь', note: 'Звуки природы создаются на устройстве — без музыки и без трафика.' },
  ar: { btn: 'صوت الخلفية', title: 'صوت خلفية هادئ', off: 'إيقاف', vol: 'مستوى الصوت', rain: 'مطر', wind: 'رياح', sea: 'بحر', night: 'ليل', note: 'أصوات الطبيعة تُولَّد على جهازك — بلا موسيقى ولا استهلاك للإنترنت.' },
  tr: { btn: 'Arka plan sesi', title: 'Sakin arka plan sesi', off: 'Kapat', vol: 'Ses düzeyi', rain: 'Yağmur', wind: 'Rüzgâr', sea: 'Deniz', night: 'Gece', note: 'Doğa sesleri cihazda üretilir — müzik yok, internet harcanmaz.' },
}
const ICON = { rain: 'cloudRain', wind: 'wind', sea: 'waves', night: 'moon' }

// Panel <body>-yə portal ilə açılır: düymə üfüqi sürüşən / mask-li zolaqda ola
// bilər (Quran oxuyucusu) — orada mütləq panel kəsilirdi. Telefonda aşağıdan vərəq.
export default function AmbientSound({ lang = 'az', className = '', variant = 'chip' }) {
  const u = pickUi(T, lang, 'en')
  const [kind, setKind] = useState(ambientKind)
  const [open, setOpen] = useState(false)
  const [vol, setVol] = useState(ambientVolume)
  const id = useId()
  const wrap = useRef(null)
  const btn = useRef(null)
  const panel = useRef(null)
  const [pos, setPos] = useState(null)
  useEffect(() => onAmbientChange(setKind), [])
  useLayoutEffect(() => {
    if (!open || !btn.current) return undefined
    const place = () => {
      const r = btn.current.getBoundingClientRect()
      const w = Math.min(300, window.innerWidth - 24)
      // Panel həmişə ekranın içində: aşağıda yer yoxdursa — düymənin üstündə
      const h = panel.current?.offsetHeight || 340
      let top = r.bottom + 8
      if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 8)
      setPos({ top, left: Math.max(12, Math.min(window.innerWidth - w - 12, r.left)), w })
    }
    place()
    const raf = requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, { passive: true, capture: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, { capture: true }) }
  }, [open])
  // Səhifədən çıxanda dayansın
  useEffect(() => () => stopAmbient(), [])
  useEffect(() => {
    if (!open) return undefined
    const off = (e) => { if (!wrap.current?.contains(e.target) && !panel.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', off)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', off); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <span className={`amb ${className}`} ref={wrap}>
      <button ref={btn} type="button" className={`${variant === 'ctrl' ? 'ctrl-btn' : 'ui-chip'} amb__chip${kind ? ' is-on active' : ''}`} aria-expanded={open} aria-controls={id}
        onClick={() => setOpen(o => !o)} data-testid="ambient-btn">
        <span className="amb__eq" aria-hidden="true"><i /><i /><i /></span> {kind ? u[kind] : u.btn}
      </button>
      {open && createPortal(
        <div ref={panel} className="amb__panel" id={id} role="group" aria-label={u.title} data-testid="ambient-panel"
          style={pos ? { '--amb-top': `${pos.top}px`, '--amb-left': `${pos.left}px`, '--amb-w': `${pos.w}px` } : undefined}>
          <p className="amb__title">{u.title}</p>
          <div className="amb__kinds">
            {AMBIENT_KINDS.map(k => (
              <button key={k} type="button" className="amb__kind" aria-pressed={kind === k}
                onClick={() => (kind === k ? stopAmbient() : playAmbient(k))}>
                <Icon name={ICON[k]} size={20} /> <span>{u[k]}</span>
              </button>
            ))}
          </div>
          <label className="amb__vol">
            <span>{u.vol}</span>
            <input type="range" min="0" max="100" value={Math.round(vol * 100)}
              onChange={(e) => { const v = Number(e.target.value) / 100; setVol(v); setAmbientVolume(v) }} />
          </label>
          {kind && <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={stopAmbient}>{u.off}</button>}
          <p className="amb__note">{u.note}</p>
        </div>,
        document.body,
      )}
    </span>
  )
}
