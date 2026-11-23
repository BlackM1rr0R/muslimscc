// ═══════════════════════════════════════════════════════
// Həyat bələdçilərinin ortaq hissələri (körpə / vəfat / nikah səhifələri)
//
//   • useGuideSources — dərs fayllarını (src/data/lessons/<slug>.js, tənbəl chunk) və Hisnul-Müslimi
//     (public/data/hisn/<dil>.json) YALNIZ mount-dan sonra yükləyir: prerender = ilk render (boş).
//   • GuideEvidence — dərsin seçilmiş bloklarını saytın öz dərs renderi ilə (LessonBlocks) olduğu
//     kimi göstərir + bölməyə keçid; Hisn fəsillərini mətn + mənbə (localizeSource) ilə göstərir.
//     Burada heç bir dini mətn yazılmır — hamısı məlumatdandır.
//   • useGuideStore — utils/lifeGuides açarının vəziyyəti (mount-dan sonra oxunur, profil/storage dinlənir).
//   • GuideStep, ClearNotes — kart və "qeydlərimi sil" (daxili təsdiqlə).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { useLang } from '../../contexts/LangContext'
import LessonBlocks from '../lesson/LessonBlocks'
import { isPlainClick } from '../PageLink'
import { loadLesson } from '../../data/lessons/load'
import { pathFor } from '../../seo/routes'
import { pickUi } from '../../utils/uiText'
import { localizeSource } from '../../utils/sourceNames'
import { dayLabel } from '../../utils/dayLabel'
import { readGuide, writeGuide, setGuideStep, clearGuide, LIFE_GUIDE_EVENT } from '../../utils/lifeGuides'
import { LG, LESSON_LABEL } from './lifeGuideText'

const HISN_LANGS = new Set(['az', 'en', 'ru', 'ar', 'tr'])
const lessonCache = new Map()
const hisnCache = new Map()
function lessonOnce(slug) {
  if (!lessonCache.has(slug)) {
    const p = loadLesson(slug) || Promise.reject(new Error('no lesson'))
    p.catch(() => lessonCache.delete(slug))
    lessonCache.set(slug, p)
  }
  return lessonCache.get(slug)
}
function hisnOnce(lang) {
  const l = HISN_LANGS.has(lang) ? lang : 'en'
  if (!hisnCache.has(l)) {
    const p = fetch(`/data/hisn/${l}.json`).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    p.catch(() => hisnCache.delete(l))
    hisnCache.set(l, p)
  }
  return hisnCache.get(l)
}

/**
 * Dərslər + Hisn — mount-dan sonra.
 * → { lessons: { slug: { id: section } }, hisn: Map(id → fəsil) | null, failed: boolean }
 */
export function useGuideSources(slugs, lang, withHisn = false) {
  const [state, setState] = useState({ lessons: {}, hisn: null, failed: false })
  const key = slugs.join(',')
  useEffect(() => {
    let alive = true
    const list = key ? key.split(',') : []
    Promise.all(list.map((s) => lessonOnce(s).then((d) => [s, Object.fromEntries((d?.sections || []).map((x) => [x.id, x]))])))
      .then((pairs) => { if (alive) setState((st) => ({ ...st, lessons: Object.fromEntries(pairs) })) })
      .catch(() => { if (alive) setState((st) => ({ ...st, failed: true })) })
    if (withHisn) {
      hisnOnce(lang)
        .then((d) => { if (alive) setState((st) => ({ ...st, hisn: new Map((d?.chapters || []).map((c) => [c.id, c])) })) })
        .catch(() => { if (alive) setState((st) => ({ ...st, failed: true })) })
    }
    return () => { alive = false }
  }, [key, lang, withHisn])
  return state
}

/** Dərs bölməsinin ünvanı (LessonsPage bölmə id-si: ls-<id>) */
export const lessonHref = (slug, sec, lang) => `${pathFor('learn', lang, slug)}${sec ? `#ls-${sec}` : ''}`

