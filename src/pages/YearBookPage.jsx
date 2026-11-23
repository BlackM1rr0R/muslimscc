// ═══════════════════════════════════════════════════════
// /my-year-book — "Mənim ilim": seçilmiş hicri və ya miladi ilin şəxsi qeydlərindən çap üçün kitab
//
// • Məlumat: utils/yearBook (gatherYearBook → mövcud oxuyucular: journey, quranNotes, ramadanAlbum, passport,
//   hifzDates, charity_log). Hesaba girilibsə — E2E sinxronizasiyanın bu cihaza gətirdikləri də (eyni açarlar).
// • Çap: brauzerin çap pəncərəsi → "PDF kimi saxla" (PDF kitabxanası YOXDUR). Çap həmişə açıq rəngdədir,
//   yalnız kitab çap olunur (styles/YearBook.css → @media print, body:has(.yb-book)).
// • Paylaşma düyməsi YOXDUR, sıralama/müqayisə yoxdur — kitab yalnız insanın özü üçündür (sahibin qaydası).
// • Sədəqə dəftəri gizlidir: məbləğlər susmaya görə göstərilmir; bölmələri kitabdan çıxarmaq olar.
// • Hamısı mount-dan sonra oxunur (prerender = boş qabıq; ilk klient render onunla eyni).
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pickUi } from '../utils/uiText'
import { EVENT as PROFILE_EVENT } from '../utils/profileCore'
import { localDay } from '../utils/journeyStore'
import { gatherYearBook, buildYearBook, yearRange, yearOptions, MODES } from '../utils/yearBook'
import { YB } from '../components/yearbook/yearBookText'
import YearBook, { SECTIONS, sectionHas } from '../components/yearbook/YearBook'
import '../styles/YearBook.css'

const ALL_ON = Object.fromEntries(SECTIONS.map((k) => [k, true]))

export default function YearBookPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(YB, lang, 'en')
  const uid = useId().replace(/:/g, '')
  const [src, setSrc] = useState(null)        // null — hələ yığılmayıb (prerender və ilk render)
  const [today, setToday] = useState('')
  const [mode, setMode] = useState('hijri')
  const [year, setYear] = useState(null)
  const [include, setInclude] = useState(ALL_ON)
  const [showAmounts, setShowAmounts] = useState(false)
  const [name, setName] = useState('')

  // Yerli qeydlər — yalnız mount-dan sonra; profil dəyişəndə yenidən
  useEffect(() => {
    const load = () => setSrc(gatherYearBook())
    const d = localDay()
    setToday(d)
    setYear(yearOptions('hijri', d)[0] ?? null)
    load()
    window.addEventListener(PROFILE_EVENT, load)
    return () => window.removeEventListener(PROFILE_EVENT, load)
  }, [])

  const years = useMemo(() => (today ? yearOptions(mode, today) : []), [mode, today])
  const range = useMemo(() => (year ? yearRange(mode, year) : null), [mode, year])
  const book = useMemo(() => (src && range ? buildYearBook(src, range) : null), [src, range])
  const filled = book ? SECTIONS.filter((k) => include[k] && sectionHas(book, k)).length : 0

  const pickMode = (m) => {
    if (m === mode) return
    setMode(m)
    setYear(yearOptions(m, today)[0] ?? null)
  }
  const toggle = (k) => setInclude((s) => ({ ...s, [k]: !s[k] }))
  const print = () => { try { window.print() } catch { /* çap dəstəklənmir */ } }

  return (
    <div className="yb-page">
      <header className="ui-page-hero yb-noprint">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('yearbook'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container yb-wrap">
          <p className="ui-card yb-device yb-noprint" data-testid="yb-device"><Icon name="lock" size={18} /> <span>{t.device}</span></p>

          <form className="ui-card yb-controls yb-noprint" aria-labelledby={`${uid}-h`} onSubmit={(e) => { e.preventDefault(); print() }}>
            <h2 id={`${uid}-h`} className="yb-controls__h">{t.settings}</h2>
            <div className="yb-row" role="group" aria-label={t.calendar}>
              {MODES.map((m) => (
                <button key={m} type="button" className="ui-chip" aria-pressed={mode === m} onClick={() => pickMode(m)} data-testid={`yb-mode-${m}`}>
                  {m === 'greg' ? t.greg : t.hijri}
                </button>
              ))}
            </div>
            <div className="yb-fields">
              <label className="ui-field">
                <span className="ui-field__label">{t.year}</span>
                <select className="ui-select" value={year ?? ''} disabled={!years.length} onChange={(e) => setYear(Number(e.target.value))} data-testid="yb-year">
                  {years.map((y) => <option key={y} value={y}>{mode === 'greg' ? t.yearG(y) : t.yearH(y)}</option>)}
                </select>
              </label>
              <label className="ui-field">
                <span className="ui-field__label">{t.name}</span>
                <input className="ui-input" type="text" maxLength={60} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)}
                  aria-describedby={`${uid}-nh`} data-testid="yb-name" />
                <span id={`${uid}-nh`} className="ui-field__hint">{t.nameHint}</span>
              </label>
            </div>
            <fieldset className="yb-secs">
              <legend>{t.sections}</legend>
              {SECTIONS.map((k) => (
                <label key={k} className="yb-check">
                  <input type="checkbox" checked={!!include[k]} onChange={() => toggle(k)} data-testid={`yb-inc-${k}`} />
                  <span>{t.sec[k]}</span>
                </label>
              ))}
              <label className="yb-check yb-check--sep">
                <input type="checkbox" checked={showAmounts} onChange={() => setShowAmounts((v) => !v)} disabled={!include.charity} data-testid="yb-amounts" />
                <span>{t.amounts}</span>
              </label>
            </fieldset>
            <div className="yb-print">
              <button type="submit" className="ui-btn ui-btn--primary" disabled={!book} data-testid="yb-print">
                <Icon name="download" size={18} /> {t.print}
              </button>
              <p className="ui-field__hint">{t.printHint}</p>
            </div>
          </form>

          <p className="ui-sr-only" role="status" aria-live="polite" data-testid="yb-status">
            {book ? (filled ? t.ready(filled) : t.ready0) : ''}
          </p>

          <h2 className="ui-sr-only yb-noprint">{t.preview}</h2>
          {!book && <p className="yb-loading yb-noprint" data-testid="yb-loading">{t.loading}</p>}
          {book && (
            <YearBook book={book} t={t} lang={lang} mode={mode} year={year} include={include}
              showAmounts={showAmounts && include.charity} name={name.trim()} today={today} />
          )}
        </div>
      </section>
    </div>
  )
}
