// ═══════════════════════════════════════════════════════
// Ramazan albomu — hər Ramazan (hicri il) avtomatik "fəsil" kimi arxivlənir (saf hesab + yazıcı)
//
// Açar: ramadan_album_v1 → { v: 1, y: { '1447': fəsil } } (profilə aiddir — utils/profileCore;
// ehtiyat nüsxəyə və hesabın şifrəli sinxronizasiyasına avtomatik düşür — utils/userBackup).
// Fəsil (hamısı istifadəçinin öz qeydlərindən — heç nə uydurulmur):
//   s, e  — Ramazanın miladi günləri (Ümmül-Qura, utils/ramadanRange)
//   f, x  — tutulan / üzrlü oruclar (muslim_cc_ramadan_fasts_v1[il] — Hilal yolu, /ramadan)
//   q0,q1,b — Quran oxusu sayğacı (quran_life_v1: xətm × 6236 + cari dövrün ayələri) Ramazanda
//            İLK baxışda (b günü) və son baxışda. Gündəlik oxu tarixçəsi yoxdur — ona görə fərq
//            yalnız Ramazan ərzində sayta girəndə ölçülür; b > s — "b-dən bəri".
//   su    — Ramazanda oxunan surələr (quran_life_v1.d: ilk/son oxunuş günü aralıqdadır; ən azı)
//   k     — Ramazanda bitən xətmlər (mozaika ks + şəhadətnamələr + xətm planı; eyni xətm bir dəfə)
//   dh    — zikr cəmi (dhikr_daily_v1 — son 60 gün saxlanır, ona görə Ramazandan sonra donur)
//   du,da — dua gündəliyində Ramazanda yazılan / qəbul olunan dualar (dua_journal)
//   ii    — hazırlanan iftar dəvətləri (muslim_cc_iftar_log_v1)
//   fin   — Ramazan bitib (dəyərlər artıq yalnız artır — silinən / köhnələn məlumat fəsli pozmur)
// Qədr gecəsi qeydi saytda YOXDUR — albomda da göstərilmir.
//
// Snapshot: snapshotAlbum() idempotentdir — hər açılışda (App → boş vaxtda) çağırılır.
// tests/unit/ramadan-album.test.js
// ═══════════════════════════════════════════════════════
import { readLife, countBits, TOTAL } from './quranLife'
import { ramadanRange, ramadanYearOf, inRange } from './ramadanRange'
import { readIftarLog } from './iftarLog'

export const ALBUM_KEY = 'ramadan_album_v1'
export const ALBUM_EVENT = 'ramadan-album-change'
export const FASTS_KEY = 'muslim_cc_ramadan_fasts_v1'
const MAX_YEARS = 60
/** Göstərilən göstəricilər (sıra — albomdakı kimi) */
export const METRICS = ['f', 'q', 'k', 'su', 'dh', 'du', 'da', 'ii']
const NUM_FIELDS = ['f', 'x', 'su', 'k', 'dh', 'du', 'da', 'ii']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
const parse = (storage, k, fb) => { try { const v = JSON.parse(storage?.getItem(k) || 'null'); return v ?? fb } catch { return fb } }
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const int = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0 }

// ── Fəsil / albom ──
export function sanitizeChapter(c) {
  if (!isObj(c) || !DATE_RE.test(c.s) || !DATE_RE.test(c.e) || c.s > c.e) return null
  const out = { s: c.s, e: c.e }
  for (const f of NUM_FIELDS) { const n = int(c[f]); if (n) out[f] = n }
  if (Number.isInteger(c.q0) && c.q0 >= 0 && DATE_RE.test(c.b)) {
    out.q0 = c.q0
    out.q1 = Number.isInteger(c.q1) && c.q1 >= c.q0 ? c.q1 : c.q0
    out.b = c.b
  }
  if (c.fin === 1) out.fin = 1
  return out
}

