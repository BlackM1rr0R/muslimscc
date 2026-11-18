// ═══════════════════════════════════════════════════════
// Yol mərhələsi (J7) — avatar çərçivəsi üçün (yüngül modul: başlıqda da işləyir)
//
// "Mərhələ" — saytdakı irəliləyişin ölçüsüdür, iman / dərəcə ölçüsü DEYİL (dini iddia yoxdur).
// Xal: hər xətm 10, hər mənəvi səyahət möhürü 3, iştirak etdiyiniz Ümmət xətmi dövrü 2,
// hər 10 əzbər ayə 1. Mərhələlər: 0 · 10 · 30 · 70 · 150 xal. Gizlidir — yalnız sizə görünür.
// tests/unit/journey.test.js
// ═══════════════════════════════════════════════════════
import { AYAH_COUNTS } from './quranMap'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
const parse = (storage, k, fb) => { try { const v = JSON.parse(storage?.getItem(k) || 'null'); return v ?? fb } catch { return fb } }

/** Səviyyə üçün lazım olan mənbələr (bitset açılmır — yalnız JSON sahələri) */
export function gatherLevel(storage = safeStorage()) {
  const life = parse(storage, 'quran_life_v1', null)
  const st = parse(storage, 'hifz_srs', null)
  const pp = parse(storage, 'muslim_cc_passport_v1', {})
  const wk = parse(storage, 'world_khatm_v1', null)
  return {
    life: isObj(life) ? { k: Number.isInteger(life.k) ? life.k : 0, ks: Array.isArray(life.ks) ? life.ks : [] } : null,
    certs: parse(storage, 'quran_khatm_certs_v1', []),
    plan: parse(storage, 'quran_khatm_plan', null),
    stamps: Object.fromEntries(Object.entries(isObj(pp) ? pp : {}).filter(([, d]) => typeof d === 'string' && DATE_RE.test(d))),
    khatm: { r: isObj(wk?.r) ? wk.r : {} },
    hifz: parse(storage, 'hifz_progress', {}),
    srsCount: isObj(st?.items) ? Object.keys(st.items).length : 0,
  }
}

/** Xal: hər xətm 10, hər möhür 3, Ümmət xətmi dövrü 2, hər 10 əzbər ayə 1 */
export const LEVEL_POINTS = { khatm: 10, stamp: 3, ummah: 2, ayahs10: 1 }
/** Mərhələlərin başlanğıc xalları: Başlanğıc · Yolçu · Davamlı · Təcrübəli · Uzun yol */
export const LEVEL_THRESHOLDS = [0, 10, 30, 70, 150]

/** Əzbər ayələr: hifz təkrar siyahısındakı ayələr və ya "əzbər" surələrin ayələri (hansı çoxdursa) */
export function memorisedAyahs(src) {
  let bySurah = 0
  for (const [s, v] of Object.entries(src.hifz || {})) if (Number(v) === 2 && AYAH_COUNTS[Number(s) - 1]) bySurah += AYAH_COUNTS[Number(s) - 1]
  return Math.max(bySurah, Number(src.srsCount) || 0)
}

export function levelFromCounts({ khatms = 0, stamps = 0, ummah = 0, ayahs = 0 }) {
  const points = khatms * LEVEL_POINTS.khatm + stamps * LEVEL_POINTS.stamp + ummah * LEVEL_POINTS.ummah + Math.floor(ayahs / 10) * LEVEL_POINTS.ayahs10
  let stage = 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) if (points >= LEVEL_THRESHOLDS[i]) stage = i
  const next = LEVEL_THRESHOLDS[stage + 1] ?? null
  return { points, stage, next, parts: { khatms, stamps, ummah, ayahs } }
}

export function journeyLevel(src) {
  const kd = new Set()
  for (const k of src.life?.ks || []) if (DATE_RE.test(k?.e)) kd.add(`life:${k.e}`)
  for (const c of Array.isArray(src.certs) ? src.certs : []) if (c && DATE_RE.test(c.end)) kd.add(c.src === 'life' ? `life:${c.end}` : `plan:${c.start}`)
  if (isObj(src.plan) && Number(src.plan.done) >= 604 && DATE_RE.test(src.plan.start)) kd.add(`plan:${src.plan.start}`)
  return levelFromCounts({
    khatms: Math.max(kd.size, Number(src.life?.k) || 0),
    stamps: Object.keys(src.stamps || {}).length,
    ummah: Object.values(src.khatm?.r || {}).filter((x) => DATE_RE.test(x?.d)).length,
    ayahs: memorisedAyahs(src),
  })
}

/** Cari mərhələ (yaddaşdan) */
export const currentLevel = (storage = safeStorage()) => journeyLevel(gatherLevel(storage))
