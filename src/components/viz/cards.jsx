// ═══════════════════════════════════════════════════════
// viz v2 — panel (dashboard) komponentləri
//   ChartCard BentoGrid Delta KpiCard RangeTabs FunnelChart SegmentBreakdown
//   CompareBars GoalRing RadialBars ActivityFeed MiniTable InlineBar TrendCell
// API və nümunələr: src/styles/DESIGN.md → "Qrafiklər v2". Stil: src/styles/viz.css (.vz-*)
// Rəng yalnız tone (1–4 | 'muted' | 'ok' …) → vizColor; mətn heç vaxt seriya rəngində deyil.
// ═══════════════════════════════════════════════════════
import { useRef } from 'react'
import Icon from '../Icon'
import { vizColor } from './tone.js'
import { linePath, extent, sum, pctDelta, etaFromPace } from './scale.js'
import { useVizFormat, useUid } from './hooks.js'

const cx = (...a) => a.filter(Boolean).join(' ')

// ── Daxili: kiçik trend xətti (KpiCard, TrendCell) ──
function MiniSpark({ values = [], width = 96, height = 32, tone = 1, label, className = '' }) {
  const uid = useUid('sp')
  const n = values.length
  if (n < 2) return null
  const [lo, hi] = extent(values)
  const span = hi - lo || 1
  const pad = 3
  const pts = values.map((v, i) => [pad + (i / (n - 1)) * (width - 2 * pad), pad + (1 - ((Number(v) || 0) - lo) / span) * (height - 2 * pad)])
  const line = linePath(pts, 'monotone')
  const fill = `${line}L${pts[n - 1][0]},${height}L${pts[0][0]},${height}Z`
  const color = vizColor(tone)
  return (
    <svg className={cx('vz-spark', className)} width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${uid})`} />
      <path className="vz-spark__line" d={line} style={{ stroke: color }} />
      <circle className="vz-spark__dot" cx={pts[n - 1][0]} cy={pts[n - 1][1]} r="2.6" style={{ fill: color }} />
    </svg>
  )
}

/**
 * Kart qabığı: başlıq, alt başlıq, sağda əməliyyat yeri (seqment/düymə), altda keçid.
 * <ChartCard title="…" sub="…" icon="prayer" actions={<RangeTabs …/>} footer={{ label:'Hamısı', href, onClick }} span={8}>…</ChartCard>
 */
export function ChartCard({
  title, sub, icon, actions, footer, span, rowSpan, headingLevel = 'h3', id, className = '', children, flush = false, ...rest
}) {
  const H = headingLevel
  const style = { ...(span ? { '--vz-span': span } : null), ...(rowSpan ? { '--vz-rows': rowSpan } : null), ...rest.style }
  return (
    <section id={id} className={cx('vz-card', flush && 'vz-card--flush', className)} aria-labelledby={id && title ? `${id}-h` : undefined} {...rest} style={style}>
      {(title || actions) && (
        <header className="vz-card__head">
          {icon && <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={icon} /></span>}
          <span className="vz-card__titles">
            {title && <H className="vz-card__title" id={id ? `${id}-h` : undefined}>{title}</H>}
            {sub && <span className="vz-card__sub">{sub}</span>}
          </span>
          {actions && <span className="vz-card__actions">{actions}</span>}
        </header>
      )}
      <div className="vz-card__body">{children}</div>
      {footer && (
        <footer className="vz-card__foot">
          {footer.note && <span className="vz-card__note">{footer.note}</span>}
          {footer.label && (footer.href || footer.onClick) && (
            <a className="ui-link vz-card__link" href={footer.href || '#'} onClick={footer.onClick}>
              {footer.label} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" />
            </a>
          )}
          {!footer.label && !footer.note && footer}
        </footer>
      )}
    </section>
  )
}

/** 12 sütunlu "bento" şəbəkəsi (≥1100px). Uşaqlar ChartCard span={n} ilə en seçir; <1100px — 2 / 1 sütun. */
export function BentoGrid({ className = '', children, ...rest }) {
  return <div className={cx('vz-bento', className)} {...rest}>{children}</div>
}

/**
 * Dəyişmə nişanı: ↑ 12,3% (yaşıl) / ↓ 4% (qırmızı). value — faiz (pctDelta), null → göstərilmir.
 * positiveIsGood=false — artım pisdir (məs. qəza borcu). vs — "keçən həftəyə görə" (false → gizli).
 */
export function Delta({ value, positiveIsGood = true, vs, format, size = 'sm', lang, className = '' }) {
  const f = useVizFormat(lang)
  if (value == null || !Number.isFinite(value)) return null
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  const good = dir === 'flat' ? 'neutral' : (dir === 'up') === positiveIsGood ? 'good' : 'bad'
  const txt = format ? format(Math.abs(value)) : f.pct(Math.abs(value), Math.abs(value) < 10 ? 1 : 0)
  const word = dir === 'up' ? f.t.up : dir === 'down' ? f.t.down : f.t.same
  return (
    <span className={cx('vz-delta-wrap', className)}>
      <span className={`vz-delta vz-delta--${size} is-${dir} is-${good}`}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          {dir === 'flat' ? <path d="M2 5h6" /> : <path d={dir === 'up' ? 'M5 8.5V1.8M2 4.6l3-3 3 3' : 'M5 1.5v6.7M2 5.4l3 3 3-3'} />}
        </svg>
        <span className="ui-sr-only">{word} </span>{txt}
      </span>
      {vs !== false && <span className="vz-delta__vs">{vs || f.t.vs}</span>}
    </span>
  )
}

/**
 * KPI kartı: etiket, iri rəqəm (+vahid), dəyişmə nişanı, sağda mini trend.
 * delta: number (faiz) | { value, positiveIsGood, vs }; spark: number[]; href/onClick → bütöv kart keçiddir.
 */
export function KpiCard({
  label, value, unit, delta, spark, sparkLabel, icon, href, onClick, hint, tone = 1, count, span, lang, className = '', children,
}) {
  const d = delta == null ? null : typeof delta === 'number' ? { value: delta } : delta
  const Tag = href ? 'a' : 'article'
  return (
    <Tag className={cx('vz-kpi', href && 'vz-kpi--link', className)} href={href} onClick={onClick}
      style={span ? { '--vz-span': span } : undefined}>
      <span className="vz-kpi__head">
        {icon && <span className="vz-kpi__icon" aria-hidden="true"><Icon name={icon} size={16} /></span>}
        <span className="vz-kpi__label">{label}</span>
      </span>
      <span className="vz-kpi__num">
        <span className="vz-kpi__value" {...(count != null ? { 'data-count': count } : {})}>{value}</span>
        {unit && <span className="vz-kpi__unit">{unit}</span>}
      </span>
      <span className="vz-kpi__foot">
        {d && <Delta value={d.value} positiveIsGood={d.positiveIsGood ?? true} vs={d.vs} lang={lang} />}
        {!d && hint && <span className="vz-kpi__hint">{hint}</span>}
      </span>
      {Array.isArray(spark) && spark.length > 1 && (
        <MiniSpark className="vz-kpi__spark" values={spark} tone={tone} label={sparkLabel} width={104} height={36} />
      )}
      {children}
    </Tag>
  )
}

/**
 * Dövr seçimi (idarə olunan): 7g / 30g / 90g / il. options: [{ value, label, title? }] | string[].
 * label — aria-label (məcburi). Ox düymələri ilə gəzilir (radiogroup).
 */
export function RangeTabs({ options = [], value, onChange, label, size = 'sm', className = '' }) {
  const ref = useRef(null)
  const opts = options.map(o => (typeof o === 'object' ? o : { value: o, label: String(o) }))
  const idx = Math.max(0, opts.findIndex(o => o.value === value))
  const onKey = (e) => {
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight', prevKey = rtl ? 'ArrowRight' : 'ArrowLeft'
    let i = idx
    if (e.key === nextKey || e.key === 'ArrowDown') i = (idx + 1) % opts.length
    else if (e.key === prevKey || e.key === 'ArrowUp') i = (idx - 1 + opts.length) % opts.length
    else if (e.key === 'Home') i = 0
    else if (e.key === 'End') i = opts.length - 1
    else return
    e.preventDefault()
    onChange?.(opts[i].value)
    ref.current?.querySelectorAll('button')[i]?.focus()
  }
  return (
    <div ref={ref} className={cx('ui-segmented vz-range', size && `vz-range--${size}`, className)} role="radiogroup" aria-label={label} onKeyDown={onKey}>
      {opts.map((o, i) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={i === idx} tabIndex={i === idx ? 0 : -1}
          title={o.title} onClick={() => onChange?.(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

/**
 * Huni: addımlar, başlanğıcın faizi, addımlar arası keçid nişanı; compare — ştrixli keçən dövr.
 * steps: [{ key, label, value, hint? }]; compare: number[] (eyni sırada); format(v)
 */
export function FunnelChart({ steps = [], compare, compareLabel, format, label, tone = 1, height = 150, lang, className = '' }) {
  const f = useVizFormat(lang)
  const vf = format || ((v) => f.num(v))
  const start = steps[0]?.value || 0
  const scale = Math.max(start, ...(compare || []).map(v => Number(v) || 0), 1)
  const color = vizColor(tone)
  return (
    <div className={cx('vz-funnel', className)}>
      <ol className="vz-funnel__steps" aria-label={label} style={{ '--fn-h': `${height}px`, '--fn-color': color }}>
        {steps.map((s, i) => {
          const pct = start > 0 ? (s.value / start) * 100 : 0
          const conv = i > 0 && steps[i - 1].value > 0 ? (s.value / steps[i - 1].value) * 100 : null
          const prev = compare?.[i]
          return (
            <li key={s.key ?? i} className="vz-funnel__step">
              <span className="vz-funnel__label"><span className="vz-funnel__n" aria-hidden="true">{i + 1}.</span> {s.label}</span>
              <b className="vz-funnel__value">{vf(s.value)}</b>
              <span className="vz-funnel__pct">{f.pct(pct, 0)} {f.t.ofStart}</span>
              <span className="vz-funnel__bar" aria-hidden="true">
                <span className="vz-funnel__fill" style={{ '--h': `${Math.min(100, (s.value / scale) * 100)}%` }} />
                {Number.isFinite(prev) && <span className="vz-funnel__prev" style={{ '--h': `${Math.min(100, (prev / scale) * 100)}%` }} />}
              </span>
              {conv != null && (
                <span className="vz-funnel__conv" title={f.t.step}>
                  <span className="ui-sr-only">{f.t.step}: </span>{f.pct(conv, 0)}
                </span>
              )}
              {Number.isFinite(prev) && <span className="ui-sr-only">{compareLabel || f.t.prev}: {vf(prev)}</span>}
            </li>
          )
        })}
      </ol>
      {compare && (
        <p className="vz-funnel__legend"><span className="vz-swatch vz-swatch--dash" aria-hidden="true" /> {compareLabel || f.t.prev}</p>
      )}
    </div>
  )
}

/**
 * Paylanma: bir proporsional zolaq + sətirlər (nöqtə, ad, say, pay %, dəyişmə).
 * items: [{ key, label, value, prev?, tone?, hint? }]; positiveIsGood; format(v)
 */
export function SegmentBreakdown({ items = [], format, label, positiveIsGood = true, showBar = true, lang, className = '' }) {
  const f = useVizFormat(lang)
  const vf = format || ((v) => f.num(v))
  const total = sum(items.map(i => Math.max(0, i.value)))
  return (
    <div className={cx('vz-seg', className)}>
      {showBar && (
        <div className="vz-seg__bar" role="img" aria-label={`${label ? label + ': ' : ''}${items.map(i => `${i.label} ${vf(i.value)}`).join(', ')}`}>
          {total > 0 && items.filter(i => i.value > 0).map((it, k) => (
            <span key={it.key ?? k} style={{ '--w': `${(it.value / total) * 100}%`, '--c': vizColor(it.tone ?? items.indexOf(it) + 1) }} />
          ))}
        </div>
      )}
      <ul className="vz-seg__rows" aria-label={label}>
        {items.map((it, k) => (
          <li key={it.key ?? k} className="vz-seg__row">
            <span className="vz-swatch vz-swatch--dot" style={{ '--sw': vizColor(it.tone ?? k + 1) }} aria-hidden="true" />
            <span className="vz-seg__label">{it.label}{it.hint && <span className="vz-seg__hint">{it.hint}</span>}</span>
            <b className="vz-seg__val">{vf(it.value)}</b>
            <span className="vz-seg__share">{total > 0 ? f.pct((Math.max(0, it.value) / total) * 100, 0) : '—'}</span>
            <span className="vz-seg__delta">
              {it.prev != null && <Delta value={pctDelta(it.value, it.prev)} positiveIsGood={positiveIsGood} vs={false} lang={lang} />}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * "Bu dövr vs keçən dövr" üfüqi zolaqlar: boz kölgə = keçən, rəngli = indi.
 * items: [{ key, label, value, prev, tone? }]; max (susma: ən böyüyü); format(v)
 */
export function CompareBars({ items = [], max, format, label, currentLabel, prevLabel, tone = 1, lang, className = '' }) {
  const f = useVizFormat(lang)
  const vf = format || ((v) => f.num(v))
  const top = max ?? Math.max(1, ...items.flatMap(i => [i.value || 0, i.prev || 0]))
  return (
    <div className={cx('vz-cmp', className)}>
      <p className="vz-cmp__legend" aria-hidden="true">
        <span><span className="vz-swatch" style={{ '--sw': vizColor(tone) }} /> {currentLabel || f.t.current}</span>
        <span><span className="vz-swatch vz-swatch--ghost" /> {prevLabel || f.t.prev}</span>
      </p>
      <ul className="vz-cmp__rows" aria-label={label}>
        {items.map((it, k) => (
          <li key={it.key ?? k} className="vz-cmp__row">
            <span className="vz-cmp__label">{it.label}</span>
            <span className="vz-cmp__track" aria-hidden="true">
              {it.prev != null && <span className="vz-cmp__ghost" style={{ '--w': `${Math.min(100, (it.prev / top) * 100)}%` }} />}
              <span className="vz-cmp__fill" style={{ '--w': `${Math.min(100, ((it.value || 0) / top) * 100)}%`, '--c': vizColor(it.tone ?? tone) }} />
            </span>
            <b className="vz-cmp__val">{vf(it.value || 0)}</b>
            <span className="ui-sr-only">{prevLabel || f.t.prev}: {it.prev != null ? vf(it.prev) : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Hədəf halqası + sətirlər (İndi / Qalıb / Temp / Bitəcək).
 * value, goal; pace — gündə neçə (ETA hesablanır); unit — "səh."; rows — öz sətirləriniz (əvəz edir);
 * centerLabel — faizin altındakı yazı; extraRows — əlavə sətirlər.
 */
export function GoalRing({
  value = 0, goal = 100, pace, unit, format, rows, extraRows, centerLabel, label, size = 136, thickness = 12, tone = 1, lang, className = '',
}) {
  const f = useVizFormat(lang)
  const vf = format || ((v) => f.num(v, { maximumFractionDigits: 0 }))
  const frac = goal > 0 ? Math.max(0, Math.min(1, value / goal)) : 0
  const pct = Math.round(frac * 100)
  const r = (size - thickness) / 2, c = size / 2, C = 2 * Math.PI * r
  const remaining = Math.max(0, goal - value)
  const eta = etaFromPace(remaining, pace)
  const u = unit ? ` ${unit}` : ''
  const list = rows || [
    { label: f.t.now, value: `${vf(value)}${u}` },
    { label: f.t.remaining, value: remaining > 0 ? `${vf(remaining)}${u}` : f.t.done },
    ...(pace != null ? [{ label: f.t.pace, value: pace > 0 ? `${f.num(pace)}${u} / ${f.t.perDay}` : f.t.noPace }] : []),
    ...(pace != null && remaining > 0 && eta ? [{ label: f.t.eta, value: f.date(eta.date, { day: 'numeric', month: 'short', year: 'numeric' }), strong: true }] : []),
    ...(extraRows || []),
  ]
  return (
    <div className={cx('vz-goal', className)}>
      <svg className="vz-goal__ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="progressbar"
        aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(value, goal)} aria-label={`${label ? label + ': ' : ''}${pct}%`}>
        <circle className="ui-viz-track" cx={c} cy={c} r={r} strokeWidth={thickness} />
        {frac > 0 && (
          <circle className="vz-goal__arc" cx={c} cy={c} r={r} strokeWidth={thickness} style={{ stroke: vizColor(tone), '--C': C }}
            strokeDasharray={`${frac * C} ${C}`} transform={`rotate(-90 ${c} ${c})`} />
        )}
        <text className="ui-viz-center-num" x={c} y={c + (centerLabel ? 2 : size * 0.08)} textAnchor="middle" fontSize={size * 0.22}>{f.pct(pct, 0)}</text>
        {centerLabel && <text className="ui-viz-center-label" x={c} y={c + size * 0.17} textAnchor="middle" fontSize={Math.max(10, size * 0.085)}>{centerLabel}</text>}
      </svg>
      <dl className="vz-goal__rows">
        {list.map((row, i) => (
          <div key={i} className="vz-goal__row">
            <dt>{row.label}</dt>
            <dd className={row.strong ? 'is-strong' : undefined}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * Radial zolaqlar — bir neçə tamamlanma halqası (məs. 5 namaz).
 * layout: 'row' (yan-yana kiçik halqalar, susma) | 'concentric' (iç-içə, ≤4 məsləhətdir)
 * items: [{ key, label, value, max, tone? }]; format(value, max) → "18 / 30"
 */
export function RadialBars({ items = [], layout = 'row', size, thickness, tone = 1, format, label, centerValue, centerLabel, lang, className = '' }) {
  const f = useVizFormat(lang)
  const vf = format || ((v, m) => `${f.num(v)} / ${f.num(m)}`)
  const fracOf = (it) => (it.max > 0 ? Math.max(0, Math.min(1, it.value / it.max)) : 0)
  const aria = `${label ? label + ': ' : ''}${items.map(it => `${it.label} ${f.pct(fracOf(it) * 100, 0)}`).join(', ')}`
  if (layout === 'concentric') {
    const S = size || 168, T = thickness || 11, G = 4
    const c = S / 2
    return (
      <div className={cx('vz-radial vz-radial--concentric', className)}>
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img" aria-label={aria}>
          {items.map((it, i) => {
            const r = c - T / 2 - i * (T + G)
            if (r <= T) return null
            const C = 2 * Math.PI * r, fr = fracOf(it)
            return (
              <g key={it.key ?? i}>
                <circle className="ui-viz-track" cx={c} cy={c} r={r} strokeWidth={T} />
                {fr > 0 && <circle className="vz-radial__arc" cx={c} cy={c} r={r} strokeWidth={T} strokeDasharray={`${fr * C} ${C}`}
                  transform={`rotate(-90 ${c} ${c})`} style={{ stroke: vizColor(it.tone ?? i + 1) }} />}
              </g>
            )
          })}
          {centerValue != null && <text className="ui-viz-center-num" x={c} y={c + (centerLabel ? 0 : 6)} textAnchor="middle" fontSize={S * 0.15}>{centerValue}</text>}
          {centerLabel && <text className="ui-viz-center-label" x={c} y={c + S * 0.11} textAnchor="middle" fontSize={11}>{centerLabel}</text>}
        </svg>
        <ul className="vz-radial__legend">
          {items.map((it, i) => (
            <li key={it.key ?? i}>
              <span className="vz-swatch vz-swatch--dot" style={{ '--sw': vizColor(it.tone ?? i + 1) }} aria-hidden="true" />
              <span className="vz-radial__label">{it.label}</span>
              <b>{f.pct(fracOf(it) * 100, 0)}</b>
              <span className="vz-radial__sub">{vf(it.value, it.max)}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  const S = size || 64, T = thickness || 7
  const r = (S - T) / 2, c = S / 2, C = 2 * Math.PI * r
  return (
    <ul className={cx('vz-radial vz-radial--row', className)} aria-label={label}>
      {items.map((it, i) => {
        const fr = fracOf(it)
        return (
          <li key={it.key ?? i} className="vz-radial__item">
            <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img" aria-label={`${it.label}: ${f.pct(fr * 100, 0)} (${vf(it.value, it.max)})`}>
              <circle className="ui-viz-track" cx={c} cy={c} r={r} strokeWidth={T} />
              {fr > 0 && <circle className="vz-radial__arc" cx={c} cy={c} r={r} strokeWidth={T} strokeDasharray={`${fr * C} ${C}`}
                transform={`rotate(-90 ${c} ${c})`} style={{ stroke: vizColor(it.tone ?? tone) }} />}
              <text className="ui-viz-center-num" x={c} y={c + S * 0.07} textAnchor="middle" fontSize={S * 0.22}>{Math.round(fr * 100)}</text>
            </svg>
            <span className="vz-radial__label">{it.label}</span>
            <span className="vz-radial__sub">{vf(it.value, it.max)}</span>
          </li>
        )
      })}
    </ul>
  )
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
/**
 * Fəaliyyət lenti: ikon + hadisə + meta · "7 dəq əvvəl" + çip.
 * items: [{ key, icon, title, meta?, time: Date|ms|'YYYY-MM-DD', chip?: string|{label,tone}, href?, onClick? }]
 * 'YYYY-MM-DD' tarixləri gün dəqiqliyi ilə yazılır ("bu gün", "dünən").
 */
export function ActivityFeed({ items = [], max = 8, now = Date.now(), empty, label, lang, className = '' }) {
  const f = useVizFormat(lang)
  const list = items.slice(0, max)
  if (!list.length) return empty || <p className="vz-empty">{f.t.noData}</p>
  return (
    <ol className={cx('vz-feed', className)} aria-label={label}>
      {list.map((it, i) => {
        const dayOnly = typeof it.time === 'string' && DAY_RE.test(it.time)
        const t = dayOnly ? new Date(`${it.time}T12:00:00`) : it.time instanceof Date ? it.time : new Date(it.time)
        const valid = !Number.isNaN(+t)
        const chip = typeof it.chip === 'string' ? { label: it.chip } : it.chip
        const Title = it.href ? 'a' : 'span'
        return (
          <li key={it.key ?? i} className="vz-feed__item">
            <span className="vz-feed__icon" aria-hidden="true"><Icon name={it.icon || 'check'} size={16} /></span>
            <span className="vz-feed__body">
              <Title className="vz-feed__title" href={it.href} onClick={it.onClick}>{it.title}</Title>
              <span className="vz-feed__meta">
                {valid && <time dateTime={dayOnly ? it.time : t.toISOString()}>{f.rel(t, now, { dayOnly })}</time>}
                {it.meta && <span> · {it.meta}</span>}
              </span>
            </span>
            {chip && <span className={cx('vz-feed__chip', chip.tone && `vz-feed__chip--${chip.tone}`)}>{chip.label}</span>}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Kiçik cədvəl (.ui-table əsasında). columns: [{ key, label, align?: 'start'|'end', render?(row), hideSm? }]
 * rows: [{ key, … }]; caption — görünən və ya ekran oxuyucu üçün (captionHidden)
 */
export function MiniTable({ columns = [], rows = [], caption, captionHidden = true, className = '' }) {
  return (
    // Dar ekranda üfüqi sürüşə bilər — klaviatura ilə də (tabIndex + region)
    <div className={cx('vz-mtable-wrap', className)} tabIndex={0} role="region" aria-label={typeof caption === 'string' ? caption : undefined}>
      <table className="ui-table vz-mtable">
        {caption && <caption className={captionHidden ? 'ui-sr-only' : undefined}>{caption}</caption>}
        <thead>
          <tr>{columns.map(c => <th key={c.key} scope="col" className={cx(c.align === 'end' && 'is-end', c.hideSm && 'vz-hide-sm')}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key ?? i}>
              {columns.map((c, k) => {
                const Cell = k === 0 ? 'th' : 'td'
                return <Cell key={c.key} scope={k === 0 ? 'row' : undefined} className={cx(c.align === 'end' && 'is-end', c.hideSm && 'vz-hide-sm')}>{c.render ? c.render(r) : r[c.key]}</Cell>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Cədvəl xanası: mini irəliləyiş zolağı + dəyər. */
export function InlineBar({ value = 0, max = 100, tone = 1, label, showValue = true, format, lang }) {
  const f = useVizFormat(lang)
  const frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  return (
    <span className="vz-ibar">
      <span className="vz-ibar__track" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
        <span className="vz-ibar__fill" style={{ '--w': `${frac * 100}%`, '--c': vizColor(tone) }} />
      </span>
      {showValue && <span className="vz-ibar__val">{format ? format(value, max) : f.pct(frac * 100, 0)}</span>}
    </span>
  )
}

/** Cədvəl xanası: trend xətti (label — aria, məcburi). */
export function TrendCell({ values = [], label, tone = 1, width = 72, height = 22 }) {
  if (values.length < 2) return <span className="vz-trend vz-trend--none" aria-label={label}>—</span>
  return <span className="vz-trend"><MiniSpark values={values} tone={tone} label={label} width={width} height={height} /></span>
}
