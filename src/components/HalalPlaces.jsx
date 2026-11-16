// ═══════════════════════════════════════════════════════
// HalalPlaces — yaxınlıqdakı halal yeməkxana, kafe və qəssablar (/halal-check)
//
// • Mənbə: OpenStreetMap (Overpass) — "diet:halal" etiketi (yes / only / limited).
//   Bu etiketi yerin sahibi və ya OSM könüllüləri qoyur. Sayt özü HEÇ BİR yerə
//   "halal" demir: hər sətirdə etiketin dəyəri, OSM-də son yoxlama tarixi
//   (check_date…, varsa) və OSM obyektinə keçid göstərilir.
// • Məkan: cihazın yeri və ya namaz vaxtları üçün seçilmiş şəhər. Koordinatlar
//   yalnız Overpass-a gedir, serverimizdə saxlanmır.
// • Radius: 2 / 5 / 15 km. Mini xəritə — siz mərkəzdə, şimal yuxarıda.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { getPrayerLocation } from '../utils/prayerLocation'
import { overpass, haversine, formatDistance, elementPoint, osmUrl } from '../utils/osmQuery'
import { bearing } from './MosqueRadar'
import '../styles/HalalPlaces.css'

const RADII = [2, 5, 15]
const KINDS = ['restaurant', 'fast_food', 'cafe', 'food_court', 'butcher', 'supermarket', 'convenience', 'deli', 'bakery', 'confectionery']

