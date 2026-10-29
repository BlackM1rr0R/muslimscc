import { useState, useCallback, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { DHIKRS } from '../data/dhikr'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import '../styles/DhikrPage.css'

// ── localStorage helper-ləri ──
const STORAGE_KEY = 'dhikr_session'
function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : null
    if (!data || typeof data !== 'object') return { count: 0, selIdx: 0, log: [] }
    // Pozuq / köhnə məlumat səhifəni çökdürməsin: hər sahə yoxlanılır
    const selIdx = Number.isInteger(Number(data.selIdx)) && DHIKRS[Number(data.selIdx)] ? Number(data.selIdx) : 0
    const count = Math.max(0, Math.min(Number(data.count) || 0, DHIKRS[selIdx].target))
    const log = (Array.isArray(data.log) ? data.log : [])
      .filter(e => e && typeof e === 'object')
      .map(e => ({ id: e.id, idx: Number.isInteger(e.idx) ? e.idx : undefined, name: typeof e.name === 'string' ? e.name : '', count: Number(e.count) || 0, time: typeof e.time === 'string' ? e.time : '' }))
      .slice(0, 10)
    return { count, selIdx, log }
  } catch { return { count: 0, selIdx: 0, log: [] } }
}
function saveSession(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

// Ömürlük zikr sayı — /analytics "Zikr ustası" nailiyyəti üçün oxuyur
// (AnalyticsPage 'dhikr_count*' açarlarını cəmləyir). Jurnal yalnız son 10
// dövrəni saxladığı üçün ayrıca sayğac lazımdır.
const TOTAL_KEY = 'dhikr_count_total'
function bumpLifetime() {
  try {
    const n = parseInt(localStorage.getItem(TOTAL_KEY), 10)
    localStorage.setItem(TOTAL_KEY, String((Number.isFinite(n) && n > 0 ? n : 0) + 1))
  } catch {}
}

// Vibrasiya — yalnız istifadəçi səhifəyə toxunandan sonra (əks halda brauzer
// hər dəfə konsola xəta yazır)
function vibrate(pattern) {
  try {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
    navigator.vibrate?.(pattern)
  } catch { /* dəstəklənmir */ }
}

// Jurnaldakı vaxt interfeys dilində (az-da "19:57", "7:57:49 PM" yox)
const LOCALE = { az:'az-AZ', en:'en-GB', ru:'ru-RU', ar:'ar', tr:'tr-TR' }

// Sayğacın altındakı statistika yazıları
const STAT_LABELS = {
  current:  { az:'Hazırkı', en:'Current',  ru:'Текущий', ar:'الحالي',   tr:'Mevcut' },
  sessions: { az:'Sessiya', en:'Sessions', ru:'Сессий',  ar:'جلسات',    tr:'Oturum' },
  total:    { az:'Ümumi',   en:'Total',    ru:'Всего',   ar:'الإجمالي', tr:'Toplam' },
}

export default function DhikrPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.dhikr || T.az.dhikr
  // Saxlanmış sessiya yalnız ilk renderdə oxunur
  const [saved] = useState(loadSession)
  const [selIdx, setSelIdx] = useState(() => (DHIKRS[saved.selIdx] ? saved.selIdx : 0))
  const [count,  setCount]  = useState(() => Number(saved.count) || 0)
  const [tap,    setTap]    = useState(false)
  // Hər toxunuşda yeni "dalğa" halqası (key dəyişir → animasiya yenidən oynayır)
  const [tapId,  setTapId]  = useState(0)
  // Dövr tamamlananda qızılı halqa effekti (key dəyişir → yenidən oynayır)
  const [burst,  setBurst]  = useState(0)
  const [log,    setLog]    = useState(() => (Array.isArray(saved.log) ? saved.log : []))
  const stat = (k) => STAT_LABELS[k][lang] || STAT_LABELS[k].en

  // Hər dəyişiklikdə localStorage-ə yaz
  useEffect(() => {
    saveSession({ count, selIdx, log })
  }, [count, selIdx, log])
  const dhikr = DHIKRS[selIdx]

  // Telefonda seçici üfüqi zolaqdır — seçilmiş zikr zolaqda görünsün
  // (yalnız zolaq sürüşəndə; geniş ekranda səhifə yerindən oynamır)
  const selRef = useRef(null)
  useEffect(() => {
    const strip = selRef.current
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return
    strip.querySelector('.dhikr-sel-btn.active')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [selIdx])
  const progress = Math.min((count / dhikr.target) * 100, 100)
  const complete = count >= dhikr.target
  // Ümumi say: jurnaldakı dövrələr + cari dövrə. Tamamlanmış dövrə artıq
  // jurnaldadır — ikinci dəfə sayılmır (33-də "66" göstərməsin)
  const totalAll = log.reduce((s, e) => s + (e.count || 0), 0) + (complete ? 0 : count)
  const CIRC = 2 * Math.PI * 70

  // Toxunuş: hədəfə ÇATAN toxunuş jurnala bir sessiya yazır (yalnız bir dəfə).
  // Hədəf tamamlandıqdan sonrakı toxunuş yeni dövrə başlayır (1 / 33) —
  // sayğac hədəfdən o yana getmir. Yan təsirlər setState funksiyasının
  // içində deyil (StrictMode onu iki dəfə çağırır).
  const handleTap = useCallback(() => {
    const next = count >= dhikr.target ? 1 : count + 1
    setCount(next)
    bumpLifetime()
    if (next === dhikr.target) {
      const time = new Date().toLocaleTimeString(LOCALE[lang] || 'az-AZ', { hour: '2-digit', minute: '2-digit' })
      // id — siyahıda sabit açar (yeni sətir yuxarıdan yumşaq daxil olur)
      setLog(l => [{ id: Date.now(), idx: selIdx, name: dhikr[lang] || dhikr.en, count: dhikr.target, time }, ...l.slice(0, 9)])
      setBurst(b => b + 1)
      // Hədəf tamamlandı — uzun vibrasiya
      vibrate([100, 50, 100])
    } else {
      vibrate(30)
    }
    setTap(true)
    setTapId(n => n + 1)
    setTimeout(() => setTap(false), 120)
  }, [count, dhikr, lang, selIdx])

  return (
    <div className="dhikr-page">
      {/* Hero — dizayn v2 (sakit kağız fon + xatəm naxışı), bir <h1> */}
      <header className="ui-page-hero dhikr-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('dhikr'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {lang !== 'ar' && <p className="dhikr-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">ٱلذِّكۡرُ</p>}
          <p className="ui-lead">{t.subtitle}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container dhikr-layout">

          {/* Zikr seçicisi — genişdə şaquli siyahı, telefonda üfüqi zolaq */}
          <div className="dhikr-side">
            <p className="dhikr-side-label" id="dhikr-sel-label">{t.selectZikr}</p>
            <div className="dhikr-selector" ref={selRef} role="group" aria-labelledby="dhikr-sel-label" data-reveal="stagger">
              {DHIKRS.map((d,i) => (
                <button key={i} type="button" className={`dhikr-sel-btn ${selIdx===i?'active':''}`}
                  aria-pressed={selIdx===i}
                  onClick={() => { if (selIdx !== i) { setSelIdx(i); setCount(0) } }}>
                  <span className="dhikr-sel-arabic" lang="ar" dir="rtl">{d.arabic}</span>
                  <span className="dhikr-sel-meta">
                    {/* Ərəbcədə ad elə ərəb ifadəsinin özüdür — təkrar yazılmır */}
                    {lang !== 'ar' && <span className="dhikr-sel-label">{d[lang] || d.en}</span>}
                    <span className="dhikr-sel-target ui-num">×{d.target}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sayğac — iri, rahat basılan dairə; halqa irəliləyişi göstərir */}
          <div className="ui-card dhikr-center" data-reveal="scale">
            <div className={`dhikr-progress-ring${complete ? ' is-complete' : ''}`}>
              <svg viewBox="0 0 160 160" className="dhikr-ring-svg" aria-hidden="true">
                <circle cx="80" cy="80" r="70" fill="none" className="dhikr-ring-track" strokeWidth="5"/>
                <circle cx="80" cy="80" r="70" fill="none"
                  className="dhikr-ring-bar"
                  strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress/100)}
                  transform="rotate(-90 80 80)"
                />
              </svg>
              {/* Toxunuş dalğası: düymədən halqaya qədər yayılıb sönür (yalnız transform/opacity) */}
              {tapId > 0 && (
                <span key={tapId} className={`dhikr-ripple${complete ? ' is-gold' : ''}`} aria-hidden="true" />
              )}
              {/* Dövr tamamlandı — qızılı halqalar bir dəfə genişlənib sönür */}
              {complete && burst > 0 && (
                <span key={`b${burst}`} className="dhikr-halo" aria-hidden="true"><span /><span /></span>
              )}
              <button
                type="button"
                className={`dhikr-tap-btn ${tap?'tapped':''} ${complete?'complete':''}`}
                onClick={handleTap}
              >
                <span className="dhikr-tap-arabic" lang="ar" dir="rtl">{dhikr.arabic}</span>
                <span key={count} className="dhikr-tap-count ui-num">{count}</span>
                <span className="dhikr-tap-target ui-num">/ {dhikr.target}</span>
              </button>
            </div>

            <div className="dhikr-info">
              <h2 className="dhikr-name">{dhikr[lang] || dhikr.en}</h2>
              <p className="dhikr-virtue">
                <Icon name="sparkle" size={16} />
                <span>{dhikr.virtue[lang] || dhikr.virtue.en}</span>
              </p>
              {complete && (
                <p className="dhikr-complete-badge" role="status">
                  <Icon name="check" size={16} /> {t.complete}
                </p>
              )}
            </div>

            <div className="dhikr-actions">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm dhikr-reset"
                onClick={() => setCount(0)} disabled={count === 0}>
                <Icon name="refresh" className="ui-btn__icon" /> {t.reset}
              </button>
              <span className="dhikr-progress-text ui-num">{Math.round(progress)}%</span>
            </div>

            <div className="dhikr-total-bar">
              <div className="ui-stat dhikr-total-item">
                <span className="ui-stat__num dhikr-total-num">{count}</span>
                <span className="ui-stat__label">{stat('current')}</span>
              </div>
              <div className="ui-stat dhikr-total-item">
                <span className="ui-stat__num dhikr-total-num">{log.length}</span>
                <span className="ui-stat__label">{stat('sessions')}</span>
              </div>
              <div className="ui-stat dhikr-total-item">
                <span className="ui-stat__num dhikr-total-num">{totalAll}</span>
                <span className="ui-stat__label">{stat('total')}</span>
              </div>
            </div>
          </div>

          {/* Jurnal — tamamlanan dövrələr (son 10) */}
          {log.length > 0 && (
            <section className="ui-card dhikr-log" data-reveal="">
              <div className="dhikr-log-header">
                <h2 className="dhikr-log-title">{t.session}</h2>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm dhikr-log-clear" onClick={() => setLog([])}>
                  <Icon name="trash" className="ui-btn__icon" /> {t.clearSession}
                </button>
              </div>
              <ul className="dhikr-log-list" data-reveal="stagger">
                {log.map((entry,i) => (
                  <li key={entry.id ?? `${entry.time}-${i}`} className="dhikr-log-row">
                    <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="check" /></span>
                    <span className="dhikr-log-body">
                      {/* Ad cari interfeys dilində (dil dəyişəndə köhnə dildə qalmasın) */}
                      <span className="dhikr-log-name">{DHIKRS[entry.idx]?.[lang] || DHIKRS[entry.idx]?.en || entry.name}</span>
                      <span className="dhikr-log-time ui-num">{entry.time}</span>
                    </span>
                    <span className="dhikr-log-count ui-num">×{entry.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>
    </div>
  )
}
