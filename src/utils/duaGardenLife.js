// ═══════════════════════════════════════════════════════
// Ömürlük dua bağçası — qəbul olunan hər dua bir çiçəkdir; bağ illər boyu böyüyür (saf hesab)
//
// Açar: dua_garden_v1 → { v: 1, b: [[id, 'YYYY-MM-DD', kat]] } (profilə aiddir; ehtiyat nüsxə +
// şifrəli sinxronizasiya). Mətn YOXDUR — o, dua gündəliyində (dua_journal) qalır; gündəlikdən dua
// silinsə də çiçəyi bağda qalır (ömürlük). kat — kateqoriyanın indeksi (CATS).
// syncGarden(): gündəlikdəki "qəbul oldu" (answered + answeredDate) dualardan çatışmayan çiçəkləri
// əlavə edir — /duajournal və /account açılanda. Sinxronizasiyada birlik (utils/syncMergers).
// tests/unit/dua-garden-life.test.js
// ═══════════════════════════════════════════════════════
export const GARDEN_KEY = 'dua_garden_v1'
export const GARDEN_EVENT = 'dua-garden-change'
export const CATS = ['personal', 'family', 'health', 'work', 'ummah']
export const GARDEN_MAX = 1500
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }

const cleanId = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v).slice(0, 32) : '')

/** [[id, gün, kat]] — təkrarsız (ilk qalır), günə görə sıralı, ≤ GARDEN_MAX */
export function sanitizeGarden(raw) {
  const list = Array.isArray(raw?.b) ? raw.b : []
  const seen = new Map()
  for (const x of list) {
    if (!Array.isArray(x)) continue
    const id = cleanId(x[0])
    if (!id || !DATE_RE.test(x[1])) continue
    const cat = Number.isInteger(x[2]) && x[2] >= 0 && x[2] < CATS.length ? x[2] : 0
    const old = seen.get(id)
    if (!old || x[1] < old[1]) seen.set(id, [id, x[1], cat])
  }
  const b = [...seen.values()].sort((a, c) => (a[1] < c[1] ? -1 : a[1] > c[1] ? 1 : a[0] < c[0] ? -1 : 1)).slice(-GARDEN_MAX)
  return { v: 1, b }
}

export function readGarden(storage = safeStorage()) {
  try { return sanitizeGarden(JSON.parse(storage?.getItem(GARDEN_KEY) || 'null')) } catch { return { v: 1, b: [] } }
}

/** Gündəlikdən çatışmayan çiçəklər (SAF) → { garden, added } */
export function syncFromJournal(duas, garden) {
  const have = new Set(garden.b.map((x) => x[0]))
  const add = []
  for (const d of Array.isArray(duas) ? duas : []) {
    if (!d || d.answered !== true) continue
    const id = cleanId(d.id)
    const day = DATE_RE.test(d.answeredDate) ? d.answeredDate : DATE_RE.test(d.date) ? d.date : null
    if (!id || !day || have.has(id)) continue
    have.add(id)
    add.push([id, day, Math.max(0, CATS.indexOf(d.category))])
  }
  if (!add.length) return { garden, added: 0 }
  return { garden: sanitizeGarden({ b: [...garden.b, ...add] }), added: add.length }
}

/** Yaddaşdakı gündəlik → bağ (yazır, dəyişibsə hadisə) → bağ */
export function syncGarden(duas, storage = safeStorage()) {
  const { garden, added } = syncFromJournal(duas, readGarden(storage))
  if (added) {
    try { storage?.setItem(GARDEN_KEY, JSON.stringify(garden)) } catch { /* yaddaş dolub */ }
    try { globalThis.dispatchEvent?.(new CustomEvent(GARDEN_EVENT)) } catch { /* */ }
  }
  return garden
}

/** Gündəliyi yaddaşdan oxu və bağa köçür (hesab səhifəsi üçün) */
export function syncGardenFromStorage(storage = safeStorage()) {
  let duas = []
  try { duas = JSON.parse(storage?.getItem('dua_journal') || 'null')?.duas || [] } catch { /* */ }
  return syncGarden(duas, storage)
}

/** Fəsil (mövsüm): 0 qış, 1 yaz, 2 yay, 3 payız — Şimal yarımkürəsi təqvim aylarına görə */
export const seasonOf = (day) => [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0][Number(day.slice(5, 7)) - 1] ?? 0

/** İllər üzrə pillələr: [{ year, flowers: [{ id, day, cat, t }] }] — t: ilin içində 0…1 */
export function terraces(garden) {
  const by = new Map()
  for (const [id, day, cat] of garden.b) {
    const y = Number(day.slice(0, 4))
    if (!by.has(y)) by.set(y, [])
    const doy = (Date.UTC(y, Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))) - Date.UTC(y, 0, 1)) / 86400000
    by.get(y).push({ id, day, cat, t: Math.max(0, Math.min(1, doy / 365)) })
  }
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([year, flowers]) => ({ year, flowers }))
}
