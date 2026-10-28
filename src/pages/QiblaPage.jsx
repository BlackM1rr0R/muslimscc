import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import { getPrayerLocation } from '../utils/prayerLocation'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import CityPicker from '../components/CityPicker'
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

/** Koordinat: işarəyə görə Ş/C, Ş/Q yox — beynəlxalq N/S, E/W (əvvəl həmişə °N, °E yazılırdı,
 *  Nyu-York kimi qərb şəhərlərində "-74.0060°E" çıxırdı). */
function formatCoord(v, pos, neg) {
  return `${Math.abs(v).toFixed(4)}°${v < 0 ? neg : pos}`
}

// Hero giriş mətni və kompas paneli başlığı (5 dil)
const EXTRA = {
  az: { lead: 'Olduğunuz yerdən Kəbəyə dəqiq istiqamət və məsafə. Telefonda kompas cihazınızla birlikdə fırlanır.', compass: 'Kompas', details: 'Məlumat', coords: 'Koordinatlar', city: 'seçilmiş şəhər' },
  en: { lead: 'The exact direction and distance to the Kaaba from where you are. On a phone, the compass turns with your device.', compass: 'Compass', details: 'Details', coords: 'Coordinates', city: 'selected city' },
  ru: { lead: 'Точное направление и расстояние до Каабы от вашего места. На телефоне компас поворачивается вместе с устройством.', compass: 'Компас', details: 'Сведения', coords: 'Координаты', city: 'выбранный город' },
  ar: { lead: 'الاتجاه الدقيق والمسافة إلى الكعبة من مكانك. على الهاتف تدور البوصلة مع جهازك.', compass: 'البوصلة', details: 'التفاصيل', coords: 'الإحداثيات', city: 'المدينة المختارة' },
  tr: { lead: 'Bulunduğunuz yerden Kâbe’ye tam yön ve mesafe. Telefonda pusula cihazınızla birlikte döner.', compass: 'Pusula', details: 'Bilgiler', coords: 'Koordinatlar', city: 'seçili şehir' },
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
  az: { title:'Qiblə istiqaməti', subtitle:'Kəbəyə dəqiq istiqamət', loading:'Məkan təyin edilir...', error:'Məkan tapılmadı', errorSub:'Brauzerdə məkan icazəsi verin', distance:'Kəbəyə məsafə', bearing:'Qiblə bucağı', grant:'İcazə ver', manual:'Seçilmiş şəhərlə davam et', accuracy:'Dəqiqlik', live:'Canlı kompas', liveDesc:'Cihazınızı düz tutun', noSensor:'Kompas sensoru yoxdur', noSensorSub:'Yalnız statik istiqamət göstərilir', fromNorth:'Şimaldan saat istiqamətində', enableCompass:'Kompası aktivləşdir', refreshLocation:'Yenilə', heading:'Cihaz istiqaməti' },
  ru: { title:'Направление Киблы', subtitle:'Точное направление к Каабе', loading:'Определение местоположения...', error:'Местоположение не найдено', errorSub:'Разрешите доступ к местоположению', distance:'Расстояние до Каабы', bearing:'Угол Киблы', grant:'Разрешить', manual:'Использовать выбранный город', accuracy:'Точность', live:'Живой Компас', liveDesc:'Держите устройство ровно', noSensor:'Нет компас-сенсора', noSensorSub:'Только статическое направление', fromNorth:'По часовой стрелке от севера', enableCompass:'Включить компас', refreshLocation:'Обновить', heading:'Направление устройства' },
  ar: { title:'اتجاه القبلة', subtitle:'الاتجاه الدقيق نحو الكعبة', loading:'جارٍ تحديد الموقع...', error:'لم يُعثر على الموقع', errorSub:'يُرجى السماح بالوصول إلى الموقع', distance:'المسافة إلى الكعبة', bearing:'زاوية القبلة', grant:'السماح', manual:'استخدم المدينة المختارة', accuracy:'الدقة', live:'البوصلة الحية', liveDesc:'أمسك جهازك بشكل مستوٍ', noSensor:'لا يوجد حساس بوصلة', noSensorSub:'الاتجاه الثابت فقط', fromNorth:'باتجاه عقارب الساعة من الشمال', enableCompass:'تفعيل البوصلة', refreshLocation:'تحديث', heading:'اتجاه الجهاز' },
  tr: { title:'Kıble Yönü', subtitle:"Kabe'ye tam yön", loading:'Konum belirleniyor...', error:'Konum bulunamadı', errorSub:"Tarayıcıda konum iznine izin verin", distance:"Kabe'ye mesafe", bearing:'Kıble açısı', grant:'İzin ver', manual:'Seçili şehirle devam et', accuracy:'Doğruluk', live:'Canlı Pusula', liveDesc:'Cihazınızı düz tutun', noSensor:'Pusula sensörü yok', noSensorSub:'Sadece statik yön gösterilir', fromNorth:"Kuzeyden saat yönünde", enableCompass:'Pusulayı etkinleştir', refreshLocation:'Yenile', heading:'Cihaz yönü' },
  en: { title:'Qibla Direction', subtitle:'Precise direction to the Kaaba', loading:'Determining location...', error:'Location not found', errorSub:'Please allow location access in your browser', distance:'Distance to Kaaba', bearing:'Qibla bearing', grant:'Allow', manual:'Use the selected city', accuracy:'Accuracy', live:'Live Compass', liveDesc:'Hold your device flat', noSensor:'No compass sensor', noSensorSub:'Static direction only', fromNorth:'Clockwise from North', enableCompass:'Enable compass', refreshLocation:'Refresh', heading:'Device heading' },
}

