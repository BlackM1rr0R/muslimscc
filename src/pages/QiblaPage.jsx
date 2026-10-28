import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import { getPrayerLocation } from '../utils/prayerLocation'
import '../styles/QiblaPage.css'
import Breadcrumb from '../components/Breadcrumb'

const KAABA = { lat: 21.3891, lon: 39.8579 }

// Kompasda yalnız 4 əsas istiqamət yazı ilə göstərilir (aralıqdakılar
// cizgi ilə). Azərbaycan və ərəb dillərində tək hərf toqquşur
// (Şimal/Şərq, شمال/شرق) — ona görə tam söz.
const CARDINALS = {
  az: ['Şimal', 'Şərq', 'Cənub', 'Qərb'],
  en: ['N', 'E', 'S', 'W'],
  ru: ['С', 'В', 'Ю', 'З'],
  tr: ['K', 'D', 'G', 'B'],
  ar: ['شمال', 'شرق', 'جنوب', 'غرب'],
}

// Məsafə vahidi və rəqəm formatı (az: "2.317", ar: latın rəqəmləri —
// Chrome-un yığcam ICU-sunda "az" lokalı olmadığı üçün tr-TR istifadə olunur)
const KM = { az: 'km', en: 'km', ru: 'км', ar: 'كم', tr: 'km' }
const NUM_LOCALES = { az: 'tr-TR', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-nu-latn' }

function formatKm(n, lang) {
  try { return n.toLocaleString(NUM_LOCALES[lang] || 'en-GB') } catch { return String(n) }
}

function toRad(deg) { return deg * (Math.PI / 180) }
function toDeg(rad) { return rad * (180 / Math.PI) }

function calcQibla(userLat, userLon) {
  const φ1 = toRad(userLat)
  const φ2 = toRad(KAABA.lat)
  const Δλ = toRad(KAABA.lon - userLon)
  const x = Math.sin(Δλ) * Math.cos(φ2)
  const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (toDeg(Math.atan2(x, y)) + 360) % 360
}

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const LABELS = {
  az: { title:'Qiblə İstiqaməti', subtitle:'Kəbəyə dəqiq istiqamət', loading:'Məkan təyin edilir...', error:'Məkan tapılmadı', errorSub:'Brauzerdə məkan icazəsi verin', distance:'Kəbəyə məsafə', bearing:'Qiblə bucağı', grant:'İcazə ver', manual:'Seçilmiş şəhərlə davam et', accuracy:'Dəqiqlik', live:'Canlı Kompas', liveDesc:'Cihazınızı düz tutun', noSensor:'Kompas sensoru yoxdur', noSensorSub:'Yalnız statik istiqamət göstərilir', fromNorth:'Şimaldan saat istiqamətində', enableCompass:'Kompası aktivləşdir', refreshLocation:'Yenilə', heading:'Cihaz istiqaməti' },
  ru: { title:'Направление Киблы', subtitle:'Точное направление к Каабе', loading:'Определение местоположения...', error:'Местоположение не найдено', errorSub:'Разрешите доступ к местоположению', distance:'Расстояние до Каабы', bearing:'Угол Киблы', grant:'Разрешить', manual:'Использовать выбранный город', accuracy:'Точность', live:'Живой Компас', liveDesc:'Держите устройство ровно', noSensor:'Нет компас-сенсора', noSensorSub:'Только статическое направление', fromNorth:'По часовой стрелке от севера', enableCompass:'Включить компас', refreshLocation:'Обновить', heading:'Направление устройства' },
  ar: { title:'اتجاه القبلة', subtitle:'الاتجاه الدقيق نحو الكعبة', loading:'جارٍ تحديد الموقع...', error:'لم يُعثر على الموقع', errorSub:'يُرجى السماح بالوصول إلى الموقع', distance:'المسافة إلى الكعبة', bearing:'زاوية القبلة', grant:'السماح', manual:'استخدم المدينة المختارة', accuracy:'الدقة', live:'البوصلة الحية', liveDesc:'أمسك جهازك بشكل مستوٍ', noSensor:'لا يوجد حساس بوصلة', noSensorSub:'الاتجاه الثابت فقط', fromNorth:'باتجاه عقارب الساعة من الشمال', enableCompass:'تفعيل البوصلة', refreshLocation:'تحديث', heading:'اتجاه الجهاز' },
  tr: { title:'Kıble Yönü', subtitle:"Kabe'ye tam yön", loading:'Konum belirleniyor...', error:'Konum bulunamadı', errorSub:"Tarayıcıda konum iznine izin verin", distance:"Kabe'ye mesafe", bearing:'Kıble açısı', grant:'İzin ver', manual:'Seçili şehirle devam et', accuracy:'Doğruluk', live:'Canlı Pusula', liveDesc:'Cihazınızı düz tutun', noSensor:'Pusula sensörü yok', noSensorSub:'Sadece statik yön gösterilir', fromNorth:"Kuzeyden saat yönünde", enableCompass:'Pusulayı etkinleştir', refreshLocation:'Yenile', heading:'Cihaz yönü' },
  en: { title:'Qibla Direction', subtitle:'Precise direction to the Kaaba', loading:'Determining location...', error:'Location not found', errorSub:'Please allow location access in your browser', distance:'Distance to Kaaba', bearing:'Qibla bearing', grant:'Allow', manual:'Use the selected city', accuracy:'Accuracy', live:'Live Compass', liveDesc:'Hold your device flat', noSensor:'No compass sensor', noSensorSub:'Static direction only', fromNorth:'Clockwise from North', enableCompass:'Enable compass', refreshLocation:'Refresh', heading:'Device heading' },
}

export default function QiblaPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.en

  const [status, setStatus]       = useState('idle')
  const [coords, setCoords]       = useState(null)
  const [accuracy, setAccuracy]   = useState(null)
  const [qibla, setQibla]         = useState(null)
  const [distance, setDistance]   = useState(null)
  const [hasOrient, setHasOrient] = useState(false)
  const [needsIOSPermission, setNeedsIOSPermission] = useState(false)
  const [headingDisplay, setHeadingDisplay] = useState(null)

  // ── Ref-lər: sensor data üçün (re-render yox, birbaşa DOM) ──
  const rawHeadingRef  = useRef(null)   // sensordan gələn son dəyər
  const smoothRef      = useRef(null)   // hamarlanmış dəyər
  const qiblaRef       = useRef(null)   // qibla açısı
  const ringElRef      = useRef(null)   // DOM: kompas ring
  const needleElRef    = useRef(null)   // DOM: iynə wrapper
  const headingNumRef  = useRef(null)   // DOM: heading rəqəm göstəricisi
  const animIdRef      = useRef(null)   // rAF id
  const watchIdRef     = useRef(null)
  const orientOkRef    = useRef(false)

  // qibla state dəyişdikdə ref-i yenilə
  useEffect(() => { qiblaRef.current = qibla }, [qibla])

  // ── requestAnimationFrame loop — 60fps DOM yeniləmə ──
  useEffect(() => {
    const tick = () => {
      const raw = rawHeadingRef.current
      if (raw !== null) {
        // Low-pass filter
        if (smoothRef.current === null) {
          smoothRef.current = raw
        } else {
          let diff = raw - smoothRef.current
          if (diff > 180) diff -= 360
          if (diff < -180) diff += 360
          smoothRef.current = (smoothRef.current + diff * 0.15 + 360) % 360
        }

        const h = smoothRef.current
        const q = qiblaRef.current ?? 0

        // Birbaşa DOM yeniləmə — React re-render yox
        if (ringElRef.current) {
          ringElRef.current.style.transform = `rotate(${-h}deg)`
        }
        if (needleElRef.current) {
          needleElRef.current.style.transform = `rotate(${q - h}deg)`
        }
        if (headingNumRef.current) {
          headingNumRef.current.textContent = `${Math.round(h)}°`
        }
      }
      animIdRef.current = requestAnimationFrame(tick)
    }
    animIdRef.current = requestAnimationFrame(tick)
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current)
    }
  }, [])

  // ── Geolocation — watchPosition ──
  const startWatching = useCallback(() => {
    setStatus('loading')
    if (!navigator.geolocation) { setStatus('error'); return }
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude, accuracy: acc } = pos.coords
        setCoords({ lat: latitude, lon: longitude })
        setAccuracy(Math.round(acc))
        const q = calcQibla(latitude, longitude)
        setQibla(q)
        qiblaRef.current = q
        setDistance(calcDistance(latitude, longitude, KAABA.lat, KAABA.lon))
        setStatus('ready')
      },
      () => setStatus('error'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
  }, [])

  // Konum icazəsi yoxdursa — istifadəçinin namaz vaxtları üçün seçdiyi şəhər
  // (utils/prayerLocation; seçməyibsə standart şəhər)
  const [fallbackCity, setFallbackCity] = useState('')
  const pickCity = () => {
    const loc = getPrayerLocation()
    const lat = Number(loc.lat), lon = Number(loc.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    setCoords({ lat, lon })
    setAccuracy(null)
    setFallbackCity(loc.city?.[lang] || '')
    const q = calcQibla(lat, lon)
    setQibla(q)
    qiblaRef.current = q
    setDistance(calcDistance(lat, lon, KAABA.lat, KAABA.lon))
    setStatus('ready')
  }

  useEffect(() => {
    startWatching()
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [startWatching])

  // ── DeviceOrientation handler ──
  const onOrientation = useCallback((e) => {
    let alpha = null

    // iOS Safari
    if (typeof e.webkitCompassHeading === 'number') {
      alpha = e.webkitCompassHeading
    }
    // Android Chrome — deviceorientationabsolute event-i e.absolute = true verir
    // Amma bəzi cihazlarda e.absolute olmaya bilər, amma alpha hələ də düzgündür
    else if (typeof e.alpha === 'number') {
      alpha = (360 - e.alpha) % 360
    }

    if (alpha !== null && !isNaN(alpha) && isFinite(alpha)) {
      rawHeadingRef.current = alpha
      if (!orientOkRef.current) {
        orientOkRef.current = true
        setHasOrient(true)
        setHeadingDisplay(Math.round(alpha))
      }
      // Heading display-i hər 500ms-də yenilə (performans)
    }
  }, [])

  // Heading display-i periodik yeniləmə (info kartı üçün)
  useEffect(() => {
    const iv = setInterval(() => {
      if (smoothRef.current !== null) {
        setHeadingDisplay(Math.round(smoothRef.current))
      }
    }, 500)
    return () => clearInterval(iv)
  }, [])

  // ── Kompası başlat ──
  const startCompass = useCallback(() => {
    // Hər iki event-ə qoşul — deviceorientationabsolute daha dəqiqdir
    // amma bəzi cihazlarda yalnız deviceorientation var
    let absoluteSupported = false

    const absHandler = (e) => {
      absoluteSupported = true
      onOrientation(e)
    }
    const relHandler = (e) => {
      // Əgər absolute artıq işləyirsə, relative-i ignorə et
      if (!absoluteSupported) onOrientation(e)
    }

    window.addEventListener('deviceorientationabsolute', absHandler, true)
    window.addEventListener('deviceorientation', relHandler, true)

    return () => {
      window.removeEventListener('deviceorientationabsolute', absHandler, true)
      window.removeEventListener('deviceorientation', relHandler, true)
    }
  }, [onOrientation])

  useEffect(() => {
    // iOS 13+ icazə tələb edir. Düymə yalnız toxunma ekranlı cihazda
    // göstərilir — masaüstündə istiqamət sensoru yoxdur
    const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function' && coarse) {
      setNeedsIOSPermission(true)
    } else {
      const cleanup = startCompass()
      const timer = setTimeout(() => {
        if (!orientOkRef.current) setHasOrient(false)
      }, 3000)
      return () => { cleanup(); clearTimeout(timer) }
    }
  }, [startCompass])

  // iOS icazəsi
  const requestIOSCompass = async () => {
    try {
      const perm = await DeviceOrientationEvent.requestPermission()
      if (perm === 'granted') {
        setNeedsIOSPermission(false)
        startCompass()
      }
    } catch {
      setNeedsIOSPermission(false)
      setHasOrient(false)
    }
  }

  // Static fallback (sensor yoxdursa)
  const staticNeedleAngle = qibla ?? 0

  return (
    <div className="qibla-page">
      <div className="page-hero hero-compact theme-qibla">
        <Breadcrumb setPage={setPage} current={l.title} />
        <div className="page-hero-arabic">الْقِبْلَة</div>
        <h1>{l.title}</h1>
        <p>{l.subtitle}</p>
      </div>

      <div className="qibla-wrap">

        {status === 'loading' && (
          <div className="qibla-center">
            <div className="qibla-loader">
              <div className="qibla-loader-ring" />
              <span className="qibla-loader-icon">🕌</span>
            </div>
            <p className="qibla-status-text">{l.loading}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="qibla-center">
            <div className="qibla-error-icon" aria-hidden="true">📍</div>
            <h3>{l.error}</h3>
            <p>{l.errorSub}</p>
            <div className="qibla-error-btns">
              <button className="btn-primary" onClick={startWatching}>{l.grant}</button>
              <button className="btn-secondary" onClick={pickCity}>{l.manual}</button>
            </div>
          </div>
        )}

        {status === 'ready' && qibla !== null && (
          <div className="qibla-content">

            {needsIOSPermission && (
              <button className="btn-primary qibla-ios-btn" onClick={requestIOSCompass}>
                🧭 {l.enableCompass}
              </button>
            )}

            <div className="qibla-compass-wrap" data-reveal="scale">
              <div className="qibla-compass">

                {/* Ring — rAF ilə birbaşa fırladılır, sensor yoxdursa sabit */}
                <div className="qibla-ring" ref={ringElRef}>
                  {[...Array(72)].map((_, i) => (
                    <div key={i} className={`qibla-tick ${i % 9 === 0 ? 'major' : i % 3 === 0 ? 'minor' : ''}`}
                      style={{ '--i': i }} />
                  ))}
                  <div className="qibla-cardinals">
                    {(CARDINALS[lang] || CARDINALS.en).map((d, i) => (
                      <span key={i} className={`qibla-cardinal ${i === 0 ? 'north' : ''}`}
                        style={{ '--ci': i * 2 }}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* İynə — sensor varsa rAF fırladır, yoxdursa static açı */}
                <div className="qibla-needle-wrap" ref={needleElRef}
                  style={!hasOrient ? { transform: `rotate(${staticNeedleAngle}deg)` } : undefined}>
                  <div className="qibla-needle">
                    <div className="qibla-needle-tip">
                      <div className="qibla-kaaba-icon">🕋</div>
                    </div>
                    <div className="qibla-needle-tail" />
                  </div>
                </div>

                <div className="qibla-center-dot">
                  <div className="qibla-center-dot-inner" />
                </div>
              </div>

              <div className="qibla-angle-badge">
                <span className="qibla-angle-val">{Math.round(qibla)}°</span>
                <span className="qibla-angle-label">{l.fromNorth}</span>
              </div>
            </div>

            {/* Telefonda qruplu "inset" siyahı: ikon kafeli · ad · dəyər (sonda) */}
            <div className="qibla-info-grid m-list" data-reveal="stagger">
              <div className="qibla-info-card m-row">
                <div className="qibla-info-icon icon-tile icon-tile--blue" aria-hidden="true">📏</div>
                <div className="qibla-info-body">
                  <span className="qibla-info-label">{l.distance}</span>
                  <span className="qibla-info-val">
                    {distance != null ? formatKm(distance, lang) : ''} <small>{KM[lang] || KM.en}</small>
                  </span>
                </div>
              </div>

              {/* Qiblə açısı kompasın altındakı nişanda artıq göstərilir — ayrıca kart yoxdur */}

              {accuracy && (
                <div className="qibla-info-card m-row">
                  <div className="qibla-info-icon icon-tile icon-tile--rose" aria-hidden="true">🎯</div>
                  <div className="qibla-info-body">
                    <span className="qibla-info-label">{l.accuracy}</span>
                    <span className="qibla-info-val">±{accuracy} <small>m</small></span>
                  </div>
                </div>
              )}

              {hasOrient && (
                <div className="qibla-info-card m-row live">
                  <div className="qibla-info-icon icon-tile icon-tile--teal" aria-hidden="true">📡</div>
                  <div className="qibla-info-body">
                    <span className="qibla-info-label">{l.heading}</span>
                    <span className="qibla-info-val" ref={headingNumRef}>
                      {headingDisplay ?? 0}°
                    </span>
                  </div>
                </div>
              )}

              <div className={`qibla-info-card m-row is-status ${hasOrient ? 'live' : 'no-sensor'}`}>
                <div className={`qibla-info-icon icon-tile${hasOrient ? '' : ' icon-tile--orange'}`} aria-hidden="true">{hasOrient ? '✅' : '⚠️'}</div>
                <div className="qibla-info-body">
                  <span className="qibla-info-label">{hasOrient ? l.live : l.noSensor}</span>
                  <span className="qibla-info-val qibla-info-desc">
                    {hasOrient ? l.liveDesc : l.noSensorSub}
                  </span>
                </div>
              </div>
            </div>

            <div className="qibla-footer">
              <p className="qibla-coords">
                {/* Koordinatlar ərəbcədə də soldan sağa oxunsun */}
                <bdi dir="ltr">{coords?.lat.toFixed(4)}°N, {coords?.lon.toFixed(4)}°E</bdi>
                {!accuracy && fallbackCity && <span className="qibla-fallback-note"> ({fallbackCity})</span>}
              </p>
              <button type="button" className="qibla-refresh-btn press" onClick={startWatching}>
                ↻ {l.refreshLocation}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
