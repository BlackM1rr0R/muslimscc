// Səhər/axşam azkarı (AdhkarFocus) — bu günün irəliləyişi, localStorage.
// Ayrıca kiçik modul: HisnPage kartında irəliləyiş göstərmək üçün bütün tam
// ekran komponentini yükləmək lazım olmasın.
const KEY = 'adhkar_focus_v1'
export const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }

export function loadAdhkar(part, n) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    const p = s?.[part]
    if (p && p.date === todayKey() && Array.isArray(p.counts) && p.counts.length === n) return p
  } catch { /* */ }
  return { date: todayKey(), idx: 0, counts: Array(n).fill(0) }
}
export function saveAdhkar(part, st) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}') || {}
    s[part] = st
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch { /* yaddaş bağlıdır */ }
}
/** Bu gün üçün irəliləyiş — { done (tam sayılmış zikr), total, started } */
export function adhkarProgress(part, items) {
  const n = Array.isArray(items) ? items.length : items
  const need = (i) => Math.max(1, (Array.isArray(items) ? items[i]?.repeat : 1) || 1)
  const p = loadAdhkar(part, n)
  return { done: p.counts.filter((c, i) => c >= need(i)).length, total: n, started: p.counts.some(c => c > 0) }
}
/**
 * Səhər və ya axşam azkarı. Axşam azkarının vaxtı əsrdən sonradır — ona görə
 * namaz vaxtlarına baxılır: canlı səmanın fazası (utils/livingSky →
 * html[data-sky], istifadəçinin şəhərinin vaxtları ilə): əsr, məğrib, işa —
 * axşam; sübh, günəş, gündüz — səhər; gecə — gecə yarısına qədər axşam.
 * Faza hələ hesablanmayıbsa — cihazın saatı (15:00-dan sonra axşam).
 */
const readSky = () => { try { return document.documentElement.dataset.sky || '' } catch { return '' } }
export function partNow(h = new Date().getHours(), sky = readSky()) {
  if (sky === 'asr' || sky === 'maghrib' || sky === 'isha') return 'evening'
  if (sky === 'fajr' || sky === 'sunrise' || sky === 'day') return 'morning'
  if (sky === 'night') return h >= 12 ? 'evening' : 'morning'
  return h >= 4 && h < 15 ? 'morning' : 'evening'
}
