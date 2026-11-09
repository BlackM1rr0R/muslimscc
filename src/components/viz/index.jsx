// ═══════════════════════════════════════════════════════
// Kiçik qrafik dəsti (dizayn v3) — kitabxanasız, əl ilə yazılmış HTML/SVG.
//
//   import { BarChart, ColumnChart, Donut, ProgressRing, ProgressBar,
//            Sparkline, StackedBar, Timeline, StatTile, ChartFigure } from '../components/viz'
//   v2: AreaChart LineChart CalendarHeatmap ChartCard Delta KpiCard RangeTabs FunnelChart
//       SegmentBreakdown CompareBars GoalRing RadialBars ActivityFeed MiniTable InlineBar TrendCell
//       (fayllar: xy.jsx heatmap.jsx cards.jsx; hesab scale.js; format format.js; stil styles/viz.css)
//
// Qaydalar (DESIGN.md §6 "Qrafiklər"):
//   • Rəng YALNIZ tokenlərdən: --viz-1…4 (sabit sıra, dövr etmir), iz
//     --viz-track, şəbəkə --viz-grid. Tək seriya → tone 1. Mətn həmişə
//     mətn tokenlərində (seriya rəngində deyil).
//   • Əlçatanlıq: hər qrafikin görünən başlığı (ChartFigure title) və ya
//     `label` (aria-label) olur; dəyərlər ekranda MƏTN kimi də yazılır
//     (zolağın yanında, legend-də) — rəng tək daşıyıcı deyil.
//   • RTL: HTML qrafiklər (BarChart, ColumnChart, StackedBar, Timeline)
//     məntiqi xassələrlə özü güzgülənir; Sparkline-də `flipRtl`.
//   • Dark rejim avtomatikdir (tokenlər [data-theme=dark]-da öz dəyərini alır).
//   • Stillər: src/styles/ui.css §13–14 (.ui-viz-*, .ui-figure, .ui-legend …).
// ═══════════════════════════════════════════════════════
import Icon from '../Icon'

import { vizColor } from './tone.js'
import '../../styles/viz.css'
export { vizColor }

// ── viz v2 (DESIGN.md "Qrafiklər v2") ──
export { AreaChart, LineChart } from './xy.jsx'
export { CalendarHeatmap } from './heatmap.jsx'
export {
  ChartCard, BentoGrid, Delta, KpiCard, RangeTabs, FunnelChart, SegmentBreakdown, CompareBars,
  GoalRing, RadialBars, ActivityFeed, MiniTable, InlineBar, TrendCell,
} from './cards.jsx'
export { useSize, useReducedMotion, useInView, useVizFormat } from './hooks.js'
export { makeFormat, localeOf, vizText } from './format.js'
export * as vizScale from './scale.js'

const fmtDefault = (v) => String(v)

/**
 * Qrafik çərçivəsi: başlıq, alt başlıq, qeyd/mənbə.
 * <ChartFigure title="…" sub="…" note="Mənbə: …" plain>…</ChartFigure>
 */
export function ChartFigure({ title, sub, note, plain = false, className = '', children, ...rest }) {
  return (
    <figure className={`ui-figure${plain ? ' ui-figure--plain' : ''}${className ? ' ' + className : ''}`} {...rest}>
      {(title || sub) && (
        <figcaption className="ui-figure__head">
          {title && <span className="ui-figure__title">{title}</span>}
          {sub && <span className="ui-figure__sub">{sub}</span>}
        </figcaption>
      )}
      {children}
      {note && <p className="ui-figure__note">{note}</p>}
    </figure>
  )
}

/**
 * Üfüqi zolaq qrafiki — müqayisə (kateqoriya adları uzun ola bilər).
 * data: [{ label, value, note?, tone?, muted? }]
 * max — miqyas (susma: ən böyük dəyər); format(v) — dəyərin mətni; labelWidth — '34%'
 */
