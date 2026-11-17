// ═══════════════════════════════════════════════════════
// Müsəlman dünyası atlası — saf hesab (components/MuslimAtlas.jsx)
//
// • Rəqəmlər yalnız data/muslimPopulation.js-dən (Pew Research Center, 2010/2020).
// • Rəng sinifləri: payı (%) üçün 8 pilləli ardıcıl şkala, dəyişmə (faiz bəndi) üçün
//   7 pilləli iki tərəfli şkala; dairə radiusu sayın kvadrat kökü ilə (sahə ∝ say).
// • Xəritə fiqurları world-atlas-dakı ISO 3166 rəqəmli id ilə tapılır; id-siz üç fiqur
//   (Kosovo, Şimali Kipr, Somalilend) Pew-un ərazi bölgüsünə görə adla bağlanır.
// • Ölkə adı Intl.DisplayNames (region) ilə 5 dildə, olmasa Pew-un ingiliscə adı.
// ═══════════════════════════════════════════════════════
import { MP_COUNTRIES, MP_REGIONS } from '../data/muslimPopulation'

export const SHARE_BINS = [1, 5, 10, 25, 50, 75, 90]         // 8 sinif: <1, 1–5, …, ≥90
export const CHANGE_BINS = [-5, -1, -0.1, 0.1, 1, 5]          // 7 sinif (faiz bəndi)

/** Sıralanmış hədlərə görə sinif nömrəsi (0…bins.length) */
export function binIndex(v, bins) {
  if (!Number.isFinite(v)) return -1
  let i = 0
  while (i < bins.length && v >= bins[i]) i++
  return i
}

export const shareClass = (pct) => binIndex(pct, SHARE_BINS)
export const changeClass = (pp) => binIndex(pp, CHANGE_BINS)

/** Sahəsi saya mütənasib dairənin radiusu */
export function radiusFor(n, max, rMax = 26) {
  if (!(n > 0) || !(max > 0)) return 0
  return Math.sqrt(Math.min(n, max) / max) * rMax
}

/** 2010 → 2020 dəyişmə: say, faiz bəndi, nisbi artım (%) */
export function changeOf(c) {
  const a = c?.[2010], b = c?.[2020]
  if (!a || !b) return null
  return {
    abs: b.muslims - a.muslims,
    pp: Math.round((b.pct - a.pct) * 10) / 10,
    rel: a.muslims > 0 ? ((b.muslims - a.muslims) / a.muslims) * 100 : null,
  }
}

const BY_ISO3 = new Map(MP_COUNTRIES.map((c) => [c.iso3, c]))
const BY_NUM = new Map(MP_COUNTRIES.filter((c) => c.num).map((c) => [c.num, c.iso3]))
// world-atlas 110m: id-siz fiqurlar → Pew ərazisi (Pew: Kipr bütün ada, Somali Somalilendlə birgə)
export const NAMED_SHAPES = { 'Kosovo': 'XKX', 'N. Cyprus': 'CYP', 'Somaliland': 'SOM' }

export const countryByIso3 = (iso3) => BY_ISO3.get(iso3) || null

/** world-atlas fiquru (id + properties.name) → ISO3 və ya null */
export function shapeIso3(id, name) {
  const k = id != null ? String(id).padStart(3, '0') : null
  if (k && BY_NUM.has(k)) return BY_NUM.get(k)
  return NAMED_SHAPES[name] || null
}

/** Ölçüyə görə ilk n ölkə: metric = 'pct' | 'muslims' | 'growth' (2010→2020 artım sayı) */
export function topN(metric, year = 2020, n = 10, list = MP_COUNTRIES) {
  const val = (c) => (metric === 'growth' ? changeOf(c)?.abs ?? -Infinity
    : metric === 'pct' ? c[year].pct : c[year].muslims)
  // Bərabər faizdə (məs. 99.9) böyük say önə keçir
  return [...list].sort((a, b) => val(b) - val(a) || b[year].muslims - a[year].muslims).slice(0, n)
}

/** Dünya cəmi və regionlar (Pew) */
export function worldTotals(year) {
  const w = MP_REGIONS.world[year]
  return { pop: w[0], muslims: w[1], pct: w[2] }
}

export function maxMuslims(year, list = MP_COUNTRIES) {
  return list.reduce((m, c) => Math.max(m, c[year].muslims), 0)
}

// ── Formatlama (Intl obyektləri keşdə — döngüdə yenidən yaradılmır) ──
const LOC = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar-u-nu-latn', tr: 'tr-TR' }
const fmtCache = new Map()
function getFmt(kind, lang, opts) {
  const k = `${kind}|${lang}`
  if (!fmtCache.has(k)) {
    let f
    try { f = kind === 'dn' ? new Intl.DisplayNames([LOC[lang] || 'en', 'en'], opts) : new Intl.NumberFormat(LOC[lang] || 'en-GB', opts) } catch { f = null }
    fmtCache.set(k, f)
  }
  return fmtCache.get(k)
}

export function countryName(c, lang = 'en') {
  if (!c) return ''
  if (c.iso2) {
    const dn = getFmt('dn', lang, { type: 'region', fallback: 'none' })
    try { const s = dn?.of(c.iso2); if (s) return s } catch { /* naməlum kod */ }
  }
  return c.name
}

export function fmtInt(n, lang = 'en') {
  const f = getFmt('int', lang, { maximumFractionDigits: 0 })
  return f ? f.format(n) : String(Math.round(n))
}

// Qısa yazı öz şəkilçiləri ilə (Intl "compact" bəzi brauzerlərdə az üçün "1.68G" verir)
const UNITS = {
  az: [' mlrd', ' mln', ' min'], en: ['bn', 'm', 'k'], ru: [' млрд', ' млн', ' тыс.'],
  ar: [' مليار', ' مليون', ' ألف'], tr: [' milyar', ' milyon', ' bin'],
}
export function fmtCompact(n, lang = 'en', digits = 1) {
  const u = UNITS[lang] || UNITS.en
  const a = Math.abs(n)
  const [div, suf] = a >= 1e9 ? [1e9, u[0]] : a >= 1e6 ? [1e6, u[1]] : a >= 1e3 ? [1e3, u[2]] : [1, '']
  const f = getFmt(`dec${digits}`, lang, { maximumFractionDigits: digits })
  const v = n / div
  return `${f ? f.format(v) : v.toFixed(digits)}${suf}`
}

export function fmtPct(v, lang = 'en', signed = false) {
  const f = getFmt(signed ? 'pcts' : 'pct', lang, { maximumFractionDigits: 1, minimumFractionDigits: 0, ...(signed ? { signDisplay: 'exceptZero' } : {}) })
  return `${f ? f.format(v) : v}%`
}

export function fmtSigned(n, lang = 'en') {
  const f = getFmt('signed', lang, { maximumFractionDigits: 0, signDisplay: 'exceptZero' })
  return f ? f.format(n) : String(n)
}
