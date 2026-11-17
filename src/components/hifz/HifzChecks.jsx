// ═══════════════════════════════════════════════════════
// /hifz → "Məni yoxla" (sahib): yoxlama keçidi yarat, keçidlərim, nəticələr (server/hifzTest.js).
// Gələn nəticə avtomatik hifz təkrar planına idxal olunur (utils/hifzTestImport — bir dəfə):
// səhvli ayələr bu gün, tərəddüdlülər ən gec sabah təkrara düşür. HifzPage bu faylı tənbəl yükləyir.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { pathFor } from '../../seo/routes'
import { useAuthUser, refreshMe } from '../../api/userSession'
import { createCheck, listChecks, deleteCheck, checkLink, MAX_NAME } from '../../api/hifzCheck'
import { importTestResult, readImported, markImported, pendingImports } from '../../utils/hifzTestImport'
import { dateKey } from '../../utils/hifzSrs'
import { surahInfo } from '../../utils/mushaf'
import { HC, hcError } from './hifzCheckText'
import { surahLabel } from './surahLabel'
import { pickUi } from '../../utils/uiText'
import CopyLink from '../readroom/CopyLink'
import '../../styles/ReadTogether.css'

const fmtTime = (ms, lang) => { try { return new Date(ms).toLocaleString(lang === 'az' ? 'az-Latn-AZ' : lang, { dateStyle: 'medium', timeStyle: 'short' }) } catch { return new Date(ms).toISOString() } }

