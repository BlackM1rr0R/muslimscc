// ═══════════════════════════════════════════════════════
// viz v2 — zaman qrafikləri: AreaChart (yığma / üst-üstə) və LineChart
// Saf SVG + React. Ox addımları scale.js niceTicks-dən, en ResizeObserver-dən.
//
//   <AreaChart label="Gündəlik əməllər" labels={['1 noy', …]} mode="stacked"
//     series={[{ key:'p', label:'Namaz', values:[…], tone:1 }, …]} />
//   <LineChart label="Zikr" labels={…} series={[{ key:'d', label:'Zikr', values, compare: prevValues }]} />
//
// • Kursor/barmaq: şaquli xətt + bütün seriyaların dəyəri olan izah qutusu.
// • Klaviatura: qrafikə Tab → ←/→ nöqtə-nöqtə (RTL-də güzgü), Home/End, Esc.
// • Ekran oxuyucu: role="img" + xülasə (aria-label) VƏ gizli <table> (bütün dəyərlər).
// • RTL: zaman sağdan sola axır, y oxu sağdadır.
// • Çəkilmə: xətt stroke-dashoffset ilə, sahə opacity ilə — yalnız ekrana
//   girəndə və "hərəkəti azalt" söndürülübsə (viz.css).
// ═══════════════════════════════════════════════════════
import { useMemo, useRef, useState } from 'react'
import { niceTicks, linear, stackSeries, linePath, areaPath, extent, sum, nearestIndex } from './scale.js'
import { useSize, useInView, useReducedMotion, useVizFormat, useUid } from './hooks.js'
import { vizColor } from './tone.js'

const TICK_FONT = 11

