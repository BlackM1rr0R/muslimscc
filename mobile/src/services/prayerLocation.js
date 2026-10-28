// ═══════════════════════════════════════════════════════
// Namaz vaxtlarının YERİ — istifadəçinin seçdiyi şəhər (bütün tətbiqdə ortaq)
// (mobil; veb src/utils/prayerLocation.js ilə eyni şəhər siyahısı və qayda)
//
// Seçim BİR yerdə saxlanılır — Namaz ekranında şəhər dəyişəndə ana səhifənin
// namaz kartı, "Camaat və Cümə namazı" ekranı və namaz bildirişləri də
// həmin şəhərə keçir.
//
// Saxlama: AsyncStorage 'muslim_cc_selected_city' = şəhərin id-si ('Baku').
// Köhnə dəyərlər də oxunur: Bildirişlər ayarlarındakı aladhan adları
// ('Makkah', 'Madinah' və s.).
// Seçim yoxdursa: admin paneldəki standart şəhər (Settings → defaultCity),
// o da yoxdursa DEFAULT_PRAYER_LOCATION (config/brand.js).
//
// API:
//   PRAYER_CITIES                — seçilə bilən şəhərlər
//   cityById(id) / normalizeCityId(v)
//   getPrayerLocation()          → { id, lat, lng, utcOffsetMin, method, city:{az,en,ru,ar,tr}, isDefault }
//   loadPrayerLocation()         → Promise<yer> (saxlanılmış seçimi oxuyur)
//   setPrayerCity(id)            — seçimi yaz və abunəçilərə xəbər ver
//   setAdminDefaultCity(id)      — admin standartı (istifadəçi seçməyibsə tətbiq olunur)
//   subscribePrayerLocation(cb)  → unsubscribe
//   usePrayerLocation()          → React hook: cari yer
//   locationSig(loc)             → keş açarı 'lat,lng,method'
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEFAULT_PRAYER_LOCATION } from '../config/brand'
import { subscribeToSettings } from '../data/adminContent'

const CITY_KEY = 'muslim_cc_selected_city'
const ADMIN_DEFAULT_KEY = 'muslim_cc_admin_default_city'

// Hesablama metodu bütün şəhərlər üçün eynidir (aladhan 13 = Diyanet)
const DEFAULT_METHOD = DEFAULT_PRAYER_LOCATION.method || 13

