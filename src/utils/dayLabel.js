// ═══════════════════════════════════════════════════════
// 'YYYY-MM-DD' → qısa yerli tarix ("3 noy 2026" / "3 Nov 2026"). Formatlayıcı dil üzrə BİR DƏFƏ
// yaradılır (siyahılarda hər element üçün Intl obyekti yaradılmır — mobil CPU). Chrome-un yığcam
// ICU-sunda "az" lokalı yoxdur — azərbaycanca ay adları əl ilə (CharityPage ilə eyni qısaltmalar).
// ═══════════════════════════════════════════════════════
const AZ_MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek']
const LOCALES = { en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-nu-latn' }
const FMT = new Map()

function formatter(lang) {
  if (!FMT.has(lang)) {
    let f = null
    try { f = new Intl.DateTimeFormat(LOCALES[lang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) } catch { f = null }
    FMT.set(lang, f)
  }
  return FMT.get(lang)
}

export function dayLabel(key, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''))
  if (!m) return String(key || '')
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3])
  if (lang === 'az') return `${d} ${AZ_MONTHS_SHORT[mo - 1]} ${y}`
  const f = formatter(lang)
  return f ? f.format(new Date(Date.UTC(y, mo - 1, d, 12))) : key
}
