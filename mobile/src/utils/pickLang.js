// ═══════════════════════════════════════════════════════
// Çoxdilli sahədən YALNIZ cari dili seçmək (admin / Firebase məzmunu)
// (veb src/utils/pickLang.js-in mobil surəti; fərq yalnız __DEV__ sətridir)
//
// Admin paneldən gələn məzmunda ({ az, en, ru, ar, tr }) bəzi dillər boş
// qala bilər. Belə halda mətn BAŞQA DİLLƏ (ingiliscə daxil) əvəz OLUNMUR —
// boş sətir qaytarılır və element həmin dildə göstərilmir.
// İnkişaf rejimində konsola bir dəfə "[i18n]" xəbərdarlığı yazılır.
// ═══════════════════════════════════════════════════════

const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__ // RN: import.meta yoxdur
const warned = new Set()

/** Cari dildəki mətn; yoxdursa '' (başqa dilə düşmür). */
export function pickLang(v, lang, { warn = true } = {}) {
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  const x = typeof v === 'object' ? v[lang] : ''
  const s = typeof x === 'string' ? x.trim() : ''
  if (!s && warn && IS_DEV && typeof v === 'object') {
    const sample = String(Object.values(v).find(t => typeof t === 'string' && t.trim()) || '').slice(0, 40)
    const key = lang + '|' + sample
    if (sample && !warned.has(key)) {
      warned.add(key)
      console.warn(`[i18n] admin məzmununda "${lang}" mətni yoxdur — göstərilmir: "${sample}"`)
    }
  }
  return s
}

/** Sahədə cari dilin mətni varmı (xəbərdarlıq yazmadan). */
export function hasLang(v, lang) {
  return pickLang(v, lang, { warn: false }) !== ''
}
