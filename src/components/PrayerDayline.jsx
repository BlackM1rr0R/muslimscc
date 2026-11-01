// ═══════════════════════════════════════════════════════
// PrayerDayline — günün 24 saatlıq üfüqi xətti (dizayn v3 vizualı)
//
//   <PrayerDayline times={{ fajr:'05:35', sunrise:'07:10', … }} nowMin={68}
//     names={{ fajr:'Sübh', … }} nowLabel="İndi" label="Günün xətti" />
//
// • Fon zolaqları: gecə → şəfəq (sübh→günəş) → gündüz → şəfəq (məğrib→işa) → gecə.
// • Hər vaxt üçün nişan (ad + saat MƏTN kimi — rəng tək daşıyıcı deyil).
//   Etiketlər iki sırada (yuxarı/aşağı növbə ilə) — telefonda üst-üstə düşmür.
// • "İndi" nişanı şəhərin saatı ilə (nowMin — gecə yarısından dəqiqə).
// • RTL: mövqelər inset-inline-start ilə — xətt özü güzgülənir.
// • Əlçatanlıq: bütöv xətt role="img" + aria-label (vaxtların siyahısı).
// Stillər: src/styles/PrayerDayline.css
// ═══════════════════════════════════════════════════════
import { useLayoutEffect, useRef } from 'react'
import '../styles/PrayerDayline.css'

const ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

/** 'HH:MM' → dəqiqə (səhv olarsa null) */
export function hmToMin(s) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(s || ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const pct = (min) => `${Math.max(0, Math.min(100, (min / 1440) * 100)).toFixed(3)}%`
const pad = (n) => String(n).padStart(2, '0')
const fmt = (min) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`

export default function PrayerDayline({ times, names = {}, nowMin, nowLabel = 'Now', label, nextKey, className = '' }) {
  const rootRef = useRef(null)
  // "İndi" həbi saat oxundakı etiketlə (məs. gecə yarısı 00:00) üst-üstə
  // düşəndə həmin etiketi gizlət — ölçü faktiki enə görə (telefon/masaüstü)
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const check = () => {
      const now = root.querySelector('.pdl__now-label')
      const nr = now ? now.getBoundingClientRect() : null
      root.querySelectorAll('.pdl__axis > span').forEach(el => {
        el.style.visibility = ''
        if (!nr) return
        const r = el.getBoundingClientRect()
        const hit = r.width > 0 && r.left < nr.right + 6 && r.right > nr.left - 6
        if (hit) el.style.visibility = 'hidden'
      })
    }
    check()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(check)
    ro.observe(root)
    return () => ro.disconnect()
  }, [nowMin, nowLabel, times])

  const m = {}
  for (const k of ORDER) m[k] = hmToMin(times?.[k])
  if (ORDER.some(k => m[k] == null)) return null

  // Fon zolaqları (başlanğıc, son, növ)
  const bands = [
    [0, m.fajr, 'night'],
    [m.fajr, m.sunrise, 'dawn'],
    [m.sunrise, m.maghrib, 'day'],
    [m.maghrib, m.isha, 'dusk'],
    [m.isha, 1440, 'night'],
  ].filter(([a, b]) => b > a)

  const aria = (label ? label + ': ' : '') + ORDER.map(k => `${names[k] || k} ${times[k]}`).join(', ')

  return (
    <div ref={rootRef} className={`pdl${className ? ' ' + className : ''}`} role="img" aria-label={aria}>
      <div className="pdl__track">
        {bands.map(([a, b, kind], i) => (
          <span key={i} className={`pdl__band pdl__band--${kind}`}
            style={{ insetInlineStart: pct(a), width: `${((b - a) / 1440) * 100}%` }} />
        ))}
        {ORDER.map((k, i) => (
          <span key={k}
            className={`pdl__mark pdl__mark--${i % 2 ? 'up' : 'down'}${k === 'sunrise' ? ' is-aux' : ''}${k === nextKey ? ' is-next' : ''}`}
            style={{ insetInlineStart: pct(m[k]) }} aria-hidden="true">
            <span className="pdl__tick" />
            <span className="pdl__label">
              <span className="pdl__name">{names[k] || k}</span>
              <span className="pdl__time">{times[k]}</span>
            </span>
          </span>
        ))}
        {nowMin != null && (
          <span className={`pdl__now${nowMin < 100 ? ' is-start' : nowMin > 1340 ? ' is-end' : ''}`} style={{ insetInlineStart: pct(nowMin) }} aria-hidden="true">
            <span className="pdl__now-dot" />
            <span className="pdl__now-label">{nowLabel} {fmt(nowMin)}</span>
          </span>
        )}
      </div>
      <div className="pdl__axis" aria-hidden="true">
        {[0, 6, 12, 18, 24].map(h => (
          <span key={h} style={{ insetInlineStart: pct(h * 60) }}>{pad(h)}:00</span>
        ))}
      </div>
    </div>
  )
}
