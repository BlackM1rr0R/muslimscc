// ═══════════════════════════════════════════════════════
// Admin content subscribers — Web ilə eyni Firestore
// ═══════════════════════════════════════════════════════
// Web-də admin panelinin yazdığı bütün məlumat
// burada da real-vaxtda oxunur.

import { subscribeToCollection, subscribeSingleDoc, getSingleDoc, COLLECTIONS } from '../firebase/firestore'

// ═══ Sabitlər (web ilə eyni) ═══
export const ANNOUNCEMENT_TYPES = [
  { key:'info',    icon:'ℹ️', color:'#3b82f6' },
  { key:'urgent',  icon:'⚠️', color:'#ef4444' },
  { key:'event',   icon:'📅', color:'#f59e0b' },
  { key:'update',  icon:'🆕', color:'#10b981' },
]

export const HERO_GRADIENTS = [
  { key:'green',  colors:['#10b981', '#059669', '#047857'] },
  { key:'amber',  colors:['#f59e0b', '#d97706', '#b45309'] },
  { key:'rose',   colors:['#f43f5e', '#e11d48', '#be123c'] },
  { key:'blue',   colors:['#3b82f6', '#2563eb', '#1d4ed8'] },
  { key:'purple', colors:['#a855f7', '#9333ea', '#7c3aed'] },
  { key:'teal',   colors:['#14b8a6', '#0d9488', '#0f766e'] },
]

// ═══ Default singletons (Firebase boşdursa) ═══
const DEFAULT_DAILY = {
  ayah: { ar:'', text:{az:'',en:'',ru:'',ar:'',tr:''}, source:'' },
  dhikr: { ar:'', translit:'', text:{az:'',en:'',ru:'',ar:'',tr:''}, count:33 },
  quote: { ar:'', text:{az:'',en:'',ru:'',ar:'',tr:''}, source:'' },
}

const DEFAULT_HERO = {
  active: false,
  title: {az:'',en:'',ru:'',ar:'',tr:''},
  subtitle: {az:'',en:'',ru:'',ar:'',tr:''},
  ctaText: {az:'',en:'',ru:'',ar:'',tr:''},
  ctaLink: '',
  gradient: 'green',
}

const DEFAULT_SETTINGS = {
  defaultCity: 'Baku',
  defaultCountry: 'Azerbaijan',
  defaultLang: 'az',
  prayerMethod: 13,
  showAnnouncements: true,
  showVideos: true,
  showDailyContent: true,
  autoplayVideos: false,
  enableNotifications: true,
  primaryColor: '#1a6b3a',
  goldColor: '#b8860b',
  // AI Chat endpoint — admin paneldən təyin edilir, mobile + web eyni dəyəri istifadə edir
  apiUrl: '',
}

// ═══════════════════════════════════════════════════════
// Real-time subscribers — Web ilə tam paritet
// ═══════════════════════════════════════════════════════

// Custom hədislər (admin əlavə etdiyi)
export const subscribeToHadiths = (cb) =>
  subscribeToCollection(COLLECTIONS.HADITHS, cb)

// Custom dualar
export const subscribeToDuas = (cb) =>
  subscribeToCollection(COLLECTIONS.DUAS, cb)

// Custom sitatlar (Quote Generator üçün)
export const subscribeToQuotes = (cb) =>
  subscribeToCollection(COLLECTIONS.QUOTES, cb)

// Elanlar (Announcement Banner)
export const subscribeToAnnouncements = (cb) =>
  subscribeToCollection(COLLECTIONS.ANNOUNCEMENTS, cb)

// İslami təqvim hadisələri
export const subscribeToEvents = (cb) =>
  subscribeToCollection(COLLECTIONS.EVENTS, cb)

// Custom müqəddəs yerlər
export const subscribeToPlaces = (cb) =>
  subscribeToCollection(COLLECTIONS.PLACES, cb)

// Günün məzmunu (singleton)
export function subscribeToDailyContent(cb) {
  return subscribeSingleDoc('singletons', 'daily', (data) => {
    cb(data || DEFAULT_DAILY)
  })
}

// Hero banner (singleton)
export function subscribeToHero(cb) {
  return subscribeSingleDoc('singletons', 'hero', (data) => {
    cb(data || DEFAULT_HERO)
  })
}

// App settings — defaultCity, prayerMethod və s. (singleton)
export function subscribeToSettings(cb) {
  return subscribeSingleDoc('singletons', 'settings', (data) => {
    cb(data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS)
  })
}

// ═══════════════════════════════════════════════════════
// Camaat (iqamə) vaxtları — singleton: singletons/jamaat (web ilə eyni sənəd)
// ═══════════════════════════════════════════════════════
// Admin panelindən yazılan camaat vaxtları. Burada heç bir vaxt uydurulmur:
// Default YOXDUR — sənəd yoxdursa (və ya Firebase qurulmayıbsa) null
// qaytarılır (web kontraktı ilə eyni). Sahə boşdursa boş sətir qalır və
// hooks/useMosqueTimes.js config/mosque.js-dəki MOSQUE.jamaat / MOSQUE.jumua
// dəyərinə düşür (o da boşdursa, camaat vaxtı ümumiyyətlə göstərilmir).
//
// Sənəd varsa cb normallaşdırılmış formanı alır (web sənədi ilə eyni açarlar):
//   {
//     id,                                            // 'jamaat'
//     jamaat: { fajr, dhuhr, asr, maghrib, isha },  // "HH:MM" | "+N" | ''
//     jumua:  { time, khutbahLang: { az, en, ru, ar, tr } },
//     updatedAt,                                     // Firestore Timestamp | null
//   }
// Sənəddə həm iç-içə ({ jamaat:{...}, jumua:{...} }), həm də düz
// ({ fajr, dhuhr, ..., jumua:'13:00' }) forma qəbul olunur.
const JAMAAT_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const EMPTY_LANG_TEXT = { az:'', en:'', ru:'', ar:'', tr:'' }

function cleanRule(v) {
  return typeof v === 'string' ? v.trim() : (typeof v === 'number' ? String(v) : '')
}

function normalizeJamaat(data) {
  if (!data || typeof data !== 'object') return null
  const src = data
  const nested = src.jamaat && typeof src.jamaat === 'object' ? src.jamaat : src

  const jamaat = {}
  JAMAAT_KEYS.forEach(k => { jamaat[k] = cleanRule(nested[k]) })

  const j = src.jumua
  const jumuaTime = typeof j === 'string' ? j : (j && typeof j === 'object' ? j.time : src.jumuaTime)
  const khutbah = (j && typeof j === 'object' && j.khutbahLang) || src.khutbahLang
  const khutbahLang = typeof khutbah === 'string'
    ? { ...EMPTY_LANG_TEXT, az: khutbah }
    : { ...EMPTY_LANG_TEXT, ...(khutbah && typeof khutbah === 'object' ? khutbah : {}) }

  return {
    id: src.id || 'jamaat',
    jamaat,
    jumua: { time: cleanRule(jumuaTime), khutbahLang },
    updatedAt: src.updatedAt || null,
  }
}

// Bir dəfəlik oxu — sənəd yoxdursa null
export async function getJamaat() {
  const data = await getSingleDoc('singletons', 'jamaat')
  return normalizeJamaat(data)
}

// Real-vaxt dinləyici — unsubscribe funksiyası qaytarır.
// Firebase qurulmayıbsa subscribeSingleDoc dərhal cb(null) çağırır.
export function subscribeToJamaat(cb) {
  return subscribeSingleDoc('singletons', 'jamaat', (data) => {
    cb(normalizeJamaat(data))
  })
}
