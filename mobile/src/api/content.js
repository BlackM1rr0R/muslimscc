// ═══════════════════════════════════════════════════════════
// MƏZMUN API-si — Mobile (Firestore-un əvəzi; veb src/api/content.js ilə eyni)
//
// Sayt ilə eyni server: https://muslims.cc/api/content/... (server/content.js,
// SQLite). Yalnız oxuma — mobil tətbiq heç nə yazmır. İmzalar köhnə
// src/firebase/firestore.js ilə eynidir: [{ id, ...data }] (createdAt azalan).
//
// Realtime yoxdur: subscribe* ilk abunədə soruşur, tətbiq ön plana qayıdanda
// (AppState 'active') yenidən soruşur — If-None-Match ilə, dəyişməyibsə server
// 304 qaytarır və callback çağırılmır. Eyni ünvana bir sorğu (paylaşılan mənbə).
// ═══════════════════════════════════════════════════════════
import { AppState } from 'react-native'
import { BRAND } from '../config/brand'

const API_BASE = `${BRAND.url}/api`
const REFETCH_GAP_MS = 15000

export const COLLECTIONS = {
  VIDEOS: 'videos',
  BOOKS: 'books',
  HADITHS: 'hadiths',
  DUAS: 'duas',
  QUOTES: 'quotes',
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
  PLACES: 'places',
  SETTINGS: 'settings',
  DAILY_CONTENT: 'singletons/daily',
  HERO: 'singletons/hero',
}

const enc = encodeURIComponent
const collectionUrl = (c) => `${API_BASE}/content/${enc(c)}`
const singletonUrl = (id) => `${API_BASE}/singletons/${enc(id)}`

// url → { etag, data, loaded, at, inflight, listeners, emptyValue }
const sources = new Map()
function sourceOf(url) {
  let s = sources.get(url)
  if (!s) {
    s = { etag: '', data: undefined, loaded: false, at: 0, inflight: null, listeners: new Set(), emptyValue: null }
    sources.set(url, s)
  }
  return s
}

/** Serverdən oxu → { data, changed }. 304 → yaddaşdakı, 404 → null. Xətada atır. */
function load(url) {
  const s = sourceOf(url)
  if (s.inflight) return s.inflight
  const p = (async () => {
    const headers = { Accept: 'application/json' }
    if (s.etag && s.loaded) headers['If-None-Match'] = s.etag
    const res = await fetch(url, { headers })
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
  p.then(() => { s.inflight = null }, () => { s.inflight = null })
  return p
}

function notify(url, data) {
  for (const cb of sourceOf(url).listeners) {
    try { cb(data) } catch (e) { console.warn('subscribe callback error:', e?.message) }
  }
}

async function refresh(url) {
  const s = sourceOf(url)
  try {
    const { data, changed } = await load(url)
    if (changed) notify(url, data)
  } catch (e) {
    // Hələ heç nə yüklənməyibsə — boş nəticə (ekran standart məlumatla işləsin)
    if (!s.loaded) notify(url, s.emptyValue)
    console.warn('content refresh failed:', e?.message)
  }
}

// Tətbiq ön plana qayıdanda aktiv mənbələri ucuz yoxla
let watching = false
function ensureWatching() {
  if (watching) return
  watching = true
  try {
    AppState.addEventListener('change', (state) => {
      if (state !== 'active') return
      const now = Date.now()
      for (const [url, s] of sources) if (s.listeners.size && now - s.at >= REFETCH_GAP_MS) refresh(url)
    })
  } catch { /* AppState yoxdur (məs. testlər) */ }
}

function subscribeUrl(url, callback, emptyValue) {
  const s = sourceOf(url)
  s.emptyValue = emptyValue
  s.listeners.add(callback)
  ensureWatching()
  if (s.loaded) {
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

// Bütün sənədlər (read-only). orderField imza üçün qalır — server createdAt azalan sıralayır.
// eslint-disable-next-line no-unused-vars
export async function getAll(collectionName, orderField = 'createdAt') {
  try {
    const { data } = await load(collectionUrl(collectionName))
    return Array.isArray(data) ? data : []
  } catch (e) {
    console.warn('getAll error:', e?.message)
    return []
  }
}

// eslint-disable-next-line no-unused-vars
export function subscribeToCollection(collectionName, callback, orderField = 'createdAt') {
  return subscribeUrl(collectionUrl(collectionName), (items) => callback(Array.isArray(items) ? items : []), [])
}

// Tək sənəd (settings, hero, daily) — collection həmişə 'singletons'
export async function getSingleDoc(collectionName, docId) {
  try {
    const { data } = await load(singletonUrl(docId))
    return data || null
  } catch (e) {
    console.warn('getSingleDoc error:', e?.message)
    return null
  }
}

export function subscribeSingleDoc(collectionName, docId, callback) {
  return subscribeUrl(singletonUrl(docId), (d) => callback(d || null), null)
}
