// ═══════════════════════════════════════════════════════
// Fil saatı (əl-Cəzəri, 1206) — saf vaxt hesabı (components/ElephantClock.jsx)
//
// • Fil saatı yarım saatı ölçür: deşikli qab suda yavaş-yavaş batır, dibə
//   çatanda (hər :00 və :30-da) kürə buraxılır və qab yenidən qalxır.
// • Burada hər şey istifadəçinin YERLİ vaxtı ilə (Date) hesablanır: qabın
//   batma payı = cari yarım saatın keçən hissəsi (0..1).
// • Saat qurşağı tam yarım saat deyilsə də (məs. +05:45) sərhəd yerli
//   dəqiqəyə görə tutulur — Date sahələri ilə, epoch bölməsi ilə yox.
// ═══════════════════════════════════════════════════════

export const HALF_MS = 30 * 60 * 1000

/** Yerli vaxtda cari yarım saatın vəziyyəti. */
export function halfHourState(ms) {
  const d = new Date(ms)
  const min = d.getMinutes()
  const elapsed = ((min % 30) * 60 + d.getSeconds()) * 1000 + d.getMilliseconds()
  const index = d.getHours() * 2 + (min >= 30 ? 1 : 0)   // 0..47 — sutkanın yarım saatı
  return {
    level: elapsed / HALF_MS,           // qabın batma payı 0..1
    elapsed,
    toNext: HALF_MS - elapsed,          // növbəti buraxılışa qədər (ms)
    index,
    key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${index}`,
  }
}

/** İki an arasında :00/:30 sərhədi keçilibmi? (geriyə də keçid sayılmır) */
export function crossedRelease(prevMs, nowMs) {
  if (!Number.isFinite(prevMs) || !Number.isFinite(nowMs) || nowMs <= prevMs) return false
  if (nowMs - prevMs >= HALF_MS) return true
  return halfHourState(prevMs).key !== halfHourState(nowMs).key
}

/** Batma payı → 2 onluq (test atributu data-level üçün). */
export const roundLevel = (x) => Math.round(Math.min(1, Math.max(0, x)) * 100) / 100

/** ms → { h, m } (dəqiqə yuxarı yuvarlanır: 59 s → 1 dəq). Mənfi → 0. */
export function splitDuration(ms) {
  const totalMin = Math.max(0, Math.ceil((Number(ms) || 0) / 60000))
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 }
}
