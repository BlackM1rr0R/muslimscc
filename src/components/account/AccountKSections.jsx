// ═══════════════════════════════════════════════════════
// /account — K mərhələsi: açıq profil (server/publicProfile.js), həftəlik e-poçt hesabatı (server/weekly.js),
// məscid nümayəndəsinin paneli (server/mosqueRep.js — yalnız rolu mosque_rep olan hesabda).
// Hamısı könüllüdür, susmaya görə bağlıdır; ilk yazıda razılıq qeydi. AccountPage bu faylı tənbəl yükləyir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import CopyLink from '../readroom/CopyLink'
import { Card, Confirm, Msg, fmtDay, nf } from '../community/CommunityUi'
import { PP, WK, MR, PUBLIC_FIELDS, PUBLIC_STAMP_IDS, apiErrCode } from './communityText'
import VerifyEmailNote from './VerifyEmailNote'
import {
  getPublicProfileSettings, savePublicProfile, deletePublicProfile, checkHandle, HANDLE_RE,
  getWeekly, saveWeeklyPrefs, deleteWeekly, getMosqueRep, saveMosqueRep, addMosqueAnnouncement, deleteMosqueAnnouncement,
} from '../../api/community'
import { readPassport } from '../../utils/passport'
import { stampName } from '../SpiritualPassport'
import { computeWeekly, nextReportDate, writeLocalWeekly, maybeUpload, dayKey } from '../../utils/weeklyReport'
import '../../styles/ReadTogether.css'
import '../../styles/Community.css'

// Sahibin qərarı (2026-11-18): açıq profildə ibadət sayı yoxdur — yalnız ad, künyə, bio, sevimli surə, öyrənmə möhürləri
const PP_FIELDS = PUBLIC_FIELDS
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const KUNYA_KEY = 'muslim_cc_kunya_v1'   // J mərhələsi (utils/journeyStore) — { p: 'abu'|'umm', n: ad }
const ls = () => { try { return globalThis.localStorage } catch { return null } }

/** Bu cihazdakı künyə (varsa) — "Əbu/Ummu <ad>" */
function localKunya(lang) {
  try {
    const v = JSON.parse(ls()?.getItem(KUNYA_KEY) || 'null')
    if (!v || typeof v.n !== 'string' || !v.n.trim()) return ''
    const KUNYA_PRE = { abu: { ar: 'أبو', ru: 'Абу', other: 'Abu' }, umm: { ar: 'أم', ru: 'Умм', other: 'Umm' } }
    const k = KUNYA_PRE[v.p === 'umm' ? 'umm' : 'abu']
    const pre = k[lang] || k.other
    return `${pre} ${v.n.trim()}`.slice(0, 40)
  } catch { return '' }
}
const errCode = apiErrCode

export default function AccountKSections({ lang, siteLang, user }) {
  return (
    <>
      <PublicProfileSection lang={lang} siteLang={siteLang} user={user} />
      <WeeklySection lang={lang} user={user} />
      {user && user.role === 'mosque_rep' && <MosqueRepSection lang={lang} siteLang={siteLang} />}
    </>
  )
}

