// ═══════════════════════════════════════════════════════
// /account — I mərhələsi: qrup çağırışları (server/challenges.js), müəllim sinfi (server/classes.js),
// ailə Ramazan lövhəsi (server/familyRamadan.js), şəxsi təqvim axını (server/calFeed.js).
// Lövhələr özləri /together səhifəsindədir (#c=<id>, #k=<id>). AccountPage bu faylı tənbəl yükləyir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import CopyLink from '../readroom/CopyLink'
import { TG, tgError } from '../together/togetherText'
import { Confirm, Msg, challengeName, fmtDay, fmtMs, nf } from '../together/tgUi'
import {
  listChallenges, createChallenge, listClasses, createClass, getRamadanBoard, shareRamadan, hideRamadan,
  ramadanJuz, ramadanIftar, ramadanQadr, getCalFeed, createCalFeed, updateCalFeed, revokeCalFeed, feedUrls, localToday,
} from '../../api/together'
import '../../styles/ReadTogether.css'
import '../../styles/Together.css'

const TEMPLATES = ['quran_pages', 'fajr', 'adhkar', 'mulk', 'khatm', 'custom']
const FEED_CATS = ['loved', 'friday', 'zakat', 'letters', 'fasts', 'challenges']
const FASTS_KEY = 'muslim_cc_ramadan_fasts_v1'   // "Hilal yolu" (components/CrescentPath.jsx) — { [hicri il]: { gün: 1|2 } }

function Card({ id, icon, title, lead, children, testId }) {
  return (
    <section className="ui-card acc-section" aria-labelledby={`${id}-title`} id={id} data-testid={testId}>
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name={icon} size={20} /></span>
        <div>
          <h2 className="acc-section__title" id={`${id}-title`}>{title}</h2>
          {lead && <p className="acc-section__lead">{lead}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

export default function AccountISections({ lang, siteLang }) {
  const t = pickUi(TG, lang, 'en')
  return (
    <>
      <ChallengesSection t={t} lang={lang} siteLang={siteLang} />
      <ClassesSection t={t} lang={lang} siteLang={siteLang} />
      <FamilyRamadanSection t={t} lang={lang} />
      <CalFeedSection t={t} lang={lang} />
    </>
  )
}

// ── Qrup çağırışları ──
function ChallengesSection({ t, lang, siteLang }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)
  const load = useCallback(() => listChallenges().then(setData).catch(() => setData({ challenges: [] })), [])
  useEffect(() => { load() }, [load])
  const path = pathFor('together', siteLang)
  return (
    <Card id="challenges" icon="group" title={t.ch.title} lead={t.ch.lead} testId="challenges-section">
      {data && data.challenges.length > 0 && (
        <>
          <h3 className="rt-card__title">{t.ch.mine}</h3>
          <ul className="rt-list" data-testid="challenges-list">
            {data.challenges.map((c) => (
              <li key={c.id} className="rt-list__item">
                <span>
                  <strong><bdi>{challengeName(c, t)}</bdi></strong><br />
                  <span className="rt-note">
                    {c.todayDone != null ? t.ch.todayOf(c.todayDone, c.members) : c.today > c.endOn ? t.ch.ended : t.ch.starts(fmtDay(c.startOn, lang))}
                    {c.todayDone != null && ` · ${c.mineToday ? t.ch.youToday : t.ch.youNot}`}
                  </span>
                </span>
                <a className="ui-btn ui-btn--secondary ui-btn--sm" href={`${path}#c=${c.id}`}>{t.ch.open}</a>
              </li>
            ))}
          </ul>
        </>
      )}
      {data && data.challenges.length === 0 && <p className="rt-note">{t.ch.none}</p>}
      {!open
        ? <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => setOpen(true)} data-testid="challenge-new"><Icon name="plus" className="ui-btn__icon" /> {t.ch.create}</button>
        : <ChallengeForm t={t} onCreated={(r) => navigate(`${path}#c=${r.challenge.id}&invite=${r.token}`)} />}
    </Card>
  )
}

function ChallengeForm({ t, onCreated }) {
  const [template, setTemplate] = useState('quran_pages')
  const [n, setN] = useState('2')
  const [title, setTitle] = useState('')
  const [days, setDays] = useState(30)
  const [start, setStart] = useState(() => localToday())
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const label = (k) => (k === 'quran_pages' ? t.ch.templates.quran_pages : t.ch.templates[k])
  const submit = async (e) => {
    e.preventDefault()
    if (!consent) { setErr(t.common.consentNeed); return }
    if (template === 'custom' && !title.trim()) { setErr(t.err.title); return }
    setBusy(true); setErr('')
    try {
      const body = { template, startOn: start, days: template === 'khatm' ? 30 : days }
      if (template === 'quran_pages') body.n = Math.max(1, Math.min(20, Number(n) || 1))
      if (template === 'custom') body.title = title.trim()
      onCreated(await createChallenge(body))
    } catch (x) { setErr(tgError(x, t)) } finally { setBusy(false) }
  }
  return (
    <form className="prf-form" onSubmit={submit} noValidate data-testid="challenge-form">
      <label className="ui-field" htmlFor="chf-template">
        <span className="ui-field__label">{t.ch.template}</span>
        <select id="chf-template" className="ui-select" value={template} onChange={(e) => setTemplate(e.target.value)} data-testid="challenge-template">
          {TEMPLATES.map((k) => <option key={k} value={k}>{label(k)}</option>)}
        </select>
      </label>
      {template === 'quran_pages' && (
        <label className="ui-field" htmlFor="chf-n">
          <span className="ui-field__label">{t.ch.pages}</span>
          <input id="chf-n" className="ui-input ui-num rt-page-input" type="number" inputMode="numeric" min={1} max={20} value={n} onChange={(e) => setN(e.target.value)} />
        </label>
      )}
      {template === 'custom' && (
        <label className="ui-field" htmlFor="chf-title">
          <span className="ui-field__label">{t.ch.customTitle}</span>
          <input id="chf-title" className="ui-input" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      )}
      <div className="rt-row">
        {template !== 'khatm' && (
          <label className="ui-field" htmlFor="chf-days">
            <span className="ui-field__label">{t.ch.duration}</span>
            <select id="chf-days" className="ui-select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {[7, 30, 40].map((d) => <option key={d} value={d}>{t.ch.days(d)}</option>)}
            </select>
          </label>
        )}
        <label className="ui-field" htmlFor="chf-start">
          <span className="ui-field__label">{t.ch.start}</span>
          <input id="chf-start" className="ui-input ui-num" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
      </div>
      <p className="rt-note">{t.ch.boardNote}</p>
      <label className="acc-check" htmlFor="chf-consent">
        <input id="chf-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="challenge-consent" />
        <span>{t.ch.consent}</span>
      </label>
      {err && <p className="rt-msg" role="alert">{err}</p>}
      <div><button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} data-testid="challenge-create">{t.ch.createBtn}</button></div>
    </form>
  )
}