export function SpaLink({ href, className, children }) {
  const navigate = useNavigate()
  return (
    <a className={className} href={href}
      onClick={(e) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href); window.scrollTo(0, 0) }}>
      {children}
    </a>
  )
}

/**
 * ex: [{ s: 'aqiqah', sec: 'tahnik', b: [0, 1] }] — dərs blokları (indekslər; tests/unit/life-guides.test.js yoxlayır)
 * hisn: [58] — Hisnul-Müslim fəsil id-ləri
 */
export function GuideEvidence({ ex = [], hisn = [], src, lang }) {
  const L = pickUi(LG, lang, 'en')
  // Ünvanlar saytın dilində (əlavə dildə də /<dil>/…), mətnlər interfeys dilində
  const { siteLang } = useLang()
  const hisnBase = pathFor('hisn', siteLang || lang)
  return (
    <>
      {ex.length > 0 && (
        <details className="lg-ev" data-testid="lg-lesson">
          <summary className="lg-ev__sum"><Icon name="learn" size={16} /> <span>{L.fromLesson}</span><Icon name="chevronDown" size={16} className="lg-ev__chev" /></summary>
          <div className="lg-ev__body">
            {ex.map((e) => {
              const sec = src.lessons[e.s]?.[e.sec]
              const blocks = sec ? e.b.map((i) => sec.blocks[i]).filter(Boolean) : null
              return (
                <div key={`${e.s}-${e.sec}`} className="lg-ev__part">
                  {blocks ? <LessonBlocks blocks={blocks} lang={lang} />
                    : <p className="lg-ev__wait">{src.failed ? L.loadError : L.loading}</p>}
                  <p className="lg-ev__more">
                    <SpaLink href={lessonHref(e.s, e.sec, siteLang || lang)} className="ui-link lg-ev__link">
                      {pickUi(LESSON_LABEL[e.s], lang, 'en')}{sec ? ` — ${pickUi(sec.title, lang, 'en')}` : ''}
                    </SpaLink>
                  </p>
                </div>
              )
            })}
          </div>
        </details>
      )}
      {hisn.length > 0 && (
        <details className="lg-ev" data-testid="lg-hisn">
          <summary className="lg-ev__sum"><Icon name="duas" size={16} /> <span>{L.fromHisn}</span><Icon name="chevronDown" size={16} className="lg-ev__chev" /></summary>
          <div className="lg-ev__body">
            {hisn.map((id) => {
              const ch = src.hisn?.get(id)
              return (
                <div key={id} className="lg-ev__part lg-hisn">
                  {ch ? (
                    <>
                      <p className="lg-hisn__title">{ch.title}</p>
                      {ch.items.map((it, i) => (
                        <figure key={i} className="ui-card ls-dua lg-hisn__item">
                          <p className="ls-dua__ar ui-arabic" lang="ar" dir="rtl">{it.ar}</p>
                          {lang !== 'ar' && it.text && <p className="ls-dua__text">{it.text}</p>}
                          {it.src && <figcaption className="ls-dua__src"><cite dir="auto">{localizeSource(it.src, lang)}</cite></figcaption>}
                        </figure>
                      ))}
                    </>
                  ) : <p className="lg-ev__wait">{src.failed ? L.loadError : L.loading}</p>}
                  <p className="lg-ev__more">
                    <SpaLink href={`${hisnBase}#hs-${id}`} className="ui-link lg-ev__link">{L.openHisn}{ch ? ` — ${ch.title}` : ''}</SpaLink>
                  </p>
                </div>
              )
            })}
          </div>
        </details>
      )}
    </>
  )
}

/** Keçid çipləri: [{ href, label, icon }] */
export function GuideLinks({ links }) {
  if (!links?.length) return null
  return (
    <ul className="lg-links">
      {links.map((l) => (
        <li key={l.href}>
          <SpaLink href={l.href} className="ui-chip lg-link"><Icon name={l.icon || 'arrow'} size={16} /> {l.label}</SpaLink>
        </li>
      ))}
    </ul>
  )
}

