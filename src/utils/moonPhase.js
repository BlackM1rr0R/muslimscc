// ═══════════════════════════════════════════════════════
// Ayın fazası — astronomik (hicri günə görə yox): bu gecə göydəki real ay
//
// Məlum təzə ay: 2000-01-06 18:14 UTC; sinodik ay 29.530588853 gün.
// Dəqiqlik ~±0.5 gün (orta hərəkət; perigey təsiri nəzərə alınmır) —
// görüntü və faza adı üçün kifayətdir. Hilalın GÖRÜNMƏSİ (ru'yət) başqa
// məsələdir — hicri ayın başlanğıcı üçün bu hesab istifadə OLUNMUR.
// ═══════════════════════════════════════════════════════

export const SYNODIC = 29.530588853
const EPOCH = Date.UTC(2000, 0, 6, 18, 14)
const DAY = 86400000

/** Faza adının açarı (yaşa görə, gün) */
export function phaseKey(age) {
  const a = ((age % SYNODIC) + SYNODIC) % SYNODIC
  if (a < 1.84566) return 'new'
  if (a < 5.53699) return 'waxingCrescent'
  if (a < 9.22831) return 'firstQuarter'
  if (a < 12.91963) return 'waxingGibbous'
  if (a < 16.61096) return 'full'
  if (a < 20.30228) return 'waningGibbous'
  if (a < 23.99361) return 'lastQuarter'
  if (a < 27.68493) return 'waningCrescent'
  return 'new'
}

/**
 * Ayın vəziyyəti verilən anda.
 * Qaytarır: { age (gün), phase (0..1: 0 təzə, 0.5 bədr), illumination (0..1),
 *            waxing, key, nextFull (Date), nextNew (Date) }
 */
export function moonPhase(date = new Date()) {
  const t = date instanceof Date ? date.getTime() : Number(date)
  const days = (t - EPOCH) / DAY
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC
  const phase = age / SYNODIC
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2
  const toFull = ((SYNODIC / 2 - age) + SYNODIC) % SYNODIC
  const toNew = SYNODIC - age
  return {
    age, phase, illumination,
    waxing: phase < 0.5,
    key: phaseKey(age),
    nextFull: new Date(t + toFull * DAY),
    nextNew: new Date(t + toNew * DAY),
  }
}

/**
 * Ayın işıqlı hissəsinin SVG yolu (mərkəz 0,0; radius r). Şimal yarımkürəsi:
 * böyüyən ay sağdan işıqlanır. Qaytarır: { d, mirror } — mirror: x oxu üzrə güzgü.
 */
export function litPath(phase, r = 50) {
  const k = (1 - Math.cos(2 * Math.PI * phase)) / 2
  const rx = Math.abs(Math.cos(2 * Math.PI * phase)) * r
  const crescent = k < 0.5
  // Yuxarıdan aşağı sağ yarımdairə, sonra terminator (ellips) ilə yuxarı
  const d = `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(3)} ${r} 0 0 ${crescent ? 0 : 1} 0 ${-r} Z`
  return { d, mirror: phase >= 0.5 }
}
