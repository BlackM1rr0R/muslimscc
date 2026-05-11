// ═══ ADMIN CONTENT — Firebase Firestore ═══
import {
  getAll, addDocument, updateDocument, deleteDocument,
  subscribeToCollection, getSingleDoc, setSingleDoc, subscribeSingleDoc,
  COLLECTIONS,
} from '../firebase/firestore'
import { isFirebaseConfigured } from '../firebase/config'

// ═══ HADITHS ═══
export const getCustomHadiths = () => getAll(COLLECTIONS.HADITHS)
export const addCustomHadith = (h) => addDocument(COLLECTIONS.HADITHS, h)
export const updateCustomHadith = (id, u) => updateDocument(COLLECTIONS.HADITHS, id, u)
export const deleteCustomHadith = (id) => deleteDocument(COLLECTIONS.HADITHS, id)
export const subscribeToHadiths = (cb) => subscribeToCollection(COLLECTIONS.HADITHS, cb)

// ═══ DUAS ═══
export const getCustomDuas = () => getAll(COLLECTIONS.DUAS)
export const addCustomDua = (d) => addDocument(COLLECTIONS.DUAS, d)
export const updateCustomDua = (id, u) => updateDocument(COLLECTIONS.DUAS, id, u)
export const deleteCustomDua = (id) => deleteDocument(COLLECTIONS.DUAS, id)
export const subscribeToDuas = (cb) => subscribeToCollection(COLLECTIONS.DUAS, cb)

// ═══ ANNOUNCEMENTS ═══
export const getAnnouncements = () => getAll(COLLECTIONS.ANNOUNCEMENTS)
export const addAnnouncement = (a) => addDocument(COLLECTIONS.ANNOUNCEMENTS, a)
export const updateAnnouncement = (id, u) => updateDocument(COLLECTIONS.ANNOUNCEMENTS, id, u)
export const deleteAnnouncement = (id) => deleteDocument(COLLECTIONS.ANNOUNCEMENTS, id)
export const subscribeToAnnouncements = (cb) => subscribeToCollection(COLLECTIONS.ANNOUNCEMENTS, cb)

// ═══ QUOTES ═══
export const getCustomQuotes = () => getAll(COLLECTIONS.QUOTES)
export const addCustomQuote = (q) => addDocument(COLLECTIONS.QUOTES, q)
export const updateCustomQuote = (id, u) => updateDocument(COLLECTIONS.QUOTES, id, u)
export const deleteCustomQuote = (id) => deleteDocument(COLLECTIONS.QUOTES, id)
export const subscribeToQuotes = (cb) => subscribeToCollection(COLLECTIONS.QUOTES, cb)

// ═══ EVENTS ═══
export const getCustomEvents = () => getAll(COLLECTIONS.EVENTS)
export const addCustomEvent = (e) => addDocument(COLLECTIONS.EVENTS, e)
export const updateCustomEvent = (id, u) => updateDocument(COLLECTIONS.EVENTS, id, u)
export const deleteCustomEvent = (id) => deleteDocument(COLLECTIONS.EVENTS, id)
export const subscribeToEvents = (cb) => subscribeToCollection(COLLECTIONS.EVENTS, cb)

// ═══ PLACES ═══
export const getCustomPlaces = () => getAll(COLLECTIONS.PLACES)
export const addCustomPlace = (p) => addDocument(COLLECTIONS.PLACES, p)
export const updateCustomPlace = (id, u) => updateDocument(COLLECTIONS.PLACES, id, u)
export const deleteCustomPlace = (id) => deleteDocument(COLLECTIONS.PLACES, id)

// ═══ DAILY CONTENT (singleton) ═══
const DEFAULT_DAILY = {
  ayah: { ar:'', text:{az:'',en:'',ru:'',ar:'',tr:''}, source:'' },
  dhikr: { ar:'', translit:'', text:{az:'',en:'',ru:'',ar:'',tr:''}, count:33 },
  quote: { ar:'', text:{az:'',en:'',ru:'',ar:'',tr:''}, source:'' },
}

