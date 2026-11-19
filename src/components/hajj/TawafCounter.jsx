// ═══════════════════════════════════════════════════════
// TawafCounter — həqiqi təvaf üçün böyük sayğac (TawafSim → "Təvafımı say")
//
//   <TawafCounter lang="az" takbir="اللَّهُ أَكْبَرُ" doneTitle="Yeddi dövrə tamamlandı" onClose={…} />
//
// • Tam ekran, tünd fon; bir böyük düymə — hacı hər dəfə Həcərül-Əsvəd xəttinə çatanda toxunur.
//   7 nöqtə, titrəmə (haptic), "Geri al", Wake Lock (ekran sönmür), oflayn işləyir (heç bir sorğu yoxdur).
// • Say sessionStorage-dədir (təsadüfən bağlansa / səhifə yenilənsə itmir; sinxron edilmir).
// • Dua/zikr mətni uydurulmur: yalnız simulyatordakı təkbir sətri (Buxari 1613) göstərilir.
// • Dialoq: fokus böyük düyməyə, Tab dialoqun içində dövr edir, Esc bağlayır, fokus açan düyməyə qayıdır.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { haptic } from '../../hooks/useHaptic'
import { CIRCUITS } from '../../utils/tawaf'

const KEY = 'muslim_cc_tawaf_count_v1'
const T = {
  az: {
    title: 'Təvaf sayğacı', tap: 'Dövrə tamamlandı', tapSub: 'Həcərül-Əsvəd xəttinə çatanda toxunun',
    undo: 'Geri al', reset: 'Yenidən başla', close: 'Bağla', count: (n) => `${n} / 7 dövrə`,
    awake: 'Ekran açıq qalır', said: (n) => `${n}-ci dövrə qeyd olundu`, undone: (n) => `Geri alındı: ${n} / 7`,
  },
  en: {
    title: 'Tawaf counter', tap: 'Circuit complete', tapSub: 'Tap when you reach the Black Stone line',
    undo: 'Undo', reset: 'Start again', close: 'Close', count: (n) => (n === 1 ? '1 of 7 circuits' : `${n} of 7 circuits`),
    awake: 'The screen stays on', said: (n) => `Circuit ${n} counted`, undone: (n) => `Undone: ${n} of 7`,
  },
  ru: {
    title: 'Счётчик тавафа', tap: 'Круг пройден', tapSub: 'Нажмите, дойдя до линии Чёрного камня',
    undo: 'Отменить', reset: 'Начать заново', close: 'Закрыть', count: (n) => `${n} из 7 кругов`,
    awake: 'Экран не гаснет', said: (n) => `Круг ${n} засчитан`, undone: (n) => `Отменено: ${n} из 7`,
  },
  ar: {
    title: 'عدّاد الطواف', tap: 'اكتمل الشوط', tapSub: 'اضغط عند وصولك إلى خط الحجر الأسود',
    undo: 'تراجع', reset: 'ابدأ من جديد', close: 'إغلاق', count: (n) => `${n} من ٧ أشواط`,
    awake: 'تبقى الشاشة مضاءة', said: (n) => `سُجّل الشوط ${n}`, undone: (n) => `تم التراجع: ${n} من ٧`,
  },
  tr: {
    title: 'Tavaf sayacı', tap: 'Şavt tamamlandı', tapSub: 'Hacerü’l-Esved hizasına gelince dokunun',
    undo: 'Geri al', reset: 'Yeniden başla', close: 'Kapat', count: (n) => `${n} / 7 şavt`,
    awake: 'Ekran açık kalır', said: (n) => `${n}. şavt sayıldı`, undone: (n) => `Geri alındı: ${n} / 7`,
  },
}

const readCount = () => {
  try { const n = Number(window.sessionStorage.getItem(KEY)); return Number.isInteger(n) && n >= 0 && n <= CIRCUITS ? n : 0 } catch { return 0 }
}
const writeCount = (n) => { try { window.sessionStorage.setItem(KEY, String(n)) } catch { /* gizli rejim */ } }

