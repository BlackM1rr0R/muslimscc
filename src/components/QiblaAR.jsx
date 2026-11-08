// ═══════════════════════════════════════════════════════
// QiblaAR — kamera üzərində Qiblə (/qibla, telefonda)
//
//   <QiblaAR qibla={245.3} distanceKm={2134} lang="az" onClose={() => …} />
//
// • Arxa kamera (getUserMedia, facingMode: environment) — görüntü YALNIZ
//   ekranda göstərilir, heç yerə yazılmır və göndərilmir.
// • İstiqamət: iOS — webkitCompassHeading; digərləri — deviceorientationabsolute
//   alpha/beta/gamma-dan kameranın baxdığı bucaq (utils/cameraHeading).
// • Kəbə nişanı üfüqi mövqeyi: fərq / görüş bucağı (≈55°). Kənardadırsa —
//   kənarda ox və dərəcə. ±4° → "tuşlandı": şüa parlayır, bir dəfə titrəyir.
// • Esc / "Bağla" — kamera dərhal dayandırılır (bütün track-lər stop).
// Stillər: src/styles/QiblaAR.css
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { haptic } from '../hooks/useHaptic'
import { cameraHeading, angleDiff, smoothAngle } from '../utils/cameraHeading'
import '../styles/QiblaAR.css'
import { pickUi } from '../utils/uiText'

const FOV = 55
const T = {
  // lang-ok[Kamera,Kameranı,kamera]: az dilinin öz sözüdür (kamera)
  az: { title: 'Kamera ilə Qiblə', close: 'Bağla', hold: 'Telefonu dik tutun və yavaş-yavaş dönün', aligned: 'Qiblə istiqamətindəsiniz', km: (n) => `Kəbəyə ${n} km`, noCam: 'Kameranı açmaq olmadı. Brauzerdə kamera icazəsini yoxlayın.', noSensor: 'Kompas sensoru cavab vermir — telefonu səkkiz şəklində hərəkət etdirib yenidən yoxlayın.', turn: (d) => `${d}°`, privacy: 'Görüntü yalnız ekranınızdadır — yazılmır, göndərilmir.', accGood: 'Kompas dəqiqdir', accLow: 'Kompas dəqiq deyil — telefonu havada ∞ şəklində bir neçə dəfə hərəkət etdirin', tilt: 'Telefonu dik tutun (kamera irəli baxsın)' },
  en: { title: 'Qibla with the camera', close: 'Close', hold: 'Hold the phone upright and turn slowly', aligned: 'You are facing the qibla', km: (n) => `${n} km to the Kaaba`, noCam: 'Could not open the camera. Check the camera permission in your browser.', noSensor: 'The compass sensor is not responding — move the phone in a figure of eight and try again.', turn: (d) => `${d}°`, privacy: 'The picture stays on your screen — nothing is recorded or sent.', accGood: 'Compass is accurate', accLow: 'Compass is not accurate — move the phone in a ∞ shape a few times', tilt: 'Hold the phone upright (camera facing forward)' },
  ru: { title: 'Кибла через камеру', close: 'Закрыть', hold: 'Держите телефон вертикально и медленно поворачивайтесь', aligned: 'Вы смотрите на киблу', km: (n) => `До Каабы ${n} км`, noCam: 'Не удалось открыть камеру. Проверьте разрешение камеры в браузере.', noSensor: 'Компас не отвечает — подвигайте телефоном восьмёркой и попробуйте снова.', turn: (d) => `${d}°`, privacy: 'Изображение остаётся на экране — ничего не записывается и не отправляется.', accGood: 'Компас точен', accLow: 'Компас неточен — несколько раз проведите телефоном в воздухе знак ∞', tilt: 'Держите телефон вертикально (камера смотрит вперёд)' },
  tr: { title: 'Kamerayla kıble', close: 'Kapat', hold: 'Telefonu dik tutun ve yavaşça dönün', aligned: 'Kıble yönündesiniz', km: (n) => `Kâbe’ye ${n} km`, noCam: 'Kamera açılamadı. Tarayıcıda kamera iznini kontrol edin.', noSensor: 'Pusula sensörü yanıt vermiyor — telefonu sekiz çizerek hareket ettirip tekrar deneyin.', turn: (d) => `${d}°`, privacy: 'Görüntü yalnızca ekranınızda kalır — kaydedilmez, gönderilmez.', accGood: 'Pusula doğru', accLow: 'Pusula doğru değil — telefonu havada birkaç kez ∞ şeklinde hareket ettirin', tilt: 'Telefonu dik tutun (kamera öne baksın)' },
  ar: { title: 'القبلة بالكاميرا', close: 'إغلاق', hold: 'أمسك الهاتف عموديًا واستدر ببطء', aligned: 'أنت متجه إلى القبلة', km: (n) => `${n} كم إلى الكعبة`, noCam: 'تعذّر فتح الكاميرا. تحقّق من إذن الكاميرا في المتصفح.', noSensor: 'حساس البوصلة لا يستجيب — حرّك الهاتف على شكل الرقم ثمانية وحاول مجددًا.', turn: (d) => `${d}°`, privacy: 'الصورة تبقى على شاشتك فقط — لا تُسجَّل ولا تُرسل.', accGood: 'البوصلة دقيقة', accLow: 'البوصلة غير دقيقة — حرّك الهاتف في الهواء على شكل ∞ عدة مرات', tilt: 'أمسك الهاتف عموديًا (الكاميرا إلى الأمام)' },
}

