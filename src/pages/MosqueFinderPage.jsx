import { useState, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import { getPrayerLocation } from '../utils/prayerLocation'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import '../styles/MosqueFinderPage.css'
import Breadcrumb from '../components/Breadcrumb'

// ── i18n Labels ──
const LABELS = {
  az: { title:'Yaxındakı məscidlər', subtitle:'Ətrafınızdakı məscidləri tapın', loading:'Axtarılır...', error:'Məkan tapılmadı', noResults:'Yaxında məscid tapılmadı', openMaps:'Xəritədə aç', distance:'Məsafə', retry:'Yenidən axtar', found:'məscid tapıldı', searchRadius:'Axtarış radiusu: 10 km', name:'Ad', unknown:'Naməlum məscid', hint:'Məkan icazəsi verin — yaxınlıqdakı məscidlər OpenStreetMap-dən tapılır', fromYou:'sizdən' },
  en: { title:'Nearby Mosques', subtitle:'Find mosques around you', loading:'Searching...', error:'Location not found', noResults:'No mosques found nearby', openMaps:'Open in Maps', distance:'Distance', retry:'Search again', found:'mosques found', searchRadius:'Search radius: 10 km', name:'Name', unknown:'Unknown mosque', hint:'Allow location access — nearby mosques are found via OpenStreetMap', fromYou:'from you' },
  ru: { title:'Ближайшие мечети', subtitle:'Найдите мечети рядом с вами', loading:'Поиск...', error:'Местоположение не найдено', noResults:'Мечетей поблизости не найдено', openMaps:'Открыть на карте', distance:'Расстояние', retry:'Искать снова', found:'мечетей найдено', searchRadius:'Радиус поиска: 10 км', name:'Название', unknown:'Неизвестная мечеть', hint:'Разрешите доступ к геолокации — ближайшие мечети ищутся через OpenStreetMap', fromYou:'от вас' },
  ar: { title:'المساجد القريبة', subtitle:'ابحث عن المساجد حولك', loading:'جارٍ البحث...', error:'لم يُعثر على الموقع', noResults:'لا مساجد قريبة', openMaps:'افتح في الخريطة', distance:'المسافة', retry:'ابحث مجدداً', found:'مساجد', searchRadius:'نطاق البحث: ١٠ كم', name:'الاسم', unknown:'مسجد غير معروف', hint:'اسمح بالوصول إلى موقعك — يتم البحث عن المساجد القريبة عبر OpenStreetMap', fromYou:'منك' },
  tr: { title:'Yakındaki Camiler', subtitle:'Çevrenizdeki camileri bulun', loading:'Aranıyor...', error:'Konum bulunamadı', noResults:'Yakında cami bulunamadı', openMaps:'Haritada aç', distance:'Mesafe', retry:'Tekrar ara', found:'cami bulundu', searchRadius:'Arama yarıçapı: 10 km', name:'İsim', unknown:'Bilinmeyen cami', hint:'Konum izni verin — yakındaki camiler OpenStreetMap üzerinden bulunur', fromYou:'sizden' },
}

// Əlavə mətnlər (5 dil): giriş, xəta növləri, şəhərlə axtarış
const EXTRA = {
  az: { lead: 'Olduğunuz yerin 10 km radiusunda məscidlər — ən yaxından başlayaraq. Sətrə toxunun, yol tarifi xəritədə açılsın.', geoError: 'Məkanınızı təyin etmək alınmadı', geoSub: 'Brauzerdə məkan icazəsi verin və ya namaz vaxtları üçün seçdiyiniz şəhər ətrafında axtarın.', apiError: 'Məscidlərin siyahısını yükləmək alınmadı', apiSub: 'İnternet bağlantısını yoxlayıb yenidən cəhd edin.', useCity: (c) => `${c} ətrafında axtar`, around: (c) => `${c} mərkəzindən`, source: 'Məlumat: OpenStreetMap iştirakçıları' },
  en: { lead: 'Mosques within 10 km of where you are — nearest first. Tap a row to open directions in Maps.', geoError: 'Couldn’t determine your location', geoSub: 'Allow location access in your browser, or search around the city you chose for prayer times.', apiError: 'Couldn’t load the list of mosques', apiSub: 'Check your internet connection and try again.', useCity: (c) => `Search around ${c}`, around: (c) => `from central ${c}`, source: 'Data: OpenStreetMap contributors' },
  ru: { lead: 'Мечети в радиусе 10 км от вас — сначала ближайшие. Нажмите на строку, чтобы открыть маршрут на карте.', geoError: 'Не удалось определить ваше местоположение', geoSub: 'Разрешите доступ к геолокации в браузере или ищите рядом с городом, выбранным для времени намаза.', apiError: 'Не удалось загрузить список мечетей', apiSub: 'Проверьте подключение к интернету и попробуйте снова.', useCity: (c) => `Искать рядом: ${c}`, around: (c) => `от центра: ${c}`, source: 'Данные: участники OpenStreetMap' },
  ar: { lead: 'المساجد ضمن ١٠ كم من مكانك — الأقرب أولًا. اضغط على السطر لفتح الاتجاهات في الخريطة.', geoError: 'تعذّر تحديد موقعك', geoSub: 'اسمح بالوصول إلى الموقع في المتصفح، أو ابحث حول المدينة التي اخترتها لمواقيت الصلاة.', apiError: 'تعذّر تحميل قائمة المساجد', apiSub: 'تحقّق من الاتصال بالإنترنت وحاول مرة أخرى.', useCity: (c) => `ابحث حول ${c}`, around: (c) => `من وسط ${c}`, source: 'البيانات: مساهمو OpenStreetMap' },
  tr: { lead: 'Bulunduğunuz yerin 10 km çevresindeki camiler — en yakından başlayarak. Yol tarifi için satıra dokunun.', geoError: 'Konumunuz belirlenemedi', geoSub: 'Tarayıcıda konum izni verin veya namaz vakitleri için seçtiğiniz şehrin çevresinde arayın.', apiError: 'Cami listesi yüklenemedi', apiSub: 'İnternet bağlantınızı kontrol edip tekrar deneyin.', useCity: (c) => `${c} çevresinde ara`, around: (c) => `${c} merkezinden`, source: 'Veri: OpenStreetMap katkıcıları' },
}

// Overpass serverləri: əsas server cavab verməsə (yüklənmə, 406/429) ehtiyat güzgü
const OVERPASS_URLS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
const OVERPASS_TIMEOUT_MS = 15000

/** Sorğunu növbə ilə serverlərə göndər; ilk uğurlu JSON cavabı qaytar. */
async function overpass(query) {
  let lastErr = null
  for (const url of OVERPASS_URLS) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), OVERPASS_TIMEOUT_MS)
    try {
      const res = await fetch(`${url}?data=${encodeURIComponent(query)}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      lastErr = e
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastErr || new Error('overpass')
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
  const x = EXTRA[lang] || EXTRA.en
  // Namaz vaxtları üçün seçilmiş şəhər — məkan icazəsi olmayanda ehtiyat
  const cityLoc = getPrayerLocation()
  const cityName = cityLoc.city?.[lang] || cityLoc.city?.en || ''

  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [mosques, setMosques] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [userPos, setUserPos] = useState(null)
  // Axtarış hansı nöqtədən: 'gps' — cihazın yeri, 'city' — seçilmiş şəhər
  const [origin, setOrigin] = useState('gps')

  // errorMsg: 'geo' (məkan yoxdur) | 'api' (Overpass cavab vermədi)
  const searchMosques = useCallback(async (useCity = false) => {
    setStatus('loading')
    setMosques([])
    setErrorMsg('')
    setOrigin(useCity ? 'city' : 'gps')

    let lat, lon
    if (useCity) {
      lat = Number(cityLoc.lat)
      lon = Number(cityLoc.lng)
      setUserPos(null)
    } else {
      try {
        const pos = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) { reject(new Error('no geolocation')); return }
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
        setErrorMsg('geo')
        return
      }
    }

    // Overpass: nöqtə (node) ilə yanaşı bina/ərazi kimi çəkilmiş məscidlər də
    // (way/relation — "out center" mərkəz koordinatını verir). Əvvəl yalnız
    // node soruşulurdu və bir çox məscid siyahıya düşmürdü.
    try {
      const query = `[out:json][timeout:25];nwr["amenity"="place_of_worship"]["religion"="muslim"](around:10000,${lat},${lon});out center;`
      const data = await overpass(query)

      const results = (data.elements || [])
        .map(el => {
          const pLat = el.lat ?? el.center?.lat
          const pLon = el.lon ?? el.center?.lon
          return {
            id: `${el.type || 'n'}${el.id}`,
            name: el.tags?.[`name:${lang}`] || el.tags?.name || el.tags?.['name:en'] || el.tags?.['name:ar'] || null,
            lat: pLat,
            lon: pLon,
            distance: Number.isFinite(pLat) && Number.isFinite(pLon) ? haversine(lat, lon, pLat, pLon) : NaN,
          }
        })
        .filter(m => Number.isFinite(m.distance))
        .sort((a, b) => a.distance - b.distance)

      setMosques(results)
      setStatus('done')
    } catch {
      setStatus('error')
      setErrorMsg('api')
    }
    // cityLoc hər renderdə yenidən oxunur; koordinatı dəyişəndə funksiya da yenilənir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, cityLoc.lat, cityLoc.lng])

  return (
    <div className="mosque-finder-page">
      {/* v2: sakit kağız hero — iz, eyebrow, bir h1, giriş */}
      <header className="ui-page-hero mosque-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('hajj', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {/* Ərəbcə dekorativ başlıq ar dilində h1-i təkrarlamasın */}
          {lang !== 'ar' && <p className="mosque-hero-ar ui-arabic" lang="ar" aria-hidden="true">الْمَسَاجِد</p>}
          <p className="ui-lead">{x.lead}</p>
        </div>
      </header>

      <section className="ui-section mosque-page">
        <div className="ui-container mosque-layout">
          {/* Axtarış kartı: radar ikonu, radius, izah, əsas düymə + şəhərlə axtarış */}
          <div className={`mosque-search-area ui-card${status === 'loading' ? ' is-searching' : ''}`} data-reveal="scale">
            <div className="mosque-search-icon" aria-hidden="true">
              <span className="mosque-radar" />
              <Icon name="mosques" size={30} />
            </div>
            <p className="mosque-search-radius ui-badge ui-badge--brand"><Icon name="target" size={13} /> {t.searchRadius}</p>
            <p className="mosque-search-hint">{t.hint}</p>
            <div className="mosque-search-btns">
              <button type="button" className="ui-btn ui-btn--primary ui-btn--lg mosque-search-btn" onClick={() => searchMosques(false)} disabled={status === 'loading'}>
                {status === 'loading' ? (
                  <>
                    <span className="mosque-btn-spin" aria-hidden="true" />
                    {t.loading}
                  </>
                ) : status === 'done' ? (
                  <><Icon name="refresh" className="ui-btn__icon" /> {t.retry}</>
                ) : (
                  <><Icon name="pin" className="ui-btn__icon" /> {t.title}</>
                )}
              </button>
              {cityName && status !== 'loading' && (
                <button type="button" className="ui-btn ui-btn--ghost mosque-city-btn" onClick={() => searchMosques(true)}>
                  <Icon name="globe" className="ui-btn__icon" /> {x.useCity(cityName)}
                </button>
              )}
            </div>
          </div>

          {/* Loading — fırlanan dairə yerinə siyahı formasında parıltılı yer tutucular */}
          {status === 'loading' && (
            <div className="mosque-loading anim-fadeIn" role="status">
              <span className="mosque-sr">{t.loading}</span>
              <ul className="mosque-skeleton ui-card ui-card--flush" aria-hidden="true">
                {[0, 1, 2, 3].map(i => (
                  <li key={i} className="mosque-skel-row">
                    <span className="skeleton mosque-skeleton-icon" />
                    <span className="mosque-skel-body">
                      <span className="skeleton skeleton--text" style={{ width: `${64 - i * 8}%` }} />
                      <span className="skeleton skeleton--text" style={{ width: '32%' }} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="mosque-error ui-card" role="alert">
              <span className="mosque-error-icon ui-icon-tile ui-icon-tile--lg ui-icon-tile--accent" aria-hidden="true"><Icon name={errorMsg === 'geo' ? 'pin' : 'alert'} /></span>
              <p className="mosque-error-title">{errorMsg === 'geo' ? x.geoError : x.apiError}</p>
              <p className="mosque-error-sub">{errorMsg === 'geo' ? x.geoSub : x.apiSub}</p>
              <div className="mosque-error-btns">
                <button type="button" className="ui-btn ui-btn--secondary" onClick={() => searchMosques(origin === 'city')}><Icon name="refresh" className="ui-btn__icon" /> {t.retry}</button>
                {errorMsg === 'geo' && cityName && (
                  <button type="button" className="ui-btn ui-btn--primary" onClick={() => searchMosques(true)}><Icon name="globe" className="ui-btn__icon" /> {x.useCity(cityName)}</button>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {status === 'done' && (
            <div className="mosque-results anim-fadeUp">
              <div className="mosque-results-header">
                <span className="mosque-results-count ui-badge ui-badge--brand">
                  <span className="ui-num">{mosques.length}</span> {t.found}
                </span>
                {origin === 'city' && (
                  <span className="mosque-results-from"><Icon name="globe" size={14} /> {x.around(cityName)}</span>
                )}
              </div>

              {mosques.length === 0 ? (
                <div className="mosque-empty ui-card">
                  <span className="mosque-empty-icon ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral" aria-hidden="true"><Icon name="search" /></span>
                  <p>{t.noResults}</p>
                  {origin === 'gps' && cityName && (
                    <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => searchMosques(true)}>{x.useCity(cityName)}</button>
                  )}
                </div>
              ) : (
                // Bütün sətir xəritə keçididir: telefonda qruplaşdırılmış siyahı
                // xanası (.m-list/.m-row, sonda › oxu), genişdə əvvəlki kimi ayrı
                // kartlar və sağda "Xəritədə aç" düyməsi (MosqueFinderPage.css)
                <ul className="mosque-list ui-card ui-card--flush" data-reveal="stagger">
                  {mosques.map((place) => (
                    <li key={place.id}>
                      <a
                        className="mosque-row"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}${userPos ? `&origin=${userPos.lat},${userPos.lon}` : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="mosque-card-icon ui-icon-tile" aria-hidden="true"><Icon name="holyplaces" /></span>
                        <div className="mosque-card-info">
                          <h3 className="mosque-card-name">
                            {place.name || t.unknown}
                          </h3>
                          <span className="mosque-card-distance">
                            <Icon name="ruler" size={14} /> {t.distance}: <bdi className="ui-num">{formatDistance(place.distance)}</bdi>
                          </span>
                        </div>
                        <span className="mosque-maps-btn">{t.openMaps} <Icon name="external" size={15} /></span>
                        <Icon name="chevron" size={18} className="mosque-row-chev ui-flip-rtl" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mosque-source">{x.source}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