export function sanitizeAlbum(raw) {
  const y = {}
  if (isObj(raw) && isObj(raw.y)) {
    const years = Object.keys(raw.y).filter((k) => /^\d{3,4}$/.test(k)).sort((a, b) => a - b).slice(-MAX_YEARS)
    for (const k of years) { const c = sanitizeChapter(raw.y[k]); if (c) y[k] = c }
  }
  return { v: 1, y }
}

export const readAlbum = (storage = safeStorage()) => sanitizeAlbum(parse(storage, ALBUM_KEY, null))

/** Oxunan ayə sayı (Ramazan ərzində ölçülübsə) və ya null */
export const ayahsOf = (c) => (c && Number.isInteger(c.q0) ? Math.max(0, c.q1 - c.q0) : null)

/** Göstəricinin dəyəri (q — ayələr; ölçülməyibsə null) */
export const metricOf = (c, m) => (m === 'q' ? ayahsOf(c) : (c?.[m] || 0))

// ── Mənbələr ──
/** Yaddaşdan bütün mənbələr (bir dəfə oxunur) */
export function gatherSources(storage = safeStorage()) {
  const journal = parse(storage, 'dua_journal', null)
  return {
    fasts: parse(storage, FASTS_KEY, {}),
    life: readLife(storage),
    certs: parse(storage, 'quran_khatm_certs_v1', []),
    plan: parse(storage, 'quran_khatm_plan', null),
    dhikr: parse(storage, 'dhikr_daily_v1', {}),
    duas: Array.isArray(journal?.duas) ? journal.duas : [],
    iftar: readIftarLog(storage),
  }
}

/** Oxu sayğacı: tamamlanan xətmlər × 6236 + cari dövrdə oxunan ayələr (monoton artır) */
export const readingCounter = (life) => (life ? (life.k || 0) * TOTAL + countBits(life.c) : null)

/** Aralıqda bitən xətmlərin sayı — eyni xətm (mozaika + şəhadətnamə) bir dəfə */
export function khatmsIn(src, r) {
  const ids = new Set()
  for (const k of src.life?.ks || []) if (inRange(k.e, r)) ids.add(`life:${k.e}`)
  for (const c of Array.isArray(src.certs) ? src.certs : []) {
    if (!c || !inRange(c.end, r)) continue
    ids.add(c.src === 'life' ? `life:${c.end}` : `plan:${c.start}`)
  }
  const p = src.plan
  if (isObj(p) && DATE_RE.test(p.start) && Number(p.done) >= 604) {
    const log = Array.isArray(p.log) ? p.log.filter((d) => DATE_RE.test(d)).sort() : []
    const end = log[log.length - 1] || p.start
    if (inRange(end, r)) ids.add(`plan:${p.start}`)
  }
  return ids.size
}

/** Mənbələrdən aralığın "indiki" dəyərləri */
export function currentValues(src, r) {
  const out = { f: 0, x: 0, su: 0, k: khatmsIn(src, r), dh: 0, du: 0, da: 0, ii: 0 }
  const fy = isObj(src.fasts) ? src.fasts[r.y] : null
  if (isObj(fy)) {
    for (const [d, v] of Object.entries(fy)) {
      const n = Number(d)
      if (!Number.isInteger(n) || n < 1 || n > 30) continue
      if (v === 1) out.f++
      else if (v === 2) out.x++
    }
  }
  for (const [s, v] of Object.entries(src.life?.d || {})) {
    if (Number(s) >= 1 && Array.isArray(v) && (inRange(v[0], r) || inRange(v[1], r))) out.su++
  }
  if (isObj(src.dhikr)) for (const [d, n] of Object.entries(src.dhikr)) if (inRange(d, r)) out.dh += int(n)
  for (const d of src.duas || []) {
    if (!d || typeof d !== 'object') continue
    if (inRange(d.date, r)) out.du++
    if (d.answered === true && inRange(d.answeredDate, r)) out.da++
  }
  if (isObj(src.iftar)) for (const [d, n] of Object.entries(src.iftar)) if (inRange(d, r)) out.ii += int(n)
  return out
}

