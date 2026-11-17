// ═══════════════════════════════════════════════════════
// "Məni yoxla" nəticəsinin hifz təkrar planına idxalı — saf məntiq (tests/unit/hifz-test-import.test.js)
//
// Yoxlayan insanın işarələri (server/hifzTest.js): { a, kind: 'mistake' | 'hesitation', words? }.
//   • səhv (mistake)     — ayə "Yenidən" kimi: bu gün təkrara düşür (interval 0), asanlıq −0.2, səhv +1
//   • tərəddüd (hesitation) — ən gec SABAH təkrar (interval ≤ 1), asanlıq −0.1
//   • işarəsiz ayələrə toxunulmur (yoxlayan "düz oxudu" deməyib — sadəcə işarə qoymayıb).
// Gündəlik jurnala (log) yazılmır — bu, təkrar deyil, plan düzəlişidir.
// Bir nəticə bir dəfə idxal olunur: idxal olunmuş test id-ləri "hifz_tests_v1"-də (profilə aiddir).
// ═══════════════════════════════════════════════════════
import { itemKey, newItem, addDays, MIN_EASE, DEFAULT_EASE } from './hifzSrs'

export const TESTS_KEY = 'hifz_tests_v1'
const MAX_IMPORTED = 200
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
const round2 = (x) => Math.round(x * 100) / 100

/** → { state, mistakes, hesitations } (yeni obyekt; giriş dəyişmir) */
export function importTestResult(state, test, today) {
  const items = { ...state.items }
  let mistakes = 0, hesitations = 0
  const s = Number(test?.surah)
  for (const m of test?.result?.marks || []) {
    const a = Number(m.a)
    if (!Number.isInteger(s) || !Number.isInteger(a) || a < 1) continue
    const key = itemKey(s, a)
    const cur = items[key] || newItem(s, a, today)
    const ease = cur.ease || DEFAULT_EASE
    if (m.kind === 'mistake') {
      items[key] = { ...cur, ease: round2(Math.max(MIN_EASE, ease - 0.2)), interval: 0, reps: 0, lapses: (cur.lapses || 0) + 1, due: today }
      mistakes++
    } else if (m.kind === 'hesitation') {
      const tomorrow = addDays(today, 1)
      items[key] = { ...cur, ease: round2(Math.max(MIN_EASE, ease - 0.1)), interval: Math.min(cur.interval || 0, 1), due: cur.due && cur.due < tomorrow ? cur.due : tomorrow }
      hesitations++
    }
  }
  return { state: { ...state, items }, mistakes, hesitations }
}

export function readImported(storage = safeStorage()) {
  try {
    const v = JSON.parse(storage?.getItem(TESTS_KEY) || 'null')
    return Array.isArray(v?.imported) ? v.imported.filter(Number.isInteger) : []
  } catch { return [] }
}
export function markImported(id, storage = safeStorage()) {
  const list = readImported(storage)
  if (list.includes(id)) return
  try { storage?.setItem(TESTS_KEY, JSON.stringify({ imported: [...list, id].slice(-MAX_IMPORTED) })) } catch { /* yaddaş bağlıdır */ }
}

/** Server siyahısından hələ idxal olunmamış, nəticəsi olan testlər */
export const pendingImports = (tests, imported) => (tests || []).filter((t) => t.status === 'done' && t.result && !imported.includes(t.id))
