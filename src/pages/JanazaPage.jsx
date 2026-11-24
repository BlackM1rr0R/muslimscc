// ═══════════════════════════════════════════════════════
// /janaza — cənazə elanı (server/janaza.js). Səhifə noindex; gizli keçid: /janaza#n=<token>.
// • Token URL FRAQMENTİNDƏDİR (serverə və Referer-ə getmir), serverə yalnız POST gövdəsində gedir.
// • Keçidlə baxış: mərhumun adı, namazın tarixi/saatı, yer, dəfn yeri, ailənin əlaqəsi + "Dua etdim"
//   (say göstərilmir — yalnız ailə görür) + saytın Hisnul-Müslim məlumatından mərhum üçün dualar
//   (fəsil 56 — cənazə namazında, 60 — dəfndən sonra), mənbələri ilə. Dini mətn burada YAZILMIR.
// • Keçidsiz: ictimai siyahı (ailə istəyib + nəzarətçi təsdiqləyib; namazdan 7 gün sonra çıxır),
//   girişli istifadəçi üçün forma (razılıqla) və "Elanlarım" (say yalnız burada).
// • Sakit dizayn: animasiya, konfetti, parıltı yoxdur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import { useAuthUser, refreshMe } from '../api/userSession'
import { apiErrCode } from '../components/account/communityText'
import VerifyEmailNote from '../components/account/VerifyEmailNote'
import { Msg, Confirm, fmtDay } from '../components/community/CommunityUi'
import { useGuideSources, SpaLink } from '../components/lifeguide/GuideParts'
import { localizeSource } from '../utils/sourceNames'
import { JZ } from '../components/boards/boardsText'
import {
  getPublicJanaza, viewJanaza, janazaDua, getMyJanaza, createJanaza, newJanazaLink, setJanazaPublic, deleteJanaza,
  reportJanaza, readJanazaDuas, markJanazaDua, janazaDuaKey, parseJanazaHash,
} from '../api/communityBoards'
import '../styles/ReadTogether.css'
import '../styles/Account.css'
import '../styles/Community.css'
import '../styles/LessonsPage.css'
import '../styles/CommunityBoards.css'