/**
 * Bir fəslin yeni vəziyyəti (SAF). r — ramadanRange(il); today — 'YYYY-MM-DD'; prev — saxlanmış fəsil.
 * Ramazandan əvvəl → prev; Ramazanda → indiki dəyərlər (düzəlişlər keçir) + oxu sayğacı;
 * Ramazandan sonra → hər sahədə max(prev, indiki) — fəsil artıq kiçilmir. Boş fəsil → null.
 */
export function chapterFrom(src, r, today, prev = null) {
  if (!r || !DATE_RE.test(today) || today < r.s) return prev || null
  const during = today <= r.e
  const cur = currentValues(src, r)
  const c = { s: r.s, e: r.e }
  for (const f of NUM_FIELDS) {
    const v = during ? cur[f] : Math.max(cur[f], int(prev?.[f]))
    if (v) c[f] = v
  }
  if (prev && Number.isInteger(prev.q0)) { c.q0 = prev.q0; c.q1 = prev.q1; c.b = prev.b }
  const counter = readingCounter(src.life)
  if (during && counter != null) {
    if (c.q0 == null) { c.q0 = counter; c.q1 = counter; c.b = today }
    else c.q1 = Math.max(c.q1, counter)
  }
  if (!during) c.fin = 1
  const empty = NUM_FIELDS.every((f) => !c[f]) && c.q0 == null
  return empty ? null : sanitizeChapter(c)
}

/** Hesablanan illər: bu / son Ramazan, ondan əvvəlki, saxlanmış fəsillər, oruc qeydi olan illər */
export function albumYears(album, fasts, curY) {
  const ys = new Set([curY, curY - 1])
  for (const k of Object.keys(album?.y || {})) ys.add(Number(k))
  for (const k of Object.keys(isObj(fasts) ? fasts : {})) if (/^\d{3,4}$/.test(k)) ys.add(Number(k))
  return [...ys].filter((y) => Number.isInteger(y) && y > 0 && y <= curY).sort((a, b) => a - b)
}

/** Bütün albomun yeni vəziyyəti (SAF) */
export function computeAlbum(album, src, today) {
  const cur = ramadanYearOf(today)
  if (!cur) return album
  const y = {}
  for (const yr of albumYears(album, src.fasts, cur.y)) {
    const c = chapterFrom(src, ramadanRange(yr), today, album.y[yr] || null)
    if (c) y[yr] = c
  }
  return sanitizeAlbum({ v: 1, y })
}

export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Snapshot: hesabla, dəyişibsə yaz (idempotent). → albom */
export function snapshotAlbum(storage = safeStorage(), today = localDay()) {
  if (!storage) return { v: 1, y: {} }
  const prev = readAlbum(storage)
  const next = computeAlbum(prev, gatherSources(storage), today)
  if (JSON.stringify(next) !== JSON.stringify(prev)) {
    try {
      if (Object.keys(next.y).length) storage.setItem(ALBUM_KEY, JSON.stringify(next))
      else storage.removeItem(ALBUM_KEY)
    } catch { /* yaddaş dolub */ }
    try { globalThis.dispatchEvent?.(new CustomEvent(ALBUM_EVENT)) } catch { /* köhnə brauzer */ }
  }
  return next
}

/** Fəsillər — yenidən köhnəyə: [{ y, c, prev }] (prev — əvvəlki fəsil, müqayisə üçün) */
export function chapters(album) {
  const ys = Object.keys(album?.y || {}).map(Number).sort((a, b) => a - b)
  return ys.map((y, i) => ({ y, c: album.y[y], prev: i ? { y: ys[i - 1], c: album.y[ys[i - 1]] } : null })).reverse()
}

/** Müqayisə: { m, cur, prev, delta } — hər iki tərəfdə ölçülən göstəricilər */
export function compareChapters(c, p) {
  if (!c || !p) return []
  return METRICS.map((m) => {
    const cur = metricOf(c, m), prev = metricOf(p, m)
    return cur == null || prev == null ? null : { m, cur, prev, delta: cur - prev }
  }).filter((x) => x && (x.cur || x.prev))
}
