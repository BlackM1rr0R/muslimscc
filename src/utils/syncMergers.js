// ═══════════════════════════════════════════════════════
// Açara xas birləşdiricilər — sinxronizasiyada hər iki cihaz EYNİ açarı dəyişəndə
// (utils/syncMerge → mergeData; həm avtomatik 409 yolu, həm yeni cihazın hesaba qoşulması).
//
// Hər birləşdirici SAF funksiyadır: (local, remote, base) → yeni xam sətir | undefined (sil) | CONFLICT
//   local / remote — localStorage-dəki xam sətir (JSON); base — son sinxronlanmış dəyər və ya
//   undefined (baza yoxdur: yeni cihaz / IndexedDB yoxdur → birləşmə "birlik" kimi işləyir,
//   silinmələr tanınmır). Oxunmayan JSON → CONFLICT (köhnə davranış: istifadəçi seçir).
// tests/unit/sync-mergers.test.js
// ═══════════════════════════════════════════════════════
import { mergeLife, sanitizeLife, serializeLife, LIFE_KEY } from './quranLife'
import { mergeNotes, NOTES_KEY } from './quranNotes'
import { sanitizeCerts, CERTS_KEY } from './khatmCert'

export const CONFLICT = Symbol('conflict')

const parse = (s) => { if (s === undefined) return undefined; try { return JSON.parse(s) } catch { return CONFLICT } }
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** JSON sətirlərini oxu, fn-ə ver; fn-in nəticəsi yenidən sətirə çevrilir */
const json = (fn, { ok = () => true } = {}) => (l, r, b) => {
  const L = parse(l), R = parse(r), B = parse(b)
  if (L === CONFLICT || R === CONFLICT || (L !== undefined && !ok(L)) || (R !== undefined && !ok(R))) return CONFLICT
  const out = fn(L, R, B === CONFLICT || (B !== undefined && !ok(B)) ? undefined : B)
  if (out === CONFLICT || out === undefined) return out
  return JSON.stringify(out)
}

/**
 * 3 tərəfli çoxluq: hər iki tərəfdə olan, ya da bir tərəfdə ƏLAVƏ olunan (bazada olmayan)
 * elementlər qalır; bazada olub bir tərəfdə silinən — silinir. Sıra: yerli, sonra serverdəki yenilər.
 * idOf — elementin kimliyi (primitivlər üçün özü).
 */
export function mergeSet3(local = [], remote = [], base = [], idOf = (x) => x) {
  const ids = (a) => new Set((Array.isArray(a) ? a : []).map(idOf))
  const Li = ids(local), Ri = ids(remote), Bi = ids(base)
  const keep = (id) => (Li.has(id) && Ri.has(id)) || (Li.has(id) && !Bi.has(id)) || (Ri.has(id) && !Bi.has(id))
  const out = [], seen = new Set()
  for (const x of [...(Array.isArray(local) ? local : []), ...(Array.isArray(remote) ? remote : [])]) {
    const id = idOf(x)
    if (seen.has(id) || !keep(id)) continue
    seen.add(id)
    out.push(x)
  }
  return out
}

/**
 * 3 tərəfli xəritə (açar üzrə): bir tərəfdə dəyişən götürülür; bir tərəfdə silinib digərində
 * dəyişməyibsə — silinir; bir tərəfdə silinib digərində dəyişibsə — dəyişən qalır;
 * hər iki tərəf fərqli dəyişibsə — both(l, r, b) (CONFLICT qaytara bilər).
 */
export function mergeMap3(local, remote, base, both) {
  const L = isObj(local) ? local : {}, R = isObj(remote) ? remote : {}, B = isObj(base) ? base : {}
  const out = {}
  for (const k of new Set([...Object.keys(L), ...Object.keys(R), ...Object.keys(B)])) {
    const l = L[k], r = R[k], b = B[k]
    let v
    if (same(l, r)) v = l
    else if (same(l, b)) v = r
    else if (same(r, b)) v = l
    else if (l === undefined || r === undefined) v = l === undefined ? r : l
    else v = both(l, r, b, k)
    if (v === CONFLICT) return CONFLICT
    if (v !== undefined) out[k] = v
  }
  return out
}

const num = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : 0 }
/** Sayğac: bazadan hər iki cihazın artımı toplanır; baza yoxdursa (və ya azalıbsa) — max */
export function mergeCounter(l, r, b) {
  const L = num(l), R = num(r)
  if (b !== undefined) {
    const B = num(b)
    if (L >= B && R >= B) return L + R - B
  }
  return Math.max(L, R)
}

/** { id: 'YYYY-MM-DD' } — hər iki tərəfin qeydləri, eyni id-də ən erkən gün (nişan/möhür bir dəfə qazanılır) */
const earliestDates = json((L, R) => {
  const out = {}
  for (const src of [L, R]) {
    for (const [k, v] of Object.entries(isObj(src) ? src : {})) {
      if (typeof v !== 'string') continue
      if (!(k in out) || v < out[k]) out[k] = v
    }
  }
  return out
}, { ok: isObj })

/** Massivdən ibarət "sevimlilər" (id-lər) — 3 tərəfli çoxluq */
const idSet = (idOf) => json((L, R, B) => mergeSet3(L, R, B, idOf), { ok: Array.isArray })

