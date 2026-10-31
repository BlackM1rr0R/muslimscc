// ═══ VIDEOS — məzmun API-si ilə (src/api/content.js) ═══
import { getAll, addDocument, updateDocument, deleteDocument, subscribeToCollection, COLLECTIONS } from '../api/content'

// ═══ DEFAULT VIDEOS (server cavab vermədikdə fallback) ═══
// Əvvəl burada 6 standart video vardı — 2026-10-27 yoxlamasında HAMISI YouTube-da
// mövcud deyildi (thumbnail və oEmbed 404): istifadəçi boş kartlar görürdü.
// Uydurma ID yazılmır; videolar admin paneldən əlavə olunur,
// siyahı boşdursa səhifə "video yoxdur" vəziyyətini göstərir.
export const DEFAULT_VIDEOS = []

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

// Admin girişi: src/api/adminAuth.js (server sessiyası, server/auth.js)

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

// hqdefault (480×360) HƏR videoda var; maxresdefault isə yalnız HD yüklənmiş
// videolarda — olmayanda YouTube 404 qaytarırdı (boş kart + konsol xətası)
export function getThumbnail(youtubeId) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
}

export function getEmbedUrl(youtubeId, opts = {}) {
  const params = new URLSearchParams({
    autoplay: opts.autoplay === false ? '0' : '1',
    playsinline: '1',         // iOS Safari inline play — vacibdir
    rel: '0',                 // related videos yox
    modestbranding: '1',      // sade YouTube logo
    enablejsapi: '1',
  })
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`
}
