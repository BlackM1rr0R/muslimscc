// ═══════════════════════════════════════════════════════
// Yolda rejimi — sadə qiblə kompası (/on-the-road)
//
// • Bucaq — saytın ortaq həndəsəsi (utils/paperDial → qiblaBearing, utils/rasdQibla → KAABA);
//   yer: əvvəl namaz vaxtları üçün seçilmiş şəhər, istəsəniz "Məkanımı istifadə et" (bir dəfəlik).
// • Cihaz istiqaməti: iOS — webkitCompassHeading, digərləri — deviceorientation(absolute) alpha
//   (QiblaPage ilə eyni qayda; yumşaltma — utils/cameraHeading → smoothAngle). İynə DOM-da birbaşa
//   fırlanır (React render yox, layout oxunmur). "Hərəkəti azalt"da yumşaltma yoxdur.
// • Maşında: "Əvvəlcə təhlükəsiz dayanın" qeydi həmişə görünür.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { qiblaBearing } from '../../utils/paperDial'
import { angleDiff, smoothAngle } from '../../utils/cameraHeading'
import { getPrayerLocation } from '../../utils/prayerLocation'

const T = {
  az: { stop: 'Qibləyə dönmək üçün əvvəlcə təhlükəsiz yerdə dayanın.', bearing: 'Qiblə bucağı', fromNorth: 'şimaldan saat əqrəbi istiqamətində', forCity: (c) => `${c} üçün`, forHere: 'Olduğunuz yer üçün', useLoc: 'Məkanımı istifadə et', locating: 'Məkan təyin edilir…', locErr: 'Məkan alınmadı — seçilmiş şəhər istifadə olunur.', enable: 'Kompası aç', noSensor: 'Kompas sensoru cavab vermir — bucağı adi kompasla tapın.', aligned: 'Qibləyə üz tutmusunuz', turn: 'Ox düz yuxarı göstərənə qədər dönün', full: 'Tam qiblə səhifəsi' },
  en: { stop: 'Stop safely first before turning to the qibla.', bearing: 'Qibla bearing', fromNorth: 'clockwise from north', forCity: (c) => `For ${c}`, forHere: 'For your location', useLoc: 'Use my location', locating: 'Finding your location…', locErr: 'Location unavailable — using the selected city.', enable: 'Turn on the compass', noSensor: 'The compass sensor is not responding — find the bearing with an ordinary compass.', aligned: 'You are facing the qibla', turn: 'Turn until the arrow points straight up', full: 'Full qibla page' },
  ru: { stop: 'Прежде чем поворачиваться к кибле, безопасно остановитесь.', bearing: 'Угол киблы', fromNorth: 'от севера по часовой стрелке', forCity: (c) => `Для города ${c}`, forHere: 'Для вашего места', useLoc: 'Использовать моё местоположение', locating: 'Определяем местоположение…', locErr: 'Местоположение недоступно — используется выбранный город.', enable: 'Включить компас', noSensor: 'Датчик компаса не отвечает — найдите угол обычным компасом.', aligned: 'Вы обращены к кибле', turn: 'Поворачивайтесь, пока стрелка не укажет прямо вверх', full: 'Полная страница киблы' },
  ar: { stop: 'توقّف في مكان آمن أولًا قبل أن تتّجه إلى القبلة.', bearing: 'زاوية القبلة', fromNorth: 'من الشمال باتجاه عقارب الساعة', forCity: (c) => `لمدينة ${c}`, forHere: 'لموقعك الحالي', useLoc: 'استخدم موقعي', locating: 'جارٍ تحديد الموقع…', locErr: 'تعذّر تحديد الموقع — تُستخدم المدينة المختارة.', enable: 'شغّل البوصلة', noSensor: 'مستشعر البوصلة لا يستجيب — استخرج الزاوية ببوصلة عادية.', aligned: 'أنت مستقبل القبلة', turn: 'استدر حتى يشير السهم إلى الأعلى مباشرة', full: 'صفحة القبلة الكاملة' },
  tr: { stop: 'Kıbleye dönmeden önce güvenli bir yerde durun.', bearing: 'Kıble açısı', fromNorth: 'kuzeyden saat yönünde', forCity: (c) => `${c} için`, forHere: 'Bulunduğunuz yer için', useLoc: 'Konumumu kullan', locating: 'Konum belirleniyor…', locErr: 'Konum alınamadı — seçili şehir kullanılıyor.', enable: 'Pusulayı aç', noSensor: 'Pusula sensörü yanıt vermiyor — açıyı sıradan bir pusulayla bulun.', aligned: 'Kıbleye yöneldiniz', turn: 'Ok tam yukarıyı gösterene kadar dönün', full: 'Tam kıble sayfası' },
}

