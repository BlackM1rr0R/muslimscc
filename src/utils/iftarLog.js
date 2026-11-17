// ═══════════════════════════════════════════════════════
// İftar dəvətlərinin sayı (Ramazan albomu üçün) — components/IftarInvite yükləyəndə / paylaşanda
//
// Açar: muslim_cc_iftar_log_v1 → { 'YYYY-MM-DD': say } (dəvətin HAZIRLANDIĞI gün; ≤ 200 gün).
// Kimə, hara — heç nə yazılmır, yalnız say. Sinxronizasiyada gün üzrə sayğac kimi birləşir
// (utils/syncMergers). tests/unit/ramadan-album.test.js
// ═══════════════════════════════════════════════════════
export const IFTAR_LOG_KEY = 'muslim_cc_iftar_log_v1'
export const IFTAR_LOG_MAX = 200
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }

/** Yerli təqvim günü 'YYYY-MM-DD' */
export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function sanitizeIftarLog(raw) {
  const out = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  const days = Object.keys(raw).filter((d) => DATE_RE.test(d)).sort().slice(-IFTAR_LOG_MAX)
  for (const d of days) {
    const n = Math.floor(Number(raw[d]))
    if (n > 0) out[d] = Math.min(n, 999)
  }
  return out
}

export function readIftarLog(storage = safeStorage()) {
  try { return sanitizeIftarLog(JSON.parse(storage?.getItem(IFTAR_LOG_KEY) || 'null')) } catch { return {} }
}

/** Bir dəvət hazırlandı (yüklə / paylaş) */
export function logIftarInvite(day, storage = safeStorage()) {
  if (!DATE_RE.test(String(day))) return
  const log = readIftarLog(storage)
  log[day] = (log[day] || 0) + 1
  try { storage?.setItem(IFTAR_LOG_KEY, JSON.stringify(sanitizeIftarLog(log))) } catch { /* yaddaş bağlıdır */ }
}
