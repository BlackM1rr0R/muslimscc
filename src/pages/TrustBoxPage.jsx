// ═══════════════════════════════════════════════════════
// /trust-box — "Əmanət qutusu" (server/trustBox.js, utils/trustBoxCrypto.js). noindex.
//
//   (girişli)  sahib: ayrıca əmanət parolu → qutu brauzerdə şifrələnir (PBKDF2 600k + AES-GCM); vəsiyyət istəkləri,
//              borclar (borc dəftərindən gətirmək olar), sənədlərin yeri, ailəyə son sözlər. Gizli keçid, etibarlı
//              şəxsə çap məktubu, parolu dəyiş, keçidi dəyiş/söndür, hər şeyi sil.
//   #t=<token> etibarlı şəxs: girişsiz; token serverə POST gövdəsində gedir, parol YALNIZ bu cihazda yoxlanır.
// • Serverə yalnız { salt, blob, linkHash? } gedir. Açar yaddaşdadır (səhifədən çıxanda / "Bağla" — unudulur).
// • Vəsiyyət haqqında blok: saytın dərsindən (data/lessons/wasiyyah.js) hədislər OLDUĞU KİMİ, mənbəsi ilə.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import { useAuthUser, refreshMe } from '../api/userSession'
import { PasswordField } from '../components/account/AuthUi'
import { Confirm, Msg, Loading, SignInCard, fmtDate } from '../components/p3/p3Ui'
import { TB } from '../components/trustbox/trustBoxText'
import { getTrustBox, saveTrustBox, deleteTrustBox, openTrustLink } from '../api/trustBox'
import {
  sealBox, openBox, deriveBoxKey, newBoxSalt, checkPassphrase, normalizePassphrase, generatePassphrase, newLinkToken,
  linkHashOf, parseTrustHash, sanitizePayload, emptyPayload, importDebts, DEBT_KINDS, LIMITS,
} from '../utils/trustBoxCrypto'
import { readLedger, remaining, isSettled, CURRENCIES } from '../utils/debtLedger'
import '../styles/Account.css'
import '../styles/ReadTogether.css'
import '../styles/P3.css'
import '../styles/TrustBox.css'

const canCrypto = () => typeof globalThis.crypto !== 'undefined' && Boolean(globalThis.crypto.subtle)
const linkUrl = (token, siteLang) => `${window.location.origin}${pathFor('trustbox', siteLang)}#t=${token}`
let rowSeq = 0
const withKeys = (p) => ({ ...p, debts: p.debts.map((d) => ({ ...d, _k: ++rowSeq })) })
const errMsg = (e, t) => (e?.status === 409 && e.code === 'conflict' ? t.conflict
  : e?.status === 413 || e?.code === 'too_large' ? t.tooLarge
    : e?.status === 429 ? t.rateLimited : t.failed)

/** Çap: yalnız .tb-printable görünür (html.tb-printing) */
function printOnly() {
  const root = document.documentElement
  root.classList.add('tb-printing')
  const done = () => { root.classList.remove('tb-printing'); window.removeEventListener('afterprint', done) }
  window.addEventListener('afterprint', done)
  try { window.print() } finally { setTimeout(done, 1000) }
}

// ── Vəsiyyət haqqında: saytın dərsindən hədislər olduğu kimi ──
function WasiyyahInfo({ t, lang, siteLang }) {
  const [items, setItems] = useState(null)
  useEffect(() => {
    let alive = true
    import('../data/lessons/wasiyyah').then((m) => {
      const pick = (id) => {
        const s = m.default.sections.find((x) => x.id === id)
        const b = s && s.blocks.find((x) => x.t === 'hadith')
        return b ? { id, title: s.title, ar: b.ar, text: b.text, src: b.src, grade: b.grade } : null
      }
      if (alive) setItems(['third', 'heir'].map(pick).filter(Boolean))
    }).catch(() => { if (alive) setItems([]) })
    return () => { alive = false }
  }, [])
  const pickL = (o) => (o ? o[lang] || o.en : '')
  return (
    <section className="ui-card acc-section tb-info" aria-labelledby="tb-info-h" data-testid="tb-info">
      <h2 className="acc-section__title" id="tb-info-h"><Icon name="learn" size={20} /> {t.infoTitle}</h2>
      {items && items.length > 0 && <p className="rt-note">{t.infoLead}</p>}
      {items && items.map((h) => (
        <figure key={h.id} className="tb-hadith">
          <figcaption className="tb-hadith__title">{pickL(h.title)}</figcaption>
          <p className="tb-hadith__ar" lang="ar" dir="rtl">{h.ar}</p>
          {lang !== 'ar' && <blockquote className="tb-hadith__tr">{pickL(h.text)}</blockquote>}
          <p className="tb-hadith__src">{pickL(h.src)}{h.grade ? ` · ${pickL(h.grade)}` : ''}</p>
        </figure>
      ))}
      <div className="p3-row">
        <a className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor('learn', siteLang, 'wasiyyah')}><Icon name="learn" className="ui-btn__icon" /> {t.infoLesson}</a>
        <a className="ui-btn ui-btn--ghost ui-btn--sm" href={pathFor('inheritance', siteLang)}><Icon name="inheritance" className="ui-btn__icon" /> {t.infoCalc}</a>
      </div>
    </section>
  )
}

