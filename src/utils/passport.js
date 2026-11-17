// ═══════════════════════════════════════════════════════
// Mənəvi səyahət kitabçası (components/SpiritualPassport.jsx) — möhürlərin aşkarlanması
//
// Hər möhür saytın MÖVCUD yerli məlumatından hesablanır (heç nə uydurulmur):
//   khatm      — quran_khatm_plan.done ≥ 604 · quran_life_v1.k ≥ 1 · quran_khatm_certs_v1 · nişan 'khatm'
//   fajr_40    — 40 ardıcıl gün Sübh namazı vaxtında ('prayed'; utils/prayerTracker: muslim_cc_prayer_stats,
//                daily_tracker, muslim_cc_prayer_status). Heyz/nifas günləri seriyanı qırmır (computeStreak kimi).
//   names_99   — names99_practice_v1.known — 99 adın hamısı (NamesPage əzbərləmə məşqi)
//   hijra      — muslim_cc_hijra_walk (əsas yolçu) km ≥ Hicrət yolunun uzunluğu (refs.hijraKm)
//   sahaba     — muslim_cc_sahaba_album — saytdakı bütün səhabələr (seo/detailSlugs → SAHABA_SLUGS)
//   arabic     — arabic_course_v1 — bütün dərslər ≥ 70% (refs.arabicTotal; components/arabic/progress)
//   hifz_surah — hifz_progress — ən azı bir surə "əzbər" (2)
//   dhikr_1000 — dhikr_count_total ≥ 1000 (və ya nişan 'dhikr_1000')
//   kahf_4     — kahf_fridays_v1 — 4 cümə Kəhf (və ya nişan 'kahf_4')
// Qazanılma günü bir dəfə yazılır: muslim_cc_passport_v1 → { id: 'YYYY-MM-DD' } (ehtiyat
// nüsxəyə və hesab sinxronizasiyasına düşür). Nişanı olan möhürlərdə nişanın günü götürülür.
// tests/unit/passport.test.js
// ═══════════════════════════════════════════════════════
import { STATS_KEY, TRACKER_KEY, STATUS_KEY, HAYD_KEY, normHayd, earliestDate, addDays, toKey, excusedPeriod, prayerStatus } from './prayerTracker.js'
import { SAHABA_SLUGS } from '../seo/detailSlugs.js'

export const PASSPORT_KEY = 'muslim_cc_passport_v1'
export const STAMP_IDS = ['khatm', 'fajr_40', 'names_99', 'hijra', 'sahaba', 'arabic', 'hifz_surah', 'dhikr_1000', 'kahf_4']
/** Mövcud nişanla (utils/badges) üst-üstə düşən möhürlər — nişanın günü istifadə olunur */
export const STAMP_BADGE = { khatm: 'khatm', dhikr_1000: 'dhikr_1000', kahf_4: 'kahf_4' }
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }

function json(storage, key, fb) {
  try { const v = JSON.parse(storage?.getItem(key) || 'null'); return v ?? fb } catch { return fb }
}
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})

/** Ən uzun ardıcıl "Sübh vaxtında" seriyası (ilk qeyddən bu günə). Bu gün hələ qeyd olunmayıbsa seriyanı qırmır. */
export function bestFajrStreak(snap, periods = [], today = toKey()) {
  const first = earliestDate(snap)
  if (!first) return 0
  let best = 0, cur = 0, n = 0
  for (let d = first; d <= today && n < 20000; d = addDays(d, 1), n++) {
    if (excusedPeriod(periods, d, today)) continue
    if (prayerStatus(snap, d, 'fajr') === 'prayed') { cur++; if (cur > best) best = cur }
    else if (d !== today) cur = 0
  }
  return best
}

