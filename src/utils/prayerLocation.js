// ═══════════════════════════════════════════════════════
// Namaz vaxtlarının YERİ — istifadəçinin seçdiyi şəhər (bütün saytda ortaq)
//
// Niyə ayrıca modul: əvvəl şəhər seçimi yalnız /prayer səhifəsinin içində
// idi, ana səhifə və /jamaat isə məscidin sabit koordinatını göstərirdi.
// İndi seçim BİR yerdə saxlanılır — /prayer-də şəhər dəyişəndə ana səhifənin
// namaz kartı, /jamaat, /qibla və push bildirişlərinin saatı da dərhal dəyişir.
//
// Saxlama: localStorage 'muslim_cc_selected_city' = şəhərin id-si ('Baku').
// Siyahıda olmayan (xüsusi) yer: id 'custom', yerin özü isə
// 'muslim_cc_custom_city'-də JSON kimi ({ lat, lng, tz, label, method? }).
// Köhnə dəyərlər də oxunur: köhnə siyahının indeksi ('3'), Qaraçuxur
// dövrünün 'mosque' dəyəri (məscid Bakıda idi → Bakı).
// Seçim yoxdursa: admin paneldəki standart şəhər (Settings → defaultCity),
// o da yoxdursa DEFAULT_PRAYER_LOCATION (config/brand.js).
//
// API:
//   PRAYER_CITIES                    — seçilə bilən şəhərlər (əvvəl Azərbaycan, sonra dünya)
//   COUNTRY_NAMES                    — ölkə kodu → 5 dildə ad
//   getPrayerLocation()              → { id, lat, lng, tz, method, city:{az,en,ru,ar,tr}, country, isDefault, isCustom }
//   getPrayerCityId()                → istifadəçinin seçdiyi id ('custom' daxil) və ya null
//   setPrayerCity(idOrPlace)         — id (siyahıdan) və ya xüsusi yer obyekti
//                                      { lat, lng, tz, label|name, country?, method? }; seçimi yaz,
//                                      abunəçilərə xəbər ver, push abunəliyini yenilə
//   setAdminDefaultCity(id)          — admin standartını yadda saxla (istifadəçi seçməyibsə tətbiq olunur)
//   subscribePrayerLocation(cb)      → unsubscribe; cb(getPrayerLocation()) — dəyişəndə
//   usePrayerLocation()              → React hook: cari yer (dəyişəndə yenidən render)
//   locationSig(loc)                 → keş açarı üçün 'lat,lng,method'
//   getRecentPlaces()                → son seçilən yerlər (ən çox 5; şəhər və ya xüsusi yer)
//   searchCities(query)              → PRAYER_CITIES-də diakritikasız, 5 dildə axtarış
//   foldText(s)                      → axtarış üçün sadələşdirilmiş mətn ("Şəki" → "seki")
//   nearestCity(lat, lng)            → { city, km } — siyahıdakı ən yaxın şəhər
//   searchWorldPlaces(q, lang, sig)  → Open-Meteo geocoding: dünyanın istənilən şəhəri
//   worldPlaceLabels(place, sig)     → həmin yerin adı 5 dildə (çatmayan dil → əsas ad)
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { prayerCity } from '../seo/prayerCity.js'
import { DEFAULT_PRAYER_LOCATION } from '../config/brand'
import { METHOD_ABUBAKR } from './prayCalc'

const CITY_KEY = 'muslim_cc_selected_city'
const CUSTOM_KEY = 'muslim_cc_custom_city'
const RECENT_KEY = 'muslim_cc_recent_cities'
const ADMIN_DEFAULT_KEY = 'muslim_cc_admin_default_city'
const CHANGE_EVENT = 'qm-prayer-location'
// src/api/push.js ilə eyni açarlar — abunəlik yoxdursa push modulu heç yüklənmir
// (köhnə FCM tokeni — keçid hələ olmayıbsa; modul onu özü Web Push-a keçirir)
const PUSH_ENDPOINT_KEY = 'muslim_cc_push_endpoint'
const FCM_TOKEN_KEY = 'muslim_cc_fcm_token'
const CUSTOM_ID = 'custom'
const LANG_LIST = ['az', 'en', 'ru', 'ar', 'tr']

