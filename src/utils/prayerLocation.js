// ═══════════════════════════════════════════════════════
// Namaz vaxtlarının YERİ — istifadəçinin seçdiyi şəhər (bütün saytda ortaq)
//
// Niyə ayrıca modul: əvvəl şəhər seçimi yalnız /prayer səhifəsinin içində
// idi, ana səhifə və /jamaat isə məscidin sabit koordinatını göstərirdi.
// İndi seçim BİR yerdə saxlanılır — /prayer-də şəhər dəyişəndə ana səhifənin
// namaz kartı, /jamaat və push bildirişlərinin saatı da dərhal dəyişir.
//
// Saxlama: localStorage 'muslim_cc_selected_city' = şəhərin id-si ('Baku').
// Köhnə dəyərlər də oxunur: CITIES indeksi ('3'), Qaraçuxur dövrünün
// 'mosque' dəyəri (məscid Bakıda idi → Bakı).
// Seçim yoxdursa: admin paneldəki standart şəhər (Settings → defaultCity),
// o da yoxdursa DEFAULT_PRAYER_LOCATION (config/brand.js).
//
// API:
//   PRAYER_CITIES                    — seçilə bilən şəhərlər
//   getPrayerLocation()              → { id, lat, lng, tz, method, city:{az,en,ru,ar,tr}, isDefault }
//   getPrayerCityId()                → istifadəçinin seçdiyi id və ya null
//   setPrayerCity(id)                — seçimi yaz, abunəçilərə xəbər ver, FCM sənədini yenilə
//   setAdminDefaultCity(id)          — admin standartını yadda saxla (istifadəçi seçməyibsə tətbiq olunur)
//   subscribePrayerLocation(cb)      → unsubscribe; cb(getPrayerLocation()) — dəyişəndə
//   usePrayerLocation()              → React hook: cari yer (dəyişəndə yenidən render)
//   locationSig(loc)                 → keş açarı üçün 'lat,lng,method'
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { DEFAULT_PRAYER_LOCATION } from '../config/brand'

const CITY_KEY = 'muslim_cc_selected_city'
const ADMIN_DEFAULT_KEY = 'muslim_cc_admin_default_city'
const CHANGE_EVENT = 'qm-prayer-location'
// Firebase messaging.js ilə eyni açar — token yoxdursa Firebase heç yüklənmir
const FCM_TOKEN_KEY = 'muslim_cc_fcm_token'

// Hesablama metodu bütün şəhərlər üçün eynidir (əvvəlki /prayer səhifəsi
// kimi — aladhan 13 = Diyanet). Şəhər üçün başqa metod lazım olsa,
// həmin şəhərə `method` sahəsi əlavə et.
const DEFAULT_METHOD = DEFAULT_PRAYER_LOCATION.method || 13

