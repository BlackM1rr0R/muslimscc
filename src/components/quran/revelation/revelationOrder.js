// ═══════════════════════════════════════════════════════
// Nazil olma sırası (/quran-revelation-order) — saf hesab (tests/unit/revelation-order.test.js)
//
// Məlumat: data/surahRevelation.js (Quran.com API v4 — revelation_order, revelation_place;
// Misir/Əzhər nəşrinin məşhur cədvəli, alimlərin ictihadıdır, qəti deyil) və
// data/mushafIndex.js (ərəb adı, latın adı, ayə sayı). Heç bir rəqəm əl ilə yazılmır —
// say (86/28), hicrət nöqtəsi və zaman xəttinin hissələri buradan hesablanır.
// ═══════════════════════════════════════════════════════
import { REVELATION_ORDER, REVELATION_PLACE } from '../../../data/surahRevelation.js'
import { SURAH_TABLE } from '../../../data/mushafIndex.js'

/** 114 surə mushaf sırası ilə: { n, order, medinan, ayahs, ar, latin } */
export const REV_SURAHS = SURAH_TABLE.map((row, i) => ({
  n: i + 1,
  order: REVELATION_ORDER[i],
  medinan: REVELATION_PLACE[i] === 1,
  ayahs: row[2],
  ar: row[4],
  latin: row[5],
}))

/** Mushaf sırası: [1, 2, …, 114] */
export const MUSHAF_SEQ = REV_SURAHS.map(s => s.n)

/** Nazil olma sırası: surə nömrələri (indeks = sıra − 1) — birincisi 96 (Ələq) */
export const REVELATION_SEQ = [...REV_SURAHS].sort((a, b) => a.order - b.order).map(s => s.n)

/** Rejimə görə sıra: 'mushaf' | 'revelation' */
export const sequenceFor = (mode) => (mode === 'revelation' ? REVELATION_SEQ : MUSHAF_SEQ)

/** Məkki / Mədəni sayı (məlumatdan) */
export function placeCounts() {
  const medinan = REV_SURAHS.filter(s => s.medinan).length
  return { meccan: REV_SURAHS.length - medinan, medinan }
}

/**
 * Zaman xəttinin hissələri — nazil olma sırasında ardıcıl eyni yerli surələr bir hissədir:
 * [{ medinan, from, to }] (from/to — 1-dən başlayan sıra, daxil). Cədvəldə Məkki surələr
 * hamısı əvvəldir, ona görə adətən iki hissə olur; məlumat dəyişsə də düzgün qalır.
 */
export function timelineSegments(seq = REVELATION_SEQ) {
  const out = []
  seq.forEach((n, i) => {
    const med = REV_SURAHS[n - 1].medinan
    const last = out[out.length - 1]
    if (last && last.medinan === med) last.to = i + 1
    else out.push({ medinan: med, from: i + 1, to: i + 1 })
  })
  return out
}

/** Hicrət nöqtəsi: nazil olma sırasında ilk Mədəni surənin sırası (yoxdursa null) */
export function hijraPosition(seq = REVELATION_SEQ) {
  const i = seq.findIndex(n => REV_SURAHS[n - 1].medinan)
  return i < 0 ? null : i + 1
}

/** Zaman xəttində sıranın mərkəzi (faizlə, 0…100) */
export const positionPct = (pos, total = 114) => ((pos - 0.5) / total) * 100

/**
 * FLIP: köhnə və yeni yerlər → hər kart üçün geri çəkmə (invert) fərqi.
 * first/last: Map(n → { x, y }); yalnız yeri dəyişənlər qaytarılır.
 */
export function flipDeltas(first, last) {
  const out = []
  for (const [n, b] of last) {
    const a = first.get(n)
    if (!a) continue
    const dx = Math.round((a.x - b.x) * 10) / 10
    const dy = Math.round((a.y - b.y) * 10) / 10
    if (dx || dy) out.push({ n, dx, dy })
  }
  return out
}

/** Yerli ad: az/ru/tr — data/surahNamesAz (getSurahLocal); en — latın adı; ar — ərəb adı artıq göstərilir */
export function localName(n, lang, getLocal) {
  if (lang === 'ar') return ''
  const loc = getLocal ? getLocal(n, lang) : null
  return loc?.name || REV_SURAHS[n - 1]?.latin || ''
}
