// ═══════════════════════════════════════════════════════
// Ramazana qədər yol — siferblat: hər gün bir cizgi (ROAD_DAYS), yuxarıda hilal (Ramazan).
// Edilən addımlar — marka rəngi, bugünkü — vurğu, keçmiş və edilməmiş — solğun, gələcək — çox solğun.
// Cizgilərin koordinatları bir dəfə hesablanır (useMemo); animasiya yalnız opacity/transform,
// prefers-reduced-motion-da yoxdur (RamadanPrep.css).
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import { ROAD_DAYS } from '../../utils/ramadanPrep'

const SIZE = 220, C = SIZE / 2, R1 = 92, R2 = 104
const GAP = 34 // yuxarıda hilal üçün boşluq (dərəcə)

export default function RoadDial({ daysLeft = null, done = {}, ramadanDay = null, label, center, sub }) {
  const ticks = useMemo(() => {
    const out = []
    const span = 360 - GAP
    for (let i = 0; i < ROAD_DAYS; i++) {
      const n = ROAD_DAYS - i
      const a = ((-90 + GAP / 2 + (i + 0.5) * (span / ROAD_DAYS)) * Math.PI) / 180
      const cos = Math.cos(a), sin = Math.sin(a)
      out.push({ n, x1: C + R1 * cos, y1: C + R1 * sin, x2: C + R2 * cos, y2: C + R2 * sin })
    }
    return out
  }, [])

  const stateOf = (n) => {
    if (ramadanDay) return done[n] ? 'is-done' : 'is-past'
    if (daysLeft == null) return ''
    if (done[n]) return 'is-done'
    if (n === daysLeft) return 'is-today'
    return n > daysLeft ? 'is-past' : ''
  }
  const today = daysLeft != null && daysLeft >= 1 && daysLeft <= ROAD_DAYS ? ticks[ROAD_DAYS - daysLeft] : null

  return (
    <figure className={`rpp-dial${ramadanDay ? ' is-ramadan' : ''}`} role="img" aria-label={label} data-testid="rpp-dial">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="rpp-dial-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity=".16" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={R1 - 12} className="rpp-dial__glow" fill="url(#rpp-dial-glow)" />
        <g className="rpp-dial__ticks">
          {ticks.map((t) => <line key={t.n} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className={`rpp-dial__tick ${stateOf(t.n)}`} />)}
        </g>
        {today && <circle cx={(today.x1 + today.x2) / 2} cy={(today.y1 + today.y2) / 2} r="7" className="rpp-dial__now" />}
        {/* Hilal — Ramazan (yolun sonu) */}
        <g className="rpp-dial__moon" transform={`translate(${C} ${C - (R1 + R2) / 2})`}>
          <path d="M5.5 -7.5a8 8 0 1 0 2 11.6A6.4 6.4 0 0 1 5.5 -7.5z" />
        </g>
      </svg>
      <div className="rpp-dial__center" aria-hidden="true">
        <b className="rpp-dial__num ui-num">{center ?? '·'}</b>
        {sub && <span className="rpp-dial__sub">{sub}</span>}
      </div>
    </figure>
  )
}