export async function getDailyContent() {
  const data = await getSingleDoc('singletons', 'daily')
  return data || DEFAULT_DAILY
}

export async function saveDailyContent(content) {
  return await setSingleDoc('singletons', 'daily', content)
}

export function subscribeToDailyContent(cb) {
  return subscribeSingleDoc('singletons', 'daily', (data) => {
    cb(data || DEFAULT_DAILY)
  })
}

// ═══ HERO BANNER (singleton) ═══
const DEFAULT_HERO = { active:false, title:{az:'',en:'',ru:'',ar:'',tr:''}, subtitle:{az:'',en:'',ru:'',ar:'',tr:''}, ctaText:{az:'',en:'',ru:'',ar:'',tr:''}, ctaLink:'', gradient:'green' }

export async function getHeroBanner() {
  const data = await getSingleDoc('singletons', 'hero')
  return data || DEFAULT_HERO
}

export async function saveHeroBanner(hero) {
  return await setSingleDoc('singletons', 'hero', hero)
}

export function subscribeToHero(cb) {
  return subscribeSingleDoc('singletons', 'hero', (data) => {
    cb(data || DEFAULT_HERO)
  })
}

// ═══ APP SETTINGS (singleton) ═══
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
}

export async function getAppSettings() {
  const data = await getSingleDoc('singletons', 'settings')
  return data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS
}

export async function saveAppSettings(settings) {
  return await setSingleDoc('singletons', 'settings', settings)
}

export function subscribeToSettings(cb) {
  return subscribeSingleDoc('singletons', 'settings', (data) => {
    cb(data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS)
  })
}

// ═══ KATEQORIYALAR (static — Firebase-də saxlanılmır) ═══
export const ANNOUNCEMENT_TYPES = [
  { key:'info',    label:{az:'Məlumat',en:'Info',ru:'Информация',ar:'معلومات',tr:'Bilgi'}, color:'#3b82f6', icon:'ℹ️' },
  { key:'urgent',  label:{az:'Vacib',en:'Urgent',ru:'Срочно',ar:'عاجل',tr:'Acil'}, color:'#ef4444', icon:'⚠️' },
  { key:'event',   label:{az:'Tədbir',en:'Event',ru:'Событие',ar:'حدث',tr:'Etkinlik'}, color:'#8b5cf6', icon:'📅' },
  { key:'success', label:{az:'Müjdə',en:'Glad Tidings',ru:'Радость',ar:'بشرى',tr:'Müjde'}, color:'#10b981', icon:'🎉' },
  { key:'reminder',label:{az:'Xatırlatma',en:'Reminder',ru:'Напоминание',ar:'تذكير',tr:'Hatırlatma'}, color:'#f59e0b', icon:'🔔' },
]

export const CUSTOM_DUA_CATS = [
  { key:'morning',    label:{az:'Səhər',en:'Morning',ru:'Утро',ar:'الصباح',tr:'Sabah'}, color:'#f59e0b' },
  { key:'evening',    label:{az:'Axşam',en:'Evening',ru:'Вечер',ar:'المساء',tr:'Akşam'}, color:'#8b5cf6' },
  { key:'general',    label:{az:'Ümumi',en:'General',ru:'Общее',ar:'عام',tr:'Genel'}, color:'#3b82f6' },
  { key:'forgiveness',label:{az:'Bağışlanma',en:'Forgiveness',ru:'Прощение',ar:'الاستغفار',tr:'Bağışlanma'}, color:'#10b981' },
  { key:'gratitude',  label:{az:'Şükür',en:'Gratitude',ru:'Благодарность',ar:'الشكر',tr:'Şükür'}, color:'#ec4899' },
  { key:'travel',     label:{az:'Səfər',en:'Travel',ru:'Путешествие',ar:'السفر',tr:'Yolculuk'}, color:'#06b6d4' },
  { key:'food',       label:{az:'Yemək',en:'Food',ru:'Еда',ar:'الطعام',tr:'Yemek'}, color:'#f97316' },
  { key:'sleep',      label:{az:'Yatmaq',en:'Sleep',ru:'Сон',ar:'النوم',tr:'Uyku'}, color:'#6366f1' },
]

