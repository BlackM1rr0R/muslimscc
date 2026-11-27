// ═══════════════════════════════════════════════════════
// Başlıqda kiçik qiblə kompası — yalnız telefon/planşet (<1024px; Header.jsx boş vaxtda yükləyir,
// Header.css-dən asılı deyil: stillər styles/HeaderQibla.css-dədir).
//
// • İlk toxunuş: iOS-da DeviceOrientation icazəsi (toxunuşun İÇİNDƏ, gözləmədən — Safari tələbi),
//   kompas məntiqi tənbəl yüklənir (utils/qiblaMini.js), yer: seçilmiş şəhər → geolokasiya.
// • Ox Kəbəyə tərəf fırlanır (DOM-da birbaşa, React render yox). Kompas zəifdirsə «Kalibrləyin».
// • Sensor yoxdursa (masaüstü, icazə verilmədi) ox əvəzinə bucağın rəqəmi göstərilir.
// • İkinci toxunuş və ya uzun basma → /qibla. Klaviatura: Enter/Boşluq eyni.
// • Ekran oxuyucu: aria-label «Qiblə: 203° cənub-qərb», dəyişəndə role="status" bildirir.
// • 2 dəqiqədən sonra sensor dayanır (batareya); növbəti toxunuş yenidən başladır.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import '../styles/HeaderQibla.css'