function XYChart({
  series = [], labels = [], xFormat, tooltipTitle, mode = 'overlay', area = true,
  height = 240, yFormat, valueFormat, yTicks = 4, integer = false, yMin, yMax,
  grid = true, legend = true, legendValue = 'total', toggle, compareLabel, curve = 'monotone',
  label, summary, empty, emptyText, lang, animate = true, dots = false, className = '',
}) {
  const f = useVizFormat(lang)
  const rtl = f.rtl
  const wrapRef = useRef(null)
  const { width } = useSize(wrapRef)
  const seen = useInView(wrapRef)
  const reduced = useReducedMotion()
  const uid = useUid('xy')
  const [active, setActive] = useState(null)
  const [hidden, setHidden] = useState(() => new Set())

  const vf = valueFormat || ((v) => f.num(v))
  const yf = useMemo(() => yFormat || ((v) => f.compact(v)), [yFormat, f])
  const n = Math.max(0, ...series.map(s => s.values?.length || 0))
  const stacked = mode === 'stacked' && area
  const visible = useMemo(() => series.filter(s => !hidden.has(s.key)), [series, hidden])
  const canToggle = toggle ?? series.length > 1
  const hasCompare = !stacked && series.some(s => Array.isArray(s.compare) && s.compare.length)
  const allZero = n === 0 || series.every(s => (s.values || []).every(v => !v)) && !hasCompare

  // ── ölçülər ──
  const geo = useMemo(() => {
    const W = Math.max(0, width)
    const H = height
    let lo, hi
    if (stacked) {
      const stack = stackSeries(visible.map(s => s.values || []))
      const tops = stack.length ? stack[stack.length - 1].map(p => p[1]) : [0]
      ;[lo, hi] = [0, Math.max(0, ...tops)]
    } else {
      const all = visible.flatMap(s => [...(s.values || []), ...(s.compare || [])])
      ;[lo, hi] = extent(all)
      lo = Math.min(0, lo)
    }
    if (Number.isFinite(yMin)) lo = yMin
    if (Number.isFinite(yMax)) hi = Math.max(hi, yMax)
    const tk = niceTicks(lo, hi, yTicks, { integer })
    const tickLabels = tk.ticks.map(v => yf(v))
    const padY = Math.min(64, Math.max(24, Math.max(...tickLabels.map(s => String(s).length)) * 6.6 + 12))
    const top = 10, bottom = 26
    const x0 = rtl ? 6 : padY, x1 = rtl ? W - padY : W - 6
    const xs = linear([0, Math.max(1, n - 1)], rtl ? [x1, x0] : [x0, x1])
    const ys = linear([tk.min, tk.max], [H - bottom, top])
    return { W, H, tk, tickLabels, padY, top, bottom, x0, x1, xs, ys }
  }, [width, height, stacked, visible, yMin, yMax, yTicks, integer, yf, rtl, n])

  const xPos = useMemo(() => Array.from({ length: n }, (_, i) => geo.xs(i)), [geo, n])

  // ── yollar ──
  const shapes = useMemo(() => {
    if (!geo.W) return []
    const { ys } = geo
    if (stacked) {
      const stack = stackSeries(visible.map(s => s.values || []))
      return visible.map((s, si) => {
        const topPts = stack[si].map((p, i) => [xPos[i], ys(p[1])])
        const botPts = stack[si].map((p, i) => [xPos[i], ys(p[0])])
        return { s, line: linePath(topPts, curve), fill: areaPath(topPts, botPts, curve), pts: topPts }
      })
    }
    return visible.map((s) => {
      const vals = s.values || []
      const pts = vals.map((v, i) => [xPos[i], ys(Number(v) || 0)])
      const base = vals.map((_, i) => [xPos[i], ys(Math.max(geo.tk.min, 0))])
      const cmp = Array.isArray(s.compare) ? s.compare.map((v, i) => [xPos[i], ys(Number(v) || 0)]).filter(p => Number.isFinite(p[0])) : null
      return { s, line: linePath(pts, curve), fill: area ? areaPath(pts, base, curve) : '', pts, cmp: cmp && cmp.length > 1 ? linePath(cmp, curve) : '' }
    })
  }, [geo, visible, stacked, xPos, curve, area])

  // ── x oxu yazıları ──
  const xTicks = useMemo(() => {
    if (!n || !geo.W) return []
    const room = Math.max(2, Math.floor((geo.x1 - geo.x0) / 74))
    const step = Math.max(1, Math.ceil(n / room))
    const out = []
    for (let i = n - 1; i >= 0; i -= step) out.push(i)
    return out.reverse()
  }, [n, geo])
  const xLabel = (i) => (xFormat ? xFormat(labels[i], i) : labels[i] ?? String(i + 1))
  const tipTitle = (i) => (tooltipTitle ? tooltipTitle(labels[i], i) : labels[i] ?? String(i + 1))

  // ── qarşılıqlı əlaqə ──
  const onMove = (e) => {
    if (!n) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * geo.W
    setActive(nearestIndex(px, xPos))
  }
  const onKey = (e) => {
    if (!n) return
    const fwd = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    let i = active ?? n - 1
    if (e.key === fwd) i = Math.min(n - 1, (active ?? -1) + 1)
    else if (e.key === back) i = Math.max(0, (active ?? n) - 1)
    else if (e.key === 'Home') i = 0
    else if (e.key === 'End') i = n - 1
    else if (e.key === 'Escape') { setActive(null); return }
    else return
    e.preventDefault()
    setActive(i)
  }

  const totals = series.map(s => sum(s.values || []))
  const legendVal = (s, k) => {
    if (legendValue === 'total') return vf(totals[k], s)
    if (legendValue === 'last') return vf((s.values || [])[n - 1] ?? 0, s)
    if (legendValue === 'avg') return vf(n ? totals[k] / n : 0, s)
    return null
  }
  const aria = summary || `${label || ''}${label ? ': ' : ''}${series.map((s, k) => `${s.label} — ${f.t.total.toLowerCase()} ${vf(totals[k], s)}`).join('; ')}`

  const anim = animate && !reduced
  const tip = active != null && active < n ? active : null
  const tipLeftPct = tip != null && geo.W ? (xPos[tip] / geo.W) * 100 : 0
  const tipSide = tipLeftPct > 55 ? 'left' : 'right'   // qutu nöqtənin hansı tərəfində (fiziki)

  if (allZero) {
    return (
      <div className={`vz-xy vz-xy--empty ${className}`} style={{ minHeight: height }} ref={wrapRef}>
        {empty || <p className="vz-empty">{emptyText || f.t.noData}</p>}
      </div>
    )
  }

  return (
    <div className={`vz-xy${className ? ' ' + className : ''}`} data-anim={anim ? (seen ? 'run' : 'wait') : undefined}>
      <div className="vz-xy__plot" ref={wrapRef} style={{ height }}
        tabIndex={0} role="group" aria-label={`${label || ''}. ${f.t.keys}`} aria-describedby={`${uid}-t`}
        onKeyDown={onKey} onBlur={() => setActive(null)} onFocus={() => setActive(a => a ?? n - 1)}>
        {geo.W > 0 && (
          <svg className="vz-xy__svg" width={geo.W} height={geo.H} viewBox={`0 0 ${geo.W} ${geo.H}`} role="img" aria-label={aria}
            onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setActive(null)}>
            <defs>
              {shapes.map(({ s }) => (
                <linearGradient key={s.key} id={`${uid}-g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: vizColor(s.tone ?? series.indexOf(s) + 1), stopOpacity: stacked ? 0.42 : 0.26 }} />
                  <stop offset="100%" style={{ stopColor: vizColor(s.tone ?? series.indexOf(s) + 1), stopOpacity: stacked ? 0.16 : 0 }} />
                </linearGradient>
              ))}
            </defs>
            {/* şəbəkə + y oxu */}
            <g className="vz-axis" aria-hidden="true">
              {geo.tk.ticks.map((v, i) => {
                const y = geo.ys(v)
                return (
                  <g key={v}>
                    {grid && <line className={`vz-grid${v === 0 ? ' vz-grid--base' : ''}`} x1={geo.x0} x2={geo.x1} y1={y} y2={y} />}
                    <text className="vz-tick" x={rtl ? geo.x1 + 8 : geo.x0 - 8} y={y} dy="0.32em"
                      textAnchor={rtl ? 'start' : 'end'} fontSize={TICK_FONT}>{geo.tickLabels[i]}</text>
                  </g>
                )
              })}
              {xTicks.map((i, k) => (
                <text key={i} className="vz-tick" x={xPos[i]} y={geo.H - 8} fontSize={TICK_FONT}
                  textAnchor={k === xTicks.length - 1 && xTicks.length > 1 ? (rtl ? 'start' : 'end') : k === 0 && xTicks.length > 1 && i === 0 ? (rtl ? 'end' : 'start') : 'middle'}>
                  {xLabel(i)}
                </text>
              ))}
            </g>
            {/* seriyalar */}
            <g aria-hidden="true">
              {shapes.map(({ s, fill }) => fill && (
                <path key={`f-${s.key}`} className="vz-area" d={fill} fill={`url(#${uid}-g-${s.key})`} />
              ))}
              {shapes.map(({ s, cmp }) => cmp && (
                <path key={`c-${s.key}`} className="vz-line vz-line--compare" d={cmp}
                  style={{ stroke: vizColor(s.tone ?? series.indexOf(s) + 1) }} />
              ))}
              {shapes.map(({ s, line }) => (
                <path key={`l-${s.key}`} className="vz-line vz-line--draw" d={line} pathLength="1"
                  style={{ stroke: vizColor(s.tone ?? series.indexOf(s) + 1) }} />
              ))}
              {dots && shapes.map(({ s, pts }) => pts.map((p, i) => (
                <circle key={`d-${s.key}-${i}`} className="vz-dot vz-dot--rest" cx={p[0]} cy={p[1]} r="2.5"
                  style={{ fill: vizColor(s.tone ?? series.indexOf(s) + 1) }} />
              )))}
            </g>
            {/* aktiv nöqtə */}
            {tip != null && (
              <g className="vz-cross" aria-hidden="true">
                <line x1={xPos[tip]} x2={xPos[tip]} y1={geo.top} y2={geo.H - geo.bottom} />
                {shapes.map(({ s, pts }) => pts[tip] && (
                  <circle key={s.key} className="vz-dot" cx={pts[tip][0]} cy={pts[tip][1]} r="4.5"
                    style={{ fill: vizColor(s.tone ?? series.indexOf(s) + 1) }} />
                ))}
              </g>
            )}
          </svg>
        )}
        {tip != null && (
          <div className={`vz-tip vz-tip--${tipSide}`} style={{ left: `${tipLeftPct}%` }} aria-hidden="true">
            <span className="vz-tip__title">{tipTitle(tip)}</span>
            {visible.map((s) => (
              <span key={s.key} className="vz-tip__row">
                <span className="vz-swatch" style={{ '--sw': vizColor(s.tone ?? series.indexOf(s) + 1) }} />
                <span className="vz-tip__label">{s.label}</span>
                <b className="vz-tip__val">{vf((s.values || [])[tip] ?? 0, s)}</b>
                {Array.isArray(s.compare) && s.compare[tip] != null && (
                  <span className="vz-tip__cmp">{compareLabel || f.t.prev}: {vf(s.compare[tip], s)}</span>
                )}
              </span>
            ))}
            {stacked && visible.length > 1 && (
              <span className="vz-tip__row vz-tip__row--total">
                <span className="vz-tip__label">{f.t.total}</span>
                <b className="vz-tip__val">{vf(sum(visible.map(s => (s.values || [])[tip] || 0)))}</b>
              </span>
            )}
          </div>
        )}
        {/* klaviatura/ekran oxuyucu üçün cari nöqtə */}
        <span className="ui-sr-only" aria-live="polite">
          {tip != null ? `${tipTitle(tip)}: ${visible.map(s => `${s.label} ${vf((s.values || [])[tip] ?? 0, s)}`).join(', ')}` : ''}
        </span>
      </div>

      {legend && (
        <ul className="vz-legend" aria-label={label}>
          {series.map((s, k) => {
            const off = hidden.has(s.key)
            const body = (
              <>
                <span className="vz-swatch" style={{ '--sw': vizColor(s.tone ?? k + 1) }} aria-hidden="true" />
                <span className="vz-legend__label">{s.label}</span>
                {legendValue && <b className="vz-legend__val">{legendVal(s, k)}</b>}
              </>
            )
            return (
              <li key={s.key}>
                {canToggle
                  ? <button type="button" className={`vz-chip${off ? ' is-off' : ''}`} aria-pressed={!off}
                      onClick={() => setHidden(h => { const x = new Set(h); if (x.has(s.key)) x.delete(s.key); else if (x.size < series.length - 1) x.add(s.key); return x })}>{body}</button>
                  : <span className="vz-chip">{body}</span>}
              </li>
            )
          })}
          {hasCompare && (
            <li><span className="vz-chip vz-chip--compare"><span className="vz-swatch vz-swatch--dash" aria-hidden="true" /><span className="vz-legend__label">{compareLabel || f.t.prev}</span></span></li>
          )}
        </ul>
      )}

      {/* cədvəl ui-sr-only div-in içində: <table> özü 1px-ə sıxılmır (telefonda üfüqi sürüşmə yaradırdı) */}
      <div className="ui-sr-only"><table id={`${uid}-t`}>
        {label && <caption>{label}</caption>}
        <thead><tr><th scope="col">{f.t.date}</th>{series.map(s => <th key={s.key} scope="col">{s.label}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: n }, (_, i) => (
            <tr key={i}><th scope="row">{tipTitle(i)}</th>{series.map(s => <td key={s.key}>{vf((s.values || [])[i] ?? 0, s)}</td>)}</tr>
          ))}
        </tbody>
      </table></div>
    </div>
  )
}

/**
 * Sahə qrafiki. mode: 'stacked' (yığma — tərkib zamanla) | 'overlay' (üst-üstə).
 * Əsas props: series[{key,label,values,tone,compare?}] labels xFormat tooltipTitle height
 * yFormat valueFormat yTicks integer legend legendValue('total'|'last'|'avg'|false) toggle
 * compareLabel curve label(məcburi) summary empty emptyText lang animate
 * compare (ştrixli "keçən dövr") yalnız overlay rejimində çəkilir.
 */
export function AreaChart(props) {
  return <XYChart area mode="overlay" {...props} />
}

/** Xətt qrafiki — AreaChart ilə eyni props (dolğusuz); series[i].compare — ştrixli keçən dövr. */
export function LineChart(props) {
  return <XYChart {...props} area={false} mode="overlay" />
}
