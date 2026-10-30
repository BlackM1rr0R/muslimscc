// ═══════════════════════════════════════════════════════
// Əzan səsi — sayt (və ya ana ekrana əlavə olunmuş tətbiq) AÇIQ olanda
//
// Bildiriş özü xüsusi səs çala bilmir (Web Push məhdudiyyəti — iPhone-da da,
// Android-də də yalnız sistemin standart səsi). Ona görə:
//   • push gələndə service worker açıq səhifəyə {type:'PUSH', tag:'azan-…'}
//     göndərir (public/sw.js) → burada əzan oxunur;
//   • əzan bildirişinə klikdə səhifə ?azan=1 ilə açılır → oxunur;
//   • namaz səhifəsi açıq olanda vaxt çatanda da (PrayerPage) eyni funksiya.
// Eyni namaz üçün bir neçə mənbə (push + PrayerPage) üst-üstə düşsə də
// əzan BİR dəfə oxunur.
//
// Səs: "The Adhan — Muslim Call to Prayer", ifa: Aaqib Azeez,
// Wikimedia Commons, CC BY-SA 4.0 (atribusiya: /licenses).
// ═══════════════════════════════════════════════════════

export const AZAN_URL = '/audio/azan.mp3'
const PREFS_KEY = 'muslim_cc_notif_prefs'
const DEDUPE_MS = 10 * 60 * 1000

let audio = null
let lastKey = ''
let lastAt = 0
const listeners = new Set()

function emit() { listeners.forEach((fn) => { try { fn(isAzanPlaying()) } catch { /* dinləyici xətası */ } }) }

/** Bildiriş ayarlarında "Namaz vaxtı" söndürülübsə əzan oxunmur. */
export function azanEnabled() {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {}
    return p.prayer !== false
  } catch { return true }
}

export function isAzanPlaying() {
  return Boolean(audio && !audio.paused && !audio.ended)
}

/** Oxunma vəziyyəti dəyişəndə çağırılır; abunəlikdən çıxma funksiyası qaytarır. */
export function onAzanChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * Əzanı oxut. `key` — eyni namazın təkrar oxunmasının qarşısını alır
 * (məs. 'fajr'). Brauzer avtomatik səsi bloklasa false qaytarır.
 */
export async function playAzan(key = 'azan', { force = false } = {}) {
  if (typeof window === 'undefined' || !azanEnabled()) return false
  const now = Date.now()
  if (!force && key === lastKey && now - lastAt < DEDUPE_MS) return isAzanPlaying()
  lastKey = key
  lastAt = now
  try {
    if (!audio) {
      audio = new Audio(AZAN_URL)
      audio.preload = 'auto'
      audio.addEventListener('play', emit)
      audio.addEventListener('pause', emit)
      audio.addEventListener('ended', emit)
    }
    audio.currentTime = 0
    await audio.play()
    return true
  } catch {
    // Avtomatik oxutma bloklandı (səhifə ilə hələ toxunuş olmayıb) — sakit keç
    emit()
    return false
  }
}

export function stopAzan() {
  if (!audio) return
  try { audio.pause(); audio.currentTime = 0 } catch { /* artıq dayanıb */ }
  emit()
}

/** 'azan-fajr' → 'fajr'; əzan tag-ı deyilsə null. */
export function azanKeyFromTag(tag) {
  const m = /^azan-(\w+)$/i.exec(String(tag || ''))
  return m ? m[1].toLowerCase() : null
}
