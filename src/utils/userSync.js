// ═══════════════════════════════════════════════════════
// Cihazlar arası sinxronizasiya — klient (server: server/sync.js)
//
// Axın:
//   enable()          → yeni bərpa kodu + bu cihazın məlumatı şifrəli göndərilir
//   fetchRemote(code) → kodla serverdəki bloku gətir və aç (bərpadan ƏVVƏL göstərmək üçün)
//   link(code, remote)→ gətirilmiş məlumatı bu cihaza yaz, kodu yadda saxla
//   push()            → bu cihazın məlumatını göndər (versiya yoxlaması ilə)
//   pull()            → serverdəkini gətir və bu cihaza yaz
//   unlink()          → bu cihazda kodu unut (serverdəki blok qalır)
//   removeRemote()    → serverdəki şifrəli nüsxəni sil + bu cihazda unut
//
// Ziddiyyət: hər blokun versiyası var. push() bildiyi versiyanı göndərir; başqa
// cihaz arada yeniləyibsə server 409 qaytarır → { conflict: true } — istifadəçiyə
// "əvvəlcə gətirin" deyilir (heç bir cihazın məlumatı səssizcə itmir).
// Kod yalnız bu cihazın localStorage-indədir (ehtiyat nüsxə faylına DÜŞMÜR).
// ═══════════════════════════════════════════════════════
import { apiFetch, ApiError } from '../api/http'
import { deriveKeys, generateCode, normalizeCode, encryptText, decryptText } from './syncCrypto'
import { collectBackup, parseBackup, restoreBackup } from './userBackup'

export const SYNC_KEY = 'muslim_cc_sync'
const MAX_BLOB = 900 * 1024

export function readSync() {
  try {
    const v = JSON.parse(localStorage.getItem(SYNC_KEY) || 'null')
    return v && normalizeCode(v.code) ? v : null
  } catch { return null }
}
function writeSync(v) { try { localStorage.setItem(SYNC_KEY, JSON.stringify(v)) } catch { /* */ } }

const path = (id) => `/api/sync/${id}`

async function upload(code, version) {
  const { id, key } = await deriveKeys(code)
  const backup = collectBackup()
  const blob = await encryptText(key, JSON.stringify(backup))
  if (blob.length > MAX_BLOB) throw new Error('too_big')
  try {
    const r = await apiFetch(path(id), { method: 'PUT', body: { blob, version } })
    return { version: r.version, updatedAt: r.updatedAt, count: backup.count }
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) return { conflict: true, version: e.body?.version ?? null }
    throw e
  }
}

/** Sinxronizasiyanı aç: yeni kod, ilk göndəriş. Qaytarır: { code } */
export async function enable() {
  const code = generateCode()
  const r = await upload(code, 0)
  if (r.conflict) throw new Error('conflict')   // praktik olaraq mümkün deyil (yeni təsadüfi kod)
  writeSync({ code, version: r.version, syncedAt: new Date().toISOString() })
  return { code }
}

/** Kodla serverdəki məlumatı gətir və aç. Qaytarır: { code, version, updatedAt, backup } */
export async function fetchRemote(input) {
  const code = normalizeCode(input)
  if (!code) throw new Error('bad_code')
  const { id, key } = await deriveKeys(code)
  let r
  try { r = await apiFetch(path(id), { headers: { 'Cache-Control': 'no-store' } }) } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw new Error('not_found')
    throw e
  }
  let text
  try { text = await decryptText(key, r.blob) } catch { throw new Error('decrypt') }
  const parsed = parseBackup(text)
  if (!parsed.ok) throw new Error('decrypt')
  return { code, version: r.version, updatedAt: r.updatedAt, backup: parsed.backup }
}

/** fetchRemote nəticəsini bu cihaza yaz və kodu yadda saxla */
export function link(remote) {
  restoreBackup(remote.backup)
  writeSync({ code: remote.code, version: remote.version, syncedAt: new Date().toISOString() })
}

/** Bu cihazın məlumatını göndər. Qaytarır: { ok } | { conflict } */
export async function push() {
  const s = readSync()
  if (!s) throw new Error('not_linked')
  const r = await upload(s.code, s.version)
  if (r.conflict) return { conflict: true }
  writeSync({ ...s, version: r.version, syncedAt: new Date().toISOString() })
  return { ok: true, count: r.count }
}

/** Serverdəkini gətir və bu cihaza yaz (səhifə sonra yenilənməlidir) */
export async function pull() {
  const s = readSync()
  if (!s) throw new Error('not_linked')
  const remote = await fetchRemote(s.code)
  link(remote)
  return { ok: true, count: remote.backup.count }
}

export function unlink() { try { localStorage.removeItem(SYNC_KEY) } catch { /* */ } }

/** Serverdəki nüsxəni sil (geri qaytarılmaz) və bu cihazda kodu unut */
export async function removeRemote() {
  const s = readSync()
  if (!s) throw new Error('not_linked')
  const { id } = await deriveKeys(s.code)
  await apiFetch(path(id), { method: 'DELETE' })
  unlink()
}
