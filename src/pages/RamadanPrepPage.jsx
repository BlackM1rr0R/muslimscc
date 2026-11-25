// ═══════════════════════════════════════════════════════
// /road-to-ramadan — "Ramazana hazırlıq yolu" və /last-ten-nights — "Son 10 gecə" (bir səhifə, iki görünüş)
//
// • Tarix: utils/ramadanPrep → utils/ramadanRange (Ümmül-Qura); Ramazanın başlanğıcı əl ilə yazılmır.
//   Hər il işləyir: Ramazan bitəndə yol növbəti Ramazana qurulur.
// • Yol: Ramazandan ROAD_DAYS gün əvvəl açılır, hər günə bir kiçik addım (keçid saytın mövcud alətinə:
//   qəza izləyicisi, xətm, sədəqə, yatma ardıcıllığı, Ramazan bələdçisinin bölmələri …).
// • Son 10 gecə: gecə-gecə siyahı (qiyam, Quran, dua, sədəqə, istiğfar), tək gecələr vurğulanır;
//   ilin qalan vaxtı — önizləmə (işarələmək yalnız son onluqda); etikaf rejimi (components/ramadanPrep/ItikafFocus).
// • DİNİ MƏTN YAZILMIR: ayə, hədis və dualar src/data/ramadanGuide.js-dən olduğu kimi, mənbəsi ilə.
// • Yaddaş (ramadan_prep_v1) və tarix yalnız mount-dan sonra oxunur — prerender = ilk render.
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import LessonBlocks from '../components/lesson/LessonBlocks'
import RoadDial from '../components/ramadanPrep/RoadDial'
import { PrepLinks, GuideQuote, PrepSwitch, guideBlock, guideSection } from '../components/ramadanPrep/PrepParts'
import { T, STEP_TEXT, NIGHT_TEXT } from '../components/ramadanPrep/prepText'
import { navGroupLabel } from '../data/navigation'
import { pickUi } from '../utils/uiText'
import { dayLabel } from '../utils/dayLabel'
import { ramadanDayLabel } from '../utils/ramadan'
import { loadQada } from '../utils/qada'
import {
  ramadanStatus, roadPlan, roadPhase, roadDate, lastTenStatus, nightEvening, isOddNight, lastNightOf, TEN_NIGHTS,
  NIGHT_ITEMS, ROAD_DAYS, readPrep, writePrep, markRoad, markNight, roadDone, nightDone, nightCount,
  PREP_KEY, PREP_EVENT, localDay,
} from '../utils/ramadanPrep'
import '../styles/LessonsPage.css'
import '../styles/RamadanPrep.css'

const ItikafFocus = lazy(() => import('../components/ramadanPrep/ItikafFocus'))

// Addımın mətni: "g:<bölmə>" — Ramazan bələdçisinin bölməsi (başlıq bələdçidən)
function stepView(kind, lang, t) {
  if (kind.startsWith('g:')) {
    const id = kind.slice(2)
    const s = guideSection(id)
    const title = s ? pickUi(s.title, lang, 'en') : id
    return { icon: s?.icon || 'learn', title: t.guideStep(title), text: t.guideText, links: [{ to: 'ramadan', hash: `rp-g-${id}`, label: s?.title }] }
  }
  const s = STEP_TEXT[kind]
  return s ? { icon: s.icon, title: pickUi(s.title, lang, 'en'), text: pickUi(s.text, lang, 'en'), links: s.links, quote: s.quote } : null
}

// ── Yaddaş: mount-dan sonra; başqa vərəq / profil / komponent dəyişəndə yenilənir ──
function usePrepStore() {
  const [data, setData] = useState({ v: 1, r: {}, t: {} })
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const load = () => setData(readPrep())
    load()
    setReady(true)
    const onStorage = (e) => { if (!e.key || e.key === PREP_KEY || e.key.endsWith(`:${PREP_KEY}`)) load() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('mcc-profile', load)
    window.addEventListener(PREP_EVENT, load)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('mcc-profile', load)
      window.removeEventListener(PREP_EVENT, load)
    }
  }, [])
  const save = useCallback((fn) => setData((cur) => writePrep(fn(cur))), [])
  return { data, ready, save }
}

