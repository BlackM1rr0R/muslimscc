// ═══════════════════════════════════════════════════════
// Bərpa kodunun hesab üçün "qabı" (wrap) — brauzer WebCrypto; server açarı görmür
//
// Kök sirr dəyişmir: sinxronizasiyanın bərpa kodu (utils/syncCrypto.js). Hesabla başqa
// cihazda açmaq üçün kod brauzerdə AES-256-GCM ilə şifrələnir və serverdə saxlanır
// (server/syncKeys.js → user_sync_keys). Şifrələmə açarı:
//   • password — PBKDF2-SHA256(şifrə, təsadüfi 16 bayt duz, ≥600 000 dövr). Şifrə yalnız
//     giriş/qeydiyyat/şifrə dəyişmə formasında (açıq mətn əldə olanda) istifadə olunur.
//   • prf      — passkey-in WebAuthn PRF çıxışı (32 bayt) → HKDF-SHA256(təsadüfi duz).
// salt sətri: "pbkdf2-sha256$<dövr>$<b64url>" | "hkdf-sha256$<b64url>" — dövr sayı qabın içindədir
// (gələcəkdə artırmaq köhnə qabları sındırmır).
// wrapped: base64url( 1 bayt versiya | 12 bayt IV | şifrəli kod ). AAD — qabın növü
// (password qabını prf kimi və ya əksinə "yerləşdirmək" alınmır).
// Səhv şifrə / PRF → GCM yoxlaması uğursuz → Error('unwrap') (heç vaxt yarımçıq nəticə yox).
// ═══════════════════════════════════════════════════════
import { normalizeCode, toB64url, fromB64url } from './syncCrypto'

export const PBKDF2_ITERATIONS = 600000
const MIN_ITERATIONS = 100000
const MAX_ITERATIONS = 10000000
const WRAP_VERSION = 1
const enc = new TextEncoder()
/** Passkey PRF girişi — sabit (bütün passkey-lər üçün eyni; çıxış hər passkey-də fərqlidir) */
export const PRF_INPUT = enc.encode('muslims.cc/sync-prf/v1')

const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n))
const aad = (kind) => enc.encode(`muslims.cc/sync-wrap/v1/${kind}`)

/** "pbkdf2-sha256$600000$…" → { iterations, salt } | null */
export function parsePasswordSalt(str) {
  const m = /^pbkdf2-sha256\$(\d{5,8})\$([A-Za-z0-9_-]{16,64})$/.exec(String(str || ''))
  if (!m) return null
  const iterations = Number(m[1])
  if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) return null
  return { iterations, salt: fromB64url(m[2]) }
}
export const newPasswordSalt = (iterations = PBKDF2_ITERATIONS) => `pbkdf2-sha256$${iterations}$${toB64url(randomBytes(16))}`

export function parsePrfSalt(str) {
  const m = /^hkdf-sha256\$([A-Za-z0-9_-]{16,64})$/.exec(String(str || ''))
  return m ? fromB64url(m[1]) : null
}
export const newPrfSalt = () => `hkdf-sha256$${toB64url(randomBytes(16))}`

/** Şifrə + salt sətri → AES-GCM açarı (yavaş — PBKDF2). */
export async function passwordKey(password, saltStr) {
  const p = parsePasswordSalt(saltStr)
  if (!p || typeof password !== 'string' || !password) throw new Error('bad_salt')
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: p.salt, iterations: p.iterations },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

/** PRF çıxışı (BufferSource) + salt sətri → AES-GCM açarı. */
export async function prfKey(prfOutput, saltStr) {
  const salt = parsePrfSalt(saltStr)
  const bytes = prfOutput instanceof Uint8Array ? prfOutput : new Uint8Array(prfOutput || [])
  if (!salt || bytes.length < 16) throw new Error('bad_salt')
  const base = await crypto.subtle.importKey('raw', bytes, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('muslims.cc/sync-wrap/prf') },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

/** Kodu açarla şifrələ → wrapped (base64url) */
export async function wrapCode(key, code, kind) {
  const norm = normalizeCode(code)
  if (!norm) throw new Error('bad_code')
  const iv = randomBytes(12)
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(kind) }, key, enc.encode(norm)))
  const out = new Uint8Array(1 + iv.length + ct.length)
  out[0] = WRAP_VERSION; out.set(iv, 1); out.set(ct, 13)
  return toB64url(out)
}

/** wrapped → kod. Səhv açar / pozulmuş qab → Error('unwrap'). */
export async function unwrapCode(key, wrapped, kind) {
  let all
  try { all = fromB64url(String(wrapped || '')) } catch { throw new Error('unwrap') }
  if (all.length < 13 + 16 || all[0] !== WRAP_VERSION) throw new Error('unwrap')
  let pt
  try {
    pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.subarray(1, 13), additionalData: aad(kind) }, key, all.subarray(13))
  } catch { throw new Error('unwrap') }
  const code = normalizeCode(new TextDecoder().decode(pt))
  if (!code) throw new Error('unwrap')
  return code
}

/** Rahatlıq: şifrə ilə qab → { salt, wrapped } (yeni duz) */
export async function wrapWithPassword(code, password, { iterations = PBKDF2_ITERATIONS, salt } = {}) {
  const s = salt || newPasswordSalt(iterations)
  const key = await passwordKey(password, s)
  return { salt: s, wrapped: await wrapCode(key, code, 'password'), key }
}
export async function unwrapWithPassword({ salt, wrapped }, password) {
  return unwrapCode(await passwordKey(password, salt), wrapped, 'password')
}