// Koordinatlar şəhər mərkəzidir; tz — IANA saat qurşağı (geri sayım və
// "növbəti namaz" həmin şəhərin saatı ilə hesablanır).
export const PRAYER_CITIES = [
  { id:'Baku',         country:'AZ', lat:40.4093,  lng:49.8671,   tz:'Asia/Baku',          label:{ az:'Bakı',         en:'Baku',         ru:'Баку',         ar:'باكو',            tr:'Bakü' } },
  { id:'Ganja',        country:'AZ', lat:40.6828,  lng:46.3606,   tz:'Asia/Baku',          label:{ az:'Gəncə',        en:'Ganja',        ru:'Гянджа',       ar:'كنجة',            tr:'Gence' } },
  { id:'Istanbul',     country:'TR', lat:41.0082,  lng:28.9784,   tz:'Europe/Istanbul',    label:{ az:'İstanbul',     en:'Istanbul',     ru:'Стамбул',      ar:'إسطنبول',         tr:'İstanbul' } },
  { id:'Ankara',       country:'TR', lat:39.9334,  lng:32.8597,   tz:'Europe/Istanbul',    label:{ az:'Ankara',       en:'Ankara',       ru:'Анкара',       ar:'أنقرة',           tr:'Ankara' } },
  { id:'Moscow',       country:'RU', lat:55.7558,  lng:37.6173,   tz:'Europe/Moscow',      label:{ az:'Moskva',       en:'Moscow',       ru:'Москва',       ar:'موسكو',           tr:'Moskova' } },
  { id:'Cairo',        country:'EG', lat:30.0444,  lng:31.2357,   tz:'Africa/Cairo',       label:{ az:'Qahirə',       en:'Cairo',        ru:'Каир',         ar:'القاهرة',         tr:'Kahire' } },
  { id:'Mecca',        country:'SA', lat:21.4225,  lng:39.8262,   tz:'Asia/Riyadh',        label:{ az:'Məkkə',        en:'Mecca',        ru:'Мекка',        ar:'مكة المكرمة',     tr:'Mekke' } },
  { id:'Medina',       country:'SA', lat:24.4672,  lng:39.6111,   tz:'Asia/Riyadh',        label:{ az:'Mədinə',       en:'Medina',       ru:'Медина',       ar:'المدينة المنورة', tr:'Medine' } },
  { id:'Dubai',        country:'AE', lat:25.2048,  lng:55.2708,   tz:'Asia/Dubai',         label:{ az:'Dubay',        en:'Dubai',        ru:'Дубай',        ar:'دبي',             tr:'Dubai' } },
  { id:'London',       country:'GB', lat:51.5074,  lng:-0.1278,   tz:'Europe/London',      label:{ az:'London',       en:'London',       ru:'Лондон',       ar:'لندن',            tr:'Londra' } },
  { id:'Sheki',        country:'AZ', lat:41.1919,  lng:47.1706,   tz:'Asia/Baku',          label:{ az:'Şəki',         en:'Sheki',        ru:'Шеки',         ar:'شكي',             tr:'Şeki' } },
  { id:'Lankaran',     country:'AZ', lat:38.7529,  lng:48.8475,   tz:'Asia/Baku',          label:{ az:'Lənkəran',     en:'Lankaran',     ru:'Ленкорань',    ar:'لنكران',          tr:'Lenkeran' } },
  { id:'Tabriz',       country:'IR', lat:38.0962,  lng:46.2738,   tz:'Asia/Tehran',        label:{ az:'Təbriz',       en:'Tabriz',       ru:'Тебриз',       ar:'تبريز',           tr:'Tebriz' } },
  { id:'Berlin',       country:'DE', lat:52.5200,  lng:13.4050,   tz:'Europe/Berlin',      label:{ az:'Berlin',       en:'Berlin',       ru:'Берлин',       ar:'برلين',           tr:'Berlin' } },
  { id:'Paris',        country:'FR', lat:48.8566,  lng:2.3522,    tz:'Europe/Paris',       label:{ az:'Paris',        en:'Paris',        ru:'Париж',        ar:'باريس',           tr:'Paris' } },
  { id:'New York',     country:'US', lat:40.7128,  lng:-74.0060,  tz:'America/New_York',   label:{ az:'Nyu-York',     en:'New York',     ru:'Нью-Йорк',     ar:'نيويورك',         tr:'New York' } },
  { id:'Toronto',      country:'CA', lat:43.6532,  lng:-79.3832,  tz:'America/Toronto',    label:{ az:'Toronto',      en:'Toronto',      ru:'Торонто',      ar:'تورونتو',         tr:'Toronto' } },
  { id:'Kazan',        country:'RU', lat:55.7963,  lng:49.1088,   tz:'Europe/Moscow',      label:{ az:'Kazan',        en:'Kazan',        ru:'Казань',       ar:'قازان',           tr:'Kazan' } },
  { id:'Jakarta',      country:'ID', lat:-6.2088,  lng:106.8456,  tz:'Asia/Jakarta',       label:{ az:'Cakarta',      en:'Jakarta',      ru:'Джакарта',     ar:'جاكرتا',          tr:'Cakarta' } },
  { id:'Kuala Lumpur', country:'MY', lat:3.1390,   lng:101.6869,  tz:'Asia/Kuala_Lumpur',  label:{ az:'Kuala-Lumpur', en:'Kuala Lumpur', ru:'Куала-Лумпур', ar:'كوالالمبور',      tr:'Kuala Lumpur' } },
]

const CITY_BY_ID = new Map(PRAYER_CITIES.map(c => [c.id, c]))

// ── localStorage köməkçiləri (gizli rejimdə və s. atıla bilər) ──
function readLS(key) {
  try { return localStorage.getItem(key) } catch { return null }
}
function writeLS(key, value) {
  try { localStorage.setItem(key, value) } catch { /* yaddaş bağlıdır — seçim yalnız bu açılışda qalır */ }
}

// Yaddaş bağlı olanda da seçim bu açılış ərzində işləsin
let memSelection = null

