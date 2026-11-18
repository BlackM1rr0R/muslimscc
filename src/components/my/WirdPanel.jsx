// ═══════════════════════════════════════════════════════
// H2 — "Mənim virdim": bugünkü siyahı (vaxta görə sıralı, halqa, seriya) + virdin qurucusu.
//   <WirdPanel />          — /dailytracker#wird və /account
//   <WirdChecklist compact /> — ana səhifənin kartı (components/my/HomeWird)
// Elementlər yalnız saytdakı mənbəli bölmələrə işarədir (utils/wird → WIRD_TYPES); bildiriş YOXDUR
// (saytın push sistemi vaxtı planlaşdırmır) — yalnız səhifədə.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'
import { localizeSource } from '../../utils/sourceNames'
import Icon from '../Icon'
import { ProgressRing } from '../viz'
import { WIRD_TYPES, ANCHORS, MAX_ITEMS, addItem, removeItem } from '../../utils/wird'
import { WIRD_TXT } from './wirdText'
import useWird from './useWird'
import '../../styles/My.css'

const TYPE_ORDER = ['quran', 'salawat', 'tasbih', 'morning', 'evening', 'sleep', 'mulk', 'sajdah']
// "Yatmazdan əvvəl" elementləri — yalnız o vaxta; səhər / axşam azkarı namaz vaxtlarına
const ANCHORS_FOR = (t) => (WIRD_TYPES[t].at === 'sleep' ? ['sleep', 'isha'] : t === 'morning' ? ['fajr', 'sunrise'] : t === 'evening' ? ['asr', 'maghrib'] : ANCHORS)

export function itemName(it, t) {
  if (it.t === 'quran') return t.tq(it.n)
  if (it.t === 'salawat') return t.tsalawat(it.n)
  return t[`t${it.t}`] || it.t
}
export function anchorName(at, t) {
  if (at === 'sleep') return t.sleep
  if (at === 'sunrise') return t.sunriseAfter
  return t.after(t.p[at] || at)
}
function sourceOf(it, t, lang) {
  const ty = WIRD_TYPES[it.t]
  if (ty.hisn) return t.hisn(ty.hisn)
  return ty.source ? localizeSource(ty.source, lang) : ''
}
const hrefOf = (it, lang) => {
  const ty = WIRD_TYPES[it.t]
  return pathFor(ty.page, lang, ty.param) + (ty.hash || '')
}
const hhmm = (min) => { const m = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }

export function WirdChecklist({ state, compact = false }) {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(WIRD_TXT, lang, 'en')
  const navigate = useNavigate()
  const { schedule, prog, streak, toggle } = state
  const [msg, setMsg] = useState('')
  const go = (href) => (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
    if (!href.includes('#')) window.scrollTo(0, 0)
  }
  const complete = prog.total > 0 && prog.done === prog.total
  return (
    <div className={`my-wird__today${compact ? ' my-wird__today--compact' : ''}`} data-testid="wird-today" data-done={prog.done} data-total={prog.total}>
      <div className="my-wird__head">
        <ProgressRing value={prog.done} max={prog.total || 1} size={compact ? 56 : 72} thickness={7} label={t.today} />
        <div>
          <p className="my-wird__of ui-num" data-testid="wird-progress">{t.of(prog.done, prog.total)}</p>
          <p className="my-wird__streak ui-num" data-testid="wird-streak"><Icon name="star" size={14} /> {t.streak(streak)}</p>
        </div>
      </div>
      {complete && <p className="my-wird__alldone"><Icon name="check" size={16} /> {t.allDone}</p>}
      <ul className="my-wird__list">
        {schedule.map((it) => {
          const name = itemName(it, t)
          const id = `wird-${it.id}`
          const href = hrefOf(it, siteLang)
          return (
            <li key={it.id} className={`my-wird__item${it.done ? ' is-done' : ''}${it.due && !it.done ? ' is-due' : ''}`} data-testid="wird-item" data-id={it.id}>
              <input id={id} type="checkbox" checked={it.done}
                onChange={(e) => { toggle(it.id, e.target.checked); setMsg((e.target.checked ? t.done : t.undone)(name)) }} />
              <label htmlFor={id} className="my-wird__lbl">
                <span className="my-wird__name">{name}</span>
                <span className="my-wird__sub ui-num">
                  <span>{anchorName(it.at, t)} · {hhmm(it.min)}</span>
                  {!it.done && <span className="my-wird__state">{it.due ? t.due : t.upcoming}</span>}
                  {!compact && sourceOf(it, t, lang) && <span className="my-wird__src">{t.srcLabel}: {sourceOf(it, t, lang)}</span>}
                </span>
              </label>
              <a className="ui-btn ui-btn--ghost ui-btn--sm my-wird__open" href={href} onClick={go(href)} aria-label={`${t.open}: ${name}`}>
                <Icon name={WIRD_TYPES[it.t].icon} className="ui-btn__icon" /> <span className="my-wird__open-t">{t.open}</span>
              </a>
            </li>
          )
        })}
      </ul>
      <p className="ui-sr-only" role="status" aria-live="polite">{msg ? `${msg}. ${t.of(prog.done, prog.total)}` : ''}</p>
    </div>
  )
}

