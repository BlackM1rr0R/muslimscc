// ═══════════════════════════════════════════════════════
// /together — qrup çağırışının lövhəsi və müəllim sinfi (server/challenges.js, server/classes.js). noindex.
//
//   #c=<id>       — çağırışın lövhəsi          #cj=<token> — çağırışa qoşul (dəvət)
//   #k=<id>       — sinif                      #kj=<token> — sinfə qoşul (dəvət)
//   #…&invite=<t> — yenicə yaradılmış dəvət keçidi (sahib üçün bir dəfə göstərilir, sonra URL-dən silinir)
// Tokenlər URL FRAQMENTİNDƏDİR (serverə və nginx loguna getmir), serverə gövdədə gedir.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import { useAuthUser, refreshMe } from '../api/userSession'
import { previewChallenge, joinChallenge, previewClass, joinClass } from '../api/together'
import { TG, tgError } from '../components/together/togetherText'
import { challengeName, fmtDay } from '../components/together/tgUi'
import ChallengeBoard from '../components/together/ChallengeBoard'
import ClassView from '../components/together/ClassView'
import '../styles/ReadTogether.css'
import '../styles/Account.css'
import '../styles/Together.css'

const TOKEN = /^[A-Za-z0-9_-]{43}$/
/** '#c=12&invite=…' → { c, k, cj, kj, invite } */
export function parseTogetherHash(hash) {
  const out = {}
  for (const part of String(hash || '').replace(/^#/, '').split('&')) {
    const [k, v = ''] = part.split('=')
    if ((k === 'c' || k === 'k') && /^\d{1,12}$/.test(v)) out[k] = Number(v)
    if ((k === 'cj' || k === 'kj' || k === 'invite') && TOKEN.test(v)) out[k] = v
  }
  return out
}
const readHash = () => (typeof window === 'undefined' ? {} : parseTogetherHash(window.location.hash))

export default function TogetherPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(TG, lang, 'en')
  const { status } = useAuthUser()
  const [h, setH] = useState(readHash)
  const [invite] = useState(() => readHash().invite || null)
  useEffect(() => { if (status === 'unknown') refreshMe().catch(() => {}) }, [status])
  useEffect(() => {
    const on = () => setH(readHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  // Yeni dəvət tokeni URL-də qalmasın (tarixçə, ekran görüntüsü)
  useEffect(() => {
    if (!invite) return
    const keep = h.c ? `#c=${h.c}` : h.k ? `#k=${h.k}` : ''
    try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search + keep) } catch { /* */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite])

  const account = pathFor('account', siteLang)
  const go = (hash) => { try { window.history.replaceState(window.history.state, '', window.location.pathname + hash) } catch { /* */ } setH(parseTogetherHash(hash)) }

  let body
  if (status === 'anon') {
    const next = `${pathFor('together', siteLang)}${typeof window === 'undefined' ? '' : window.location.hash}`
    body = (
      <div className="ui-card acc-section" data-testid="tg-signin">
        <p>{t.page.signIn}</p>
        <a className="ui-btn ui-btn--primary ui-btn--sm" href={`${pathFor('login', siteLang)}?next=${encodeURIComponent(next)}`}><Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {t.page.signInBtn}</a>
      </div>
    )
  } else if (status !== 'user') {
    body = <div className="spinner-wrap" role="status"><div className="spinner" /><span className="ui-sr-only">{t.common.loading}</span></div>
  } else if (h.cj) {
    body = <JoinChallenge key={h.cj} token={h.cj} t={t} lang={lang} onJoined={(id) => go(`#c=${id}`)} />
  } else if (h.kj) {
    body = <JoinClass key={h.kj} token={h.kj} t={t} onJoined={(id) => go(`#k=${id}`)} />
  } else if (h.c) {
    body = <ChallengeBoard key={`c${h.c}`} id={h.c} t={t} lang={lang} siteLang={siteLang} initialToken={invite} onGone={() => window.location.assign(`${account}#challenges`)} />
  } else if (h.k) {
    body = <ClassView key={`k${h.k}`} id={h.k} t={t} lang={lang} siteLang={siteLang} initialToken={invite} onGone={() => window.location.assign(`${account}#classes`)} />
  } else {
    body = <p className="rt-note" data-testid="tg-empty">{t.page.noHash}</p>
  }

  return (
    <div className="acc-account tg-page">
      <section className="ui-page-hero">
        <div className="ui-container ui-container--narrow">
          <p className="ui-eyebrow">{t.page.title}</p>
          <h1 className="ui-title">{h.k || h.kj ? t.cls.title : t.ch.title}</h1>
          <p className="ui-lead">{t.page.lead}</p>
        </div>
      </section>
      <div className="ui-container ui-container--narrow acc-sections">
        {body}
        <p><a className="ui-btn ui-btn--ghost ui-btn--sm" href={account}><Icon name="arrow" className="ui-btn__icon ui-flip-rtl" /> {t.page.back}</a></p>
      </div>
    </div>
  )
}

function JoinChallenge({ token, t, lang, onJoined }) {
  const [p, setP] = useState(null)
  const [err, setErr] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { previewChallenge(token).then(setP).catch((e) => setErr(tgError(e, t))) }, [token, t])
  if (err && !p) return <p className="rt-msg" role="alert" data-testid="tg-join-error">{err}</p>
  if (!p) return <div className="spinner-wrap" role="status"><div className="spinner" /><span className="ui-sr-only">{t.common.loading}</span></div>
  const c = p.challenge
  const join = async () => {
    if (!p.already && !consent) { setErr(t.common.consentNeed); return }
    setBusy(true); setErr('')
    try { const r = await joinChallenge(token); onJoined(r.id) } catch (e) { setErr(tgError(e, t)) } finally { setBusy(false) }
  }
  return (
    <section className="ui-card acc-section" aria-labelledby="tg-join-title" data-testid="ch-join">
      <h2 className="acc-section__title" id="tg-join-title">{t.ch.joinTitle}</h2>
      <p><strong><bdi>{challengeName(c, t)}</bdi></strong></p>
      <p className="rt-note">{t.ch.range(fmtDay(c.startOn, lang), fmtDay(c.endOn, lang))} · {t.ch.days(c.days)} · {t.ch.members(c.members)}</p>
      <p className="rt-note">{t.ch.boardNote}</p>
      {p.already ? <p className="rt-note">{t.ch.already}</p> : (
        <label className="acc-check" htmlFor="tg-join-consent">
          <input id="tg-join-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="ch-join-consent" />
          <span>{t.ch.consent}</span>
        </label>
      )}
      {err && <p className="rt-msg" role="alert">{err}</p>}
      <div><button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} onClick={join} data-testid="ch-join-btn"><Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {p.already ? t.ch.open : t.ch.joinBtn}</button></div>
    </section>
  )
}

