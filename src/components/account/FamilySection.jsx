// ═══════════════════════════════════════════════════════
// /account → "Ailə dairəsi" (server/family.js): dairə, dəvət keçidi (#family=<token>), üzvlər,
// ailə lövhəsi (hər kəs öz seçdiyi xülasə rəqəmlərini paylaşır — utils/familyStats, bu cihazda
// hesablanır), təşviq kartları (yalnız şablon). Yeni kart — yumşaq bildiriş (toast) + siyahı.
// AccountPage bu faylı tənbəl yükləyir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import {
  getFamily, createCircle, leaveOrDelete, createInvite, revokeInvite, previewJoin, joinCircle, removeMember,
  putShare, stopShare, sendCard, markSeen, deleteCard, familyLink, readFamilyToken,
} from '../../api/familyCircle'
import { computeFamilyStats, sharePayload, STAT_FIELDS } from '../../utils/familyStats'
import { activeProfile } from '../../utils/profiles'
import { FAM, CARDS, CARD_N, famError } from './familyText'
import CopyLink from '../readroom/CopyLink'
import '../../styles/ReadTogether.css'

const fmtDate = (ms, lang) => { try { return new Date(ms).toLocaleDateString(lang === 'az' ? 'az-Latn-AZ' : lang, { dateStyle: 'medium' }) } catch { return new Date(ms).toISOString().slice(0, 10) } }
const nf = (n, lang) => { try { return new Intl.NumberFormat(lang === 'az' ? 'az-Latn-AZ' : lang).format(n) } catch { return String(n) } }
const TEMPLATES = ['mashallah', 'letters', 'quran', 'prayer', 'story', 'hifz', 'dua', 'proud']

function Confirm({ t, label, onYes, danger = true, testId }) {
  const [ask, setAsk] = useState(false)
  if (!ask) return <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(true)} data-testid={testId}>{label}</button>
  return (
    <span className="rt-confirm">
      <span>{t.confirm}</span>
      <button type="button" className={`ui-btn ui-btn--sm${danger ? ' acc-btn-danger' : ' ui-btn--primary'}`} onClick={() => { setAsk(false); onYes() }}>{t.yes}</button>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(false)}>{t.cancel}</button>
    </span>
  )
}

