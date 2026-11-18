// ═══════════════════════════════════════════════════════
// Uşaq rejimi kilidi (H5) — kiçik uşaq üçün sakit, məhdud sayt. Əsas paketdədir (App.jsx marşrut
// qoruyucusu sinxron oxuyur) — kiçik saxlanılır; UI tənbəl chunk-lardadır (components/kid/*).
//
// • Aktiv olanda yalnız İCAZƏLİ səhifələr açılır: uşaq bölməsi (/kids — hekayə kitabları, oyunlar,
//   surələr, dualar), Quran oxu (/quran, surələr) və dualar (/duas). Qalan hər ünvan → /kids
//   (App.jsx). AI söhbəti, axtarış, menyular, hesab, profil seçicisi, footer və xarici linklər
//   görünmür; xarici linkə klik bloklanır (components/kid/KidShell).
// • Çıxış — valideynin PIN-i (4–6 rəqəm). PIN saxlanmır: PBKDF2-SHA-256 (150 000 təkrar, 16 bayt
//   təsadüfi duz) heşi bu cihazın localStorage-indədir ("mcc_kidlock" — ehtiyat nüsxəyə / hesab
//   sinxronuna DÜŞMÜR, utils/userBackup EXCLUDE_KEYS). Səhv cəhdlər: 3-dən sonra gözləmə 30 s,
//   hər növbəti səhvdə ikiqat (ən çox 15 dəq).
// • Profillər açıqdırsa, kilid açılanda seçilən (adətən "uşaq") profilə keçilir; kilid aktiv ikən
//   profil dəyişmək də PIN tələb edir (utils/profiles → switchProfile yoxlayır, seçici gizlidir).
//
// DÜRÜST QEYD: bu, təhlükəsizlik sərhədi DEYİL. Brauzerin yaddaşını silən və ya cihazın
// tənzimləmələrinə girən böyük uşaq/yetkin onu keçə bilər. Məqsəd — kiçik uşağın təsadüfən
// saytın başqa bölmələrinə (AI, xarici saytlar) düşməməsidir.
// tests/unit/kid-lock.test.js
// ═══════════════════════════════════════════════════════

export const KIDLOCK_KEY = 'mcc_kidlock'
export const KIDLOCK_EVENT = 'mcc-kidlock'
export const KID_PAGES = ['kids', 'quran', 'duas']
export const PIN_RE = /^\d{4,6}$/
export const ITERATIONS = 150000
export const FREE_TRIES = 3
const BASE_WAIT = 30_000
const MAX_WAIT = 15 * 60_000
const B64_RE = /^[A-Za-z0-9+/]{16,88}={0,2}$/

const ls = () => { try { return globalThis.localStorage } catch { return null } }
const emit = () => { try { window.dispatchEvent(new CustomEvent(KIDLOCK_EVENT)) } catch { /* SSR */ } }

export function sanitizeLock(raw) {
  let o = raw
  if (typeof raw === 'string') { try { o = JSON.parse(raw) } catch { o = null } }
  if (!o || typeof o !== 'object') return { v: 1, on: false, pin: null, f: 0, u: 0, pid: null }
  const pin = o.pin && typeof o.pin === 'object' && B64_RE.test(o.pin.salt || '') && B64_RE.test(o.pin.hash || '')
    ? { salt: o.pin.salt, hash: o.pin.hash, it: Number.isInteger(o.pin.it) && o.pin.it >= 10000 && o.pin.it <= 2_000_000 ? o.pin.it : ITERATIONS }
    : null
  return {
    v: 1,
    on: Boolean(o.on) && Boolean(pin),       // PIN-siz kilid ola bilməz (çıxış yolu olmazdı)
    pin,
    f: Number.isInteger(o.f) && o.f > 0 ? Math.min(o.f, 1000) : 0,
    u: Number.isFinite(o.u) && o.u > 0 ? o.u : 0,
    pid: typeof o.pid === 'string' && /^p[a-z0-9]{6}$/.test(o.pid) ? o.pid : null,
  }
}