// ── K1. Açıq profil ──
function PublicProfileSection({ lang, siteLang, user }) {
  const t = pickUi(PP, lang, 'en')
  const uid = useId()
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(null)   // serverdəki profil
  const [on, setOn] = useState(false)
  const [handle, setHandle] = useState('')
  const [hState, setHState] = useState(null)  // { tone, text }
  const [fields, setFields] = useState(['displayName'])
  const [name, setName] = useState(user?.displayName || '')
  const [bio, setBio] = useState('')
  const [surah, setSurah] = useState('')
  const [stamps, setStamps] = useState([])
  const [allowIndex, setAllowIndex] = useState(false)
  const [consent, setConsent] = useState(false)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [needVerify, setNeedVerify] = useState(false)

  // Bu cihazdakı öyrənmə möhürləri və künyə (server şifrəli məlumatı oxumur; ibadət möhürləri təklif olunmur)
  const local = useMemo(() => {
    let earned = []
    try { earned = Object.keys(readPassport()).filter((s) => PUBLIC_STAMP_IDS.includes(s)) } catch { /* */ }
    return { earned, kunya: localKunya(lang) }
  }, [lang])

  const apply = useCallback((p) => {
    setSaved(p)
    if (!p) return
    setOn(p.enabled); setHandle(p.handle); setAllowIndex(p.allowIndex)
    // Köhnə profildə qalmış ibadət sahələri (xətm sayı …) formaya düşmür
    const keep = (p.fields || []).filter((f) => PP_FIELDS.includes(f))
    setFields(keep.length ? keep : ['displayName'])
    if (p.data.displayName) setName(p.data.displayName)
    if (p.data.bio) setBio(p.data.bio)
    if (p.data.favSurah) setSurah(String(p.data.favSurah))
    if (p.data.stamps) setStamps(p.data.stamps.filter((s) => PUBLIC_STAMP_IDS.includes(s)))
  }, [])
  useEffect(() => {
    getPublicProfileSettings().then((r) => apply(r.profile)).catch(() => {}).finally(() => setLoaded(true))
  }, [apply])

  const toggle = (f) => setFields((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))
  const handleText = (code) => (code === 'taken' || code === 'handle_taken' ? t.taken : code === 'reserved' ? t.reserved : t.badHandle)

  const onCheck = async () => {
    const h = handle.trim().toLowerCase()
    if (!HANDLE_RE.test(h)) { setHState({ tone: 'bad', text: t.badHandle }); return }
    try {
      const r = await checkHandle(h)
      setHState(r.available ? { tone: 'ok', text: t.free } : { tone: 'bad', text: handleText(r.reason) })
    } catch { setHState(null) }
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!saved && !consent) { setMsg({ tone: 'bad', text: t.consentNeed }); return }
    const h = handle.trim().toLowerCase()
    if (!HANDLE_RE.test(h)) { setHState({ tone: 'bad', text: t.badHandle }); return }
    const data = {}
    const use = []
    for (const f of fields) {
      if (f === 'displayName' && name.trim()) { data.displayName = name.trim(); use.push(f) }
      if (f === 'kunya' && local.kunya) { data.kunya = local.kunya; use.push(f) }
      if (f === 'bio' && bio.trim()) { data.bio = bio.trim(); use.push(f) }
      if (f === 'stamps') { data.stamps = stamps.filter((s) => local.earned.includes(s)); use.push(f) }
      if (f === 'favSurah') { const n = Number(surah); if (Number.isInteger(n) && n >= 1 && n <= 114) { data.favSurah = n; use.push(f) } }
    }
    setBusy(true); setMsg(null); setNeedVerify(false)
    try {
      const r = await savePublicProfile({ handle: h, enabled: on, allowIndex, fields: use, data }, !saved)
      apply(r.profile)
      setMsg({ tone: 'ok', text: t.saved })
    } catch (err) {
      const c = errCode(err)
      if (c === 'verify_email') { setNeedVerify(true); return }
      if (['handle_taken', 'reserved', 'bad_handle'].includes(c)) setHState({ tone: 'bad', text: handleText(c) })
      setMsg({ tone: 'bad', text: c === 'consent_required' ? t.consentNeed : c === 'moderated' ? t.moderated : ['handle_taken', 'reserved', 'bad_handle'].includes(c) ? handleText(c) : t.failed })
    } finally { setBusy(false) }
  }

  const onDelete = async () => {
    setBusy(true)
    try { await deletePublicProfile(); setSaved(null); setOn(false); setHandle(''); setConsent(false); setMsg({ tone: 'ok', text: t.removed }) } catch { setMsg({ tone: 'bad', text: t.failed }) } finally { setBusy(false) }
  }

  if (!loaded) return null
  const pageUrl = saved ? `${window.location.origin}${pathFor('publicprofile', siteLang, saved.handle)}` : ''
  return (
    <Card id="public-profile" icon="user" title={t.title} lead={t.lead} testId="public-profile-section">
      <form className="prf-form" onSubmit={onSave} noValidate>
        {saved?.moderatedAt && !saved.enabled && <p className="rt-msg" role="status" data-testid="pp-moderated">{t.moderated}</p>}
        <label className="rt-switch">
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} data-testid="pp-enabled" />
          <span><strong>{t.enable}</strong></span>
        </label>
        {(on || saved) && (
          <>
            <div className="ui-field">
              <label className="ui-field__label" htmlFor={`${uid}-h`}>{t.handle}</label>
              <div className="cm-handle">
                <span className="cm-handle__pre" dir="ltr" aria-hidden="true">/u/</span>
                <input id={`${uid}-h`} className="ui-input" value={handle} maxLength={24} dir="ltr" autoCapitalize="none" spellCheck={false} autoComplete="off"
                  onChange={(e) => { setHandle(e.target.value.toLowerCase()); setHState(null) }} onBlur={() => handle && onCheck()}
                  aria-describedby={`${uid}-hh`} data-testid="pp-handle" />
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onCheck}>{t.check}</button>
              </div>
              <span className="ui-field__hint" id={`${uid}-hh`}>{t.handleHint}</span>
              {hState && <span className={`rt-note acc-msg--${hState.tone}`} role="status" data-testid="pp-handle-state">{hState.text}</span>}
            </div>

            <fieldset className="cm-fields">
              <legend className="rt-card__title">{t.show}</legend>
              {PP_FIELDS.map((f) => {
                const disabled = f === 'kunya' && !local.kunya
                return (
                  <label key={f} className="rt-switch">
                    <input type="checkbox" checked={fields.includes(f) && !disabled} disabled={disabled} onChange={() => toggle(f)} data-testid={`pp-field-${f}`} />
                    <span>
                      {t.fields[f]}
                      {f === 'kunya' && <>: <bdi>{local.kunya || t.noKunya}</bdi></>}
                    </span>
                  </label>
                )
              })}
              <p className="rt-note" data-testid="pp-worship-note"><Icon name="info" size={14} /> {t.worshipNote}</p>
            </fieldset>

            {fields.includes('displayName') && (
              <label className="ui-field">
                <span className="ui-field__label">{t.name}</span>
                <input className="ui-input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} data-testid="pp-name" />
              </label>
            )}
            {fields.includes('bio') && (
              <label className="ui-field">
                <span className="ui-field__label">{t.bio}</span>
                <textarea className="ui-input" rows={2} value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)} data-testid="pp-bio" />
                <span className="ui-field__hint ui-num">{[...bio].length} / 160</span>
              </label>
            )}
            {fields.includes('favSurah') && (
              <label className="ui-field cm-narrow">
                <span className="ui-field__label">{t.surah}</span>
                <input className="ui-input" type="number" inputMode="numeric" min={1} max={114} value={surah} onChange={(e) => setSurah(e.target.value)} data-testid="pp-surah" />
              </label>
            )}
            {fields.includes('stamps') && (
              local.earned.length ? (
                <fieldset className="cm-chips">
                  <legend className="ui-sr-only">{t.fields.stamps}</legend>
                  {local.earned.map((s) => (
                    <label key={s} className="rt-switch">
                      <input type="checkbox" checked={stamps.includes(s)} onChange={() => setStamps((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]))} />
                      <span>{stampName(s, lang)}</span>
                    </label>
                  ))}
                </fieldset>
              ) : <p className="rt-note">{t.noStamps}</p>
            )}

            <label className="rt-switch">
              <input type="checkbox" checked={allowIndex} onChange={(e) => setAllowIndex(e.target.checked)} data-testid="pp-index" />
              <span>{t.index} <span className="rt-note">— {t.indexHint}</span></span>
            </label>
            {!saved && (
              <label className="acc-check">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="pp-consent" />
                <span>{t.consent}</span>
              </label>
            )}
            <div className="rt-row">
              <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} data-testid="pp-save"><Icon name="check" className="ui-btn__icon" /> {t.save}</button>
              {saved?.enabled && <a className="ui-btn ui-btn--secondary ui-btn--sm" href={pageUrl} data-testid="pp-view"><Icon name="external" className="ui-btn__icon" /> {t.view}</a>}
              {saved && <Confirm t={t} label={t.remove} onYes={onDelete} testId="pp-delete" icon="trash" />}
            </div>
          </>
        )}
        {needVerify && <VerifyEmailNote lang={lang} testId="pp-verify" />}
        <Msg msg={msg} testId="pp-msg" />
      </form>
    </Card>
  )
}

