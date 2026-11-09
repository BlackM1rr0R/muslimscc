// ═══════════════════════════════════════════════════════
// Təqvim → sünnə oruc izləyicisinin "Analitika" hissəsi — saf hesab
// (tests/unit/qada-insights.test.js). Mənbə: 'muslim_cc_sunnah_fasts_v1'
// { days: [...] } — istifadəçinin özünün qeyd etdiyi oruc günləri.
// Günün növü CalSunnahFasts.fastStatus() ilə (hicri tarix + həftə günü):
// səbəblər massivi | 'ramadan' | 'haram'.
// ═══════════════════════════════════════════════════════
import { fromDayKey } from '../components/viz/scale.js'

// Bölgü qrupları (sabit sıra → viz ton 1–3, "digər" — boz)
export const FAST_GROUPS = ['monthu', 'bid', 'special', 'other']
const SPECIAL = new Set(['arafah', 'ashura', 'tasua', 'shawwal'])

/** fastStatus nəticəsi → qrup. Bir gün bir neçə səbəbə düşə bilər — ən xüsusisi seçilir. */
export function fastGroup(st) {
  if (!Array.isArray(st) || !st.length) return 'other'
  if (st.some(r => SPECIAL.has(r))) return 'special'
  if (st.includes('bid')) return 'bid'
  if (st.includes('mon') || st.includes('thu')) return 'monthu'
  return 'other'
}

const weekMon = (k) => { const d = fromDayKey(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toDateString() }

/**
 * Dövr göstəriciləri.
 * logged: Set | string[]; keys: dövrün günləri; statusOf(key) → fastStatus nəticəsi
 * → { fasts, sunnahDays (dövrdəki sünnə günləri, bu günə qədər), kept (onlardan tutulan),
 *     weeks (ən azı bir oruclu həftə), groups { monthu, bid, special, other }, perDay[], weekday[7] }
 */
export function fastStats(logged, keys, statusOf) {
  const has = logged instanceof Set ? (k) => logged.has(k) : (() => { const s = new Set(logged || []); return (k) => s.has(k) })()
  const out = { fasts: 0, sunnahDays: 0, kept: 0, weeks: 0, groups: Object.fromEntries(FAST_GROUPS.map(g => [g, 0])), perDay: [], weekday: new Array(7).fill(0) }
  const wk = new Set()
  for (const k of keys) {
    const st = statusOf(k)
    const sunnah = Array.isArray(st) && st.length > 0
    const on = has(k)
    if (sunnah) out.sunnahDays++
    out.perDay.push(on ? 1 : 0)
    if (!on) continue
    out.fasts++
    if (sunnah) out.kept++
    out.groups[fastGroup(st)]++
    out.weekday[(fromDayKey(k).getDay() + 6) % 7]++
    wk.add(weekMon(k))
  }
  out.weeks = wk.size
  return out
}