function HowItWorks({ t }) {
  return (
    <section className="ui-card acc-section" aria-labelledby="tb-how-h">
      <h2 className="acc-section__title" id="tb-how-h">{t.howTitle}</h2>
      <ol className="p3-list">{t.how.map((x) => <li key={x}>{x}</li>)}</ol>
      <div className="tb-warn" role="note">
        <Icon name="alert" size={20} />
        <div><strong>{t.warnTitle}</strong><p>{t.warn}</p></div>
      </div>
    </section>
  )
}

// ── Oxumaq üçün görünüş (etibarlı şəxs; sahib üçün də çap) ──
function Block({ title, text, t }) {
  return (
    <div className="tb-read__block">
      <h3 className="tb-read__h">{title}</h3>
      {text.trim() ? <p className="tb-read__text" dir="auto">{text}</p> : <p className="rt-note">{t.nothing}</p>}
    </div>
  )
}
function ReadView({ p, t, lang, updatedAt }) {
  const fmtAmt = (d) => (d.a == null ? '' : `${d.a.toLocaleString(lang === 'az' ? 'az-Latn-AZ' : lang)}${d.cu ? ` ${d.cu}` : ''}`)
  return (
    <div className="tb-read tb-printable" data-testid="tb-read">
      <p className="tb-read__meta"><span className="ui-badge">{t.readOnly}</span>
        {p.from && <span>{t.viewFrom}: <bdi>{p.from}</bdi></span>}
        {updatedAt ? <span>{t.viewSaved(fmtDate(updatedAt, lang))}</span> : null}
      </p>
      <Block title={t.will} text={p.will} t={t} />
      <div className="tb-read__block">
        <h3 className="tb-read__h">{t.debts}</h3>
        {p.debts.length === 0 ? <p className="rt-note">{t.noDebts}</p> : DEBT_KINDS.map((k) => {
          const rows = p.debts.filter((d) => d.k === k)
          if (!rows.length) return null
          return (
            <div key={k} className="tb-read__debts">
              <h4 className="tb-read__sub">{k === 'owe' ? t.owe : t.owed}</h4>
              <ul>{rows.map((d, i) => (
                <li key={i}><bdi dir="auto">{d.p || '—'}</bdi>{fmtAmt(d) && <> · <span className="ui-num">{fmtAmt(d)}</span></>}{d.no && <> · <bdi dir="auto">{d.no}</bdi></>}</li>
              ))}</ul>
            </div>
          )
        })}
      </div>
      <Block title={t.docs} text={p.docs} t={t} />
      <Block title={t.words} text={p.words} t={t} />
    </div>
  )
}

