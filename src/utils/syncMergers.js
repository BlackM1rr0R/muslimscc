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
import { NS } from './profileCore'
import { sanitizeGarden, GARDEN_KEY } from './duaGardenLife'
import { sanitizeVisits, combineVisit, VISITS_KEY } from './mosqueVisits'
import { mergeKhatm, KHATM_KEY } from './worldKhatm'
import { mergeLayout, LAYOUT_KEY } from './homeLayout'
import { mergeWird, WIRD_KEY } from './wird'
import { mergeShelf, SHELF_KEY } from './bookShelf'
import { mergeGoal, GOAL_KEY } from './learnGoal'
import { sanitizeTaraweeh, TARAWEEH_KEY } from './taraweeh'
import { sanitizeMilestones, sanitizeKunya, sanitizeBirthday, MILESTONES_KEY, KUNYA_KEY, BIRTHDAY_KEY, CELEBRATE_KEY } from './journeyStore'
import { HIFZ_DATES_KEY } from './hifzDates'
import { MADHAB_KEY, normMadhab } from './madhab'
import { sanitizeJariyah, JARIYAH_KEY } from './jariyahJournal'
import { sanitizePath, PATH_KEY } from './newMuslimPath'
import { sanitizeFocusPrefs, sanitizeDone, FOCUS_PREFS_KEY, FOCUS_DONE_KEY } from './focusStore'
import { sanitizeRoad, ROAD_KEY } from './roadMode'
import { sanitizeNewborn, NEWBORN_KEY } from './lifeGuides'
import { mergeLedger, DEBT_KEY } from './debtLedger'
import { mergeHaid, HAID_KEY } from './haidLog'
import { sanitizeGraves, GRAVES_KEY } from './graveVisits'

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
/** { gün: say } — gün üzrə sayğac (iki cihazın artımı toplanır), son `keepN` gün */
const dayCounter = (keepN) => json((L, R, B) => {
  const out = {}
  const Lm = isObj(L) ? L : {}, Rm = isObj(R) ? R : {}, Bm = isObj(B) ? B : null
  for (const d of new Set([...Object.keys(Lm), ...Object.keys(Rm)])) {
    if (!DATE_RE.test(d)) continue
    out[d] = mergeCounter(Lm[d], Rm[d], Bm ? (Bm[d] ?? 0) : undefined)
  }
  const keep = Object.keys(out).filter((d) => out[d] > 0).sort().slice(-keepN)
  return Object.fromEntries(keep.map((d) => [d, out[d]]))
}, { ok: isObj })

/** Massiv [{ id, … }] — id üzrə 3 tərəfli; eyni id hər iki tərəfdə fərqli dəyişibsə — both(l, r). Sıra: yerli, sonra yenilər */
const idList = (both, idOf = (x) => x?.id) => (L, R, B) => {
  const list = (a) => (Array.isArray(a) ? a.filter((x) => x && typeof x === 'object' && (typeof idOf(x) === 'string' || typeof idOf(x) === 'number')) : [])
  const byId = (a) => Object.fromEntries(list(a).map((x) => [String(idOf(x)), x]))
  const m = mergeMap3(byId(L), byId(R), byId(B), both)
  if (m === CONFLICT) return CONFLICT
  const order = [...new Set([...list(L), ...list(R)].map((x) => String(idOf(x))))]
  return order.filter((id) => id in m).map((id) => m[id])
}