// ── Müəllim sinfi ──
function ClassesSection({ t, siteLang }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { listClasses().then(setData).catch(() => setData({ teaching: [], learning: [] })) }, [])
  const path = pathFor('together', siteLang)
  const create = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setErr(t.err.name); return }
    setBusy(true); setErr('')
    try {
      const r = await createClass(name.trim())
      navigate(`${path}#k=${r.class.id}&invite=${r.token}`)
    } catch (x) { setErr(tgError(x, t)) } finally { setBusy(false) }
  }
  const item = (c) => (
    <li key={`${c.role}-${c.id}`} className="rt-list__item">
      <span>
        <strong><bdi>{c.name}</bdi></strong><br />
        <span className="rt-note">{t.cls.students(c.students)}{c.role === 'student' && <> · <bdi>{t.cls.teacherIs(c.teacher)}</bdi> · {c.sharing ? t.cls.sharingYes : t.cls.sharingNo}</>}</span>
      </span>
      <a className="ui-btn ui-btn--secondary ui-btn--sm" href={`${path}#k=${c.id}`}>{t.cls.open}</a>
    </li>
  )
  return (
    <Card id="classes" icon="learn" title={t.cls.title} lead={t.cls.lead} testId="classes-section">
      {data && data.teaching.length > 0 && <><h3 className="rt-card__title">{t.cls.teaching}</h3><ul className="rt-list" data-testid="classes-teaching">{data.teaching.map(item)}</ul></>}
      {data && data.learning.length > 0 && <><h3 className="rt-card__title">{t.cls.learning}</h3><ul className="rt-list" data-testid="classes-learning">{data.learning.map(item)}</ul></>}
      {data && !data.teaching.length && !data.learning.length && <p className="rt-note">{t.cls.none}</p>}
      <form className="prf-form" onSubmit={create} noValidate data-testid="class-form">
        <label className="ui-field" htmlFor="cls-name">
          <span className="ui-field__label">{t.cls.className}</span>
          <input id="cls-name" className="ui-input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {err && <p className="rt-msg" role="alert">{err}</p>}
        <div><button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} data-testid="class-create"><Icon name="plus" className="ui-btn__icon" /> {t.cls.create}</button></div>
      </form>
    </Card>
  )
}

