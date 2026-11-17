// ═══════════════════════════════════════════════════════
// Günün sünnəsi — saf məntiq (components/DailySunnah.jsx)
//
// • Günün əməli tarixə görə determinist seçilir: yerli təqvim günü → gün
//   nömrəsi (UTC epoxadan) → siyahıda dövri indeks. Saat qurşağı / yay vaxtı
//   təsir etmir — yalnız il-ay-gün sayılır.
// • Qeyd: localStorage "muslim_cc_daily_sunnah" = { 'YYYY-MM-DD': itemId }.
//   Yalnız bu cihazda saxlanır; xarab JSON / yad açar atılır.
// • Ardıcıllıq (streak): bu gündən (bu gün hələ qeyd olunmayıbsa — dünəndən)
//   geriyə fasiləsiz qeyd olunmuş günlərin sayı.
// ═══════════════════════════════════════════════════════

export const STORAGE_KEY = 'muslim_cc_daily_sunnah'
const DAY_MS = 86400000
const KEY_RE = /^\d{4}-\d{2}-\d{2}$/

const pad = (n) => String(n).padStart(2, '0')

/** Date → yerli 'YYYY-MM-DD' */
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 'YYYY-MM-DD' → yerli günorta (yay vaxtı keçidində də eyni gün qalsın) */
export function fromKey(key) {
  const [y, m, d] = String(key).split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Yerli təqvim günü → tam gün nömrəsi (1970-01-01 = 0) */
export function dayNumber(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS)
}

/** Günün əməli: siyahıda dövri fırlanma (eyni gün — həmişə eyni əməl) */
export function itemForDate(list, date = new Date()) {
  if (!list?.length) return null
  const n = list.length
  return list[((dayNumber(date) % n) + n) % n]
}

/** Gün açarına ±n gün əlavə et */
export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

/** localStorage sətri → { 'YYYY-MM-DD': id } (etibarsız hissələr atılır) */
export function parseLog(raw) {
  let obj
  try { obj = JSON.parse(raw || '{}') } catch { return {} }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {}
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (KEY_RE.test(k) && typeof v === 'string' && v && v.length <= 64) out[k] = v
  }
  return out
}

// Məxfi rejimdə localStorage-ın özünə müraciət xəta atır — ona görə try-ın içində oxunur
export function loadLog(storage) {
  try { return parseLog((storage || globalThis.localStorage).getItem(STORAGE_KEY)) } catch { return {} }
}

export function saveLog(log, storage) {
  try { (storage || globalThis.localStorage).setItem(STORAGE_KEY, JSON.stringify(log)); return true } catch { return false }
}

/** Günü qeyd et / qeydi götür — yeni obyekt qaytarır */
export function setDone(log, key, itemId, done = true) {
  const next = { ...log }
  if (done) next[key] = itemId
  else delete next[key]
  return next
}

/** Fasiləsiz ardıcıllıq: bu gün (yoxdursa dünən) daxil olmaqla geriyə */
export function streakOf(log, todayKey) {
  let k = log[todayKey] ? todayKey : addDays(todayKey, -1)
  let n = 0
  while (log[k]) { n++; k = addDays(k, -1) }
  return n
}

/** Ayda qeyd olunmuş günlərin sayı (month: 0–11) */
export function doneInMonth(log, year, month) {
  const pre = `${year}-${pad(month + 1)}-`
  return Object.keys(log).filter(k => k.startsWith(pre)).length
}

/**
 * Ay cədvəli: həftə bazar ertəsindən (weekStart=1) başlayır.
 * Qaytarır: [null, …, { key, day }, …] — əvvəldəki boş xanalar null.
 */
export function monthCells(year, month, weekStart = 1) {
  const first = new Date(year, month, 1, 12)
  const lead = (first.getDay() - weekStart + 7) % 7
  const days = new Date(year, month + 1, 0, 12).getDate()
  const cells = Array(lead).fill(null)
  for (let d = 1; d <= days; d++) cells.push({ key: `${year}-${pad(month + 1)}-${pad(d)}`, day: d })
  return cells
}