// Ekran sönməsin (Screen Wake Lock) — dəstək yoxdursa səssizcə heç nə
function useScreenAwake() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const wl = navigator.wakeLock
    if (!wl?.request) return undefined
    let lock = null, alive = true
    const get = () => {
      if (!alive || lock || document.visibilityState !== 'visible') return
      wl.request('screen').then((l) => {
        if (!alive) { l.release?.().catch?.(() => {}); return }
        lock = l; setOn(true)
        l.addEventListener?.('release', () => { lock = null; if (alive) setOn(false) })
      }).catch(() => {})
    }
    const onVis = () => get()
    get()
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; document.removeEventListener('visibilitychange', onVis); lock?.release?.().catch?.(() => {}) }
  }, [])
  return on
}

export default function TawafCounter({ lang = 'az', takbir, doneTitle, onClose }) {
  const t = pickUi(T, lang, 'en')
  const [n, setN] = useState(0)
  const [say, setSay] = useState('')
  const [bump, setBump] = useState(0)
  const rootRef = useRef(null)
  const tapRef = useRef(null)
  const awake = useScreenAwake()
  const finished = n >= CIRCUITS

  // Say mount-dan sonra oxunur (sessionStorage)
  useEffect(() => { setN(readCount()) }, [])
  useEffect(() => {
    tapRef.current?.focus()
    document.documentElement.classList.add('twc-open')
    return () => document.documentElement.classList.remove('twc-open')
  }, [])

  // 7-ci dövrədən sonra böyük düymə yox olur — fokus "Yenidən başla"ya keçir (itmir)
  useEffect(() => { if (finished) tapRef.current?.focus() }, [finished])

  const set = (v) => { setN(v); writeCount(v) }
  const tap = () => {
    if (finished) return
    const v = n + 1
    haptic(v === CIRCUITS ? [40, 80, 40, 80, 40] : 35)
    set(v); setBump(b => b + 1)
    setSay(t.said(v))
  }
  const undo = () => { if (n > 0) { haptic(10); set(n - 1); setSay(t.undone(n - 1)) } }
  const reset = () => { haptic(10); set(0); setSay(t.count(0)); tapRef.current?.focus() }

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose?.(); return }
    if (e.key !== 'Tab') return
    const f = [...rootRef.current.querySelectorAll('button:not([disabled])')]
    if (!f.length) return
    const i = f.indexOf(document.activeElement)
    const nx = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1)
    e.preventDefault(); f[nx].focus()
  }

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="twc" role="dialog" aria-modal="true" aria-labelledby="twc-title" ref={rootRef} onKeyDown={onKey} data-testid="tawaf-counter">
      <header className="twc__top">
        <h2 id="twc-title" className="twc__title">{t.title}</h2>
        <button type="button" className="twc__x" onClick={onClose} aria-label={t.close} title={t.close}><Icon name="close" size={20} /></button>
      </header>

      <div className="twc__main">
        <p className="twc__count ui-num" data-testid="tawaf-counter-n"><b>{n}</b><span> / {CIRCUITS}</span></p>
        <ol className="twc__dots" aria-label={t.count(n)}>
          {Array.from({ length: CIRCUITS }, (_, i) => <li key={i} className={i < n ? 'is-done' : i === n ? 'is-cur' : undefined} />)}
        </ol>
        {finished ? (
          <div className="twc__done">
            <Icon name="check" size={40} strokeWidth={2.2} />
            <p className="twc__done-h">{doneTitle}</p>
            <button type="button" className="twc__reset" onClick={reset} ref={tapRef}><Icon name="refresh" size={18} /> {t.reset}</button>
          </div>
        ) : (
          <button type="button" className="twc__tap" ref={tapRef} onClick={tap} data-testid="tawaf-counter-tap">
            <span key={bump} className="twc__tap-ring" aria-hidden="true" />
            <b>{t.tap}</b>
            <span>{t.tapSub}</span>
          </button>
        )}
        {takbir && !finished && <p className="twc__takbir ui-arabic" lang="ar" dir="rtl">{takbir}</p>}
      </div>

      <footer className="twc__foot">
        <button type="button" className="twc__undo" onClick={undo} disabled={n === 0}><Icon name="arrow" size={16} className="twc__undo-ic" /> {t.undo}</button>
        {awake && <span className="twc__awake"><Icon name="sun" size={14} /> {t.awake}</span>}
      </footer>
      <p className="ui-sr-only" aria-live="polite">{say}</p>
    </div>,
    document.body,
  )
}