// ── Ailə Ramazan lövhəsi ──
function localFasts(hyear) {
  try {
    const all = JSON.parse(globalThis.localStorage?.getItem(FASTS_KEY) || '{}') || {}
    const y = all[hyear]
    return y && typeof y === 'object' ? Object.values(y).filter((v) => v === 1).length : 0
  } catch { return 0 }
}

function FamilyRamadanSection({ t, lang }) {
  const [b, setB] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  // Gecə qutusu toxunanda dərhal dəyişsin (server cavabını gözləmədən); cavab/xəta gələndə serverin dəyəri qalır
  const [qadrPend, setQadrPend] = useState({})
  useEffect(() => { getRamadanBoard().then(setB).catch(() => setB(null)) }, [])
  const run = async (fn, okText) => {
    setBusy(true); setMsg(null)
    try { setB(await fn()); if (okText) setMsg({ tone: 'ok', text: okText }) } catch (e) { setMsg({ tone: 'bad', text: tgError(e, t) }) } finally { setBusy(false); setQadrPend({}) }
  }
  if (!b || !b.circle) return null   // ailə dairəsi yoxdur — "Ailə dairəsi" bölməsi onu təklif edir
  const s = b.season
  if (!s.open) {
    return (
      <Card id="family-ramadan" icon="ramadan" title={t.ram.title} lead={t.ram.lead} testId="family-ramadan">
        <p className="rt-note" data-testid="ram-closed">{t.ram.closed(fmtDay(s.start, lang, { dateStyle: 'long' }))}</p>
      </Card>
    )
  }
  const phase = s.phase === 'ramadan' && s.hijriDay ? t.ram.dayOf(s.hijriDay) : s.phase === 'after' ? t.ram.after : t.ram.before
  return (
    <Card id="family-ramadan" icon="ramadan" title={t.ram.title} lead={t.ram.lead} testId="family-ramadan">
      <p className="rt-badge tg-phase">{phase}</p>
      <RamadanNumbers t={t} lang={lang} b={b} busy={busy} run={run} />
      <section className="prf-form" aria-labelledby="ram-khatm-title" data-testid="ram-khatm">
        <h3 className="rt-card__title" id="ram-khatm-title">{t.ram.khatm}</h3>
        <p className="rt-note">{t.ram.khatmLead} {t.ram.progress(b.juz.filter((j) => j.done).length)}</p>
        <ul className="tg-juz">
          {b.juz.map((j) => (
            <li key={j.juz} className={`tg-juz__item${j.mine ? ' is-mine' : ''}${j.done ? ' is-done' : ''}`}>
              <span className="tg-juz__n">{t.ram.juzN(j.juz)}</span>
              <span className="tg-juz__st"><bdi>{j.by || t.ram.free}</bdi>{j.done ? ' ✓' : ''}</span>
              {!j.by && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(() => ramadanJuz(j.juz, 'take'))} aria-label={`${t.ram.take}: ${t.ram.juzN(j.juz)}`}>{t.ram.take}</button>}
              {j.mine && !j.done && (
                <>
                  <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} onClick={() => run(() => ramadanJuz(j.juz, 'done'))} aria-label={`${t.ram.readDone}: ${t.ram.juzN(j.juz)}`}>{t.ram.readDone}</button>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(() => ramadanJuz(j.juz, 'release'))} aria-label={`${t.ram.release}: ${t.ram.juzN(j.juz)}`}>{t.ram.release}</button>
                </>
              )}
              {j.mine && j.done && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(() => ramadanJuz(j.juz, 'undone'))} aria-label={`${t.ram.undo}: ${t.ram.juzN(j.juz)}`}>{t.ram.undo}</button>}
            </li>
          ))}
        </ul>
      </section>
      <section className="prf-form" aria-labelledby="ram-iftar-title" data-testid="ram-iftar">
        <h3 className="rt-card__title" id="ram-iftar-title">{t.ram.iftar}</h3>
        <p className="rt-note">{t.ram.iftarLead}</p>
        <ul className="rt-list">
          {b.iftar.map((d) => (
            <li key={d.day} className="rt-list__item">
              <span>{t.ram.dayN(d.n)} · {fmtDay(d.day, lang)}{d.by ? <> — <bdi>{d.by}</bdi></> : ''}</span>
              {!d.by && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(() => ramadanIftar(d.day, true))} aria-label={`${t.ram.host}: ${t.ram.dayN(d.n)}`} data-testid={`ram-host-${d.n}`}>{t.ram.host}</button>}
              {d.mine && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(() => ramadanIftar(d.day, false))} aria-label={`${t.ram.unhost}: ${t.ram.dayN(d.n)}`}>{t.ram.unhost}</button>}
            </li>
          ))}
        </ul>
      </section>
      <section className="prf-form" aria-labelledby="ram-qadr-title" data-testid="ram-qadr">
        <h3 className="rt-card__title" id="ram-qadr-title">{t.ram.qadr}</h3>
        <p className="rt-note">{t.ram.qadrLead}</p>
        <ul className="tg-nights">
          {b.qadr.map((q) => (
            <li key={q.night}>
              <label className="rt-switch">
                <input type="checkbox" checked={qadrPend[q.night] ?? q.mine} disabled={busy} onChange={(e) => { const v = e.target.checked; setQadrPend({ [q.night]: v }); run(() => ramadanQadr(q.night, v)) }} data-testid={`ram-night-${q.night}`} />
                <span>{t.ram.night(q.night)} — {t.ram.me} <span className="ui-num">({t.ram.together(q.count, b.total)})</span></span>
              </label>
            </li>
          ))}
        </ul>
      </section>
      <Msg msg={msg} />
    </Card>
  )
}

