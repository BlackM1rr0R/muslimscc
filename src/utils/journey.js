// ═══════════════════════════════════════════════════════
// Mənəvi səyahət (J3, J5, J6, J7, J8) — saf hesab + kiçik yazıcılar (React-sız)
//
// Hamısı istifadəçinin ÖZ yerli qeydlərindəndir; ölçülməyən heç nə göstərilmir, heç nə uydurulmur.
//   • rangeSummary  — aralığın xülasəsi (hesabın ildönümü, ad günü — son 12 ay)
//   • anniversaryOf / birthdayToday — tarix tetikləyiciləri (29 fevral → uzun olmayan ildə 28 fevral)
//   • buildTimeline — "İslam yolundakı hekayəm": tarixli hadisələr + istifadəçinin öz mərhələləri
//   • journeyLevel  — "yol mərhələsi" (iman ölçüsü DEYİL — yalnız saytdakı irəliləyiş; avatar çərçivəsi)
//   • kunya / ad günü / öz mərhələlər / "göstərildi" qeydləri — sanitize + oxu/yaz
// Açarlar (hamısı ehtiyat nüsxəyə və hesabın şifrəli sinxronizasiyasına düşür — utils/userBackup):
//   muslim_cc_kunya_v1     { p: 'abu'|'umm', n: ad, t }            — hesab səviyyəsində
//   muslim_cc_birthday_v1  { m, d, y?, t }                          — profilə aid (hər profil bir insan)
//   life_milestones_v1     { v: 1, l: [{ id, d, k, ti, no, u }] }   — profilə aid, gizli
//   mcc_celebrate_v1       { a: il, b: il }                         — ildönümü / ad günü kartı göstərilib
// tests/unit/journey.test.js
// ═══════════════════════════════════════════════════════
import { readLife, countBits } from './quranLife'
import { khatmsIn } from './ramadanAlbum'
import { ramadanRange, inRange } from './ramadanRange'
import { readPassport } from './passport'
import { sanitizeKhatm } from './worldKhatm'
import { sanitizeVisits } from './mosqueVisits'
import { readHifzDates } from './hifzDates'
import { readTaraweeh, nightsInRange } from './taraweeh'

import { DATE_RE, isObj, safeStorage, parse, localDay, sanitizeMilestones } from './journeyStore'
export * from './journeyStore'

/** Aralığın başlanğıcı: since günündən SONRAKI gün (bir il = since < gün ≤ bu gün) */
const dayAfter = (d) => {
  const [y, m, dd] = d.split('-').map(Number)
  return localDay(new Date(y, m - 1, dd + 1, 12))
}

// ── Mənbələr ──
export function gatherJourney(storage = safeStorage()) {
  const journal = parse(storage, 'dua_journal', null)
  const sf = parse(storage, 'muslim_cc_sunnah_fasts_v1', null)
  const hp = parse(storage, 'hifz_progress', {})
  let srsCount = 0
  try { const st = parse(storage, 'hifz_srs', null); srsCount = isObj(st?.items) ? Object.keys(st.items).length : 0 } catch { /* */ }
  return {
    life: readLife(storage),
    certs: parse(storage, 'quran_khatm_certs_v1', []),
    plan: parse(storage, 'quran_khatm_plan', null),
    stamps: readPassport(storage),
    dhikr: parse(storage, 'dhikr_daily_v1', {}),
    dhikrTotal: Math.max(0, parseInt(storage?.getItem?.('dhikr_count_total'), 10) || 0),
    fasts: parse(storage, 'muslim_cc_ramadan_fasts_v1', {}),
    sunnah: Array.isArray(sf?.days) ? sf.days.filter((d) => typeof d === 'string' && DATE_RE.test(d)) : [],
    album: parse(storage, 'ramadan_album_v1', null),
    duas: Array.isArray(journal?.duas) ? journal.duas : [],
    visits: sanitizeVisits(parse(storage, 'mosque_visits_v1', null)).l,
    khatm: sanitizeKhatm(parse(storage, 'world_khatm_v1', null)),
    hifz: isObj(hp) ? hp : {},
    hifzDates: readHifzDates(storage),
    srsCount,
    taraweeh: readTaraweeh(storage),
  }
}

/** Ramazan orucları (1 = tutuldu) — miladi aralıqda */
function fastsIn(src, from, to) {
  let n = 0
  for (const [y, days] of Object.entries(isObj(src.fasts) ? src.fasts : {})) {
    const r = ramadanRange(Number(y))
    if (!r || r.e < from || r.s > to || !isObj(days)) continue
    const [sy, sm, sd] = r.s.split('-').map(Number)
    for (const [k, v] of Object.entries(days)) {
      if (v !== 1) continue
      const d = localDay(new Date(sy, sm - 1, sd + Number(k) - 1, 12))
      if (d >= from && d <= to) n++
    }
  }
  return n
}

/**
 * Aralığın xülasəsi [from, to] (hər iki gün daxil). Yalnız ÖLÇÜLƏN və sıfırdan böyük göstəricilər:
 * [{ k, v }] — k: khatm | surahs | stamps | fasts | taraweeh | ramadan | dhikr | duas | mosques | ummah | ayahsLife
 * ayahsLife — ömürlük mozaikadakı fərqli ayələr (aralığa bağlı deyil; ayrıca "cəmi" kimi göstərilir).
 */
