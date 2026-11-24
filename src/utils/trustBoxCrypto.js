// ═══════════════════════════════════════════════════════
// "Əmanət qutusu" kriptoqrafiyası (brauzer WebCrypto) — server parolu və açıq mətni GÖRMÜR
//
// Mövcud primitivlər təkrar istifadə olunur:
//   • açar — utils/syncWrap.passwordKey: PBKDF2-SHA256(parol, təsadüfi 16 bayt duz, 600 000 dövr) → AES-256-GCM
//     (salt sətri "pbkdf2-sha256$600000$<b64url>" — dövr sayı içindədir, server ≥ 600 000 tələb edir)
//   • base64url, Crockford kod generatoru — utils/syncCrypto
// Blok: base64url( 1 bayt versiya | 12 bayt IV | AES-GCM(JSON) ), AAD = "muslims.cc/trust-box/v1".
// Səhv parol → GCM yoxlaması uğursuz → Error('wrong_passphrase') (yarımçıq nəticə yoxdur).
//
// Parol normallaşdırılır (kağızdan köçürəndə səhv olmasın): NFC, kənar boşluqlar atılır, ardıcıl boşluqlar
// bir boşluq olur; "XXXX-XXXX-…" (24 simvollu yaradılmış kod) böyük/kiçik hərf və defisdən asılı deyil.
//
// Keçid tokeni (32 bayt) BRAUZERDƏ yaranır; serverə yalnız SHA-256 heşi gedir (linkHash).
// Məzmun (sanitizePayload): { v, from, will, debts:[{ k, p, a, cu, no, ref? }], docs, words, link, savedAt }
// tests/unit/trust-box-crypto.test.js
// ═══════════════════════════════════════════════════════
import { toB64url, fromB64url, generateCode, normalizeCode } from './syncCrypto'
import { newPasswordSalt, passwordKey, parsePasswordSalt, PBKDF2_ITERATIONS } from './syncWrap'

export const BOX_VERSION = 1
export const PASS_MIN = 12
export const LIMITS = { from: 80, will: 8000, docs: 4000, words: 8000, person: 60, note: 300, debts: 300 }
export const DEBT_KINDS = ['owe', 'owed']
const AAD = new TextEncoder().encode('muslims.cc/trust-box/v1')
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
const CUR_RE = /^[A-Z]{3}$/
const REF_RE = /^d[a-z0-9]{4,23}$/

/** Parolu kağızdan köçürməyə dözümlü formaya sal (həm şifrələmədə, həm açanda eyni) */
export function normalizePassphrase(p) {
  const s = String(p == null ? '' : p).normalize('NFC').replace(/\s+/g, ' ').trim()
  return normalizeCode(s) || s
}

/** null — yararlıdır; 'short' | 'weak' — yox */
export function checkPassphrase(p) {
  const s = normalizePassphrase(p)
  if ([...s].length < PASS_MIN) return 'short'
  if (new Set(s.toLowerCase()).size < 5) return 'weak'
  if (/^(?:\d+|(.)\1+)$/.test(s) || /^(?:0123456789|1234567890|qwerty|password|parol)/i.test(s.replace(/\s/g, ''))) return 'weak'
  return null
}

/** Təsadüfi güclü parol (120 bit): "7K3M-Q9TD-…" — dildən asılı deyil, kağıza yazmaq rahatdır */
export const generatePassphrase = () => generateCode()

const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n))

/** Yeni keçid tokeni (43 simvol base64url, 256 bit) */
export const newLinkToken = () => toB64url(randomBytes(32))
export const validToken = (t) => typeof t === 'string' && TOKEN_RE.test(t)