/** Saxlanmış dəyəri şəhər id-sinə çevir (köhnə formatlar da daxil); tanınmırsa null. */
function normalizeId(saved) {
  if (saved == null || saved === '') return null
  // Qaraçuxur dövrü: 'mosque' — məscid Bakıda idi
  if (saved === 'mosque') return 'Baku'
  // Ən köhnə versiya CITIES indeksini yazırdı (0 = Bakı)
  if (/^\d+$/.test(saved)) return PRAYER_CITIES[Number(saved)]?.id || null
  return CITY_BY_ID.has(saved) ? saved : null
}

/** İstifadəçinin özü seçdiyi şəhərin id-si; seçməyibsə null. */
export function getPrayerCityId() {
  return normalizeId(readLS(CITY_KEY)) || memSelection
}

/** Şəhər obyekti → ortaq yer formatı. */
function fromCity(c, isDefault) {
  return {
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    tz: c.tz,
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
  const own = getPrayerCityId()
  if (own) return fromCity(CITY_BY_ID.get(own), false)
  const adminId = normalizeId(readLS(ADMIN_DEFAULT_KEY))
  if (adminId) return fromCity(CITY_BY_ID.get(adminId), true)
  // Standart yer siyahıdakı şəhərlə üst-üstə düşürsə, onun id-si ilə qaytar —
  // /prayer-də həmin çip seçilmiş görünsün
  const d = DEFAULT_PRAYER_LOCATION
  const same = PRAYER_CITIES.find(c => Math.abs(c.lat - d.lat) < 0.05 && Math.abs(c.lng - d.lng) < 0.05)
  return {
    id: same ? same.id : null,
    lat: d.lat,
    lng: d.lng,
    tz: d.tz,
    method: d.method || DEFAULT_METHOD,
    city: same ? same.label : d.city,
    isDefault: true,
  }
}

/** Keş və müqayisə açarı — yalnız vaxtlara təsir edən sahələr. */
export function locationSig(loc) {
  return `${loc.lat},${loc.lng},${loc.method}`
}

function emitChange() {
  try { window.dispatchEvent(new Event(CHANGE_EVENT)) } catch { /* SSR / köhnə brauzer */ }
}

/**
 * Push bildirişləri açıqdırsa (token var), Firestore-dakı fcm_tokens sənədinə
 * yeni yeri yaz — server hər istifadəçiyə ÖZ şəhərinin azan vaxtında göndərir.
 * Token yoxdursa Firebase modulu ümumiyyətlə yüklənmir.
 */
function syncPushLocation() {
  if (!readLS(FCM_TOKEN_KEY)) return
  import('../firebase/messaging')
    .then(m => m.updateTokenLocation?.())
    .catch(() => { /* şəbəkə yoxdur — növbəti token yazılışında yenilənəcək */ })
}

/** İstifadəçinin seçimi: id PRAYER_CITIES-dən biri olmalıdır. */
export function setPrayerCity(id) {
  if (!CITY_BY_ID.has(id)) return
  memSelection = id
  writeLS(CITY_KEY, id)
  emitChange()
  // Həmişə yazılır (eyni şəhər olsa belə): köhnə tokenlərin sənədində loc yox idi
  syncPushLocation()
}

/**
 * Admin paneldəki standart şəhər (Settings → defaultCity). Yalnız istifadəçi
 * özü seçməyibsə təsir edir; növbəti açılışlar üçün yadda saxlanılır.
 */
export function setAdminDefaultCity(id) {
  const norm = normalizeId(id)
  const prev = normalizeId(readLS(ADMIN_DEFAULT_KEY))
  if (norm === prev) return
  if (norm) writeLS(ADMIN_DEFAULT_KEY, norm)
  else { try { localStorage.removeItem(ADMIN_DEFAULT_KEY) } catch { /* */ } }
  if (!getPrayerCityId()) emitChange()
}

/** Yer dəyişəndə cb(getPrayerLocation()) çağırılır (başqa tab da daxil). */
export function subscribePrayerLocation(cb) {
  if (typeof window === 'undefined') return () => {}
  const onChange = () => cb(getPrayerLocation())
  const onStorage = (e) => { if (e.key === CITY_KEY || e.key === ADMIN_DEFAULT_KEY) onChange() }
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

/** React hook: cari namaz yeri; vaxta təsir etməyən dəyişikliklərdə obyekt eyni qalır. */
export function usePrayerLocation() {
  const [loc, setLoc] = useState(getPrayerLocation)
  useEffect(() => subscribePrayerLocation(next => {
    setLoc(prev => (prev.id === next.id && locationSig(prev) === locationSig(next) && prev.isDefault === next.isDefault ? prev : next))
  }), [])
  return loc
}
