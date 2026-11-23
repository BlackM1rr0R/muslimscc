// ═══════════════════════════════════════════════════════
// Heyz/nifas təqvimi — Ramazana düşən günlər və qəzası tutulacaq orucların siyahısı (saf).
// Ramazan günləri Ümmül-Qura təqvimi ilə (utils/hijri → countRamadanDays, ay-ay, gün-gün yox) — TƏXMİNİDİR:
// yerli Ramazan başlanğıcı bir gün fərqlənə bilər, ona görə istifadəçi sayı qəzaya əlavə etməzdən
// əvvəl özü düzəldir. Hökm: heyz/nifas günlərində tutulmayan Ramazan orucu qəza edilir, namaz yox
// (Müslim 335 — saytın /qada səhifəsində və "Kəffarə və fidyə" dərsində). tests/unit/haid-log.test.js
// ═══════════════════════════════════════════════════════
import { countRamadanDays, parseGKey } from './hijri'
import { localDay } from './journeyStore'

/** Dövrə düşən Ramazan günləri (Ümmül-Qura — təxmini); davam edirsə — bu günə qədər */
export function ramadanDaysIn(e, today = localDay()) {
  const end = e?.e || today
  const a = parseGKey(e?.s), b = parseGKey(end)
  if (!a || !b || end < e.s) return 0
  return countRamadanDays(a, b)
}

/**
 * Qəzası tutulacaq orucların siyahısı: Ramazana düşən hər dövr →
 * { id, k, s, e, days (Ramazan günləri), added (artıq əlavə olunan), left }
 */
export function makeupList(data, today = localDay()) {
  const out = []
  for (const e of data?.l || []) {
    const days = ramadanDaysIn(e, today)
    if (!days) continue
    const added = e.q || 0
    out.push({ id: e.id, k: e.k, s: e.s, e: e.e || null, days, added, left: Math.max(0, days - added) })
  }
  return out
}