/** Ramazan albomu: il üzrə; saylar — max, oxu sayğacının başlanğıcı — daha erkən ölçülən tərəfdən */
export function mergeAlbumYears(L, R) {
  const Ly = isObj(L?.y) ? L.y : {}, Ry = isObj(R?.y) ? R.y : {}
  const y = {}
  for (const k of new Set([...Object.keys(Ly), ...Object.keys(Ry)])) {
    const a = Ly[k], b = Ry[k]
    if (!isObj(a) || !isObj(b)) { y[k] = isObj(a) ? a : b; continue }
    const c = { ...a }
    for (const f of ['f', 'x', 'su', 'k', 'dh', 'du', 'da', 'ii', 'fin']) {
      const v = Math.max(Number(a[f]) || 0, Number(b[f]) || 0)
      if (v) c[f] = v; else delete c[f]
    }
    const qa = Number.isInteger(a.q0), qb = Number.isInteger(b.q0)
    if (qa || qb) {
      const first = qa && qb ? (String(b.b) < String(a.b) ? b : a) : qa ? a : b
      c.q0 = first.q0; c.b = first.b
      c.q1 = Math.max(Number(a.q1) || 0, Number(b.q1) || 0, first.q0)
    }
    y[k] = c
  }
  return { v: 1, y }
}

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
  // ── E mərhələsi ──
  // Ramazan albomu — fəsillər yalnız böyüyür (utils/ramadanAlbum)
  ramadan_album_v1: json((L, R) => mergeAlbumYears(L, R), { ok: isObj }),
  // Ömürlük dua bağçası — çiçəklər heç vaxt itmir (birlik, eyni dua — ən erkən gün)
  [GARDEN_KEY]: json((L, R) => sanitizeGarden({ b: [...(Array.isArray(L?.b) ? L.b : []), ...(Array.isArray(R?.b) ? R.b : [])] }), { ok: isObj }),
  // Məscid kolleksiyası — ziyarət üzrə 3 tərəfli (silinmə də keçir); eyni ziyarət — birləşir
  [VISITS_KEY]: json((L, R, B) => {
    const byId = (o) => Object.fromEntries(sanitizeVisits(o).l.map((v) => [v.i, v]))
    const m = mergeMap3(byId(L), byId(R), byId(B), (l, r) => combineVisit(l, r))
    const out = sanitizeVisits({ l: Object.values(m).sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)) })
    return out.l.length ? out : undefined
  }, { ok: isObj }),
  // İftar dəvətlərinin sayı { gün: say }
  muslim_cc_iftar_log_v1: dayCounter(200),
  // Dua gündəliyi { duas: [...] } — dua üzrə 3 tərəfli; eyni dua hər iki cihazda dəyişibsə:
  // "qəbul oldu" hər hansı tərəfdə qeyd olunubsa qalır (ən erkən gün), mətn — bu cihazınkı
  dua_journal: json((L, R, B) => {
    const pick = (o) => (Array.isArray(o?.duas) ? o.duas : [])
    const duas = idList((l, r) => {
      const ans = l.answered === true || r.answered === true
      const days = [l.answeredDate, r.answeredDate].filter((d) => typeof d === 'string' && d).sort()
      return { ...l, answered: ans, answeredDate: ans ? (days[0] || null) : null }
    })(pick(L), pick(R), B === undefined ? undefined : pick(B))
    return { ...(isObj(L) ? L : {}), duas }
  }, { ok: isObj }),
  // Sədəqə gündəliyi [{ id, … }] — qeyd üzrə 3 tərəfli; eyni qeyd hər iki tərəfdə dəyişibsə — bu cihazınkı
  charity_log: json((L, R, B) => idList((l) => l)(L, R, B), { ok: Array.isArray }),
  // Ümmətin Canlı Xətmi — iştirak: səhifələr birləşir, dövrün tamamlanma günü ən erkən (utils/worldKhatm)
  [KHATM_KEY]: json((L, R) => mergeKhatm(L, R), { ok: isObj }),
  // ── H mərhələsi ──
  // Şəxsi ana səhifə — hissə üzrə 3 tərəfli; hər ikisi dəyişibsə — bu cihazınkı (utils/homeLayout)
  [LAYOUT_KEY]: json((L, R, B) => mergeLayout(L, R, B), { ok: isObj }),
  // Şəxsi vird — elementlər id üzrə, işarələr gün üzrə 3 tərəfli (utils/wird)
  [WIRD_KEY]: json((L, R, B) => mergeWird(L, R, B), { ok: isObj }),
  // Mənim kitabxanam — kitab üzrə 3 tərəfli; hər ikisi dəyişibsə — təzəsi (utils/bookShelf)
  [SHELF_KEY]: json((L, R, B) => mergeShelf(L, R, B), { ok: isObj }),
  // Öyrənmə məqsədi — sonra seçilən; oxu jurnalı — birlik (utils/learnGoal)
  [GOAL_KEY]: json((L, R) => mergeGoal(L, R), { ok: isObj }),
  // Dərs yolu sekmesi (lesson/LearningPaths) — sadə sətir tərcih: bu cihazınkı
  learn_path_v1: (l, r) => (typeof l === 'string' ? l : r),
  // ── J mərhələsi ──
  // Məzhəb (əsr əmsalı, utils/madhab) — sadə tərcih: hər iki cihaz dəyişibsə bu cihazınkı
  [MADHAB_KEY]: (l, r) => (normMadhab(l) ? l : normMadhab(r) ? r : undefined),
  // Sevimli qari və pleyer ayarları (utils/quranAudio) — hər iki cihaz dəyişibsə bu cihazınkı
  quran_audio: (l, r) => { const L = parse(l); return L !== CONFLICT && isObj(L) ? l : r },
  // Kunya / ad günü { …, t } — sonra dəyişdirilən qalır
  [KUNYA_KEY]: json((L, R) => latestBy(sanitizeKunya(L), sanitizeKunya(R)), { ok: isObj }),
  [BIRTHDAY_KEY]: json((L, R) => latestBy(sanitizeBirthday(L), sanitizeBirthday(R)), { ok: isObj }),
  // Təravih { il: { gecə: rəkət } } — il və gecə üzrə 3 tərəfli; eyni gecə fərqli dəyişibsə — böyük say
  [TARAWEEH_KEY]: json((L, R, B) => {
    const m = mergeMap3(sanitizeTaraweeh(L), sanitizeTaraweeh(R), sanitizeTaraweeh(B), (l, r, b) =>
      mergeMap3(isObj(l) ? l : {}, isObj(r) ? r : {}, isObj(b) ? b : {}, (x, y) => Math.max(Number(x) || 0, Number(y) || 0)))
    const out = sanitizeTaraweeh(m)
    return Object.keys(out).length ? out : undefined
  }, { ok: isObj }),
  // Əzbər surələrin ilk günü { surə: gün } — ən erkən gün
  [HIFZ_DATES_KEY]: earliestDates,
  // Öz mərhələlər — id üzrə 3 tərəfli (silinmə də keçir); eyni mərhələ hər iki tərəfdə dəyişibsə — təzəsi (u)
  [MILESTONES_KEY]: json((L, R, B) => {
    const pick = (o) => sanitizeMilestones(o).l
    const l = idList((a, b) => ((Number(b.u) || 0) > (Number(a.u) || 0) ? b : a))(pick(L), pick(R), B === undefined ? undefined : pick(B))
    if (l === CONFLICT) return CONFLICT
    const out = sanitizeMilestones({ l })
    return out.l.length ? out : undefined
  }, { ok: isObj }),
  // ── C dəstəsi ──
  // Sədəqeyi-cariyə gündəliyi — qeyd üzrə 3 tərəfli (silinmə də keçir); eyni qeyd hər iki tərəfdə dəyişibsə — təzəsi (u)
  [JARIYAH_KEY]: json((L, R, B) => {
    const pick = (o) => sanitizeJariyah(o).l
    const l = idList((a, b) => ((Number(b.u) || 0) > (Number(a.u) || 0) ? b : a))(pick(L), pick(R), B === undefined ? undefined : pick(B))
    if (l === CONFLICT) return CONFLICT
    const out = sanitizeJariyah({ l })
    return out.l.length ? out : undefined
  }, { ok: isObj }),
  // Yeni müsəlmanın yolu — addım üzrə 3 tərəfli (işarənin götürülməsi də keçir); eyni addım iki cihazda — ən erkən gün
  [PATH_KEY]: json((L, R, B) => {
    const m = mergeMap3(sanitizePath(L).d, sanitizePath(R).d, B === undefined ? {} : sanitizePath(B).d, (l, r) => (l < r ? l : r))
    const out = sanitizePath({ d: m })
    return Object.keys(out.d).length ? out : undefined
  }, { ok: isObj }),
  // ── Yolda rejimi və diqqət seansı ──
  // Ayarlar (dəqiqələr, ayə seçimi; yolda: xatırlatma, səs, son surə) — tərcih: hər iki cihaz dəyişibsə bu cihazınkı
  [FOCUS_PREFS_KEY]: json((L, R) => sanitizeFocusPrefs(L ?? R), { ok: isObj }),
  [ROAD_KEY]: json((L, R) => sanitizeRoad(L ?? R), { ok: isObj }),
  // P2: körpənin Sünnə planı — işarələr addım üzrə 3 tərəfli (götürülməsi də keçir; iki cihazda — ən erkən gün);
  // doğum günü və "gecə" — bir tərəf dəyişibsə o, hər ikisi dəyişibsə bu cihazınkı
  [NEWBORN_KEY]: json((L, R, B) => {
    const l = sanitizeNewborn(L), r = sanitizeNewborn(R), b = B === undefined ? null : sanitizeNewborn(B)
    const d = mergeMap3(l.d, r.d, b ? b.d : {}, (x, y) => (x < y ? x : y))
    const f = mergeMap3({ b: l.b, n: l.n }, { b: r.b, n: r.n }, b ? { b: b.b, n: b.n } : {}, (x) => x)
    const out = sanitizeNewborn({ d, b: f.b, n: f.n })
    return Object.keys(out.d).length || out.b || out.n ? out : undefined
  }, { ok: isObj }),
  // P3: qəbir ziyarəti xəritəsi — nöqtə üzrə 3 tərəfli (silinmə də keçir); eyni nöqtə iki cihazda dəyişibsə — təzəsi (u)
  [GRAVES_KEY]: json((L, R, B) => {
    const pick = (o) => sanitizeGraves(o).l
    const l = idList((a, b) => ((Number(b.u) || 0) > (Number(a.u) || 0) ? b : a))(pick(L), pick(R), B === undefined ? undefined : pick(B))
    if (l === CONFLICT) return CONFLICT
    const out = sanitizeGraves({ l })
    return out.l.length ? out : undefined
  }, { ok: isObj }),
  // ── P1 ──
  // Borc dəftəri — qeyd üzrə 3 tərəfli (silinmə də keçir); eyni qeyd iki cihazda: sahələr — təzəsi (u),
  // qismən qaytarmalar — id üzrə 3 tərəfli birlik (utils/debtLedger)
  [DEBT_KEY]: json((L, R, B) => mergeLedger(L, R, B), { ok: isObj }),
  // Heyz/nifas təqvimi — qeyd üzrə 3 tərəfli, eyni qeyd — təzəsi; neytral başlıq — sonra dəyişdirilən (utils/haidLog)
  [HAID_KEY]: json((L, R, B) => mergeHaid(L, R, B), { ok: isObj }),
  // Günün bitən seansları { gün: say } — gün üzrə sayğac (iki cihazın artımı toplanır), son 14 gün
  [FOCUS_DONE_KEY]: json((L, R, B) => {
    const Lm = sanitizeDone(L), Rm = sanitizeDone(R), Bm = B === undefined ? null : sanitizeDone(B)
    const out = {}
    for (const d of new Set([...Object.keys(Lm), ...Object.keys(Rm)])) out[d] = mergeCounter(Lm[d], Rm[d], Bm ? (Bm[d] ?? 0) : undefined)
    const v = sanitizeDone(out)
    return Object.keys(v).length ? v : undefined
  }, { ok: isObj }),
  // İldönümü / ad günü kartının göstərildiyi il — sahə üzrə ən böyük
  [CELEBRATE_KEY]: json((L, R) => {
    const out = {}
    for (const k of ['a', 'b']) { const v = Math.max(Number(L?.[k]) || 0, Number(R?.[k]) || 0); if (v) out[k] = v }
    return out
  }, { ok: isObj }),
}

