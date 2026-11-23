// ═══════════════════════════════════════════════════════
// "Mənim ilim" kitabı (/my-year-book) — seçilmiş hicri və ya miladi ilin şəxsi qeydləri (saf hesab)
//
// Hamısı istifadəçinin ÖZ yerli qeydlərindəndir (hesaba girilibsə — E2E sinxronizasiya ilə bu cihaza gələnlər də);
// heç nə göndərilmir, heç nə uydurulmur, ölçülməyən göstərilmir. Mənbələr — mövcud oxuyucular:
//   utils/journey → gatherJourney (mozaika, xətm şəhadətnamələri/planı, möhürlər, Ramazan albomu, oruclar, dua gündəliyi,
//                   hifz + hifz_dates_v1, zikr, təravih, məscidlər), buildTimeline (xətmlərin günü — eyni xətm bir dəfə),
//                   rangeSummary (ilin bir neçə rəqəmi)
//   utils/quranNotes → readNotes (ayə qeydləri; gün — ilk yazılma anı d, yoxdursa son dəyişiklik u)
//   charity_log (/charity) — gizli; məbləğlər susmaya görə çapda gizlədilir (komponentdə)
// Qeyd: mozaikada surənin yalnız İLK və SON oxunuş günü saxlanır (quran_life_v1.d) — "bu il oxunan surə" = həmin
// günlərdən biri ilin içindədir (rangeSummary ilə eyni qayda; komponent bunu dürüst yazır).
// tests/unit/year-book.test.js
// ═══════════════════════════════════════════════════════
import { gatherJourney, rangeSummary, buildTimeline } from './journey'
import { DATE_RE, isObj, safeStorage, parse, localDay } from './journeyStore'
import { readNotes, parseNoteKey } from './quranNotes'
import { ramadanRange } from './ramadanRange'
import { hijriToGregorian, gregorianToHijri, parseGKey, addGDays, gKey } from './hijri'
import { DEED_KEYS } from './charityReport'

export const MODES = ['hijri', 'greg']
export const YEARS_BACK = 5
export const NOTE_CHARS = 600
export const DESC_CHARS = 200
export const LIST_MAX = 300
export const GLANCE_KEYS = ['fasts', 'taraweeh', 'dhikr', 'mosques', 'ummah']

const inR = (d, r) => typeof d === 'string' && DATE_RE.test(d) && d >= r.from && d <= r.to
const clip = (s, n) => { const a = [...String(s ?? '').trim()]; return a.length > n ? `${a.slice(0, n).join('')}…` : a.join('') }

/** İlin miladi aralığı { from, to } ('YYYY-MM-DD', hər ikisi daxil) və ya null */
export function yearRange(mode, year) {
  const y = Number(year)
  if (!Number.isInteger(y)) return null
  if (mode === 'greg') return y >= 1900 && y <= 2400 ? { from: `${y}-01-01`, to: `${y}-12-31` } : null
  const s = hijriToGregorian({ year: y, month: 1, day: 1 })
  const n = hijriToGregorian({ year: y + 1, month: 1, day: 1 })
  return s && n ? { from: gKey(s), to: gKey(addGDays(n, -1)) } : null
}

/** Bu günün ili seçilmiş təqvimdə */
export function currentYear(mode, today = localDay()) {
  const g = parseGKey(today)
  if (!g) return null
  return mode === 'greg' ? g.year : gregorianToHijri(g).year
}

/** Seçim üçün illər: cari il və əvvəlki YEARS_BACK il (yenidən köhnəyə) */
export function yearOptions(mode, today = localDay()) {
  const c = currentYear(mode, today)
  return c ? Array.from({ length: YEARS_BACK + 1 }, (_, i) => c - i) : []
}

/** Bütün mənbələr — bir dəfə oxunur */
export function gatherYearBook(storage = safeStorage()) {
  const charity = parse(storage, 'charity_log', [])
  return { ...gatherJourney(storage), notes: readNotes(storage), charity: Array.isArray(charity) ? charity : [] }
}

const sortByDate = (a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)
const amountOf = (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : 0 }
const r2 = (v) => Math.round(v * 100) / 100

function ramadanChapters(src, r) {
  const ys = new Set()
  const album = isObj(src.album?.y) ? src.album.y : {}
  for (const y of Object.keys(album)) ys.add(Number(y))
  for (const y of Object.keys(isObj(src.fasts) ? src.fasts : {})) ys.add(Number(y))
  const out = []
  for (const y of [...ys].filter(Number.isInteger).sort((a, b) => a - b)) {
    const rr = ramadanRange(y)
    if (!rr || !(inR(rr.s, r) || inR(rr.e, r))) continue
    const c = isObj(album[y]) ? album[y] : null
    const days = isObj(src.fasts?.[y]) ? Object.values(src.fasts[y]) : []
    const fasted = days.filter((v) => v === 1).length
    const ch = {
      y, s: rr.s, e: rr.e,
      f: Math.max(Number(c?.f) || 0, fasted),
      x: Number(c?.x) || 0,
      q: c && Number.isInteger(c.q0) && Number.isInteger(c.q1) ? Math.max(0, c.q1 - c.q0) : 0,
      su: Number(c?.su) || 0, k: Number(c?.k) || 0, dh: Number(c?.dh) || 0,
      du: Number(c?.du) || 0, da: Number(c?.da) || 0, ii: Number(c?.ii) || 0,
    }
    if (ch.f || ch.x || ch.q || ch.su || ch.k || ch.dh || ch.du || ch.da || ch.ii) out.push(ch)
  }
  return out
}

