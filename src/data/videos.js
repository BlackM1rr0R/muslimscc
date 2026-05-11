// ═══ VIDEOS — Firebase Firestore ilə ═══
import { getAll, addDocument, updateDocument, deleteDocument, subscribeToCollection, COLLECTIONS } from '../firebase/firestore'
import { isFirebaseConfigured } from '../firebase/config'

// ═══ DEFAULT VIDEOS (Firebase qoşulmadıqda fallback) ═══
export const DEFAULT_VIDEOS = [
  {
    id: 'default-1',
    title: { az:'Quran Tilavəti — Sura Yasin', en:'Quran — Surah Yasin', ru:'Сура Ясин', ar:'سورة يس', tr:'Yasin Suresi' },
    description: { az:'Mişari Raşid əl-Əfasinin tilavətində', en:'In Mishari Rashid Alafasy\'s recitation', ru:'В чтении Мишари Рашида', ar:'بصوت العفاسي', tr:'Mişari Raşid el-Afasi' },
    youtubeId: '9w3vw02P77U',
    category: 'quran',
    duration: '20:15',
  },
  {
    id: 'default-2',
    title: { az:'Hz. Peyğəmbərin Həyatı', en:'Life of Prophet Muhammad', ru:'Жизнь Пророка', ar:'حياة النبي', tr:'Peygamberin Hayatı' },
    description: { az:'Doğumundan vəfatına', en:'From birth to passing', ru:'От рождения до смерти', ar:'من المولد إلى الوفاة', tr:'Doğumundan vefatına' },
    youtubeId: 'WcKE7nVtKxw',
    category: 'lecture',
    duration: '45:30',
  },
  {
    id: 'default-3',
    title: { az:'Namaz Necə Qılınır', en:'How to Pray', ru:'Как совершать намаз', ar:'كيفية الصلاة', tr:'Namaz Nasıl Kılınır' },
    description: { az:'Addım-addım bələdçi', en:'Step-by-step guide', ru:'Пошаговое руководство', ar:'دليل خطوة بخطوة', tr:'Adım adım rehber' },
    youtubeId: 'kWGy_lt0vyM',
    category: 'lecture',
    duration: '12:45',
  },
]

export const VIDEO_CATEGORIES = [
  { key:'all',     label:{az:'Hamısı',en:'All',ru:'Все',ar:'الكل',tr:'Tümü'}, color:'#64748b' },
  { key:'quran',   label:{az:'Quran',en:'Quran',ru:'Коран',ar:'القرآن',tr:'Kuran'}, color:'#10b981' },
  { key:'hadith',  label:{az:'Hədis',en:'Hadith',ru:'Хадис',ar:'الحديث',tr:'Hadis'}, color:'#f59e0b' },
  { key:'lecture', label:{az:'Mühazirə',en:'Lecture',ru:'Лекция',ar:'محاضرة',tr:'Konferans'}, color:'#3b82f6' },
  { key:'dua',     label:{az:'Dua',en:'Dua',ru:'Дуа',ar:'دعاء',tr:'Dua'}, color:'#8b5cf6' },
  { key:'nasheed', label:{az:'Nəşid',en:'Nasheed',ru:'Нашид',ar:'نشيد',tr:'İlahi'}, color:'#ec4899' },
]

// ═══ ASYNC CRUD ═══
export async function getVideos() {
  if (!isFirebaseConfigured()) return DEFAULT_VIDEOS
  const items = await getAll(COLLECTIONS.VIDEOS)
  return items.length > 0 ? items : DEFAULT_VIDEOS
}

export async function addVideo(video) {
  return await addDocument(COLLECTIONS.VIDEOS, video)
}

export async function updateVideo(id, updates) {
  return await updateDocument(COLLECTIONS.VIDEOS, id, updates)
}

export async function deleteVideo(id) {
  return await deleteDocument(COLLECTIONS.VIDEOS, id)
}

// Real-time subscriber
export function subscribeToVideos(callback) {
  return subscribeToCollection(COLLECTIONS.VIDEOS, (items) => {
    callback(items.length > 0 ? items : DEFAULT_VIDEOS)
  })
}

// ═══ ADMIN AUTH (localStorage-də qalır, sadəlik üçün) ═══
const ADMIN_KEY = 'muslim_cc_admin'
const ADMIN_PASSWORD = 'muslim2025'

export function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_KEY) === 'true'
}

export function adminLogin(password) {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_KEY, 'true')
    return true
  }
  return false
}

export function adminLogout() {
  sessionStorage.removeItem(ADMIN_KEY)
}

// ═══ YouTube helpers ═══
export function getYouTubeId(url) {
  if (!url) return null
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function getThumbnail(youtubeId) {
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
}

export function getEmbedUrl(youtubeId) {
  return `https://www.youtube.com/embed/${youtubeId}`
}