function JoinClass({ token, t, onJoined }) {
  const [p, setP] = useState(null)
  const [err, setErr] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { previewClass(token).then(setP).catch((e) => setErr(tgError(e, t))) }, [token, t])
  if (err && !p) return <p className="rt-msg" role="alert" data-testid="tg-join-error">{err}</p>
  if (!p) return <div className="spinner-wrap" role="status"><div className="spinner" /><span className="ui-sr-only">{t.common.loading}</span></div>
  if (p.teacher) return <p className="rt-msg" role="alert">{t.err.self}</p>
  const join = async () => {
    setBusy(true); setErr('')
    try { const r = await joinClass(token, consent); onJoined(r.id) } catch (e) { setErr(tgError(e, t)) } finally { setBusy(false) }
  }
  return (
    <section className="ui-card acc-section" aria-labelledby="tg-kjoin-title" data-testid="cls-join">
      <h2 className="acc-section__title" id="tg-kjoin-title">{t.cls.joinTitle}</h2>
      <p><bdi>{t.cls.joinLead(p.class.name, p.class.teacher)}</bdi></p>
      <p className="rt-note">{t.cls.students(p.class.students)}</p>
      {p.already ? <p className="rt-note">{t.cls.already}</p> : (
        <label className="acc-check" htmlFor="tg-kjoin-consent">
          <input id="tg-kjoin-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="cls-join-consent" />
          <span>{t.cls.consent}</span>
        </label>
      )}
      {err && <p className="rt-msg" role="alert">{err}</p>}
      <div><button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} onClick={join} data-testid="cls-join-btn"><Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {p.already ? t.cls.open : t.cls.joinBtn}</button></div>
    </section>
  )
}
