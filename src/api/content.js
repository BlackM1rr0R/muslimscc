// ═══════════════════════════════════════════════════════════
// MƏZMUN API-si — Firestore-un əvəzi (server/content.js, SQLite)
//
// Funksiyaların İMZALARI köhnə src/firebase/firestore.js ilə eynidir —
// səhifələr və admin idarəediciləri dəyişmədən işləyir. Cavab forması da
// eynidir: [{ id, ...data }] (createdAt azalan); vaxtlar millisaniyədir.
//
// Realtime (onSnapshot) yoxdur. subscribe* funksiyaları:
//   • ilk abunədə bir dəfə soruşur;
//   • pəncərə fokus alanda / vərəq görünən olanda yenidən soruşur
//     (ən çox 15 saniyədə bir) — If-None-Match ilə: dəyişməyibsə server
//     304 qaytarır (gövdəsiz) və callback ÇAĞIRILMIR;
//   • admin yazısından (add/update/delete/set) sonra həmin kolleksiya dərhal
//     yenidən oxunur — admin siyahısı Firestore-dakı kimi özü yenilənir.
// Eyni ünvana bir neçə abunəçi olsa da sorğu birdir (paylaşılan mənbə).
// ═══════════════════════════════════════════════════════════
import { apiFetch } from './http'

export const COLLECTIONS = {
  VIDEOS: 'videos',
  BOOKS: 'books',
  HADITHS: 'hadiths',
  DUAS: 'duas',
  QUOTES: 'quotes',
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
  PLACES: 'places',
  // Tək sənədlər
  SETTINGS: 'settings',
  DAILY_CONTENT: 'singletons/daily',
  HERO: 'singletons/hero',
}

// Admin tarixçəsi ictimai kolleksiya deyil — ayrıca admin API-si
const HISTORY = 'notification_history'
const REFETCH_GAP_MS = 15_000

const enc = encodeURIComponent
const collectionUrl = (c) => `/api/content/${enc(c)}`
const singletonUrl = (id) => `/api/singletons/${enc(id)}`

// ── Paylaşılan mənbələr: url → { etag, data, loaded, at, inflight, listeners } ──
const sources = new Map()

function sourceOf(url) {
  let s = sources.get(url)
  if (!s) {
    s = { etag: '', data: undefined, loaded: false, at: 0, inflight: null, listeners: new Set() }
    sources.set(url, s)
  }
  return s
}

/**
 * Mənbəni serverdən oxu. 304 → yaddaşdakı. 404 → null (tək sənəd yoxdur).
 * Qaytarır: { data, changed }. Xətada atır.
 */
function load(url, { force = false } = {}) {
  const s = sourceOf(url)
  if (s.inflight && !force) return s.inflight
  const p = (async () => {
    const headers = { Accept: 'application/json' }
    if (s.etag && s.loaded) headers['If-None-Match'] = s.etag
    // no-cache: brauzer keşi ETag-i özü də yoxlayır, amma biz 304-ü özümüz
    // görmək istəyirik (dəyişməyibsə abunəçiləri narahat etməmək üçün)
    const res = await fetch(url, { headers, cache: 'no-store', credentials: 'same-origin' })
    s.at = Date.now()
    if (res.status === 304 && s.loaded) return { data: s.data, changed: false }
    let data
    if (res.status === 404) data = null
    else if (!res.ok) throw new Error(`HTTP ${res.status}`)
    else data = await res.json()
    s.etag = res.headers.get('ETag') || ''
    const changed = !s.loaded || JSON.stringify(data) !== JSON.stringify(s.data)
    s.data = data
    s.loaded = true
    return { data, changed }
  })()
  s.inflight = p
  p.finally(() => { if (s.inflight === p) s.inflight = null }).catch(() => {})
  return p
}

function notify(url, data) {
  for (const cb of sourceOf(url).listeners) {
    try { cb(data) } catch (e) { console.error('subscribe callback error:', e) }
  }
}

/** Mənbəni təzələ və dəyişibsə abunəçilərə xəbər ver. */
async function refresh(url, opts) {
  const s = sourceOf(url)
  try {
    const { data, changed } = await load(url, opts)
    if (changed) notify(url, data)
  } catch (e) {
    // Hələ heç nə yüklənməyibsə — köhnə davranış kimi boş nəticə (səhifə
    // statik məlumatla işləsin); yüklənibsə əvvəlki siyahı qalır
    if (!s.loaded && s.listeners.size) notify(url, s.emptyValue)
    if (import.meta.env?.DEV) console.warn('content refresh failed:', url, e?.message)
  }
}

