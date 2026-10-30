// ═══════════════════════════════════════════════════════
// "Kağızla namaz" rejimi — telefon qarşıda durur, hər addımda deyiləcək söz
// çox böyük hərflərlə (transliterasiya + ərəbcə, məna kiçik), cari rükət/addım
// sayğacı və növbəti hərəkət görünür.
//
// • Keçid: ekranın istənilən yerinə toxunuş (və ya Boşluq/→) yaxud avtomatik
//   (tənzimlənən saniyə; uzun mətndə vaxt mətnin uzunluğuna görə artır).
// • Ekran sönməsin — Screen Wake Lock API; dəstəklənmirsə istifadəçiyə deyilir.
//   Səhifə gizlənib qayıdanda kilid yenidən alınır (brauzer onu özü buraxır).
// • Ünvan: /prayerguide?mode=paper (səhifə idarə edir) — Geri düyməsi rejimi bağlayır.
// • Başlanğıcda sahibin göstərişi ilə qeyd: "Öyrənmə dövrü üçün köməkçidir;
//   imamınızdan soruşun" — hökm verilmir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon'
import PrayerPose from './PrayerPose'
import { ACTIONS, PRAYERS, ZIKR, buildSequence } from '../../data/prayerGuide'

const SECONDS = [5, 8, 12, 20]
const PREF_KEY = 'qm_paper_prefs'

function readPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || 'null') || {} } catch { return {} }
}

// Mətnin uzunluğuna görə şrift ölçüsü sinfi
function sizeClass(len) {
  if (len <= 34) return 'is-xl'
  if (len <= 80) return 'is-l'
  if (len <= 180) return 'is-m'
  return 'is-s'
}

// Addımın göstəriləcək mətni (dilə görə: ərəbcədə transliterasiya yoxdur)
function stepLines(step, lang) {
  const a = ACTIONS[step.id]
  return a.say.map(id => {
    const z = ZIKR[id]
    return { id, ar: z.ar, tl: lang === 'ar' ? '' : (z.tl[lang] || z.tl.en), mean: z.mean[lang] || z.mean.en, repeat: z.repeat || 1 }
  })
}

// Avtomatik rejimdə addımın müddəti (ms): əsas saniyə + uzun mətn üçün əlavə
export function autoDuration(step, lang, base) {
  const lines = stepLines(step, lang)
  const words = lines.reduce((n, l) => n + (l.tl || l.ar).split(/\s+/).length * l.repeat, 0)
  return Math.round(base * 1000 * Math.max(1, words / 6))
}

function useWakeLock(active) {
  const [status, setStatus] = useState('idle') // idle | on | unsupported
  const lockRef = useRef(null)
  useEffect(() => {
    if (!active) return undefined
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) { setStatus('unsupported'); return undefined }
    let alive = true
    const acquire = async () => {
      try {
        const l = await navigator.wakeLock.request('screen')
        if (!alive) { l.release().catch(() => {}); return }
        lockRef.current = l
        setStatus('on')
        l.addEventListener?.('release', () => { if (alive && document.visibilityState !== 'visible') setStatus('idle') })
      } catch { if (alive) setStatus('unsupported') }
    }
    const onVis = () => { if (document.visibilityState === 'visible') acquire() }
    acquire()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVis)
      lockRef.current?.release?.().catch(() => {})
      lockRef.current = null
    }
  }, [active])
  return status
}