// Hesablama metodu: Azərbaycan şəhərləri — Bakıdakı Əbu Bəkr məscidinin
// cədvəli (99, utils/prayCalc.js); qalan ölkələr — aladhan 13 (Diyanet).
// Şəhər üçün başqa metod lazım olsa, həmin şəhərə `method` sahəsi əlavə et.
const DEFAULT_METHOD = 13
const methodFor = (country, own) => own || (country === 'AZ' ? METHOD_ABUBAKR : DEFAULT_METHOD)

// Ölkə adları və şəhər siyahısı — src/data/prayerCities.js (saf məlumat, Node-da da oxunur)
import { COUNTRY_NAMES, PRAYER_CITIES } from '../data/prayerCities'
export { COUNTRY_NAMES, PRAYER_CITIES }

// Köhnə versiyalar şəhəri siyahıdakı İNDEKSLƏ yazırdı — həmin sıra
const LEGACY_ORDER = ['Baku','Ganja','Istanbul','Ankara','Moscow','Cairo','Mecca','Medina','Dubai','London',
  'Sheki','Lankaran','Tabriz','Berlin','Paris','New York','Toronto','Kazan','Jakarta','Kuala Lumpur']

const CITY_BY_ID = new Map(PRAYER_CITIES.map(c => [c.id, c]))

// ── localStorage köməkçiləri (gizli rejimdə və s. atıla bilər) ──
// Yaddaş bağlıdırsa (gizli rejim, kvota) seçim yalnız bu açılışda — yaddaşda (mem*) qalır
let storageBroken = false
function readLS(key) {
  try { return localStorage.getItem(key) } catch { storageBroken = true; return null }
}
function writeLS(key, value) {
  try { localStorage.setItem(key, value) } catch { storageBroken = true }
}
function readJSON(key) {
  try { return JSON.parse(readLS(key) || 'null') } catch { return null }
}

// Yaddaş bağlı olanda da seçim bu açılış ərzində işləsin
let memSelection = null   // id və ya 'custom'
let memCustom = null

const validTz = (tz) => {
  if (typeof tz !== 'string' || !tz) return false
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true } catch { return false }
}

/** Brauzerin öz saat qurşağı (dəqiq koordinat seçiləndə). */
function deviceTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

/**
 * Xüsusi yer obyektini yoxla və ortaq formata sal; yararsızdırsa null.
 * label: 5 dildə obyekt və ya tək ad (name) — çatmayan dillər əsas adla doldurulur,
 * çünki server bildirişdə city[lang]-ı yazır (server/prayer-utils.js → normLoc).
 */
