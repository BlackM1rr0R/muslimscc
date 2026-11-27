// ═══════════════════════════════════════════════════════════════════════
// Instagram: "Ramazana N gün qaldı" story-si (server/instagram.js → ramadanTick; IG_RAMADAN, IG_RAMADAN_TIME)
//
// • Yalnız saytın /road-to-ramadan hesabı və mətnləri: server/instagram-ramadan-data.js (scripts/build-instagram-data.mjs
//   yaradır — Ramazanın başlanğıcı utils/ramadanRange-dən, Ümmül-Qura; yolun addımları utils/ramadanPrep → roadPlan;
//   başlıq / mətn components/ramadanPrep/prepText.js). Burada tarix də, mətn də YAZILMIR.
// • Aktiv pəncərə: Ramazana 90 … 1 gün qalan günlər (saytın yolu ilə eyni). Ramazan ərzində və yol açılmamış — sönülü.
//   Gün Asia/Baku təqvimi ilə sayılır (çağıran "YYYY-MM-DD" verir — instagram.js nowAt(TZ)).
// • Hicri tarix: server/hijri.js (saytın utils/hijri.js-in surəti, Intl Ümmül-Qura; tests/unit/server-hijri.test.js).
// • Dini mətn YOXDUR: addımların izahı interfeys istiqamətidir; sitat gətirən addımlarda (hədis / dua) yalnız başlıq göstərilir.
// tests/unit/server-instagram-ramadan.test.js
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const DATA = require('./instagram-ramadan-data')
const hijri = require('./hijri')

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 864e5

const dayMs = (d) => Date.parse(`${d}T00:00:00Z`)
const diffDays = (a, b) => Math.round((dayMs(b) - dayMs(a)) / DAY_MS)
function shiftDay(d, n) {
  const t = dayMs(d)
  return Number.isFinite(t) ? new Date(t + n * DAY_MS).toISOString().slice(0, 10) : null
}
const validDay = (d) => DATE_RE.test(String(d || '')) && shiftDay(d, 0) === d
const pick = (obj, lang) => (obj ? (obj[lang] != null ? obj[lang] : obj.en) : null)

/**
 * Gün ('YYYY-MM-DD', Bakı təqvimi) → vəziyyət:
 *   { phase: 'road', active: true, year, start, end, daysLeft, n, kind } — Ramazana 90…1 gün qalıb (n === daysLeft)
 *   { phase: 'early', active: false, year, start, end, daysLeft, opensOn } — yol hələ açılmayıb
 *   { phase: 'ramadan', active: false, year, start, end, day } — Ramazandadır
 *   { phase: 'none', active: false } — tarix yararsızdır və ya məlumat faylının hüdudundan kənardır
 */
function countdown(day) {
  if (!validDay(day)) return { phase: 'none', active: false }
  const y = DATA.years.find((x) => x.e >= day)
  if (!y) return { phase: 'none', active: false }
  const base = { year: y.y, start: y.s, end: y.e }
  if (day >= y.s) return { phase: 'ramadan', active: false, ...base, day: diffDays(y.s, day) + 1 }
  const daysLeft = diffDays(day, y.s)
  if (daysLeft > DATA.roadDays) return { phase: 'early', active: false, ...base, daysLeft, opensOn: shiftDay(y.s, -DATA.roadDays) }
  const kind = DATA.kinds[y.plan[DATA.roadDays - daysLeft]]
  return { phase: 'road', active: true, ...base, daysLeft, n: daysLeft, kind }
}

/** Gün → saytdakı kimi hicri tarix ("17 Jumada al-Akhirah 1448 AH" — utils/hijri.formatHijri) | null */
function hijriLabel(day, lang = 'en') {
  const g = hijri.parseGKey(day)
  const h = g ? hijri.gregorianToHijri(g) : null
  if (!h || !(h.month >= 1 && h.month <= 12)) return null
  const L = LANGS.includes(lang) ? lang : 'en'
  return `${h.day} ${DATA.hijriMonths[L][h.month - 1]} ${h.year} ${DATA.hijriSuffix[L]}`.trim()
}

/** Addımın başlıq / mətni (saytın yolundakı kimi) */
function stepText(kind, lang = 'en') {
  const s = DATA.steps[kind]
  if (!s) return null
  return { title: pick(s.title, lang), text: pick(s.text, lang) }
}

/** Gün sayı → bütöv ifadə ("1 day until Ramadan" / "73 days until Ramadan" — prepText T.daysLeft) */
function daysLeftPhrase(n, lang = 'en') {
  const list = pick(DATA.daysLeft, lang)
  return Number.isInteger(n) && n >= 1 && n <= list.length ? list[n - 1] : null
}

/** Saytdakı səhifənin keçid mətni (dil prefiksi ilə; az — prefikssiz) */
const roadLink = (lang = 'en') => `muslims.cc${lang === 'az' ? '' : `/${LANGS.includes(lang) ? lang : 'en'}`}/road-to-ramadan`

/**
 * Story kartının məzmunu (instagramCard.renderRamadanCard) | null (bu gün aktiv deyil / mətn yoxdur).
 * key — dərc sətrinin item-i: "ramadan:<hicri il>:<qalan gün>".
 */
function storyContent(day, lang = 'en') {
  const L = LANGS.includes(lang) ? lang : 'en'
  const st = countdown(day)
  if (!st.active) return null
  const step = stepText(st.kind, L)
  const headline = daysLeftPhrase(st.n, L)
  const y = DATA.years.find((x) => x.y === st.year)
  const hl = hijriLabel(day, L)
  if (!step || !step.title || !headline || !hl) return null
  const labels = DATA.labels[L] || DATA.labels.en
  return {
    kind: 'ramadan', key: `ramadan:${st.year}:${st.n}`, lang: L, year: st.year, daysLeft: st.n, step: st.kind,
    eyebrow: labels.road, headline, hijri: hl, startsOn: pick(y.startsOn, L),
    stepLabel: labels.today, stepTitle: step.title, stepText: step.text, note: labels.calc, link: roadLink(L),
  }
}

/** Admin paneli üçün qısa vəziyyət */
function statusFor(day, lang = 'en') {
  const st = countdown(day)
  const out = { phase: st.phase, active: st.active, year: st.year || null, start: st.start || null, end: st.end || null, daysLeft: st.daysLeft == null ? null : st.daysLeft }
  if (st.phase === 'early') out.opensOn = st.opensOn
  if (st.phase === 'ramadan') out.day = st.day
  if (st.active) { const s = stepText(st.kind, lang); out.step = { n: st.n, kind: st.kind, title: s ? s.title : null } }
  return out
}

module.exports = { countdown, hijriLabel, stepText, daysLeftPhrase, roadLink, storyContent, statusFor, shiftDay, DATA }