// Bugünün tarixi və saatı — mount-dan sonra; vərəq yenidən görünəndə yenilənir
function useToday() {
  const [now, setNow] = useState(null)
  useEffect(() => {
    const read = () => { const d = new Date(); setNow({ day: localDay(d), hour: d.getHours() }) }
    read()
    const onVis = () => { if (document.visibilityState === 'visible') read() }
    document.addEventListener('visibilitychange', onVis)
    const id = setInterval(read, 60000)
    return () => { document.removeEventListener('visibilitychange', onVis); clearInterval(id) }
  }, [])
  return now
}

// ═════════════ Yol ═════════════
function RoadStep({ step, lang, t, state, doneDay, onToggle, date, testId, full, qadaOwed }) {
  const v = stepView(step.kind, lang, t)
  if (!v) return null
  const cbId = `rpp-cb-${step.n}`
  const locked = state === 'future'
  return (
    <li className={`rpp-step is-${state}${doneDay ? ' is-done' : ''}`} data-testid={testId} data-n={step.n}>
      <span className="rpp-step__node" aria-hidden="true">{doneDay ? <Icon name="check" size={14} /> : <Icon name={locked ? 'lock' : v.icon} size={14} />}</span>
      <div className="rpp-step__card">
        <p className="rpp-step__meta">
          <span>{t.daysLeft(step.n)}</span>
          <span className="ui-num">{dayLabel(date, lang)}</span>
        </p>
        <h3 className="rpp-step__title">{v.title}</h3>
        {locked ? (
          <p className="rpp-step__locked"><Icon name="clock" size={14} /> {t.opensOn(dayLabel(date, lang))}</p>
        ) : (
          <>
            {full && <p className="rpp-step__text">{v.text}</p>}
            {full && qadaOwed > 0 && (step.kind === 'qada-count' || step.kind === 'qada-fast') && (
              <p className="rpp-step__hint" data-testid="rpp-qada-owed"><Icon name="info" size={14} /> {t.qadaOwed(qadaOwed)}</p>
            )}
            {full && <GuideQuote spec={v.quote} lang={lang} label={t.source} />}
            {full && <PrepLinks links={v.links} lang={lang} />}
            <label className="rpp-check" htmlFor={cbId}>
              <input id={cbId} type="checkbox" checked={Boolean(doneDay)} onChange={(e) => onToggle(step.n, e.target.checked)} />
              <span>{t.done}</span>
              {doneDay && <span className="rpp-check__on"> · {t.doneOn} <span className="ui-num">{dayLabel(doneDay, lang)}</span></span>}
            </label>
          </>
        )}
      </div>
    </li>
  )
}

