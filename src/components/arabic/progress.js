// ═══════════════════════════════════════════════════════
// Ərəb kursu — irəliləyişin yaddaşı (localStorage, hər addım try/catch)
//
// Açar: arabic_course_v1 → { best: { <dərs>: 0–100 }, last: <dərs> | null }
// Dərs ən azı PASS_PERCENT nəticə ilə yoxlanılıbsa "tamamlanmış" sayılır.
// Yaddaş bağlıdırsa (gizli rejim, Safari ITP) kurs yenə işləyir — sadəcə
// irəliləyiş saxlanmır.
// ═══════════════════════════════════════════════════════

import { LESSONS } from '../../data/arabicCourse.js'

export const PROGRESS_KEY = 'arabic_course_v1'
export const PASS_PERCENT = 70
const IDS = LESSONS.map(l => l.id)
const EMPTY = { best: {}, last: null }

export function readProgress() {
  try {
    const v = JSON.parse(localStorage.getItem(PROGRESS_KEY))
    if (!v || typeof v !== 'object') return { ...EMPTY, best: {} }
    const best = {}
    for (const id of IDS) {
      const n = Number(v.best?.[id])
      if (Number.isFinite(n) && n >= 0 && n <= 100) best[id] = Math.round(n)
    }
    return { best, last: IDS.includes(v.last) ? v.last : null }
  } catch { return { ...EMPTY, best: {} } }
}

export function writeProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)) } catch { /* yaddaş bağlıdır */ }
}

export const isPassed = (p, id) => (p.best[id] ?? -1) >= PASS_PERCENT
export const passedCount = (p) => IDS.filter(id => isPassed(p, id)).length
export const percentDone = (p) => Math.round((passedCount(p) / IDS.length) * 100)

/** "Davam et" hara aparsın: son açılan tamamlanmamış dərs → ilk tamamlanmamış → (hamısı bitibsə) birinci. */
export function resumeLesson(p) {
  if (p.last && !isPassed(p, p.last)) return p.last
  return IDS.find(id => !isPassed(p, id)) || IDS[0]
}

/** Yoxlamanın nəticəsini yaz — yalnız ən yaxşı nəticə saxlanır. */
export function withResult(p, id, percent) {
  const prev = p.best[id] ?? -1
  return { ...p, last: id, best: { ...p.best, [id]: Math.max(prev, Math.round(percent)) } }
}
