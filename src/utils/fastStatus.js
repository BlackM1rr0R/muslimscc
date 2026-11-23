// ═══════════════════════════════════════════════════════
// Günün sünnə orucu baxımından növü — saf funksiya (React-sız).
// Əvvəl components/calendar/CalSunnahFasts.jsx-in içində idi; ana səhifənin
// "İndi sizin üçün" kartı da işlədir, ona görə ayrıca kiçik modula çıxarılıb
// (CalSunnahFasts onu olduğu kimi yenidən ixrac edir). Qaydalar və dəlillər
// dəyişməyib: data/lessons/sunnah-fasts.js dərsi ilə eynidir.
// ═══════════════════════════════════════════════════════

/** Gün oruc baxımından: 'ramadan' | 'haram' | səbəblər massivi (boş ola bilər). Ay 1..12. */
export function fastStatus(h, date) {
  const { month: m, day: d } = h
  if (m === 9) return 'ramadan'
  if ((m === 10 && d === 1) || (m === 12 && d >= 10 && d <= 13)) return 'haram'
  const r = []
  if (m === 1 && d === 9) r.push('tasua')
  if (m === 1 && d === 10) r.push('ashura')
  if (m === 12 && d === 9) r.push('arafah')
  if (m === 10 && d >= 2) r.push('shawwal')
  if (d >= 13 && d <= 15 && m !== 12) r.push('bid')
  const wd = date.getDay()
  if (wd === 1) r.push('mon')
  if (wd === 4) r.push('thu')
  return r
}
