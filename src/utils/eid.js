// ═══════════════════════════════════════════════════════
// Bayram günləri (v5.8) — components/EidMode
//
//   eidOf(date) → { kind: 'fitr'|'adha', hYear, day } | null   (saf)
//
// • Ümmül-Qura hicri təqvimi (utils/hijri): Ramazan bayramı — 1–3 Şəvval,
//   Qurban bayramı — 10–13 Zülhiccə (təşriq günləri daxil).
// • Yerli ay görmə bir gün fərqli ola bilər — rejim yalnız bəzəkdir, hökm vermir.
// • Test üçün: ?eid=fitr | ?eid=adha
// ═══════════════════════════════════════════════════════
import { gregorianToHijri } from './hijri.js'

export function eidOf(date = new Date()) {
  const h = gregorianToHijri({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() })
  if (!h) return null
  if (h.month === 10 && h.day >= 1 && h.day <= 3) return { kind: 'fitr', hYear: h.year, day: h.day }
  if (h.month === 12 && h.day >= 10 && h.day <= 13) return { kind: 'adha', hYear: h.year, day: h.day }
  return null
}

export function eidToday() {
  if (typeof window === 'undefined') return null
  try {
    const f = new URLSearchParams(window.location.search).get('eid')
    if (f === 'fitr' || f === 'adha') return { kind: f, hYear: 1448, day: 1, forced: true }
  } catch { /* */ }
  return eidOf()
}
