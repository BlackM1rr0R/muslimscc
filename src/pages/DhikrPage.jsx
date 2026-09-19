import { useState, useCallback, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { DHIKRS } from '../data/dhikr'
import '../styles/DhikrPage.css'

// ── localStorage helper-ləri ──
const STORAGE_KEY = 'dhikr_session'
function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : null
    return data && typeof data === 'object' ? data : { count: 0, selIdx: 0, log: [] }
  } catch { return { count: 0, selIdx: 0, log: [] } }
}
function saveSession(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
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
    if (next === dhikr.target) {
      const time = new Date().toLocaleTimeString(LOCALE[lang] || 'az-AZ', { hour: '2-digit', minute: '2-digit' })
      setLog(l => [{ name: dhikr[lang] || dhikr.en, count: dhikr.target, time }, ...l.slice(0, 9)])
      // Hədəf tamamlandı — uzun vibrasiya
      vibrate([100, 50, 100])
    } else {
      vibrate(30)
    }
    setTap(true)
    setTapId(n => n + 1)
    setTimeout(() => setTap(false), 120)
  }, [count, dhikr, lang])

  return (
    <>
      <div className="page-hero hero-compact theme-dhikr">
        <div className="page-hero-arabic">ٱلذِّكۡرُ</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner dhikr-layout">

          {/* Selector */}
          <div className="dhikr-selector" ref={selRef}>
            {DHIKRS.map((d,i) => (
              <button key={i} type="button" className={`dhikr-sel-btn press ${selIdx===i?'active':''}`}
                aria-pressed={selIdx===i}
                onClick={() => { if (selIdx !== i) { setSelIdx(i); setCount(0) } }}>
                <span className="dhikr-sel-arabic" lang="ar">{d.arabic}</span>
                {/* Ərəbcədə ad elə ərəb ifadəsinin özüdür — təkrar yazılmır */}
                {lang !== 'ar' && <span className="dhikr-sel-label">{d[lang] || d.en}</span>}
              </button>
            ))}
          </div>

          {/* Counter */}
          <div className="dhikr-center">
            <div className="dhikr-progress-ring">
              <svg viewBox="0 0 160 160" width="200" height="200">
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--primary-bg2)" strokeWidth="8"/>
                <circle cx="80" cy="80" r="70" fill="none"
                  stroke={complete ? 'var(--gold)' : 'var(--primary)'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress/100)}
                  transform="rotate(-90 80 80)"
                  style={{ transition:'stroke-dashoffset .3s ease, stroke .3s' }}
                />
              </svg>
              {/* Toxunuş dalğası: düymədən halqaya qədər yayılıb sönür (yalnız transform/opacity) */}
              {tapId > 0 && (
                <span key={tapId} className={`dhikr-ripple${complete ? ' is-gold' : ''}`} aria-hidden="true" />
              )}
              <button
                type="button"
                className={`dhikr-tap-btn ${tap?'tapped':''} ${complete?'complete':''}`}
                onClick={handleTap}
              >
                <span className="dhikr-tap-arabic">{dhikr.arabic}</span>
                <span key={count} className="dhikr-tap-count">{count}</span>
                <span className="dhikr-tap-target">/ {dhikr.target}</span>
              </button>
            </div>

            <div className="dhikr-info">
              <h2 className="dhikr-name">{dhikr[lang] || dhikr.en}</h2>
              <p className="dhikr-virtue">✨ {dhikr.virtue[lang] || dhikr.virtue.en}</p>
              {complete && (
                <div className="dhikr-complete-badge anim-scaleIn">
                  🎉 {t.complete}
                </div>
              )}
            </div>

            <div className="dhikr-actions">
              <button type="button" className="btn-ghost dhikr-reset" onClick={() => setCount(0)}>🔄 {t.reset}</button>
              <span className="dhikr-progress-text">{Math.round(progress)}%</span>
            </div>

            <div className="dhikr-total-bar">
              <div className="dhikr-total-item">
                <span className="dhikr-total-num">{count}</span>
                <span className="dhikr-total-label">{stat('current')}</span>
              </div>
              <div className="dhikr-total-sep"/>
              <div className="dhikr-total-item">
                <span className="dhikr-total-num">{log.length}</span>
                <span className="dhikr-total-label">{stat('sessions')}</span>
              </div>
              <div className="dhikr-total-sep"/>
              <div className="dhikr-total-item">
                <span className="dhikr-total-num">{totalAll}</span>
                <span className="dhikr-total-label">{stat('total')}</span>
              </div>
            </div>
          </div>

          {/* Log */}
          {/* Jurnal — qruplaşdırılmış siyahı xanaları (.m-list / .m-row) */}
          {log.length > 0 && (
            <section className="dhikr-log" data-reveal="">
              <div className="dhikr-log-header">
                <h2 className="m-list-title">{t.session}</h2>
                <button type="button" className="btn-ghost dhikr-log-clear" onClick={() => setLog([])}>
                  {t.clearSession}
                </button>
              </div>
              <ul className="m-list">
                {log.map((entry,i) => (
                  <li key={i}>
                    <div className="m-row log-entry">
                      <span className="icon-tile icon-tile--sm icon-tile--round" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 12.5l3.8 3.8L17.5 8.5"/></svg>
                      </span>
                      <span className="m-row-body">
                        <span className="m-row-title log-name">{entry.name}</span>
                        <span className="m-row-sub log-time">{entry.time}</span>
                      </span>
                      <span className="m-row-trail"><span className="log-count">×{entry.count}</span></span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
