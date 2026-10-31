// ═══════════════════════════════════════════════════════
// /prayerguide — Namaz necə qılınır (5 dil)
//
// • Namaz: namaz seçimi (2/3/4 rükət) → tam addım ardıcıllığı (buildSequence):
//   hər addımda təsvir (PrayerPose — başsız abstrakt sxem: duruş xətti, ovuclar,
//   yerə toxunan üzv nöqtələri; mövqelər arası yumşaq keçid). Kişi/qadın seçimi
//   yoxdur — sxemdə fərq yoxdur, fərqlər mətndədir.
//   nə edilir, nə deyilir (ərəbcə + transliterasiya + məna + səs), mənbələr.
// • Kağızla namaz: ?mode=paper — tam ekran köməkçi (components/prayer/PaperMode).
// • Dəstəmaz: 8 addım, eyni üslubda təsvir (WuduPose) və dəlillər.
// Məzmun və mənhəc qaydaları: src/data/prayerGuide.js.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import PrayerPose from '../components/prayer/PrayerPose'
import WuduPose from '../components/prayer/WuduPose'
import PrayerAudio from '../components/prayer/PrayerAudio'
import PaperMode from '../components/prayer/PaperMode'
import {
  ACTIONS, BOOKS, PG_TEXT, PRAYERS, WUDU, WUDU_AFTER, WUDU_NOTE, ZIKR,
  buildSequence, refText, refUrl,
} from '../data/prayerGuide'
import { AUDIO_CREDITS, CREDIT_ORDER } from '../data/prayerGuideCredits'
import '../styles/PrayerGuidePage.css'

// ── Surənin tam mənası (Fatihə, İxlas) ──
// Ayələrin mənası yaddaşdan yazılmır: alquran.cloud-dan (QuranPage ilə eyni
// nəşrlər) gətirilir, sessionStorage-da saxlanılır. Alınmasa — qısa məna qalır.
const EDITIONS = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet' }

function useSurahMeaning(lang, surah, count, enabled) {
  const edition = EDITIONS[lang] || ''
  const id = `${edition}:${surah}`
  const [state, setState] = useState({ id: '', data: null })
  useEffect(() => {
    if (!enabled || !edition || !surah) return undefined
    const cacheKey = `qm_surah_${edition}_${surah}`
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null')
      if (cached && Array.isArray(cached.ayahs) && cached.ayahs.length === count) { setState({ id, data: cached }); return undefined }
    } catch { /* keş oxunmadı */ }
    let alive = true
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 12000)
    fetch(`https://api.alquran.cloud/v1/surah/${surah}/${edition}`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(j => {
        const ayahs = (j?.data?.ayahs || []).map(a => String(a?.text || '').trim())
        if (ayahs.length !== count || ayahs.some(a => !a)) throw new Error('bad response')
        const data = { ayahs, source: String(j?.data?.edition?.name || '') }
        try { sessionStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* yaddaş bağlıdır */ }
        if (alive) setState({ id, data })
      })
      .catch(() => { if (alive) setState({ id, data: null }) })
      .finally(() => clearTimeout(timer))
    return () => { alive = false; clearTimeout(timer); ctrl.abort() }
  }, [edition, surah, count, enabled, id])
  return state.id === id ? state.data : null
}

// Addım dəyişəndə kartın başı görünmürsə ora sürüşdür
function scrollToStep() {
  requestAnimationFrame(() => {
    const el = document.querySelector('.pg-progress-wrap')
    if (!el) return
    const top = el.getBoundingClientRect().top
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64
    const seg = document.querySelector('.pg-mode-toggle')
    const segBottom = seg && getComputedStyle(seg).position === 'sticky' ? seg.getBoundingClientRect().bottom : 0
    if (top >= Math.max(headerH, segBottom) && top < window.innerHeight * 0.6) return
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  })
}