// Koordinatlar şəhər mərkəzidir. utcOffsetMin — standart (qış) UTC fərqi:
// yalnız ilk aladhan cavabı gələnə qədər işlədilir; əsl fərq (yay vaxtı
// daxil) cavabdan götürülür (hooks/usePrayerTimes.js). Hermes-də Intl saat
// qurşağı dəstəyi cihazdan asılı olduğu üçün IANA adı əvəzinə rəqəm saxlanılır.
export const PRAYER_CITIES = [
  { id:'Baku',         lat:40.4093,  lng:49.8671,   utcOffsetMin:240,  label:{ az:'Bakı',         en:'Baku',         ru:'Баку',         ar:'باكو',            tr:'Bakü' } },
  { id:'Ganja',        lat:40.6828,  lng:46.3606,   utcOffsetMin:240,  label:{ az:'Gəncə',        en:'Ganja',        ru:'Гянджа',       ar:'كنجة',            tr:'Gence' } },
  { id:'Istanbul',     lat:41.0082,  lng:28.9784,   utcOffsetMin:180,  label:{ az:'İstanbul',     en:'Istanbul',     ru:'Стамбул',      ar:'إسطنبول',         tr:'İstanbul' } },
  { id:'Ankara',       lat:39.9334,  lng:32.8597,   utcOffsetMin:180,  label:{ az:'Ankara',       en:'Ankara',       ru:'Анкара',       ar:'أنقرة',           tr:'Ankara' } },
  { id:'Moscow',       lat:55.7558,  lng:37.6173,   utcOffsetMin:180,  label:{ az:'Moskva',       en:'Moscow',       ru:'Москва',       ar:'موسكو',           tr:'Moskova' } },
  { id:'Cairo',        lat:30.0444,  lng:31.2357,   utcOffsetMin:120,  label:{ az:'Qahirə',       en:'Cairo',        ru:'Каир',         ar:'القاهرة',         tr:'Kahire' } },
  { id:'Mecca',        lat:21.4225,  lng:39.8262,   utcOffsetMin:180,  label:{ az:'Məkkə',        en:'Mecca',        ru:'Мекка',        ar:'مكة المكرمة',     tr:'Mekke' } },
  { id:'Medina',       lat:24.4672,  lng:39.6111,   utcOffsetMin:180,  label:{ az:'Mədinə',       en:'Medina',       ru:'Медина',       ar:'المدينة المنورة', tr:'Medine' } },
  { id:'Dubai',        lat:25.2048,  lng:55.2708,   utcOffsetMin:240,  label:{ az:'Dubay',        en:'Dubai',        ru:'Дубай',        ar:'دبي',             tr:'Dubai' } },
  { id:'London',       lat:51.5074,  lng:-0.1278,   utcOffsetMin:0,    label:{ az:'London',       en:'London',       ru:'Лондон',       ar:'لندن',            tr:'Londra' } },
  { id:'Sheki',        lat:41.1919,  lng:47.1706,   utcOffsetMin:240,  label:{ az:'Şəki',         en:'Sheki',        ru:'Шеки',         ar:'شكي',             tr:'Şeki' } },
  { id:'Lankaran',     lat:38.7529,  lng:48.8475,   utcOffsetMin:240,  label:{ az:'Lənkəran',     en:'Lankaran',     ru:'Ленкорань',    ar:'لنكران',          tr:'Lenkeran' } },
  { id:'Tabriz',       lat:38.0962,  lng:46.2738,   utcOffsetMin:210,  label:{ az:'Təbriz',       en:'Tabriz',       ru:'Тебриз',       ar:'تبريز',           tr:'Tebriz' } },
  { id:'Berlin',       lat:52.5200,  lng:13.4050,   utcOffsetMin:60,   label:{ az:'Berlin',       en:'Berlin',       ru:'Берлин',       ar:'برلين',           tr:'Berlin' } },
  { id:'Paris',        lat:48.8566,  lng:2.3522,    utcOffsetMin:60,   label:{ az:'Paris',        en:'Paris',        ru:'Париж',        ar:'باريس',           tr:'Paris' } },
  { id:'New York',     lat:40.7128,  lng:-74.0060,  utcOffsetMin:-300, label:{ az:'Nyu-York',     en:'New York',     ru:'Нью-Йорк',     ar:'نيويورك',         tr:'New York' } },
  { id:'Toronto',      lat:43.6532,  lng:-79.3832,  utcOffsetMin:-300, label:{ az:'Toronto',      en:'Toronto',      ru:'Торонто',      ar:'تورونتو',         tr:'Toronto' } },
  { id:'Kazan',        lat:55.7963,  lng:49.1088,   utcOffsetMin:180,  label:{ az:'Kazan',        en:'Kazan',        ru:'Казань',       ar:'قازان',           tr:'Kazan' } },
  { id:'Jakarta',      lat:-6.2088,  lng:106.8456,  utcOffsetMin:420,  label:{ az:'Cakarta',      en:'Jakarta',      ru:'Джакарта',     ar:'جاكرتا',          tr:'Cakarta' } },
  { id:'Kuala Lumpur', lat:3.1390,   lng:101.6869,  utcOffsetMin:480,  label:{ az:'Kuala-Lumpur', en:'Kuala Lumpur', ru:'Куала-Лумпур', ar:'كوالالمبور',      tr:'Kuala Lumpur' } },
]

const CITY_BY_ID = new Map(PRAYER_CITIES.map(c => [c.id, c]))

// Köhnə mobil adları (Namaz/Bildirişlər ekranlarının əvvəlki siyahısı)
const ALIASES = { makkah: 'Mecca', madinah: 'Medina' }

/** Saxlanmış dəyəri şəhər id-sinə çevir (köhnə formatlar da daxil); tanınmırsa null. */
export function normalizeCityId(saved) {
  if (saved == null || saved === '') return null
  const s = String(saved)
  if (CITY_BY_ID.has(s)) return s
  const low = s.toLowerCase()
  if (ALIASES[low]) return ALIASES[low]
  const found = PRAYER_CITIES.find(c => c.id.toLowerCase() === low || Object.values(c.label).some(v => v.toLowerCase() === low))
  return found ? found.id : null
}

/** id → şəhər obyekti; tanınmırsa null. */
export function cityById(id) {
  const norm = normalizeCityId(id)
  return norm ? CITY_BY_ID.get(norm) : null
}

// Yaddaşdakı vəziyyət (AsyncStorage asinxron olduğu üçün)
let userCityId = null
let adminCityId = null
let loaded = false
let loadPromise = null
const listeners = new Set()

