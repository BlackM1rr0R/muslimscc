// ═══════════════════════════════════════════════════════
// Ömürlük Quran mozaikası — oxunan ayələrin yaddaşı (saf hesab + yüngül yazıcı)
//
// Açar: quran_life_v1 (utils/userBackup — qadağan siyahısında DEYİL → ehtiyat nüsxəyə və
// hesab sinxronizasiyasına avtomatik düşür). Kompakt format (~2–6 KB):
//   { v: 1,
//     e: '<base64>'  — 6236 bitlik "nə vaxtsa oxunub" (heç vaxt silinmir)
//     c: '<base64>'  — cari dövr (xətm): hamısı dolanda k++ və c sıfırlanır
//     r: 'YYYY-MM-DD' | null — cari dövrün başlanğıcı (ilk oxunan ayənin günü)
//     k: 0           — mozaika ilə tamamlanan xətmlərin sayı
//     ks: [{ s, e }] — hər xətmin başlanğıc / son günü (≤ 100)
//     d: { '2': ['YYYY-MM-DD', 'YYYY-MM-DD'] } — surədə ilk və son oxunuş günü }
// Base64-də sondakı sıfır baytlar atılır (az oxunubsa sətir qısa olur).
//
// Yazıcı (recordAyahs → flushLife): oxuyucu (ayə ≥ 1.5 s ekranda və ya səsdə) və Mushaf
// (səhifə ≥ 10 s) ayələri növbəyə qoyur; növbə ~1.2 s sonra BİR dəfə yaddaşa yazılır
// (oxu → birləşdir → yaz: başqa tab arada yazıbsa itmir). pagehide / gizlənmə — dərhal.
// tests/unit/quran-life.test.js
// ═══════════════════════════════════════════════════════
import { TOTAL, SURAH_START, AYAH_COUNTS, refAt } from './quranMap'

export { TOTAL }
export const LIFE_KEY = 'quran_life_v1'
export const LIFE_EVENT = 'quran-life-change'
export const BYTES = Math.ceil(TOTAL / 8)
const MAX_KHATMS = 100
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// ── Bitset ──
export const newBits = () => new Uint8Array(BYTES)
export const hasBit = (b, i) => ((b[i >> 3] >> (i & 7)) & 1) === 1
export const setBit = (b, i) => { b[i >> 3] |= 1 << (i & 7) }
const POP = (() => { const t = new Uint8Array(256); for (let i = 1; i < 256; i++) t[i] = (i & 1) + t[i >> 1]; return t })()
export function countBits(b) { let n = 0; for (let i = 0; i < b.length; i++) n += POP[b[i]]; return n }

/** Uint8Array → base64 (sondakı sıfır baytlar atılır) */
export function encodeBits(b) {
  let end = b.length
  while (end > 0 && b[end - 1] === 0) end--
  let s = ''
  for (let i = 0; i < end; i++) s += String.fromCharCode(b[i])
  return s ? globalThis.btoa(s) : ''
}
/** base64 → Uint8Array(BYTES); pozuq sətir — boş bitset. TOTAL-dan sonrakı bitlər təmizlənir. */
export function decodeBits(str) {
  const out = newBits()
  if (typeof str !== 'string' || !str) return out
  let raw
  try { raw = globalThis.atob(str) } catch { return out }
  const n = Math.min(raw.length, BYTES)
  for (let i = 0; i < n; i++) out[i] = raw.charCodeAt(i) & 255
  const extra = BYTES * 8 - TOTAL
  if (extra) out[BYTES - 1] &= 0xff >> extra
  return out
}

// ── Ayə ↔ indeks ──
export function idxOf(s, a) {
  s = Number(s); a = Number(a)
  if (!Number.isInteger(s) || !Number.isInteger(a) || s < 1 || s > 114 || a < 1 || a > AYAH_COUNTS[s - 1]) return -1
  return SURAH_START[s - 1] + a - 1
}
export { refAt }

// ── Vəziyyət ──
export const emptyLife = () => ({ e: newBits(), c: newBits(), r: null, k: 0, ks: [], d: {} })

export function sanitizeLife(raw) {
  const st = emptyLife()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return st
  st.e = decodeBits(raw.e)
  st.c = decodeBits(raw.c)
  // cari dövrdə oxunan hər ayə "nə vaxtsa oxunub"-da da olmalıdır
  for (let i = 0; i < BYTES; i++) st.e[i] |= st.c[i]
  st.r = typeof raw.r === 'string' && DATE_RE.test(raw.r) ? raw.r : null
  st.ks = (Array.isArray(raw.ks) ? raw.ks : [])
    .filter(x => x && DATE_RE.test(x.s) && DATE_RE.test(x.e) && x.s <= x.e)
    .slice(-MAX_KHATMS).map(x => ({ s: x.s, e: x.e }))
  st.k = Math.max(st.ks.length, Number.isInteger(raw.k) && raw.k > 0 ? raw.k : 0)
  if (raw.d && typeof raw.d === 'object' && !Array.isArray(raw.d)) {
    for (const [k, v] of Object.entries(raw.d)) {
      const s = Number(k)
      if (Number.isInteger(s) && s >= 1 && s <= 114 && Array.isArray(v) && DATE_RE.test(v[0]) && DATE_RE.test(v[1])) {
        st.d[s] = v[0] <= v[1] ? [v[0], v[1]] : [v[1], v[0]]
      }
    }
  }
  return st
}

