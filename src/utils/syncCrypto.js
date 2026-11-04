// ═══════════════════════════════════════════════════════
// Sinxronizasiya kriptoqrafiyası (brauzer WebCrypto) — server içini görmür
//
// Bərpa kodu: 15 təsadüfi bayt (120 bit) → Crockford base32, 24 simvol,
//   "7K3M-Q9TD-…" (6 qrup). Dildən asılı deyil; O/0, I/L/1 qarışıqlığı
//   bağışlanır (normalizeCode).
// Koddan HKDF-SHA256 ilə iki müstəqil şey alınır:
//   • id  — 256 bit hex, serverə gedir (bloku tapmaq üçün)
//   • key — AES-256-GCM açarı, cihazdan ÇIXMIR
// Kodun özündə 120 bit entropiya var — yavaş KDF (PBKDF2) lazım deyil.
// Blok: base64url( 1 bayt format | 12 bayt IV | şifrəli mətn )
//   format 1 — gzip (CompressionStream varsa), 0 — sıxılmamış UTF-8.
// ═══════════════════════════════════════════════════════

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ' // Crockford (I L O U yoxdur)
const CODE_BYTES = 15
const CODE_CHARS = 24
const SALT = new TextEncoder().encode('muslims.cc/sync/v1')

/** bayt → Crockford base32 (5 bit / simvol) */
export function toBase32(bytes) {
  let bits = 0, value = 0, out = ''
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}
export function fromBase32(str) {
  let bits = 0, value = 0
  const out = []
  for (const ch of str) {
    const v = ALPHABET.indexOf(ch)
    if (v < 0) return null
    value = (value << 5) | v; bits += 5
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8 }
  }
  return new Uint8Array(out)
}

const group = (s) => s.match(/.{1,4}/g).join('-')

/** Yeni bərpa kodu: "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" */
export function generateCode() {
  const b = new Uint8Array(CODE_BYTES)
  crypto.getRandomValues(b)
  return group(toBase32(b))
}

/** İstifadəçinin yazdığı kodu təmizlə: böyük hərf, boşluq/defis yox, O→0, I/L→1. null — səhv */
export function normalizeCode(input) {
  const s = String(input || '').toUpperCase().replace(/[\s-]+/g, '').replace(/O/g, '0').replace(/[IL]/g, '1')
  if (s.length !== CODE_CHARS || [...s].some(c => !ALPHABET.includes(c))) return null
  return group(s)
}

const codeBytes = (code) => fromBase32(code.replace(/-/g, ''))

/** Koddan { id (hex), key (CryptoKey) } */
export async function deriveKeys(code) {
  const norm = normalizeCode(code)
  if (!norm) throw new Error('bad_code')
  const base = await crypto.subtle.importKey('raw', codeBytes(norm), 'HKDF', false, ['deriveBits', 'deriveKey'])
  const idBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: SALT, info: new TextEncoder().encode('id') }, base, 256)
  const key = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: SALT, info: new TextEncoder().encode('key') }, base,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  const id = [...new Uint8Array(idBits)].map(b => b.toString(16).padStart(2, '0')).join('')
  return { id, key }
}

// ── base64url ──
export function toB64url(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export function fromB64url(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function pipe(bytes, stream) {
  const buf = await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()
  return new Uint8Array(buf)
}
const canGzip = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'

/** mətn → şifrəli blok (base64url) */
export async function encryptText(key, text) {
  let data = new TextEncoder().encode(text)
  let format = 0
  if (canGzip()) { data = await pipe(data, new CompressionStream('gzip')); format = 1 }
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data))
  const out = new Uint8Array(1 + iv.length + ct.length)
  out[0] = format; out.set(iv, 1); out.set(ct, 1 + iv.length)
  return toB64url(out)
}

/** şifrəli blok → mətn. Səhv açar və ya pozulmuş blok — xəta atır (GCM yoxlaması) */
export async function decryptText(key, blob) {
  const all = fromB64url(blob)
  const format = all[0]
  const iv = all.subarray(1, 13)
  let data = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, all.subarray(13)))
  if (format === 1) {
    if (!canGzip()) throw new Error('no_gzip')
    data = await pipe(data, new DecompressionStream('gzip'))
  }
  return new TextDecoder().decode(data)
}
