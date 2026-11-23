// ═══════════════════════════════════════════════════════
// Şəri ölçü vahidləri (/sharia-units) — metrik qarşılıqlar
//
// QAYDA: dəyər ya saytın öz məlumatından gəlir ('site'), ya ondan sadə hesabla çıxarılır ('derived' —
// nisbət açıq yazılır), ya da saytda yoxdursa — aralıqlı alim TƏXMİNİ kimi etiketlənir ('estimate').
// Mənbələr (saytda):
//   • sa' ≈ 3 kq əsas qida — fitrə hesablayıcısı (pages/ZakatPage → SAA_KG; islamqa 1396);
//     yarım sa' ≈ 1,5 kq — kəffarə hesablayıcısı (components/KaffarahCalc)
//   • mudd ≈ 0,5–0,75 L su — "Bir mudd su" (utils/muddWater; Müslim 325 (Heyz kitabı, № 51): "sa' ilə qüsl, mudd ilə dəstəmaz")
//   • 20 misqal qızıl ≈ 85 q, 140 misqal gümüş ≈ 595 q — dərs "Fiqh sualları" (data/lessons/fiqh-faq);
//     nisab 85 q / 595 q — zəkat hesablayıcısı (ZakatPage → NISAB_GOLD_G / NISAB_SILVER_G)
//   • səfər məsafəsi 48 mil ≈ 80 km (bəzi alimlər ≈ 83 km) — dərs "Müsafirin namazı" (data/lessons/travel-prayer)
// Nisbətlər (alimlərin qəbul etdiyi): 1 sa' = 4 mudd; 1 dinar = 1 misqal qızıl; 200 dirhəm = 140 misqal
// (1 dirhəm = 0,7 misqal); 1 üqiyyə = 40 dirhəm; 1 bərid = 4 fərsəx; 1 fərsəx = 3 mil.
// Zira' saytda yoxdur — aralıqlı təxmin. Müqayisələr (düyü paketi, su butulkası …) yalnız TƏXMİNİDİR.
// tests/unit/sharia-units.test.js
// ═══════════════════════════════════════════════════════

// Saytdakı əsas dəyərlər (ZakatPage / KaffarahCalc / muddWater / dərslərlə eyni — test yoxlayır)
export const SAA_KG = 3
export const MUDD_L = [0.5, 0.75]
export const NISAB_GOLD_G = 85
export const NISAB_SILVER_G = 595
export const MITHQAL_G = NISAB_GOLD_G / 20            // 4.25 — 20 misqal ≈ 85 q
export const DIRHAM_G = NISAB_SILVER_G / 200          // 2.975 — 200 dirhəm (140 misqal) ≈ 595 q
export const TRAVEL_KM = [80, 83]                     // 48 mil
const MIL_KM = TRAVEL_KM.map((k) => k / 48)

const r3 = (n) => Math.round(n * 1000) / 1000

/**
 * out: [{ m: metrik vahid, v: əsas dəyər, lo, hi (aralıq; eynidirsə dəqiq nisbət), b: 'site' | 'derived' | 'estimate',
 *         rb?: aralığın əsası başqadırsa (məs. sa' kq: dəyər saytdan, aşağı hədd — alim təxmini),
 *         of?: 'gold' | 'silver' | 'food' | 'water' }]
 * cmp: müqayisə növü (səhifə təxmini vizual göstərir); link: əlaqəli səhifə / dərs
 */