// ── Etibarlı şəxs: #t=… ──
function TrusteeView({ token, t, lang }) {
  const [st, setSt] = useState({ status: 'loading' })      // loading | invalid | error | locked | open
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  useEffect(() => {
    let alive = true
    openTrustLink(token).then((box) => { if (alive) setSt({ status: 'locked', box }) })
      .catch((e) => { if (alive) setSt({ status: e?.status === 404 ? 'invalid' : 'error', err: e }) })
    return () => { alive = false }
  }, [token])
  if (st.status === 'loading') return <Loading label={t.loading} />
  if (st.status === 'invalid') return <p className="rt-msg acc-msg--bad" role="alert" data-testid="tb-invalid">{t.viewInvalid}</p>
  if (st.status === 'error') return <p className="rt-msg acc-msg--bad" role="alert">{errMsg(st.err, t)}</p>
  if (st.status === 'open') {
    return (
      <section className="ui-card acc-section" aria-labelledby="tb-view-h">
        <h2 className="acc-section__title" id="tb-view-h">{t.viewTitle}</h2>
        <ReadView p={st.payload} t={t} lang={lang} updatedAt={st.box.updatedAt} />
        <div className="p3-row tb-noprint"><button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={printOnly}><Icon name="print" className="ui-btn__icon" /> {t.print}</button></div>
      </section>
    )
  }
  const onOpen = async (e) => {
    e.preventDefault()
    if (!canCrypto()) { setMsg({ tone: 'bad', text: t.noCrypto }); return }
    setBusy(true); setMsg(null)
    try {
      const { payload } = await openBox(st.box, pass)
      setPass('')
      setSt((s) => ({ ...s, status: 'open', payload }))
    } catch { setMsg({ tone: 'bad', text: t.wrongPass }) } finally { setBusy(false) }
  }
  return (
    <form className="ui-card acc-section" aria-labelledby="tb-view-h" onSubmit={onOpen} data-testid="tb-trustee">
      <h2 className="acc-section__title" id="tb-view-h"><Icon name="lock" size={20} /> {t.viewTitle}</h2>
      <p className="rt-note">{t.viewLead}</p>
      <PasswordField label={t.pass} value={pass} onChange={setPass} autoComplete="off" name="trust-pass" />
      {busy && <p className="rt-note" role="status">{t.unlocking}</p>}
      <Msg msg={msg} />
      <div><button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || !pass} data-testid="tb-trustee-open"><Icon name="key" className="ui-btn__icon" /> {t.unlock}</button></div>
    </form>
  )
}

// ── Sahib: yaratmaq ──
function SetupForm({ t, onCreate }) {
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [ok, setOk] = useState(false)
  const [gen, setGen] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const suggest = () => { const g = generatePassphrase(); setGen(g); setP1(g); setP2(g) }
  const submit = async (e) => {
    e.preventDefault()
    const bad = checkPassphrase(p1)
    if (bad) { setMsg({ tone: 'bad', text: bad === 'short' ? t.passShort : t.passWeak }); return }
    if (normalizePassphrase(p1) !== normalizePassphrase(p2)) { setMsg({ tone: 'bad', text: t.passMismatch }); return }
    if (!ok) { setMsg({ tone: 'bad', text: t.understandNeed }); return }
    if (!canCrypto()) { setMsg({ tone: 'bad', text: t.noCrypto }); return }
    setBusy(true); setMsg(null)
    const err = await onCreate(p1)
    setBusy(false)
    if (err) setMsg({ tone: 'bad', text: err })
  }
  return (
    <form className="ui-card acc-section" aria-labelledby="tb-setup-h" onSubmit={submit} data-testid="tb-setup">
      <h2 className="acc-section__title" id="tb-setup-h"><Icon name="key" size={20} /> {t.setupTitle}</h2>
      <PasswordField label={t.pass} value={p1} onChange={(v) => { setP1(v); setGen('') }} autoComplete="new-password" name="trust-pass-new" describedBy="tb-pass-hint" />
      <p className="rt-note" id="tb-pass-hint">{t.passHint}</p>
      <PasswordField label={t.pass2} value={p2} onChange={setP2} autoComplete="new-password" name="trust-pass-new2" />
      <div className="p3-row"><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={suggest} data-testid="tb-generate"><Icon name="sparkle" className="ui-btn__icon" /> {t.generate}</button></div>
      {gen && (
        <div className="tb-gen" role="status">
          <span>{t.generated}</span>
          <code className="tb-gen__code" dir="ltr" data-testid="tb-generated">{gen}</code>
        </div>
      )}
      <label className="acc-check" htmlFor="tb-understand">
        <input id="tb-understand" type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} data-testid="tb-understand" />
        <span>{t.understand}</span>
      </label>
      {busy && <p className="rt-note" role="status">{t.saving}</p>}
      <Msg msg={msg} />
      <div><button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} data-testid="tb-create"><Icon name="lock" className="ui-btn__icon" /> {t.create}</button></div>
    </form>
  )
}