export function serializeLife(st) {
  const out = { v: 1, e: encodeBits(st.e), c: encodeBits(st.c), r: st.r, k: st.k, ks: st.ks, d: st.d }
  if (!out.ks.length) delete out.ks
  if (!out.r) delete out.r
  return out
}

export function readLife(storage = safeStorage()) {
  try { return sanitizeLife(JSON.parse(storage?.getItem(LIFE_KEY) || 'null')) } catch { return emptyLife() }
}
export function writeLife(st, storage = safeStorage()) {
  try { storage?.setItem(LIFE_KEY, JSON.stringify(serializeLife(st))); return true } catch { return false }
}

/**
 * Ayələri oxunmuş kimi qeyd et (SAF: yeni vəziyyət qaytarır).
 * indices — ümumi indekslər (0…6235). Qaytarır: { st, added, changed, khatm }
 *   added — cari dövrə yeni düşən ayələr; khatm — bu çağırışda tamamlanan xətm ({ s, e, n }) və ya null.
 */
export function applyRead(prev, indices, today = localDay()) {
  const st = { e: prev.e.slice(), c: prev.c.slice(), r: prev.r, k: prev.k, ks: prev.ks.slice(), d: { ...prev.d } }
  let added = 0, changed = false, khatm = null
  const surahs = new Set()
  for (const raw of indices || []) {
    const i = Number(raw)
    if (!Number.isInteger(i) || i < 0 || i >= TOTAL) continue
    if (!hasBit(st.e, i)) { setBit(st.e, i); changed = true }
    if (!hasBit(st.c, i)) { setBit(st.c, i); added++; changed = true; if (!st.r) st.r = today }
    surahs.add(refAt(i).s)
  }
  for (const s of surahs) {
    const cur = st.d[s]
    const next = cur ? [cur[0] <= today ? cur[0] : today, cur[1] >= today ? cur[1] : today] : [today, today]
    if (!cur || cur[0] !== next[0] || cur[1] !== next[1]) { st.d[s] = next; changed = true }
  }
  if (added && countBits(st.c) >= TOTAL) {
    st.k += 1
    khatm = { s: st.r || today, e: today, n: st.k }
    st.ks = [...st.ks, { s: khatm.s, e: khatm.e }].slice(-MAX_KHATMS)
    st.c = newBits()
    st.r = null
  }
  return { st, added, changed, khatm }
}

/** Statistika: { ever, current, pct, surahsDone, khatms, round } */
export function lifeStats(st) {
  const ever = countBits(st.e)
  let surahsDone = 0
  for (let s = 0; s < 114; s++) {
    let all = true
    for (let i = SURAH_START[s], end = i + AYAH_COUNTS[s]; i < end; i++) if (!hasBit(st.e, i)) { all = false; break }
    if (all) surahsDone++
  }
  const current = countBits(st.c)
  return { ever, current, pct: ever / TOTAL, surahsDone, khatms: st.k, round: st.k > 0 ? current / TOTAL : ever / TOTAL }
}

/** Mushaf səhifəsinin sözlərindən (utils/mushaf compactPage → words[{ s, a }]) unikal ayələr */
export function pageAyahs(words) {
  const seen = new Set(), out = []
  for (const w of words || []) {
    const i = idxOf(w?.s, w?.a)
    if (i >= 0 && !seen.has(i)) { seen.add(i); out.push(i) }
  }
  return out
}

// ── Yazıcı (yan təsirli) ──
const pending = new Set()
let timer = 0
let bound = false

function bindFlush() {
  if (bound || typeof window === 'undefined') return
  bound = true
  window.addEventListener('pagehide', () => flushLife())
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') flushLife() })
}

/** refs — [{ s, a }] və ya ümumi indekslər. Yazma gecikdirilir və birləşdirilir. */
export function recordAyahs(refs, { delay = 1200 } = {}) {
  for (const r of refs || []) {
    const i = typeof r === 'number' ? r : idxOf(r?.s, r?.a)
    if (i >= 0 && i < TOTAL) pending.add(i)
  }
  if (!pending.size) return
  bindFlush()
  if (!timer) timer = setTimeout(() => flushLife(), delay)
}

/** Növbəni yaddaşa yaz. Qaytarır: applyRead nəticəsi və ya null */
export function flushLife(storage = safeStorage(), today = localDay()) {
  clearTimeout(timer)
  timer = 0
  if (!pending.size) return null
  const res = applyRead(readLife(storage), [...pending], today)
  pending.clear()
  if (res.changed) {
    writeLife(res.st, storage)
    try { globalThis.dispatchEvent?.(new CustomEvent(LIFE_EVENT, { detail: { added: res.added, khatm: res.khatm } })) } catch { /* köhnə brauzer */ }
    // Xətm tamamlandı — böyük təbrik (celebrate → nişanların yoxlanışı da)
    if (res.khatm && typeof document !== 'undefined') import('./celebrate').then(m => m.celebrate({ size: 'big' })).catch(() => {})
  }
  return res
}

/** Testlər üçün: növbəni boşalt */
export function _resetRecorder() { clearTimeout(timer); timer = 0; pending.clear() }
