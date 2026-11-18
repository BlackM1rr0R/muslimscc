// ═══════════════════════════════════════════════════════
// /dua-wall — ictimai dua divarı (server/duaWall.js). noindex (istifadəçi məzmunu).
// • Girişli istifadəçi istək göndərir (10–300, istəyə bağlı ad, dil etiketi) → moderator (admin paneli)
//   təsdiqləyəndən sonra divarda 30 gün görünür. Hesab adı / e-poçt heç vaxt göstərilmir.
// • "Dua etdim" — say (girişsiz də; server təkrarı saymır, bu cihaz da yadda saxlayır — mcc_dua_wall_prayed).
// • Şikayət (girişli) — istək yenidən moderasiya növbəsinə düşür.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor, LANGS } from '../seo/routes'
import Icon from '../components/Icon'
import { useAuthUser, refreshMe } from '../api/userSession'
import { DW } from '../components/account/communityText'
import { Msg, fmtMs } from '../components/community/CommunityUi'
import {
  getDuaWall, getMyDuaRequests, submitDuaRequest, deleteDuaRequest, prayDuaRequest, reportDuaRequest, readPrayed, markPrayed,
} from '../api/community'
import '../styles/ReadTogether.css'
import '../styles/Account.css'
import '../styles/Community.css'

const REPORT_REASONS = ['inappropriate', 'personal_info', 'spam', 'other']

function langName(code, ui) {
  try { return new Intl.DisplayNames([ui === 'az' ? 'az-Latn' : ui], { type: 'language' }).of(code) || code } catch { return code }
}

export default function DuaWallPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(DW, lang, 'en')
  const { status } = useAuthUser()
  useEffect(() => { if (status === 'unknown') refreshMe().catch(() => {}) }, [status])
  const signedIn = status === 'user'

  const [filter, setFilter] = useState('')   // '' — bütün dillər
  const [items, setItems] = useState(null)
  const [next, setNext] = useState(null)
  const [prayed, setPrayed] = useState(readPrayed)
  const [mine, setMine] = useState(null)

  const load = useCallback((before = null) => getDuaWall({ lang: filter, before }).then((r) => {
    setItems((cur) => (before && cur ? [...cur, ...r.items] : r.items))
    setNext(r.next)
  }).catch(() => setItems((cur) => cur || [])), [filter])
  useEffect(() => { load() }, [load])
  const loadMine = useCallback(() => getMyDuaRequests().then(setMine).catch(() => setMine(null)), [])
  useEffect(() => { if (signedIn) loadMine() }, [signedIn, loadMine])

  const onPray = async (id) => {
    try {
      const r = await prayDuaRequest(id)
      setPrayed(markPrayed(id))
      setItems((cur) => cur.map((x) => (x.id === id ? { ...x, prayed: r.prayed } : x)))
    } catch { /* limit və ya şəbəkə — sakit */ }
  }

  const loginHref = `${pathFor('login', siteLang)}?next=${encodeURIComponent(pathFor('duawall', siteLang))}`
  return (
    <div className="acc-account dw-page">
      <section className="ui-page-hero">
        <div className="ui-container">
          <p className="ui-eyebrow">{t.eyebrow}</p>
          <h1 className="ui-title">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </section>
      <div className="ui-container dw-layout">
        <div className="acc-sections">
          <section className="ui-card acc-section" aria-labelledby="dw-rules-title">
            <h2 className="acc-section__title" id="dw-rules-title"><Icon name="shield" size={18} /> {t.rulesTitle}</h2>
            <ul className="dw-rules">{t.rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </section>
          <section className="ui-card acc-section" aria-labelledby="dw-form-title" data-testid="dw-form-section">
            <h2 className="acc-section__title" id="dw-form-title"><Icon name="duas" size={18} /> {t.formTitle}</h2>
            {signedIn ? <SubmitForm t={t} lang={lang} siteLang={siteLang} onSent={loadMine} /> : (
              <div className="rt-row">
                <p className="rt-note">{t.login}</p>
                <a className="ui-btn ui-btn--primary ui-btn--sm" href={loginHref}><Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {t.loginBtn}</a>
              </div>
            )}
          </section>
          {signedIn && mine && mine.items.length > 0 && (
            <section className="ui-card acc-section" aria-labelledby="dw-mine-title" data-testid="dw-mine">
              <h2 className="acc-section__title" id="dw-mine-title">{t.mine}</h2>
              <ul className="rt-list">
                {mine.items.map((m) => (
                  <li key={m.id} className="rt-list__item">
                    <span>
                      <span className="cm-pre"><bdi>{m.body}</bdi></span><br />
                      <span className="rt-badge dw-status" data-testid="dw-mine-status">{t.status[m.status] || m.status}</span>
                      {m.status === 'rejected' && m.reason && <span className="rt-note"> — {t.reasons[m.reason] || m.reason}</span>}
                      {m.status === 'approved' && <span className="rt-note"> · {t.count(m.prayed)}</span>}
                    </span>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => deleteDuaRequest(m.id).then(loadMine).catch(() => {})} aria-label={`${t.del}: ${m.body.slice(0, 40)}`}><Icon name="trash" size={14} /></button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <section aria-labelledby="dw-wall-title" data-testid="dw-wall">
          <div className="rt-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 className="acc-section__title" id="dw-wall-title">{t.wall}</h2>
            <div className="rt-row" role="group" aria-label={t.lang}>
              <button type="button" className="ui-chip" aria-pressed={filter === ''} onClick={() => setFilter('')}>{t.all}</button>
              <button type="button" className="ui-chip" aria-pressed={filter === siteLang} onClick={() => setFilter(siteLang)}>{t.onlyLang}</button>
            </div>
          </div>
          {items && items.length === 0 && <p className="rt-note">{t.empty}</p>}
          {items && items.length > 0 && (
            <ul className="dw-grid">
              {items.map((it) => (
                <WallCard key={it.id} it={it} t={t} lang={lang} prayed={prayed.has(it.id)} onPray={() => onPray(it.id)} signedIn={signedIn} loginHref={loginHref} />
              ))}
            </ul>
          )}
          {next && <div className="rt-row" style={{ marginTop: 12 }}><button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => load(next)}>{t.more}</button></div>}
        </section>
      </div>
    </div>
  )
}

function SubmitForm({ t, lang, siteLang, onSent }) {
  const uid = useId()
  const [body, setBody] = useState('')
  const [name, setName] = useState('')
  const [tag, setTag] = useState(siteLang)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const langs = useMemo(() => [...new Set([siteLang, ...LANGS])], [siteLang])
  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      await submitDuaRequest({ body, name: name.trim(), lang: tag })
      setBody(''); setName('')
      setMsg({ tone: 'ok', text: t.sent })
      onSent()
    } catch (err) {
      setMsg({ tone: 'bad', text: t.err[err && err.code] || t.err.generic })
    } finally { setBusy(false) }
  }
  return (
    <form className="prf-form" onSubmit={onSubmit} noValidate>
      <label className="ui-field" htmlFor={`${uid}-b`}>
        <span className="ui-field__label">{t.body}</span>
        <textarea id={`${uid}-b`} className="ui-input" rows={4} minLength={10} maxLength={300} value={body} onChange={(e) => setBody(e.target.value)} data-testid="dw-body" />
        <span className="ui-field__hint ui-num">{[...body].length} / 300</span>
      </label>
      <label className="ui-field" htmlFor={`${uid}-n`}>
        <span className="ui-field__label">{t.name}</span>
        <input id={`${uid}-n`} className="ui-input" value={name} maxLength={30} autoComplete="given-name" onChange={(e) => setName(e.target.value)} aria-describedby={`${uid}-nh`} data-testid="dw-name" />
        <span className="ui-field__hint" id={`${uid}-nh`}>{t.nameHint}</span>
      </label>
      <label className="ui-field cm-narrow" htmlFor={`${uid}-l`}>
        <span className="ui-field__label">{t.lang}</span>
        <select id={`${uid}-l`} className="ui-select" value={tag} onChange={(e) => setTag(e.target.value)} data-testid="dw-lang">
          {langs.map((c) => <option key={c} value={c}>{langName(c, lang)}</option>)}
        </select>
      </label>
      <div className="rt-row">
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || [...body.trim()].length < 10} data-testid="dw-submit"><Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {t.submit}</button>
      </div>
      <Msg msg={msg} testId="dw-msg" />
    </form>
  )
}

