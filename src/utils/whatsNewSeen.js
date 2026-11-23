// ═══════════════════════════════════════════════════════
// Menyuda "Yeni" nişanı — hansı yeni səhifələr hələ açılmayıb?
//
// • Yeni səhifə = src/data/whatsNew.js-də page: true və son NEW_DAYS gün ərzində.
// • İstifadəçi səhifəni açanda (components/tour/TourHost → markSeen) açar
//   "qm_whatsnew_seen_v1"-ə yazılır və nişan həmin bənddən itir.
// • Yalnız BU CİHAZDA (profilə aid deyil, sinxronlaşmır, heç yerə göndərilmir).
// • Prerender = ilk render: hook boş dəstlə başlayır, yaddaş və saat mount-dan sonra oxunur.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { recentPageKeys } from '../data/whatsNew'

export const SEEN_KEY = 'qm_whatsnew_seen_v1'
export const SEEN_EVENT = 'qm-whatsnew-seen'
// Yaddaş sonsuz böyüməsin — köhnə açarlar onsuz da yeni sayılmır
const MAX_SEEN = 200

const EMPTY = new Set()

/** Görülmüş açarlar (yaddaş bağlıdırsa — boş dəst) */
export function readSeen() {
  try {
    const arr = JSON.parse(window.localStorage.getItem(SEEN_KEY) || '[]')
    return new Set(Array.isArray(arr) ? arr.filter((k) => typeof k === 'string') : [])
  } catch {
    return new Set()
  }
}

/** Hələ açılmamış yeni səhifələrin açarları */
export function unseenNewKeys(now = Date.now()) {
  const fresh = recentPageKeys(now)
  if (!fresh.size) return EMPTY
  const seen = readSeen()
  const out = new Set()
  for (const k of fresh) if (!seen.has(k)) out.add(k)
  return out
}

/** Səhifə açıldı — yeni idisə, nişanı götür. Dəyişiklik olubsa true. */
export function markSeen(key, now = Date.now()) {
  if (!key || !recentPageKeys(now).has(key)) return false
  const seen = readSeen()
  if (seen.has(key)) return false
  const next = [...seen, key].slice(-MAX_SEEN)
  try { window.localStorage.setItem(SEEN_KEY, JSON.stringify(next)) } catch { return false }
  try { window.dispatchEvent(new CustomEvent(SEEN_EVENT, { detail: key })) } catch { /* köhnə brauzer */ }
  return true
}

/** React: hələ açılmamış yeni səhifələr (ilk render və prerender-də boş) */
export function useNewBadges() {
  const [keys, setKeys] = useState(EMPTY)
  useEffect(() => {
    const load = () => setKeys(unseenNewKeys())
    load()
    const onStorage = (e) => { if (!e.key || e.key === SEEN_KEY) load() }
    window.addEventListener(SEEN_EVENT, load)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(SEEN_EVENT, load)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return keys
}
