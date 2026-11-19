// ═══════════════════════════════════════════════════════
// Sədəqeyi-cariyə gündəliyi (/sadaqah-jariyah) — yalnız bu cihazda, profilə aid, gizli.
// Hesabın E2E şifrəli sinxronizasiyası və ehtiyat nüsxə onu özü daşıyır (utils/userBackup).
//   sadaqah_jariyah_v1  { v: 1, l: [{ id, k, d, on?, no?, u }] }
//     k  — növ: quran | tree | taught | water | other
//     d  — gün 'YYYY-MM-DD'
//     on — "kimin adından" (istəyə bağlı, məs. vəfat etmiş yaxın)
//     no — qeyd (istəyə bağlı)
//     u  — son dəyişiklik anı (ms) — sinxronizasiyada eyni qeyd hər iki cihazda dəyişibsə təzəsi qalır
// Cəm, müqayisə, reytinq YOXDUR — yalnız siyahı.
// Birləşdirici: utils/syncMergers → MERGERS[JARIYAH_KEY]. tests/unit/jariyah-journal.test.js
// ═══════════════════════════════════════════════════════
import { cleanText as _clean } from './mosqueVisits'
import { validDay, isObj, safeStorage, parse, localDay } from './journeyStore'

export const JARIYAH_KEY = 'sadaqah_jariyah_v1'
export const JARIYAH_EVENT = 'mcc-jariyah'
export const JARIYAH_KINDS = ['quran', 'tree', 'taught', 'water', 'other']
export const ON_MAX = 60
export const NOTE_MAX = 300
export const JARIYAH_MAX = 500
const ID_RE = /^j[a-z0-9]{4,23}$/

export { localDay, safeStorage }
const cleanText = (s, max) => [..._clean(s, 10 * max)].slice(0, max).join('')
const emit = () => { try { globalThis.dispatchEvent?.(new CustomEvent(JARIYAH_EVENT)) } catch { /* */ } }

/** Bir qeyd → təmiz forma və ya null */
export function sanitizeJariyahEntry(x) {
  if (!isObj(x) || typeof x.id !== 'string' || !ID_RE.test(x.id)) return null
  if (!JARIYAH_KINDS.includes(x.k) || !validDay(x.d)) return null
  const out = { id: x.id, k: x.k, d: x.d }
  const on = cleanText(x.on, ON_MAX)
  if (on) out.on = on
  const no = cleanText(x.no, NOTE_MAX)
  if (no) out.no = no
  const u = Number(x.u)
  out.u = Number.isFinite(u) && u > 0 ? Math.round(u) : 0
  return out
}

/** Bütün dəyər → { v: 1, l } (təkrarsız, günə görə, ən çox JARIYAH_MAX) */
export function sanitizeJariyah(raw) {
  const list = Array.isArray(raw?.l) ? raw.l : []
  const seen = new Set(), l = []
  for (const x of list) { const e = sanitizeJariyahEntry(x); if (e && !seen.has(e.id)) { seen.add(e.id); l.push(e) } }
  l.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.u - b.u))
  return { v: 1, l: l.slice(-JARIYAH_MAX) }
}

export const readJariyah = (storage = safeStorage()) => sanitizeJariyah(parse(storage, JARIYAH_KEY, null))

function writeJariyah(data, storage) {
  const v = sanitizeJariyah(data)
  try { if (v.l.length) storage?.setItem(JARIYAH_KEY, JSON.stringify(v)); else storage?.removeItem(JARIYAH_KEY) } catch { /* yaddaş bağlıdır */ }
  emit()
  return v
}

export const newJariyahId = (now = Date.now(), rnd = Math.random) => `j${now.toString(36)}${Math.floor(rnd() * 1e6).toString(36)}`.slice(0, 24)

/** Əlavə et və ya (id varsa) yenilə → { ok, data, item? } */
export function saveJariyah(entry, storage = safeStorage(), now = Date.now()) {
  const cur = readJariyah(storage)
  const item = sanitizeJariyahEntry({ ...entry, id: entry?.id || newJariyahId(now), u: now })
  if (!item) return { ok: false, data: cur }
  return { ok: true, data: writeJariyah({ l: [...cur.l.filter((x) => x.id !== item.id), item] }, storage), item }
}

export function removeJariyah(id, storage = safeStorage()) {
  const cur = readJariyah(storage)
  return writeJariyah({ l: cur.l.filter((x) => x.id !== id) }, storage)
}

/** Əvvəl yazılmış "kimin adından" adları (təkrarsız, son istifadə olunan əvvəldə) — forma təklifi üçün */
export function onBehalfNames(data) {
  const out = []
  for (const e of [...(data?.l || [])].reverse()) if (e.on && !out.includes(e.on)) out.push(e.on)
  return out.slice(0, 20)
}

// Hədis bazasında Muslim 1631 (sədəqeyi-cariyə). Təkrarsız siyahıda (utils/hadithData) saxlanılan
// nüsxənin ərəbcəsi bəzən yalnız ilk cümlədir — onda ərəbcə göstərilmir (tərcümə ilə uyğunsuzluq
// olmasın), tam mətn /hadith/<id> səhifəsindədir. fullAr — hərəkəsiz ərəbcədə "صدقة جارية" varmı.
const cp = (a, b) => `${String.fromCodePoint(a)}-${String.fromCodePoint(b)}`
const TASHKEEL = new RegExp(`[${cp(0x64b, 0x65f)}${String.fromCodePoint(0x670)}]`, 'gu')
const JARIYAH_AR = 'صدقة جارية'
/** Hədis siyahısından (utils/hadithData → list) → { h, fullAr } və ya null */
export function findJariyahHadith(list) {
  const arr = Array.isArray(list) ? list : []
  const isSrc = (h) => /^Muslim\s+1631$/.test(String(h?.source || '').trim())
  const hasFull = (h) => String(h?.ar || '').replace(TASHKEEL, '').includes(JARIYAH_AR)
  const full = arr.find((h) => isSrc(h) && hasFull(h))
  if (full) return { h: full, fullAr: true }
  const any = arr.find(isSrc)
  return any ? { h: any, fullAr: false } : null
}