function sanitizePlace(p) {
  if (!p || typeof p !== 'object') return null
  const lat = Number(p.lat), lng = Number(p.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  const src = p.label && typeof p.label === 'object' ? p.label : {}
  const base = String(src.en || src.az || p.name || Object.values(src).find(Boolean) || '').trim().slice(0, 80)
  if (!base) return null
  const label = {}
  for (const l of LANG_LIST) label[l] = String(src[l] || base).trim().slice(0, 80)
  const method = Number.isInteger(Number(p.method)) && p.method != null ? Number(p.method) : undefined
  return {
    lat: Math.round(lat * 1e4) / 1e4,
    lng: Math.round(lng * 1e4) / 1e4,
    tz: validTz(p.tz) ? p.tz : deviceTz(),
    label,
    country: typeof p.country === 'string' ? p.country.slice(0, 2).toUpperCase() : '',
    ...(method ? { method } : {}),
  }
}

/** Saxlanmış dəyəri şəhər id-sinə çevir (köhnə formatlar da daxil); tanınmırsa null. */
// SettingsManager-in 2026-10-dan əvvəlki siyahısı Məkkə/Mədinəni başqa adla
// saxlayırdı — admin bunları seçibsə, standart səssizcə Bakıya düşməsin
const LEGACY_ADMIN_IDS = { Makkah: 'Mecca', Madinah: 'Medina' }

function normalizeId(saved) {
  if (saved == null || saved === '') return null
  // Qaraçuxur dövrü: 'mosque' — məscid Bakıda idi
  if (saved === 'mosque') return 'Baku'
  // Ən köhnə versiya köhnə siyahının indeksini yazırdı (0 = Bakı)
  if (/^\d+$/.test(saved)) return LEGACY_ORDER[Number(saved)] || null
  // Admin panelinin köhnə şəhər siyahısı fərqli id-lər yazırdı
  if (LEGACY_ADMIN_IDS[saved]) return LEGACY_ADMIN_IDS[saved]
  return CITY_BY_ID.has(saved) ? saved : null
}

function readCustom() {
  return sanitizePlace(readJSON(CUSTOM_KEY)) || (storageBroken ? memCustom : null)
}

/** İstifadəçinin özü seçdiyi şəhərin id-si ('custom' — xüsusi yer); seçməyibsə null. */
export function getPrayerCityId() {
  const saved = readLS(CITY_KEY)
  const id = saved === CUSTOM_ID ? CUSTOM_ID : normalizeId(saved) || (storageBroken ? memSelection : null)
  if (id === CUSTOM_ID) return readCustom() ? CUSTOM_ID : null
  return id
}

/** Şəhər obyekti → ortaq yer formatı. */
function fromCity(c, isDefault) {
  return {
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    tz: c.tz,
    method: methodFor(c.country, c.method),
    city: c.label,
    country: c.country,
    isDefault,
    isCustom: false,
  }
}

/**
 * Şəhər səhifəsinin (/prayer/<slug>, v6.6) yeri — istifadəçinin seçiminə TOXUNMADAN.
 * Siyahıdakı Azərbaycan və yoxlanmış dünya şəhərləri (seo/routes.js → PRAYER_CITY_SLUGS); tapılmasa null.
 */
export function locationForCitySlug(slug) {
  const c = prayerCity(slug)   // AZ + yoxlanmış dünya şəhərləri (seo/prayerCity.js)
  return c ? fromCity(c, false) : null
}

function fromCustom(p) {
  return {
    id: CUSTOM_ID,
    lat: p.lat,
    lng: p.lng,
    tz: p.tz,
    method: methodFor(p.country, p.method),
    city: p.label,
    country: p.country || '',
    isDefault: false,
    isCustom: true,
  }
}

/**
 * Cari namaz yeri: istifadəçinin seçimi → admin standartı → DEFAULT_PRAYER_LOCATION.
 * Həmişə tam obyekt qaytarır (heç vaxt null deyil).
 */
export function getPrayerLocation() {
  const own = getPrayerCityId()
  if (own === CUSTOM_ID) return fromCustom(readCustom())
  if (own) return fromCity(CITY_BY_ID.get(own), false)
  const adminId = normalizeId(readLS(ADMIN_DEFAULT_KEY))
  if (adminId) return fromCity(CITY_BY_ID.get(adminId), true)
  // Standart yer siyahıdakı şəhərlə üst-üstə düşürsə, onun id-si ilə qaytar —
  // seçicidə həmin şəhər seçilmiş görünsün
  const d = DEFAULT_PRAYER_LOCATION
  const same = PRAYER_CITIES.find(c => Math.abs(c.lat - d.lat) < 0.05 && Math.abs(c.lng - d.lng) < 0.05)
  return {
    id: same ? same.id : null,
    lat: d.lat,
    lng: d.lng,
    tz: d.tz,
    method: methodFor(same ? same.country : '', d.method),
    city: same ? same.label : d.city,
    country: same ? same.country : '',
    isDefault: true,
    isCustom: false,
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
 * Push bildirişləri açıqdırsa, serverdəki abunəliyə (PATCH /api/push/subscription)
 * yeni yeri yaz — server hər istifadəçiyə ÖZ şəhərinin azan vaxtında göndərir.
 * Abunəlik yoxdursa push modulu ümumiyyətlə yüklənmir.
 */
function syncPushLocation() {
  if (!readLS(PUSH_ENDPOINT_KEY) && !readLS(FCM_TOKEN_KEY)) return
  import('../api/push')
    .then(m => m.updateTokenLocation?.())
    .catch(() => { /* şəbəkə yoxdur — növbəti token yazılışında yenilənəcək */ })
}

// ── Son seçilənlər: [{ id }] və ya [{ id:'custom', place }] ──
const RECENT_MAX = 5
const placeKey = (p) => `${p.lat.toFixed(2)},${p.lng.toFixed(2)}`

/** Son seçilən yerlər (yenidən köhnəyə): { id, city?, place? } */
export function getRecentPlaces() {
  const raw = readJSON(RECENT_KEY)
  if (!Array.isArray(raw)) return []
  const out = []
  for (const r of raw) {
    if (r?.id && CITY_BY_ID.has(r.id)) out.push({ id: r.id, city: CITY_BY_ID.get(r.id) })
    else if (r?.place) { const p = sanitizePlace(r.place); if (p) out.push({ id: CUSTOM_ID, place: p }) }
  }
  return out.slice(0, RECENT_MAX)
}

function pushRecent(entry) {
  const keyOf = (r) => (r.place ? `p:${placeKey(r.place)}` : `c:${r.id}`)
  const k = keyOf(entry)
  const prev = getRecentPlaces().map(r => (r.place ? { place: r.place } : { id: r.id }))
  const next = [entry, ...prev.filter(r => keyOf(r) !== k)].slice(0, RECENT_MAX)
  writeLS(RECENT_KEY, JSON.stringify(next))
}

/**
 * İstifadəçinin seçimi.
 *   setPrayerCity('Sheki')                         — siyahıdakı şəhər
 *   setPrayerCity({ lat, lng, tz, label, country }) — siyahıda olmayan yer
 * Yararsız dəyər səssizcə nəzərə alınmır (əvvəlki davranış).
 */
export function setPrayerCity(idOrPlace) {
  if (idOrPlace && typeof idOrPlace === 'object') {
    const p = sanitizePlace(idOrPlace)
    if (!p) return
    // Siyahıdakı şəhərlə eyni nöqtədirsə — o şəhəri seç (adlar 5 dildə hazırdır)
    const near = nearestCity(p.lat, p.lng)
    if (near && near.km < 1) { setPrayerCity(near.city.id); return }
    memCustom = p
    memSelection = CUSTOM_ID
    writeLS(CUSTOM_KEY, JSON.stringify(p))
    writeLS(CITY_KEY, CUSTOM_ID)
    pushRecent({ place: p })
  } else {
    const id = idOrPlace
    if (!CITY_BY_ID.has(id)) return
    memSelection = id
    writeLS(CITY_KEY, id)
    pushRecent({ id })
  }
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
  const onStorage = (e) => {
    if (e.key === CITY_KEY || e.key === ADMIN_DEFAULT_KEY || e.key === CUSTOM_KEY) onChange()
  }
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
    setLoc(prev => (prev.id === next.id && locationSig(prev) === locationSig(next) && prev.isDefault === next.isDefault
      && prev.city?.en === next.city?.en ? prev : next))
  }), [])
  return loc
}