const T = {
  az: {
    ey: 'Yaxınlıqda', title: 'Halal yeməkxanalar və qəssablar', lead: 'OpenStreetMap xəritəsində "halal" kimi işarələnmiş restoran, kafe və dükanlar — ən yaxından başlayaraq.', // lang-ok[kafe]: az-da işlənən alınma söz
    gps: 'Yerimə görə axtar', city: (c) => `${c} ətrafında`, radius: 'Radius', loading: 'Axtarılır…',
    found: (n) => `${n} yer tapıldı`, none: 'Bu radiusda "halal" işarəli yer yoxdur. Radiusu böyüdün — və ya bildiyiniz yeri OpenStreetMap-də özünüz işarələyin.',
    geo: 'Məkanınızı təyin etmək alınmadı — şəhərinizlə axtarın.', api: 'Xəritə xidməti cavab vermədi. Bir az sonra yenidən cəhd edin.', retry: 'Yenidən',
    only: 'Yalnız halal', yes: 'Halal seçim var', limited: 'Bəzi yeməklər halal', checked: (d) => `OSM-də yoxlanıb: ${d}`, noDate: 'OSM-də yoxlama tarixi yoxdur',
    route: 'Yol tarifi', osm: 'OSM-də bax', unknown: 'Adsız yer', you: 'Siz', north: 'Ş',
    kind: { restaurant: 'Restoran', fast_food: 'Fast food', cafe: 'Kafe', food_court: 'Yemək zalı', butcher: 'Qəssab', supermarket: 'Supermarket', convenience: 'Market', deli: 'Delikates', bakery: 'Çörəkxana', confectionery: 'Şirniyyat', other: 'Yer' }, // lang-ok[Kafe,Supermarket,Market,Delikates]: az-da işlənən alınma sözlər
    disc: 'Bu, sertifikat deyil: "halal" işarəsini yerin sahibi və ya OpenStreetMap könüllüləri qoyur, muslims.cc heç bir yeri yoxlamır və təsdiqləmir. Ət və kəsim barədə yerində soruşun, sertifikat varsa baxın.',
    src: 'Məlumat: © OpenStreetMap iştirakçıları (ODbL) — teq diet:halal', privacy: 'Koordinatlar yalnız OpenStreetMap axtarış xidmətinə (Overpass) göndərilir, serverimizdə saxlanmır.', // lang-ok[Overpass,diet]: xidmətin adı
  },
  en: {
    ey: 'Nearby', title: 'Halal restaurants and butchers', lead: 'Restaurants, cafés and shops tagged “halal” on OpenStreetMap — nearest first.',
    gps: 'Search near me', city: (c) => `Around ${c}`, radius: 'Radius', loading: 'Searching…',
    found: (n) => `${n} places found`, none: 'No places tagged “halal” within this radius. Widen it — or tag a place you know on OpenStreetMap yourself.',
    geo: 'Couldn’t determine your location — search by your city.', api: 'The map service didn’t respond. Try again in a moment.', retry: 'Retry',
    only: 'Halal only', yes: 'Halal options', limited: 'Some dishes halal', checked: (d) => `Checked on OSM: ${d}`, noDate: 'No check date on OSM',
    route: 'Directions', osm: 'View on OSM', unknown: 'Unnamed place', you: 'You', north: 'N',
    kind: { restaurant: 'Restaurant', fast_food: 'Fast food', cafe: 'Café', food_court: 'Food court', butcher: 'Butcher', supermarket: 'Supermarket', convenience: 'Shop', deli: 'Deli', bakery: 'Bakery', confectionery: 'Sweets', other: 'Place' },
    disc: 'This is not a certificate: the “halal” tag is added by the owner or OpenStreetMap volunteers; muslims.cc does not inspect or approve any place. Ask on site about meat and slaughter, and look for a certificate.',
    src: 'Data: © OpenStreetMap contributors (ODbL) — tag diet:halal', privacy: 'Coordinates are only sent to OpenStreetMap’s search service (Overpass), not stored on our server.',
  },
  ru: {
    ey: 'Рядом', title: 'Халяль-рестораны и мясные лавки', lead: 'Рестораны, кафе и магазины с отметкой «халяль» в OpenStreetMap — сначала ближайшие.',
    gps: 'Искать рядом со мной', city: (c) => `Рядом: ${c}`, radius: 'Радиус', loading: 'Поиск…',
    found: (n) => `Найдено мест: ${n}`, none: 'В этом радиусе нет мест с отметкой «халяль». Увеличьте радиус — или отметьте знакомое место в OpenStreetMap сами.',
    geo: 'Не удалось определить местоположение — ищите по городу.', api: 'Картографический сервис не ответил. Попробуйте чуть позже.', retry: 'Повторить',
    only: 'Только халяль', yes: 'Есть халяль', limited: 'Некоторые блюда халяль', checked: (d) => `Проверено в OSM: ${d}`, noDate: 'Нет даты проверки в OSM', // lang-ok[OSM]: xidmətin qısa adı
    route: 'Маршрут', osm: 'Открыть в OSM', unknown: 'Без названия', you: 'Вы', north: 'С', // lang-ok[OSM]: xidmətin qısa adı
    kind: { restaurant: 'Ресторан', fast_food: 'Фастфуд', cafe: 'Кафе', food_court: 'Фуд-корт', butcher: 'Мясная лавка', supermarket: 'Супермаркет', convenience: 'Магазин', deli: 'Деликатесы', bakery: 'Пекарня', confectionery: 'Сладости', other: 'Место' },
    disc: 'Это не сертификат: отметку «халяль» ставит владелец или волонтёры OpenStreetMap; muslims.cc не проверяет и не одобряет заведения. Спросите на месте о мясе и забое, посмотрите сертификат.',
    src: 'Данные: © участники OpenStreetMap (ODbL) — тег diet:halal', privacy: 'Координаты отправляются только в поисковый сервис OpenStreetMap (Overpass) и не хранятся на нашем сервере.', // lang-ok[ODbL,diet,halal,Overpass]: lisenziya, OSM teqi və xidmət adı
  },
  tr: {
    ey: 'Yakında', title: 'Helal restoranlar ve kasaplar', lead: 'OpenStreetMap’te “helal” olarak işaretlenmiş restoran, kafe ve dükkânlar — en yakından başlayarak.',
    gps: 'Konumuma göre ara', city: (c) => `${c} çevresinde`, radius: 'Yarıçap', loading: 'Aranıyor…',
    found: (n) => `${n} yer bulundu`, none: 'Bu yarıçapta “helal” işaretli yer yok. Yarıçapı büyütün — ya da bildiğiniz yeri OpenStreetMap’te kendiniz işaretleyin.',
    geo: 'Konumunuz belirlenemedi — şehrinizle arayın.', api: 'Harita hizmeti yanıt vermedi. Biraz sonra tekrar deneyin.', retry: 'Tekrar',
    only: 'Yalnız helal', yes: 'Helal seçenek var', limited: 'Bazı yemekler helal', checked: (d) => `OSM’de kontrol: ${d}`, noDate: 'OSM’de kontrol tarihi yok',
    route: 'Yol tarifi', osm: 'OSM’de gör', unknown: 'İsimsiz yer', you: 'Siz', north: 'K',
    kind: { restaurant: 'Restoran', fast_food: 'Fast food', cafe: 'Kafe', food_court: 'Yemek alanı', butcher: 'Kasap', supermarket: 'Süpermarket', convenience: 'Market', deli: 'Şarküteri', bakery: 'Fırın', confectionery: 'Tatlıcı', other: 'Yer' },
    disc: 'Bu bir sertifika değildir: “helal” işaretini işletme sahibi veya OpenStreetMap gönüllüleri koyar; muslims.cc hiçbir yeri denetlemez ve onaylamaz. Et ve kesim hakkında yerinde sorun, sertifika varsa bakın.',
    src: 'Veri: © OpenStreetMap katkıcıları (ODbL) — etiket diet:halal', privacy: 'Koordinatlar yalnızca OpenStreetMap arama hizmetine (Overpass) gönderilir, sunucumuzda saklanmaz.',
  },
  ar: {
    ey: 'بالقرب منك', title: 'مطاعم حلال وملاحم', lead: 'مطاعم ومقاهٍ ومتاجر موسومة بـ«حلال» على خريطة OpenStreetMap — الأقرب أولًا.',
    gps: 'ابحث قربي', city: (c) => `حول ${c}`, radius: 'النطاق', loading: 'جارٍ البحث…',
    found: (n) => `${n} مكانًا`, none: 'لا أماكن موسومة بـ«حلال» ضمن هذا النطاق. وسّع النطاق — أو ضع الوسم بنفسك لمكان تعرفه على OpenStreetMap.',
    geo: 'تعذّر تحديد موقعك — ابحث بمدينتك.', api: 'لم تستجب خدمة الخرائط. حاول بعد قليل.', retry: 'أعد المحاولة',
    only: 'حلال فقط', yes: 'خيارات حلال', limited: 'بعض الأطباق حلال', checked: (d) => `تُحقّق منه في OSM: ${d}`, noDate: 'لا تاريخ تحقق في OSM', // lang-ok[OSM]: xidmətin qısa adı
    route: 'الاتجاهات', osm: 'اعرض في OSM', unknown: 'مكان بلا اسم', you: 'أنت', north: 'ش', // lang-ok[OSM]: xidmətin qısa adı
    kind: { restaurant: 'مطعم', fast_food: 'وجبات سريعة', cafe: 'مقهى', food_court: 'ساحة طعام', butcher: 'ملحمة', supermarket: 'سوبرماركت', convenience: 'بقالة', deli: 'أطعمة جاهزة', bakery: 'مخبز', confectionery: 'حلويات', other: 'مكان' },
    disc: 'هذه ليست شهادة: وسم «حلال» يضعه صاحب المكان أو متطوعو OpenStreetMap، وموقع muslims.cc لا يفحص أي مكان ولا يعتمده. اسأل في المكان عن اللحم والذبح، وانظر الشهادة إن وُجدت.',
    src: 'البيانات: © مساهمو OpenStreetMap (ODbL) — الوسم diet:halal', privacy: 'تُرسل الإحداثيات إلى خدمة البحث في OpenStreetMap (Overpass) فقط، ولا تُحفظ على خادمنا.', // lang-ok[ODbL,diet,halal,Overpass]: lisenziya, OSM teqi və xidmət adı
  },
}