export function readLock(storage = ls()) {
  try { return sanitizeLock(storage?.getItem(KIDLOCK_KEY)) } catch { return sanitizeLock(null) }
}
function writeLock(lock, storage = ls()) {
  const c = sanitizeLock(lock)
  try { storage?.setItem(KIDLOCK_KEY, JSON.stringify(c)) } catch { /* yaddaş bağlıdır */ }
  emit()
  return c
}

export const isKidLocked = (storage = ls()) => readLock(storage).on
/** Uşaq rejimində səhifə açıla bilərmi */
export const kidAllowed = (page) => KID_PAGES.includes(page)

/** Səhv cəhdlərdən sonrakı gözləmə (ms): ilk 3 səhv — gözləmə yoxdur, sonra 30 s · 2^(f−3) */
export function backoffMs(fails) {
  if (!Number.isInteger(fails) || fails < FREE_TRIES) return 0
  return Math.min(MAX_WAIT, BASE_WAIT * 2 ** (fails - FREE_TRIES))
}

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

/** PBKDF2-SHA-256 → base64 (32 bayt) */
export async function hashPin(pin, saltB64, iterations = ITERATIONS) {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('no_crypto')
  const key = await subtle.importKey('raw', new TextEncoder().encode(String(pin)), 'PBKDF2', false, ['deriveBits'])
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(saltB64), iterations }, key, 256)
  return toB64(bits)
}

export function newSalt() {
  const b = new Uint8Array(16)
  globalThis.crypto.getRandomValues(b)
  return toB64(b)
}

/** Sabit vaxtlı müqayisə (eyni uzunluqlu sətirlər) */
function sameStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let x = 0
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return x === 0
}

/** PIN qur (və ya dəyiş) — kilidi açmır. → yeni vəziyyət */
export async function setPin(pin, storage = ls(), iterations = ITERATIONS) {
  if (!PIN_RE.test(String(pin))) throw new Error('bad_pin')
  const salt = newSalt()
  const hash = await hashPin(pin, salt, iterations)
  return writeLock({ ...readLock(storage), pin: { salt, hash, it: iterations }, f: 0, u: 0 }, storage)
}

/** Kilidi aç (PIN əvvəlcədən qurulmalıdır). pid — keçilən profil (istəyə bağlı) */
export function enableLock(storage = ls(), pid = null) {
  const cur = readLock(storage)
  if (!cur.pin) throw new Error('no_pin')
  return writeLock({ ...cur, on: true, pid }, storage)
}

/**
 * PIN-i yoxla. → { ok: true } | { ok: false, wait: ms (gözləmə qalıb) , fails }
 * Gözləmə vaxtı bitməyibsə PIN heç yoxlanmır. Doğru PIN — sayğac sıfırlanır.
 */
export async function verifyPin(pin, storage = ls(), now = Date.now()) {
  const cur = readLock(storage)
  if (!cur.pin) return { ok: false, wait: 0, fails: 0 }
  if (cur.u > now) return { ok: false, wait: cur.u - now, fails: cur.f }
  const ok = PIN_RE.test(String(pin)) && sameStr(await hashPin(pin, cur.pin.salt, cur.pin.it), cur.pin.hash)
  if (ok) { writeLock({ ...readLock(storage), f: 0, u: 0 }, storage); return { ok: true } }
  const f = cur.f + 1
  const wait = backoffMs(f)
  writeLock({ ...readLock(storage), f, u: wait ? now + wait : 0 }, storage)
  return { ok: false, wait, fails: f }
}

/** PIN ilə kilidi bağla (uşaq rejimindən çıx). → nəticə verifyPin kimi */
export async function disableWithPin(pin, storage = ls(), now = Date.now()) {
  const r = await verifyPin(pin, storage, now)
  if (r.ok) writeLock({ ...readLock(storage), on: false }, storage)
  return r
}

/** PIN-i tamamilə sil (yalnız kilid bağlı ikən) */
export function clearPin(storage = ls()) {
  if (readLock(storage).on) return false
  try { storage?.removeItem(KIDLOCK_KEY) } catch { /* */ }
  emit()
  return true
}
