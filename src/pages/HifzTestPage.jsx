// ═══════════════════════════════════════════════════════
// /hifz-test#t=<token> — "Məni yoxla": yoxlayan (GİRİŞSİZ) səhifə (server/hifzTest.js)
//
// Yoxlayan əzbərləyən şəxsi (qarşısında və ya telefonda) dinləyir, ayələri izləyir və
// səhv / tərəddüd olan ayələri (istəsə — sözləri) işarələyib bir dəfə göndərir.
// Görünən: yalnız seçilmiş ayələr (mətn — saytın Quran mənbəyi, utils/surahText) və sahibin adı.
// NİTQ TANIMA YOXDUR (qərarla çıxarılıb). Token URL fraqmentindədir — serverə gövdədə gedir.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import HeroOrnament from '../components/HeroOrnament'
import { openCheck, submitCheck, readCheckToken } from '../api/hifzCheck'
import { HC, hcError } from '../components/hifz/hifzCheckText'
import { fetchSurahText } from '../utils/surahText'
import { splitAyahWords } from '../utils/hifzSrs'
import { surahLabel } from '../components/hifz/surahLabel'
import '../styles/ReadTogether.css'

export default function HifzTestPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(HC, lang, 'en')
  const [token] = useState(() => (typeof window === 'undefined' ? null : readCheckToken(window.location.hash)))
  const [info, setInfo] = useState(null)       // { surah, from, to, name, submitted }
  const [err, setErr] = useState(token ? '' : 'noToken')
  const [ayahs, setAyahs] = useState(null)
  const [textErr, setTextErr] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [marks, setMarks] = useState({})       // a → { kind, words:Set }
  const [wordMode, setWordMode] = useState(false)
  const [ask, setAsk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) return
    openCheck(token).then(setInfo).catch((e) => setErr(hcError(e, t)))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])
  useEffect(() => {
    if (!info || info.submitted) return
    let off = false
    setTextErr(false)
    fetchSurahText(info.surah)
      .then((list) => { if (!off) setAyahs(list.filter((v) => v.a >= info.from && v.a <= info.to)) })
      .catch(() => { if (!off) setTextErr(true) })
    return () => { off = true }
  }, [info, attempt])

  const setKind = (a, kind) => setMarks((m) => {
    const cur = m[a]
    const next = { ...m }
    if (cur && cur.kind === kind) delete next[a]
    else next[a] = { kind, words: cur?.words || new Set() }
    return next
  })
  const toggleWord = (a, w) => setMarks((m) => {
    const cur = m[a] || { kind: 'mistake', words: new Set() }
    const words = new Set(cur.words)
    if (words.has(w)) words.delete(w); else words.add(w)
    return { ...m, [a]: { kind: cur.kind, words } }
  })
  const counts = useMemo(() => {
    const v = Object.values(marks)
    return { m: v.filter((x) => x.kind === 'mistake').length, h: v.filter((x) => x.kind === 'hesitation').length }
  }, [marks])

  const send = async () => {
    setBusy(true)
    const list = Object.entries(marks).map(([a, m]) => ({ a: Number(a), kind: m.kind, ...(m.words.size ? { words: [...m.words].sort((x, y) => x - y) } : {}) }))
    try { await submitCheck(token, list); setDone(true) } catch (e) { setErr(hcError(e, t)) } finally { setBusy(false); setAsk(false) }
  }

  const name = info?.name || ''
  const errText = err === 'noToken' ? t.noToken : err
  return (
    <div className="hc-page">
      <header className="ui-page-hero">
        <HeroOrnament />
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{t.eyebrow}</span>
          <h1 className="ui-display"><bdi>{info ? t.checkTitle(name) : t.title}</bdi></h1>
          {info && <p className="ui-lead">{t.range(surahLabel(info.surah, lang), info.from, info.to)}</p>}
          <p className="ui-page-hero__how"><Icon name="info" size={16} />{t.human}</p>
        </div>
      </header>
      <div className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow rt-container">
          {errText && (
            <section className="ui-card rt-card" role="alert" data-testid="hc-error">
              <p>{errText}</p>
              <a className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor('hifz', siteLang)}><Icon name="hifz" className="ui-btn__icon" /> {t.title}</a>
            </section>
          )}
          {!errText && !info && <p className="rt-note" role="status">{t.loading}</p>}
          {info && (info.submitted || done) && (
            <section className="ui-card rt-card" role="status" data-testid="hc-done">
              <span className="ui-icon-tile" aria-hidden="true"><Icon name="check" size={20} /></span>
              <p>{done ? t.submitted : t.already}</p>
            </section>
          )}
          {info && !info.submitted && !done && !errText && (
            <>
              <p className="rt-note">{t.checkLead}</p>
              <label className="rt-switch">
                <input type="checkbox" checked={wordMode} onChange={(e) => setWordMode(e.target.checked)} data-testid="hc-word-mode" />
                <span>{t.wordMode}</span>
              </label>
              {textErr && (
                <p className="rt-msg" role="alert">{t.textError}{' '}
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAttempt((n) => n + 1)}>{t.retry}</button>
                </p>
              )}
              {!ayahs && !textErr && <p className="rt-note" role="status">{t.loading}</p>}
              {ayahs && (
                <ol className="hc-list" data-testid="hc-ayahs">
                  {ayahs.map((v) => {
                    const m = marks[v.a]
                    const words = wordMode ? splitAyahWords(v.ar) : null
                    return (
                      <li key={v.a} className={`hc-ayah${m ? ` is-${m.kind}` : ''}`} data-testid={`hc-ayah-${v.a}`}>
                        <div className="hc-ayah__head">
                          <span className="hc-ayah__num">{t.ayah(v.a)}</span>
                          <span className="hc-seg" role="group" aria-label={t.ayah(v.a)}>
                            <button type="button" className="ui-chip hc-seg--mistake" aria-pressed={m?.kind === 'mistake'} onClick={() => setKind(v.a, 'mistake')}>
                              <Icon name="close" size={14} /> {t.mistake}
                            </button>
                            <button type="button" className="ui-chip hc-seg--hesitation" aria-pressed={m?.kind === 'hesitation'} onClick={() => setKind(v.a, 'hesitation')}>
                              <Icon name="pause" size={14} /> {t.hesitation}
                            </button>
                          </span>
                        </div>
                        <p className="hc-ayah__text ui-arabic" lang="ar" dir="rtl">
                          {words
                            ? words.map((w, i) => (
                              <span key={i}>
                                <button type="button" className={`hc-word${m?.words.has(i + 1) ? ' is-marked' : ''}`} aria-pressed={Boolean(m?.words.has(i + 1))}
                                  onClick={() => toggleWord(v.a, i + 1)}>{w}</button>{' '}
                              </span>
                            ))
                            : v.ar}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              )}
              {ayahs && (
                <div className="ui-card hc-sticky">
                  <span className="hc-summary" aria-live="polite" data-testid="hc-count">{t.marked(counts.m, counts.h)}</span>
                  {ask ? (
                    <span className="rt-confirm">
                      <span>{t.confirm}</span>
                      <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={send} disabled={busy} data-testid="hc-confirm">{busy ? t.submitting : t.yes}</button>
                      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(false)}>{t.cancel}</button>
                    </span>
                  ) : (
                    <button type="button" className="ui-btn ui-btn--primary" onClick={() => setAsk(true)} data-testid="hc-submit"><Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {t.submit}</button>
                  )}
                </div>
              )}
              <p className="rt-note">{t.source}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
