// ═══════════════════════════════════════════════════════
// Zəkat səhifəsi: "Zəkat ilim tamamlananda xatırlat" (server/personal.js → PUT /api/personal/zakat)
// + keçmiş illərin hesab arxivi (yalnız localStorage — hesabın şifrəli sinxronizasiyası daşıyır).
// Hövl — bir hicri il: başlanğıcın hicri tarixi gələn hicri ildə (utils/personalDates → hawlDue, önizləmə;
// həqiqi tarixi server eyni alqoritmlə hesablayır). Məbləğ serverə YALNIZ istifadəçi ayrıca istəsə gedir.
// Girişsiz ziyarətçi: tizer + "İstifadə üçün daxil olun". ZakatPage bunu tənbəl yükləyir (hesabdan sonra).
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import Icon from '../Icon'
import { AuthMessage } from '../account/AuthUi'
import { pathFor } from '../../seo/routes'
import { getZakatReminder, setZakatReminder, deleteZakatReminder } from '../../api/personal'
import { hawlDue, localKey, addDaysKey, loadZakatArchive, saveZakatArchive, removeZakatArchive } from '../../utils/personalDates'
import { ConsentBox, ArchiveTable, PersonalTeaser, usePersonalText, usePersonalAction, useSignedIn, fmtKey, fmtHijriKey } from '../personal/PersonalUi'

export default function HawlReminder({ total = 0, zakat = 0, currency = 'USD', hasInput = false }) {
  const { t, lang, siteLang } = usePersonalText()
  const Z = t.zakat
  const { status } = useSignedIn()
  const a = usePersonalAction(t)
  const today = localKey(new Date())
  const [data, setData] = useState(null)
  const [start, setStart] = useState(today)
  const [storeAmount, setStoreAmount] = useState(false)
  const [consent, setConsent] = useState(false)
  const [archive, setArchive] = useState(() => loadZakatArchive())

  useEffect(() => {
    if (status !== 'user') return
    getZakatReminder().then(setData).catch(() => setData({ reminder: null, consent: false }))
  }, [status])

  const preview = start && start <= addDaysKey(today, 366) ? hawlDue(start, today) : null
  const needConsent = data && !data.consent
  const num = useMemo(() => { try { return new Intl.NumberFormat(lang === 'az' ? 'az-Latn-AZ' : lang, { maximumFractionDigits: 2 }) } catch { return null } }, [lang])
  const money = (v, c) => `${num ? num.format(v) : v} ${c}`
  const r = data?.reminder

  const onSave = (e) => {
    e.preventDefault()
    if (!preview) { a.show('bad', t.err.date); return }
    if (needConsent && !consent) { a.show('bad', t.consentNeed); return }
    a.run(async () => {
      const reminder = await setZakatReminder({ hawlStart: start, storeAmount, amount: Math.round(zakat * 100) / 100, currency, lang, consent: needConsent ? consent : false })
      setData((d) => ({ ...(d || {}), reminder, consent: true }))
    }, Z.saved)
  }
  const onArchive = () => { setArchive(saveZakatArchive({ date: today, total, zakat, currency })); a.show('ok', Z.archived) }

  return (
    <section className="ui-section ui-section--tight pr-hawl" aria-labelledby="pr-hawl-title" data-testid="hawl-reminder">
      <div className="ui-container ui-container--narrow">
        <div className="ui-card pr-hawl__card">
          <header className="acc-section__head">
            <span className="ui-icon-tile"><Icon name="bell" size={20} /></span>
            <div>
              <h2 className="acc-section__title" id="pr-hawl-title">{Z.title}</h2>
              <p className="acc-section__lead">{Z.lead}</p>
            </div>
          </header>

          {status !== 'user' ? (
            <PersonalTeaser text={t.teaser.zakat} next={pathFor('zakat', siteLang)} testId="hawl-teaser" />
          ) : data === null ? <div className="spinner-wrap"><div className="spinner" /></div> : (
            <>
              {r && (
                <div className="pr-zakat" data-testid="hawl-current">
                  <p className="pr-zakat__due"><Icon name="calendar" size={16} /> {Z.due(fmtKey(r.dueOn, lang), fmtHijriKey(r.dueOn, lang))}</p>
                  {r.amount != null && r.currency && <p className="acc-list__meta">{Z.lastAmount(money(r.amount, r.currency))}</p>}
                  <div><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={a.busy}
                    onClick={() => a.run(async () => { await deleteZakatReminder(); setData((d) => ({ ...d, reminder: null })) }, Z.removed)}>
                    <Icon name="trash" className="ui-btn__icon" /> {Z.remove}</button></div>
                </div>
              )}
              <form className="acc-form pr-form" onSubmit={onSave} noValidate>
                <div className="ui-field">
                  <label className="ui-field__label" htmlFor="pr-hawl-start">{Z.start}</label>
                  <input id="pr-hawl-start" type="date" className="ui-input pr-date" value={start} max={addDaysKey(today, 366)} onChange={(e) => setStart(e.target.value)} />
                </div>
                {preview && <p className="pr-preview" data-testid="hawl-preview"><Icon name="moon" size={14} /> {Z.due(fmtKey(preview, lang), fmtHijriKey(preview, lang))}</p>}
                {hasInput && zakat > 0 && (
                  <label className="acc-check pr-toggle" htmlFor="pr-hawl-amount">
                    <input id="pr-hawl-amount" type="checkbox" checked={storeAmount} onChange={(e) => setStoreAmount(e.target.checked)} />
                    <span>{Z.storeAmount} — {money(Math.round(zakat * 100) / 100, currency)}</span>
                  </label>
                )}
                {needConsent && <ConsentBox t={t} checked={consent} onChange={setConsent} id="pr-hawl-consent" />}
                <div>
                  <button type="submit" className="ui-btn ui-btn--primary" data-testid="hawl-save" disabled={a.busy || !preview || (needConsent && !consent)}>
                    <Icon name="bell" className="ui-btn__icon" /> {a.busy ? t.busy : Z.remind}
                  </button>
                </div>
              </form>
            </>
          )}
          <AuthMessage msg={a.msg} />

          <h3 className="pr-subtitle">{Z.archive}</h3>
          <p className="acc-list__meta">{Z.archiveLead}</p>
          {hasInput && (
            <div><button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onArchive} data-testid="hawl-archive-save">
              <Icon name="download" className="ui-btn__icon" /> {Z.saveArchive}</button></div>
          )}
          {archive.length === 0 ? <p className="acc-empty">{Z.archiveEmpty}</p>
            : <ArchiveTable Z={Z} t={t} lang={lang} list={archive} money={money} onRemove={(d) => setArchive(removeZakatArchive(d))} />}
        </div>
      </div>
    </section>
  )
}