function RamadanNumbers({ t, lang, b, busy, run }) {
  const [fasts, setFasts] = useState(() => String(b.mine ? b.mine.fasts : localFasts(b.season.hyear)))
  const [pages, setPages] = useState(() => String(b.mine ? b.mine.pages : 0))
  const [consent, setConsent] = useState(false)
  const [err, setErr] = useState('')
  const save = (e) => {
    e.preventDefault()
    if (!b.consent && !consent) { setErr(t.common.consentNeed); return }
    const f = Math.max(0, Math.min(30, Math.floor(Number(fasts) || 0))), p = Math.max(0, Math.min(10000, Math.floor(Number(pages) || 0)))
    setErr('')
    run(() => shareRamadan(f, p, !b.consent), t.ram.saved)
  }
  return (
    <section className="prf-form" aria-labelledby="ram-num-title" data-testid="ram-numbers">
      <h3 className="rt-card__title" id="ram-num-title">{t.ram.numbers}</h3>
      <ul className="fam-members">
        {b.members.map((m) => (
          <li key={m.id} className="fam-member">
            <span className="fam-member__who"><bdi>{m.label}</bdi></span>
            {m.share ? (
              <dl className="fam-stats">
                <div className="fam-stat"><dt>{t.ram.fasts}</dt><dd className="ui-num">{nf(m.share.fasts, lang)}</dd></div>
                <div className="fam-stat"><dt>{t.ram.pages}</dt><dd className="ui-num">{nf(m.share.pages, lang)}</dd></div>
              </dl>
            ) : <p className="rt-note">{t.ram.notShared}</p>}
          </li>
        ))}
      </ul>
      <form className="rt-row" onSubmit={save} noValidate>
        <label className="ui-field" htmlFor="ram-fasts">
          <span className="ui-field__label">{t.ram.fasts}</span>
          <input id="ram-fasts" className="ui-input ui-num rt-page-input" type="number" inputMode="numeric" min={0} max={30} value={fasts} onChange={(e) => setFasts(e.target.value)} />
        </label>
        <label className="ui-field" htmlFor="ram-pages">
          <span className="ui-field__label">{t.ram.pages}</span>
          <input id="ram-pages" className="ui-input ui-num rt-page-input" type="number" inputMode="numeric" min={0} max={10000} value={pages} onChange={(e) => setPages(e.target.value)} />
        </label>
        {!b.consent && (
          <label className="acc-check" htmlFor="ram-consent">
            <input id="ram-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="ram-consent" />
            <span>{t.ram.consent}</span>
          </label>
        )}
        {err && <p className="rt-msg" role="alert">{err}</p>}
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} data-testid="ram-share">{t.ram.saveNumbers}</button>
        {b.consent && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(hideRamadan, t.ram.hidden)} data-testid="ram-hide">{t.ram.hide}</button>}
      </form>
    </section>
  )
}