export function BarChart({ data = [], max, format = fmtDefault, tone = 1, labelWidth, label, className = '' }) {
  const top = max ?? Math.max(...data.map(d => d.value), 0)
  return (
    <div className={`ui-viz-bars-wrap${className ? ' ' + className : ''}`}>
      <ul className="ui-viz-bars" aria-label={label} style={labelWidth ? { '--bar-label-w': labelWidth } : undefined}>
        {data.map((d, i) => {
          const pct = top > 0 ? Math.max(0, Math.min(100, (d.value / top) * 100)) : 0
          return (
            <li key={d.key ?? i} className={`ui-viz-bar${d.muted ? ' is-muted' : ''}`}>
              <span className="ui-viz-bar__label">{d.label}</span>
              <span className="ui-viz-bar__track">
                <span className="ui-viz-bar__fill" aria-hidden="true"
                  style={{ '--w': `${pct}%`, '--bar-color': vizColor(d.tone ?? tone) }} />
                <span className="ui-viz-bar__value">{format(d.value, d)}</span>
              </span>
              {d.note && <span className="ui-viz-bar__note">{d.note}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Şaquli sütun qrafiki — ardıcıllıq (aylar, günlər, namazlar); ≤ 12 sütun.
 * data: [{ label, value, current?, muted?, tone? }]; height — px
 */
export function ColumnChart({ data = [], max, format = fmtDefault, tone = 1, height = 140, showValues = true, label, className = '' }) {
  const top = max ?? Math.max(...data.map(d => d.value), 0)
  return (
    <ul className={`ui-viz-cols${className ? ' ' + className : ''}`} aria-label={label} style={{ '--cols-h': `${height}px` }}>
      {data.map((d, i) => {
        const pct = top > 0 ? Math.max(0, Math.min(100, (d.value / top) * 100)) : 0
        return (
          <li key={d.key ?? i} className={`ui-viz-col${d.current ? ' is-current' : ''}${d.muted ? ' is-muted' : ''}`}>
            {showValues && <span className="ui-viz-col__value">{format(d.value, d)}</span>}
            <span className="ui-viz-col__bar" aria-hidden="true">
              <span className="ui-viz-col__fill" style={{ '--h': `${pct}%`, '--bar-color': vizColor(d.tone ?? tone) }} />
            </span>
            <span className="ui-viz-col__label">
              {d.label}
              {!showValues && <span className="ui-sr-only">: {format(d.value, d)}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

// Dairə qövsləri: r radiuslu çevrədə payları stroke-dasharray ilə çəkir
function arcs(segments, r) {
  const C = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1
  const gap = segments.length > 1 ? 2 : 0   // seqmentlər arası 2px səth boşluğu
  let offset = 0
  return segments.map((s, i) => {
    const len = (Math.max(0, s.value) / total) * C
    const dash = Math.max(0, len - gap)
    const a = { key: s.key ?? i, dash, C, offset, color: vizColor(s.tone ?? i + 1) }
    offset += len
    return a
  })
}

/**
 * Donut — tərkib (2–4 pay). Legend dəyərləri mətn kimi göstərir.
 * segments: [{ label, value, tone? }]; center: { value, label }
 */
export function Donut({ segments = [], size = 132, thickness = 16, center, format = fmtDefault, label, legend = true, className = '' }) {
  const r = (size - thickness) / 2
  const c = size / 2
  const list = arcs(segments, r)
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0)
  const aria = label || segments.map(s => `${s.label}: ${format(s.value, s)}`).join(', ')
  return (
    <div className={`ui-viz-donut${className ? ' ' + className : ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={aria}>
        <circle className="ui-viz-track" cx={c} cy={c} r={r} strokeWidth={thickness} />
        <g transform={`rotate(-90 ${c} ${c})`}>
          {total > 0 && list.map(a => (
            <circle key={a.key} className="ui-viz-arc" cx={c} cy={c} r={r} strokeWidth={thickness}
              stroke={a.color} strokeDasharray={`${a.dash} ${a.C - a.dash}`} strokeDashoffset={-a.offset} />
          ))}
        </g>
        {center && (
          <>
            <text className="ui-viz-center-num" x={c} y={center.label ? c - 2 : c + 6} textAnchor="middle" fontSize={size * 0.17}>{center.value}</text>
            {center.label && <text className="ui-viz-center-label" x={c} y={c + size * 0.12} textAnchor="middle" fontSize={Math.max(10, size * 0.085)}>{center.label}</text>}
          </>
        )}
      </svg>
      {legend && (
        <ul className="ui-legend">
          {segments.map((s, i) => (
            <li key={s.key ?? i}>
              <span className="ui-swatch" style={{ '--swatch': vizColor(s.tone ?? i + 1) }} aria-hidden="true" />
              <span>{s.label}</span> <b>{format(s.value, s)}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Halqa — tək irəliləyiş (xətm, hifz, gündəlik hədəf).
 * <ProgressRing value={18} max={30} label="Cüz" sub="18 / 30" />
 */
export function ProgressRing({ value = 0, max = 100, size = 64, thickness = 7, tone = 1, label, sub, showPercent = true, className = '' }) {
  const r = (size - thickness) / 2
  const c = size / 2
  const C = 2 * Math.PI * r
  const frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const pct = Math.round(frac * 100)
  return (
    <div className={`ui-viz-ring${className ? ' ' + className : ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="progressbar"
        aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label ? `${label}: ${pct}%` : `${pct}%`}>
        <circle className="ui-viz-track" cx={c} cy={c} r={r} strokeWidth={thickness} />
        {/* 0%-də qövs çəkilmir — dəyirmi uc (round cap) boş halqada nöqtə qoyurdu */}
        {frac > 0 && (
          <circle className="ui-viz-arc" cx={c} cy={c} r={r} strokeWidth={thickness} stroke={vizColor(tone)}
            strokeDasharray={`${frac * C} ${C}`} transform={`rotate(-90 ${c} ${c})`} />
        )}
        {showPercent && <text className="ui-viz-center-num" x={c} y={c + size * 0.07} textAnchor="middle" fontSize={size * 0.22}>{pct}%</text>}
      </svg>
      {(label || sub) && (
        <span className="ui-viz-ring__text">
          {label && <span className="ui-viz-ring__label">{label}</span>}
          {sub && <span className="ui-viz-ring__sub">{sub}</span>}
        </span>
      )}
    </div>
  )
}

/** Xətti irəliləyiş zolağı. <ProgressBar value={62} max={100} label="Oxunub" /> */
export function ProgressBar({ value = 0, max = 100, tone = 1, size, label, className = '' }) {
  const frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  return (
    <div className={`ui-meter${size ? ` ui-meter--${size}` : ''}${className ? ' ' + className : ''}`}
      role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}
      style={{ '--value': `${frac * 100}%`, '--meter-color': vizColor(tone) }}>
      <span className="ui-meter__fill" />
    </div>
  )
}

/**
 * Paylar bir zolaqda (tərkib). Legend dəyərləri mətn kimi.
 * segments: [{ label, value, tone? }]
 */
export function StackedBar({ segments = [], format = fmtDefault, label, legend = true, className = '' }) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1
  return (
    <div className={className}>
      <div className="ui-viz-stack" role="img" aria-label={label || segments.map(s => `${s.label}: ${format(s.value, s)}`).join(', ')}>
        {segments.map((s, i) => (
          <span key={s.key ?? i} style={{ '--w': `${(Math.max(0, s.value) / total) * 100}%`, '--bar-color': vizColor(s.tone ?? i + 1) }} />
        ))}
      </div>
      {legend && (
        <ul className="ui-legend">
          {segments.map((s, i) => (
            <li key={s.key ?? i}>
              <span className="ui-swatch" style={{ '--swatch': vizColor(s.tone ?? i + 1) }} aria-hidden="true" />
              <span>{s.label}</span> <b>{format(s.value, s)}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Kiçik xətt qrafiki — trend (son 7/30 gün). label MƏCBURİDİR (aria-label).
 * values: number[]; area — altı rənglənsin; dot — son nöqtə
 */
export function Sparkline({ values = [], width = 120, height = 32, tone = 1, area = true, dot = true, flipRtl = true, label, className = '' }) {
  const n = values.length
  if (n < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 3
  const x = (i) => pad + (i / (n - 1)) * (width - 2 * pad)
  const y = (v) => pad + (1 - (v - min) / span) * (height - 2 * pad)
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  const line = `M${pts.join(' L')}`
  const fill = `${line} L${x(n - 1).toFixed(1)},${height} L${x(0).toFixed(1)},${height} Z`
  return (
    <svg className={`ui-viz-spark${flipRtl ? ' ui-viz-spark--flip' : ''}${className ? ' ' + className : ''}`}
      width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}
      style={{ '--spark-color': vizColor(tone) }}>
      {area && <path className="ui-viz-spark__area" d={fill} />}
      <path className="ui-viz-spark__line" d={line} />
      {dot && <circle className="ui-viz-spark__dot" cx={x(n - 1)} cy={y(values[n - 1])} r="3" />}
    </svg>
  )
}

/**
 * Zaman xətti. items: [{ when, title, text?, key?, tone?, highlight? }]
 * wide — ≥768px-də tarix ayrıca sütunda; headingLevel — 'h3' (susma) / 'h4'
 */
export function Timeline({ items = [], wide = false, headingLevel = 'h3', className = '' }) {
  const H = headingLevel
  return (
    <ol className={`ui-timeline${wide ? ' ui-timeline--wide' : ''}${className ? ' ' + className : ''}`}>
      {items.map((it, i) => (
        <li key={it.key ?? i} className={`ui-timeline__item${it.highlight ? ' is-key' : ''}`}
          style={it.tone ? { '--tl-color': vizColor(it.tone) } : undefined}>
          {it.when != null && <span className="ui-timeline__when">{it.when}</span>}
          <H className="ui-timeline__title">{it.title}</H>
          {it.text && <p className="ui-timeline__text">{it.text}</p>}
        </li>
      ))}
    </ol>
  )
}

/**
 * Statistika kafeli. count — data-count sayğacı (motion.css) üçün rəqəm.
 * <StatTile value="6236" label="Ayə" icon="quran" hint="…" count={6236} />
 * variant: 'tile' (susma) | 'sunken' | 'plain'; tone: 'brand' | 'accent'
 */
export function StatTile({ value, unit, label, hint, icon, count, variant = 'tile', tone, className = '', children }) {
  const cls = ['ui-stat']
  if (variant === 'tile' || variant === 'sunken') cls.push('ui-stat--tile')
  if (variant === 'sunken') cls.push('ui-stat--sunken')
  if (tone) cls.push(`ui-stat--${tone}`)
  if (className) cls.push(className)
  return (
    <div className={cls.join(' ')}>
      {icon ? (
        <span className="ui-stat__head">
          <span className="ui-stat__label">{label}</span>
          <span className="ui-stat__icon" aria-hidden="true"><Icon name={icon} size={18} /></span>
        </span>
      ) : null}
      <span className="ui-stat__num">
        <span {...(count != null ? { 'data-count': count } : {})}>{value}</span>
        {unit && <span className="ui-stat__unit">{unit}</span>}
      </span>
      {!icon && label && <span className="ui-stat__label">{label}</span>}
      {hint && <span className="ui-stat__hint">{hint}</span>}
      {children}
    </div>
  )
}