function RoadView({ lang, t, st, store, say }) {
  const [all, setAll] = useState(false)
  const [qadaOwed, setQadaOwed] = useState(0)
  useEffect(() => { try { setQadaOwed(loadQada()?.fasts?.owed || 0) } catch { /* yaddaş yoxdur */ } }, [])
  const phase = roadPhase(st)
  const year = st?.year
  const plan = useMemo(() => (year ? roadPlan(year) : []), [year])
  const done = year ? roadDone(store.data, year) : {}
  const toggle = (n, on) => { store.save((p) => markRoad(p, year, n, on)); say(on ? t.saved : t.unsaved) }

  if (!st) return <div className="rpp-skel ui-card" aria-busy="true"><span className="ui-skeleton ui-skeleton--text" /><span className="ui-skeleton ui-skeleton--text" /></div>

  if (phase === 'early') {
    const opens = roadDate(st.range, ROAD_DAYS)
    return (
      <section className="ui-card rpp-early" aria-labelledby="rpp-early-h" data-testid="rpp-early">
        <h2 id="rpp-early-h" className="rpp-h2"><Icon name="ramadanprep" size={22} /> {t.earlyTitle}</h2>
        <p>{t.earlyText(dayLabel(opens, lang))}</p>
        <PrepLinks links={[{ to: 'qada' }, { to: 'ramadan', hash: 'rp-g-virtues' }, { to: 'learn', param: 'sunnah-fasts', label: STEP_TEXT['fasts-lesson'].links[0].label }]} lang={lang} />
        <h3 className="rpp-h3">{t.preview}</h3>
        <ol className="rpp-road">
          {plan.slice(0, 3).map((s) => (
            <RoadStep key={s.n} step={s} lang={lang} t={t} state="future" date={roadDate(st.range, s.n)} testId={`rpp-step-${s.n}`} />
          ))}
        </ol>
      </section>
    )
  }

  if (phase === 'ramadan') {
    const n = Object.keys(done).length
    return (
      <section className="ui-card rpp-done" aria-labelledby="rpp-done-h" data-testid="rpp-ramadan">
        <h2 id="rpp-done-h" className="rpp-h2"><Icon name="ramadan" size={22} /> {t.ramadanTitle}</h2>
        <p className="rpp-done__day">{ramadanDayLabel(st.day, lang)}</p>
        <p>{t.ramadanText}</p>
        <p className="rpp-progress-line ui-num">{t.progress(n, ROAD_DAYS)}</p>
        <PrepLinks links={[{ to: 'ramadan' }, { to: 'lastten' }]} lang={lang} />
      </section>
    )
  }

  // phase === 'road'
  const dl = st.daysLeft
  const todayStep = plan.find((s) => s.n === dl)
  const opened = ROAD_DAYS - dl + 1
  const doneN = plan.filter((s) => s.n >= dl && done[s.n]).length
  const earlier = plan.filter((s) => s.n > dl)
  const earlierOpen = earlier.filter((s) => !done[s.n])
  const upcoming = plan.filter((s) => s.n < dl)
  const shown = all ? plan : upcoming.slice(0, 6)
  const pending = earlierOpen.length

  return (
    <div className="rpp-roadwrap">
      <section className="rpp-today" aria-labelledby="rpp-today-h" data-testid="rpp-today">
        <p className="rpp-today__kicker" role="heading" aria-level={2}><Icon name="sparkle" size={16} /> <span id="rpp-today-h">{t.today}</span></p>
        <ol className="rpp-road rpp-road--today">
          {todayStep && (
            <RoadStep step={todayStep} lang={lang} t={t} state="today" doneDay={done[todayStep.n]} onToggle={toggle}
              date={roadDate(st.range, todayStep.n)} testId="rpp-today-step" full qadaOwed={qadaOwed} />
          )}
        </ol>
        <p className="rpp-progress-line" data-testid="rpp-progress">
          <span className="rpp-bar" aria-hidden="true"><i style={{ transform: `scaleX(${opened ? doneN / opened : 0})` }} /></span>
          <span className="ui-num">{t.progress(doneN, opened)}</span>
        </p>
      </section>

      <section className="rpp-roadsec" aria-labelledby="rpp-road-h">
        <div className="rpp-roadsec__head">
          <h2 id="rpp-road-h" className="rpp-h2">{all ? t.dial : t.upcoming}</h2>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" aria-expanded={all} aria-controls="rpp-road-list"
            onClick={() => setAll((x) => !x)} data-testid="rpp-all">
            <Icon name={all ? 'arrowUp' : 'list'} size={16} className="ui-btn__icon" /> {all ? t.showLess : t.showAll}
          </button>
        </div>
        {!all && pending > 0 && <p className="rpp-muted" data-testid="rpp-pending">{t.earlier(pending)}</p>}
        <ol className="rpp-road" id="rpp-road-list" data-testid="rpp-road">
          {shown.filter((s) => s.n !== dl).map((s) => {
            const state = s.n > dl ? 'past' : s.n === dl ? 'today' : 'future'
            return (
              <RoadStep key={s.n} step={s} lang={lang} t={t} state={state} doneDay={done[s.n]} onToggle={toggle}
                date={roadDate(st.range, s.n)} testId={`rpp-step-${s.n}`} full={state !== 'future'} qadaOwed={qadaOwed} />
            )
          })}
        </ol>
      </section>
    </div>
  )
}