// ── Təqvim axını ──
function CalFeedSection({ t, lang }) {
  const [feed, setFeed] = useState(null)
  const [cats, setCats] = useState(() => ({ loved: true, friday: false, zakat: true, letters: true, fasts: true, challenges: true }))
  const [consent, setConsent] = useState(false)
  const [token, setToken] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  useEffect(() => {
    getCalFeed().then((f) => { setFeed(f); if (f.enabled && f.cats) setCats(f.cats) }).catch(() => setFeed({ enabled: false }))
  }, [])
  const urls = useMemo(() => (token ? feedUrls(window.location.origin, token) : null), [token])
  const any = FEED_CATS.some((k) => cats[k])
  const run = async (fn, okText) => {
    setBusy(true); setMsg(null)
    try { const r = await fn(); if (okText) setMsg({ tone: 'ok', text: okText }); return r } catch (e) { setMsg({ tone: 'bad', text: tgError(e, t) }); return null } finally { setBusy(false) }
  }
  const enable = async () => {
    if (!any) { setMsg({ tone: 'bad', text: t.err.pickOne }); return }
    if (!feed.enabled && !consent) { setMsg({ tone: 'bad', text: t.common.consentNeed }); return }
    const r = await run(() => createCalFeed(cats, lang, !feed.enabled))
    if (r) { setToken(r.token); setFeed(r) }
  }
  if (!feed) return null
  return (
    <Card id="cal-feed" icon="calendar" title={t.feed.title} lead={t.feed.lead} testId="cal-feed">
      <fieldset className="fam-fields">
        <legend className="ui-sr-only">{t.feed.title}</legend>
        {FEED_CATS.map((k) => (
          <label key={k} className="rt-switch">
            <input type="checkbox" checked={Boolean(cats[k])} onChange={(e) => setCats((c) => ({ ...c, [k]: e.target.checked }))} data-testid={`feed-cat-${k}`} />
            <span>{t.feed.cats[k]}</span>
          </label>
        ))}
      </fieldset>
      {feed.enabled && <p className="rt-note" data-testid="feed-on">{t.feed.on(fmtMs(feed.createdAt, lang))} {t.feed.refresh}</p>}
      {!feed.enabled && (
        <label className="acc-check" htmlFor="feed-consent">
          <input id="feed-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="feed-consent" />
          <span>{t.feed.consent}</span>
        </label>
      )}
      <div className="rt-row">
        {!feed.enabled
          ? <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} onClick={enable} data-testid="feed-enable"><Icon name="calendar" className="ui-btn__icon" /> {t.feed.enable}</button>
          : (
            <>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy || !any} data-testid="feed-save"
                onClick={async () => { const r = await run(() => updateCalFeed({ cats, lang }), t.feed.saved); if (r) setFeed(r) }}>{t.feed.saveCats}</button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={enable} data-testid="feed-regenerate"><Icon name="refresh" className="ui-btn__icon" /> {t.feed.regenerate}</button>
              <Confirm t={t} label={t.feed.revoke} testId="feed-revoke" onYes={async () => { if (await run(revokeCalFeed, t.feed.revoked)) { setFeed({ enabled: false }); setToken(null) } }} />
            </>
          )}
      </div>
      {feed.enabled && !token && <p className="rt-note">{t.feed.lost} {t.feed.regenerateNote}</p>}
      {urls && (
        <div className="prf-form" role="status" data-testid="feed-urls">
          <p className="rt-note"><Icon name="info" size={14} /> {t.feed.once}</p>
          <CopyLink link={urls.https} label={t.feed.https} copyText={t.common.copy} copiedText={t.common.copied} shareText={t.common.share} title={t.feed.title} testId="feed-https" />
          <CopyLink link={urls.webcal} label={t.feed.webcal} copyText={t.common.copy} copiedText={t.common.copied} shareText={t.common.share} title={t.feed.title} testId="feed-webcal" />
          <a className="ui-btn ui-btn--ghost ui-btn--sm" href={urls.webcal}><Icon name="external" className="ui-btn__icon" /> {t.feed.addApple}</a>
          <details className="tg-details">
            <summary>{t.feed.howTitle}</summary>
            <ul className="rt-note tg-plain">
              <li>{t.feed.howGoogle}</li>
              <li>{t.feed.howApple}</li>
              <li>{t.feed.howOutlook}</li>
            </ul>
          </details>
        </div>
      )}
      <Msg msg={msg} />
    </Card>
  )
}