// ── Bir zikr bloku: ərəbcə, transliterasiya, məna, təkrar, səs ──
function ZikrBlock({ id, lang, t, compact = false, fullMeaning }) {
  const z = ZIKR[id]
  if (!z) return null
  const tl = lang === 'ar' ? '' : (z.tl[lang] || z.tl.en)
  return (
    <div className={`pg-zikr ${compact ? 'pg-zikr--compact' : ''}`} data-zikr={id}>
      <p className="pg-zikr-ar ui-arabic" lang="ar" dir="rtl">{z.ar}</p>
      {tl && <p className="pg-zikr-tl">{tl}</p>}
      {!compact && (
        fullMeaning ? (
          <div className="pg-zikr-mean">
            <span className="pg-label">{t.meaning}</span>
            <p>{fullMeaning.ayahs.map((a, i) => <span key={i}>{a} <span className="pg-ayah-num">({i + 1})</span>{i < fullMeaning.ayahs.length - 1 ? ' ' : ''}</span>)}</p>
            {fullMeaning.source && <span className="pg-meaning-src">{fullMeaning.source}</span>}
          </div>
        ) : (
          <p className="pg-zikr-mean pg-zikr-mean--short">{z.mean[lang] || z.mean.en}</p>
        )
      )}
      {(z.repeat > 1 || z.audio) && (
        <div className="pg-zikr-meta">
          {z.repeat > 1 && <span className="ui-badge ui-badge--brand pg-repeat">{t.times(z.repeat)}</span>}
          <PrayerAudio zikr={z} t={t} />
        </div>
      )}
    </div>
  )
}