function charityOf(raw, r) {
  const entries = []
  const types = new Map()
  let amount = 0, withAmount = 0
  for (const e of raw) {
    if (!isObj(e) || !inR(e.date, r)) continue
    const type = DEED_KEYS.includes(e.type) ? e.type : 'other'
    const a = amountOf(e.amount)
    amount += a
    if (a) withAmount++
    const t = types.get(type) || { key: type, count: 0, amount: 0 }
    t.count++; t.amount += a
    types.set(type, t)
    entries.push({
      d: e.date, type, amount: a,
      to: typeof e.to === 'string' ? clip(e.to, 80) : '',
      desc: typeof e.description === 'string' ? clip(e.description, DESC_CHARS) : '',
    })
  }
  entries.sort(sortByDate)
  return {
    count: entries.length, amount: r2(amount), withAmount,
    types: [...types.values()].map((t) => ({ ...t, amount: r2(t.amount) }))
      .sort((a, b) => b.count - a.count || DEED_KEYS.indexOf(a.key) - DEED_KEYS.indexOf(b.key)),
    entries: entries.slice(0, LIST_MAX),
  }
}

/**
 * Kitabın məzmunu [from, to]:
 *   khatms [{ d, n }] · surahs [surə] (mozaika) · ayahsLife · hifz [{ s, d }] · notes [{ s, a, d, t, c }]
 *   duas [{ d, text, cat, ans, ansD }] · ramadan [fəsil] · charity { count, amount, withAmount, types, entries }
 *   stamps [{ id, d }] · glance [{ k, v }] · empty — heç bir bölmədə qeyd yoxdur
 */
export function buildYearBook(src, { from, to }) {
  const r = { from, to }
  const khatms = buildTimeline(src).filter((e) => e.k === 'khatm' && inR(e.d, r)).map((e) => ({ d: e.d, n: e.n }))
  const surahs = []
  for (const [s, v] of Object.entries(src.life?.d || {})) {
    const n = Number(s)
    if (n >= 1 && n <= 114 && Array.isArray(v) && (inR(v[0], r) || inR(v[1], r))) surahs.push(n)
  }
  surahs.sort((a, b) => a - b)
  const summary = rangeSummary(src, from, to)
  const ayahsLife = summary.find((x) => x.k === 'ayahsLife')?.v || 0
  const hifz = Object.entries(src.hifzDates || {})
    .filter(([s, d]) => Number(src.hifz?.[s]) === 2 && inR(d, r))
    .map(([s, d]) => ({ s: Number(s), d })).sort(sortByDate)
  const notes = []
  for (const [k, v] of Object.entries(isObj(src.notes) ? src.notes : {})) {
    const ref = parseNoteKey(k)
    if (!ref || !isObj(v)) continue
    const ms = Number(v.d) || Number(v.u)
    if (!ms) continue
    const d = localDay(new Date(ms))
    if (!inR(d, r)) continue
    const t = typeof v.t === 'string' ? clip(v.t, NOTE_CHARS) : ''
    if (!t && !v.c) continue
    notes.push({ s: ref.s, a: ref.a, d, t, c: typeof v.c === 'string' ? v.c : '' })
  }
  notes.sort((a, b) => sortByDate(a, b) || a.s - b.s || a.a - b.a)
  const duas = (src.duas || [])
    .filter((x) => isObj(x) && typeof x.text === 'string' && x.text.trim() && inR(x.date, r))
    .map((x) => ({ d: x.date, text: clip(x.text, NOTE_CHARS), cat: typeof x.category === 'string' ? x.category : 'personal', ans: x.answered === true, ansD: DATE_RE.test(x.answeredDate || '') ? x.answeredDate : '' }))
    .sort(sortByDate).slice(0, LIST_MAX)
  const stamps = Object.entries(isObj(src.stamps) ? src.stamps : {}).filter(([, d]) => inR(d, r)).map(([id, d]) => ({ id, d })).sort(sortByDate)
  const glance = summary.filter((x) => GLANCE_KEYS.includes(x.k))
  const ramadan = ramadanChapters(src, r)
  const charity = charityOf(src.charity || [], r)
  const empty = !khatms.length && !surahs.length && !hifz.length && !notes.length && !duas.length && !ramadan.length
    && !charity.count && !stamps.length && !glance.length
  return { from, to, khatms, surahs, ayahsLife, hifz, notes: notes.slice(0, LIST_MAX), duas, ramadan, charity, stamps, glance, empty }
}
