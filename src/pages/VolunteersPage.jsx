// ═══════════════════════════════════════════════════════
// /volunteers — məscid könüllüləri lövhəsi (server/volunteers.js). noindex.
// • İctimai: açıq ehtiyaclar (tarixi keçənlər avtomatik arxivdə) və YALNIZ "M yerdən N-i dolub" —
//   ad, reytinq, lövhə yoxdur.
// • Girişli istifadəçi yazılır / ləğv edir; nümayəndəyə görünən ad + istəyə görə e-poçt (razılıqla).
// • Rolu mosque_rep (öz məscidi) və ya admin olan hesab: "Məscidimin ehtiyacları" — yerləşdir, yazılanları gör, sil.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import { useAuthUser, refreshMe } from '../api/userSession'
import { apiErrCode } from '../components/account/communityText'
import { Msg, Confirm, fmtDay } from '../components/community/CommunityUi'
import { VO } from '../components/boards/boardsText'
import {
  getVolunteerNeeds, getMyVolunteering, getVolunteerManage, createVolunteerNeed, deleteVolunteerNeed, volunteerSignup, volunteerCancel,
} from '../api/communityBoards'
import '../styles/ReadTogether.css'
import '../styles/Account.css'
import '../styles/Community.css'
import '../styles/CommunityBoards.css'

const MANAGER_ROLES = ['mosque_rep', 'admin', 'superadmin']