export const CUSTOM_HADITH_CATS = [
  { key:'faith',     label:{az:'İman',en:'Faith',ru:'Вера',ar:'الإيمان',tr:'İman'}, color:'#10b981' },
  { key:'character', label:{az:'Əxlaq',en:'Character',ru:'Нрав',ar:'الأخلاق',tr:'Ahlak'}, color:'#f59e0b' },
  { key:'worship',   label:{az:'İbadət',en:'Worship',ru:'Поклонение',ar:'العبادة',tr:'İbadet'}, color:'#3b82f6' },
  { key:'knowledge', label:{az:'Elm',en:'Knowledge',ru:'Знание',ar:'العلم',tr:'İlim'}, color:'#8b5cf6' },
  { key:'charity',   label:{az:'Sədəqə',en:'Charity',ru:'Милостыня',ar:'الصدقة',tr:'Sadaka'}, color:'#ec4899' },
  { key:'patience',  label:{az:'Səbr',en:'Patience',ru:'Терпение',ar:'الصبر',tr:'Sabır'}, color:'#06b6d4' },
  { key:'family',    label:{az:'Ailə',en:'Family',ru:'Семья',ar:'الأسرة',tr:'Aile'}, color:'#f97316' },
  { key:'general',   label:{az:'Ümumi',en:'General',ru:'Общее',ar:'عام',tr:'Genel'}, color:'#6366f1' },
]

export const QUOTE_CATEGORIES = [
  { key:'quran',  label:{az:'Quran',en:'Quran',ru:'Коран',ar:'القرآن',tr:'Kuran'}, color:'#10b981' },
  { key:'hadith', label:{az:'Hədis',en:'Hadith',ru:'Хадис',ar:'الحديث',tr:'Hadis'}, color:'#f59e0b' },
  { key:'dua',    label:{az:'Dua',en:'Dua',ru:'Дуа',ar:'دعاء',tr:'Dua'}, color:'#8b5cf6' },
  { key:'wisdom', label:{az:'Hikmət',en:'Wisdom',ru:'Мудрость',ar:'حكمة',tr:'Hikmet'}, color:'#ec4899' },
]

export const EVENT_TYPES = [
  { key:'major',  label:{az:'Əsas',en:'Major',ru:'Главный',ar:'رئيسي',tr:'Ana'}, color:'#ef4444', icon:'⭐' },
  { key:'sunnah', label:{az:'Sünnə',en:'Sunnah',ru:'Сунна',ar:'سنة',tr:'Sünnet'}, color:'#3b82f6', icon:'📿' },
  { key:'night',  label:{az:'Gecə',en:'Night',ru:'Ночь',ar:'ليلة',tr:'Gece'}, color:'#8b5cf6', icon:'🌙' },
  { key:'hajj',   label:{az:'Həcc',en:'Hajj',ru:'Хадж',ar:'حج',tr:'Hac'}, color:'#f97316', icon:'🕋' },
  { key:'fast',   label:{az:'Oruc',en:'Fasting',ru:'Пост',ar:'صيام',tr:'Oruç'}, color:'#10b981', icon:'🌅' },
]

