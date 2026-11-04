// ═══════════════════════════════════════════════════════
// İstifadəçi məlumatının ehtiyat nüsxəsi və bərpası (yerli fayl)
//
// Saytda hesab yoxdur — namaz izləyicisi, qəza, hifz, sevimlilər, jurnallar
// və tərcihlər yalnız brauzerin localStorage-indədir. Brauzer təmizlənəndə,
// telefon dəyişəndə (və ya iOS Safari yaddaşı siləndə) hamısı itir.
// Bu modul hamısını BİR JSON faylına yazır və həmin fayldan bərpa edir.
// Fayl istifadəçinin cihazında qalır — serverə heç nə getmir.
//
// Yanaşma: QADAĞAN SİYAHISI. Keşlər (namaz vaxtları, təfsir, ayə mətnləri)
// və cihaza bağlı texniki açarlar (push ünvanı, sessiya sayğacları) istisna
// olunur; qalan hər şey daxildir — gələcəkdə əlavə olunan yeni bölmələrin
// məlumatı da avtomatik ehtiyat nüsxəyə düşür.
// ═══════════════════════════════════════════════════════

export const BACKUP_KIND = 'muslims.cc/user-backup'
export const BACKUP_VERSION = 1
export const LAST_BACKUP_KEY = 'muslim_cc_last_backup'
const MAX_BYTES = 8 * 1024 * 1024

// Keş və texniki açarlar — ehtiyat nüsxəyə düşmür, bərpada da yazılmır
const EXCLUDE_PREFIXES = [
  'qm_ptimes_', 'qm_pmonth_', 'qm_ayah_', 'qm_qcard_ayah_', 'qm_ramadan_',  // şəbəkə keşləri
  'mushaf:', 'tafsir:', 'he1:',                                              // mətn keşləri
  'muslim_cc_session_', 'muslim_cc_prompt_shown_', 'qm-',                    // sessiya / yeniləmə
]
const EXCLUDE_KEYS = new Set([
  'muslim_cc_fcm_token', 'muslim_cc_push_endpoint',   // bu cihazın bildiriş ünvanı
  'last_azan_notif', 'muslim_cc_aichat_rate',          // vaxt damğaları / limit
  'muslim_cc_landing_path', 'muslim_cc_visit_count',
  'muslim_cc_pwa_installed', 'install_dismissed',
  'muslim_cc_admin_default_city', 'qmOverlay',
  LAST_BACKUP_KEY,
  'muslim_cc_sync',   // sinxronizasiya kodu + bu cihazın versiyası (utils/userSync) — cihaza aiddir
])

export function isBackupKey(key) {
  if (typeof key !== 'string' || !key) return false
  if (EXCLUDE_KEYS.has(key)) return false
  return !EXCLUDE_PREFIXES.some(p => key.startsWith(p))
}

/** storage-dən ehtiyat nüsxə obyekti (dəyərlər xam sətir kimi — format dəyişmir) */
export function collectBackup(storage = globalThis.localStorage, now = new Date()) {
  const data = {}
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)
    if (!isBackupKey(k)) continue
    const v = storage.getItem(k)
    if (typeof v === 'string') data[k] = v
  }
  return { kind: BACKUP_KIND, version: BACKUP_VERSION, createdAt: now.toISOString(), count: Object.keys(data).length, data }
}

/**
 * Faylın məzmununu yoxlayır. Qaytarır: { ok: true, backup } | { ok: false, code }
 * code: 'json' (oxunmur) | 'kind' (bizim fayl deyil) | 'version' (yeni versiya) | 'empty' | 'size'
 */
export function parseBackup(text) {
  if (typeof text !== 'string' || text.length > MAX_BYTES) return { ok: false, code: 'size' }
  let obj
  try { obj = JSON.parse(text) } catch { return { ok: false, code: 'json' } }
  if (!obj || typeof obj !== 'object' || obj.kind !== BACKUP_KIND) return { ok: false, code: 'kind' }
  if (!Number.isInteger(obj.version) || obj.version > BACKUP_VERSION) return { ok: false, code: 'version' }
  if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) return { ok: false, code: 'kind' }
  const data = {}
  for (const [k, v] of Object.entries(obj.data)) {
    // Prototip çirklənməsi və yad açarlar yazılmır
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue
    if (isBackupKey(k) && typeof v === 'string') data[k] = v
  }
  const count = Object.keys(data).length
  if (!count) return { ok: false, code: 'empty' }
  const createdAt = typeof obj.createdAt === 'string' && !Number.isNaN(Date.parse(obj.createdAt)) ? obj.createdAt : null
  return { ok: true, backup: { createdAt, count, data } }
}

/**
 * Bərpa: fayldakı açarlar yazılır (eyni açar varsa — fayldakı qalib gəlir),
 * faylda olmayan yerli məlumat SİLİNMİR. Qaytarır: yazılan açarların sayı.
 */
export function restoreBackup(backup, storage = globalThis.localStorage) {
  let n = 0
  for (const [k, v] of Object.entries(backup.data)) {
    try { storage.setItem(k, v); n++ } catch { /* yaddaş dolub — qalanını davam et */ }
  }
  return n
}

export function backupFileName(now = new Date()) {
  const p = (x) => String(x).padStart(2, '0')
  return `muslims-cc-backup-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`
}

export function readLastBackup(storage = globalThis.localStorage) {
  try { const v = storage.getItem(LAST_BACKUP_KEY); return v && !Number.isNaN(Date.parse(v)) ? v : null } catch { return null }
}
export function markBackedUp(now = new Date(), storage = globalThis.localStorage) {
  try { storage.setItem(LAST_BACKUP_KEY, now.toISOString()) } catch { /* */ }
}
