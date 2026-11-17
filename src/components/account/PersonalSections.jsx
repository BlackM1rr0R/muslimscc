// ═══════════════════════════════════════════════════════
// /account — şəxsi xatırlatmalar (server/personal.js): "Gələcək məktublarım", "Sevdiklərim üçün dua",
// "Zəkat xatırlatması" + serverdəki məlumat (push bu cihaza, hamısını sil).
// Bu məlumat SERVERDƏ ŞİFRƏSİZDİR (vaxtında göndərmək üçün) — ilk istifadədə açıq razılıq (ConsentBox).
// AccountPage bu faylı tənbəl yükləyir. #follow=<token> (ailə paylaşma keçidi) burada oxunur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../Icon'
import { AuthMessage } from './AuthUi'
import { pathFor } from '../../seo/routes'
import {
  MAX_LETTER, MAX_NAME, MAX_RELATION, MAX_NOTE,
  listLetters, createLetter, updateLetter, deleteLetter,
  listLoved, createLoved, updateLoved, deleteLoved, createShare, revokeShare, removeFollower,
  previewFollow, follow, unfollow, setLovedEmail,
  getZakatReminder, deleteZakatReminder,
  thisDeviceEndpoint, pushLinkStatus, setPushLink, wipePersonal, followLink, readFollowToken, browserTz,
} from '../../api/personal'
import { LETTER_KINDS, letterDeliverOn, localKey, nextAnniversary, loadZakatArchive, removeZakatArchive } from '../../utils/personalDates'
import { ConsentBox, ArchiveTable, usePersonalText, usePersonalAction, fmtKey, fmtHijriKey, fmtMs } from '../personal/PersonalUi'