// ── K5. Həftəlik hesabat ──
function WeeklySection({ lang, user }) {
  const t = pickUi(WK, lang, 'en')
  const uid = useId()
  const [data, setData] = useState(null)
  const [on, setOn] = useState(false)
  const [wd, setWd] = useState(5)
  const [consent, setConsent] = useState(false)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => getWeekly().then((d) => {
    setData(d)
    if (d.prefs) { setOn(d.prefs.enabled); setWd(d.prefs.weekday) }
    writeLocalWeekly(d.prefs)
  }).catch(() => setData({ prefs: null, emailVerified: Boolean(user?.emailVerified), stats: [] })), [user])
  useEffect(() => { load() }, [load])

  const preview = useMemo(() => {
    try { const now = new Date(); const weekEnd = nextReportDate(now, wd); return { weekEnd, ...computeWeekly(undefined, { weekEnd, today: dayKey(now) }) } } catch { return null }
  }, [wd])

  const onSave = async (e) => {
    e.preventDefault()
    if (!data?.prefs && !consent) { setMsg({ tone: 'bad', text: t.consentNeed }); return }
    setBusy(true); setMsg(null)
    try {
      let tz = 'UTC'
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { /* */ }
      const r = await saveWeeklyPrefs({ enabled: on, weekday: wd, tz, lang }, !data?.prefs)
      writeLocalWeekly(r.prefs)
      if (r.prefs.enabled) await maybeUpload({ force: true }).catch(() => null)
      await load()
      setMsg({ tone: 'ok', text: t.saved })
    } catch (err) {
      setMsg({ tone: 'bad', text: errCode(err) === 'consent_required' ? t.consentNeed : t.failed })
    } finally { setBusy(false) }
  }
  const onWipe = async () => {
    setBusy(true)
    try { await deleteWeekly(); writeLocalWeekly(null); setOn(false); setConsent(false); await load(); setMsg({ tone: 'ok', text: t.wiped }) } catch { setMsg({ tone: 'bad', text: t.failed }) } finally { setBusy(false) }
  }

  if (!data) return null
  return (
    <Card id="weekly" icon="mail" title={t.title} lead={t.lead} testId="weekly-section">
      <form className="prf-form" onSubmit={onSave} noValidate>
        {!data.emailVerified && <p className="rt-msg" role="status">{t.unverified}</p>}
        <label className="rt-switch">
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} data-testid="weekly-enabled" />
          <span><strong>{t.enable}</strong></span>
        </label>
        <label className="ui-field cm-narrow" htmlFor={`${uid}-wd`}>
          <span className="ui-field__label">{t.weekday}</span>
          <select id={`${uid}-wd`} className="ui-select" value={wd} onChange={(e) => setWd(Number(e.target.value))} data-testid="weekly-weekday">
            {t.days.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </label>
        {!data.prefs && (
          <label className="acc-check">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="weekly-consent" />
            <span>{t.consent}</span>
          </label>
        )}
        <p className="rt-note">{t.skipNote}</p>
        <div className="rt-row">
          <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} data-testid="weekly-save"><Icon name="check" className="ui-btn__icon" /> {t.save}</button>
          {data.prefs && <Confirm t={t} label={t.wipe} onYes={onWipe} testId="weekly-wipe" icon="trash" />}
        </div>
        {data.nextReport && <p className="rt-note" data-testid="weekly-next">{t.next} <strong>{fmtDay(data.nextReport, lang)}</strong></p>}
        <Msg msg={msg} testId="weekly-msg" />
      </form>
      {preview && (
        <div className="cm-week" data-testid="weekly-preview">
          <p className="rt-card__title">{t.preview}</p>
          <dl className="cm-week__grid">
            <div><dt>{t.prayers}</dt><dd className="ui-num">{nf(preview.prayers, lang)} / {nf(35, lang)}</dd></div>
            <div><dt>{t.pages}</dt><dd className="ui-num">{preview.quranPages == null ? '—' : nf(preview.quranPages, lang)}</dd></div>
            <div><dt>{t.dhikr}</dt><dd className="ui-num">{nf(preview.dhikr, lang)}</dd></div>
            <div><dt>{t.fasts}</dt><dd className="ui-num">{nf(preview.fasts, lang)}</dd></div>
            <div><dt>{t.wird}</dt><dd className="ui-num">{preview.wirdPct == null ? t.noWird : `${nf(preview.wirdPct, lang)}%`}</dd></div>
          </dl>
        </div>
      )}
    </Card>
  )
}

