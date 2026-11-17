// ═══════════════════════════════════════════════════════
// Şəxsi xatırlatmaların ortaq UI parçaları: razılıq qutusu, "daxil olun" tizeri, mesaj köməkçisi.
// (components/account/PersonalSections, DuaCapsule, zakat/HawlReminder, DuaJournalPage)
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { useAuthUser, refreshMe } from '../../api/userSession'
import { personalErrorKey } from '../../api/personal'
import { formatGregorian, formatHijri, gregorianToHijri, parseGKey } from '../../utils/hijri'
import { PT } from '../account/personalText'
import '../../styles/Personal.css'

export function usePersonalText() {
  const { lang, siteLang = lang } = useLang()
  return { t: pickUi(PT, lang, 'en'), lang, siteLang }
}

/** 'YYYY-MM-DD' → "17 noyabr 2026" */
export const fmtKey = (key, lang) => { const g = parseGKey(key); return g ? formatGregorian(g, lang) : '' }
export const fmtHijriKey = (key, lang) => { const g = parseGKey(key); return g ? formatHijri(gregorianToHijri(g), lang) : '' }
export const fmtMs = (ms, lang) => {
  if (!ms) return ''
  const d = new Date(ms)
  return formatGregorian({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }, lang)
}

/** Giriş vəziyyəti: ipucu varsa /me bir dəfə yoxlanır. 'anon' | 'unknown' | 'user' */
export function useSignedIn() {
  const { status, user } = useAuthUser()
  const asked = useRef(false)
  useEffect(() => {
    if (status === 'unknown' && !asked.current) { asked.current = true; refreshMe().catch(() => {}) }
  }, [status])
  return { status, user }
}

/** Razılıq qutusu — ilk istifadədə; qeyd + məcburi işarə */
export function ConsentBox({ t, checked, onChange, id }) {
  return (
    <div className="pr-consent" role="group" aria-labelledby={`${id}-t`}>
      <p className="pr-consent__title" id={`${id}-t`}><Icon name="shield" size={16} /> {t.consentTitle}</p>
      <p className="pr-consent__note" id={`${id}-n`}>{t.consentNote}</p>
      <label className="acc-check pr-consent__check" htmlFor={id}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-describedby={`${id}-n`} data-testid={`${id}`} />
        <span>{t.consentCheck}</span>
      </label>
    </div>
  )
}

/** Girişsiz ziyarətçiyə: qısa izah + "İstifadə üçün daxil olun" → /login?next=… */
export function PersonalTeaser({ text, next, testId = 'personal-teaser', icon = 'bell' }) {
  const { t, siteLang } = usePersonalText()
  const href = `${pathFor('login', siteLang)}?next=${encodeURIComponent(next || pathFor('account', siteLang))}`
  return (
    <div className="pr-teaser" data-testid={testId}>
      <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={icon} size={16} /></span>
      <p>{text}</p>
      <a className="ui-btn ui-btn--secondary ui-btn--sm" href={href}><Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {t.signIn}</a>
    </div>
  )
}

/** busy + mesaj ({ tone, text, seq }) — AuthMessage formatı */
export function usePersonalAction(t) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const seq = useRef(0)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const show = useCallback((tone, text) => setMsg({ tone, text, seq: ++seq.current }), [])
  const run = async (fn, okText) => {
    if (busy) return false
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      if (alive.current && okText) show('ok', okText)
      return true
    } catch (e) {
      if (alive.current) show('bad', t.err[personalErrorKey(e)] || t.err.unknown)
      return false
    } finally {
      if (alive.current) setBusy(false)
    }
  }
  return { busy, msg, show, run, setMsg }
}

/** Zəkat arxivi cədvəli (yalnız bu cihaz) */
export function ArchiveTable({ Z, t, lang, list, money, onRemove }) {
  return (
    <div className="pr-tablewrap">
      <table className="pr-table" data-testid="zakat-archive">
        <thead><tr><th scope="col">{Z.date}</th><th scope="col">{Z.total}</th><th scope="col">{Z.zakatDue}</th><th scope="col"><span className="ui-sr-only">{t.del}</span></th></tr></thead>
        <tbody>
          {list.map((e) => (
            <tr key={e.date}>
              <th scope="row">{fmtKey(e.date, lang)}</th>
              <td className="ui-num">{money(e.total, e.currency)}</td>
              <td className="ui-num">{money(e.zakat, e.currency)}</td>
              <td><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => onRemove(e.date)} aria-label={`${t.del}: ${fmtKey(e.date, lang)}`}><Icon name="trash" size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** "Sevdiklərim üçün dua" tizeri (dua səhifəsində): girişsiz — daxil olun; daxil olub — hesabdakı bölməyə */
export function LovedTeaser() {
  const { t, siteLang } = usePersonalText()
  const { status } = useSignedIn()
  const target = `${pathFor('account', siteLang)}#loved`
  if (status !== 'user') return <PersonalTeaser text={t.teaser.loved} next={target} testId="loved-teaser" icon="duajournal" />
  return (
    <div className="pr-teaser" data-testid="loved-teaser">
      <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="duajournal" size={16} /></span>
      <p>{t.teaser.loved}</p>
      <a className="ui-btn ui-btn--secondary ui-btn--sm" href={target}>{t.loved.title}</a>
    </div>
  )
}
