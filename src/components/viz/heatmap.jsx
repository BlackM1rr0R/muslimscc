// ═══════════════════════════════════════════════════════
// viz v2 — CalendarHeatmap: GitHub üslubunda gün şəbəkəsi (sütun = həftə)
//
//   <CalendarHeatmap label="Fəaliyyət" data={{ '2026-11-08': 4, … }} weeks="auto" maxWeeks={26}
//     format={(v) => `${v} əməl`} />
//
// • Pillələr: thresholds verilməsə görünən dövrün müsbət dəyərlərinin kvantilləri.
// • Klaviatura: Tab → ↑/↓ gün, ←/→ həftə (RTL-də güzgü), Home/End; izah qutusu.
// • RTL: ən köhnə həftə sağda, gün adları sağda.
// • Ekran oxuyucu: role="img" xülasə + gizli cədvəl (yalnız aktiv günlər).
// ═══════════════════════════════════════════════════════
import { useMemo, useRef, useState } from 'react'
import { quantileThresholds, levelOf, toDayKey, fromDayKey, addDayKey } from './scale.js'
import { useSize, useInView, useReducedMotion, useVizFormat, useUid } from './hooks.js'

const GAP = 3

export function CalendarHeatmap({
  data = {}, end, weeks = 'auto', maxWeeks = 26, minWeeks = 8, weekStart = 1, thresholds, levels = 4,
  format, label, legend = true, showDays = true, showMonths = true, tone = 1, lang, className = '', animate = true,
}) {
  const f = useVizFormat(lang)
  const rtl = f.rtl
  const ref = useRef(null)
  const { width } = useSize(ref)
  const seen = useInView(ref)
  const reduced = useReducedMotion()
  const uid = useUid('hm')
  const [active, setActive] = useState(null)   // gün indeksi

  const get = typeof data === 'function' ? data : (k) => Number(data?.[k]) || 0
  const endKey = end ? (end instanceof Date ? toDayKey(end) : String(end)) : toDayKey()
  const todayKey = toDayKey()
  const labelW = showDays ? 30 : 0
  const topH = showMonths ? 18 : 0

  const nWeeks = useMemo(() => {
    if (weeks !== 'auto') return Math.max(1, weeks)
    if (!width) return Math.min(maxWeeks, 12)
    return Math.max(minWeeks, Math.min(maxWeeks, Math.floor((width - labelW + GAP) / (11 + GAP))))
  }, [weeks, width, maxWeeks, minWeeks, labelW])

  const grid = useMemo(() => {
    // Son sütunun həftə başlanğıcı
    const e = fromDayKey(endKey)
    const dow = (e.getDay() - weekStart + 7) % 7
    const lastStart = addDayKey(endKey, -dow)
    const first = addDayKey(lastStart, -7 * (nWeeks - 1))
    const days = []
    for (let i = 0; i < nWeeks * 7; i++) {
      const key = addDayKey(first, i)
      const future = key > endKey
      days.push({ key, i, col: Math.floor(i / 7), row: i % 7, value: future ? 0 : get(key), future })
    }
    const th = thresholds || quantileThresholds(days.filter(d => !d.future).map(d => d.value), levels)
    for (const d of days) d.level = d.future ? -1 : levelOf(d.value, th)
    return { days, th }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endKey, nWeeks, weekStart, thresholds, levels, data])

  const W = Math.max(0, width)
  const pitch = W ? Math.min(20, (W - labelW + GAP) / nWeeks) : 14
  const cell = Math.max(6, pitch - GAP)
  const H = topH + 7 * pitch
  const colX = (c) => (rtl ? W - labelW - (c + 1) * pitch + GAP : labelW + c * pitch)

  const months = useMemo(() => {
    const out = []
    let prev = -1, lastCol = -9
    for (let c = 0; c < nWeeks; c++) {
      const d = fromDayKey(grid.days[c * 7].key)
      // ay sütunun ilk günündə dəyişirsə (və ya ilk sütunda) yazılır
      const m = d.getMonth()
      if (m !== prev) {
        if (c - lastCol >= 3 && !(c === 0 && d.getDate() > 21)) { out.push({ c, text: f.date(d, { month: 'short' }) }); lastCol = c }
        prev = m
      }
    }
    return out
  }, [grid, nWeeks, f])

  const vfmt = (v, k) => (format ? format(v, k) : f.num(v))
  const past = grid.days.filter(d => !d.future)
  const activeDays = past.filter(d => d.value > 0)
  const aria = `${label ? label + ': ' : ''}${activeDays.length} / ${past.length}`

  const onKey = (e) => {
    const n = grid.days.length
    const lastPast = past.length ? past[past.length - 1].i : n - 1
    let i = active ?? lastPast
    const right = rtl ? -7 : 7
    const map = { ArrowDown: 1, ArrowUp: -1, ArrowRight: right, ArrowLeft: -right }
    if (map[e.key] != null) i = Math.max(0, Math.min(lastPast, i + map[e.key]))
    else if (e.key === 'Home') i = 0
    else if (e.key === 'End') i = lastPast
    else if (e.key === 'Escape') { setActive(null); return }
    else return
    e.preventDefault()
    setActive(i)
  }
  const onMove = (e) => {
    if (!W) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    const y = ((e.clientY - r.top) / r.height) * H - topH
    const col = Math.floor(rtl ? (W - labelW - x) / pitch : (x - labelW) / pitch)
    const row = Math.floor(y / pitch)
    if (col < 0 || col >= nWeeks || row < 0 || row > 6) { setActive(null); return }
    const d = grid.days[col * 7 + row]
    setActive(d && !d.future ? d.i : null)
  }

  const act = active != null ? grid.days[active] : null
  const dayName = (row) => {
    const d = fromDayKey(grid.days[row].key)
    return f.date(d, { weekday: 'short' })
  }

  return (
    <div className={`vz-heat${className ? ' ' + className : ''}`} style={{ '--hm-color': `var(--viz-${tone})` }}
      data-anim={animate && !reduced ? (seen ? 'run' : 'wait') : undefined}>
      <div className="vz-heat__plot" ref={ref} tabIndex={0} role="group" aria-label={`${label || ''}. ${f.t.keys}`}
        onKeyDown={onKey} onBlur={() => setActive(null)} onFocus={() => setActive(a => a ?? (past.length ? past[past.length - 1].i : 0))}>
        {W > 0 && (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}
            onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setActive(null)}>
            {showMonths && months.map(m => (
              <text key={m.c} className="vz-tick" x={rtl ? colX(m.c) + cell : colX(m.c)} y={11} fontSize="11" textAnchor={rtl ? 'end' : 'start'}>{m.text}</text>
            ))}
            {showDays && [0, 2, 4].map(r => (
              <text key={r} className="vz-tick" x={rtl ? W - labelW + 6 : labelW - 6} y={topH + r * pitch + cell / 2} dy="0.32em"
                fontSize="10" textAnchor={rtl ? 'start' : 'end'}>{dayName(r)}</text>
            ))}
            <g>
              {grid.days.map(d => (
                <rect key={d.key} className={`vz-heat__cell l${d.level}${d.key === todayKey ? ' is-today' : ''}${active === d.i ? ' is-active' : ''}`}
                  x={colX(d.col)} y={topH + d.row * pitch} width={cell} height={cell} rx={Math.min(3, cell / 4)}
                  style={{ '--hc': d.col }} />
              ))}
            </g>
          </svg>
        )}
        {act && W > 0 && (
          <div className={`vz-tip vz-tip--${(colX(act.col) / W) > 0.55 ? 'left' : 'right'} vz-tip--heat`}
            style={{ left: `${((colX(act.col) + cell / 2) / W) * 100}%`, top: topH + act.row * pitch }} aria-hidden="true">
            <span className="vz-tip__title">{f.date(fromDayKey(act.key), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <b className="vz-tip__val">{vfmt(act.value, act.key)}</b>
          </div>
        )}
        <span className="ui-sr-only" aria-live="polite">
          {act ? `${f.date(fromDayKey(act.key), { day: 'numeric', month: 'long' })}: ${vfmt(act.value, act.key)}` : ''}
        </span>
      </div>
      {legend && (
        <div className="vz-heat__legend" aria-hidden="true">
          <span>{f.t.less}</span>
          {Array.from({ length: levels + 1 }, (_, l) => <span key={l} className={`vz-heat__key l${l}`} />)}
          <span>{f.t.more}</span>
        </div>
      )}
      {/* cədvəl ui-sr-only div-in içində: <table> özü 1px-ə sıxılmır (telefonda üfüqi sürüşmə yaradırdı) */}
      <div className="ui-sr-only"><table id={`${uid}-t`}>
        {label && <caption>{label}</caption>}
        <thead><tr><th scope="col">{f.t.date}</th><th scope="col">{f.t.value}</th></tr></thead>
        <tbody>
          {activeDays.map(d => <tr key={d.key}><th scope="row">{f.date(fromDayKey(d.key), { day: 'numeric', month: 'long', year: 'numeric' })}</th><td>{vfmt(d.value, d.key)}</td></tr>)}
        </tbody>
      </table></div>
    </div>
  )
}