// ═════════════ Son 10 gecə ═════════════
function NightCard({ n, lang, t, ls, year, store, enabled, tonight, maybe, onToggle }) {
  const odd = isOddNight(n)
  const d = nightCount(store.data, year, n)
  return (
    <li className={`rpp-night${odd ? ' is-odd' : ''}${tonight ? ' is-tonight' : ''}${d === NIGHT_ITEMS.length ? ' is-full' : ''}`}
      data-testid={`rpp-night-${n}`} aria-current={tonight ? 'date' : undefined}>
      <div className="rpp-night__head">
        <h3 className="rpp-night__h">{t.nightN(n)}</h3>
        <div className="rpp-night__badges">
          {tonight && <span className="rpp-badge rpp-badge--now">{t.tonight}</span>}
          {odd && <span className="rpp-badge rpp-badge--odd"><Icon name="star" size={12} /> {t.odd}</span>}
        </div>
      </div>
      <p className="rpp-night__ev">{t.evening(dayLabel(nightEvening(ls.range, n), lang))}{maybe ? ` · ${t.maybe30}` : ''}</p>
      <p className="rpp-night__prog ui-num">
        <span className="rpp-dots" aria-hidden="true">{NIGHT_ITEMS.map((it) => <i key={it} className={nightDone(store.data, year, n, it) ? 'on' : ''} />)}</span>
        {t.nightProgress(d)}
      </p>
      <ul className="rpp-night__list">
        {NIGHT_ITEMS.map((it) => {
          const id = `rpp-n${n}-${it}`
          const on = nightDone(store.data, year, n, it)
          return (
            <li key={it}>
              <label className="rpp-nitem" htmlFor={id}>
                <input id={id} type="checkbox" checked={on} disabled={!enabled} onChange={(e) => onToggle(n, it, e.target.checked)} />
                <Icon name={NIGHT_TEXT[it].icon} size={16} />
                <span>
                  {pickUi(NIGHT_TEXT[it].title, lang, 'en')}
                  {tonight && <small>{pickUi(NIGHT_TEXT[it].hint, lang, 'en')}</small>}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </li>
  )
}

function NightsView({ lang, t, ls, store, say, onFocus, focusBtnRef }) {
  if (!ls) return <div className="rpp-skel ui-card" aria-busy="true"><span className="ui-skeleton ui-skeleton--text" /><span className="ui-skeleton ui-skeleton--text" /></div>
  const { year, phase } = ls
  const active = phase === 'active'
  const lastCalc = lastNightOf(ls.range)
  const toggle = (n, it, on) => { store.save((p) => markNight(p, year, n, it, on)); say(on ? t.saved : t.unsaved) }
  const dua = guideBlock('laylat-al-qadr', 'dua')
  const why = (guideSection('laylat-al-qadr')?.blocks || []).filter((b) => b.t === 'ayah' || b.t === 'hadith')

  return (
    <div className="rpp-nightswrap">
      <section className={`ui-card rpp-nstatus is-${phase}`} data-testid="rpp-nights-status" aria-labelledby="rpp-nstatus-h">
        {phase === 'before' && (
          <>
            <h2 id="rpp-nstatus-h" className="rpp-h2"><Icon name="clock" size={20} /> {t.nightsIn(ls.daysLeft)}</h2>
            <p>{t.nightsBegin(dayLabel(nightEvening(ls.range, 21), lang))}</p>
            <p className="rpp-muted">{t.previewNote}</p>
          </>
        )}
        {active && (
          <>
            <h2 id="rpp-nstatus-h" className="rpp-h2"><Icon name="moonStar" size={20} /> {t.tonight}: {t.nightN(ls.night)}</h2>
            {isOddNight(ls.night) && <p><span className="rpp-badge rpp-badge--odd"><Icon name="star" size={12} /> {t.odd}</span></p>}
          </>
        )}
        {phase === 'after' && (
          <>
            <h2 id="rpp-nstatus-h" className="rpp-h2"><Icon name="check" size={20} /> {t.afterTitle}</h2>
            <p>{t.afterText}</p>
            <PrepLinks links={[{ to: 'ramadanprep' }]} lang={lang} />
          </>
        )}
        <button type="button" className="ui-btn ui-btn--primary rpp-focus-btn" onClick={onFocus} ref={focusBtnRef} data-testid="rpp-focus-open">
          <Icon name="moonStar" size={18} className="ui-btn__icon" /> {t.focus}
        </button>
        <p className="rpp-muted rpp-focus-lead">{t.focusLead}</p>
      </section>

      <ol className="rpp-nights" data-testid="rpp-nights">
        {TEN_NIGHTS.map((n) => (
          <NightCard key={n} n={n} lang={lang} t={t} ls={ls} year={year} store={store}
            enabled={store.ready && active && n <= ls.night} tonight={active && n === ls.night}
            maybe={n === 30 && lastCalc === 29} onToggle={toggle} />
        ))}
      </ol>

      {dua && (
        <section className="rpp-duasec ls-page" aria-labelledby="rpp-dua-h" data-testid="rpp-dua">
          <h2 id="rpp-dua-h" className="rpp-h2"><Icon name="duas" size={20} /> {t.dua}</h2>
          <LessonBlocks blocks={[dua]} lang={lang} />
        </section>
      )}

      {why.length > 0 && (
        <details className="ui-card rpp-why ls-page" data-testid="rpp-why">
          <summary className="rpp-why__sum"><Icon name="learn" size={18} /> {t.why}</summary>
          <LessonBlocks blocks={why} lang={lang} />
          <PrepLinks links={[{ to: 'ramadan', hash: 'rp-g-laylat-al-qadr', label: guideSection('laylat-al-qadr')?.title }, { to: 'ramadan', hash: 'rp-g-itikaf', label: guideSection('itikaf')?.title }]} lang={lang} />
        </details>
      )}
    </div>
  )
}

// ═════════════ Səhifə ═════════════
export default function RamadanPrepPage({ setPage, view = 'road' }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const store = usePrepStore()
  const now = useToday()
  const [msg, setMsg] = useState('')
  const [focus, setFocus] = useState(false)
  const focusBtnRef = useRef(null)
  const isRoad = view !== 'nights'

  const st = useMemo(() => (now ? ramadanStatus(now.day) : null), [now])
  const ls = useMemo(() => (now ? lastTenStatus(now.day, now.hour) : null), [now])
  const title = isRoad ? t.road : t.nights

  // Siferblat: yol günləri və ya Ramazan günü
  const phase = roadPhase(st)
  const roadYear = st?.year
  const done = roadYear ? roadDone(store.data, roadYear) : {}
  let dialCenter = null, dialSub = null, dialLabel = t.dial
  if (st && phase === 'ramadan') { dialCenter = st.day; dialSub = ramadanDayLabel(st.day, lang); dialLabel = dialSub }
  else if (st) { dialCenter = st.daysLeft; dialSub = t.startsOn(dayLabel(st.range.s, lang)); dialLabel = `${t.daysLeft(st.daysLeft)}. ${dialSub}` }

  const closeFocus = useCallback(() => {
    setFocus(false)
    setTimeout(() => focusBtnRef.current?.focus(), 0)
  }, [])
  const focusNight = ls?.phase === 'active' ? ls.night : 21
  const focusYear = ls?.year

  return (
    <div className={`rpp-page rpp-page--${isRoad ? 'road' : 'nights'}`}>
      <header className="ui-page-hero ui-page-hero--split rpp-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={title} />
            <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
            <h1 className="ui-display">{title}</h1>
            <p className="ui-lead">{isRoad ? t.leadRoad : t.leadNights}</p>
            <p className="ui-page-hero__how"><Icon name="shield" size={16} /> {t.private}</p>
          </div>
          <div className="ui-page-hero__aside rpp-hero__aside">
            <RoadDial daysLeft={st && phase !== 'ramadan' ? st.daysLeft : null} done={done} ramadanDay={phase === 'ramadan' ? st.day : null}
              label={st ? dialLabel : t.loading} center={dialCenter} sub={dialSub} />
            {st && phase !== 'ramadan' && <p className="rpp-hero__left" data-testid="rpp-days-left">{t.daysLeft(st.daysLeft)}</p>}
            {st && <p className="rpp-hero__calc">{t.calc}</p>}
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow">
          <PrepSwitch view={isRoad ? 'road' : 'nights'} lang={lang} t={t} />
          <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>
          {isRoad
            ? <RoadView lang={lang} t={t} st={st} store={store} say={setMsg} />
            : <NightsView lang={lang} t={t} ls={ls} store={store} say={setMsg} onFocus={() => setFocus(true)} focusBtnRef={focusBtnRef} />}
          <PrepLinks className="rpp-foot" links={[{ to: isRoad ? 'lastten' : 'ramadanprep' }, { to: 'ramadan' }]} lang={lang} />
        </div>
      </section>

      {focus && ls && (
        <Suspense fallback={null}>
          <ItikafFocus t={t} lang={lang} night={focusNight} preview={ls.phase !== 'active'}
            isDone={(it) => nightDone(store.data, focusYear, focusNight, it)}
            onToggle={(it, on) => { store.save((p) => markNight(p, focusYear, focusNight, it, on)); setMsg(on ? t.saved : t.unsaved) }}
            dua={guideBlock('laylat-al-qadr', 'dua')} onClose={closeFocus} />
        </Suspense>
      )}
    </div>
  )
}
