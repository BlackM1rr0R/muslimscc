// ═══════════════════════════════════════════════════════
// Fəaliyyət xəritəsi (istilik xəritəsi) — şəxsi gündəliklər üçün
// (/muhasabah, /duajournal). Həftələr sütun, Bazar ertəsi yuxarıda.
//   days    — neçə gün (bu gün daxil, sonuncu xana)
//   levelOf — (iso) => 0…4 (0 — boş)
//   titleOf — (iso) => xananın ipucu mətni (<title>)
//   label   — aria-label (məs. "Son 90 gündə 12 gün qeyd olunub")
//   onPick  — (iso) => void; verilibsə xanalar klikləyən olur
// Rəng tokenlərdən: --viz-track (boş) → --viz-1 (dolu) qarışığı; RTL-də
// svg güzgülənir ki, ən yeni həftə sətrin sonunda (solda) olsun.
// ═══════════════════════════════════════════════════════
import '../styles/ActivityHeatmap.css'

const CELL = 13
const GAP = 3
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export default function ActivityHeatmap({ days = 84, today = new Date(), levelOf, titleOf, label, selected, onPick, less, more, className = '' }) {
  const start = addDays(today, -(days - 1))
  const offset = (start.getDay() + 6) % 7 // B.e. = 0
  const cells = []
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i)
    const k = iso(d)
    const idx = i + offset
    cells.push({ k, l: Math.max(0, Math.min(4, levelOf ? levelOf(k) : 0)), x: Math.floor(idx / 7) * (CELL + GAP), y: (idx % 7) * (CELL + GAP) })
  }
  const cols = Math.ceil((days + offset) / 7)
  const w = cols * (CELL + GAP) - GAP
  const h = 7 * (CELL + GAP) - GAP
  return (
    <div className={`ahm${className ? ' ' + className : ''}`}>
      <div className="ahm__scroll">
        <svg className="ahm__svg" viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={label}>
          {cells.map(c => (
            <rect key={c.k} x={c.x} y={c.y} width={CELL} height={CELL} rx="3"
              className={`ahm-cell ahm-cell--${c.l}${c.k === selected ? ' is-selected' : ''}${onPick ? ' is-pickable' : ''}`}
              onClick={onPick ? () => onPick(c.k) : undefined}>
              {titleOf && <title>{titleOf(c.k)}</title>}
            </rect>
          ))}
        </svg>
      </div>
      {(less || more) && (
        <div className="ahm__legend" aria-hidden="true">
          <span>{less}</span>
          {[0, 1, 2, 3, 4].map(l => (
            <svg key={l} width={CELL} height={CELL} viewBox={`0 0 ${CELL} ${CELL}`}><rect width={CELL} height={CELL} rx="3" className={`ahm-cell ahm-cell--${l}`} /></svg>
          ))}
          <span>{more}</span>
        </div>
      )}
    </div>
  )
}