// ── K4. Məscid nümayəndəsi ──
const emptyRules = () => Object.fromEntries(PRAYERS.map((p) => [p, { mode: 'none', value: '' }]))
function rulesFrom(iq) {
  const out = emptyRules()
  for (const p of PRAYERS) {
    const v = iq && iq[p]
    if (Number.isInteger(v)) out[p] = { mode: 'offset', value: String(v) }
    else if (typeof v === 'string') out[p] = { mode: 'fixed', value: v }
  }
  return out
}
const addDays = (key, n) => { const d = new Date(`${key}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

function MosqueRepSection({ lang, siteLang }) {
  const t = pickUi(MR, lang, 'en')
  const uid = useId()
  const [data, setData] = useState(null)
  const [noMosque, setNoMosque] = useState(false)
  const [name, setName] = useState('')
  const [rules, setRules] = useState(emptyRules)
  const [jTime, setJTime] = useState('')
  const [jTopic, setJTopic] = useState('')
  const [note, setNote] = useState('')
  const [ann, setAnn] = useState('')
  const [until, setUntil] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => getMosqueRep().then((d) => {
    setData(d)
    const i = d.info
    setName(i?.name || ''); setRules(rulesFrom(i?.iqama)); setJTime(i?.jumuah?.time || ''); setJTopic(i?.jumuah?.topic || ''); setNote(i?.ramadanNote || '')
    setUntil((u) => u || addDays(d.today, 7))
  }).catch((e) => { if (errCode(e) === 'no_mosque' || (e && e.status === 403)) setNoMosque(true) }), [])
  useEffect(() => { load() }, [load])

  const run = async (fn, ok) => {
    setBusy(true); setMsg(null)
    try { await fn(); await load(); if (ok) setMsg({ tone: 'ok', text: ok }); return true } catch { setMsg({ tone: 'bad', text: t.failed }); return false } finally { setBusy(false) }
  }
  const onSave = (e) => {
    e.preventDefault()
    const iqama = {}
    for (const p of PRAYERS) {
      const r = rules[p]
      if (r.mode === 'offset' && r.value !== '') iqama[p] = Number(r.value)
      if (r.mode === 'fixed' && r.value) iqama[p] = r.value
    }
    run(() => saveMosqueRep({ name, iqama, jumuah: { time: jTime, topic: jTopic }, ramadanNote: note }), t.saved)
  }
  const onAdd = async (e) => {
    e.preventDefault()
    if (!ann.trim()) return
    if (await run(() => addMosqueAnnouncement(ann.trim(), until), null)) setAnn('')
  }
  const setRule = (p, patch) => setRules((c) => ({ ...c, [p]: { ...c[p], ...patch } }))

  if (noMosque) return <Card id="mosque-rep" icon="mosques" title={t.title} lead={t.noMosque} testId="mosque-rep-section" />
  if (!data) return null
  const tvLink = `${window.location.origin}${pathFor('mosquetv', siteLang)}?m=${encodeURIComponent(data.mosqueId)}&kiosk=1`
  return (
    <Card id="mosque-rep" icon="mosques" title={t.title} lead={t.lead} testId="mosque-rep-section">
      <p className="rt-note">{t.mosqueId}: <bdi dir="ltr"><code>{data.mosqueId}</code></bdi></p>
      <form className="prf-form" onSubmit={onSave} noValidate>
        <label className="ui-field">
          <span className="ui-field__label">{t.name}</span>
          <input className="ui-input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} data-testid="mr-name" />
        </label>
        <fieldset className="cm-iqama">
          <legend className="rt-card__title">{t.iqama}</legend>
          {PRAYERS.map((p) => (
            <div key={p} className="cm-iqama__row">
              <span className="cm-iqama__name" id={`${uid}-${p}`}>{t.prayers[p]}</span>
              <select className="ui-select" value={rules[p].mode} aria-labelledby={`${uid}-${p}`} onChange={(e) => setRule(p, { mode: e.target.value, value: e.target.value === 'offset' ? '10' : e.target.value === 'fixed' ? '13:00' : '' })} data-testid={`mr-mode-${p}`}>
                <option value="none">{t.none}</option>
                <option value="offset">{t.offset}</option>
                <option value="fixed">{t.fixed}</option>
              </select>
              {rules[p].mode === 'offset' && <input className="ui-input" type="number" min={0} max={180} inputMode="numeric" value={rules[p].value} aria-label={`${t.prayers[p]}: ${t.offset}`} onChange={(e) => setRule(p, { value: e.target.value })} data-testid={`mr-value-${p}`} />}
              {rules[p].mode === 'fixed' && <input className="ui-input" type="time" value={rules[p].value} aria-label={`${t.prayers[p]}: ${t.fixed}`} onChange={(e) => setRule(p, { value: e.target.value })} data-testid={`mr-value-${p}`} />}
            </div>
          ))}
        </fieldset>
        <fieldset className="cm-iqama">
          <legend className="rt-card__title">{t.jumuah}</legend>
          <label className="ui-field cm-narrow">
            <span className="ui-field__label">{t.jTime}</span>
            <input className="ui-input" type="time" value={jTime} onChange={(e) => setJTime(e.target.value)} data-testid="mr-jtime" />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">{t.jTopic}</span>
            <input className="ui-input" value={jTopic} maxLength={120} onChange={(e) => setJTopic(e.target.value)} data-testid="mr-jtopic" />
          </label>
        </fieldset>
        <label className="ui-field">
          <span className="ui-field__label">{t.ramadan}</span>
          <textarea className="ui-input" rows={3} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="rt-row">
          <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} data-testid="mr-save"><Icon name="check" className="ui-btn__icon" /> {t.save}</button>
        </div>
      </form>

      <h3 className="rt-card__title">{t.ann}</h3>
      {data.announcements.length === 0 ? <p className="rt-note">{t.annNone}</p> : (
        <ul className="rt-list" data-testid="mr-announcements">
          {data.announcements.map((a) => (
            <li key={a.id} className="rt-list__item">
              <span><span className="cm-pre">{a.body}</span><br /><span className="rt-note">{t.until}: {fmtDay(a.expiresOn, lang)}</span></span>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => run(() => deleteMosqueAnnouncement(a.id))} aria-label={`${t.del}: ${a.body.slice(0, 40)}`}><Icon name="trash" size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <form className="prf-form" onSubmit={onAdd} noValidate>
        <label className="ui-field">
          <span className="ui-field__label">{t.annBody}</span>
          <textarea className="ui-input" rows={2} value={ann} maxLength={500} onChange={(e) => setAnn(e.target.value)} data-testid="mr-ann" />
        </label>
        <label className="ui-field cm-narrow">
          <span className="ui-field__label">{t.annUntil}</span>
          <input className="ui-input" type="date" value={until} min={data.today} max={addDays(data.today, 60)} onChange={(e) => setUntil(e.target.value)} data-testid="mr-ann-until" />
        </label>
        <div className="rt-row">
          <button type="submit" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy || !ann.trim()} data-testid="mr-ann-add"><Icon name="plus" className="ui-btn__icon" /> {t.annAdd}</button>
        </div>
      </form>
      <Msg msg={msg} testId="mr-msg" />
      <CopyLink link={tvLink} label={t.tv} copyText={t.copy} copiedText={t.copied} shareText={t.share} title={t.tv} testId="mr-tv-link" />
      <p className="rt-note">{t.tvHint}</p>
    </Card>
  )
}