function Refs({ refs, lang, t }) {
  if (!refs?.length) return null
  return (
    <div className="pg-refs">
      <span className="pg-label">{t.sources}</span>
      <ul className="pg-refs-list">
        {refs.map((r, i) => {
          const url = refUrl(r)
          const text = refText(r, lang)
          return (
            <li key={i} className={`pg-ref ${r.book ? 'pg-ref--book' : ''}`}>
              {url ? <a href={url} target="_blank" rel="noopener noreferrer" lang={lang === 'ar' ? 'ar' : undefined}>{text}<Icon name="external" size={12} className="pg-ref-ext" /></a> : <span>{text}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Note({ note, ask, lang, t }) {
  if (!note) return null
  return (
    <div className={`pg-note ${ask ? 'pg-note--ask' : ''}`} role="note">
      <Icon name={ask ? 'info' : 'bulb'} size={18} className="pg-note-ic" />
      <div>
        {ask && <span className="pg-note-title">{t.askImam}</span>}
        <p>{note[lang] || note.en}</p>
      </div>
    </div>
  )
}

// Rükətlərə bölünmüş irəliləyiş zolağı
function Progress({ seq, index, t, title }) {
  const total = seq.length
  const marks = []
  seq.forEach((s, i) => { if (i > 0 && s.rakat !== seq[i - 1].rakat) marks.push(i / total) })
  const cur = seq[Math.min(index, total - 1)]
  const rakats = seq[total - 1]?.rakat || 1
  return (
    <div className="pg-progress-wrap">
      <div className="pg-progress-bar" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={Math.min(index + 1, total)} aria-label={title}>
        <div className="pg-progress-fill" style={{ '--p': Math.min(1, (index + 1) / total) }} />
        {marks.map(m => <span key={m} className="pg-progress-mark" style={{ '--x': m }} />)}
      </div>
      <span className="pg-progress-text">
        <span className="pg-progress-name">{title}</span>
        <span className="ui-num pg-progress-count">
          {cur?.rakat ? <>{t.rakat} {cur.rakat}/{rakats} · </> : null}{t.step} {Math.min(index + 1, total)}/{total}
        </span>
      </span>
    </div>
  )
}

export default function PrayerGuidePage({ setPage }) {
  const { lang } = useLang()
  const t = PG_TEXT[lang] || PG_TEXT.en
  const location = useLocation()
  const routerNavigate = useNavigate()

  const [mode, setMode] = useState('prayer') // prayer | wudu
  const [prayerKey, setPrayerKey] = useState(null)
  const [step, setStep] = useState(0)
  const [wuduStep, setWuduStep] = useState(0)
  const [dir, setDir] = useState('')
  const pushedPaper = useRef(false)


  // ── Kağızla namaz: ?mode=paper ──
  const paperOpen = new URLSearchParams(location.search).get('mode') === 'paper'
  const openPaper = () => {
    haptic()
    pushedPaper.current = true
    routerNavigate({ pathname: location.pathname, search: '?mode=paper' })
  }
  const closePaper = () => {
    if (pushedPaper.current) { pushedPaper.current = false; routerNavigate(-1) }
    else routerNavigate({ pathname: location.pathname, search: '' }, { replace: true })
  }

  const prayer = PRAYERS.find(p => p.key === prayerKey) || null
  const seq = useMemo(() => (prayer ? buildSequence(prayer.rakats) : []), [prayer])
  const isComplete = !!prayer && step >= seq.length
  const cur = prayer && !isComplete ? seq[step] : null
  const action = cur ? ACTIONS[cur.id] : null

  const needFatiha = !!action && action.say.includes('fatiha')
  const needIkhlas = !!action && action.say.includes('ikhlas')
  const fatiha = useSurahMeaning(lang, 1, 7, mode === 'prayer' && needFatiha)
  const ikhlas = useSurahMeaning(lang, 112, 4, mode === 'prayer' && needIkhlas)

  const go = (n, d) => { haptic(); setDir(d); setStep(n); scrollToStep() }
  const goWudu = (n, d) => { haptic(); setDir(d); setWuduStep(n); scrollToStep() }

  // Klaviatura: ← → addımlar arasında (RTL-də güzgülənir); yazı sahəsində işləmir
  useEffect(() => {
    if (paperOpen) return undefined
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, textarea, select, [contenteditable]')) return
      const rtl = document.documentElement.dir === 'rtl'
      const fwd = e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
      const back = e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')
      if (!fwd && !back) return
      if (mode === 'prayer' && prayer) {
        if (fwd && step < seq.length) go(step + 1, 'next')
        else if (back && step > 0) go(step - 1, 'prev')
      } else if (mode === 'wudu') {
        if (fwd && wuduStep < WUDU.length) goWudu(wuduStep + 1, 'next')
        else if (back && wuduStep > 0) goWudu(wuduStep - 1, 'prev')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const MODES = [
    { key: 'prayer', icon: 'prayerguide', label: t.mPrayer },
    { key: 'wudu', icon: 'drop', label: t.mWudu },
  ]
  const modeIdx = Math.max(0, MODES.findIndex(m => m.key === mode))
  const switchMode = (m) => { setDir(''); setMode(m); setPrayerKey(null); setStep(0); setWuduStep(0) }

  const wudu = wuduStep < WUDU.length ? WUDU[wuduStep] : null
  const wuduSeq = WUDU.map(() => ({ rakat: 0 }))

  return (
    <div className="pg-root">
      <header className="ui-page-hero pg-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
          <div className="ui-page-hero__actions">
            <button type="button" className="ui-btn ui-btn--primary pg-paper-open" onClick={openPaper}>
              <Icon name="eye" className="ui-btn__icon" /> {t.paper}
            </button>
          </div>
        </div>
      </header>

      <section className="ui-section pg-main">
        <div className="ui-container pg-container">
          <div className="pg-mode-toggle" role="group" aria-label={t.modes} style={{ '--i': modeIdx }}>
            <span className="pg-mode-thumb" aria-hidden="true" />
            {MODES.map(m => (
              <button key={m.key} type="button" className={`pg-mode-btn ${mode === m.key ? 'active' : ''}`} aria-pressed={mode === m.key} onClick={() => switchMode(m.key)}>
                <Icon name={m.icon} size={18} /> <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* ═════ NAMAZ ═════ */}
          {mode === 'prayer' && !prayer && (
            <div className="pg-select pg-enter">
              <div className="pg-mode-head">
                <h2 className="pg-select-title">{t.selectPrayer}</h2>
                <p className="pg-mode-sub">{t.selectSub}</p>
              </div>
              <div className="pg-prayer-grid" data-reveal="stagger-zoom">
                {PRAYERS.map(p => (
                  <button key={p.key} type="button" className="pg-prayer-btn ui-card ui-card--interactive" data-prayer={p.key}
                    onClick={() => { setDir(''); setPrayerKey(p.key); setStep(0) }}>
                    <span className="pg-prayer-tile ui-icon-tile" aria-hidden="true"><Icon name={p.icon} /></span>
                    <span className="pg-prayer-text">
                      <span className="pg-prayer-name">{p.name[lang] || p.name.en}</span>
                      <span className="pg-prayer-rak">{t.rakatN(p.rakats)}</span>
                    </span>
                    <Icon name="arrow" size={18} className="pg-prayer-chev ui-flip-rtl" />
                  </button>
                ))}
              </div>

              {/* Kağızla namaz dəvəti */}
              <div className="pg-paper-cta ui-card ui-card--inverse">
                <div className="pg-paper-cta-fig" aria-hidden="true"><PrayerPose pose="qiyam" /></div>
                <div className="pg-paper-cta-body">
                  <h3 className="pg-paper-cta-title">{t.paperCta}</h3>
                  <p>{t.paperCtaSub}</p>
                  <button type="button" className="ui-btn ui-btn--inverse" onClick={openPaper}>
                    <Icon name="play" className="ui-btn__icon" /> {t.start}
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === 'prayer' && prayer && !isComplete && action && (
            <div className="pg-guide pg-enter">
              <Progress seq={seq} index={step} t={t} title={`${prayer.name[lang] || prayer.name.en} · ${t.rakatN(prayer.rakats)}`} />
              <div className="pg-guide-bar">
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm pg-back-btn" onClick={() => { setPrayerKey(null); setStep(0) }}>
                  <Icon name="arrow" size={16} className="pg-back-ic ui-flip-rtl" /> {t.back}
                </button>
              </div>

              <article className="pg-step-card" data-dir={dir || undefined} data-step={cur.id} aria-labelledby="pg-step-title">
                <div className="pg-step-fig">
                  <PrayerPose pose={cur.pose} label={action.name[lang] || action.name.en} />
                </div>
                <div className="pg-step-body" key={`${prayer.key}-${step}`}>
                  <span className="pg-step-eyebrow ui-num">{t.rakat} {cur.rakat} · {t.step} {step + 1}</span>
                  <h2 className="pg-step-name" id="pg-step-title">{action.name[lang] || action.name.en}</h2>

                  <div className="pg-block">
                    <span className="pg-label">{t.whatDo}</span>
                    <p className="pg-do">{action.do[lang] || action.do.en}</p>
                  </div>

                  {(action.lead || action.say.length > 0) && (
                    <div className="pg-block">
                      <span className="pg-label">{t.whatSay}</span>
                      {action.lead && (
                        <div className="pg-lead-row">
                          <span className="pg-lead-label">{t.transition}</span>
                          <ZikrBlock id={action.lead} lang={lang} t={t} compact />
                        </div>
                      )}
                      {action.say.map(id => (
                        <ZikrBlock key={id} id={id} lang={lang} t={t}
                          fullMeaning={id === 'fatiha' ? fatiha : id === 'ikhlas' ? ikhlas : null} />
                      ))}
                    </div>
                  )}

                  <Note note={action.note} ask={action.askImam} lang={lang} t={t} />
                  <Refs refs={action.refs} lang={lang} t={t} />
                </div>
              </article>

              <div className="pg-nav">
                <button type="button" className="ui-btn ui-btn--secondary" onClick={() => go(step - 1, 'prev')} disabled={step === 0}>
                  <Icon name="arrow" size={18} className="pg-prev-ic ui-flip-rtl" /> {t.prev}
                </button>
                <button type="button" className="ui-btn ui-btn--primary" onClick={() => go(step + 1, 'next')}>
                  {t.next} <Icon name="arrow" size={18} className="ui-flip-rtl" />
                </button>
              </div>

              {/* Addımların siyahısı — istənilən addıma keçid */}
              <details className="pg-outline">
                <summary>{t.step} 1–{seq.length}</summary>
                <ol className="pg-outline-list">
                  {seq.flatMap((s, i) => {
                    const items = []
                    if (s.rakat !== seq[i - 1]?.rakat) items.push(<li key={`r${s.rakat}`} className="pg-outline-head"><span className="pg-outline-rak">{t.rakat} {s.rakat}</span></li>)
                    items.push(
                      <li key={i}>
                        <button type="button" className="pg-outline-btn" aria-current={i === step ? 'step' : undefined} onClick={() => go(i, i > step ? 'next' : 'prev')}>
                          <span className="ui-num">{i + 1}</span> {ACTIONS[s.id].name[lang] || ACTIONS[s.id].name.en}
                        </button>
                      </li>,
                    )
                    return items
                  })}
                </ol>
              </details>
            </div>
          )}

          {mode === 'prayer' && isComplete && (
            <div className="pg-complete ui-card">
              <div className="pg-complete-icon" aria-hidden="true"><Icon name="check" size={34} strokeWidth={2.2} /></div>
              <h2 className="pg-complete-title">{t.complete}</h2>
              <p className="pg-complete-prayer">{prayer.name[lang] || prayer.name.en} · {t.rakatN(prayer.rakats)} — {t.completeSub}</p>
              <div className="pg-complete-actions">
                <button type="button" className="ui-btn ui-btn--primary" onClick={() => { setDir(''); setStep(0) }}>
                  <Icon name="refresh" className="ui-btn__icon" /> {t.restart}
                </button>
                <button type="button" className="ui-btn ui-btn--secondary" onClick={() => { setPrayerKey(null); setStep(0) }}>{t.choose}</button>
              </div>
            </div>
          )}

          {/* ═════ DƏSTƏMAZ ═════ */}
          {mode === 'wudu' && (
            <>
              {wuduStep === 0 && (
                <div className="pg-mode-head pg-enter">
                  <h2 className="pg-select-title">{t.wuduTitle}</h2>
                  <p className="pg-mode-sub">{t.wuduSub}</p>
                </div>
              )}
              {wudu && (
                <div className="pg-guide pg-enter">
                  <Progress seq={wuduSeq} index={wuduStep} t={t} title={t.wuduTitle} />
                  <article className="pg-step-card" data-dir={dir || undefined} data-step={wudu.id} aria-labelledby="pg-wudu-title">
                    <div className="pg-step-fig">
                      <WuduPose pose={wudu.pose} label={wudu.name[lang] || wudu.name.en} />
                    </div>
                    <div className="pg-step-body" key={`w${wuduStep}`}>
                      <span className="pg-step-eyebrow ui-num">{t.step} {wuduStep + 1}/{WUDU.length}</span>
                      <h2 className="pg-step-name" id="pg-wudu-title">{wudu.name[lang] || wudu.name.en}</h2>
                      <div className="pg-block">
                        <span className="pg-label">{t.whatDo}</span>
                        <p className="pg-do">{wudu.do[lang] || wudu.do.en}</p>
                        {wudu.times > 1 && <span className="ui-badge ui-badge--brand pg-repeat">{t.times(wudu.times)}</span>}
                      </div>
                      {wudu.say.length > 0 && (
                        <div className="pg-block">
                          <span className="pg-label">{t.whatSay}</span>
                          {wudu.say.map(id => <ZikrBlock key={id} id={id} lang={lang} t={t} />)}
                        </div>
                      )}
                      <Refs refs={wudu.refs} lang={lang} t={t} />
                    </div>
                  </article>
                  <div className="pg-nav">
                    <button type="button" className="ui-btn ui-btn--secondary" onClick={() => goWudu(wuduStep - 1, 'prev')} disabled={wuduStep === 0}>
                      <Icon name="arrow" size={18} className="pg-prev-ic ui-flip-rtl" /> {t.prev}
                    </button>
                    <button type="button" className="ui-btn ui-btn--primary" onClick={() => goWudu(wuduStep + 1, 'next')}>
                      {t.next} <Icon name="arrow" size={18} className="ui-flip-rtl" />
                    </button>
                  </div>
                </div>
              )}
              {!wudu && (
                <div className="pg-complete ui-card">
                  <div className="pg-complete-icon" aria-hidden="true"><Icon name="check" size={34} strokeWidth={2.2} /></div>
                  <h2 className="pg-complete-title">{t.wuduDone}</h2>
                  <div className="pg-wudu-dua">
                    <span className="pg-label">{t.wuduAfter}</span>
                    {WUDU_AFTER.say.map(id => <ZikrBlock key={id} id={id} lang={lang} t={t} />)}
                    <Refs refs={WUDU_AFTER.refs} lang={lang} t={t} />
                  </div>
                  <Note note={WUDU_NOTE.text} lang={lang} t={t} />
                  <Refs refs={WUDU_NOTE.refs} lang={lang} t={t} />
                  <button type="button" className="ui-btn ui-btn--primary pg-complete-btn" onClick={() => { setDir(''); setWuduStep(0) }}>
                    <Icon name="refresh" className="ui-btn__icon" /> {t.restart}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Əsas istinadlar və səs lisenziyaları */}
          <aside className="pg-sources" aria-label={t.sources}>
            <div className="pg-sources-col">
              <h2 className="pg-sources-title">{t.basis}</h2>
              <ul>{Object.keys(BOOKS).map(k => <li key={k}>{BOOKS[k][lang] || BOOKS[k].en}</li>)}</ul>
            </div>
            <div className="pg-sources-col">
              <h2 className="pg-sources-title">{t.credits}</h2>
              <ul>
                {CREDIT_ORDER.map(k => {
                  const c = AUDIO_CREDITS[k]
                  return (
                    <li key={k} dir="ltr" lang="en">
                      <span className="pg-credit-title" lang={k === 'amin' ? 'ar' : undefined}>{c.title}</span> — {c.author} · <a href={c.url} target="_blank" rel="noopener noreferrer">{c.site}</a>
                      {c.license && <> · <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer license">{c.license}</a></>}
                    </li>
                  )
                })}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {paperOpen && <PaperMode lang={lang} t={t} onClose={closePaper} />}
    </div>
  )
}
