// ═══════════════════════════════════════════════════════
// Ramazan "Wrapped" (J4) — albom fəslindən hekayə kartları (saf; components/ramadan/RamadanWrapped)
//
// Yalnız ÖLÇÜLƏN və sıfırdan böyük göstəricilər kart olur (heç nə uydurulmur):
//   f  — tutulan oruclar (Hilal yolu)           k  — Ramazanda bitən xətmlər
//   tw — təravih gecələri (təravih gündəliyi; rəkət sayı yalnız yazılıbsa)
//   q  — oxunan ayələr (Ramazanda ölçülübsə)    su — oxunan surələr
//   dh — zikr                                   du — yazılan dualar (+ qəbul olunanlar)
//   um — iştirak etdiyiniz Ümmət xətmi dövrləri (dövr Ramazanda tamamlanıb)
// "Ən çox oxunan surə" ÖLÇÜLMÜR: surə üzrə oxu sayğacında (quran_stats) tarix yoxdur — kart yoxdur.
// tests/unit/ramadan-wrapped.test.js
// ═══════════════════════════════════════════════════════
import { ayahsOf } from './ramadanAlbum'
import { yearStats } from './taraweeh'
import { inRange } from './ramadanRange'

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)

/**
 * chapter — albom fəsli ({ s, e, f, x, k, su, dh, du, da, q0, q1 … }), y — hicri il,
 * taraweeh — muslim_cc_taraweeh_v1, khatm — world_khatm_v1 (sanitize olunmuş).
 * → [{ k, v, sub? }] (sıra — hekayənin sırası)
 */
export function wrappedCards(chapter, { y, taraweeh = {}, khatm = null } = {}) {
  if (!isObj(chapter)) return []
  const c = chapter
  const out = []
  const push = (k, v, sub) => { if (Number(v) > 0) out.push(sub ? { k, v: Number(v), sub } : { k, v: Number(v) }) }
  push('f', c.f, c.x ? { x: c.x } : null)
  push('k', c.k)
  const tw = yearStats(taraweeh, y)
  push('tw', tw.nights, tw.counted ? { rakats: tw.rakats, counted: tw.counted } : null)
  const q = ayahsOf(c)
  if (q != null) push('q', q)
  push('su', c.su)
  push('dh', c.dh)
  push('du', c.du, c.da ? { da: c.da } : null)
  const um = Object.values(isObj(khatm?.r) ? khatm.r : {}).filter((x) => inRange(x?.d, { s: c.s, e: c.e })).length
  push('um', um)
  return out
}