/** token → SHA-256 hex (serverə gedən yeganə şey) */
export async function linkHashOf(token) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(token)))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** URL fraqmenti → token | null ("#t=…") */
export function parseTrustHash(hash) {
  const m = /(?:^#|&)t=([A-Za-z0-9_-]{43})(?:&|$)/.exec(String(hash || ''))
  return m ? m[1] : null
}

// ── Məzmun ──
const str = (v, max) => [...String(typeof v === 'string' ? v : '').normalize('NFC').replace(/\r\n?/g, '\n')
  .replace(/\p{Cc}/gu, (c) => (c === '\n' || c === '\t' ? c : ''))].slice(0, max).join('')
function cleanAmount(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 && n <= 1e12 ? Math.round(n * 100) / 100 : null
}
export function sanitizeDebt(x) {
  if (!x || typeof x !== 'object') return null
  const k = DEBT_KINDS.includes(x.k) ? x.k : 'owe'
  const p = str(x.p, LIMITS.person).trim()
  const no = str(x.no, LIMITS.note).trim()
  const a = cleanAmount(x.a)
  if (!p && !no && a == null) return null
  const cu = typeof x.cu === 'string' && CUR_RE.test(x.cu) ? x.cu : ''
  const out = { k, p, a, cu, no }
  if (typeof x.ref === 'string' && REF_RE.test(x.ref)) out.ref = x.ref
  return out
}
export const emptyPayload = () => ({ v: BOX_VERSION, from: '', will: '', debts: [], docs: '', words: '', link: '', savedAt: 0 })
export function sanitizePayload(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  return {
    v: BOX_VERSION,
    from: str(r.from, LIMITS.from),
    will: str(r.will, LIMITS.will),
    debts: (Array.isArray(r.debts) ? r.debts : []).map(sanitizeDebt).filter(Boolean).slice(0, LIMITS.debts),
    docs: str(r.docs, LIMITS.docs),
    words: str(r.words, LIMITS.words),
    link: validToken(r.link) ? r.link : '',
    savedAt: Number.isFinite(r.savedAt) && r.savedAt > 0 ? r.savedAt : 0,
  }
}
/** Qutuda yazılmış bir şey varmı? */
export const hasContent = (p) => Boolean(p && (p.from.trim() || p.will.trim() || p.docs.trim() || p.words.trim() || p.debts.length))

/**
 * Borc dəftərindən (utils/debtLedger) açıq borcları gətir: qalıq məbləğ, valyuta, şəxs, qeyd.
 * Əvvəl gətirilmiş (ref eyni) sətirlər yenilənir — təkrar gətirmə dublikat yaratmır; əl ilə yazılanlar qalır.
 * ledger — { l: [...] }, remainingOf — debtLedger.remaining, settled — debtLedger.isSettled
 */
export function importDebts(current, ledger, { remainingOf, settled }) {
  const open = (ledger?.l || []).filter((e) => !settled(e))
  const fresh = open.map((e) => sanitizeDebt({ k: e.k, p: e.p, a: remainingOf(e), cu: e.cu, no: e.no || '', ref: e.id })).filter(Boolean)
  const refs = new Set(fresh.map((d) => d.ref))
  const kept = (current || []).filter((d) => !d.ref || !refs.has(d.ref))
  return { debts: [...kept, ...fresh].slice(0, LIMITS.debts), added: fresh.length }
}

// ── Şifrələmə ──
/** Parol + salt sətri → AES-GCM açarı (yavaş: PBKDF2) */
export async function deriveBoxKey(passphrase, salt) {
  if (!parsePasswordSalt(salt)) throw new Error('bad_salt')
  const p = normalizePassphrase(passphrase)
  if (!p) throw new Error('wrong_passphrase')
  return passwordKey(p, salt)
}
export const newBoxSalt = () => newPasswordSalt(PBKDF2_ITERATIONS)

export async function encryptPayload(key, payload) {
  const iv = randomBytes(12)
  const data = new TextEncoder().encode(JSON.stringify(sanitizePayload(payload)))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: AAD }, key, data))
  const out = new Uint8Array(1 + iv.length + ct.length)
  out[0] = BOX_VERSION; out.set(iv, 1); out.set(ct, 13)
  return toB64url(out)
}

export async function decryptPayload(key, blob) {
  let all
  try { all = fromB64url(String(blob || '')) } catch { throw new Error('bad_blob') }
  if (all.length < 1 + 12 + 16 || all[0] !== BOX_VERSION) throw new Error('bad_blob')
  let pt
  try {
    pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.subarray(1, 13), additionalData: AAD }, key, all.subarray(13))
  } catch { throw new Error('wrong_passphrase') }
  try { return sanitizePayload(JSON.parse(new TextDecoder().decode(pt))) } catch { throw new Error('bad_blob') }
}

/** Rahatlıq: parol ilə möhürlə → { salt, blob, key } (salt verilməsə yeni duz) */
export async function sealBox(payload, passphrase, { salt, key } = {}) {
  const s = salt || newBoxSalt()
  const k = key || await deriveBoxKey(passphrase, s)
  return { salt: s, blob: await encryptPayload(k, payload), key: k }
}
/** { salt, blob } + parol → { payload, key } */
export async function openBox({ salt, blob }, passphrase) {
  const key = await deriveBoxKey(passphrase, salt)
  return { payload: await decryptPayload(key, blob), key }
}
