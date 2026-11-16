// ═══════════════════════════════════════════════════════
// Dua zaman kapsulu — saf məntiq (components/DuaCapsule.jsx)
//
// Kapsullar yalnız bu cihazın localStorage-indədir (açar: muslim_cc_dua_capsules,
// userBackup.js-in ehtiyat nüsxəsinə avtomatik düşür). Mətn şifrələnmir —
// sadəcə açılış vaxtına qədər göstərilmir.
// Format: [{ id, text, createdAt, openAt, opened, answered? }] — tarixlər ISO sətri.
// ═══════════════════════════════════════════════════════
import { gregorianToHijri, hijriToGregorian, hijriToGregorianCivil, fromLocalDate } from './hijri'

export const STORAGE_KEY = 'muslim_cc_dua_capsules'
export const MAX_TEXT = 600
export const MAX_CAPSULES = 200
export const PRESETS = ['ramadan', 'adha', 'year', 'custom']

const DAY = 86400000
const isDateStr = (s) => typeof s === 'string' && s.length <= 40 && Number.isFinite(Date.parse(s))

/** Bir kapsulu yoxlayır və təmizləyir; yararsızdırsa null */
export function validateCapsule(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null
  if (typeof c.id !== 'string' || !c.id || c.id.length > 64) return null
  if (typeof c.text !== 'string') return null
  const text = c.text.trim().slice(0, MAX_TEXT)
  if (!text) return null
  if (!isDateStr(c.createdAt) || !isDateStr(c.openAt)) return null
  const out = { id: c.id, text, createdAt: c.createdAt, openAt: c.openAt, opened: c.opened === true }
  if (c.answered === true) out.answered = true
  return out
}

/** localStorage sətri → etibarlı kapsullar (xarab JSON / yad element atılır, id təkrarı da) */
export function parseCapsules(raw) {
  if (typeof raw !== 'string' || !raw) return []
  let arr
  try { arr = JSON.parse(raw) } catch { return [] }
  if (!Array.isArray(arr)) return []
  const seen = new Set()
  const out = []
  for (const x of arr) {
    const c = validateCapsule(x)
    if (!c || seen.has(c.id)) continue
    seen.add(c.id)
    out.push(c)
    if (out.length >= MAX_CAPSULES) break
  }
  return out
}

export const serializeCapsules = (list) => JSON.stringify(list.map(validateCapsule).filter(Boolean))

export function loadCapsules(storage = globalThis.localStorage) {
  try { return parseCapsules(storage.getItem(STORAGE_KEY)) } catch { return [] }
}
export function saveCapsules(list, storage = globalThis.localStorage) {
  try { storage.setItem(STORAGE_KEY, serializeCapsules(list)); return true } catch { return false }
}

const localMidnight = (g) => new Date(g.year, g.month - 1, g.day)

/**
 * Hicri ay/günün (məs. 9/1 — Ramazanın 1-i) bu gündən SONRAKI ilk miladi tarixi
 * (yerli gecəyarısı). Bu gün həmin gündürsə və ya keçibsə — gələn hicri il.
 */
export function nextHijriDate(hMonth, hDay, now = new Date()) {
  const today = fromLocalDate(now)
  const h = gregorianToHijri(today)
  let year = (h.month > hMonth || (h.month === hMonth && h.day >= hDay)) ? h.year + 1 : h.year
  for (let i = 0; i < 3; i++, year++) {
    const g = hijriToGregorian({ year, month: hMonth, day: hDay }) || hijriToGregorianCivil({ year, month: hMonth, day: hDay })
    const d = localMidnight(g)
    if (d.getTime() > localMidnight(today).getTime()) return d
  }
  return null
}

export const nextRamadan = (now = new Date()) => nextHijriDate(9, 1, now)
export const nextEidAdha = (now = new Date()) => nextHijriDate(12, 10, now)

/** Bir il sonra, eyni təqvim günü (29 fevral → 28 fevral) — yerli gecəyarısı */
export function inOneYear(now = new Date()) {
  const y = now.getFullYear() + 1, m = now.getMonth()
  const last = new Date(y, m + 1, 0).getDate()
  return new Date(y, m, Math.min(now.getDate(), last))
}

/** "YYYY-MM-DD" (input[type=date]) → yerli gecəyarısı; keçmiş/bu gün və ya xarab → null */
export function parseCustomDate(s, now = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''))
  if (!m) return null
  const [y, mo, d] = [+m[1], +m[2], +m[3]]
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (dt <= today || y > now.getFullYear() + 50) return null
  return dt
}

/** Hazır seçim → açılış tarixi (Date) | null */
export function presetOpenAt(preset, now = new Date(), custom = '') {
  if (preset === 'ramadan') return nextRamadan(now)
  if (preset === 'adha') return nextEidAdha(now)
  if (preset === 'year') return inOneYear(now)
  if (preset === 'custom') return parseCustomDate(custom, now)
  return null
}

const newId = () => {
  try { if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID() } catch { /* köhnə brauzer */ }
  return `dc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Yeni kapsul; mətn boşdursa və ya tarix gələcəkdə deyilsə null */
export function createCapsule(text, openAt, now = new Date(), id = newId()) {
  const t = String(text || '').trim().slice(0, MAX_TEXT)
  if (!t || !(openAt instanceof Date) || !(openAt.getTime() > now.getTime())) return null
  return { id, text: t, createdAt: now.toISOString(), openAt: openAt.toISOString(), opened: false }
}

/** 'sealed' (gözləyir) | 'ready' (vaxtı çatıb, açılmayıb) | 'opened' */
export function capsuleState(c, now = new Date()) {
  if (c.opened) return 'opened'
  return Date.parse(c.openAt) <= now.getTime() ? 'ready' : 'sealed'
}

/** Açılışa qalan tam gün sayı (yuxarı yuvarlaq; vaxtı keçibsə 0) */
export function daysUntil(openAt, now = new Date()) {
  const ms = Date.parse(openAt) - now.getTime()
  return ms <= 0 ? 0 : Math.ceil(ms / DAY)
}

/** Yenidən möhürlə — mətn və yazılma tarixi qalır */
export function resealCapsule(c, openAt) {
  return { id: c.id, text: c.text, createdAt: c.createdAt, openAt: openAt.toISOString(), opened: false }
}

/** Rəf sırası: hazır olanlar → möhürlülər (yaxın tarix əvvəl) → açılmışlar (yenisi əvvəl) */
export function sortCapsules(list, now = new Date()) {
  const rank = { ready: 0, sealed: 1, opened: 2 }
  return [...list].sort((a, b) => {
    const ra = rank[capsuleState(a, now)], rb = rank[capsuleState(b, now)]
    if (ra !== rb) return ra - rb
    return ra === 2 ? Date.parse(b.openAt) - Date.parse(a.openAt) : Date.parse(a.openAt) - Date.parse(b.openAt)
  })
}