function fromCity(c, isDefault) {
  return {
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    utcOffsetMin: c.utcOffsetMin,
    method: c.method || DEFAULT_METHOD,
    city: c.label,
    isDefault,
  }
}

/**
 * Cari namaz yeri: istifadəçinin seçimi → admin standartı → DEFAULT_PRAYER_LOCATION.
 * Həmişə tam obyekt qaytarır (heç vaxt null deyil).
 */
export function getPrayerLocation() {
  if (userCityId) return fromCity(CITY_BY_ID.get(userCityId), false)
  if (adminCityId) return fromCity(CITY_BY_ID.get(adminCityId), true)
  const d = DEFAULT_PRAYER_LOCATION
  const same = PRAYER_CITIES.find(c => Math.abs(c.lat - d.lat) < 0.05 && Math.abs(c.lng - d.lng) < 0.05)
  if (same) return fromCity(same, true)
  return { id: null, lat: d.lat, lng: d.lng, utcOffsetMin: 240, method: d.method || DEFAULT_METHOD, city: d.city, isDefault: true }
}

/** İstifadəçinin özü seçdiyi şəhərin id-si; seçməyibsə null. */
export function getPrayerCityId() {
  return userCityId
}

/** Keş və müqayisə açarı — yalnız vaxtlara təsir edən sahələr. */
export function locationSig(loc) {
  return `${loc.lat},${loc.lng},${loc.method}`
}

function emit() {
  const loc = getPrayerLocation()
  listeners.forEach(fn => { try { fn(loc) } catch { /* */ } })
}

// Admin paneldəki standart şəhəri real-vaxtda izlə (bir dəfə qoşulur)
let settingsWatched = false
function watchAdminDefault() {
  if (settingsWatched) return
  settingsWatched = true
  try {
    subscribeToSettings(settings => {
      if (settings && settings.defaultCity !== undefined) setAdminDefaultCity(settings.defaultCity)
    })
  } catch { /* Firebase əlçatan deyil — saxlanılmış standart qalır */ }
}

/** Saxlanılmış seçimi bir dəfə oxu; cari yeri qaytarır. */
export function loadPrayerLocation() {
  watchAdminDefault()
  if (loaded) return Promise.resolve(getPrayerLocation())
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const [own, admin] = await Promise.all([
          AsyncStorage.getItem(CITY_KEY),
          AsyncStorage.getItem(ADMIN_DEFAULT_KEY),
        ])
        // Bu arada setPrayerCity çağırılıbsa onu ləğv etmə
        if (!userCityId) userCityId = normalizeCityId(own)
        if (!adminCityId) adminCityId = normalizeCityId(admin)
      } catch { /* yaddaş əlçatan deyil — standart yer qalır */ }
      loaded = true
      emit()
      return getPrayerLocation()
    })()
  }
  return loadPromise
}

/** İstifadəçinin seçimi: id PRAYER_CITIES-dən biri olmalıdır (köhnə adlar da qəbul olunur). */
export async function setPrayerCity(id) {
  const norm = normalizeCityId(id)
  if (!norm) return
  const changed = norm !== userCityId
  userCityId = norm
  if (changed) emit()
  try { await AsyncStorage.setItem(CITY_KEY, norm) } catch { /* yalnız bu açılışda qalır */ }
}

/**
 * Admin paneldəki standart şəhər (Settings → defaultCity). Yalnız istifadəçi
 * özü seçməyibsə təsir edir; növbəti açılışlar üçün yadda saxlanılır.
 */
export async function setAdminDefaultCity(id) {
  const norm = normalizeCityId(id)
  if (norm === adminCityId) return
  adminCityId = norm
  if (!userCityId) emit()
  try {
    if (norm) await AsyncStorage.setItem(ADMIN_DEFAULT_KEY, norm)
    else await AsyncStorage.removeItem(ADMIN_DEFAULT_KEY)
  } catch { /* */ }
}

/** Yer dəyişəndə cb(getPrayerLocation()) çağırılır. */
export function subscribePrayerLocation(cb) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

/** React hook: cari namaz yeri; vaxta təsir etməyən dəyişikliklərdə obyekt eyni qalır. */
export function usePrayerLocation() {
  const [loc, setLoc] = useState(getPrayerLocation)
  useEffect(() => {
    const update = (next) => {
      setLoc(prev => (prev.id === next.id && locationSig(prev) === locationSig(next) && prev.isDefault === next.isDefault ? prev : next))
    }
    const unsub = subscribePrayerLocation(update)
    loadPrayerLocation().then(update)
    return unsub
  }, [])
  return loc
}
