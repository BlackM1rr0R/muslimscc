// ═══════════════════════════════════════════════════════
// Admin content subscribers — Web ilə eyni Firestore
// ═══════════════════════════════════════════════════════
// Web-də admin panelinin yazdığı bütün məlumat
// burada da real-vaxtda oxunur.

import { subscribeToCollection, subscribeSingleDoc, COLLECTIONS } from '../firebase/firestore'

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