function WallCard({ it, t, lang, prayed, onPray, signedIn, loginHref }) {
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState('inappropriate')
  const [done, setDone] = useState(false)
  const uid = useId()
  const send = async () => {
    try { await reportDuaRequest(it.id, reason); setDone(true); setReporting(false) } catch { setReporting(false) }
  }
  return (
    <li className="ui-card dw-card" data-testid="dw-card">
      <p className="dw-card__body" lang={it.lang} dir="auto">{it.body}</p>
      <p className="dw-card__who"><bdi>{it.name || t.anon}</bdi> · {fmtMs(it.at, lang)}</p>
      <div className="dw-card__row">
        <button type="button" className={`ui-btn ui-btn--sm ${prayed ? 'ui-btn--secondary' : 'ui-btn--primary'}`} aria-pressed={prayed} disabled={prayed} onClick={onPray} data-testid="dw-pray">
          <Icon name={prayed ? 'check' : 'duas'} className="ui-btn__icon" /> {prayed ? t.prayed : t.pray}
        </button>
        <span className="dw-count ui-num" data-testid="dw-count">{t.count(it.prayed)}</span>
      </div>
      {done ? <p className="rt-note" role="status">{t.reported}</p> : reporting ? (
        <div className="rt-row">
          <label className="ui-sr-only" htmlFor={`${uid}-r`}>{t.report}</label>
          <select id={`${uid}-r`} className="ui-select" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REPORT_REASONS.map((r) => <option key={r} value={r}>{t.reportReasons[r]}</option>)}
          </select>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={send}>{t.reportSend}</button>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setReporting(false)}>{t.cancel}</button>
        </div>
      ) : signedIn ? (
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setReporting(true)}><Icon name="alert" size={14} /> {t.report}</button>
      ) : (
        <a className="ui-btn ui-btn--ghost ui-btn--sm" href={loginHref}><Icon name="alert" size={14} /> {t.report}</a>
      )}
    </li>
  )
}
