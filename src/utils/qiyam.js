// Gecə namazı (Qiyam) — gecənin son üçdə biri (saf; tests/unit/qiyam.test.js)
// Gecə: məğribdən sübhə qədər (PrayerPage-dəki hesabla eyni). Son üçdə bir — gecənin 2/3-ündən sübhə.
// Bütün vaxtlar şəhərin gecə yarısından dəqiqələrlədir (0…1439).

/**
 * @returns {{ phase: 'in' | 'wait', start: number, end: number, left: number }}
 *   phase 'in' — hazırda son üçdə birdir, left — sübhə qədər dəqiqə;
 *   phase 'wait' — left — son üçdə birin başlamasına qədər dəqiqə.
 *   start / end — 0…1439 (saat kimi göstərmək üçün)
 */
export function qiyamState(nowMin, maghrib, fajr) {
  if (![nowMin, maghrib, fajr].every(Number.isFinite)) return null
  const night = fajr + 1440 - maghrib
  // Gecənin hansı "axşamından" danışırıq: sübhdən əvvəl — dünən axşam başlayan gecə
  const t = nowMin < fajr ? nowMin + 1440 : nowMin
  const start = maghrib + (night * 2) / 3, end = fajr + 1440
  if (t >= start && t < end) return { phase: 'in', start: Math.round(start) % 1440, end: fajr, left: Math.round(end - t) }
  const left = t < start ? start - t : start + 1440 - t
  return { phase: 'wait', start: Math.round(start) % 1440, end: fajr, left: Math.round(left) }
}

export const hm = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.round(min) % 60).padStart(2, '0')}`