/** OSM elementi → sətir (koordinatsız və ya halal dəyəri tanınmayan — null) */
export function toPlace(el, origin, lang = 'az') {
  const tags = el.tags || {}
  const halal = String(tags['diet:halal'] || '').toLowerCase()
  if (!['yes', 'only', 'limited'].includes(halal)) return null
  const { lat, lon } = elementPoint(el)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const kind = KINDS.find((k) => tags.amenity === k || tags.shop === k) || 'other'
  const checked = tags['check_date:diet:halal'] || tags.check_date || tags.survey_date || tags['survey:date'] || ''
  const addr = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ')
  return {
    id: `${String(el.type || 'n')[0]}${el.id}`,
    name: tags[`name:${lang}`] || tags.name || tags['name:en'] || tags['name:ar'] || '',
    kind, halal, checked: /^\d{4}(-\d{2}){0,2}$/.test(checked) ? checked : '', addr,
    lat, lon, km: haversine(origin.lat, origin.lon, lat, lon), osm: osmUrl(el),
  }
}

export function halalQuery(lat, lon, km) {
  const r = Math.round(km * 1000)
  return `[out:json][timeout:25];nwr["diet:halal"~"^(yes|only|limited)$"](around:${r},${lat},${lon});out center tags 200;`
}

function MiniMap({ origin, places, km, sel, onSel, t }) {
  const pt = (p) => {
    const rr = Math.min(1, p.km / km) * 88
    const a = (bearing(origin, p) - 90) * Math.PI / 180
    return [rr * Math.cos(a), rr * Math.sin(a)]
  }
  return (
    <svg className="hp-map" viewBox="-100 -100 200 200" role="img" aria-label={t.title}>
      {[1, 0.5].map((f) => <circle key={f} r={88 * f} className="hp-map__ring" />)}
      <text className="hp-map__n" x="0" y="-91" textAnchor="middle">{t.north}</text>
      <text className="hp-map__rl" x="3" y={-88 * 0.5 - 2}>{km / 2} km</text>
      {places.map((p, i) => {
        const [x, y] = pt(p)
        return (
          <g key={p.id} className={`hp-map__dot hp-k-${p.halal}${sel === p.id ? ' is-sel' : ''}`} style={{ '--i': i }}
            onClick={() => onSel(p.id)} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            <circle r="9" fill="transparent" />
            <circle r={sel === p.id ? 5 : 3.6} />
          </g>
        )
      })}
      <circle r="4.5" className="hp-map__you"><title>{t.you}</title></circle>
    </svg>
  )
}