export default function RoadQibla({ lang, qiblaHref, onQiblaLink }) {
  const t = pickUi(T, lang, 'en')
  const [place, setPlace] = useState(() => {
    const loc = getPrayerLocation()
    return { lat: Number(loc.lat), lng: Number(loc.lng), city: loc.city?.[lang] || loc.city?.en || '', here: false }
  })
  const [geo, setGeo] = useState('idle')          // idle | loading | error
  const [sensor, setSensor] = useState('wait')     // wait | live | none | ask
  const [aligned, setAligned] = useState(false)
  const needleRef = useRef(null)
  const smoothRef = useRef(null)
  const alignedRef = useRef(false)
  const q = Number.isFinite(place.lat) && Number.isFinite(place.lng) ? qiblaBearing(place.lat, place.lng) : null
  const qRef = useRef(q)
  qRef.current = q

  const onOrient = useCallback((e) => {
    let h = null
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading
    else if (typeof e.alpha === 'number') h = (360 - e.alpha) % 360
    if (h == null || !Number.isFinite(h)) return
    let reduce = false
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { /* */ }
    smoothRef.current = reduce ? h : smoothAngle(smoothRef.current, h, 0.2)
    setSensor((s) => (s === 'live' ? s : 'live'))
    const target = qRef.current ?? 0
    const off = angleDiff(target, smoothRef.current)
    if (needleRef.current) needleRef.current.style.transform = `rotate(${off}deg)`
    const al = Math.abs(off) < 5
    if (al !== alignedRef.current) { alignedRef.current = al; setAligned(al) }
  }, [])

  const listen = useCallback(() => {
    let abs = false
    const a = (e) => { abs = true; onOrient(e) }
    const r = (e) => { if (!abs) onOrient(e) }
    window.addEventListener('deviceorientationabsolute', a, true)
    window.addEventListener('deviceorientation', r, true)
    return () => {
      window.removeEventListener('deviceorientationabsolute', a, true)
      window.removeEventListener('deviceorientation', r, true)
    }
  }, [onOrient])

  const stopRef = useRef(null)
  useEffect(() => {
    const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' && coarse) {
      setSensor('ask')
      return () => stopRef.current?.()
    }
    stopRef.current = listen()
    const timer = setTimeout(() => setSensor((s) => (s === 'wait' ? 'none' : s)), 3000)
    return () => { clearTimeout(timer); stopRef.current?.() }
  }, [listen])

  const askSensor = async () => {
    try {
      const perm = await DeviceOrientationEvent.requestPermission()
      if (perm === 'granted') { stopRef.current = listen(); setSensor('wait') } else setSensor('none')
    } catch { setSensor('none') }
  }

  const useHere = () => {
    if (!navigator.geolocation) { setGeo('error'); return }
    setGeo('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPlace({ lat: pos.coords.latitude, lng: pos.coords.longitude, city: '', here: true }); setGeo('idle') },
      () => setGeo('error'),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    )
  }

  const deg = q == null ? null : Math.round(q)

  return (
    <div className="road-qibla">
      <p className="road-safety road-safety--inline"><Icon name="alert" size={22} /> {t.stop}</p>

      <div className={`road-compass${aligned ? ' is-aligned' : ''}${sensor === 'live' ? ' is-live' : ''}`} aria-hidden="true">
        <span className="road-compass__mark" />
        <span className="road-compass__needle" ref={needleRef} style={sensor === 'live' ? undefined : { transform: `rotate(${deg || 0}deg)` }}>
          <i className="road-compass__arrow" />
        </span>
        <span className="road-compass__kaaba"><Icon name="qibla" size={28} /></span>
      </div>

      <p className="road-prayer__count ui-num" data-testid="road-bearing">{deg == null ? '—' : `${deg}°`}</p>
      <p className="road-big-line"><span>{t.bearing}</span> <span className="road-sub">{t.fromNorth}</span></p>
      <p className="road-sub" role="status" aria-live="polite">
        {sensor === 'live' ? (aligned ? t.aligned : t.turn) : ''}
        {sensor === 'none' ? t.noSensor : ''}
        {geo === 'loading' ? t.locating : ''}
        {geo === 'error' ? t.locErr : ''}
      </p>
      <p className="road-hint">{place.here ? t.forHere : (place.city ? t.forCity(place.city) : '')}</p>

      <div className="road-row">
        {sensor === 'ask' && (
          <button type="button" className="road-btn road-btn--wide" onClick={askSensor}><Icon name="compass" size={24} /> {t.enable}</button>
        )}
        <button type="button" className="road-btn road-btn--wide" onClick={useHere} disabled={geo === 'loading'}><Icon name="pin" size={24} /> {t.useLoc}</button>
      </div>
      <p className="road-hint"><a href={qiblaHref} onClick={onQiblaLink} className="road-link">{t.full}</a></p>
    </div>
  )
}