// ── Sahib: açmaq ──
function UnlockForm({ t, box, onOpen }) {
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    if (!canCrypto()) { setMsg({ tone: 'bad', text: t.noCrypto }); return }
    setBusy(true); setMsg(null)
    try {
      const r = await openBox(box, pass)
      setPass('')
      onOpen(r.key, r.payload)
    } catch { setMsg({ tone: 'bad', text: t.wrongPass }); setBusy(false) }
  }
  return (
    <form className="ui-card acc-section" aria-labelledby="tb-lock-h" onSubmit={submit} data-testid="tb-locked">
      <h2 className="acc-section__title" id="tb-lock-h"><Icon name="lock" size={20} /> {t.lockedTitle}</h2>
      <p className="rt-note">{t.lockedLead}</p>
      <PasswordField label={t.pass} value={pass} onChange={setPass} autoComplete="off" name="trust-pass" />
      {busy && <p className="rt-note" role="status">{t.unlocking}</p>}
      <Msg msg={msg} />
      <div><button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || !pass} data-testid="tb-unlock"><Icon name="key" className="ui-btn__icon" /> {t.unlock}</button></div>
    </form>
  )
}

// ── Sahib: redaktor ──
function TextArea({ id, label, hint, value, max, onChange, rows = 5 }) {
  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={id}>{label}</label>
      {hint && <span className="ui-field__hint" id={`${id}-hint`}>{hint}</span>}
      <textarea id={id} className="ui-input tb-textarea" dir="auto" rows={rows} maxLength={max} value={value}
        aria-describedby={hint ? `${id}-hint` : undefined} onChange={(e) => onChange(e.target.value)} data-testid={id} />
    </div>
  )
}

function DebtRows({ t, debts, setDebts, siteLang }) {
  const [note, setNote] = useState('')
  const patch = (k, ch) => setDebts(debts.map((d) => (d._k === k ? { ...d, ...ch } : d)))
  const add = () => setDebts([...debts, { k: 'owe', p: '', a: '', cu: '', no: '', _k: ++rowSeq }].slice(0, LIMITS.debts))
  const doImport = () => {
    const r = importDebts(debts, readLedger(), { remainingOf: remaining, settled: isSettled })
    setDebts(r.debts.map((d) => (d._k ? d : { ...d, _k: ++rowSeq })))
    setNote(r.added ? t.imported(r.added) : t.imported0)
  }
  return (
    <fieldset className="tb-debts">
      <legend className="ui-field__label">{t.debts}</legend>
      <p className="ui-field__hint">{t.debtsHint}</p>
      {debts.length === 0 && <p className="rt-note">{t.noDebts}</p>}
      <datalist id="tb-cur">{CURRENCIES.map((c) => <option key={c} value={c} />)}</datalist>
      <ul className="tb-debt-list">
        {debts.map((d, i) => (
          <li key={d._k} className="tb-debt" data-testid="tb-debt">
            <div className="p3-chips" role="group" aria-label={t.kind}>
              {DEBT_KINDS.map((k) => (
                <button key={k} type="button" className="ui-chip" aria-pressed={d.k === k} onClick={() => patch(d._k, { k })}>{k === 'owe' ? t.owe : t.owed}</button>
              ))}
            </div>
            <div className="tb-debt__grid">
              <label className="ui-field"><span className="ui-field__label">{t.person}</span>
                <input className="ui-input" dir="auto" maxLength={LIMITS.person} value={d.p} onChange={(e) => patch(d._k, { p: e.target.value })} data-testid={`tb-debt-p-${i}`} /></label>
              <label className="ui-field"><span className="ui-field__label">{t.amount}</span>
                <input className="ui-input ui-num" inputMode="decimal" dir="ltr" value={d.a ?? ''} onChange={(e) => patch(d._k, { a: e.target.value.replace(',', '.') })} data-testid={`tb-debt-a-${i}`} /></label>
              <label className="ui-field"><span className="ui-field__label">{t.currency}</span>
                <input className="ui-input" dir="ltr" maxLength={3} list="tb-cur" autoCapitalize="characters" value={d.cu} onChange={(e) => patch(d._k, { cu: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })} /></label>
            </div>
            <label className="ui-field"><span className="ui-field__label">{t.note}</span>
              <input className="ui-input" dir="auto" maxLength={LIMITS.note} value={d.no} onChange={(e) => patch(d._k, { no: e.target.value })} /></label>
            <div><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setDebts(debts.filter((x) => x._k !== d._k))}><Icon name="trash" className="ui-btn__icon" /> {t.removeDebt}</button></div>
          </li>
        ))}
      </ul>
      <div className="p3-row">
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={add} data-testid="tb-debt-add"><Icon name="plus" className="ui-btn__icon" /> {t.addDebt}</button>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={doImport} data-testid="tb-debt-import"><Icon name="debts" className="ui-btn__icon" /> {t.importDebts}</button>
        <a className="ui-link tb-small" href={pathFor('debts', siteLang)}>{t.openLedger}</a>
      </div>
      {note && <p className="rt-note" role="status" data-testid="tb-import-note">{note}</p>}
    </fieldset>
  )
}