/** Möhürlər üçün xam göstəricilər (storage-dən). refs: { hijraKm, arabicTotal, arabicPassed, sahabaSlugs } */
export function passportStats(storage = safeStorage(), refs = {}, today = toKey()) {
  const plan = obj(json(storage, 'quran_khatm_plan', {}))
  const life = obj(json(storage, 'quran_life_v1', {}))
  const certs = json(storage, 'quran_khatm_certs_v1', [])
  const khatms = Math.max(
    Number(plan.done) >= 604 ? 1 : 0,
    Number.isInteger(life.k) && life.k > 0 ? life.k : 0,
    Array.isArray(life.ks) ? life.ks.length : 0,
    Array.isArray(certs) ? certs.length : 0,
  )
  let fajr = 0
  try {
    // utils/prayerTracker.loadSnapshot ilə eyni açarlar — yalnız verilən storage-dən
    const snap = { stats: obj(json(storage, STATS_KEY, {})), tracker: obj(json(storage, TRACKER_KEY, {})), status: obj(json(storage, STATUS_KEY, {})) }
    fajr = bestFajrStreak(snap, normHayd(json(storage, HAYD_KEY, {})).periods, today)
  } catch { /* */ }
  const known = obj(json(storage, 'names99_practice_v1', {})).known
  const names = Array.isArray(known) ? new Set(known.filter(n => Number.isInteger(n) && n >= 1 && n <= 99)).size : 0
  const walk = obj(json(storage, 'muslim_cc_hijra_walk', {}))
  const hijraKm = Math.round(Object.values(obj(walk.days)).reduce((s, v) => s + (Number(v) > 0 ? Number(v) : 0), 0) * 10) / 10
  const album = obj(json(storage, 'muslim_cc_sahaba_album', {}))
  const slugs = refs.sahabaSlugs || SAHABA_SLUGS
  const sahaba = slugs.filter(s => typeof album[s] === 'string').length
  const hifz = Object.values(obj(json(storage, 'hifz_progress', {}))).some(v => v === 2) ? 1 : 0
  const dhikr = Math.max(0, parseInt(storage?.getItem?.('dhikr_count_total'), 10) || 0)
  const kf = json(storage, 'kahf_fridays_v1', [])
  const kahf = Array.isArray(kf) ? new Set(kf.filter(d => typeof d === 'string' && DATE_RE.test(d))).size : 0
  return { khatms, fajr, names, hijraKm, sahaba, sahabaTotal: slugs.length, hifz, dhikr, kahf, arabicPassed: refs.arabicPassed ?? null, arabicTotal: refs.arabicTotal ?? null, hijraTotal: refs.hijraKm ?? null }
}

/** [{ id, value, goal, ready }] — ready: false → bu möhürün ölçüsü hələ yüklənməyib (refs) */
export function stampProgress(s) {
  const r = (id, value, goal) => ({ id, value: goal ? Math.min(value, goal) : value, goal, ready: goal != null && value != null })
  return [
    r('khatm', s.khatms, 1),
    r('fajr_40', s.fajr, 40),
    r('names_99', s.names, 99),
    r('hijra', s.hijraTotal != null ? Math.min(s.hijraKm, s.hijraTotal) : s.hijraKm, s.hijraTotal != null ? s.hijraTotal : null),
    r('sahaba', s.sahaba, s.sahabaTotal || null),
    r('arabic', s.arabicPassed, s.arabicTotal),
    r('hifz_surah', s.hifz, 1),
    r('dhikr_1000', s.dhikr, 1000),
    r('kahf_4', s.kahf, 4),
  ]
}

export function readPassport(storage = safeStorage()) {
  const v = obj(json(storage, PASSPORT_KEY, {}))
  const out = {}
  for (const id of STAMP_IDS) if (typeof v[id] === 'string' && DATE_RE.test(v[id])) out[id] = v[id]
  return out
}

/**
 * Möhürlərin siyahısı + yeni qazanılanların gününü yaz.
 * badges — utils/badges loadEarned() ({ id: 'YYYY-MM-DD' }); write=false — yalnız hesabla.
 * Qaytarır: { stamps: [{ id, earned, at, value, goal, ready }], fresh: [id] }
 */
export function syncPassport({ storage = safeStorage(), refs = {}, badges = {}, today = toKey(), write = true } = {}) {
  const dates = readPassport(storage)
  const prog = stampProgress(passportStats(storage, refs, today))
  const fresh = []
  const stamps = prog.map(p => {
    const badgeAt = STAMP_BADGE[p.id] && typeof badges[STAMP_BADGE[p.id]] === 'string' ? badges[STAMP_BADGE[p.id]] : null
    const hit = (p.ready && p.value >= p.goal) || Boolean(badgeAt)
    let at = dates[p.id] || null
    if (hit && !at) { at = badgeAt && badgeAt <= today ? badgeAt : today; dates[p.id] = at; fresh.push(p.id) }
    // Bir dəfə qazanılan möhür məlumat sonra silinsə də (plan sıfırlansa da) qalır
    return { ...p, earned: Boolean(at), at }
  })
  if (write && fresh.length) {
    try { storage?.setItem(PASSPORT_KEY, JSON.stringify(dates)) } catch { /* yaddaş bağlıdır */ }
  }
  return { stamps, fresh }
}
