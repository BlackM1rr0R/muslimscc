// ═══ VIDEOS — Firebase real-time + default fallback ═══
import { getAll, subscribeToCollection, COLLECTIONS } from '../firebase/firestore'
import { isFirebaseConfigured } from '../firebase/config'

// Firebase real-time subscription (web admin əlavə edəndə dərhal görünür)
export function subscribeToVideos(callback) {
  return subscribeToCollection(COLLECTIONS.VIDEOS, (items) => {
    callback(items.length > 0 ? items : VIDEOS)
  })
}

export async function getVideos() {
  if (!isFirebaseConfigured()) return VIDEOS
  const items = await getAll(COLLECTIONS.VIDEOS)
  return items.length > 0 ? items : VIDEOS
}

// Default videolar (Firebase boşdursa fallback)
// Əvvəl burada 6 standart video vardı — 2026-10-27 yoxlamasında HAMISI YouTube-da
// mövcud deyildi (thumbnail və oEmbed 404). Uydurma ID yazılmır; videolar admin
// paneldən (Firestore) gəlir — veb src/data/videos.js ilə eyni qərar.
export const VIDEOS = [];

export const VIDEO_CATEGORIES = [
  { key:'all', label:{az:'Hamısı',en:'All',ru:'Все',ar:'الكل',tr:'Tümü'}, color:'#64748b' },
  { key:'quran', label:{az:'Quran',en:'Quran',ru:'Коран',ar:'القرآن',tr:'Kuran'}, color:'#10b981' },
  { key:'hadith', label:{az:'Hədis',en:'Hadith',ru:'Хадис',ar:'الحديث',tr:'Hadis'}, color:'#f59e0b' },
  { key:'lecture', label:{az:'Mühazirə',en:'Lecture',ru:'Лекция',ar:'محاضرة',tr:'Konferans'}, color:'#3b82f6' },
  { key:'dua', label:{az:'Dua',en:'Dua',ru:'Дуа',ar:'دعاء',tr:'Dua'}, color:'#8b5cf6' },
  { key:'nasheed', label:{az:'Nəşid',en:'Nasheed',ru:'Нашид',ar:'نشيد',tr:'İlahi'}, color:'#ec4899' },
];

export function getThumbnail(youtubeId) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function getVideoUrl(youtubeId) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}
