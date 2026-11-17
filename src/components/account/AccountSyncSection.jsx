// ═══════════════════════════════════════════════════════
// /account → "Sinxronizasiya və tərəqqim": hesaba bağlı, uçdan-uca şifrəli sinxronizasiya
// Məntiq: utils/accountSync.js (vəziyyətlər: linked | needCode | choose | offerLink | offerEnable).
// Mövcud hesabsız sinxronizasiyanın UI elementləri (BackupCard.css: sy-code, sy-auto, bk-actions)
// təkrar istifadə olunur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import Icon from '../Icon'
import { AuthMessage, PasswordField } from './AuthUi'
import { fillText } from './authText'
import { ACC_SYNC_TXT } from './syncText'
import { readSync, setAuto } from '../../utils/userSync'
import { autoSyncOnce } from '../../utils/autoSync'
import {
  EVENT, readState, reconcile, enterCode, resolveChoice, linkExisting, enableForAccount, addPrfWrap,
  protectionInfo, hasPasswordKey, syncErrorKey,
} from '../../utils/accountSync'
import { passkeyPrf, passkeySupported } from '../../api/userAuth'
import '../../styles/BackupCard.css'

const CODE_PH = 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX'
const masked = (c) => c.split('-').map((g, i) => (i === 0 ? g : '••••')).join('-')

function downloadCode(code, head) {
  try {
    const blob = new Blob([`${head}\n\n${code}\n\nhttps://muslims.cc/account\n`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'muslims-cc-recovery-code.txt'; a.rel = 'noopener'; a.style.display = 'none'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch { /* köhnə brauzer */ }
}

/** Kod qutusu: göstər/gizlət, kopyala, faylı yüklə */
function CodeBox({ code, l, open = false }) {
  const [shown, setShown] = useState(open)
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 1800) } catch { /* */ }
  }
  return (
    <div className="acc-sync__code">
      <code className={`sy-code${open ? '' : ' sy-code--sm'}`} dir="ltr" data-testid="acc-sync-code">{shown ? code : masked(code)}</code>
      {!open && <button type="button" className="ui-link sy-link" onClick={() => setShown((v) => !v)} aria-pressed={shown}>{shown ? l.hide : l.show}</button>}
      <button type="button" className="ui-link sy-link" onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? l.copied : l.copy}</button>
      <button type="button" className="ui-link sy-link" onClick={() => downloadCode(code, l.fileHead)}><Icon name="download" size={14} /> {l.download}</button>
    </div>
  )
}