export const UNITS = [
  { id: 'saa', ar: 'صاع', group: 'measure',
    out: [
      { m: 'kg', v: SAA_KG, lo: 2, hi: SAA_KG, b: 'site', rb: 'estimate', of: 'food' },
      { m: 'L', v: r3(4 * (MUDD_L[0] + MUDD_L[1]) / 2), lo: 4 * MUDD_L[0], hi: 4 * MUDD_L[1], b: 'derived', of: 'water' },
    ],
    cmp: 'rice', link: { key: 'zakat' } },
  { id: 'mudd', ar: 'مُدّ', group: 'measure',
    out: [
      { m: 'L', v: r3((MUDD_L[0] + MUDD_L[1]) / 2), lo: MUDD_L[0], hi: MUDD_L[1], b: 'site', of: 'water' },
      { m: 'kg', v: r3(SAA_KG / 4), lo: 0.5, hi: r3(SAA_KG / 4), b: 'derived', rb: 'estimate', of: 'food' },
    ],
    cmp: 'bottle', link: { key: 'prayerguide' } },
  { id: 'dinar', ar: 'دينار', group: 'money',
    out: [{ m: 'g', v: MITHQAL_G, lo: MITHQAL_G, hi: MITHQAL_G, b: 'derived', of: 'gold' }],
    cmp: 'water', link: { key: 'zakat' } },
  { id: 'dirham', ar: 'درهم', group: 'money',
    out: [{ m: 'g', v: DIRHAM_G, lo: DIRHAM_G, hi: DIRHAM_G, b: 'derived', of: 'silver' }],
    cmp: 'water', link: { key: 'zakat' } },
  { id: 'mithqal', ar: 'مثقال', group: 'money',
    out: [{ m: 'g', v: MITHQAL_G, lo: MITHQAL_G, hi: MITHQAL_G, b: 'site' }],
    cmp: 'water', link: { key: 'learn', param: 'fiqh-faq' } },
  { id: 'uqiyah', ar: 'أوقية', group: 'money',
    out: [{ m: 'g', v: r3(40 * DIRHAM_G), lo: r3(40 * DIRHAM_G), hi: r3(40 * DIRHAM_G), b: 'derived', of: 'silver' }],
    cmp: 'water', link: { key: 'zakat' } },
  { id: 'nisabGold', ar: 'نصاب الذهب', group: 'money',
    out: [{ m: 'g', v: NISAB_GOLD_G, lo: NISAB_GOLD_G, hi: NISAB_GOLD_G, b: 'site', of: 'gold' }],
    cmp: 'water', link: { key: 'zakat' } },
  { id: 'nisabSilver', ar: 'نصاب الفضة', group: 'money',
    out: [{ m: 'g', v: NISAB_SILVER_G, lo: NISAB_SILVER_G, hi: NISAB_SILVER_G, b: 'site', of: 'silver' }],
    cmp: 'water', link: { key: 'zakat' } },
  { id: 'dhira', ar: 'ذراع', group: 'length',
    out: [{ m: 'cm', v: 48, lo: 46, hi: 50, b: 'estimate' }],
    cmp: 'forearm', link: null },
  { id: 'mil', ar: 'ميل', group: 'distance',
    out: [{ m: 'km', v: r3((MIL_KM[0] + MIL_KM[1]) / 2), lo: MIL_KM[0], hi: MIL_KM[1], b: 'derived' }],
    cmp: 'walk', link: { key: 'learn', param: 'travel-prayer' } },
  { id: 'farsakh', ar: 'فرسخ', group: 'distance',
    out: [{ m: 'km', v: r3(3 * (MIL_KM[0] + MIL_KM[1]) / 2), lo: 3 * MIL_KM[0], hi: 3 * MIL_KM[1], b: 'derived' }],
    cmp: 'walk', link: { key: 'learn', param: 'travel-prayer' } },
  { id: 'barid', ar: 'بريد', group: 'distance',
    out: [{ m: 'km', v: r3(12 * (MIL_KM[0] + MIL_KM[1]) / 2), lo: 12 * MIL_KM[0], hi: 12 * MIL_KM[1], b: 'derived' }],
    cmp: 'car', link: { key: 'learn', param: 'travel-prayer' } },
  { id: 'travel', ar: 'مسافة القصر', group: 'distance',
    out: [{ m: 'km', v: TRAVEL_KM[0], lo: TRAVEL_KM[0], hi: TRAVEL_KM[1], b: 'site' }],
    cmp: 'car', link: { key: 'learn', param: 'travel-prayer' } },
]

export const UNIT_IDS = UNITS.map((u) => u.id)
export const unitById = (id) => UNITS.find((u) => u.id === id) || null

/** Miqdar × vahid → [{ m, v, lo, hi, b, of }] (vurulmuş) */
export function convert(id, qty) {
  const u = unitById(id)
  const q = Number(qty)
  if (!u || !Number.isFinite(q) || q < 0 || q > 1e7) return []
  return u.out.map((o) => ({ ...o, v: o.v * q, lo: o.lo * q, hi: o.hi * q }))
}

/**
 * Təxmini vizual müqayisə: { kind, n } — n ədəd "1 kq düyü paketi" / "0,5 L butulka" / "mL su" /
 * "dəqiqə piyada (5 km/saat)" / "dəqiqə maşınla (90 km/saat)" / "qol (dirsəkdən barmaq ucuna)"
 */
export const WALK_KMH = 5
export const CAR_KMH = 90
export function comparison(id, qty) {
  const u = unitById(id)
  const rows = convert(id, qty)
  if (!u || !rows.length) return null
  const first = rows[0]
  switch (u.cmp) {
    case 'rice': return { kind: 'rice', n: rows.find((r) => r.m === 'kg').v }          // 1 kq-lıq paket
    case 'bottle': return { kind: 'bottle', n: rows.find((r) => r.m === 'L').v / 0.5 }  // 0,5 L butulka
    case 'water': return { kind: 'water', n: first.v }                                 // 1 q ≈ 1 mL su
    case 'forearm': return { kind: 'forearm', n: Number(qty) }
    case 'walk': return { kind: 'walk', n: (first.v / WALK_KMH) * 60 }
    case 'car': return { kind: 'car', n: (first.v / CAR_KMH) * 60 }
    default: return null
  }
}

const COMMA = new Set(['az', 'ru', 'tr'])
/** Deterministik rəqəm formatı (Intl yox): ən çox `frac` onluq, artıq sıfırlar atılır, minlik — boşluq */
export function fmtNum(n, lang, frac = 2) {
  if (!Number.isFinite(n)) return ''
  const f = Math.abs(n) >= 100 ? Math.min(frac, 1) : frac
  let [i, d = ''] = Number(n).toFixed(f).split('.')
  d = d.replace(/0+$/, '')
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return d ? `${i}${COMMA.has(lang) ? ',' : '.'}${d}` : i
}