/** Yerli bələdçi qeydi: prerender ilə ilk render eyni olsun deyə mount-dan sonra oxunur */
export function useGuideStore(key) {
  const [data, setData] = useState(() => readGuide(key, null))
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const load = () => setData(readGuide(key))
    load()
    setReady(true)
    const onStorage = (e) => { if (!e.key || e.key === key || e.key.endsWith(`:${key}`)) load() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('mcc-profile', load)
    window.addEventListener(LIFE_GUIDE_EVENT, load)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('mcc-profile', load)
      window.removeEventListener(LIFE_GUIDE_EVENT, load)
    }
  }, [key])
  const toggle = useCallback((id, done) => setData(setGuideStep(key, id, done)), [key])
  const save = useCallback((v) => setData(writeGuide(key, v)), [key])
  const clear = useCallback(() => setData(clearGuide(key)), [key])
  return { data, ready, toggle, save, clear }
}

/**
 * Addım kartı. step: { id, icon, title, text, ex, hisn, links, check?: false }
 * checked / onToggle — işarələnən addımlar üçün (check === false olanda checkbox yoxdur).
 */
export function GuideStep({ step, idPrefix, lang, src, links, checkedOn, ready, onToggle, n, children }) {
  const L = pickUi(LG, lang, 'en')
  const on = Boolean(checkedOn)
  const canCheck = step.check !== false
  const cbId = `${idPrefix}-cb-${step.id}`
  return (
    <li id={`${idPrefix}-step-${step.id}`} className={`ui-step lg-step${on ? ' is-done' : ''}${canCheck ? '' : ' is-info'}`}>
      <span className="ui-step__n" aria-hidden="true">{on ? <Icon name="check" size={16} /> : canCheck ? n : <Icon name="info" size={16} />}</span>
      <div className="ui-step__body ui-card lg-step__card">
        <h3 className="ui-step__title lg-step__title" tabIndex={-1}>
          <Icon name={step.icon} size={18} /> {pickUi(step.title, lang, 'en')}
        </h3>
        {step.text && <p className="ui-step__text">{pickUi(step.text, lang, 'en')}</p>}
        {children}
        <GuideEvidence ex={step.ex} hisn={step.hisn} src={src} lang={lang} />
        <GuideLinks links={links} />
        {canCheck && (
          <label className="lg-check" htmlFor={cbId}>
            <input id={cbId} type="checkbox" checked={on} disabled={!ready} onChange={(e) => onToggle(step.id, e.target.checked)} />
            <span>{L.done}</span>
            {on && <span className="lg-check__on"> · {L.doneOn} <span className="ui-num">{dayLabel(checkedOn, lang)}</span></span>}
          </label>
        )}
      </div>
    </li>
  )
}

/** "Qeydlərimi sil" — daxili təsdiq (dialoq yox); təsdiqdən sonra fokus düyməyə qayıdır */
export function ClearNotes({ lang, onClear, disabled }) {
  const L = pickUi(LG, lang, 'en')
  const [ask, setAsk] = useState(false)
  const btn = useRef(null)
  const yes = useRef(null)
  const asked = useRef(false)
  // Təsdiq açılanda fokus "Bəli"-yə, bağlananda yenidən "Sil" düyməsinə
  useEffect(() => {
    if (ask) { asked.current = true; yes.current?.focus() }
    else if (asked.current) { asked.current = false; btn.current?.focus() }
  }, [ask])
  if (!ask) {
    return (
      <button ref={btn} type="button" className="ui-btn ui-btn--ghost ui-btn--sm lg-clear" disabled={disabled} onClick={() => setAsk(true)}>
        <Icon name="trash" size={16} className="ui-btn__icon" /> {L.clear}
      </button>
    )
  }
  return (
    <div className="lg-clear-ask" role="group" aria-label={L.clear}>
      <p>{L.clearAsk}</p>
      <button ref={yes} type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setAsk(false); onClear() }}>{L.clearYes}</button>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(false)}>{L.cancel}</button>
    </div>
  )
}