export default function AccountSyncSection({ user, fmt }) {
  const { lang } = useLang()
  const l = pickUi(ACC_SYNC_TXT, lang, 'en')
  const [st, setSt] = useState(readState)
  const [sync, setSync] = useState(readSync)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState(null)
  const [created, setCreated] = useState(null)
  const [prot, setProt] = useState(null)
  const [pw, setPw] = useState('')
  const [codeIn, setCodeIn] = useState('')
  const seq = useRef(0)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  const refresh = useCallback(() => { setSt(readState()); setSync(readSync()) }, [])
  useEffect(() => {
    const on = () => refresh()
    window.addEventListener(EVENT, on)
    window.addEventListener('qm-autosync', on)
    // Girişdən sonrakı axın hələ gedirsə — onun nəticəsini gözləyir; yoxsa vəziyyəti yoxlayır
    reconcile(user).then(refresh, refresh)
    return () => { window.removeEventListener(EVENT, on); window.removeEventListener('qm-autosync', on) }
  }, [user, refresh])

  const linked = Boolean(sync && sync.acct === user.id)
  const status = linked ? 'linked' : (st && st.uid === user.id ? st.status : 'checking')

  useEffect(() => {
    if (!linked) return undefined
    let on = true
    protectionInfo().then((p) => { if (on) setProt(p) }).catch(() => {})
    return () => { on = false }
  }, [linked, user.passkeys])

  const show = (tone, text) => setMsg({ tone, text, seq: ++seq.current })
  const run = async (name, fn, okText) => {
    if (busy) return false
    setBusy(name); setMsg(null)
    try {
      await fn()
      if (alive.current && okText) show('ok', okText)
      return true
    } catch (e) {
      if (alive.current && e?.name !== 'NotAllowedError' && e?.name !== 'AbortError') show('bad', l.errors[syncErrorKey(e)] || l.errors.network)
      return false
    } finally {
      if (alive.current) { setBusy(''); refresh() }
    }
  }

  // Şifrəli hesabda açar yaddaşda yoxdursa (səhifə yenilənib) — şifrə soruşulur
  const needPw = user.hasPassword && !hasPasswordKey(user.id)
  const pwField = needPw && (
    <>
      <input type="email" name="username" autoComplete="username" value={user.email || ''} readOnly hidden />
      <PasswordField label={l.pwConfirm} value={pw} onChange={setPw} autoComplete="current-password" name="sync-password" describedBy="acc-sync-pw-why" />
      <p className="acc-sync__meta" id="acc-sync-pw-why">{l.pwWhy}</p>
    </>
  )
  const pwArg = () => (needPw ? { password: pw } : {})
  const spin = (name) => (busy === name ? <span className="ui-spin" aria-hidden="true" /> : null)

  const onEnterCode = (e) => {
    e.preventDefault()
    run('code', async () => {
      const r = await enterCode(user, codeIn)
      if (r === 'linked') { setCodeIn(''); show('ok', l.restored) }
    })
  }
  const onChoose = (prefer) => run(prefer, async () => { await resolveChoice(user, prefer) }, l.restored)
  const onLink = (e) => {
    e.preventDefault()
    run('link', async () => { await linkExisting(user, pwArg()); setPw('') }, l.linkedOk)
  }
  const onEnable = (e) => {
    e.preventDefault()
    run('enable', async () => {
      const r = await enableForAccount(user, pwArg())
      setPw('')
      if (!user.hasPassword) setCreated(r.code)
    }, user.hasPassword ? l.linkedOk : null)
  }
  const onProtect = (e) => {
    e.preventDefault()
    run('protect', async () => { await linkExisting(user, { password: pw }); setPw(''); setProt(await protectionInfo()) }, l.linkedOk)
  }
  const onAddPrf = () => run('prf', async () => {
    const prf = await passkeyPrf()
    if (!prf) { show('bad', l.prfNo); return }
    await addPrfWrap(user, prf)
    setProt(await protectionInfo())
    show('ok', l.prfAdded)
  })
  const onSyncNow = () => run('now', async () => {
    const r = await autoSyncOnce({ force: true })
    if (r === 'error') throw new Error('network')
    if (r === 'conflict') throw new Error('conflict')
  }, l.synced)

  const myPasskeys = (user.passkeys || []).map((k) => k.id)
  const hasPrfWrap = Boolean(prot && prot.prf.some((id) => myPasskeys.includes(id)))
  const canAddPrf = linked && prot && myPasskeys.length > 0 && !hasPrfWrap && passkeySupported()

  return (
    <section className="ui-card acc-section" aria-labelledby="acc-sync" data-testid="acc-sync" data-status={status}>
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name="refresh" size={20} /></span>
        <div>
          <h2 className="acc-section__title" id="acc-sync">{l.title}</h2>
          <p className="acc-section__lead">{l.lead}</p>
        </div>
      </header>

      <div className="acc-sync">
        {created && (
          <div className="acc-sync__box" role="status" data-testid="acc-sync-created">
            <h3>{l.createdTitle}</h3>
            <p>{l.createdLead}</p>
            <CodeBox code={created} l={l} open />
            <p className="sy-warn"><Icon name="alert" size={15} /> {l.codeExplain}</p>
            <div className="bk-actions"><button type="button" className="ui-btn ui-btn--primary" onClick={() => setCreated(null)}>{l.done}</button></div>
          </div>
        )}

        {status === 'checking' && <p className="acc-sync__meta" role="status"><span className="ui-spin" aria-hidden="true" /> {l.checking}</p>}

        {status === 'linked' && !created && (
          <>
            <p className="acc-sync__state"><span className="sy-dot" aria-hidden="true" /> {l.linked}</p>
            <p className="acc-sync__meta">{l.lastSync}: {sync.syncedAt ? fmt(Date.parse(sync.syncedAt)) : l.never}</p>
            <label className="sy-auto">
              <input type="checkbox" checked={sync.auto === true} onChange={(e) => { setAuto(e.target.checked); refresh() }} data-testid="acc-sync-auto" />
              <span><b>{l.auto}</b><small>{l.autoHint}</small></span>
            </label>
            {prot && (
              <div>
                <p className="acc-sync__meta"><b>{l.protTitle}</b></p>
                <ul className="acc-sync__prot" data-testid="acc-sync-prot">
                  {prot.password && <li><Icon name="lock" size={16} /> {l.protPassword}</li>}
                  {hasPrfWrap && <li><Icon name="key" size={16} /> {l.protPasskey}</li>}
                  <li><Icon name="shield" size={16} /> {l.protCode}</li>
                </ul>
                {!prot.password && !hasPrfWrap && <p className="sy-warn"><Icon name="alert" size={15} /> {l.protCodeOnly}</p>}
              </div>
            )}
            <div>
              <p className="acc-sync__meta">{l.codeLabel}</p>
              <CodeBox code={sync.code} l={l} />
              <p className="acc-sync__meta">{l.codeExplain}</p>
            </div>
            {prot && user.hasPassword && !prot.password && (
              <form className="acc-form" onSubmit={onProtect} noValidate>
                {pwField || null}
                <div><button type="submit" className="ui-btn ui-btn--secondary" disabled={Boolean(busy) || (needPw && !pw)}>{spin('protect')}<Icon name="lock" className="ui-btn__icon" /> {l.protectBtn}</button></div>
              </form>
            )}
            <div className="bk-actions">
              <button type="button" className="ui-btn ui-btn--primary" onClick={onSyncNow} disabled={Boolean(busy)}>{spin('now')}<Icon name="refresh" className="ui-btn__icon" /> {l.syncNow}</button>
              {canAddPrf && <button type="button" className="ui-btn ui-btn--secondary" onClick={onAddPrf} disabled={Boolean(busy)}>{spin('prf')}<Icon name="key" className="ui-btn__icon" /> {l.addPrf}</button>}
            </div>
          </>
        )}

        {status === 'needCode' && (
          <form className="acc-sync__box" onSubmit={onEnterCode} data-testid="acc-sync-need-code">
            <h3>{l.needTitle}</h3>
            <p>{l.needLead}</p>
            <label className="ui-field">
              <span className="ui-field__label">{l.codeLabel}</span>
              <input className="ui-input sy-input" value={codeIn} onChange={(e) => setCodeIn(e.target.value)} placeholder={CODE_PH}
                autoComplete="off" autoCapitalize="characters" spellCheck="false" dir="ltr" />
            </label>
            <div className="bk-actions">
              <button type="submit" className="ui-btn ui-btn--primary" disabled={Boolean(busy) || codeIn.trim().length < 20}>{spin('code')}<Icon name="key" className="ui-btn__icon" /> {l.connect}</button>
            </div>
          </form>
        )}

        {status === 'choose' && (
          <div className="bk-confirm" role="alertdialog" aria-labelledby="acc-sync-choose-t" data-testid="acc-sync-choose">
            <p id="acc-sync-choose-t" className="bk-confirm__t">{l.chooseTitle}</p>
            <p className="bk-confirm__meta">{fillText(l.chooseLead, lang, { n: st?.conflicts || 0 })}</p>
            <div className="bk-actions">
              <button type="button" className="ui-btn ui-btn--primary" onClick={() => onChoose('remote')} disabled={Boolean(busy)}>{spin('remote')}{l.useAccount}</button>
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => onChoose('local')} disabled={Boolean(busy)}>{spin('local')}{l.useDevice}</button>
            </div>
          </div>
        )}

        {(status === 'offerLink' || status === 'offerEnable') && (
          <form className="acc-sync__box" onSubmit={status === 'offerLink' ? onLink : onEnable} data-testid={`acc-sync-${status}`}>
            <h3>{status === 'offerLink' ? l.linkTitle : l.enableTitle}</h3>
            <p>{status === 'offerLink' ? l.linkLead : l.enableLead}</p>
            {pwField}
            <div className="bk-actions">
              <button type="submit" className="ui-btn ui-btn--primary" disabled={Boolean(busy) || (needPw && !pw)}>
                {spin(status === 'offerLink' ? 'link' : 'enable')}<Icon name="shield" className="ui-btn__icon" /> {status === 'offerLink' ? l.linkBtn : l.enableBtn}
              </button>
            </div>
          </form>
        )}

        <AuthMessage msg={msg} />
      </div>
    </section>
  )
}