export function rangeSummary(src, from, to) {
  const r = { s: from, e: to }
  const items = []
  const add = (k, v) => { if (v > 0) items.push({ k, v }) }
  add('khatm', khatmsIn(src, r))
  let su = 0
  for (const [s, v] of Object.entries(src.life?.d || {})) if (Number(s) >= 1 && Array.isArray(v) && (inRange(v[0], r) || inRange(v[1], r))) su++
  add('surahs', su)
  add('stamps', Object.values(src.stamps || {}).filter((d) => inRange(d, r)).length)
  add('fasts', fastsIn(src, from, to) + (src.sunnah || []).filter((d) => inRange(d, r)).length)
  add('taraweeh', nightsInRange(src.taraweeh, from, to))
  add('ramadan', Object.values(isObj(src.album?.y) ? src.album.y : {}).filter((c) => isObj(c) && inRange(c.s, r)).length)
  let dh = 0
  for (const [d, n] of Object.entries(isObj(src.dhikr) ? src.dhikr : {})) if (inRange(d, r)) dh += Math.max(0, Math.floor(Number(n)) || 0)
  add('dhikr', dh)
  add('duas', (src.duas || []).filter((d) => d && inRange(d.date, r)).length)
  add('mosques', (src.visits || []).filter((v) => inRange(v.d, r)).length)
  add('ummah', Object.values(src.khatm?.r || {}).filter((x) => inRange(x.d, r)).length)
  add('ayahsLife', src.life ? countBits(src.life.e) : 0)
  return items
}

/** İldönümü xülasəsi: since < gün ≤ bu gün */
export const yearSummary = (src, since, today) => rangeSummary(src, dayAfter(since), today)

// ── Zaman xətti ──
/**
 * Tarixli hadisələr (köhnədən yeniyə): [{ d, k, ... }]
 *   k: account · khatm{n} · ramadan{y} · hifz{s} · stamp{id} · ummah{no} · mosque{n} · dua · milestone{m}
 * Yalnız TARİXİ olan qeydlər; hifz surələrinin günü — hifz_dates_v1 (ilk qeyd olunduğu gün).
 */
export function buildTimeline(src, { createdAt = null, milestones = { l: [] } } = {}) {
  const ev = []
  const ms = Number(createdAt)
  if (Number.isFinite(ms) && ms > 0) ev.push({ d: localDay(new Date(ms)), k: 'account' })
  // Xətmlər: mozaika + şəhadətnamələr + plan (eyni xətm bir dəfə)
  const kd = new Map()
  for (const k of src.life?.ks || []) if (DATE_RE.test(k?.e)) kd.set(`life:${k.e}`, k.e)
  for (const c of Array.isArray(src.certs) ? src.certs : []) {
    if (c && DATE_RE.test(c.end)) kd.set(c.src === 'life' ? `life:${c.end}` : `plan:${c.start}`, c.end)
  }
  const p = src.plan
  if (isObj(p) && DATE_RE.test(p.start) && Number(p.done) >= 604) {
    const log = Array.isArray(p.log) ? p.log.filter((d) => DATE_RE.test(d)).sort() : []
    kd.set(`plan:${p.start}`, log[log.length - 1] || p.start)
  }
  ;[...kd.values()].sort().forEach((d, i) => ev.push({ d, k: 'khatm', n: i + 1 }))
  for (const [y, c] of Object.entries(isObj(src.album?.y) ? src.album.y : {})) if (isObj(c) && DATE_RE.test(c.s)) ev.push({ d: c.s, k: 'ramadan', y: Number(y) })
  for (const [s, d] of Object.entries(src.hifzDates || {})) if (Number(src.hifz?.[s]) === 2) ev.push({ d, k: 'hifz', s: Number(s) })
  for (const [id, d] of Object.entries(src.stamps || {})) ev.push({ d, k: 'stamp', id })
  for (const [no, x] of Object.entries(src.khatm?.r || {})) if (x.d) ev.push({ d: x.d, k: 'ummah', no: Number(no) })
  const firstVisit = [...(src.visits || [])].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))[0]
  if (firstVisit) ev.push({ d: firstVisit.d, k: 'mosque', n: firstVisit.n || '' })
  const firstDua = (src.duas || []).map((x) => x?.date).filter((d) => typeof d === 'string' && DATE_RE.test(d)).sort()[0]
  if (firstDua) ev.push({ d: firstDua, k: 'dua' })
  for (const m of sanitizeMilestones(milestones).l) ev.push({ d: m.d, k: 'milestone', m })
  const ORDER = ['account', 'milestone', 'ramadan', 'khatm', 'hifz', 'stamp', 'ummah', 'mosque', 'dua']
  return ev.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : ORDER.indexOf(a.k) - ORDER.indexOf(b.k)))
}

// ── Yol mərhələsi (J7) — utils/journeyLevel.js ──
export * from './journeyLevel'
