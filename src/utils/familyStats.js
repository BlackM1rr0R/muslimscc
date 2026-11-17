// ═══════════════════════════════════════════════════════
// Ailə lövhəsi üçün xülasə rəqəmləri — YALNIZ bu cihazda, aktiv profilin məlumatından hesablanır
// (server məlumatı oxuya bilmir — uçdan-uca şifrəlidir). Serverə yalnız istifadəçinin seçdiyi
// rəqəmlər gedir (server/family.js → STAT_FIELDS ilə eyni siyahı). tests/unit/family-stats.test.js
// ═══════════════════════════════════════════════════════
import { readLife, countBits } from './quranLife'

export const STAT_FIELDS = ['quranAyahsTotal', 'quranDaysWeek', 'storybooksRead', 'prayerStarsWeek', 'hifzAyahs', 'dhikrWeek']

const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
/** Son 7 yerli gün (bu gün daxil) */
export function lastWeek(now = new Date()) {
  const out = []
  for (let i = 0; i < 7; i++) { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12); out.push(dayKey(d)) }
  return new Set(out)
}
function json(storage, key, fb) {
  try { const v = JSON.parse(storage?.getItem(key) || 'null'); return v == null ? fb : v } catch { return fb }
}
const int = (n) => (Number.isFinite(n) && n > 0 ? Math.min(1_000_000, Math.floor(n)) : 0)

/** → { quranAyahsTotal, quranDaysWeek, storybooksRead, prayerStarsWeek, hifzAyahs, dhikrWeek } (tam ədədlər) */
export function computeFamilyStats(storage = safeStorage(), now = new Date()) {
  const week = lastWeek(now)
  let quranAyahsTotal = 0
  try { quranAyahsTotal = countBits(readLife(storage).e) } catch { /* */ }

  const qs = json(storage, 'quran_stats', {})
  const tracker = json(storage, 'daily_tracker', {})
  const qDays = new Set()
  for (const d of Array.isArray(qs?.dates) ? qs.dates : []) if (week.has(d)) qDays.add(d)
  for (const [d, v] of Object.entries(tracker && typeof tracker === 'object' ? tracker : {})) if (week.has(d) && v && v.quran) qDays.add(d)

  const books = json(storage, 'muslim_cc_storybooks', {})
  const storybooksRead = Object.entries(books && typeof books === 'object' ? books : {}).filter(([k, v]) => k !== '__last' && Number.isInteger(v)).length

  let prayerStarsWeek = 0
  for (const [k, v] of Object.entries(json(storage, 'muslim_cc_prayer_stats', {}) || {})) {
    const d = k.slice(0, 10)
    if (v === true && DATE_RE.test(d) && week.has(d)) prayerStarsWeek++
  }

  const srs = json(storage, 'hifz_srs', {})
  const hifzAyahs = srs && srs.items && typeof srs.items === 'object' ? Object.keys(srs.items).length : 0

  let dhikrWeek = 0
  for (const [d, n] of Object.entries(json(storage, 'dhikr_daily_v1', {}) || {})) if (week.has(d)) dhikrWeek += int(Number(n))

  return {
    quranAyahsTotal: int(quranAyahsTotal), quranDaysWeek: qDays.size, storybooksRead: int(storybooksRead),
    prayerStarsWeek: int(prayerStarsWeek), hifzAyahs: int(hifzAyahs), dhikrWeek: int(dhikrWeek),
  }
}

/** Seçilmiş sahələr → serverə gedən gövdə */
export const sharePayload = (fields, stats) => ({
  fields: fields.filter((f) => STAT_FIELDS.includes(f)),
  stats: Object.fromEntries(fields.filter((f) => STAT_FIELDS.includes(f)).map((f) => [f, stats[f] || 0])),
})
