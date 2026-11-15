// ═══════════════════════════════════════════════════════
// Hədis əzbərləmə — Leitner qutuları (saf funksiyalar; tests/unit/hadith-srs.test.js)
//
// Vəziyyət (localStorage 'hadith_srs_v1'): { [id]: { b: qutu 0..5, due: 'YYYY-MM-DD' } }
// • Yeni kart (sevimli, vəziyyəti yoxdur) — bu gün təkrar olunur.
// • "Bildim" → növbəti qutu, növbəti təkrar INTERVALS[b] gün sonra.
// • "Yenə" → qutu 0, bu gün yenidən (növbənin sonuna).
// Yalnız bu cihazda saxlanılır.
// ═══════════════════════════════════════════════════════
export const SRS_KEY = 'hadith_srs_v1'
export const INTERVALS = [1, 3, 7, 14, 30, 60]
export const MAX_BOX = INTERVALS.length - 1

/** Yerli tarix 'YYYY-MM-DD' */
export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`
}

export function readSrs() {
  try {
    const s = JSON.parse(localStorage.getItem(SRS_KEY) || '{}')
    return s && typeof s === 'object' && !Array.isArray(s) ? s : {}
  } catch { return {} }
}
export function writeSrs(s) {
  try { localStorage.setItem(SRS_KEY, JSON.stringify(s)) } catch { /* yaddaş bağlıdır */ }
}

/** Bu gün təkrar olunacaq id-lər (vaxtı keçənlər əvvəl, sonra yenilər) */
export function dueIds(ids, state, today = todayKey()) {
  const due = []
  const fresh = []
  for (const id of ids) {
    const st = state[id]
    if (!st) fresh.push(id)
    else if (st.due <= today) due.push(id)
  }
  due.sort((a, b) => (state[a].due < state[b].due ? -1 : state[a].due > state[b].due ? 1 : 0))
  return [...due, ...fresh]
}

/** Cavab: ok=true "Bildim", false "Yenə" → yeni vəziyyət (köhnəni dəyişmir) */
export function grade(state, id, ok, today = todayKey()) {
  const cur = state[id] || { b: -1 }
  const b = ok ? Math.min(MAX_BOX, cur.b + 1) : 0
  const due = ok ? addDays(today, INTERVALS[b]) : today
  return { ...state, [id]: { b, due } }
}

/** Əzbərlənmiş say (ən yuxarı qutuda) və ən yaxın təkrar tarixi */
export function summary(ids, state, today = todayKey()) {
  let learned = 0
  let next = null
  for (const id of ids) {
    const st = state[id]
    if (!st) continue
    if (st.b >= 3) learned++
    if (st.due > today && (!next || st.due < next)) next = st.due
  }
  return { learned, next }
}
