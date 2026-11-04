// ═══════════════════════════════════════════════════════
// TasbihBeads — "fiziki" təsbeh (dekor, aria-hidden; say mətn kimi başqa yerdədir)
//
//   <TasbihBeads count={12} target={33} />
//
// • Asılmış ip üzərində ən çox 33 muncuq. Sayılmış muncuqlar SOL dəstədə,
//   qalanları SAĞ dəstədə; hər toxunuşda bir muncuq boşluğu keçib sola sürüşür
//   (yay effekti ilə). RTL-də istiqamət güzgülənir (CSS).
// • Hədəf 33-dən böyükdürsə (məs. 100) — 33-lük dövrlərlə; dövr sayı nişanda.
// • Hədəf tamamlananda bütün muncuqlar qızılı parlayır.
// Stillər: src/styles/TasbihBeads.css
// ═══════════════════════════════════════════════════════
import { memo } from 'react'
import '../styles/TasbihBeads.css'

const W = 600
const MAX = 33
const GAP = 0.16   // iki dəstə arasındakı boşluq (ipin payı)

/** İp üzərində t (0..1) nöqtəsi — sallanan ip (parabola) */
const onString = (t) => ({ x: 26 + t * (W - 52), y: 28 + 74 * (1 - (2 * t - 1) ** 2) })

/** Muncuqların vəziyyəti (saf funksiya — test olunur) */
export function beadState(count, target) {
  const n = Math.max(1, Math.min(MAX, target || MAX))
  const c = Math.max(0, count || 0)
  const done = target > 0 && c >= target
  // 33-dən böyük hədəf: dövr içində sayılan
  const inCycle = done ? n : (target > MAX ? c % n : Math.min(c, n))
  const cycle = target > MAX ? Math.floor(Math.min(c, target - 1) / n) + 1 : 1
  const cycles = target > MAX ? Math.ceil(target / n) : 1
  return { n, counted: inCycle, done, cycle, cycles }
}

function TasbihBeads({ count, target, className = '' }) {
  const st = beadState(count, target)
  const step = (1 - 0.06 - GAP) / Math.max(1, st.n - 1)
  const beads = []
  for (let i = 0; i < st.n; i++) {
    // i-ci muncuq: sayılıbsa soldan i-ci yerdə, yoxsa sağ dəstədə
    const counted = i < st.counted
    const t = counted ? 0.03 + i * step : 0.03 + GAP + i * step
    const p = onString(t)
    beads.push(
      <circle key={i} r={i === st.counted - 1 ? 11.5 : 10} cx="0" cy="0"
        className={`tb__bead${counted ? ' is-counted' : ''}${i === st.counted - 1 ? ' is-last' : ''}`}
        style={{ transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)` }} />
    )
  }
  const end = onString(1)
  return (
    <div className={`tb${st.done ? ' is-done' : ''} ${className}`} aria-hidden="true">
      <svg viewBox={`0 0 ${W} 150`} className="tb__svg">
        <path d={`M ${onString(0).x} ${onString(0).y} Q ${W / 2} ${28 + 74 * 2} ${end.x} ${end.y}`} className="tb__string" />
        {beads}
        {/* İmam muncuğu + qotaz */}
        <g className="tb__imam" style={{ transform: `translate(${end.x}px, ${end.y}px)` }}>
          <ellipse cx="0" cy="14" rx="9" ry="13" className="tb__imam-bead" />
          <path d="M0 27 L-7 56 M0 27 L-2 58 M0 27 L3 58 M0 27 L8 55" className="tb__tassel" />
        </g>
      </svg>
      {st.cycles > 1 && <span className="tb__cycle ui-num">{st.cycle} / {st.cycles}</span>}
    </div>
  )
}

export default memo(TasbihBeads)