export default function QiblaPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.en
  const x = EXTRA[lang] || EXTRA.en

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
      // Artıq yer tapılıbsa (və ya şəhər seçilibsə) sonrakı xəta ekranı silməsin
      () => setStatus(st => (st === 'ready' ? st : 'error')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
  }, [])

  // Konum icazəsi yoxdursa — istifadəçinin namaz vaxtları üçün seçdiyi şəhər
  // (utils/prayerLocation; seçməyibsə standart şəhər)
  const [fallbackCity, setFallbackCity] = useState('')
  const pickCity = () => {
    // Gözlənilən məkan sorğusu sonradan "xəta" ilə seçimi əvəz etməsin
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
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
      {/* v2: sakit kağız hero — iz, eyebrow, bir h1, giriş */}
      <header className="ui-page-hero qibla-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={l.title} />
          <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
          <h1 className="ui-display">{l.title}</h1>
          {/* Ərəbcə dekorativ başlıq ar dilində h1-i təkrarlamasın */}
          {lang !== 'ar' && <p className="qibla-hero-ar ui-arabic" lang="ar" aria-hidden="true">الْقِبْلَة</p>}
          <p className="ui-lead">{x.lead}</p>
        </div>
      </header>

      <div className="qibla-wrap">

        {(status === 'loading' || status === 'idle') && (
          <div className="qibla-center ui-card" role="status">
            <div className="qibla-loader" aria-hidden="true">
              <div className="qibla-loader-ring" />
              <span className="qibla-loader-icon"><Icon name="qibla" size={30} /></span>
            </div>
            <p className="qibla-status-text">{l.loading}</p>
            {/* Məkan gözləməsi uzana bilər — seçilmiş şəhərlə dərhal davam etmək olur */}
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={pickCity}>{l.manual}</button>
          </div>
        )}

        {status === 'error' && (
          <div className="qibla-center ui-card" role="alert">
            <span className="qibla-error-icon ui-icon-tile ui-icon-tile--lg ui-icon-tile--accent" aria-hidden="true"><Icon name="pin" /></span>
            <h2 className="qibla-center-title">{l.error}</h2>
            <p>{l.errorSub}</p>
            <div className="qibla-error-btns">
              <button type="button" className="ui-btn ui-btn--primary" onClick={startWatching}><Icon name="pin" className="ui-btn__icon" /> {l.grant}</button>
              <button type="button" className="ui-btn ui-btn--secondary" onClick={pickCity}>{l.manual}</button>
            </div>
            {/* Başqa şəhər seçmək olar — seçiləndə qiblə həmin şəhərdən hesablanır */}
            <div className="qibla-city-pick"><CityPicker onSelect={pickCity} /></div>
          </div>
        )}

        {status === 'ready' && qibla !== null && (
          <div className="qibla-content">

            <section className="qibla-compass-wrap ui-card" data-reveal="scale" aria-label={x.compass}>
              {needsIOSPermission && (
                <button type="button" className="ui-btn ui-btn--primary qibla-ios-btn" onClick={requestIOSCompass}>
                  <Icon name="compass" className="ui-btn__icon" /> {l.enableCompass}
                </button>
              )}
              <div className="qibla-compass" role="img" aria-label={`${l.bearing}: ${Math.round(qibla)}° — ${l.fromNorth}`}>

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
                {/* Sensor yoxdursa iynə şimaldan qiblə bucağına yumşaq fırlanır (.is-static, --q) */}
                <div className={`qibla-needle-wrap${!hasOrient ? ' is-static' : ''}`} ref={needleElRef}
                  style={!hasOrient ? { transform: `rotate(${staticNeedleAngle}deg)`, '--q': `${staticNeedleAngle}deg` } : undefined}>
                  <div className="qibla-needle">
                    <div className="qibla-needle-tip">
                      {/* Kəbə — kub ikonu (hajjguide); emoji 🕋 əvəzinə */}
                      <div className="qibla-kaaba-icon"><Icon name="hajjguide" size={18} /></div>
                    </div>
                    <div className="qibla-needle-tail" />
                  </div>
                </div>

                <div className="qibla-center-dot">
                  <div className="qibla-center-dot-inner" />
                </div>
              </div>

              <div className="qibla-angle-badge">
                <span className="qibla-angle-cap">{l.bearing}</span>
                <span className="qibla-angle-val ui-num"><span data-count={Math.round(qibla)}>{Math.round(qibla)}</span>°</span>
                <span className="qibla-angle-label">{l.fromNorth}</span>
              </div>
            </section>

            <div className="qibla-side">

            {/* Telefonda qruplu "inset" siyahı: ikon kafeli · ad · dəyər (sonda) */}
            <div className="qibla-info-grid" data-reveal="stagger">
              <div className="qibla-info-card ui-card">
                <div className="qibla-info-icon ui-icon-tile" aria-hidden="true"><Icon name="ruler" /></div>
                <div className="qibla-info-body">
                  <span className="qibla-info-label">{l.distance}</span>
                  <span className="qibla-info-val">
                    {distance != null ? formatKm(distance, lang) : ''} <small>{KM[lang] || KM.en}</small>
                  </span>
                </div>
              </div>

              {/* Qiblə açısı kompasın altındakı nişanda artıq göstərilir — ayrıca kart yoxdur */}

              {accuracy && (
                <div className="qibla-info-card ui-card">
                  <div className="qibla-info-icon ui-icon-tile" aria-hidden="true"><Icon name="target" /></div>
                  <div className="qibla-info-body">
                    <span className="qibla-info-label">{l.accuracy}</span>
                    <span className="qibla-info-val">±{accuracy} <small>m</small></span>
                  </div>
                </div>
              )}

              {hasOrient && (
                <div className="qibla-info-card ui-card live">
                  <div className="qibla-info-icon ui-icon-tile" aria-hidden="true"><Icon name="compass" /></div>
                  <div className="qibla-info-body">
                    <span className="qibla-info-label">{l.heading}</span>
                    <span className="qibla-info-val" ref={headingNumRef}>
                      {headingDisplay ?? 0}°
                    </span>
                  </div>
                </div>
              )}

              <div className={`qibla-info-card ui-card is-status ${hasOrient ? 'live' : 'no-sensor'}`}>
                <div className={`qibla-info-icon ui-icon-tile${hasOrient ? '' : ' ui-icon-tile--accent'}`} aria-hidden="true"><Icon name={hasOrient ? 'check' : 'info'} /></div>
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
                <span className="qibla-coords-cap">{x.coords}</span>
                {/* Koordinatlar ərəbcədə də soldan sağa oxunsun */}
                {coords && <bdi dir="ltr" className="ui-num">{formatCoord(coords.lat, 'N', 'S')}, {formatCoord(coords.lon, 'E', 'W')}</bdi>}
                {!accuracy && fallbackCity && <span className="qibla-fallback-note"><Icon name="pin" size={13} /> <CityPicker variant="inline" onSelect={pickCity} /> · {x.city}</span>}
              </p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm qibla-refresh-btn" onClick={startWatching}>
                <Icon name="refresh" className="ui-btn__icon" /> {l.refreshLocation}
              </button>
            </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