export default function HalalPlaces() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const cityLoc = getPrayerLocation()
  const cityName = cityLoc.city?.[lang] || cityLoc.city?.en || ''
  const [km, setKm] = useState(5)
  const [st, setSt] = useState({ status: 'idle', places: [], origin: null, err: '', mode: 'gps' })
  const [sel, setSel] = useState(null)
  const abortRef = useRef(null)
  const listRef = useRef(null)

  const search = useCallback(async (mode, radius) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setSel(null)
    setSt((s) => ({ ...s, status: 'loading', err: '', mode }))
    let origin
    if (mode === 'city') origin = { lat: Number(cityLoc.lat), lon: Number(cityLoc.lng) }
    else {
      try {
        const pos = await new Promise((ok, fail) => {
          if (!navigator.geolocation) { fail(new Error('geo')); return }
          navigator.geolocation.getCurrentPosition(ok, fail, { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 })
        })
        origin = { lat: pos.coords.latitude, lon: pos.coords.longitude }
      } catch {
        if (!ctrl.signal.aborted) setSt((s) => ({ ...s, status: 'error', err: 'geo' }))
        return
      }
    }
    try {
      const data = await overpass(halalQuery(origin.lat, origin.lon, radius), { signal: ctrl.signal })
      if (ctrl.signal.aborted) return
      const seen = new Set()
      const places = (data.elements || []).map((el) => toPlace(el, origin, lang)).filter(Boolean)
        .filter((p) => p.km <= radius * 1.05 && !seen.has(p.id) && seen.add(p.id))
        .sort((a, b) => a.km - b.km)
      setSt({ status: 'done', places, origin, err: '', mode })
    } catch {
      if (!ctrl.signal.aborted) setSt((s) => ({ ...s, status: 'error', err: 'api' }))
    }
  }, [cityLoc.lat, cityLoc.lng, lang])

  useEffect(() => () => abortRef.current?.abort(), [])

  const pickRadius = (r) => { setKm(r); if (st.status === 'done' || st.status === 'error') search(st.mode, r) }
  const selectDot = (id) => {
    setSel(id)
    listRef.current?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
  const loading = st.status === 'loading'

  return (
    <section id="hc-places" className="ui-section ui-section--tight hc-block hp" aria-labelledby="hp-h" data-testid="halal-places">
      <div className="ui-container hc-layout">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="hp-h" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="hp-lead">{t.lead}</p>

        <div className="hp-bar">
          <button type="button" className="ui-btn ui-btn--primary" onClick={() => search('gps', km)} disabled={loading}>
            <Icon name="pin" className="ui-btn__icon" /> {t.gps}
          </button>
          {cityName && (
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => search('city', km)} disabled={loading}>
              <Icon name="globe" className="ui-btn__icon" /> {t.city(cityName)}
            </button>
          )}
          <div className="hp-radius" role="group" aria-label={t.radius}>
            {RADII.map((r) => (
              <button key={r} type="button" className={`ui-chip${km === r ? ' is-active' : ''}`} aria-pressed={km === r} onClick={() => pickRadius(r)}>{r} km</button>
            ))}
          </div>
        </div>
        <p className="hp-privacy"><Icon name="shield" size={14} /> {t.privacy}</p>

        <aside className="ui-callout ui-callout--warn hp-disc" role="note"><Icon name="info" /><p>{t.disc}</p></aside>

        <div aria-live="polite">
          {loading && <p className="hp-status" role="status"><span className="hp-spin" aria-hidden="true" /> {t.loading}</p>}
          {st.status === 'error' && (
            <div className="hp-status hp-status--err" role="alert">
              <p>{st.err === 'geo' ? t.geo : t.api}</p>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => search(st.err === 'geo' && cityName ? 'city' : st.mode, km)}>{st.err === 'geo' && cityName ? t.city(cityName) : t.retry}</button>
            </div>
          )}
          {st.status === 'done' && (st.places.length === 0
            ? <p className="hp-status">{t.none}</p>
            : <p className="hp-count">{t.found(st.places.length)}</p>)}
        </div>

        {st.status === 'done' && st.places.length > 0 && (
          <div className="hp-body">
            <MiniMap origin={st.origin} places={st.places} km={km} sel={sel} onSel={selectDot} t={t} />
            <ul className="hp-list" ref={listRef}>
              {st.places.map((p) => (
                <li key={p.id} data-id={p.id} className={`hp-row ui-card${sel === p.id ? ' is-sel' : ''}`} onMouseEnter={() => setSel(p.id)}>
                  <div className="hp-row__top">
                    <strong className="hp-row__name" dir="auto">{p.name || t.unknown}</strong>
                    <span className="hp-row__km">{formatDistance(p.km)}</span>
                  </div>
                  <div className="hp-row__tags">
                    <span className="hp-kind">{t.kind[p.kind]}</span>
                    <span className={`hp-halal hp-k-${p.halal}`}>{t[p.halal]}</span>
                    {p.addr && <span className="hp-addr" dir="auto">{p.addr}</span>}
                  </div>
                  <p className="hp-row__date">{p.checked ? t.checked(p.checked) : t.noDate}</p>
                  <div className="hp-row__links">
                    <a className="ui-btn ui-btn--ghost ui-btn--sm" target="_blank" rel="noopener noreferrer"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`}><Icon name="compass" className="ui-btn__icon" /> {t.route}</a>
                    <a className="ui-btn ui-btn--ghost ui-btn--sm" target="_blank" rel="noopener noreferrer" href={p.osm}><Icon name="external" className="ui-btn__icon" /> {t.osm}</a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="hp-src">{t.src}</p>
      </div>
    </section>
  )
}