export const HIJRI_MONTHS = [
  { num:1, az:'Muharram', en:'Muharram', ar:'محرم' },
  { num:2, az:'Səfər', en:'Safar', ar:'صفر' },
  { num:3, az:'Rəbiüləvvəl', en:'Rabi al-Awwal', ar:'ربيع الأول' },
  { num:4, az:'Rəbiülaxır', en:'Rabi al-Thani', ar:'ربيع الآخر' },
  { num:5, az:'Cümadəlula', en:'Jumada al-Ula', ar:'جمادى الأولى' },
  { num:6, az:'Cümadəlaxir', en:'Jumada al-Akhira', ar:'جمادى الآخرة' },
  { num:7, az:'Rəcəb', en:'Rajab', ar:'رجب' },
  { num:8, az:'Şaban', en:"Sha'ban", ar:'شعبان' },
  { num:9, az:'Ramazan', en:'Ramadan', ar:'رمضان' },
  { num:10, az:'Şəvval', en:'Shawwal', ar:'شوال' },
  { num:11, az:'Zilqədə', en:"Dhu al-Qi'dah", ar:'ذو القعدة' },
  { num:12, az:'Zilhiccə', en:'Dhu al-Hijjah', ar:'ذو الحجة' },
]

export const HERO_GRADIENTS = [
  { key:'green',  colors:['#0d4a27','#1a6b3a','#22874a'], label:'Yaşıl' },
  { key:'gold',   colors:['#8b6508','#b8860b','#d4a017'], label:'Qızılı' },
  { key:'dark',   colors:['#1a1a2e','#16213e','#0f3460'], label:'Tünd' },
  { key:'ocean',  colors:['#0c4a6e','#0369a1','#0284c7'], label:'Okean' },
  { key:'sunset', colors:['#9a3412','#ea580c','#f97316'], label:'Gün batımı' },
  { key:'rose',   colors:['#881337','#be123c','#e11d48'], label:'Çəhrayı' },
  { key:'purple', colors:['#4c1d95','#7c3aed','#a855f7'], label:'Bənövşəyi' },
  { key:'teal',   colors:['#134e4a','#0f766e','#14b8a6'], label:'Teal' },
]

// ═══ BACKUP & RESTORE ═══
export async function exportAllData() {
  const data = {
    version: '2.0-firestore',
    exportedAt: new Date().toISOString(),
    videos: await getAll(COLLECTIONS.VIDEOS),
    hadiths: await getAll(COLLECTIONS.HADITHS),
    duas: await getAll(COLLECTIONS.DUAS),
    quotes: await getAll(COLLECTIONS.QUOTES),
    announcements: await getAll(COLLECTIONS.ANNOUNCEMENTS),
    events: await getAll(COLLECTIONS.EVENTS),
    daily: await getDailyContent(),
    hero: await getHeroBanner(),
    settings: await getAppSettings(),
  }
  return JSON.stringify(data, null, 2)
}

// ═══ STATISTICS (localStorage-dən — istifadəçi məlumatı) ═══
export function getUserStats() {
  const safe = (k, d = {}) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)) } catch { return d } }

  const prayerStats = safe('muslim_cc_prayer_stats')
  const quranStats = safe('quran_stats')
  const hadithFavs = safe('hadith_favs', [])
  const duaFavs = safe('dua_favs', [])
  const dhikrSession = safe('dhikr_session')
  const charityLog = safe('charity_log', [])
  const hifzProgress = safe('hifz_progress')

  return {
    prayerDays: Object.keys(prayerStats).length,
    totalPrayers: Object.values(prayerStats).reduce((s, d) => s + Object.values(d).filter(v => v === 1).length, 0),
    quranSessions: quranStats.sessions || 0,
    quranSurahsRead: Object.keys(quranStats.reads || {}).length,
    hadithFavorites: hadithFavs.length,
    duaFavorites: duaFavs.length,
    dhikrSessions: (dhikrSession.log || []).length,
    totalDhikr: (dhikrSession.log || []).reduce((s, e) => s + (e.count || 0), 0),
    charityDeeds: charityLog.length,
    charityTotal: charityLog.reduce((s, e) => s + (e.amount || 0), 0),
    hifzMemorized: Object.values(hifzProgress).filter(v => v === 2).length,
    storageSize: new Blob([JSON.stringify(localStorage)]).size,
  }
}

export { isFirebaseConfigured }
