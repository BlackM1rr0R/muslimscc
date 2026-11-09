// ═══════════════════════════════════════════════════════
// /dhikr → "Analitika" bölməsi üçün saf hesab (tests/unit/dhikr-insights.test.js)
// Məlumat: 'dhikr_daily_v1' { 'YYYY-MM-DD': say } (utils/myDay — son 60 gün
// saxlanılır) və 'dhikr_session'.log [{ id: ms, idx, name, count }] (son 10 dövrə).
// ═══════════════════════════════════════════════════════
import { isDay } from './trackerInsights.js'

export const DHIKR_KEEP_DAYS = 60

/** Pozuq dəyərləri süzür: yalnız tarix açarı və müsbət say. */
export function cleanDaily(raw) {
  const out = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [k, v] of Object.entries(raw)) {
    const n = Math.floor(Number(v))
    if (isDay(k) && n > 0) out[k] = n
  }
  return out
}

export function readDhikrDaily(storage = globalThis.localStorage) {
  try { return cleanDaily(JSON.parse(storage?.getItem('dhikr_daily_v1') || 'null')) } catch { return {} }
}

/** Dövrə jurnalı üzrə zikr adlarına görə cəm (çoxdan aza). nameOf(entry) → ad. */
export function byDhikr(log, nameOf) {
  const m = new Map()
  for (const e of Array.isArray(log) ? log : []) {
    if (!e || typeof e !== 'object') continue
    const n = Number(e.count) || 0
    if (n <= 0) continue
    const name = nameOf(e) || '—'
    const cur = m.get(name) || { label: name, value: 0, rounds: 0 }
    cur.value += n; cur.rounds++
    m.set(name, cur)
  }
  return [...m.values()].sort((a, b) => b.value - a.value)
}

/** Ən çox 4 seriya (viz qaydası): qalanları "Digər"-ə birləşdirir. */
export function topN(items, n, otherLabel) {
  if (items.length <= n) return items
  const head = items.slice(0, n - 1)
  const rest = items.slice(n - 1)
  return [...head, { label: otherLabel, value: rest.reduce((s, i) => s + i.value, 0), rounds: rest.reduce((s, i) => s + i.rounds, 0) }]
}