/** İç-içə xəritə { gün: { sahə: dəyər } } — gün üzrə, sonra sahə üzrə 3 tərəfli; sahədə fərqli dəyişiklik → CONFLICT */
const dayFieldMap = json((L, R, B) => mergeMap3(L, R, B, (l, r, b) =>
  isObj(l) && isObj(r) ? mergeMap3(l, r, isObj(b) ? b : {}, () => CONFLICT) : CONFLICT), { ok: isObj })

export const MERGERS = {
  // Ömürlük Quran mozaikası — oxunuşlar heç vaxt itmir (OR)
  [LIFE_KEY]: json((L, R) => serializeLife(mergeLife(sanitizeLife(L), sanitizeLife(R))), { ok: isObj }),
  // Ayə qeydləri — ayə üzrə 3 tərəfli; eyni ayə: yenisi + digərinin mətni tarixçədə
  [NOTES_KEY]: (l, r, b) => {
    const L = parse(l), R = parse(r), B = parse(b)
    if (L === CONFLICT || R === CONFLICT) return CONFLICT
    const out = mergeNotes(L, R, B === CONFLICT ? {} : B)
    return Object.keys(out).length ? JSON.stringify(out) : undefined
  },
  // Ömürlük zikr sayğacı — iki cihazın artımı toplanır
  dhikr_count_total: (l, r, b) => String(mergeCounter(l, r, b)),
  // Günlük zikr sayı { gün: say } — gün üzrə sayğac, son 60 gün (utils/myDay)
  dhikr_daily_v1: json((L, R, B) => {
    const out = {}
    const Lm = isObj(L) ? L : {}, Rm = isObj(R) ? R : {}, Bm = isObj(B) ? B : null
    for (const d of new Set([...Object.keys(Lm), ...Object.keys(Rm)])) {
      out[d] = mergeCounter(Lm[d], Rm[d], Bm ? (Bm[d] ?? 0) : undefined)
    }
    const keep = Object.keys(out).sort().slice(-60)
    return Object.fromEntries(keep.map((d) => [d, out[d]]))
  }, { ok: isObj }),
  // Sevimlilər / saxlanılanlar — əlavə və silinmə hər iki tərəfdən
  quran_saved_ayahs: json((L, R, B) => mergeSet3(L, R, B, (x) => `${x?.s}:${x?.a}`)
    .sort((x, y) => (Number(y?.t) || 0) - (Number(x?.t) || 0)), { ok: Array.isArray }),
  hadith_favs: idSet((x) => (typeof x === 'object' ? JSON.stringify(x) : x)),
  dua_favs: idSet((x) => (typeof x === 'object' ? JSON.stringify(x) : x)),
  hisn_favs_v1: idSet((x) => (typeof x === 'object' ? JSON.stringify(x) : x)),
  kahf_fridays_v1: json((L, R, B) => mergeSet3(L, R, B).filter((d) => typeof d === 'string' && DATE_RE.test(d)).sort().slice(-60), { ok: Array.isArray }),
  // Möhür / nişan günləri — bir dəfə qazanılır, ən erkən gün
  muslim_cc_passport_v1: earliestDates,
  qm_badges_v1: earliestDates,
  // Xətm şəhadətnamələri — id üzrə 3 tərəfli; eyni id hər iki tərəfdə redaktə olunubsa — bu cihazınkı
  [CERTS_KEY]: json((L, R, B) => {
    const byId = (a) => Object.fromEntries((Array.isArray(a) ? a : []).filter((c) => c && typeof c.id === 'string').map((c) => [c.id, c]))
    const m = mergeMap3(byId(L), byId(R), byId(B), (l) => l)
    const list = sanitizeCerts(Object.values(m).sort((x, y) => (x.end < y.end ? -1 : x.end > y.end ? 1 : 0)))
    return list.length ? list : undefined
  }, { ok: Array.isArray }),
  // Namaz: { 'YYYY-MM-DD_Fajr': true } — açar üzrə; hər ikisi "true"-dursa eynidir
  muslim_cc_prayer_stats: json((L, R, B) => mergeMap3(L, R, B, (l, r) => (l && r ? l : CONFLICT)), { ok: isObj }),
  // { gün: { namaz/əməl: dəyər } } — gün və sahə üzrə; eyni günün eyni sahəsi fərqli dəyişibsə — ziddiyyət
  daily_tracker: dayFieldMap,
  muslim_cc_prayer_status: dayFieldMap,
}

/** Cihaz tərcihləri: hər iki tərəf dəyişibsə ziddiyyət deyil (avtomatik yolda bu cihazınkı qalır) */
export const PREFERENCE_KEYS = new Set(['muslim_cc_lang', 'muslim_cc_theme'])

/** Açarın birləşdiricisi: nəticə — sətir | undefined (sil) | CONFLICT */
export function runMerger(key, l, r, b) {
  const fn = Object.prototype.hasOwnProperty.call(MERGERS, key) ? MERGERS[key] : null
  if (!fn) return CONFLICT
  try { return fn(l, r, b) } catch { return CONFLICT }
}
export const hasMerger = (key) => Object.prototype.hasOwnProperty.call(MERGERS, key)