function Builder({ state, t }) {
  const { w, update } = state
  const [type, setType] = useState('quran')
  const ty = WIRD_TYPES[type]
  const [n, setN] = useState(String(ty.n?.[2] ?? ''))
  const [at, setAt] = useState(ty.at)
  const full = w.items.length >= MAX_ITEMS
  const pickType = (v) => { setType(v); const nt = WIRD_TYPES[v]; setN(String(nt.n?.[2] ?? '')); setAt(nt.at) }
  const add = (e) => {
    e.preventDefault()
    update((cur) => addItem(cur, { t: type, n: ty.n ? Number(n) : undefined, at }))
  }
  const starter = () => update((cur) => ['morning', 'evening', 'mulk'].reduce((acc, x) => addItem(acc, { t: x }), addItem(cur, { t: 'quran', n: 2, at: 'fajr' })))
  return (
    <div className="my-wird__build">
      <h3 className="my-wird__h">{t.build}</h3>
      {!w.items.length && (
        <div className="my-wird__empty">
          <p>{t.empty}</p>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={starter} data-testid="wird-starter"><Icon name="sparkle" className="ui-btn__icon" /> {t.starter}</button>
        </div>
      )}
      {w.items.length > 0 && (
        <ul className="my-wird__mine">
          {w.items.map((it) => (
            <li key={it.id}>
              <span>{itemName(it, t)} <small>· {anchorName(it.at, t)}</small></span>
              <button type="button" className="ui-icon-btn" onClick={() => update((cur) => removeItem(cur, it.id))} aria-label={`${t.remove}: ${itemName(it, t)}`} title={t.remove}>
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="my-wird__form" onSubmit={add} data-testid="wird-form">
        <label className="ui-field">
          <span className="ui-field__label">{t.type}</span>
          <select className="ui-select" value={type} onChange={(e) => pickType(e.target.value)} data-testid="wird-type">
            {TYPE_ORDER.map((k) => <option key={k} value={k}>{t[`o${k === 'quran' ? 'q' : k}`]}</option>)}
          </select>
        </label>
        {ty.n && (
          <label className="ui-field">
            <span className="ui-field__label">{t.count} ({type === 'quran' ? t.pages : t.times})</span>
            <input className="ui-input ui-num" type="number" inputMode="numeric" min={ty.n[0]} max={ty.n[1]} value={n} onChange={(e) => setN(e.target.value)} required data-testid="wird-count" />
          </label>
        )}
        <label className="ui-field">
          <span className="ui-field__label">{t.when}</span>
          <select className="ui-select" value={at} onChange={(e) => setAt(e.target.value)} data-testid="wird-at">
            {ANCHORS_FOR(type).map((a) => <option key={a} value={a}>{anchorName(a, t)}</option>)}
          </select>
        </label>
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={full} data-testid="wird-add"><Icon name="plus" className="ui-btn__icon" /> {t.add}</button>
      </form>
      {full && <p className="my-wird__note">{t.full}</p>}
    </div>
  )
}

export default function WirdPanel({ heading = true }) {
  const { lang } = useLang()
  const t = pickUi(WIRD_TXT, lang, 'en')
  const state = useWird()
  // /dailytracker#wird (ana səhifənin kartından) — bölmə tənbəl yükləndiyi üçün sürüşdürmə buradadır
  useEffect(() => {
    if (window.location.hash !== '#wird') return
    const id = requestAnimationFrame(() => document.getElementById('wird')?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div className="my-wird" data-testid="wird-panel">
      {heading && (
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 className="ui-title ui-title--sm" id="wird-ttl">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
      )}
      <div className="my-wird__grid">
        {state.w.items.length > 0 && <div className="ui-card my-wird__card"><WirdChecklist state={state} /></div>}
        <div className="ui-card my-wird__card"><Builder state={state} t={t} /></div>
      </div>
      <p className="my-wird__note"><Icon name="info" size={14} /> {t.note} {t.calcNote}</p>
    </div>
  )
}
