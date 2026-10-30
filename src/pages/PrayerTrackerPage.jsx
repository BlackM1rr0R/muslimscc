import { useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import usePrayerTracker from '../hooks/usePrayerTracker'
import {
  PRAYERS, prayerStatus, dayState, computeStreak, bestStreak, rangeSummary, lastNDays,
  monthDays, fromKey, daysBetween, estimateMissedDays, qadaTotals, ramadanDaysIn,
  excusedPeriod, isDateKey,
} from '../utils/prayerTracker'
import { TRACKER_TEXT, PRAYER_NAMES, WEEKDAYS_SUN, fill, formatDay, formatMonth } from '../data/prayerTrackerText'
import '../styles/PrayerTrackerPage.css'

// ═══════════════════════════════════════════════════════
// /prayer-tracker — Namaz izləyicisi
//
// NİYƏ AYRICA SƏHİFƏ (/dailytracker genişlənmədi): /dailytracker 10 əməlin
// ikili (✓/—) siyahısıdır; burada isə yalnız 5 fərz, üç vəziyyət (qıldım /
// qəza / qılmadım), keçmiş günlərin düzəlişi, təqvim, qəza sayğacı və heyz
// qeydi var — bir səhifədə hamısı qarışardı. MƏLUMAT isə ortaqdır: hər iki
// səhifə və /prayer eyni açarları oxuyur (utils/prayerTracker.js) — dublikat
// sistem yoxdur. Hər şey yalnız bu cihazda (localStorage) qalır.
// ═══════════════════════════════════════════════════════

const PRAYER_ICONS = { fajr: 'sunrise', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }
const STATUS_BTNS = ['prayed', 'qada', 'missed']

export default function PrayerTrackerPage({ setPage }) {
  const { lang } = useLang()
  const lk = TRACKER_TEXT[lang] ? lang : 'en'
  const t = TRACKER_TEXT[lk]
  const names = PRAYER_NAMES[lk]
  const { snap, qada, hayd, today, setStatus, setQada, setHayd } = usePrayerTracker()
  const periods = hayd.periods

  // Redaktə olunan gün (təqvimdən keçmiş gün seçilə bilər)
  const [selected, setSelected] = useState(null)
  const day = selected && selected <= today ? selected : today

  const streak = useMemo(() => computeStreak(snap, periods, today), [snap, periods, today])
  const best = useMemo(() => bestStreak(snap, periods, today), [snap, periods, today])
  const week = useMemo(() => lastNDays(today, 7), [today])
  const weekSum = useMemo(() => rangeSummary(snap, periods, week, today), [snap, periods, week, today])

  return (
    <div className="pt-root">
      <header className="ui-page-hero pt-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {lang !== 'ar' && <p className="pt-hero-ar ui-arabic" lang="ar" aria-hidden="true">مُتَابَعَةُ الصَّلَاة</p>}
          <p className="ui-lead">{t.lead}</p>
        </div>
      </header>

      <section className="ui-section pt-main">
        <div className="ui-container pt-layout">
          <DayCard t={t} names={names} lang={lk} snap={snap} periods={periods} day={day} today={today}
            setStatus={setStatus} setQada={setQada} onBack={() => setSelected(null)} />

          <div className="pt-stats ui-card" data-reveal>
            <Stat icon="bolt" value={streak} label={t.streak} testId="pt-streak" />
            <Stat icon="star" value={best} label={t.best} />
            <Stat icon="check" value={`${weekSum.pct}%`} label={t.week} />
            <p className="pt-stats-hint">{t.streakHint}</p>
          </div>

          <WeekReport t={t} lang={lk} snap={snap} periods={periods} week={week} today={today} sum={weekSum} />

          <MonthReport t={t} lang={lk} snap={snap} periods={periods} today={today}
            selected={day} onPick={(d) => { haptic(); setSelected(d === today ? null : d) }} />

          <QadaCounter t={t} names={names} qada={qada} setQada={setQada} />

          {hayd.enabled && (
            <HaydLog t={t} lang={lk} hayd={hayd} setHayd={setHayd} setQada={setQada} today={today} />
          )}

          <div className="pt-settings ui-card" data-reveal>
            <h2 className="pt-card-title">{t.settingsTitle}</h2>
            <button type="button" className={`pt-switch${hayd.enabled ? ' is-on' : ''}`} role="switch" aria-checked={hayd.enabled}
              onClick={() => { haptic(); setHayd(h => ({ ...h, enabled: !h.enabled })) }}>
              <span className="pt-switch-text">
                <span className="pt-switch-label">{t.haydToggle}</span>
                <span className="pt-switch-sub">{t.haydToggleSub}</span>
              </span>
              <span className="pt-switch-track" aria-hidden="true"><span className="pt-switch-knob" /></span>
            </button>
            <div className="pt-notif-hint">
              <Icon name="bell" size={18} />
              <span>{t.notifHint}</span>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm"
                onClick={() => window.dispatchEvent(new CustomEvent('open-notifications'))}>{t.openNotif}</button>
            </div>
            <p className="pt-note"><Icon name="shield" size={15} /> {t.dataNote}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function Stat({ icon, value, label, testId }) {
  return (
    <div className="pt-stat">
      <span className="pt-stat-ic" aria-hidden="true"><Icon name={icon} size={18} /></span>
      <span className="pt-stat-val ui-num" data-testid={testId}>{value}</span>
      <span className="pt-stat-label">{label}</span>
    </div>
  )
}

// ── Günün 5 namazı: Qıldım / Qəza / Qılmadım ──
function DayCard({ t, names, lang, snap, periods, day, today, setStatus, setQada, onBack }) {
  const ds = dayState(snap, periods, day, today)
  const isToday = day === today
  // "Qılmadım"dan sonra bir dəfəlik "+1 qəza" təklifi (bu açılış üçün)
  const [debtAdded, setDebtAdded] = useState({})

  const pick = (p, s) => {
    haptic()
    const cur = prayerStatus(snap, day, p)
    setStatus(day, p, cur === s ? null : s)
  }
  const addDebt = (p) => {
    setQada(q => ({ ...q, prayers: { ...q.prayers, [p]: { ...q.prayers[p], debt: q.prayers[p].debt + 1 } } }))
    setDebtAdded(a => ({ ...a, [`${day}|${p}`]: true }))
  }

  return (
    <div className={`pt-day ui-card${ds.state === 'complete' ? ' is-complete' : ''}`} data-reveal>
      <div className="pt-day-head">
        <div>
          <h2 className="pt-card-title">{isToday ? t.today : formatDay(day, lang, { weekday: true })}</h2>
          {isToday && <span className="pt-day-date">{formatDay(day, lang)}</span>}
        </div>
        <div className="pt-day-head-r">
          {ds.state !== 'excused' && (
            <span className="ui-badge ui-badge--brand ui-num" data-testid="pt-day-count">{fill(t.countDone, { n: ds.performed })}</span>
          )}
          {!isToday && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={onBack}>{t.backToday}</button>}
        </div>
      </div>

      {ds.state === 'excused' ? (
        <p className="pt-excused" data-testid="pt-excused">
          <Icon name="moon" size={18} /> {ds.type === 'nifas' ? t.exNifas : t.exHayd}
        </p>
      ) : (
        <ul className="pt-prayers">
          {PRAYERS.map(p => {
            const s = ds.statuses[p]
            return (
              <li key={p} className={`pt-prayer${s ? ` is-${s}` : ''}`}>
                <span className="pt-prayer-name">
                  <span className="pt-prayer-ic" aria-hidden="true"><Icon name={PRAYER_ICONS[p]} size={18} /></span>
                  {names[p]}
                </span>
                <span className="pt-seg" role="group" aria-label={fill(t.statusGroup, { p: names[p] })}>
                  {STATUS_BTNS.map(b => (
                    <button key={b} type="button" className={`pt-seg-btn pt-seg-btn--${b}`} aria-pressed={s === b}
                      onClick={() => pick(p, b)}>
                      {b === 'prayed' && <Icon name="check" size={15} strokeWidth={2.2} />}
                      {t[b]}
                    </button>
                  ))}
                </span>
                {s === 'missed' && (
                  debtAdded[`${day}|${p}`]
                    ? <span className="pt-debt-added" role="status">{t.debtAdded}</span>
                    : <button type="button" className="pt-debt-btn ui-link" onClick={() => addDebt(p)}>{t.addDebt}</button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <p className="pt-day-msg" aria-live="polite">{ds.state === 'complete' && isToday ? t.allDone : ''}</p>
    </div>
  )
}

// ── Həftəlik hesabat: yığılmış sütun qrafiki (öz SVG) ──
function WeekReport({ t, lang, snap, periods, week, today, sum }) {
  const W = 350, H = 176, top = 22, base = 142, unit = (base - top) / 5, bw = 24
  const days = week.map(d => ({ d, s: dayState(snap, periods, d, today) }))
  const aria = days.map(({ d, s }) => s.state === 'excused'
    ? fill(t.dayAriaEx, { d: formatDay(d, lang) })
    : fill(t.dayAria, { d: formatDay(d, lang), n: s.performed })).join('; ')
  return (
    <div className="pt-week ui-card" data-reveal>
      <h2 className="pt-card-title">{t.weekTitle}</h2>
      <svg className="pt-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${t.weekTitle}: ${aria}`}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line key={i} className="pt-grid" x1="8" x2={W - 8} y1={base - i * unit} y2={base - i * unit} />
        ))}
        {days.map(({ d, s }, i) => {
          const cx = 25 + i * 50
          const x = cx - bw / 2
          const isToday = d === today
          const wd = WEEKDAYS_SUN[lang][fromKey(d).getDay()]
          let y = base
          const seg = (n, cls) => {
            if (!n) return null
            const h = n * unit
            y -= h
            return <rect key={cls} className={`pt-bar pt-bar--${cls}`} x={x} y={y} width={bw} height={h} rx="3" />
          }
          return (
            <g key={d}>
              <rect className="pt-bar-track" x={x} y={top} width={bw} height={base - top} rx="4" />
              {s.state === 'excused'
                ? <rect className="pt-bar pt-bar--excused" x={x} y={top} width={bw} height={base - top} rx="4" />
                : <>{seg(s.prayed, 'prayed')}{seg(s.qada, 'qada')}{seg(s.missed, 'missed')}</>}
              <text className={`pt-chart-num${isToday ? ' is-today' : ''}`} x={cx} y={top - 7} textAnchor="middle">
                {s.state === 'excused' ? '·' : s.performed}
              </text>
              <text className={`pt-chart-day${isToday ? ' is-today' : ''}`} x={cx} y={base + 16} textAnchor="middle">{wd}</text>
              <text className="pt-chart-date" x={cx} y={base + 30} textAnchor="middle">{Number(d.slice(8))}</text>
            </g>
          )
        })}
      </svg>
      <Legend t={t} />
      <SummaryRow t={t} sum={sum} />
    </div>
  )
}

function Legend({ t }) {
  return (
    <ul className="pt-legend">
      <li><span className="pt-dot pt-dot--prayed" />{t.lgPrayed}</li>
      <li><span className="pt-dot pt-dot--qada" />{t.lgQada}</li>
      <li><span className="pt-dot pt-dot--missed" />{t.lgMissed}</li>
      <li><span className="pt-dot pt-dot--excused" />{t.lgExcused}</li>
    </ul>
  )
}

function SummaryRow({ t, sum }) {
  return (
    <dl className="pt-sum">
      <div><dt>{t.lgPrayed}</dt><dd className="ui-num">{sum.prayed}</dd></div>
      <div><dt>{t.lgQada}</dt><dd className="ui-num">{sum.qada}</dd></div>
      <div><dt>{t.lgMissed}</dt><dd className="ui-num">{sum.missed}</dd></div>
      <div><dt>{t.lgUnmarked}</dt><dd className="ui-num">{sum.unmarked}</dd></div>
      <div><dt>{t.completeDays}</dt><dd className="ui-num">{sum.completeDays}</dd></div>
    </dl>
  )
}

// ── Aylıq hesabat: təqvim şəbəkəsi (gün → 5 nöqtə) + yığılmış zolaq ──
function MonthReport({ t, lang, snap, periods, today, selected, onPick }) {
  const now = fromKey(today)
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const dates = useMemo(() => monthDays(ym.y, ym.m), [ym])
  const sum = useMemo(() => rangeSummary(snap, periods, dates, today), [snap, periods, dates, today])
  const isCurrent = ym.y === now.getFullYear() && ym.m === now.getMonth()
  // Həftə bazar ertəsindən: boş xanalar
  const lead = (fromKey(dates[0]).getDay() + 6) % 7
  const wdMon = [1, 2, 3, 4, 5, 6, 0].map(i => WEEKDAYS_SUN[lang][i])
  const shift = (n) => setYm(({ y, m }) => {
    const d = new Date(y, m + n, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const total = Math.max(1, sum.possible)
  const segs = [['prayed', sum.prayed], ['qada', sum.qada], ['missed', sum.missed]]
  let acc = 0

  return (
    <div className="pt-month ui-card" data-reveal>
      <div className="pt-month-head">
        <h2 className="pt-card-title">{t.monthTitle}</h2>
        <div className="pt-month-nav">
          <button type="button" className="ui-icon-btn" aria-label={t.prevMonth} onClick={() => shift(-1)}>
            <Icon name="chevronLeft" size={18} className="ui-flip-rtl" />
          </button>
          <span className="pt-month-name" aria-live="polite">{formatMonth(ym.y, ym.m, lang)}</span>
          <button type="button" className="ui-icon-btn" aria-label={t.nextMonth} onClick={() => shift(1)} disabled={isCurrent}>
            <Icon name="chevron" size={18} className="ui-flip-rtl" />
          </button>
        </div>
      </div>

      <div className="pt-cal" role="group" aria-label={`${t.monthTitle} — ${t.pickDay}`}>
        <div className="pt-cal-row pt-cal-wd" aria-hidden="true">
          {wdMon.map((w, i) => <span key={i}>{w}</span>)}
        </div>
        <div className="pt-cal-grid">
          {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} className="pt-cal-empty" aria-hidden="true" />)}
          {dates.map(d => {
            const future = d > today
            const s = future ? null : dayState(snap, periods, d, today)
            const label = !s ? formatDay(d, lang)
              : s.state === 'excused' ? fill(t.dayAriaEx, { d: formatDay(d, lang) })
              : fill(t.dayAria, { d: formatDay(d, lang), n: s.performed })
            return (
              <button key={d} type="button" disabled={future}
                className={`pt-cal-day${s ? ` is-${s.state}` : ''}${d === today ? ' is-today' : ''}${d === selected ? ' is-selected' : ''}`}
                aria-label={label} aria-pressed={d === selected} data-date={d}
                onClick={() => onPick(d)}>
                <span className="pt-cal-num ui-num">{Number(d.slice(8))}</span>
                {s && s.state !== 'excused' && (
                  <span className="pt-cal-dots" aria-hidden="true">
                    {PRAYERS.map(p => <span key={p} className={`pt-dot pt-dot--sm pt-dot--${s.statuses[p] || 'none'}`} />)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <svg className="pt-month-bar" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true">
        <rect className="pt-bar-track" x="0" y="0" width="300" height="12" rx="6" />
        {segs.map(([k, n]) => {
          if (!n) return null
          const w = (n / total) * 300
          const r = <rect key={k} className={`pt-bar pt-bar--${k}`} x={acc} y="0" width={w} height="12" />
          acc += w
          return r
        })}
      </svg>
      <p className="pt-month-pct"><span className="ui-num">{sum.pct}%</span> {isCurrent ? t.month : formatMonth(ym.y, ym.m, lang)}</p>
      <SummaryRow t={t} sum={sum} />
      <p className="pt-note">{t.pickDay}</p>
    </div>
  )
}

// ── Qəza sayğacı ──
function QadaCounter({ t, names, qada, setQada }) {
  const totals = qadaTotals(qada)
  const [bulk, setBulk] = useState({ years: '', months: '', days: '' })
  const [proposal, setProposal] = useState(null)   // { n, which: Set }

  const change = (p, dDebt, dDone = 0) => {
    haptic()
    setQada(q => {
      const cur = q.prayers[p]
      if (dDebt < 0 && cur.debt <= 0) return q
      return { ...q, prayers: { ...q.prayers, [p]: { debt: Math.max(0, cur.debt + dDebt), done: Math.max(0, cur.done + dDone) } } }
    })
  }
  const changeFast = (dDebt, dDone = 0) => {
    haptic()
    setQada(q => {
      if (dDebt < 0 && q.fasts.debt <= 0) return q
      return { ...q, fasts: { debt: Math.max(0, q.fasts.debt + dDebt), done: Math.max(0, q.fasts.done + dDone) } }
    })
  }
  const calc = () => {
    const n = estimateMissedDays({ years: bulk.years, months: bulk.months, days: bulk.days })
    setProposal(n ? { n, which: [...PRAYERS] } : null)
  }
  const confirmBulk = () => {
    const n = Math.max(0, Math.floor(Number(proposal.n)) || 0)
    if (n) {
      setQada(q => {
        const prayers = { ...q.prayers }
        for (const p of proposal.which) prayers[p] = { ...prayers[p], debt: prayers[p].debt + n }
        return { ...q, prayers }
      })
    }
    setProposal(null)
    setBulk({ years: '', months: '', days: '' })
  }
  const reset = () => {
    if (!window.confirm(t.resetConfirm)) return
    setQada({})
  }

  return (
    <div className="pt-qada ui-card" data-reveal id="qada">
      <h2 className="pt-card-title"><Icon name="refresh" size={18} /> {t.qadaTitle}</h2>
      <p className="pt-card-lead">{t.qadaLead}</p>

      <ul className="pt-qada-list">
        {PRAYERS.map(p => {
          const x = qada.prayers[p]
          return (
            <li key={p} className="pt-qada-row" data-prayer={p}>
              <span className="pt-qada-name">{names[p]}</span>
              <span className="pt-qada-stepper">
                <button type="button" className="ui-icon-btn" aria-label={fill(t.dec, { p: names[p] })}
                  onClick={() => change(p, -1)} disabled={!x.debt}><Icon name="minus" size={16} /></button>
                <span className="pt-qada-num ui-num" data-testid={`qada-${p}`}>{x.debt}</span>
                <button type="button" className="ui-icon-btn" aria-label={fill(t.inc, { p: names[p] })}
                  onClick={() => change(p, 1)}><Icon name="plus" size={16} /></button>
              </span>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm pt-qada-done" disabled={!x.debt}
                onClick={() => change(p, -1, 1)}>
                <Icon name="check" className="ui-btn__icon" /> {t.qadaPrayed}
              </button>
            </li>
          )
        })}
        <li className="pt-qada-row pt-qada-row--fast">
          <span className="pt-qada-name">{t.fastTitle}</span>
          <span className="pt-qada-stepper">
            <button type="button" className="ui-icon-btn" aria-label={fill(t.dec, { p: t.fastTitle })}
              onClick={() => changeFast(-1)} disabled={!qada.fasts.debt}><Icon name="minus" size={16} /></button>
            <span className="pt-qada-num ui-num" data-testid="qada-fasts">{qada.fasts.debt}</span>
            <button type="button" className="ui-icon-btn" aria-label={fill(t.inc, { p: t.fastTitle })}
              onClick={() => changeFast(1)}><Icon name="plus" size={16} /></button>
          </span>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm pt-qada-done" disabled={!qada.fasts.debt}
            onClick={() => changeFast(-1, 1)}>
            <Icon name="check" className="ui-btn__icon" /> {t.fastDone}
          </button>
        </li>
      </ul>

      <div className="pt-qada-progress">
        <div className="pt-qada-progress-head">
          <span>{t.progress}</span>
          <span className="ui-num">{totals.pct}%</span>
        </div>
        <span className="pt-progress" aria-hidden="true"><span style={{ transform: `scaleX(${totals.pct / 100})` }} /></span>
        <div className="pt-qada-progress-foot">
          <span>{fill(t.doneTotal, { n: totals.done })}</span>
          <span>{fill(t.remaining, { n: totals.debt })}</span>
        </div>
      </div>

      <details className="pt-bulk">
        <summary>{t.bulkTitle}</summary>
        <p className="pt-note">{t.bulkHint}</p>
        <div className="pt-bulk-fields">
          {['years', 'months', 'days'].map(k => (
            <label key={k} className="ui-field">
              <span className="ui-field__label">{t[k]}</span>
              <input className="ui-input" type="number" inputMode="numeric" min="0" value={bulk[k]}
                onChange={e => { setBulk(b => ({ ...b, [k]: e.target.value })); setProposal(null) }} />
            </label>
          ))}
          <button type="button" className="ui-btn ui-btn--secondary" onClick={calc}>{t.calc}</button>
        </div>
        {proposal && (
          <div className="pt-proposal" role="region" aria-label={t.bulkTitle}>
            <p>{fill(t.bulkResult, { n: proposal.n, t: proposal.n * proposal.which.length })}</p>
            <p className="pt-note">{t.bulkNote}</p>
            <label className="ui-field pt-proposal-n">
              <span className="ui-field__label">{t.perPrayer}</span>
              <input className="ui-input" type="number" min="0" value={proposal.n}
                onChange={e => setProposal(pr => ({ ...pr, n: e.target.value }))} />
            </label>
            <div className="pt-proposal-which" role="group" aria-label={t.perPrayer}>
              {PRAYERS.map(p => {
                const on = proposal.which.includes(p)
                return (
                  <button key={p} type="button" className="ui-chip" aria-pressed={on}
                    onClick={() => setProposal(pr => ({ ...pr, which: on ? pr.which.filter(x => x !== p) : [...pr.which, p] }))}>
                    {names[p]}
                  </button>
                )
              })}
            </div>
            <div className="pt-actions">
              <button type="button" className="ui-btn ui-btn--primary" onClick={confirmBulk} disabled={!proposal.which.length}>{t.confirmAdd}</button>
              <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setProposal(null)}>{t.cancel}</button>
            </div>
          </div>
        )}
      </details>

      <div className="pt-rulings">
        <h3 className="pt-rulings-title">{t.rulingsTitle}</h3>
        <p>{t.ruleForgot} <cite className="pt-src">— {t.ruleForgotSrc}</cite></p>
        <p className="pt-ask"><Icon name="info" size={15} /> {t.ruleOther}</p>
      </div>

      {(totals.debt > 0 || totals.done > 0 || qada.fasts.debt > 0 || qada.fasts.done > 0) && (
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm pt-reset" onClick={reset}>
          <Icon name="refresh" className="ui-btn__icon" /> {t.resetQada}
        </button>
      )}
    </div>
  )
}

// ── Heyz / nifas qeydi (yalnız cihazda) ──
function HaydLog({ t, lang, hayd, setHayd, setQada, today }) {
  const active = hayd.periods.find(p => !p.end) || null
  const [type, setType] = useState('hayd')
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(today)
  const [offerN, setOfferN] = useState({})

  const typeName = (x) => (x === 'nifas' ? t.typeNifas : t.typeHayd)
  const startPeriod = () => {
    if (!isDateKey(start) || start > today) return
    haptic()
    setHayd(h => ({ ...h, periods: [{ id: `${start}-${Date.now().toString(36)}`, type, start, end: null }, ...h.periods] }))
  }
  const endPeriod = () => {
    if (!active || !isDateKey(end)) return
    haptic()
    const e = end < active.start ? active.start : end > today ? today : end
    setHayd(h => ({ ...h, periods: h.periods.map(p => (p.id === active.id ? { ...p, end: e } : p)) }))
  }
  const remove = (id) => {
    if (!window.confirm(t.delConfirm)) return
    setHayd(h => ({ ...h, periods: h.periods.filter(p => p.id !== id), handled: h.handled.filter(x => x !== id) }))
  }
  const clearAll = () => {
    if (!window.confirm(t.clearConfirm)) return
    setHayd(h => ({ ...h, periods: [], handled: [] }))
  }

  // Bitmiş dövrlər üçün Ramazan orucu təklifi (istifadəçi təsdiqi ilə)
  const offers = hayd.periods
    .filter(p => p.end && !hayd.handled.includes(p.id))
    .map(p => ({ p, days: ramadanDaysIn(p, today).length }))
    .filter(o => o.days > 0)
  const handle = (id, add) => {
    if (add > 0) setQada(q => ({ ...q, fasts: { ...q.fasts, debt: q.fasts.debt + add } }))
    setHayd(h => ({ ...h, handled: [...h.handled, id] }))
  }
  const excusedToday = excusedPeriod(hayd.periods, today, today)

  return (
    <div className="pt-hayd ui-card" data-reveal id="hayd">
      <h2 className="pt-card-title"><Icon name="moon" size={18} /> {t.haydTitle}</h2>
      <p className="pt-privacy" role="note"><Icon name="shield" size={16} /> {t.privacy}</p>

      {active ? (
        <div className="pt-hayd-active">
          <p><strong>{fill(t.active, { type: typeName(active.type), d: formatDay(active.start, lang) })}</strong>
            {' · '}{fill(t.daysN, { n: daysBetween(active.start, today) + 1 })}</p>
          <div className="pt-hayd-form">
            <label className="ui-field">
              <span className="ui-field__label">{t.endLabel}</span>
              <input className="ui-input" type="date" value={end} min={active.start} max={today} onChange={e => setEnd(e.target.value)} />
            </label>
            <button type="button" className="ui-btn ui-btn--primary" onClick={endPeriod}>{t.endBtn}</button>
          </div>
        </div>
      ) : (
        <div className="pt-hayd-form">
          <div className="ui-field">
            <span className="ui-field__label" id="pt-hayd-type">{t.typeLabel}</span>
            <div className="pt-type" role="group" aria-labelledby="pt-hayd-type">
              {['hayd', 'nifas'].map(x => (
                <button key={x} type="button" className="ui-chip" aria-pressed={type === x} onClick={() => setType(x)}>{typeName(x)}</button>
              ))}
            </div>
          </div>
          <label className="ui-field">
            <span className="ui-field__label">{t.startLabel}</span>
            <input className="ui-input" type="date" value={start} max={today} onChange={e => setStart(e.target.value)} />
          </label>
          <button type="button" className="ui-btn ui-btn--primary" onClick={startPeriod}>{t.startBtn}</button>
        </div>
      )}
      {excusedToday && <span className="ui-badge" data-testid="pt-hayd-today">{excusedToday.type === 'nifas' ? t.exNifas : t.exHayd}</span>}

      {offers.map(({ p, days }) => {
        const n = offerN[p.id] ?? days
        return (
          <div key={p.id} className="pt-offer" role="region" aria-label={t.fastTitle}>
            <p>{fill(t.ramadanOffer, { n: days })}</p>
            <p className="pt-note">{t.ramadanNote}</p>
            <div className="pt-actions">
              <input className="ui-input pt-offer-n" type="number" min="0" max="30" value={n} aria-label={t.fastTitle}
                onChange={e => setOfferN(o => ({ ...o, [p.id]: e.target.value }))} />
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => handle(p.id, Math.max(0, Math.floor(Number(n)) || 0))}>{t.addFasts}</button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => handle(p.id, 0)}>{t.skip}</button>
            </div>
          </div>
        )
      })}

      <h3 className="pt-sub-title">{t.history}</h3>
      {hayd.periods.length === 0 ? <p className="pt-note">{t.none}</p> : (
        <ul className="pt-hayd-list">
          {hayd.periods.slice(0, 24).map(p => (
            <li key={p.id}>
              <span className="pt-hayd-type">{typeName(p.type)}</span>
              <span className="pt-hayd-range">
                {formatDay(p.start, lang)} – {p.end ? formatDay(p.end, lang) : t.ongoing}
                {' · '}{fill(t.daysN, { n: daysBetween(p.start, p.end || today) + 1 })}
              </span>
              <button type="button" className="ui-icon-btn" aria-label={`${t.del}: ${formatDay(p.start, lang)}`} onClick={() => remove(p.id)}>
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-rulings">
        <h3 className="pt-rulings-title">{t.rulingsTitle}</h3>
        <p>{t.haydRule} <cite className="pt-src">— {t.haydRuleSrc}</cite></p>
        <p>{t.nifasRule} <cite className="pt-src">— {t.nifasRuleSrc}</cite></p>
        <p className="pt-ask"><Icon name="info" size={15} /> {t.askImam}</p>
      </div>

      {hayd.periods.length > 0 && (
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm pt-reset" onClick={clearAll}>
          <Icon name="trash" className="ui-btn__icon" /> {t.clearAll}
        </button>
      )}
    </div>
  )
}