const T = {
  az: { open: 'Qiblə kompası', label: (b) => `Qiblə: ${b}`, again: 'Tam qiblə səhifəsi üçün yenidən toxunun', calib: 'Kalibrləyin', calibHint: 'Kompas zəifdir — telefonu havada 8 rəqəmi çəkərək hərəkət etdirin', noSensor: 'Kompas sensoru yoxdur — bucaq həqiqi şimaldan', points: ['şimal', 'şimal-şərq', 'şərq', 'cənub-şərq', 'cənub', 'cənub-qərb', 'qərb', 'şimal-qərb'] },
  en: { open: 'Qibla compass', label: (b) => `Qibla: ${b}`, again: 'Tap again for the full qibla page', calib: 'Calibrate', calibHint: 'The compass is weak — move the phone in a figure 8 in the air', noSensor: 'No compass sensor — bearing from true north', points: ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'] },
  ru: { open: 'Компас киблы', label: (b) => `Кибла: ${b}`, again: 'Нажмите ещё раз, чтобы открыть страницу киблы', calib: 'Откалибруйте', calibHint: 'Компас неточен — поводите телефоном в воздухе восьмёркой', noSensor: 'Нет датчика компаса — угол от истинного севера', points: ['север', 'северо-восток', 'восток', 'юго-восток', 'юг', 'юго-запад', 'запад', 'северо-запад'] },
  ar: { open: 'بوصلة القبلة', label: (b) => `القبلة: ${b}`, again: 'المس مرة أخرى لفتح صفحة القبلة كاملة', calib: 'معايرة', calibHint: 'البوصلة ضعيفة — حرّك الهاتف في الهواء على شكل الرقم 8', noSensor: 'لا يوجد مستشعر بوصلة — الزاوية من الشمال الحقيقي', points: ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'] },
  tr: { open: 'Kıble pusulası', label: (b) => `Kıble: ${b}`, again: 'Tam kıble sayfası için tekrar dokunun', calib: 'Kalibre edin', calibHint: 'Pusula zayıf — telefonu havada 8 çizerek hareket ettirin', noSensor: 'Pusula sensörü yok — açı gerçek kuzeyden', points: ['kuzey', 'kuzeydoğu', 'doğu', 'güneydoğu', 'güney', 'güneybatı', 'batı', 'kuzeybatı'] },
}

const LONG_PRESS_MS = 550
const RUN_MS = 120000
const loadLogic = () => import('../utils/qiblaMini')

export default function HeaderQibla({ onOpenPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  // idle | loading | live | static
  const [phase, setPhase] = useState('idle')
  const [bearing, setBearing] = useState(null)
  const [calib, setCalib] = useState(false)
  const [fmt, setFmt] = useState(null)       // tənbəl modulun formatBearing-i
  const arrowRef = useRef(null)
  const angleRef = useRef(null)
  const stopRef = useRef(null)
  const runTimer = useRef(0)
  const pressTimer = useRef(0)
  const suppressClick = useRef(false)
  const alive = useRef(true)

  const stop = useCallback(() => {
    stopRef.current?.(); stopRef.current = null
    clearTimeout(runTimer.current)
  }, [])

  useEffect(() => {
    alive.current = true
    const onVis = () => { if (document.visibilityState === 'hidden' && stopRef.current) { stop(); setPhase('idle'); setCalib(false) } }
    document.addEventListener('visibilitychange', onVis)
    return () => { alive.current = false; document.removeEventListener('visibilitychange', onVis); stop(); clearTimeout(pressTimer.current) }
  }, [stop])

  const rotate = useCallback((target, angleDiff) => {
    // Davamlı bucaq: 359° → 1° keçidində ox tam dövrə vurmasın
    const prev = angleRef.current
    const next = prev == null ? target : prev + angleDiff(target, prev)
    angleRef.current = next
    if (arrowRef.current) arrowRef.current.style.transform = `rotate(${next}deg)`
  }, [])

  const start = () => {
    // iOS 13+: icazə sorğusu toxunuşun içində, heç bir await-dən ƏVVƏL
    const DOE = typeof window !== 'undefined' ? window.DeviceOrientationEvent : undefined
    let perm = Promise.resolve(DOE ? 'granted' : 'none')
    if (DOE && typeof DOE.requestPermission === 'function') {
      try { perm = Promise.resolve(DOE.requestPermission()).catch(() => 'denied') } catch { perm = Promise.resolve('denied') }
    }
    setPhase('loading')
    setCalib(false)
    Promise.all([loadLogic(), perm])
      .then(async ([m, p]) => {
        const loc = await m.resolveLocation()
        if (!alive.current) return
        const q = m.bearingFor(loc)
        setFmt(() => m.formatBearing)
        setBearing(q)
        if (q == null || p !== 'granted') { setPhase('static'); return }
        angleRef.current = null
        stopRef.current = m.startCompass({
          onHeading: (h) => rotate(q - h, m.angleDiff),
          onAccuracy: (a) => setCalib(a === 'low'),
          onNone: () => { stop(); if (alive.current) setPhase('static') },
        })
        setPhase('live')
        clearTimeout(runTimer.current)
        runTimer.current = setTimeout(() => { stop(); if (alive.current) { setPhase('idle'); setCalib(false) } }, RUN_MS)
      })
      .catch(() => { if (alive.current) setPhase('idle') })
  }

  const openPage = () => { stop(); setPhase('idle'); setCalib(false); onOpenPage?.() }

  const onClick = () => {
    if (suppressClick.current) { suppressClick.current = false; return }
    if (phase === 'loading') return
    if (phase === 'live' || phase === 'static') { openPage(); return }
    start()
  }
  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => { suppressClick.current = true; openPage() }, LONG_PRESS_MS)
  }
  const cancelPress = () => clearTimeout(pressTimer.current)

  const text = bearing != null && fmt ? fmt(bearing, t.points) : ''
  const label = text ? t.label(text) : t.open
  const active = phase === 'live' || phase === 'static'
  const status = phase === 'static' && text ? `${t.label(text)}. ${t.noSensor}` : (phase === 'live' && text ? `${t.label(text)}${calib ? `. ${t.calibHint}` : ''}` : '')

  return (
    <span className="hq-wrap">
      <button
        type="button"
        className={`hdr-btn hq-btn is-${phase}${calib ? ' is-calib' : ''}`}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={label}
        aria-describedby={active ? 'hq-again' : undefined}
        aria-busy={phase === 'loading' || undefined}
        title={label}
        data-testid="header-qibla"
      >
        {phase === 'static' && bearing != null ? (
          <span className="hq-num" aria-hidden="true">{Math.round(bearing) % 360}°</span>
        ) : (
          <svg className="hq-svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <g ref={arrowRef} className="hq-arrow">
              <path d="M12 5.5 15 12h-6z" fill="currentColor" stroke="none" className="hq-tip" />
              <path d="M12 12v6.5" />
            </g>
          </svg>
        )}
      </button>
      {active && <span id="hq-again" className="ui-sr-only">{t.again}</span>}
      {phase === 'live' && calib && <span className="hq-calib" aria-hidden="true">{t.calib}</span>}
      <span className="ui-sr-only" role="status" aria-live="polite">{status}</span>
    </span>
  )
}