function LetterCard({ t, from, link }) {
  return (
    <div className="tb-letter tb-printable" data-testid="tb-letter">
      <h3 className="tb-letter__title">{t.cardTitle}</h3>
      <p>{from.trim() ? t.cardIntro(from.trim()) : t.cardIntroAnon}</p>
      <ol className="tb-letter__steps">
        <li>{t.cardSteps[0]}<br /><code className="tb-letter__link" dir="ltr">{link}</code></li>
        <li>{t.cardSteps[1]}</li>
        <li>{t.cardSteps[2]}</li>
      </ol>
      <p className="tb-letter__pass">{t.cardPass}<span className="tb-letter__blank" aria-hidden="true" /></p>
      <p className="tb-letter__keep">{t.cardKeep}</p>
    </div>
  )
}

function OwnerBox({ t, lang, siteLang }) {
  const [box, setBox] = useState(undefined)          // undefined — yüklənir; null — yoxdur; false — xəta
  const [key, setKey] = useState(null)               // CryptoKey (yalnız yaddaşda)
  const [draft, setDraft] = useState(null)
  const [savedJson, setSavedJson] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showCard, setShowCard] = useState(false)
  const [copied, setCopied] = useState(false)
  const [np, setNp] = useState({ a: '', b: '' })
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  const load = useCallback(() => {
    getTrustBox().then((r) => { if (alive.current) setBox(r?.box || null) }).catch(() => { if (alive.current) setBox(false) })
  }, [])
  useEffect(() => { load() }, [load])

  const clean = useMemo(() => (draft ? sanitizePayload(draft) : null), [draft])
  const dirty = Boolean(clean) && JSON.stringify({ ...clean, savedAt: 0 }) !== savedJson

  /** Şifrələ və saxla → yeni box; xəta mətni və ya null */
  const persist = async (payload, { k = key, salt = box?.salt, linkHash } = {}) => {
    const p = sanitizePayload({ ...payload, savedAt: Date.now() })
    try {
      const sealed = await sealBox(p, null, { salt, key: k })
      const r = await saveTrustBox(sealed, { linkHash, ifVersion: box ? box.version : 0 })
      if (!alive.current) return null
      setBox(r.box)
      setSavedJson(JSON.stringify({ ...p, savedAt: 0 }))
      return null
    } catch (e) { return errMsg(e, t) }
  }
  const run = async (fn, okText) => {
    setBusy(true); setMsg(null)
    const err = await fn()
    if (!alive.current) return
    setBusy(false)
    setMsg(err ? { tone: 'bad', text: err } : okText ? { tone: 'ok', text: okText } : null)
  }

  const onCreate = async (pass) => {
    const salt = newBoxSalt()
    let k
    try { k = await deriveBoxKey(pass, salt) } catch { return t.failed }
    const p = emptyPayload()
    const err = await persist(p, { k, salt })
    if (err) return err
    setKey(k); setDraft(withKeys(p))
    return null
  }
  const onOpen = (k, payload) => {
    setKey(k); setDraft(withKeys(payload)); setSavedJson(JSON.stringify({ ...payload, savedAt: 0 })); setMsg(null)
  }
  const forget = () => { setKey(null); setDraft(null); setSavedJson(''); setShowCard(false); setNp({ a: '', b: '' }) }
  const lock = () => { forget(); setMsg(null); load() }
  const removeAll = () => run(async () => {
    try { await deleteTrustBox(); forget(); setBox(null); return null } catch (e) { return errMsg(e, t) }
  }, t.deleted)

  if (box === undefined) return <Loading label={t.loading} />
  if (box === false) return <p className="rt-msg acc-msg--bad" role="alert">{t.failed}</p>
  if (!box) return <><Msg msg={msg} /><HowItWorks t={t} /><SetupForm t={t} onCreate={onCreate} /><WasiyyahInfo t={t} lang={lang} siteLang={siteLang} /></>
  if (!key || !draft) {
    return (
      <>
        <UnlockForm t={t} box={box} onOpen={onOpen} />
        <HowItWorks t={t} />
        <Manage t={t} busy={busy} msg={msg} onDelete={removeAll} />
      </>
    )
  }

  const set = (ch) => setDraft((d) => ({ ...d, ...ch }))
  const link = draft.link ? linkUrl(draft.link, siteLang) : ''
  const newLink = () => run(async () => {
    const token = newLinkToken()
    const err = await persist({ ...draft, link: token }, { linkHash: await linkHashOf(token) })
    if (!err) { set({ link: token }); setCopied(false) }
    return err
  })
  const revoke = () => run(async () => {
    const err = await persist({ ...draft, link: '' }, { linkHash: null })
    if (!err) { set({ link: '' }); setShowCard(false) }
    return err
  })
  const changePass = () => run(async () => {
    const bad = checkPassphrase(np.a)
    if (bad) return bad === 'short' ? t.passShort : t.passWeak
    if (normalizePassphrase(np.a) !== normalizePassphrase(np.b)) return t.passMismatch
    const salt = newBoxSalt()
    let k
    try { k = await deriveBoxKey(np.a, salt) } catch { return t.failed }
    const err = await persist(draft, { k, salt })
    if (!err) { setKey(k); setNp({ a: '', b: '' }) }
    return err
  }, t.changed)
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true) } catch { /* əl ilə seçmək olar */ } }

  return (
    <>
      <form className="ui-card acc-section" aria-labelledby="tb-edit-h" onSubmit={(e) => { e.preventDefault(); run(() => persist(draft), t.saved) }} data-testid="tb-editor">
        <div className="tb-head">
          <h2 className="acc-section__title" id="tb-edit-h"><Icon name="trustbox" size={20} /> {t.title}</h2>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={lock} data-testid="tb-lock"><Icon name="lock" className="ui-btn__icon" /> {t.lock}</button>
        </div>
        <div className="ui-field">
          <label className="ui-field__label" htmlFor="tb-from">{t.from}</label>
          <input id="tb-from" className="ui-input" dir="auto" maxLength={LIMITS.from} value={draft.from} onChange={(e) => set({ from: e.target.value })} autoComplete="name" data-testid="tb-from" />
        </div>
        <TextArea id="tb-will" label={t.will} hint={t.willHint} value={draft.will} max={LIMITS.will} onChange={(v) => set({ will: v })} />
        <DebtRows t={t} debts={draft.debts} setDebts={(debts) => set({ debts })} siteLang={siteLang} />
        <TextArea id="tb-docs" label={t.docs} hint={t.docsHint} value={draft.docs} max={LIMITS.docs} onChange={(v) => set({ docs: v })} rows={4} />
        <TextArea id="tb-words" label={t.words} value={draft.words} max={LIMITS.words} onChange={(v) => set({ words: v })} rows={6} />
        <div className="tb-savebar">
          <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || !dirty} data-testid="tb-save"><Icon name="lock" className="ui-btn__icon" /> {busy ? t.saving : t.save}</button>
          {dirty && <span className="tb-dirty" role="status">{t.unsaved}</span>}
          {!dirty && box.updatedAt && <span className="rt-note">{t.savedAt(fmtDate(box.updatedAt, lang))}</span>}
        </div>
        <Msg msg={msg} />
      </form>

      <section className="ui-card acc-section" aria-labelledby="tb-share-h" data-testid="tb-share">
        <h2 className="acc-section__title" id="tb-share-h"><Icon name="user" size={20} /> {t.shareTitle}</h2>
        <p className="rt-note">{t.shareLead}</p>
        {link ? (
          <div className="p3-link">
            <p className="rt-note"><strong>{t.link}.</strong> {t.linkOn}</p>
            <div className="p3-link__row">
              <input className="ui-input" readOnly value={link} aria-label={t.link} onFocus={(e) => e.target.select()} dir="ltr" data-testid="tb-link-url" />
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={copy}><Icon name="copy" className="ui-btn__icon" /> {copied ? t.copied : t.copy}</button>
            </div>
          </div>
        ) : <p className="rt-note">{box.hasLink ? t.linkOn : t.linkOff}</p>}
        <p className="rt-note" data-testid="tb-opened">{box.lastOpenedAt ? t.lastOpened(fmtDate(box.lastOpenedAt, lang)) : t.neverOpened}</p>
        <div className="p3-row">
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy} onClick={newLink} data-testid="tb-link-new"><Icon name="link" className="ui-btn__icon" /> {box.hasLink ? t.linkRotate : t.linkNew}</button>
          {box.hasLink && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={revoke} data-testid="tb-link-revoke">{t.linkRevoke}</button>}
        </div>
        <div className="p3-row">
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" aria-expanded={showCard} onClick={() => setShowCard((v) => !v)} data-testid="tb-card-toggle"><Icon name="mail" className="ui-btn__icon" /> {showCard ? t.hideCard : t.showCard}</button>
        </div>
        {showCard && (link ? (
          <>
            <LetterCard t={t} from={draft.from} link={link} />
            <div className="p3-row"><button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={printOnly} data-testid="tb-print"><Icon name="print" className="ui-btn__icon" /> {t.print}</button></div>
          </>
        ) : <p className="rt-note">{t.cardNoLink}</p>)}
      </section>

      <section className="ui-card acc-section" aria-labelledby="tb-pass-h">
        <h2 className="acc-section__title" id="tb-pass-h"><Icon name="key" size={20} /> {t.changePass}</h2>
        <p className="rt-note">{t.changePassLead}</p>
        <PasswordField label={t.newPass} value={np.a} onChange={(v) => setNp((x) => ({ ...x, a: v }))} autoComplete="new-password" name="trust-pass-change" required={false} />
        <PasswordField label={t.newPass2} value={np.b} onChange={(v) => setNp((x) => ({ ...x, b: v }))} autoComplete="new-password" name="trust-pass-change2" required={false} />
        <div><button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy || !np.a} onClick={changePass} data-testid="tb-change-pass">{t.changeBtn}</button></div>
      </section>

      <WasiyyahInfo t={t} lang={lang} siteLang={siteLang} />
      <HowItWorks t={t} />
      <Manage t={t} busy={busy} msg={null} onDelete={removeAll} />
    </>
  )
}

