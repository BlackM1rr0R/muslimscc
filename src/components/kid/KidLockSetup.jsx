// ═══════════════════════════════════════════════════════
// H5 — uşaq rejimini qurmaq: PIN (iki dəfə), profil (profillər açıqdırsa), "Uşaq rejimini aç".
// /kids → "Valideynlərə" bölməsi və /account. PIN dəyişmək — köhnə PIN ilə. utils/kidLock
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useEffect, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import Icon from '../Icon'
import { readLock, setPin, enableLock, verifyPin, clearPin, PIN_RE, KIDLOCK_EVENT } from '../../utils/kidLock'
import { readRegistry, activeId } from '../../utils/profileCore'
import { KID_TXT } from './kidText'
import '../../styles/My.css'

const PinDialog = lazy(() => import('./PinDialog'))

export default function KidLockSetup({ heading = false }) {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(KID_TXT, lang, 'en')
  const [lock, setLock] = useState(() => readLock())
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [changing, setChanging] = useState(false)
  const [askOld, setAskOld] = useState(false)
  const reg = readRegistry()
  const [pid, setPid] = useState(() => reg?.list.find((p) => p.kid)?.id || activeId() || '')
  useEffect(() => {
    const on = () => setLock(readLock())
    window.addEventListener(KIDLOCK_EVENT, on)
    return () => window.removeEventListener(KIDLOCK_EVENT, on)
  }, [])

  const savePin = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    if (!PIN_RE.test(p1)) { setErr(t.bad); return }
    if (p1 !== p2) { setErr(t.mismatch); return }
    setBusy(true)
    try { setLock(await setPin(p1)); setP1(''); setP2(''); setChanging(false); setMsg(t.saved) } catch { setErr(t.noCrypto) } finally { setBusy(false) }
  }
  const turnOn = async () => {
    // Profillər açıqdırsa — əvvəl seçilən profilə keç (kilid açıq ikən keçid bağlıdır)
    if (reg && pid && pid !== activeId()) {
      const { switchProfile } = await import('../../utils/profiles')
      if (!switchProfile(pid)) return
      enableLock(undefined, pid)
      window.location.assign(pathFor('kids', siteLang))
      return
    }
    enableLock(undefined, reg ? pid || null : null)
    window.scrollTo(0, 0)
  }

  if (lock.on) {
    return <div className="kid-setup" data-testid="kid-setup">{heading && <h3 className="kids-sub-title" id="kid-setup-h">{t.setupTitle}</h3>}<p className="kid-setup__on"><Icon name="lock" size={16} /> {t.isOn}</p></div>
  }
  const pinForm = (
    <form className="kid-setup__form" onSubmit={savePin} data-testid="kid-setup-form">
      <label className="ui-field" htmlFor="ks-p1">
        <span className="ui-field__label">{t.pin1}</span>
        <input id="ks-p1" className="ui-input ui-num" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6}
          value={p1} onChange={(e) => setP1(e.target.value.replace(/\D/g, '').slice(0, 6))} data-testid="kid-pin1" />
      </label>
      <label className="ui-field" htmlFor="ks-p2">
        <span className="ui-field__label">{t.pin2}</span>
        <input id="ks-p2" className="ui-input ui-num" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6}
          value={p2} onChange={(e) => setP2(e.target.value.replace(/\D/g, '').slice(0, 6))} data-testid="kid-pin2" />
      </label>
      <button type="submit" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy} data-testid="kid-pin-save"><Icon name="key" className="ui-btn__icon" /> {lock.pin ? t.change : t.savePin}</button>
    </form>
  )
  return (
    <div className="kid-setup" data-testid="kid-setup">
      {heading && <h3 className="kids-sub-title" id="kid-setup-h"><Icon name="lock" size={18} /> {t.setupTitle}</h3>}
      <p className="kid-setup__lead">{t.setupLead}</p>
      {(!lock.pin || changing) && pinForm}
      {lock.pin && !changing && (
        <div className="kid-setup__ready">
          {reg && (
            <label className="ui-field" htmlFor="ks-prof">
              <span className="ui-field__label">{t.profile}</span>
              <select id="ks-prof" className="ui-select" value={pid} onChange={(e) => setPid(e.target.value)} aria-describedby="ks-prof-h">
                {reg.list.map((p) => <option key={p.id} value={p.id}>{p.name}{p.kid ? ` (${t.kidTag})` : ''}</option>)}
              </select>
              <span className="ui-field__hint" id="ks-prof-h">{t.profileHint}</span>
            </label>
          )}
          <div className="kid-setup__btns">
            <button type="button" className="ui-btn ui-btn--primary" onClick={turnOn} data-testid="kid-enable"><Icon name="lock" className="ui-btn__icon" /> {t.enable}</button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAskOld(true)} data-testid="kid-change">{t.change}</button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { clearPin(); setLock(readLock()) }}>{t.forget}</button>
          </div>
        </div>
      )}
      <p className="kid-setup__err" role="alert">{err}</p>
      <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>
      <p className="kid-setup__honest"><Icon name="info" size={14} /> {t.honest}</p>
      {askOld && (
        <Suspense fallback={null}>
          <PinDialog t={t} title={t.change} lead={t.current} submit={t.change} action={(pin) => verifyPin(pin)}
            onClose={() => setAskOld(false)} onUnlocked={() => { setAskOld(false); setChanging(true) }} />
        </Suspense>
      )}
    </div>
  )
}