// ── Fokus / görünmə: bütün aktiv mənbələri ucuz yoxla ──
let watching = false
function onWake() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  const now = Date.now()
  for (const [url, s] of sources) {
    if (s.listeners.size && now - s.at >= REFETCH_GAP_MS) refresh(url)
  }
}
function ensureWatching() {
  if (watching || typeof window === 'undefined') return
  watching = true
  window.addEventListener('focus', onWake)
  document.addEventListener('visibilitychange', onWake)
}

function subscribeUrl(url, callback, emptyValue) {
  const s = sourceOf(url)
  s.emptyValue = emptyValue
  s.listeners.add(callback)
  ensureWatching()
  if (s.loaded) {
    // Artıq yaddaşda var — dərhal ver, köhnədirsə arxada yoxla
    Promise.resolve().then(() => { if (s.listeners.has(callback)) callback(s.data) })
    if (Date.now() - s.at >= REFETCH_GAP_MS) refresh(url)
  } else if (!s.inflight) {
    refresh(url)
  } else {
    s.inflight.then(({ data }) => { if (s.listeners.has(callback)) callback(data) },
      () => { if (s.listeners.has(callback)) callback(emptyValue) })
  }
  return () => { s.listeners.delete(callback) }
}

/** Admin yazısından sonra: kolleksiyanı (və ya tək sənədi) dərhal yenidən oxu. */
function invalidate(url) {
  const s = sources.get(url)
  if (!s) return
  if (s.listeners.size) refresh(url, { force: true })
  else { s.loaded = false; s.etag = '' }
}

// ═══ COLLECTION HELPERS ═══

// Bütün sənədlər (createdAt azalan — server sıralayır). orderField imza üçün qalır.
// eslint-disable-next-line no-unused-vars
export async function getAll(collectionName, orderField = 'createdAt') {
  try {
    if (collectionName === HISTORY) return (await apiFetch('/api/admin/notification-history', { admin: true })) || []
    const { data } = await load(collectionUrl(collectionName))
    return Array.isArray(data) ? data : []
  } catch (e) {
    console.error('getAll error:', e?.message || e)
    return []
  }
}

// Yeni sənəd (createdAt serverdə qoyulur)
export async function addDocument(collectionName, data) {
  const doc = await apiFetch(`/api/admin/content/${enc(collectionName)}`, { method: 'POST', body: data, admin: true })
  invalidate(collectionUrl(collectionName))
  return doc || { ...data }
}

// Sənədi yenilə (üst səviyyə birləşmə)
export async function updateDocument(collectionName, id, updates) {
  await apiFetch(`/api/admin/content/${enc(collectionName)}/${enc(id)}`, { method: 'PATCH', body: updates, admin: true })
  invalidate(collectionUrl(collectionName))
  return { id, ...updates }
}

// Sənədi sil
export async function deleteDocument(collectionName, id) {
  await apiFetch(`/api/admin/content/${enc(collectionName)}/${enc(id)}`, { method: 'DELETE', admin: true })
  invalidate(collectionUrl(collectionName))
  return true
}

// "Canlı" siyahı (yükləmədə + fokusda + admin yazısından sonra)
// eslint-disable-next-line no-unused-vars
export function subscribeToCollection(collectionName, callback, orderField = 'createdAt') {
  const wrapped = (items) => callback(Array.isArray(items) ? items : [])
  return subscribeUrl(collectionUrl(collectionName), wrapped, [])
}

// ═══ SINGLE DOC (settings, hero, daily — collection həmişə 'singletons') ═══

export async function getSingleDoc(collectionName, docId) {
  try {
    const { data } = await load(singletonUrl(docId))
    return data || null
  } catch (e) {
    console.error('getSingleDoc error:', e?.message || e)
    return null
  }
}

export async function setSingleDoc(collectionName, docId, data) {
  await apiFetch(`/api/admin/singletons/${enc(docId)}`, { method: 'PUT', body: data, admin: true })
  invalidate(singletonUrl(docId))
  return data
}

export function subscribeSingleDoc(collectionName, docId, callback) {
  return subscribeUrl(singletonUrl(docId), (d) => callback(d || null), null)
}

/** Yalnız testlər üçün: yaddaşı sıfırla. */
export function __resetContentCache() { sources.clear() }