export default function FamilySection({ lang, siteLang }) {
  const t = pickUi(FAM, lang, 'en')
  const C = pickUi(CARDS, lang, 'en')
  const [data, setData] = useState(null)
  const [msg, setMsg] = useState(null)        // { tone, text }
  const [busy, setBusy] = useState(false)
  const [invite, setInvite] = useState(null)  // { token }
  const [join, setJoin] = useState(null)      // { token, ownerLabel, inCircle }
  const [toast, setToast] = useState(false)

  const load = useCallback(() => getFamily().then((d) => {
    setData(d)
    const unseen = (d.cards || []).filter((c) => !c.seen)
    if (unseen.length) {
      setToast(true)
      markSeen(unseen.map((c) => c.id)).catch(() => {})
    }
    return d
  }).catch(() => setData({ circle: null, cards: [], share: null, consent: false })), [])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (!toast) return undefined; const id = setTimeout(() => setToast(false), 9000); return () => clearTimeout(id) }, [toast])

  // Dəvət keçidi: /account#family=<token>
  useEffect(() => {
    const check = () => {
      const token = readFamilyToken(window.location.hash)
      if (!token) return
      previewJoin(token).then((p) => setJoin({ token, ...p })).catch((e) => setMsg({ tone: 'bad', text: famError(e, t) }))
    }
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = async (fn, okText) => {
    setBusy(true); setMsg(null)
    try { await fn(); if (okText) setMsg({ tone: 'ok', text: okText }); await load(); return true } catch (e) { setMsg({ tone: 'bad', text: famError(e, t) }); return false } finally { setBusy(false) }
  }
  const clearHash = () => { try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search) } catch { /* */ } }

  const circle = data?.circle
  const isOwner = circle?.role === 'owner'
  const accountPath = pathFor('account', siteLang)

  return (
    <section className="ui-card acc-section" aria-labelledby="fam-title" id="family" data-testid="family-section">
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name="group" size={20} /></span>
        <div>
          <h2 className="acc-section__title" id="fam-title">{t.title}</h2>
          <p className="acc-section__lead">{t.lead}</p>
        </div>
      </header>

      {join && !join.same && (
        <div className="prf-form" data-testid="family-join">
          <p className="rt-card__title">{t.joinTitle}</p>
          <p><bdi>{t.joinLead(join.ownerLabel)}</bdi></p>
          {join.inCircle ? <p className="rt-msg">{t.err.inCircle}</p> : (
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy}
              onClick={async () => { if (await run(() => joinCircle(join.token), t.joined)) { setJoin(null); clearHash() } }}>
              <Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {t.join}
            </button>
          )}
        </div>
      )}

      {data && !circle && (
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} onClick={() => run(createCircle)} data-testid="family-create">
          <Icon name="plus" className="ui-btn__icon" /> {t.create}
        </button>
      )}

      {circle && (
        <>
          <h3 className="rt-card__title">{t.members}</h3>
          <ul className="fam-members" data-testid="family-members">
            {circle.members.map((m) => (
              <li key={m.id} className="fam-member">
                <div className="fam-member__head">
                  <span className="fam-member__who"><bdi>{m.label}</bdi>{m.self ? ` (${t.you})` : ''} <span className="rt-badge">{m.role === 'owner' ? t.owner : t.member}</span></span>
                  {isOwner && !m.self && <Confirm t={t} label={t.removeMember} onYes={() => run(() => removeMember(m.id))} />}
                </div>
                {m.share && m.share.fields.length ? (
                  <dl className="fam-stats">
                    {m.share.fields.map((f) => (
                      <div key={f} className="fam-stat"><dt>{t.fields[f]}</dt><dd className="ui-num">{nf(m.share.stats[f] || 0, lang)}</dd></div>
                    ))}
                  </dl>
                ) : <p className="rt-note">{t.notShared}</p>}
                {m.share && <p className="rt-note">{t.updated(fmtDate(m.share.updatedAt, lang))}</p>}
              </li>
            ))}
          </ul>

          {isOwner && (
            <div className="prf-form">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy} data-testid="family-invite"
                onClick={() => run(async () => { const r = await createInvite(); setInvite(r) })}>
                <Icon name="link" className="ui-btn__icon" /> {t.invite}
              </button>
              <p className="rt-note">{t.inviteNote}</p>
              {invite && <CopyLink link={familyLink(window.location.origin, accountPath, invite.token)} label={t.inviteLink} copyText={t.copy} copiedText={t.copied} shareText={t.share} title={t.title} testId="family-invite-link" />}
              {circle.invites.length > 0 && (
                <>
                  <p className="rt-note"><strong>{t.openInvites}</strong></p>
                  <ul className="rt-list">
                    {circle.invites.map((i) => (
                      <li key={i.id} className="rt-list__item">
                        <span>{t.until(fmtDate(i.expiresAt, lang))}</span>
                        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => run(() => revokeInvite(i.id))}>{t.revoke}</button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <ShareBox t={t} lang={lang} data={data} busy={busy} run={run} />
          {circle.members.length > 1 && <CardSender t={t} C={C} circle={circle} busy={busy} run={run} />}
        </>
      )}

      {data && (
        <>
          <h3 className="rt-card__title">{t.inbox}</h3>
          {data.cards.length === 0 ? <p className="rt-note">{t.none}</p> : (
            <ul className="fam-cards" data-testid="family-cards">
              {data.cards.map((c) => (
                <li key={c.id} className={`fam-card${c.seen ? '' : ' is-new'}`}>
                  <p className="fam-card__text">{(C[c.template] || C.mashallah)(c.n)}</p>
                  <p className="fam-card__from"><bdi>{t.from(c.from)}</bdi> · {fmtDate(c.createdAt, lang)}</p>
                  <div><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => run(() => deleteCard(c.id))} aria-label={`${t.del}: ${(C[c.template] || C.mashallah)(c.n)}`}><Icon name="trash" size={14} /></button></div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {circle && (
        <div className="rt-row">
          {isOwner
            ? <Confirm t={t} label={t.dissolve} onYes={() => run(leaveOrDelete)} testId="family-dissolve" />
            : <Confirm t={t} label={t.leave} onYes={() => run(leaveOrDelete)} testId="family-leave" />}
        </div>
      )}

      {msg && <p className={`rt-msg acc-msg--${msg.tone}`} role={msg.tone === 'bad' ? 'alert' : 'status'}>{msg.text}</p>}
      {toast && (
        <div className="fam-toast" role="status" data-testid="family-toast">
          <Icon name="gift" size={20} /> <span>{t.newCard}</span>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setToast(false)} aria-label={t.close}><Icon name="close" size={14} /></button>
        </div>
      )}
    </section>
  )
}

function ShareBox({ t, lang, data, busy, run }) {
  const stats = useMemo(() => computeFamilyStats(), [])
  const profile = activeProfile()
  const [fields, setFields] = useState(() => data.share?.fields || ['quranDaysWeek', 'storybooksRead'])
  const [consent, setConsent] = useState(false)
  const [err, setErr] = useState('')
  const toggle = (f) => setFields((l) => (l.includes(f) ? l.filter((x) => x !== f) : [...l, f]))
  const save = () => {
    if (!data.consent && !consent) { setErr(t.consentNeed); return }
    setErr('')
    run(() => putShare(sharePayload(fields, stats), !data.consent), t.shared)
  }
  return (
    <div className="prf-form" data-testid="family-share">
      <p className="rt-card__title">{t.shareTitle}</p>
      <p className="rt-note">{t.shareLead}</p>
      {profile && <p className="rt-note"><bdi>{t.fromProfile(profile.name)}</bdi></p>}
      <fieldset className="fam-fields">
        <legend className="ui-sr-only">{t.shareTitle}</legend>
        {STAT_FIELDS.map((f) => (
          <label key={f} className="rt-switch">
            <input type="checkbox" checked={fields.includes(f)} onChange={() => toggle(f)} data-testid={`family-field-${f}`} />
            <span>{t.fields[f]}: <strong className="ui-num">{nf(stats[f], lang)}</strong></span>
          </label>
        ))}
      </fieldset>
      {!data.consent && (
        <label className="acc-check" htmlFor="fam-consent">
          <input id="fam-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="family-consent" />
          <span>{t.consent}</span>
        </label>
      )}
      {err && <p className="rt-msg" role="alert">{err}</p>}
      <div className="rt-row">
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} onClick={save} data-testid="family-share-save"><Icon name="share" className="ui-btn__icon" /> {t.save}</button>
        {data.share && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(stopShare, t.stopped)}>{t.stop}</button>}
      </div>
    </div>
  )
}

function CardSender({ t, C, circle, busy, run }) {
  const others = circle.members.filter((m) => !m.self)
  const [to, setTo] = useState(others[0]?.id || '')
  const [tpl, setTpl] = useState('mashallah')
  const [n, setN] = useState('')
  const send = (e) => {
    e.preventDefault()
    const num = CARD_N.has(tpl) && /^\d{1,3}$/.test(n) && Number(n) > 0 ? Number(n) : undefined
    run(() => sendCard(Number(to), tpl, num), t.sent)
  }
  return (
    <form className="prf-form" onSubmit={send} data-testid="family-card-form">
      <p className="rt-card__title"><Icon name="gift" size={18} /> {t.cardsTitle}</p>
      <label className="ui-field" htmlFor="fam-to">
        <span className="ui-field__label">{t.to}</span>
        <select id="fam-to" className="ui-select" value={to} onChange={(e) => setTo(e.target.value)}>
          {others.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </label>
      <label className="ui-field" htmlFor="fam-tpl">
        <span className="ui-field__label">{t.card}</span>
        <select id="fam-tpl" className="ui-select" value={tpl} onChange={(e) => setTpl(e.target.value)} data-testid="family-card-template">
          {TEMPLATES.map((k) => <option key={k} value={k}>{C[k](CARD_N.has(k) && n ? Number(n) : undefined)}</option>)}
        </select>
      </label>
      {CARD_N.has(tpl) && (
        <label className="ui-field" htmlFor="fam-n">
          <span className="ui-field__label">{t.n}</span>
          <input id="fam-n" className="ui-input ui-num rt-page-input" type="number" inputMode="numeric" min={1} max={999} value={n} onChange={(e) => setN(e.target.value)} />
        </label>
      )}
      <p className="rt-note">{t.cardsNote}</p>
      <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || !to} data-testid="family-card-send"><Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {t.send}</button>
    </form>
  )
}
