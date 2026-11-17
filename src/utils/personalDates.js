// ═══════════════════════════════════════════════════════
// Şəxsi xatırlatmaların tarixləri — klient (önizləmə + məktubun çatdırılma günü)
//
// Hicri hesablar saytın öz modulu ilə (utils/hijri — Ümmül-Qura); server eyni alqoritmin
// CommonJS surətini işlədir (server/hijri.js, server/personal.js → nextAnniversary, hawlDue).
// tests/unit/personal-dates.test.js iki tərəfin eyni tarix verdiyini yoxlayır.
// ═══════════════════════════════════════════════════════
import { gregorianToHijri, hijriToGregorian, hijriMonthLength, gDiffDays, gDaysInMonth, parseGKey, gKey, addGDays, fromLocalDate } from './hijri'
import { nextRamadan, inOneYear } from './duaCapsule'

export const LETTER_KINDS = ['date', 'year', 'ramadan', 'birthday']

/** Date → 'YYYY-MM-DD' (yerli gün) */
export const localKey = (d) => gKey(fromLocalDate(d))
export const addDaysKey = (key, n) => gKey(addGDays(parseGKey(key), n))

/** Ad gününün növbəti tarixi (bu gün daxil); 29 fevral → uzun olmayan ildə 28 fevral. Ad günü saxlanmır. */
export function nextBirthday(birthKey, now = new Date()) {
  const b = parseGKey(birthKey)
  if (!b) return null
  const today = fromLocalDate(now)
  for (let y = today.year; y <= today.year + 1; y++) {
    const g = { year: y, month: b.month, day: Math.min(b.day, gDaysInMonth(y, b.month)) }
    if (gDiffDays(today, g) >= 0) return gKey(g)
  }
  return null
}

/** Məktubun çatdırılma günü: kind + (öz tarix | doğum tarixi) → 'YYYY-MM-DD' | null */
export function letterDeliverOn(kind, { now = new Date(), date = '', birth = '' } = {}) {
  const today = localKey(now)
  if (kind === 'year') return localKey(inOneYear(now))
  if (kind === 'ramadan') { const d = nextRamadan(now); return d ? localKey(d) : null }
  if (kind === 'birthday') return nextBirthday(birth, now)
  const g = parseGKey(date)
  if (!g || date < today || g.year > now.getFullYear() + 50) return null
  return date
}

/** Hövl: başlanğıcın hicri tarixi növbəti hicri illərdə — fromKey-dən (daxil) sonrakı ilk */
export function hawlDue(startKey, fromKey) {
  const start = parseGKey(startKey), from = parseGKey(fromKey)
  if (!start || !from) return null
  const hS = gregorianToHijri(start)
  for (let y = hS.year + 1; y <= hS.year + 40; y++) {
    const day = Math.min(hS.day, hijriMonthLength(y, hS.month))
    const g = hijriToGregorian({ year: y, month: hS.month, day })
    if (g && gDiffDays(from, g) >= 0) return gKey(g)
  }
  return null
}

/** Növbəti ildönümü (miladi 'g' və ya hicri 'h'); n — neçənci il */
export function nextAnniversary(passedKey, calendar, fromKey) {
  const passed = parseGKey(passedKey), from = parseGKey(fromKey)
  if (!passed || !from) return null
  if (calendar === 'h') {
    const hP = gregorianToHijri(passed), hF = gregorianToHijri(from)
    for (let y = Math.max(hF.year - 1, hP.year + 1); y <= hF.year + 2; y++) {
      const day = Math.min(hP.day, hijriMonthLength(y, hP.month))
      const g = hijriToGregorian({ year: y, month: hP.month, day })
      if (g && gDiffDays(from, g) >= 0) return { date: gKey(g), n: y - hP.year }
    }
    return null
  }
  for (let year = Math.max(from.year, passed.year + 1); year <= from.year + 2; year++) {
    const g = { year, month: passed.month, day: Math.min(passed.day, gDaysInMonth(year, passed.month)) }
    if (gDiffDays(from, g) >= 0) return { date: gKey(g), n: year - passed.year }
  }
  return null
}

// ── Zəkat arxivi (yalnız bu cihazda — localStorage; hesabın şifrəli sinxronizasiyası daşıyır) ──
export const ZAKAT_ARCHIVE_KEY = 'muslim_cc_zakat_archive'
const MAX_ARCHIVE = 60
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }

function validEntry(e) {
  if (!e || typeof e !== 'object' || !parseGKey(e.date)) return null
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e15 ? Math.round(v * 100) / 100 : null)
  const total = num(e.total), zakat = num(e.zakat)
  if (total == null || zakat == null || typeof e.currency !== 'string' || !/^[A-Z]{3}$/.test(e.currency)) return null
  return { date: e.date, total, zakat, currency: e.currency }
}
export function loadZakatArchive(storage = safeStorage()) {
  try {
    const arr = JSON.parse(storage?.getItem(ZAKAT_ARCHIVE_KEY) || '[]')
    return Array.isArray(arr) ? arr.map(validEntry).filter(Boolean).slice(0, MAX_ARCHIVE) : []
  } catch { return [] }
}
/** Bu günün hesabını arxivə yaz (eyni gün — əvəz olunur); yeni siyahı */
export function saveZakatArchive(entry, storage = safeStorage()) {
  const e = validEntry(entry)
  if (!e) return loadZakatArchive(storage)
  const list = [e, ...loadZakatArchive(storage).filter((x) => x.date !== e.date)]
    .sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, MAX_ARCHIVE)
  try { storage?.setItem(ZAKAT_ARCHIVE_KEY, JSON.stringify(list)) } catch { /* yaddaş bağlıdır */ }
  return list
}
export function removeZakatArchive(date, storage = safeStorage()) {
  const list = loadZakatArchive(storage).filter((x) => x.date !== date)
  try { storage?.setItem(ZAKAT_ARCHIVE_KEY, JSON.stringify(list)) } catch { /* */ }
  return list
}