export default function VolunteersPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(VO, lang, 'en')
  const { status, user } = useAuthUser()
  useEffect(() => { if (status === 'unknown') refreshMe().catch(() => {}) }, [status])
  const signedIn = status === 'user'
  const isManager = signedIn && MANAGER_ROLES.includes(user?.role)

  const [mosque, setMosque] = useState('')
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const [mine, setMine] = useState(null)
  const load = useCallback(() => {
    setFailed(false)
    return getVolunteerNeeds(mosque).then(setData).catch(() => { setFailed(true); setData((d) => d || { items: [], mosques: [] }) })
  }, [mosque])
  // signedIn dəyişəndə də yenilə (server "signedUp" işarəsini girişli istifadəçiyə qaytarır)
  useEffect(() => { load() }, [load, signedIn])
  const loadMine = useCallback(() => getMyVolunteering().then(setMine).catch(() => setMine(null)), [])
  useEffect(() => { if (signedIn) loadMine() }, [signedIn, loadMine])
  const refresh = () => { load(); if (signedIn) loadMine() }

  const loginHref = `${pathFor('login', siteLang)}?next=${encodeURIComponent(pathFor('volunteers', siteLang))}`
  return (
    <div className="acc-account cb-page" data-testid="volunteers-page">
      <section className="ui-page-hero">
        <div className="ui-container">
          <p className="ui-eyebrow">{t.eyebrow}</p>
          <h1 className="ui-title">{t.title}</h1>
          <p className="ui-lead ui-lead--full">{t.lead}</p>
        </div>
      </section>
      <div className="ui-container cb-layout">
        <section className="cb-main" aria-labelledby="vo-list-title">
          <div className="rt-row cb-listhead">
            <h2 className="acc-section__title" id="vo-list-title">{t.title}</h2>
            {(data?.mosques || []).length > 1 && (
              <label className="ui-field cb-filters__city">
                <span className="ui-sr-only">{t.mosque}</span>
                <select className="ui-select" value={mosque} onChange={(e) => setMosque(e.target.value)} data-testid="vo-mosque">
                  <option value="">{t.allMosques}</option>
                  {data.mosques.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
            )}
          </div>
          <p className="cb-hint">{t.privacy}</p>
          {!data && <p className="rt-note">{t.loading}</p>}
          {failed && <div className="rt-row"><p className="rt-note">{t.loadErr}</p><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={load}>{t.retry}</button></div>}
          {data && !failed && data.items.length === 0 && (
            <div className="ui-card dw-empty" data-testid="vo-empty">
              <span className="dw-empty__icon" aria-hidden="true"><Icon name="volunteers" size={28} /></span>
              <p className="dw-empty__text">{t.empty}</p>
            </div>
          )}
          {data && data.items.length > 0 && (
            <ul className="cb-grid" data-testid="vo-list">
              {data.items.map((n) => <NeedCard key={n.id} n={n} t={t} lang={lang} signedIn={signedIn} loginHref={loginHref} defaultName={user?.displayName || ''} onChange={refresh} />)}
            </ul>
          )}
        </section>
        <aside className="acc-sections cb-side">
          {!signedIn && (
            <section className="ui-card acc-section">
              <div className="rt-row">
                <p className="rt-note">{t.login}</p>
                <a className="ui-btn ui-btn--primary ui-btn--sm" href={loginHref}><Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {t.loginBtn}</a>
              </div>
            </section>
          )}
          {signedIn && mine && mine.items.length > 0 && (
            <section className="ui-card acc-section" aria-labelledby="vo-mine-title" data-testid="vo-mine">
              <h2 className="acc-section__title" id="vo-mine-title">{t.mine}</h2>
              <ul className="rt-list">
                {mine.items.map((m) => (
                  <li key={m.id} className="rt-list__item">
                    <span>
                      <bdi className="cb-strong">{m.title}</bdi><br />
                      <span className="rt-note"><bdi>{m.mosqueName}</bdi> · <span className="ui-num">{fmtDay(m.date, lang)}</span>{m.time && <> · <span className="ui-num" dir="ltr">{m.time}</span></>}</span>
                      {m.archived && <> <span className="rt-badge">{t.archived}</span></>}
                    </span>
                    {!m.archived && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => volunteerCancel(m.id).then(refresh).catch(() => {})}>{t.cancelSignup}</button>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {isManager && <ManageSection t={t} lang={lang} onChange={refresh} />}
        </aside>
      </div>
    </div>
  )
}

function Slots({ n, t }) {
  const pct = n.slots ? Math.round((n.filled / n.slots) * 100) : 0
  return (
    <div className="vo-slots">
      <span className="vo-slots__bar" aria-hidden="true"><span style={{ inlineSize: `${pct}%` }} /></span>
      <span className="rt-note ui-num" data-testid="vo-slots">{t.slots(n.filled, n.slots)}</span>
    </div>
  )
}

function NeedCard({ n, t, lang, signedIn, loginHref, defaultName, onChange }) {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(defaultName)
  const [share, setShare] = useState(false)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const full = n.filled >= n.slots
  const act = async (fn) => {
    setBusy(true); setMsg(null)
    try { await fn(); setOpen(false); onChange() } catch (err) { setMsg({ tone: 'bad', text: t.err[apiErrCode(err)] || t.err.generic }) } finally { setBusy(false) }
  }
  return (
    <li className="ui-card cb-card" data-testid="vo-card">
      <div className="cb-card__head">
        <span className="ui-icon-tile" aria-hidden="true"><Icon name="volunteers" size={20} /></span>
        <div>
          <h3 className="cb-card__title" dir="auto">{n.title}</h3>
          <p className="cb-card__meta"><bdi>{n.mosqueName}</bdi> · <span className="ui-num">{fmtDay(n.date, lang)}</span>{n.time && <> · <span className="ui-num" dir="ltr">{n.time}</span></>}</p>
        </div>
      </div>
      {n.description && <p className="cb-card__line cm-pre" dir="auto">{n.description}</p>}
      <Slots n={n} t={t} />
      {n.signedUp ? (
        <div className="rt-row">
          <span className="rt-badge" data-testid="vo-signed">{t.signedUp}</span>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => act(() => volunteerCancel(n.id))} data-testid="vo-cancel">{t.cancelSignup}</button>
        </div>
      ) : full ? (
        <p className="rt-note">{t.full}</p>
      ) : !signedIn ? (
        <a className="ui-btn ui-btn--primary ui-btn--sm" href={loginHref}><Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {t.signup}</a>
      ) : open ? (
        <div className="cb-report">
          <label className="ui-field" htmlFor={`${uid}-n`}>
            <span className="ui-field__label">{t.yourName}</span>
            <input id={`${uid}-n`} className="ui-input" value={name} maxLength={40} autoComplete="name" onChange={(e) => setName(e.target.value)} data-testid="vo-name" />
          </label>
          <label className="cb-check"><input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} data-testid="vo-share" /> <span>{t.shareEmail}</span></label>
          {share && <label className="cb-check cb-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="vo-consent" /> <span>{t.shareConsent}</span></label>}
          <div className="rt-row">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || (share && !consent)} data-testid="vo-confirm"
              onClick={() => act(() => volunteerSignup(n.id, { name: name.trim(), shareEmail: share, ...(share ? { consent: true } : {}) }))}>{t.confirm}</button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setOpen(false)}>{t.cancel}</button>
          </div>
        </div>
      ) : (
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => setOpen(true)} data-testid="vo-signup"><Icon name="plus" className="ui-btn__icon" /> {t.signup}</button>
      )}
      <Msg msg={msg} testId="vo-msg" />
    </li>
  )
}

function ManageSection({ t, lang, onChange }) {
  const uid = useId()
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const load = useCallback(() => getVolunteerManage().then((d) => { setData(d); setErr(null) }).catch((e) => setErr(apiErrCode(e) || 'generic')), [])
  useEffect(() => { load() }, [load])
  const today = new Intl.DateTimeFormat('en-CA').format(new Date())  // brauzerin yerli tarixi
  const empty = { title: '', description: '', date: today, time: '', slots: '3', mosqueName: '', mosqueId: '' }
  const [f, setF] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const slots = Number(f.slots)
  const ready = f.title.trim().length >= 3 && f.mosqueName.trim() && f.date && Number.isInteger(slots) && slots >= 1 && slots <= 50 && (!data?.canPickMosque || f.mosqueId.trim())
  const onSubmit = async (e) => {
    e.preventDefault()
    if (!ready) return
    setBusy(true); setMsg(null)
    try {
      await createVolunteerNeed({
        title: f.title.trim(), description: f.description.trim(), date: f.date, time: f.time, slots, mosqueName: f.mosqueName.trim(),
        ...(data?.canPickMosque ? { mosqueId: f.mosqueId.trim() } : {}),
      })
      setF((x) => ({ ...empty, mosqueName: x.mosqueName, mosqueId: x.mosqueId }))
      setMsg({ tone: 'ok', text: t.posted })
      load(); onChange()
    } catch (er) { setMsg({ tone: 'bad', text: t.err[apiErrCode(er)] || t.err.generic }) } finally { setBusy(false) }
  }
  return (
    <section className="ui-card acc-section" aria-labelledby="vo-manage-title" data-testid="vo-manage">
      <h2 className="acc-section__title" id="vo-manage-title"><Icon name="volunteers" size={18} /> {t.manage}</h2>
      {err === 'no_mosque' ? <p className="rt-note" data-testid="vo-no-mosque">{t.noMosque}</p> : (
        <>
          <p className="rt-note">{t.manageLead}</p>
          <form className="prf-form" onSubmit={onSubmit} noValidate data-testid="vo-form">
            {data?.canPickMosque && (
              <label className="ui-field" htmlFor={`${uid}-mid`}>
                <span className="ui-field__label">{t.nMosqueId}</span>
                <input id={`${uid}-mid`} className="ui-input" dir="ltr" value={f.mosqueId} maxLength={64} onChange={set('mosqueId')} aria-describedby={`${uid}-midh`} />
                <span className="ui-field__hint" id={`${uid}-midh`}>{t.nMosqueIdHint}</span>
              </label>
            )}
            <label className="ui-field" htmlFor={`${uid}-mn`}>
              <span className="ui-field__label">{t.nMosque}</span>
              <input id={`${uid}-mn`} className="ui-input" value={f.mosqueName} maxLength={80} onChange={set('mosqueName')} data-testid="vo-f-mosque" />
            </label>
            <label className="ui-field" htmlFor={`${uid}-t`}>
              <span className="ui-field__label">{t.nTitle}</span>
              <input id={`${uid}-t`} className="ui-input" value={f.title} maxLength={100} onChange={set('title')} data-testid="vo-f-title" />
            </label>
            <div className="cb-coords__row">
              <label className="ui-field" htmlFor={`${uid}-d`}>
                <span className="ui-field__label">{t.nDate}</span>
                <input id={`${uid}-d`} type="date" className="ui-input" min={today} value={f.date} onChange={set('date')} data-testid="vo-f-date" />
              </label>
              <label className="ui-field" htmlFor={`${uid}-tm`}>
                <span className="ui-field__label">{t.nTime}</span>
                <input id={`${uid}-tm`} type="time" className="ui-input" value={f.time} onChange={set('time')} />
              </label>
            </div>
            <label className="ui-field cm-narrow" htmlFor={`${uid}-s`}>
              <span className="ui-field__label">{t.nSlots}</span>
              <input id={`${uid}-s`} type="number" min={1} max={50} inputMode="numeric" className="ui-input ui-num" value={f.slots} onChange={set('slots')} data-testid="vo-f-slots" />
            </label>
            <label className="ui-field" htmlFor={`${uid}-ds`}>
              <span className="ui-field__label">{t.nDesc}</span>
              <textarea id={`${uid}-ds`} className="ui-input" rows={3} maxLength={600} value={f.description} onChange={set('description')} />
            </label>
            <div className="rt-row">
              <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || !ready} data-testid="vo-post"><Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {t.post}</button>
            </div>
            <Msg msg={msg} testId="vo-form-msg" />
          </form>
          {data && data.items.length > 0 && (
            <ul className="rt-list vo-manage__list">
              {data.items.map((n) => (
                <li key={n.id} className="vo-manage__item" data-testid="vo-manage-item">
                  <p className="cb-strong" dir="auto">{n.title} {n.archived && <span className="rt-badge">{t.archived}</span>}</p>
                  <p className="rt-note"><bdi>{n.mosqueName}</bdi> · <span className="ui-num">{fmtDay(n.date, lang)}</span>{n.time && <> · <span className="ui-num" dir="ltr">{n.time}</span></>}</p>
                  <Slots n={n} t={t} />
                  <details className="vo-signups">
                    <summary>{t.signups}</summary>
                    {n.signups.length === 0 ? <p className="rt-note">{t.noSignups}</p> : (
                      <ul data-testid="vo-signups">
                        {n.signups.map((s, i) => <li key={i}><bdi>{s.name}</bdi>{s.email && <> · <a className="ui-link" href={`mailto:${s.email}`} dir="ltr">{s.email}</a></>}</li>)}
                      </ul>
                    )}
                  </details>
                  <Confirm t={{ confirm: t.delConfirm, yes: t.yes, cancel: t.cancel }} label={t.del} icon="trash" testId="vo-del"
                    onYes={() => deleteVolunteerNeed(n.id).then(() => { load(); onChange() }).catch(() => {})} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
