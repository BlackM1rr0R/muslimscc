import { useState, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/MosqueFinderPage.css'

// ── i18n Labels ──
const LABELS = {
  az: { title:'Yaxındakı Məscidlər', subtitle:'Ətrafınızdakı məscidləri tapın', loading:'Axtarılır...', error:'Məkan tapılmadı', noResults:'Yaxında məscid tapılmadı', openMaps:'Xəritədə aç', distance:'Məsafə', retry:'Yenidən axtar', found:'məscid tapıldı', searchRadius:'Axtarış radiusu: 10 km', name:'Ad', unknown:'Naməlum məscid' },
  en: { title:'Nearby Mosques', subtitle:'Find mosques around you', loading:'Searching...', error:'Location not found', noResults:'No mosques found nearby', openMaps:'Open in Maps', distance:'Distance', retry:'Search again', found:'mosques found', searchRadius:'Search radius: 10 km', name:'Name', unknown:'Unknown mosque' },
  ru: { title:'Ближайшие мечети', subtitle:'Найдите мечети рядом с вами', loading:'Поиск...', error:'Местоположение не найдено', noResults:'Мечетей поблизости не найдено', openMaps:'Открыть на карте', distance:'Расстояние', retry:'Искать снова', found:'мечетей найдено', searchRadius:'Радиус поиска: 5 км', name:'Название', unknown:'Неизвестная мечеть' },
  ar: { title:'المساجد القريبة', subtitle:'ابحث عن المساجد حولك', loading:'جارٍ البحث...', error:'لم يُعثر على الموقع', noResults:'لا مساجد قريبة', openMaps:'افتح في الخريطة', distance:'المسافة', retry:'ابحث مجدداً', found:'مساجد', searchRadius:'نطاق البحث: ٥ كم', name:'الاسم', unknown:'مسجد غير معروف' },
  tr: { title:'Yakındaki Camiler', subtitle:'Çevrenizdeki camileri bulun', loading:'Aranıyor...', error:'Konum bulunamadı', noResults:'Yakında cami bulunamadı', openMaps:'Haritada aç', distance:'Mesafe', retry:'Tekrar ara', found:'cami bulundu', searchRadius:'Arama yarıçapı: 10 km', name:'İsim', unknown:'Bilinmeyen cami' },
}

// ── Haversine distance (km) ──
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export default function MosqueFinderPage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az

  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [mosques, setMosques] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [userPos, setUserPos] = useState(null)

  const searchMosques = useCallback(async () => {
    setStatus('loading')
    setMosques([])
    setErrorMsg('')

    // Get user location
    let lat, lon
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      })
      lat = pos.coords.latitude
      lon = pos.coords.longitude
      setUserPos({ lat, lon })
    } catch {
      setStatus('error')
      setErrorMsg(t.error)
      return
    }

    // Fetch from Overpass API
    try {
      const query = `[out:json];node["amenity"="place_of_worship"]["religion"="muslim"](around:10000,${lat},${lon});out;`
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()

      const results = (data.elements || [])
        .map(el => ({
          id: el.id,
          name: el.tags?.name || el.tags?.['name:en'] || el.tags?.['name:ar'] || null,
          lat: el.lat,
          lon: el.lon,
          distance: haversine(lat, lon, el.lat, el.lon),
        }))
        .sort((a, b) => a.distance - b.distance)

      setMosques(results)
      setStatus('done')
    } catch {
      setStatus('error')
      setErrorMsg(t.error)
    }
  }, [t.error])

  return (
    <div className="mosque-finder-page">
      {/* Hero */}
      <div className="page-hero theme-mosques">
        <div className="breadcrumb">
          <button onClick={() => setPage('home')}>☰</button>
          <span>/</span>
          <span>{t.title}</span>
        </div>
        <div className="page-hero-arabic">وَأَنَّ الْمَسَاجِدَ لِلَّهِ</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="mosque-layout">
          {/* Search area */}
          <div className="mosque-search-area anim-fadeUp">
            <div className="mosque-search-icon">🕌</div>
            <p className="mosque-search-radius">{t.searchRadius}</p>
            <button className="btn-primary mosque-search-btn" onClick={searchMosques} disabled={status === 'loading'}>
              {status === 'loading' ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  {t.loading}
                </>
              ) : status === 'done' ? (
                <>{t.retry}</>
              ) : (
                <>📍 {t.title}</>
              )}
            </button>
          </div>

          {/* Loading */}
          {status === 'loading' && (
            <div className="spinner-wrap anim-fadeIn">
              <div className="spinner" />
              <span className="spinner-text">{t.loading}</span>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="mosque-error anim-scaleIn">
              <span className="mosque-error-icon">⚠️</span>
              <p>{errorMsg}</p>
              <button className="btn-secondary" onClick={searchMosques}>{t.retry}</button>
            </div>
          )}

          {/* Results */}
          {status === 'done' && (
            <div className="mosque-results anim-fadeUp">
              <div className="mosque-results-header">
                <span className="mosque-results-count">
                  {mosques.length} {t.found}
                </span>
              </div>

              {mosques.length === 0 ? (
                <div className="mosque-empty anim-fadeIn">
                  <span className="mosque-empty-icon">🔍</span>
                  <p>{t.noResults}</p>
                </div>
              ) : (
                <div className="mosque-list">
                  {mosques.map((mosque, i) => (
                    <div
                      key={mosque.id}
                      className="mosque-card card anim-fadeUp"
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <div className="mosque-card-icon">🕌</div>
                      <div className="mosque-card-info">
                        <h3 className="mosque-card-name">
                          {mosque.name || t.unknown}
                        </h3>
                        <span className="mosque-card-distance">
                          📏 {t.distance}: {formatDistance(mosque.distance)}
                        </span>
                      </div>
                      <a
                        className="btn-secondary mosque-maps-btn"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lon}${userPos ? `&origin=${userPos.lat},${userPos.lon}` : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        🗺 {t.openMaps}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