// ═══ Axtarış ═══════════════════════════════════════════

// Azərbaycan/türk hərfləri latın əsasına; NFD diakritikaları (ü, ö, ç …) silir
const FOLD_MAP = { 'ə':'e', 'ı':'i', 'İ':'i', 'ş':'s', 'ç':'c', 'ğ':'g', 'ö':'o', 'ü':'u', 'ё':'е', 'й':'и',
  'أ':'ا', 'إ':'ا', 'آ':'ا', 'ٱ':'ا', 'ة':'ه', 'ى':'ي' }

/** Axtarış üçün sadələşdirilmiş mətn: kiçik hərf, diakritikasız ("Şəki" → "seki"). */
export function foldText(s) {
  return String(s || '')
    .replace(/[əıİşçğöüёйأإآٱةى]/gi, ch => FOLD_MAP[ch] ?? FOLD_MAP[ch.toLowerCase()] ?? ch)
    .toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[‐-―'’`ʼ.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Hər şəhər üçün axtarış mətnləri bir dəfə hazırlanır
const SEARCH_INDEX = PRAYER_CITIES.map(c => ({
  city: c,
  keys: [...new Set([c.id, ...Object.values(c.label), ...(c.alt || [])].map(foldText))],
}))

/**
 * Siyahıda axtarış: əvvəl adın başlanğıcı, sonra sözün başlanğıcı, sonra
 * hər hansı hissə. Boş sorğu → bütün siyahı (sıra dəyişmir).
 */
export function searchCities(query) {
  const q = foldText(query)
  if (!q) return PRAYER_CITIES.slice()
  const scored = []
  for (const { city, keys } of SEARCH_INDEX) {
    let best = 9
    for (const k of keys) {
      if (k === q) best = Math.min(best, 0)
      else if (k.startsWith(q)) best = Math.min(best, 1)
      else if (k.split(' ').some(w => w.startsWith(q))) best = Math.min(best, 2)
      else if (q.length >= 3 && k.includes(q)) best = Math.min(best, 3)
    }
    if (best < 9) scored.push([best, city])
  }
  // Bərabər xalda siyahı sırası qalır (Azərbaycan əvvəl)
  return scored.sort((a, b) => a[0] - b[0]).map(x => x[1])
}

function haversineKm(aLat, aLng, bLat, bLng) {
  const r = Math.PI / 180
  const dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** Siyahıdakı ən yaxın şəhər: { city, km } (siyahı boşdursa null). */
export function nearestCity(lat, lng) {
  let best = null
  for (const c of PRAYER_CITIES) {
    const km = haversineKm(lat, lng, c.lat, c.lng)
    if (!best || km < best.km) best = { city: c, km }
  }
  return best
}

// ═══ Dünya axtarışı (Open-Meteo geocoding — açarsız, CORS açıq) ═══

const GEO_API = 'https://geocoding-api.open-meteo.com/v1'
const GEO_LANG = { az: 'az', en: 'en', ru: 'ru', ar: 'ar', tr: 'tr' }

/**
 * Dünyanın istənilən yaşayış məntəqəsi: [{ gid, name, lat, lng, tz, country, region, countryName }].
 * Yalnız yaşayış məntəqələri (feature_code PPL*); tz-i olmayanlar atılır.
 */
export async function searchWorldPlaces(query, lang = 'az', signal) {
  const q = String(query || '').trim()
  if (q.length < 2) return []
  const url = `${GEO_API}/search?name=${encodeURIComponent(q)}&count=12&format=json&language=${GEO_LANG[lang] || 'en'}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`geocoding ${res.status}`)
  const data = await res.json()
  return (data?.results || [])
    .filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude) && validTz(r.timezone)
      && (!r.feature_code || /^PPL/.test(r.feature_code)))
    .map(r => ({
      gid: r.id,
      name: r.name,
      lat: r.latitude,
      lng: r.longitude,
      tz: r.timezone,
      country: (r.country_code || '').toUpperCase(),
      countryName: r.country || '',
      region: r.admin1 || '',
    }))
}

/**
 * Seçilən dünya yerinin adı 5 dildə (Open-Meteo /get?id=…&language=…).
 * Şəbəkə gec qalarsa (3 san) və ya dil üçün ad yoxdursa — əsas ad.
 */
export async function worldPlaceLabels(place, lang = 'az') {
  const label = { [lang]: place.name }
  if (!place.gid) return label
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = setTimeout(() => ctrl?.abort(), 3000)
  try {
    await Promise.all(LANG_LIST.filter(l => l !== lang).map(async l => {
      try {
        const r = await fetch(`${GEO_API}/get?id=${place.gid}&language=${l}`, { signal: ctrl?.signal })
        const d = r.ok ? await r.json() : null
        if (d?.name) label[l] = d.name
      } catch { /* bu dil üçün əsas ad qalır */ }
    }))
  } finally { clearTimeout(timer) }
  return label
}