function Section({ icon, title, lead, id, anchor, children }) {
  return (
    <section className="ui-card acc-section pr-section" aria-labelledby={id} id={anchor}>
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name={icon} size={20} /></span>
        <div>
          <h2 className="acc-section__title" id={id}>{title}</h2>
          {lead && <p className="acc-section__lead">{lead}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

function DeleteButton({ t, label, onConfirm, busy }) {
  const [ask, setAsk] = useState(false)
  if (ask) {
    return (
      <span className="pr-confirm">
        <span className="acc-confirm-q">{t.confirmDel}</span>
        <button type="button" className="ui-btn ui-btn--sm acc-btn-danger" disabled={busy} onClick={() => { setAsk(false); onConfirm() }}>{t.yes}</button>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(false)}>{t.cancel}</button>
      </span>
    )
  }
  return (
    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => setAsk(true)} aria-label={`${t.del}: ${label}`}>
      <Icon name="trash" className="ui-btn__icon" /> {t.del}
    </button>
  )
}

export default function PersonalSections({ emailVerified = true }) {
  return (
    <>
      <LettersSection emailVerified={emailVerified} />
      <LovedSection emailVerified={emailVerified} />
      <ZakatSection />
      <PersonalDataSection />
    </>
  )
}

// ═══ C1. Gələcək məktublarım ═══
function LettersSection({ emailVerified }) {
  const { t, lang } = usePersonalText()
  const L = t.letters
  const a = usePersonalAction(t)
  const [data, setData] = useState(null)
  const [body, setBody] = useState('')
  const [kind, setKind] = useState('date')
  const [date, setDate] = useState('')
  const [birth, setBirth] = useState('')
  const [consent, setConsent] = useState(false)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(() => new Set())

  const reload = useCallback(() => listLetters().then(setData).catch(() => setData({ letters: [], consent: false, error: true })), [])
  useEffect(() => { reload() }, [reload])

  const today = localKey(new Date())
  const deliverOn = letterDeliverOn(kind, { date, birth })
  const pending = (data?.letters || []).filter((x) => x.status === 'pending')
  const done = (data?.letters || []).filter((x) => x.status !== 'pending')
  const needConsent = data && !data.consent

  const reset = () => { setBody(''); setKind('date'); setDate(''); setBirth(''); setEditing(null) }
  const onSubmit = async (e) => {
    e.preventDefault()
    if (!deliverOn) { a.show('bad', t.err.date); return }
    if (needConsent && !consent) { a.show('bad', t.consentNeed); return }
    const ok = await a.run(async () => {
      if (editing) await updateLetter(editing, { body, deliverOn, kind, tz: browserTz(), lang })
      else await createLetter({ body, deliverOn, kind, lang, consent: needConsent ? consent : false })
      await reload()
    }, editing ? L.updated : L.created)
    if (ok) reset()
  }
  const onEdit = (x) => {
    setEditing(x.id); setBody(x.body); setKind('date'); setDate(x.deliverOn)
    document.getElementById('pr-letter-body')?.focus()
  }
  const toggle = (id) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <Section icon="mail" title={L.title} lead={L.lead} id="acc-letters" anchor="letters">
      {!emailVerified && <p className="pr-hint"><Icon name="info" size={14} /> {t.verifyEmail}</p>}
      <form className="acc-form pr-form" onSubmit={onSubmit} noValidate data-testid="letter-form">
        <div className="ui-field">
          <label className="ui-field__label" htmlFor="pr-letter-body">{L.label}</label>
          <textarea id="pr-letter-body" className="ui-input pr-textarea" rows={5} maxLength={MAX_LETTER} dir="auto" value={body}
            placeholder={L.ph} onChange={(e) => setBody(e.target.value)} aria-describedby="pr-letter-count" />
          <span className="ui-field__hint pr-count" id="pr-letter-count">{L.count(body.length, MAX_LETTER)}</span>
        </div>
        <div className="ui-field">
          <span className="ui-field__label" id="pr-letter-when">{L.when}</span>
          <div className="pr-chips" role="group" aria-labelledby="pr-letter-when">
            {LETTER_KINDS.map((k) => (
              <button key={k} type="button" className="ui-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{L.kinds[k]}</button>
            ))}
          </div>
        </div>
        {kind === 'date' && (
          <div className="ui-field">
            <label className="ui-field__label" htmlFor="pr-letter-date">{L.dateLabel}</label>
            <input id="pr-letter-date" type="date" className="ui-input pr-date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}
        {kind === 'birthday' && (
          <div className="ui-field">
            <label className="ui-field__label" htmlFor="pr-letter-birth">{L.birthLabel}</label>
            <input id="pr-letter-birth" type="date" className="ui-input pr-date" max={today} value={birth} onChange={(e) => setBirth(e.target.value)} />
          </div>
        )}
        {deliverOn && <p className="pr-preview" data-testid="letter-arrives"><Icon name="calendar" size={14} /> {L.arrives(fmtKey(deliverOn, lang))}</p>}
        {needConsent && !editing && <ConsentBox t={t} checked={consent} onChange={setConsent} id="pr-letter-consent" />}
        <div className="acc-row">
          <button type="submit" className="ui-btn ui-btn--primary" disabled={a.busy || !body.trim() || !deliverOn || (needConsent && !editing && !consent)}>
            <Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {a.busy ? t.busy : (editing ? t.save : L.create)}
          </button>
          {editing && <button type="button" className="ui-btn ui-btn--ghost" onClick={reset}>{t.cancel}</button>}
        </div>
      </form>
      <AuthMessage msg={a.msg} />

      {data === null ? <div className="spinner-wrap"><div className="spinner" /></div> : (
        <>
          <h3 className="pr-subtitle">{L.pending}</h3>
          {pending.length === 0 ? <p className="acc-empty">{L.empty}</p> : (
            <ul className="acc-list" data-testid="letters-pending">
              {pending.map((x) => (
                <li key={x.id} className="acc-list__item pr-item">
                  <span className="ui-icon-tile ui-icon-tile--sm ui-icon-tile--neutral"><Icon name="mail" size={16} /></span>
                  <div className="acc-list__main">
                    <strong>{L.sealed(fmtKey(x.deliverOn, lang))}</strong>
                    <span className="acc-list__meta">{L.writtenOn(fmtMs(x.createdAt, lang))}</span>
                    {open.has(x.id) && <blockquote className="pr-letter" dir="auto">{x.body}</blockquote>}
                  </div>
                  <div className="acc-list__actions">
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" aria-expanded={open.has(x.id)} onClick={() => toggle(x.id)}>
                      <Icon name="eye" className="ui-btn__icon" /> {open.has(x.id) ? L.hide : L.openNow}
                    </button>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => onEdit(x)}><Icon name="edit" className="ui-btn__icon" /> {t.edit}</button>
                    <DeleteButton t={t} label={fmtKey(x.deliverOn, lang)} busy={a.busy}
                      onConfirm={() => a.run(async () => { await deleteLetter(x.id); await reload() }, L.deleted)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {done.length > 0 && (
            <>
              <h3 className="pr-subtitle">{L.archive}</h3>
              <ul className="acc-list" data-testid="letters-delivered">
                {done.map((x) => (
                  <li key={x.id} className="acc-list__item pr-item">
                    <span className="ui-icon-tile ui-icon-tile--sm ui-icon-tile--neutral"><Icon name={x.status === 'failed' ? 'alert' : 'check'} size={16} /></span>
                    <div className="acc-list__main">
                      <details className="pr-details">
                        <summary><strong>{L.deliveredOn(fmtKey(x.deliverOn, lang))}</strong></summary>
                        <blockquote className="pr-letter" dir="auto">{x.body}</blockquote>
                      </details>
                      <span className="acc-list__meta">{x.status === 'failed' ? L.failed : L.writtenOn(fmtMs(x.createdAt, lang))}</span>
                    </div>
                    <div className="acc-list__actions">
                      <DeleteButton t={t} label={fmtKey(x.deliverOn, lang)} busy={a.busy}
                        onConfirm={() => a.run(async () => { await deleteLetter(x.id); await reload() }, L.deleted)} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Section>
  )
}

// ═══ C2. Sevdiklərim üçün dua ═══
const EMPTY_LOVED = { name: '', relation: '', passedOn: '', calendar: 'g', friday: false, note: '' }

function LovedSection({ emailVerified }) {
  const { t, lang, siteLang } = usePersonalText()
  const L = t.loved
  const a = usePersonalAction(t)
  const [data, setData] = useState(null)
  const [form, setForm] = useState(EMPTY_LOVED)
  const [consent, setConsent] = useState(false)
  const [editing, setEditing] = useState(null)
  const [link, setLink] = useState('')
  const [invite, setInvite] = useState(null)          // { token, ownerLabel, count, self, following }
  const [inviteConsent, setInviteConsent] = useState(false)

  const reload = useCallback(() => listLoved().then(setData).catch(() => setData({ items: [], following: [], share: { active: false, followers: [] }, consent: false })), [])
  useEffect(() => { reload() }, [reload])

  // Ailə paylaşma keçidi: /account#follow=<token>
  useEffect(() => {
    const check = () => {
      const token = readFollowToken(window.location.hash)
      if (!token) return
      previewFollow(token).then((p) => setInvite({ ...p, token })).catch(() => a.show('bad', t.err.token))
    }
    check()
    window.addEventListener('hashchange', check)       // keçid artıq açıq hesab səhifəsində açılanda
    return () => window.removeEventListener('hashchange', check)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const clearHash = () => { try { window.history.replaceState(null, '', window.location.pathname + window.location.search) } catch { /* */ } }

  const today = localKey(new Date())
  const needConsent = data && !data.consent
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const duaHref = `${pathFor('learn', siteLang, 'janazah')}#ls-prayer`
  const accountPath = pathFor('account', siteLang)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { a.show('bad', t.err.name); return }
    if (!form.passedOn || form.passedOn > today) { a.show('bad', t.err.date); return }
    if (needConsent && !consent) { a.show('bad', t.consentNeed); return }
    const ok = await a.run(async () => {
      if (editing) await updateLoved(editing, form)
      else await createLoved(form, { lang, consent: needConsent ? consent : false })
      await reload()
    }, editing ? L.saved : L.added)
    if (ok) { setForm(EMPTY_LOVED); setEditing(null) }
  }
  const onEdit = (x) => {
    setEditing(x.id)
    setForm({ name: x.name, relation: x.relation || '', passedOn: x.passedOn, calendar: x.calendar, friday: x.friday, note: x.note || '' })
    document.getElementById('pr-loved-name')?.focus()
  }
  const onShare = () => a.run(async () => {
    const token = await createShare()
    setLink(followLink(window.location.origin, accountPath, token))
    await reload()
  })
  const onCopy = async () => {
    try { await navigator.clipboard.writeText(link); a.show('ok', L.copied) } catch { document.getElementById('pr-share-link')?.select() }
  }
  const onFollow = () => a.run(async () => {
    await follow(invite.token, { lang, consent: needConsent ? inviteConsent : false })
    setInvite(null); clearHash()
    await reload()
  }, L.followed)

  const nextText = (x) => {
    const n = nextAnniversary(x.passedOn, x.calendar, today)
    return n ? L.next(fmtKey(n.date, lang), n.n) : ''
  }

  return (
    <Section icon="duajournal" title={L.title} lead={L.lead} id="acc-loved" anchor="loved">
      {invite && (
        <div className="pr-invite ui-callout ui-callout--note" data-testid="follow-invite">
          <Icon name="link" />
          <div>
            <strong className="ui-callout__title">{L.followTitle}</strong>
            {invite.self ? <p>{L.ownList}</p> : invite.following ? <p>{L.already}</p> : (
              <>
                <p>{L.followLead(invite.ownerLabel, invite.count)}</p>
                {needConsent && <ConsentBox t={t} checked={inviteConsent} onChange={setInviteConsent} id="pr-follow-consent" />}
                <div className="acc-row">
                  <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={a.busy || (needConsent && !inviteConsent)} onClick={onFollow}>{L.followBtn}</button>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { setInvite(null); clearHash() }}>{t.cancel}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {!emailVerified && <p className="pr-hint"><Icon name="info" size={14} /> {t.verifyEmail}</p>}

      <form className="acc-form pr-form" onSubmit={onSubmit} noValidate data-testid="loved-form">
        <div className="pr-grid">
          <div className="ui-field">
            <label className="ui-field__label" htmlFor="pr-loved-name">{L.name}</label>
            <input id="pr-loved-name" className="ui-input" dir="auto" maxLength={MAX_NAME} value={form.name} onChange={set('name')} autoComplete="off" />
          </div>
          <div className="ui-field">
            <label className="ui-field__label" htmlFor="pr-loved-rel">{L.relation}</label>
            <input id="pr-loved-rel" className="ui-input" dir="auto" maxLength={MAX_RELATION} value={form.relation} onChange={set('relation')} placeholder={L.relationPh} autoComplete="off" />
          </div>
          <div className="ui-field">
            <label className="ui-field__label" htmlFor="pr-loved-date">{L.passed}</label>
            <input id="pr-loved-date" type="date" className="ui-input pr-date" max={today} min="1900-01-01" value={form.passedOn} onChange={set('passedOn')} />
          </div>
          <div className="ui-field">
            <span className="ui-field__label" id="pr-loved-cal">{L.calendar}</span>
            <div className="pr-chips" role="group" aria-labelledby="pr-loved-cal">
              {[['g', L.calG], ['h', L.calH]].map(([k, label]) => (
                <button key={k} type="button" className="ui-chip" aria-pressed={form.calendar === k} onClick={() => setForm((f) => ({ ...f, calendar: k }))}>{label}</button>
              ))}
            </div>
          </div>
        </div>
        {form.passedOn && form.calendar === 'h' && <p className="pr-preview"><Icon name="moon" size={14} /> {fmtHijriKey(form.passedOn, lang)}</p>}
        <label className="acc-check pr-toggle" htmlFor="pr-loved-fri">
          <input id="pr-loved-fri" type="checkbox" checked={form.friday} onChange={set('friday')} />
          <span>{L.friday}</span>
        </label>
        <div className="ui-field">
          <label className="ui-field__label" htmlFor="pr-loved-note">{L.note}</label>
          <textarea id="pr-loved-note" className="ui-input" rows={2} dir="auto" maxLength={MAX_NOTE} value={form.note} onChange={set('note')} />
        </div>
        {needConsent && !editing && <ConsentBox t={t} checked={consent} onChange={setConsent} id="pr-loved-consent" />}
        <div className="acc-row">
          <button type="submit" className="ui-btn ui-btn--primary" disabled={a.busy || !form.name.trim() || !form.passedOn || (needConsent && !editing && !consent)}>
            <Icon name={editing ? 'check' : 'plus'} className="ui-btn__icon" /> {a.busy ? t.busy : (editing ? t.save : L.add)}
          </button>
          {editing && <button type="button" className="ui-btn ui-btn--ghost" onClick={() => { setEditing(null); setForm(EMPTY_LOVED) }}>{t.cancel}</button>}
        </div>
      </form>
      <AuthMessage msg={a.msg} />

      {data === null ? <div className="spinner-wrap"><div className="spinner" /></div> : (
        <>
          {data.items.length === 0 ? <p className="acc-empty">{L.empty}</p> : (
            <ul className="acc-list" data-testid="loved-list">
              {data.items.map((x) => (
                <li key={x.id} className="acc-list__item pr-item">
                  <span className="ui-icon-tile ui-icon-tile--sm ui-icon-tile--neutral"><Icon name="duajournal" size={16} /></span>
                  <div className="acc-list__main">
                    <strong><bdi>{x.name}</bdi>{x.relation && <span className="pr-rel"> · <bdi>{x.relation}</bdi></span>}</strong>
                    <span className="acc-list__meta">
                      {fmtKey(x.passedOn, lang)}{x.calendar === 'h' && ` · ${fmtHijriKey(x.passedOn, lang)}`}
                    </span>
                    <span className="acc-list__meta">{nextText(x)}</span>
                    <span className="pr-tags">
                      {x.calendar === 'h' && <span className="ui-badge ui-badge--outline">{L.hijriTag}</span>}
                      {x.friday && <span className="ui-badge ui-badge--outline">{L.fridayTag}</span>}
                    </span>
                    {x.note && <p className="pr-note" dir="auto">{x.note}</p>}
                  </div>
                  <div className="acc-list__actions">
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => onEdit(x)} aria-label={`${t.edit}: ${x.name}`}><Icon name="edit" className="ui-btn__icon" /> {t.edit}</button>
                    <DeleteButton t={t} label={x.name} busy={a.busy} onConfirm={() => a.run(async () => { await deleteLoved(x.id); await reload() }, L.deleted)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="pr-dua"><a href={duaHref}><Icon name="duas" size={16} /> {L.dua}</a></p>

          {data.consent && (
            <label className="acc-check pr-toggle" htmlFor="pr-loved-email">
              <input id="pr-loved-email" type="checkbox" checked={data.lovedEmail !== false}
                onChange={(e) => { const on = e.target.checked; a.run(async () => { await setLovedEmail(on); await reload() }) }} />
              <span>{L.emailOn}{data.lovedEmail === false && ` — ${L.emailPaused}`}</span>
            </label>
          )}

          {data.consent && data.items.length > 0 && (
            <div className="pr-share" data-testid="loved-share">
              <h3 className="pr-subtitle"><Icon name="share" size={16} /> {L.shareTitle}</h3>
              <p className="acc-section__lead">{L.shareLead}</p>
              {link && (
                <div className="pr-linkrow">
                  <label className="ui-sr-only" htmlFor="pr-share-link">{L.shareTitle}</label>
                  <input id="pr-share-link" className="ui-input" readOnly value={link} onFocus={(e) => e.target.select()} data-testid="share-link" />
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onCopy}><Icon name="copy" className="ui-btn__icon" /> {L.copy}</button>
                </div>
              )}
              {link && <p className="pr-hint">{L.linkOnce}</p>}
              {!link && data.share.active && <p className="pr-hint"><Icon name="check" size={14} /> {L.linkActive}</p>}
              <div className="acc-row">
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={a.busy} onClick={onShare}>
                  <Icon name="link" className="ui-btn__icon" /> {data.share.active ? L.newLink : L.createLink}
                </button>
                {data.share.active && (
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={a.busy}
                    onClick={() => a.run(async () => { await revokeShare(); setLink(''); await reload() }, L.revoked)}>{L.revoke}</button>
                )}
              </div>
              {data.share.followers.length > 0 && (
                <>
                  <h4 className="pr-subtitle pr-subtitle--sm">{L.followers}</h4>
                  <ul className="acc-list">
                    {data.share.followers.map((f) => (
                      <li key={f.id} className="acc-list__item pr-item">
                        <span className="ui-icon-tile ui-icon-tile--sm ui-icon-tile--neutral"><Icon name="user" size={16} /></span>
                        <div className="acc-list__main"><strong><bdi>{f.label}</bdi></strong><span className="acc-list__meta">{fmtMs(f.since, lang)}</span></div>
                        <div className="acc-list__actions">
                          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={a.busy} aria-label={`${L.remove}: ${f.label}`}
                            onClick={() => a.run(async () => { await removeFollower(f.id); await reload() })}>{L.remove}</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {data.following.length > 0 && (
            <div className="pr-following" data-testid="loved-following">
              <h3 className="pr-subtitle">{L.following}</h3>
              {data.following.map((o) => (
                <div key={o.ownerId} className="pr-followed">
                  <div className="pr-followed__head">
                    <strong><bdi>{o.ownerLabel}</bdi></strong>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={a.busy}
                      onClick={() => a.run(async () => { await unfollow(o.ownerId); await reload() })}>{L.unfollow}</button>
                  </div>
                  <ul className="pr-followed__list">
                    {o.items.map((x) => (
                      <li key={x.id}><bdi>{x.name}</bdi>{x.relation && <> · <bdi>{x.relation}</bdi></>} — {fmtKey(x.passedOn, lang)} <span className="acc-list__meta">{nextText(x)}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Section>
  )
}

// ═══ C3. Zəkat xatırlatması (qurulması — zəkat səhifəsində; burada baxış, silmə və arxiv) ═══
function ZakatSection() {
  const { t, lang, siteLang } = usePersonalText()
  const Z = t.zakat
  const a = usePersonalAction(t)
  const [data, setData] = useState(null)
  const [archive, setArchive] = useState(() => loadZakatArchive())
  const reload = useCallback(() => getZakatReminder().then(setData).catch(() => setData({ reminder: null })), [])
  useEffect(() => { reload() }, [reload])
  const r = data?.reminder
  const num = useMemo(() => { try { return new Intl.NumberFormat(lang === 'az' ? 'az-Latn-AZ' : lang, { maximumFractionDigits: 2 }) } catch { return null } }, [lang])
  const money = (v, c) => `${num ? num.format(v) : v} ${c}`

  return (
    <Section icon="zakat" title={Z.title} lead={Z.lead} id="acc-zakat" anchor="zakat">
      {data === null ? <div className="spinner-wrap"><div className="spinner" /></div> : r ? (
        <div className="pr-zakat" data-testid="zakat-reminder">
          <p className="pr-zakat__due"><Icon name="calendar" size={16} /> {Z.due(fmtKey(r.dueOn, lang), fmtHijriKey(r.dueOn, lang))}</p>
          {r.amount != null && r.currency && <p className="acc-list__meta">{Z.lastAmount(money(r.amount, r.currency))}</p>}
          <div className="acc-row">
            <a className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor('zakat', siteLang)}><Icon name="zakat" className="ui-btn__icon" /> {Z.goCalc}</a>
            <DeleteButton t={{ ...t, del: Z.remove }} label={Z.title} busy={a.busy} onConfirm={() => a.run(async () => { await deleteZakatReminder(); await reload() }, Z.removed)} />
          </div>
        </div>
      ) : (
        <div className="acc-row">
          <p className="acc-empty">{Z.none}</p>
          <a className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor('zakat', siteLang)}><Icon name="zakat" className="ui-btn__icon" /> {Z.goCalc}</a>
        </div>
      )}
      <AuthMessage msg={a.msg} />
      {archive.length > 0 && (
        <>
          <h3 className="pr-subtitle">{Z.archive}</h3>
          <p className="acc-list__meta">{Z.archiveLead}</p>
          <ArchiveTable Z={Z} t={t} lang={lang} list={archive} money={money} onRemove={(d) => setArchive(removeZakatArchive(d))} />
        </>
      )}
    </Section>
  )
}

// ═══ Serverdəki məlumat: push bu cihaza + hamısını sil ═══
function PersonalDataSection() {
  const { t } = usePersonalText()
  const a = usePersonalAction(t)
  const endpoint = thisDeviceEndpoint()
  const [linked, setLinked] = useState(null)
  const [ask, setAsk] = useState(false)
  useEffect(() => {
    if (endpoint) pushLinkStatus(endpoint).then(setLinked).catch(() => setLinked(false))
  }, [endpoint])
  const onWipe = () => a.run(async () => { await wipePersonal(); setAsk(false); window.location.reload() }, t.wiped)

  return (
    <Section icon="shield" title={t.consentTitle} lead={t.consentNote} id="acc-personal-data">
      {endpoint ? (
        <label className="acc-check pr-toggle" htmlFor="pr-push">
          <input id="pr-push" type="checkbox" checked={Boolean(linked)} disabled={linked === null || a.busy}
            onChange={(e) => { const on = e.target.checked; a.run(async () => setLinked(await setPushLink(endpoint, on))) }} />
          <span>{t.pushThis}</span>
        </label>
      ) : <p className="pr-hint"><Icon name="bell" size={14} /> {t.pushNone}</p>}
      {ask ? (
        <div className="pr-confirm">
          <span className="acc-confirm-q">{t.wipeAsk}</span>
          <button type="button" className="ui-btn ui-btn--sm acc-btn-danger" disabled={a.busy} onClick={onWipe}>{t.yes}</button>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(false)}>{t.cancel}</button>
        </div>
      ) : (
        <div><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(true)}><Icon name="trash" className="ui-btn__icon" /> {t.wipe}</button></div>
      )}
      <AuthMessage msg={a.msg} />
    </Section>
  )
}