function Manage({ t, busy, msg, onDelete }) {
  return (
    <section className="ui-card acc-section acc-section--danger" aria-labelledby="tb-del-h">
      <h2 className="acc-section__title" id="tb-del-h"><Icon name="trash" size={20} /> {t.manageTitle}</h2>
      <Msg msg={msg} />
      <div><Confirm label={t.deleteAll} ask={t.deleteAsk} yes={t.yes} cancel={t.cancel} disabled={busy} testId="tb-delete" onYes={onDelete} /></div>
    </section>
  )
}

export default function TrustBoxPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(TB, lang, 'en')
  const { status } = useAuthUser()
  const [token, setToken] = useState(() => (typeof window === 'undefined' ? null : parseTrustHash(window.location.hash)))
  useEffect(() => {
    const on = () => setToken(parseTrustHash(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  useEffect(() => { if (!token && status === 'unknown') refreshMe().catch(() => {}) }, [status, token])

  let body
  if (token) body = <TrusteeView key={token} token={token} t={t} lang={lang} />
  else if (status === 'anon') body = <><SignInCard text={t.signIn} btn={t.signInBtn} pageKey="trustbox" siteLang={siteLang} testId="tb-signin" /><HowItWorks t={t} /></>
  else if (status !== 'user') body = <Loading label={t.loading} />
  else body = <OwnerBox t={t} lang={lang} siteLang={siteLang} />

  return (
    <div className="acc-account p3-page tb-page">
      <section className="ui-page-hero tb-noprint">
        <div className="ui-container ui-container--narrow">
          <p className="ui-eyebrow">{t.eyebrow}</p>
          <h1 className="ui-title">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </section>
      <div className="ui-container ui-container--narrow acc-sections">
        {body}
        {!token && <p className="tb-noprint"><a className="ui-btn ui-btn--ghost ui-btn--sm" href={pathFor('account', siteLang)}><Icon name="arrow" className="ui-btn__icon ui-flip-rtl" /> {t.back}</a></p>}
      </div>
    </div>
  )
}