export default function PaperMode({ lang, t, onClose, gender = 'm' }) {
  const prefs = useMemo(readPrefs, [])
  const [prayerKey, setPrayerKey] = useState(prefs.prayer || 'fajr')
  const [advance, setAdvance] = useState(prefs.advance === 'auto' ? 'auto' : 'tap')
  const [secs, setSecs] = useState(SECONDS.includes(prefs.secs) ? prefs.secs : 8)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [i, setI] = useState(0)
  const rootRef = useRef(null)

  const prayer = PRAYERS.find(p => p.key === prayerKey) || PRAYERS[0]
  const seq = useMemo(() => buildSequence(prayer.rakats), [prayer.rakats])
  const done = running && i >= seq.length
  const step = running && !done ? seq[i] : null
  const wake = useWakeLock(running)

  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ prayer: prayerKey, advance, secs })) } catch { /* yaddaş bağlıdır */ }
  }, [prayerKey, advance, secs])

  // Açılanda: səhifənin sürüşməsi dayanır, fokus dialoqa keçir
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    rootRef.current?.focus({ preventScroll: true })
    return () => { document.body.style.overflow = prev }
  }, [])

  const next = useCallback(() => setI(n => Math.min(n + 1, seq.length)), [seq.length])
  const prev = useCallback(() => setI(n => Math.max(0, n - 1)), [])

  // Avtomatik keçid
  useEffect(() => {
    if (!running || done || advance !== 'auto' || paused || !step) return undefined
    const id = setTimeout(next, autoDuration(step, lang, secs))
    return () => clearTimeout(id)
  }, [running, done, advance, paused, step, lang, secs, next, i])

  // Klaviatura: Esc — çıx; Boşluq/→ — növbəti; ← — əvvəlki (RTL-də oxlar güzgülənir)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (!running || done) return
      const rtl = document.documentElement.dir === 'rtl'
      if (e.key === ' ' || e.key === 'Enter' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) {
        if (e.target instanceof HTMLButtonElement && e.key !== (rtl ? 'ArrowLeft' : 'ArrowRight')) return
        e.preventDefault(); next()
      } else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running, done, next, prev, onClose])

  const start = () => {
    setI(0); setPaused(false); setRunning(true)
    try { document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })?.catch?.(() => {}) } catch { /* tam ekran yoxdur */ }
  }
  const close = () => {
    try { if (document.fullscreenElement) document.exitFullscreen?.()?.catch?.(() => {}) } catch { /* yox */ }
    onClose()
  }

  // Ekrana toxunuş — düymələrdən başqa hər yer "növbəti"
  const onStageClick = (e) => {
    if (e.target.closest('button, a, [role="group"]')) return
    next()
  }

  const a = step ? ACTIONS[step.id] : null
  const lines = step ? stepLines(step, lang) : []
  const nextStep = step && i + 1 < seq.length ? seq[i + 1] : null
  const total = lines.reduce((n, l) => n + (l.tl || l.ar).length, 0)
  const sz = sizeClass(total)

  // Portal: <main>-in transform animasiyası fixed elementi öz içinə "həbs" edir
  return createPortal(
    <div
      ref={rootRef}
      className="pm-root"
      role="dialog"
      aria-modal="true"
      aria-label={t.paper}
      tabIndex={-1}
      data-state={!running ? 'setup' : done ? 'done' : 'run'}
    >
      {/* ── Başlanğıc: seçim ── */}
      {!running && (
        <div className="pm-setup">
          <div className="pm-top">
            <span className="pm-brand"><Icon name="prayerguide" size={18} /> {t.paper}</span>
            <button type="button" className="pm-icon-btn" onClick={close} aria-label={t.exit}><Icon name="close" size={22} /></button>
          </div>
          <p className="pm-note" role="note"><Icon name="info" size={18} /> <span>{t.paperNote}</span></p>

          <div className="pm-field">
            <span className="pm-label" id="pm-l-prayer">{t.selectPrayer}</span>
            <div className="pm-chips" role="group" aria-labelledby="pm-l-prayer">
              {PRAYERS.map(p => (
                <button key={p.key} type="button" className="ui-chip pm-chip" aria-pressed={p.key === prayerKey} onClick={() => setPrayerKey(p.key)}>
                  {p.name[lang] || p.name.en} <span className="pm-chip-sub">{t.rakatN(p.rakats)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pm-field">
            <span className="pm-label" id="pm-l-adv">{t.advance}</span>
            <div className="pm-chips" role="group" aria-labelledby="pm-l-adv">
              <button type="button" className="ui-chip pm-chip" aria-pressed={advance === 'tap'} onClick={() => setAdvance('tap')}><Icon name="touch" size={16} /> {t.tap}</button>
              <button type="button" className="ui-chip pm-chip" aria-pressed={advance === 'auto'} onClick={() => setAdvance('auto')}><Icon name="clock" size={16} /> {t.auto}</button>
            </div>
            {advance === 'auto' && (
              <div className="pm-chips pm-chips--secs" role="group" aria-label={t.auto}>
                {SECONDS.map(s => (
                  <button key={s} type="button" className="ui-chip pm-chip" aria-pressed={s === secs} onClick={() => setSecs(s)}>{s} {t.seconds}</button>
                ))}
              </div>
            )}
          </div>

          <button type="button" className="ui-btn ui-btn--primary pm-start" onClick={start}>
            <Icon name="play" className="ui-btn__icon" /> {t.start} · {prayer.name[lang] || prayer.name.en}
          </button>
        </div>
      )}

      {/* ── İcra ── */}
      {running && (
        <div className="pm-stage" onClick={onStageClick}>
          <div className="pm-top">
            <span className="pm-count ui-num" aria-live="off">
              {step ? <>{t.rakat} <b>{step.rakat}</b>/{prayer.rakats} · {t.step} <b>{i + 1}</b>/{seq.length}</> : prayer.name[lang]}
            </span>
            <span className={`pm-wake pm-wake--${wake}`} title={wake === 'on' ? t.wakeOn : wake === 'unsupported' ? t.wakeOff : ''}>
              <Icon name={wake === 'on' ? 'sun' : 'alert'} size={16} />
              <span className="pm-wake-text">{wake === 'on' ? t.wakeOn : wake === 'unsupported' ? t.wakeOff : ''}</span>
            </span>
            <div className="pm-actions" role="group" aria-label={t.paper}>
              <button type="button" className="pm-icon-btn" onClick={prev} disabled={i === 0} aria-label={t.prev}><Icon name="arrow" size={20} className="pm-flip ui-flip-rtl" /></button>
              {advance === 'auto' && !done && (
                <button type="button" className="pm-icon-btn" onClick={() => setPaused(p => !p)} aria-label={paused ? t.resume : t.pause} aria-pressed={paused}>
                  <Icon name={paused ? 'play' : 'pause'} size={20} />
                </button>
              )}
              <button type="button" className="pm-icon-btn" onClick={close} aria-label={t.exit}><Icon name="close" size={22} /></button>
            </div>
          </div>

          <div className="pm-progress" aria-hidden="true"><span style={{ '--p': Math.min(1, (i + (done ? 0 : 1)) / seq.length) }} /></div>

          {step && (
            <div className="pm-body" key={i} aria-live="polite">
              <div className={`pm-figure ${sz === 'is-s' || sz === 'is-m' ? 'pm-figure--sm' : ''}`}><PrayerPose pose={step.pose} gender={gender} /></div>
              <h2 className="pm-action">{a.name[lang] || a.name.en}</h2>
              {a.lead && (
                <p className="pm-lead">{lang === 'ar' ? ZIKR[a.lead].ar : `${ZIKR[a.lead].tl[lang] || ZIKR[a.lead].tl.en} · `}{lang !== 'ar' && <span lang="ar" dir="rtl">{ZIKR[a.lead].ar}</span>}</p>
              )}
              {lines.length === 0 && <p className={`pm-say pm-say--do ${sizeClass((a.do[lang] || '').length)}`}>{a.do[lang] || a.do.en}</p>}
              {lines.map(l => (
                <div key={l.id} className={`pm-say ${sz}`}>
                  {l.tl && <p className="pm-tl">{l.tl}{l.repeat > 1 && <span className="pm-rep"> ×{l.repeat}</span>}</p>}
                  <p className="pm-ar ui-arabic" lang="ar" dir="rtl">{l.ar}{lang === 'ar' && l.repeat > 1 && <span className="pm-rep"> ×{l.repeat}</span>}</p>
                  {lang !== 'ar' && <p className="pm-mean">{l.mean}</p>}
                </div>
              ))}
              {advance === 'auto' && !paused && (
                <div className="pm-timer" aria-hidden="true"><span style={{ animationDuration: `${autoDuration(step, lang, secs)}ms` }} /></div>
              )}
            </div>
          )}

          {done && (
            <div className="pm-body pm-done">
              <span className="pm-done-icon" aria-hidden="true"><Icon name="check" size={40} strokeWidth={2.2} /></span>
              <h2 className="pm-action">{t.complete}</h2>
              <p className="pm-mean">{t.completeSub}</p>
              <div className="pm-done-actions">
                <button type="button" className="ui-btn ui-btn--primary" onClick={() => setI(0)}><Icon name="refresh" className="ui-btn__icon" /> {t.restart}</button>
                <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setRunning(false)}>{t.choose}</button>
              </div>
            </div>
          )}

          {step && (
            <div className="pm-foot">
              <span className="pm-next">
                {nextStep ? <>{t.nextUp}: <b>{ACTIONS[nextStep.id].name[lang] || ACTIONS[nextStep.id].name.en}</b></> : <b>{t.last}</b>}
              </span>
              {advance === 'tap' && <span className="pm-hint"><Icon name="touch" size={16} /> {t.tapHint}</span>}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body,
  )
}