export default function QiblaAR({ qibla, distanceKm, lang = 'az', onClose }) {
  const t = pickUi(T, lang)
  const videoRef = useRef(null)
  const markRef = useRef(null)
  const closeRef = useRef(null)
  const [err, setErr] = useState(null) // 'cam' | 'sensor'
  const [aligned, setAligned] = useState(false)
  const [side, setSide] = useState(null) // { dir: 'l'|'r', deg }
  // v5.7: kompasın dəqiqliyi ('good'|'low'|null) və telefonun dik tutulması
  const [acc, setAcc] = useState(null)
  const [upright, setUpright] = useState(true)
  const dialRef = useRef(null)

  // Kamera
  useEffect(() => {
    let stream = null, alive = true
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(s => {
        if (!alive) { s.getTracks().forEach(tr => tr.stop()); return }
        stream = s
        const v = videoRef.current
        if (v) { v.srcObject = s; v.play?.().catch(() => {}) }
      })
      .catch(() => alive && setErr('cam'))
    return () => { alive = false; stream?.getTracks().forEach(tr => tr.stop()) }
  }, [])

  // Sensor + çəkiliş
  useEffect(() => {
    let head = null, raw = null, raf = 0, wasAligned = false, lastSide = '', gotAbs = false
    // dəqiqlik: iOS — webkitCompassAccuracy (dərəcə, −1 = kalibrlənməyib); digərləri —
    // son ~1.5 s-dəki oxunuşların səpələnməsi (dairəvi orta sapma)
    let iosAcc = null, lastAcc = '', lastUp = true
    const buf = []
    const onAbs = (e) => { gotAbs = true; take(e) }
    const onRel = (e) => { if (!gotAbs) take(e) }
    const take = (e) => {
      const h = typeof e.webkitCompassHeading === 'number' ? e.webkitCompassHeading : cameraHeading(e.alpha, e.beta, e.gamma)
      if (h != null && Number.isFinite(h)) { raw = h; buf.push(h); if (buf.length > 40) buf.shift() }
      if (typeof e.webkitCompassAccuracy === 'number') iosAcc = e.webkitCompassAccuracy
      if (Number.isFinite(e.beta)) {
        const up = Math.abs(e.beta) > 45 && Math.abs(e.beta) < 135
        if (up !== lastUp) { lastUp = up; setUpright(up) }
      }
    }
    const accNow = () => {
      if (iosAcc != null) return iosAcc < 0 || iosAcc > 25 ? 'low' : 'good'
      if (buf.length < 20) return null
      let sx = 0, sy = 0
      for (const a of buf) { sx += Math.cos(a * Math.PI / 180); sy += Math.sin(a * Math.PI / 180) }
      const R = Math.hypot(sx, sy) / buf.length
      const sd = Math.sqrt(-2 * Math.log(Math.max(1e-6, R))) * 180 / Math.PI
      return sd > 14 ? 'low' : 'good'
    }
    window.addEventListener('deviceorientationabsolute', onAbs, true)
    window.addEventListener('deviceorientation', onRel, true)
    const noSensor = setTimeout(() => { if (raw == null) setErr(x => x || 'sensor') }, 4000)
    const tick = () => {
      if (raw != null) {
        head = smoothAngle(head, raw)
        const d = angleDiff(qibla, head)
        const x = 50 + (d / FOV) * 100
        const inView = x > -5 && x < 105
        if (markRef.current) {
          markRef.current.style.transform = `translateX(${Math.max(-10, Math.min(110, x)) - 50}vw)`
          markRef.current.style.opacity = inView ? '1' : '0'
        }
        const al = Math.abs(d) < 4
        if (al !== wasAligned) { wasAligned = al; setAligned(al); if (al) haptic([12, 50, 12]) }
        const sd = inView ? '' : `${d < 0 ? 'l' : 'r'}:${Math.round(Math.abs(d) / 5) * 5}`
        if (sd !== lastSide) { lastSide = sd; setSide(sd ? { dir: sd[0], deg: sd.slice(2) } : null) }
        if (dialRef.current) dialRef.current.style.transform = `rotate(${d.toFixed(1)}deg)`
        const ac = accNow()
        if (ac !== lastAcc) { lastAcc = ac; setAcc(ac) }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf); clearTimeout(noSensor)
      window.removeEventListener('deviceorientationabsolute', onAbs, true)
      window.removeEventListener('deviceorientation', onRel, true)
    }
  }, [qibla])

  // Esc, fokus, sürüşmə kilidi
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const km = Number.isFinite(distanceKm) ? Math.round(distanceKm).toLocaleString(lang === 'ar' ? 'ar-u-nu-latn' : lang) : null

  return createPortal(
    <div className={`qar${aligned ? ' is-aligned' : ''}`} role="dialog" aria-modal="true" aria-label={t.title} dir="ltr" data-testid="qibla-ar">
      <video ref={videoRef} className="qar__video" playsInline muted autoPlay aria-hidden="true" />
      <div className="qar__shade" aria-hidden="true" />
      <header className="qar__top">
        <span className="qar__title">{t.title}</span>
        <button type="button" ref={closeRef} className="ui-btn ui-btn--inverse ui-btn--sm" onClick={onClose}>
          <Icon name="close" className="ui-btn__icon" /> {t.close}
        </button>
      </header>

      <div className="qar__horizon" aria-hidden="true" />
      <div className="qar__reticle" aria-hidden="true" />
      <div className="qar__mark" ref={markRef} aria-hidden="true">
        <span className="qar__beam" />
        <span className="qar__kaaba"><Icon name="hajjguide" size={30} /></span>
        {km && <span className="qar__km ui-num">{t.km(km)}</span>}
      </div>
      {side && (
        <div className={`qar__edge qar__edge--${side.dir}`} aria-hidden="true">
          <Icon name="arrow" size={26} />
          <span className="ui-num">{t.turn(side.deg)}</span>
        </div>
      )}

      {/* v5.7: kiçik kompas lövhəsi — ox Qibləni göstərir (yuxarı = kameranın baxdığı yön) */}
      <div className="qar__dial" aria-hidden="true">
        <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" /><path d="M40 8v6M40 66v6M8 40h6M66 40h6" /></svg>
        <span className="qar__needle" ref={dialRef}><i /></span>
      </div>
      <footer className="qar__bottom" aria-live="polite">
        {!err && !upright && <p className="qar__chip qar__chip--warn">{t.tilt}</p>}
        {!err && acc && (
          <p className={`qar__chip qar__chip--${acc}`} data-testid="qar-acc">
            {acc === 'low' && <span className="qar__eight" aria-hidden="true"><Icon name="phone" size={16} /></span>}
            {acc === 'good' ? t.accGood : t.accLow}
          </p>
        )}
        {err === 'cam' ? <p className="qar__msg">{t.noCam}</p>
          : err === 'sensor' ? <p className="qar__msg">{t.noSensor}</p>
          : <p className="qar__msg">{aligned ? <b>{t.aligned}</b> : t.hold}</p>}
        <p className="qar__privacy"><Icon name="shield" size={14} /> {t.privacy}</p>
      </footer>
    </div>,
    document.body,
  )
}
