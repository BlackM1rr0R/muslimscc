// ═══════════════════════════════════════════════════════
// Şəxsi izləyici səhifələrinin "Analitika" bölməsi (viz v2) — ortaq saf hesab.
// Səhifələr: /prayer-tracker /dailytracker /qada /hifz /dhikr /muhasabah
// /duajournal /charity, təqvimdəki sünnə oruc izləyicisi.
// Məlumat YALNIZ istifadəçinin öz localStorage qeydlərindəndir — burada heç nə
// uydurulmur; qeyd yoxdursa 0 qaytarılır (pctDelta 0-a bölmədə null verir).
// tests/unit/tracker-insights.test.js
// ═══════════════════════════════════════════════════════
import { addDayKey, dayKeys, fromDayKey, pctDelta } from '../components/viz/scale.js'

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const isDay = (k) => typeof k === 'string' && DATE_RE.test(k)
export const RANGES = [7, 30, 90, 364]

/** Cari dövr (endKey daxil son n gün) və ondan əvvəlki n gün. */
export function periodKeys(endKey, n) {
  return { keys: dayKeys(endKey, n), prevKeys: dayKeys(addDayKey(endKey, -n), n) }
}

/** Ardıcıl dəyərləri SONDAN size-lik qruplara yığır (son qrup həmişə tamdır). */
export function bucketEnd(values, size) {
  if (size <= 1) return values.slice()
  const out = []
  for (let end = values.length; end > 0; end -= size) out.unshift(values.slice(Math.max(0, end - size), end).reduce((a, b) => a + b, 0))
  return out
}
/** Etiketlər bucketEnd ilə uyğun: hər qrupun İLK günü. */
export function bucketLabels(keys, size) {
  if (size <= 1) return keys.slice()
  const out = []
  for (let end = keys.length; end > 0; end -= size) out.unshift(keys[Math.max(0, end - size)])
  return out
}

/** Hər nöqtə — özü daxil son w günün cəmi (0/1 sıraları "daraq" kimi görünməsin). */
export const rolling = (vals, w = 7) => vals.map((_, i) => vals.slice(Math.max(0, i - w + 1), i + 1).reduce((a, b) => a + b, 0))

export const sumOf = (vals) => vals.reduce((a, b) => a + (Number(b) || 0), 0)
export const countPos = (vals) => vals.reduce((a, b) => a + (b > 0 ? 1 : 0), 0)

/** Həftənin günləri üzrə orta (0 = bazar ertəsi). keys və values eyni uzunluqdadır. */
export function weekdayAvg(keys, values) {
  const s = new Array(7).fill(0), n = new Array(7).fill(0)
  keys.forEach((k, i) => { const wd = (fromDayKey(k).getDay() + 6) % 7; s[wd] += Number(values[i]) || 0; n[wd]++ })
  return s.map((v, i) => (n[i] ? Math.round((v / n[i]) * 10) / 10 : 0))
}

/** Dəyişmə obyekti KpiCard üçün: əvvəlki dövr 0-dırsa null (sonsuz faiz yox). */
export const deltaOf = (cur, prev, vs, positiveIsGood = true) => {
  const value = pctDelta(cur, prev)
  return value == null ? null : { value, vs, positiveIsGood }
}

/**
 * Ardıcıl gün seriyası: endKey-dən geriyə `ok(key)` doğru olan günlər.
 * Bu gün hələ boşdursa seriya dünəndən sayılır. skip(key) — sayılmır, qırmır da.
 */
export function streakBack(ok, endKey, { max = 3650, skip } = {}) {
  let n = 0
  for (let i = 0; i < max; i++) {
    const k = addDayKey(endKey, -i)
    if (skip && skip(k)) continue
    if (ok(k)) n++
    else if (i === 0) continue
    else break
  }
  return n
}

/** Ən uzun seriya firstKey..endKey arasında. */
export function bestRun(ok, firstKey, endKey, { skip } = {}) {
  if (!isDay(firstKey) || firstKey > endKey) return 0
  let best = 0, cur = 0
  for (let k = firstKey, guard = 0; k <= endKey && guard < 40000; k = addDayKey(k, 1), guard++) {
    if (skip && skip(k)) continue
    if (ok(k)) { cur++; if (cur > best) best = cur } else if (k !== endKey) cur = 0
  }
  return best
}

/** Açarlar arasında ən erkən gün (yalnız 'YYYY-MM-DD'). */
export function earliest(keys) {
  let min = null
  for (const k of keys) if (isDay(k) && (!min || k < min)) min = k
  return min
}

/**
 * Gündəlik temp: son `windowDays` gündə (və ya ilk qeyddən bəri, hansı qısadırsa)
 * gündə orta. byDay — { 'YYYY-MM-DD': n }. Qeyd yoxdursa 0.
 */
export function paceFrom(byDay, endKey, windowDays = 30) {
  const first = earliest(Object.keys(byDay || {}).filter(k => Number(byDay[k]) > 0))
  if (!first) return 0
  const since = Math.round((fromDayKey(endKey) - fromDayKey(first)) / 864e5) + 1
  const span = Math.max(1, Math.min(windowDays, since))
  let total = 0
  for (const k of dayKeys(endKey, span)) total += Number(byDay[k]) || 0
  return Math.round((total / span) * 10) / 10
}

/** Bazar ertəsindən başlayan 7 qısa gün adı (dilə görə Intl). */
export function weekdayNames(fmtDate) {
  const mon = new Date(2026, 10, 2, 12)   // 2 noyabr 2026 — bazar ertəsi
  return Array.from({ length: 7 }, (_, i) => fmtDate(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i, 12), { weekday: 'short' }))
}

// ── /dailytracker: 10 əməlin 4 qrupu (sabit sıra → viz ton 1–4) ──
export const TRACKER_GROUPS = ['prayer', 'quran', 'adhkar', 'sadaqah']
const GROUP_OF = { fajr: 'prayer', dhuhr: 'prayer', asr: 'prayer', maghrib: 'prayer', isha: 'prayer', quran: 'quran', morning: 'adhkar', evening: 'adhkar', dhikr: 'adhkar', sadaqah: 'sadaqah' }
/** Bir günün qeydi ({ fajr: true, … }) → { prayer: 0–5, quran: 0–1, adhkar: 0–3, sadaqah: 0–1 } */
export function trackerGroupsOf(day) {
  const out = { prayer: 0, quran: 0, adhkar: 0, sadaqah: 0 }
  if (!day || typeof day !== 'object') return out
  for (const [k, g] of Object.entries(GROUP_OF)) if (day[k] === true) out[g]++
  return out
}