// Hisnul-Müslim: 56 — cənazə namazında mərhum üçün dua, 60 — dəfndən sonra (public/data/hisn/<dil>.json)
const HISN_JANAZA = [56, 60]
// Brauzerin yerli tarixi (Bakıda 20:00 UTC-dən sonra UTC ilə fərqlənir)
const todayIso = () => new Intl.DateTimeFormat('en-CA').format(new Date())
const shiftDay = (key, n) => new Date(Date.parse(key + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10)

export default function JanazaPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(JZ, lang, 'en')
  // Prerender-də window yoxdur → token yoxdur (ictimai görünüşün qabığı); klientdə fraqment oxunur (HajjTrackerPage kimi)
  const [token, setToken] = useState(() => (typeof window === 'undefined' ? null : parseJanazaHash(window.location.hash)))
  useEffect(() => {
    const on = () => setToken(parseJanazaHash(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return (
    <div className="acc-account cb-page jz-page" data-testid="janaza-page">
      <section className="ui-page-hero">
        <div className="ui-container">
          <p className="ui-eyebrow">{t.eyebrow}</p>
          <h1 className="ui-title">{t.title}</h1>
          {!token && <p className="ui-lead ui-lead--full">{t.lead}</p>}
        </div>
      </section>
      <div className="ui-container cb-layout">
        {token ? <LinkView key={token} token={token} t={t} lang={lang} siteLang={siteLang} /> : <Board t={t} lang={lang} siteLang={siteLang} />}
      </div>
    </div>
  )
}

/** Elanın kartı (keçid görünüşü və ictimai siyahı) — say YOXDUR */
function NoticeCard({ n, t, lang, children, testId = 'jz-card' }) {
  return (
    <article className="ui-card jz-card" data-testid={testId}>
      <p className="jz-card__kicker">{t.prayer}</p>
      <h2 className="jz-card__name" dir="auto" lang={n.lang}>{n.deceased}</h2>
      <dl className="jz-facts">
        <div><dt>{t.date}</dt><dd><span className="ui-num">{fmtDay(n.date, lang)}</span>{n.time && <> · <span className="ui-num" dir="ltr">{n.time}</span></>}</dd></div>
        <div><dt>{t.place}</dt><dd dir="auto">{n.place}{n.city ? <>, <bdi>{n.city}</bdi></> : null}</dd></div>
        {n.burial && <div><dt>{t.burial}</dt><dd dir="auto">{n.burial}</dd></div>}
        {n.contact && <div><dt>{t.contact}</dt><dd dir="auto" data-testid="jz-contact">{n.contact}</dd></div>}
      </dl>
      {children}
    </article>
  )
}

function DuaButton({ refId, t }) {
  const key = janazaDuaKey(refId)
  const [done, setDone] = useState(() => readJanazaDuas().has(key))
  const [busy, setBusy] = useState(false)
  const onDua = async () => {
    setBusy(true)
    try { await janazaDua(refId); markJanazaDua(key); setDone(true) } catch { /* limit / şəbəkə — sakit */ } finally { setBusy(false) }
  }
  return (
    <div className="jz-dua">
      <button type="button" className={`ui-btn ui-btn--sm ${done ? 'ui-btn--secondary' : 'ui-btn--primary'}`} aria-pressed={done} disabled={done || busy} onClick={onDua} data-testid="jz-dua">
        <Icon name={done ? 'check' : 'duas'} className="ui-btn__icon" /> {t.dua}
      </button>
      {done && <p className="rt-note" role="status" data-testid="jz-dua-done">{t.duaDone}</p>}
    </div>
  )
}

function HisnDuas({ t, lang, siteLang }) {
  const src = useGuideSources([], lang, true)
  const hisnBase = pathFor('hisn', siteLang || lang)
  return (
    <section className="ui-card acc-section jz-duas" aria-labelledby="jz-duas-title" data-testid="jz-duas">
      <h2 className="acc-section__title" id="jz-duas-title"><Icon name="duas" size={18} /> {t.duasTitle}</h2>
      <p className="rt-note">{t.duasNote}</p>
      {HISN_JANAZA.map((id) => {
        const ch = src.hisn?.get(id)
        if (!ch) return src.failed ? null : <p key={id} className="rt-note">…</p>
        return (
          <div key={id} className="jz-hisn">
            <h3 className="jz-hisn__title">{ch.title}</h3>
            {ch.items.map((it, i) => (
              <figure key={i} className="ls-dua jz-hisn__item">
                <p className="ls-dua__ar ui-arabic" lang="ar" dir="rtl">{it.ar}</p>
                {lang !== 'ar' && it.text && <p className="ls-dua__text">{it.text}</p>}
                {it.src && <figcaption className="ls-dua__src"><cite dir="auto">{localizeSource(it.src, lang)}</cite></figcaption>}
              </figure>
            ))}
            <p className="jz-hisn__more"><SpaLink href={`${hisnBase}#hs-${id}`} className="ui-link">{ch.title}</SpaLink></p>
          </div>
        )
      })}
    </section>
  )
}

function LinkView({ token, t, lang, siteLang }) {
  const [state, setState] = useState({ status: 'loading', notice: null })
  useEffect(() => {
    let alive = true
    viewJanaza(token).then((r) => { if (alive) setState({ status: 'ok', notice: r.notice }) })
      .catch(() => { if (alive) setState({ status: 'missing', notice: null }) })
    return () => { alive = false }
  }, [token])
  if (state.status === 'loading') return <p className="rt-note">…</p>
  if (state.status === 'missing') {
    return (
      <div className="ui-card dw-empty" data-testid="jz-missing">
        <span className="dw-empty__icon" aria-hidden="true"><Icon name="janaza" size={28} /></span>
        <p className="dw-empty__text">{t.linkMissing}</p>
        <a className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor('janaza', siteLang)}>{t.title}</a>
      </div>
    )
  }
  return (
    <div className="jz-view">
      <NoticeCard n={state.notice} t={t} lang={lang} testId="jz-notice">
        <DuaButton refId={token} t={t} />
      </NoticeCard>
      <HisnDuas t={t} lang={lang} siteLang={siteLang} />
    </div>
  )
}

function Board({ t, lang, siteLang }) {
  const { status } = useAuthUser()
  useEffect(() => { if (status === 'unknown') refreshMe().catch(() => {}) }, [status])
  const signedIn = status === 'user'
  const [items, setItems] = useState(null)
  const [mine, setMine] = useState(null)
  const [link, setLink] = useState(null)   // { id, url }
  useEffect(() => { getPublicJanaza().then((r) => setItems(r.items)).catch(() => setItems([])) }, [])
  const loadMine = useCallback(() => getMyJanaza().then(setMine).catch(() => setMine(null)), [])
  useEffect(() => { if (signedIn) loadMine() }, [signedIn, loadMine])
  const urlOf = (tok) => `${window.location.origin}${pathFor('janaza', siteLang)}#n=${tok}`
  const loginHref = `${pathFor('login', siteLang)}?next=${encodeURIComponent(pathFor('janaza', siteLang))}`

  return (
    <>
      <section className="cb-main" aria-labelledby="jz-public-title" data-testid="jz-public">
        <h2 className="acc-section__title" id="jz-public-title">{t.publicTitle}</h2>
        <p className="cb-hint">{t.publicNote}</p>
        {items && items.length === 0 && <p className="ui-card jz-empty" data-testid="jz-public-empty">{t.publicEmpty}</p>}
        {items && items.length > 0 && (
          <div className="jz-list">
            {items.map((n) => (
              <NoticeCard key={n.id} n={n} t={t} lang={lang}>
                <DuaButton refId={n.id} t={t} />
                <ReportRow id={n.id} t={t} lang={lang} signedIn={signedIn} loginHref={loginHref} />
              </NoticeCard>
            ))}
          </div>
        )}
      </section>
      <aside className="acc-sections cb-side">
        <section className="ui-card acc-section" aria-labelledby="jz-form-title" data-testid="jz-form-section">
          <h2 className="acc-section__title" id="jz-form-title"><Icon name="janaza" size={18} /> {t.formTitle}</h2>
          {signedIn ? (
            <CreateForm t={t} lang={lang} onCreated={(r) => { setLink({ id: r.notice.id, url: urlOf(r.token) }); loadMine() }} />
          ) : (
            <div className="rt-row">
              <p className="rt-note">{t.login}</p>
              <a className="ui-btn ui-btn--primary ui-btn--sm" href={loginHref}><Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {t.loginBtn}</a>
            </div>
          )}
          {link && <LinkBox url={link.url} t={t} />}
        </section>
        {signedIn && mine && mine.items.length > 0 && (
          <section className="ui-card acc-section" aria-labelledby="jz-mine-title" data-testid="jz-mine">
            <h2 className="acc-section__title" id="jz-mine-title">{t.mine}</h2>
            <p className="cb-hint">{t.duasPrivate}</p>
            <ul className="rt-list">
              {mine.items.map((m) => (
                <li key={m.id} className="jz-mine__item">
                  <p className="cb-strong" dir="auto">{m.deceased}</p>
                  <p className="rt-note"><span className="ui-num">{fmtDay(m.date, lang)}</span>{m.time && <> · <span className="ui-num" dir="ltr">{m.time}</span></>} · <bdi>{m.place}</bdi></p>
                  <p className="rt-note" data-testid="jz-mine-duas">{t.duasCount(m.duas)}</p>
                  <p><span className="rt-badge" data-testid="jz-mine-public">{m.expired ? t.expired : t.pub[m.publicStatus]}</span>
                    {m.publicStatus === 'rejected' && m.reason && <span className="rt-note"> — {t.reasons[m.reason] || m.reason}</span>}</p>
                  <div className="rt-row">
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" data-testid="jz-new-link"
                      onClick={() => newJanazaLink(m.id).then((r) => setLink({ id: m.id, url: urlOf(r.token) })).catch(() => {})}>
                      <Icon name="link" size={14} /> {t.newLink}
                    </button>
                    {!m.expired && (
                      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" data-testid="jz-toggle-public"
                        onClick={() => setJanazaPublic(m.id, m.publicStatus === 'none' || m.publicStatus === 'rejected').then(loadMine).catch(() => {})}>
                        {m.publicStatus === 'none' || m.publicStatus === 'rejected' ? t.askPublic : t.stopPublic}
                      </button>
                    )}
                    <Confirm t={{ confirm: t.delConfirm, yes: t.yes, cancel: t.cancel }} label={t.del} icon="trash" testId="jz-del"
                      onYes={() => deleteJanaza(m.id).then(() => { if (link?.id === m.id) setLink(null); loadMine() }).catch(() => {})} />
                  </div>
                  {link?.id === m.id && <p className="cb-hint">{t.newLinkNote}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </>
  )
}

function LinkBox({ url, t }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true) } catch { /* brauzer icazə vermədi */ } }
  const share = async () => { try { await navigator.share({ url }) } catch { /* ləğv */ } }
  return (
    <div className="jz-link" data-testid="jz-link">
      <p className="rt-note">{t.created}</p>
      <input className="ui-input ui-num" dir="ltr" readOnly value={url} onFocus={(e) => e.target.select()} aria-label={t.copy} data-testid="jz-link-url" />
      <div className="rt-row">
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={copy}><Icon name="copy" size={14} /> {copied ? t.copied : t.copy}</button>
        {typeof navigator !== 'undefined' && navigator.share && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={share}><Icon name="share" size={14} /> {t.share}</button>}
      </div>
    </div>
  )
}

function ReportRow({ id, t, lang, signedIn, loginHref }) {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('false_info')
  const [state, setState] = useState(null)
  const send = async () => {
    try { await reportJanaza(id, reason); setState('done') } catch (err) { setState(apiErrCode(err) === 'verify_email' ? 'verify' : null) } finally { setOpen(false) }
  }
  if (state === 'verify') return <VerifyEmailNote lang={lang} testId="jz-report-verify" />
  if (state === 'done') return <p className="rt-note" role="status">{t.reported}</p>
  if (!signedIn) return <a className="ui-btn ui-btn--ghost ui-btn--sm jz-report" href={loginHref}><Icon name="alert" size={14} /> {t.report}</a>
  if (!open) return <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm jz-report" onClick={() => setOpen(true)}><Icon name="alert" size={14} /> {t.report}</button>
  return (
    <div className="rt-row">
      <label className="ui-sr-only" htmlFor={`${uid}-r`}>{t.report}</label>
      <select id={`${uid}-r`} className="ui-select" value={reason} onChange={(e) => setReason(e.target.value)}>
        {Object.keys(t.reportReasons).map((r) => <option key={r} value={r}>{t.reportReasons[r]}</option>)}
      </select>
      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={send}>{t.reportSend}</button>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setOpen(false)}>{t.cancel}</button>
    </div>
  )
}

function CreateForm({ t, lang, onCreated }) {
  const uid = useId()
  const today = todayIso()
  const empty = { deceased: '', date: today, time: '', place: '', city: '', burial: '', contact: '', public: false, consent: false }
  const [f, setF] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [needVerify, setNeedVerify] = useState(false)
  const set = (k) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setF((x) => ({ ...x, [k]: v })) }
  const ready = f.deceased.trim().length >= 2 && f.place.trim() && f.date && f.consent
  const onSubmit = async (e) => {
    e.preventDefault()
    if (!ready) return
    setBusy(true); setMsg(null); setNeedVerify(false)
    try {
      const r = await createJanaza({
        deceased: f.deceased.trim(), date: f.date, time: f.time, place: f.place.trim(), city: f.city.trim(), burial: f.burial.trim(),
        contact: f.contact.trim(), public: f.public, lang: ['az', 'en', 'ru', 'ar', 'tr'].includes(lang) ? lang : 'en',
      })
      setF(empty)
      onCreated(r)
    } catch (err) {
      const c = apiErrCode(err)
      if (c === 'verify_email') setNeedVerify(true)
      else setMsg({ tone: 'bad', text: t.err[c] || t.err.generic })
    } finally { setBusy(false) }
  }
  return (
    <form className="prf-form" onSubmit={onSubmit} noValidate data-testid="jz-form">
      <label className="ui-field" htmlFor={`${uid}-d`}>
        <span className="ui-field__label">{t.deceased}</span>
        <input id={`${uid}-d`} className="ui-input" value={f.deceased} maxLength={80} onChange={set('deceased')} data-testid="jz-deceased" />
      </label>
      <div className="cb-coords__row">
        <label className="ui-field" htmlFor={`${uid}-dt`}>
          <span className="ui-field__label">{t.date}</span>
          <input id={`${uid}-dt`} type="date" className="ui-input" min={shiftDay(today, -2)} max={shiftDay(today, 14)} value={f.date} onChange={set('date')} data-testid="jz-date" />
        </label>
        <label className="ui-field" htmlFor={`${uid}-tm`}>
          <span className="ui-field__label">{t.time}</span>
          <input id={`${uid}-tm`} type="time" className="ui-input" value={f.time} onChange={set('time')} data-testid="jz-time" />
        </label>
      </div>
      <label className="ui-field" htmlFor={`${uid}-p`}>
        <span className="ui-field__label">{t.place}</span>
        <input id={`${uid}-p`} className="ui-input" value={f.place} maxLength={120} onChange={set('place')} data-testid="jz-place" />
      </label>
      <label className="ui-field" htmlFor={`${uid}-c`}>
        <span className="ui-field__label">{t.cityOpt}</span>
        <input id={`${uid}-c`} className="ui-input" value={f.city} maxLength={60} onChange={set('city')} />
      </label>
      <label className="ui-field" htmlFor={`${uid}-b`}>
        <span className="ui-field__label">{t.burialOpt}</span>
        <input id={`${uid}-b`} className="ui-input" value={f.burial} maxLength={120} onChange={set('burial')} />
      </label>
      <label className="ui-field" htmlFor={`${uid}-k`}>
        <span className="ui-field__label">{t.contactOpt}</span>
        <input id={`${uid}-k`} className="ui-input" value={f.contact} maxLength={80} onChange={set('contact')} aria-describedby={`${uid}-kh`} data-testid="jz-contact-input" />
        <span className="ui-field__hint" id={`${uid}-kh`}>{t.contactHint}</span>
      </label>
      <label className="cb-check"><input type="checkbox" checked={f.public} onChange={set('public')} data-testid="jz-public-req" /> <span>{t.wantPublic}</span></label>
      <label className="cb-check cb-consent"><input type="checkbox" checked={f.consent} onChange={set('consent')} data-testid="jz-consent" /> <span>{t.consent}</span></label>
      <div className="rt-row">
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || !ready} data-testid="jz-submit">{t.submit}</button>
      </div>
      {needVerify && <VerifyEmailNote lang={lang} testId="jz-verify" />}
      <Msg msg={msg} testId="jz-msg" />
    </form>
  )
}