export default function HifzChecks({ lang, siteLang, setSrs }) {
  const t = pickUi(HC, lang, 'en')
  const { status, user } = useAuthUser()
  const asked = useRef(false)
  useEffect(() => { if (status === 'unknown' && !asked.current) { asked.current = true; refreshMe().catch(() => {}) } }, [status])

  const [surah, setSurah] = useState(67)
  const [from, setFrom] = useState('1')
  const [to, setTo] = useState('10')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [created, setCreated] = useState(null)   // { token }
  const [tests, setTests] = useState(null)
  const [note, setNote] = useState('')
  const max = surahInfo(surah)?.verses || 7

  useEffect(() => { if (user?.displayName) setName((n) => n || user.displayName) }, [user])
  const load = () => listChecks().then((r) => {
    const list = r.tests || []
    setTests(list)
    // Yeni nəticələr → təkrar planı (bir dəfə)
    const fresh = pendingImports(list, readImported())
    if (fresh.length) {
      const today = dateKey()
      setSrs((prev) => fresh.reduce((st, x) => importTestResult(st, x, today).state, prev))
      fresh.forEach((x) => markImported(x.id))
      setNote(t.imported)
    }
  }).catch(() => setTests([]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (status === 'user') load() }, [status])

  if (status !== 'user') {
    const next = `${pathFor('hifz', siteLang)}#hifz-check`
    return (
      <section className="ui-card rt-card hc-owner" id="hifz-check" aria-labelledby="hc-title" data-testid="hc-teaser">
        <h2 className="rt-card__title" id="hc-title"><Icon name="hifz" size={20} /> {t.title}</h2>
        <p className="rt-note">{t.lead}</p>
        <p className="rt-note">{t.signIn}</p>
        <a className="ui-btn ui-btn--secondary ui-btn--sm" href={`${pathFor('login', siteLang)}?next=${encodeURIComponent(next)}`}>
          <Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {t.signInBtn}
        </a>
      </section>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    const a = Number(from), b = Number(to)
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b > max || a > b) { setErr(t.err.range); return }
    if (!name.trim()) { setErr(t.err.name); return }
    setBusy(true); setErr('')
    try {
      const r = await createCheck({ surah, from: a, to: b, name: name.trim() })
      setCreated({ token: r.token })
      setTests((list) => [r.test, ...(list || [])])
    } catch (x) { setErr(hcError(x, t)) } finally { setBusy(false) }
  }
  const remove = async (id) => {
    try { await deleteCheck(id); setTests((l) => l.filter((x) => x.id !== id)) } catch (x) { setErr(hcError(x, t)) }
  }

  return (
    <section className="ui-card rt-card hc-owner" id="hifz-check" aria-labelledby="hc-title" data-testid="hc-owner">
      <h2 className="rt-card__title" id="hc-title"><Icon name="hifz" size={20} /> {t.title}</h2>
      <p className="rt-note">{t.lead}</p>
      <p className="rt-note"><Icon name="info" size={14} /> {t.human}</p>
      <form className="hc-form" onSubmit={submit} noValidate>
        <label className="ui-field" htmlFor="hc-surah">
          <span className="ui-field__label">{t.surah}</span>
          <select id="hc-surah" className="ui-select" value={surah} onChange={(e) => { const s = Number(e.target.value); setSurah(s); setFrom('1'); setTo(String(Math.min(10, surahInfo(s)?.verses || 7))) }}>
            {Array.from({ length: 114 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}. {surahLabel(i + 1, lang)}</option>)}
          </select>
        </label>
        <div className="rt-row">
          <label className="ui-field" htmlFor="hc-from">
            <span className="ui-field__label">{t.from}</span>
            <input id="hc-from" className="ui-input ui-num rt-page-input" type="number" inputMode="numeric" min={1} max={max} value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="ui-field" htmlFor="hc-to">
            <span className="ui-field__label">{t.to}</span>
            <input id="hc-to" className="ui-input ui-num rt-page-input" type="number" inputMode="numeric" min={1} max={max} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <label className="ui-field" htmlFor="hc-name">
          <span className="ui-field__label">{t.name}</span>
          <input id="hc-name" className="ui-input" value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} autoComplete="nickname" />
        </label>
        {err && <p className="rt-msg" role="alert">{err}</p>}
        <button type="submit" className="ui-btn ui-btn--primary" disabled={busy} data-testid="hc-create"><Icon name="link" className="ui-btn__icon" /> {busy ? t.creating : t.create}</button>
      </form>
      {created && (
        <div role="status">
          <p className="rt-note">{t.created}</p>
          <CopyLink link={checkLink(window.location.origin, pathFor('hifztest', siteLang), created.token)} label={t.link}
            copyText={t.copy} copiedText={t.copied} shareText={t.share} title={t.title} testId="hc-link" />
        </div>
      )}
      {note && <p className="rt-msg" role="status" data-testid="hc-imported">{note}</p>}
      {tests && (
        <>
          <h3 className="rt-card__title">{t.mine}</h3>
          {tests.length === 0 ? <p className="rt-note">{t.none}</p> : (
            <ul className="hc-tests" data-testid="hc-tests">
              {tests.map((x) => {
                const marks = x.result?.marks || []
                const m = marks.filter((k) => k.kind === 'mistake').length
                const h = marks.filter((k) => k.kind === 'hesitation').length
                return (
                  <li key={x.id} className="hc-test" data-testid={`hc-test-${x.id}`}>
                    <div className="hc-test__head">
                      <strong>{t.range(surahLabel(x.surah, lang), x.from, x.to)}</strong>
                      <span className="hc-pill">{t.status[x.status] || x.status}</span>
                    </div>
                    {x.status === 'open' && <p className="rt-note">{t.until(fmtTime(x.expiresAt, lang))}</p>}
                    {x.status === 'done' && (
                      <div className="hc-result">
                        <p className="rt-note"><strong>{t.resultTitle}</strong></p>
                        {marks.length === 0 ? <p>{t.clean}</p> : (
                          <>
                            <p className="hc-summary"><span className="hc-pill hc-pill--mistake">{t.mistakes(m)}</span><span className="hc-pill hc-pill--hesitation">{t.hesitations(h)}</span></p>
                            <ul className="hc-marks">
                              {marks.map((k) => (
                                <li key={k.a} className={`hc-pill hc-pill--${k.kind}`}>
                                  {t.ayah(k.a)}: {k.kind === 'mistake' ? t.mistake : t.hesitation}{k.words ? ` (${t.words(k.words.join(', '))})` : ''}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                    <div><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => remove(x.id)}><Icon name="trash" className="ui-btn__icon" /> {t.del}</button></div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
      <p className="rt-note rt-privacy"><Icon name="shield" size={15} /> {t.privacy}</p>
    </section>
  )
}