/** { …, t } dəyərlərindən sonra dəyişdiriləni (t böyük); bərabərdirsə — bu cihazınkı */
function latestBy(a, b) {
  if (!a) return b || undefined
  if (!b) return a
  return (Number(b.t) || 0) > (Number(a.t) || 0) ? b : a
}

/** Cihaz tərcihləri: hər iki tərəf dəyişibsə ziddiyyət deyil (avtomatik yolda bu cihazınkı qalır) */
export const PREFERENCE_KEYS = new Set(['muslim_cc_lang', 'muslim_cc_theme'])

/** Profilin ad sahəsindəki açar ("mcc_profile:<id>:dua_journal") → əsas açar (birləşdirici eynidir) */
const baseKey = (key) => {
  if (typeof key !== 'string' || !key.startsWith(NS)) return key
  const i = key.indexOf(':', NS.length)
  return i > 0 ? key.slice(i + 1) : key
}

/** Açarın birləşdiricisi: nəticə — sətir | undefined (sil) | CONFLICT */
export function runMerger(key, l, r, b) {
  key = baseKey(key)
  const fn = Object.prototype.hasOwnProperty.call(MERGERS, key) ? MERGERS[key] : null
  if (!fn) return CONFLICT
  try { return fn(l, r, b) } catch { return CONFLICT }
}
export const hasMerger = (key) => Object.prototype.hasOwnProperty.call(MERGERS, baseKey(key))
