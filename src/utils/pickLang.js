// ═══════════════════════════════════════════════════════
// Çoxdilli sahədən YALNIZ cari dili seçmək (admin / Firebase məzmunu)
//
// Admin paneldən gələn məzmunda ({ az, en, ru, ar, tr }) bəzi dillər boş
// qala bilər. Belə halda mətn BAŞQA DİLLƏ (ingiliscə daxil) əvəz OLUNMUR —
// boş sətir qaytarılır və element həmin dildə göstərilmir.
// İnkişaf rejimində konsola bir dəfə "[i18n]" xəbərdarlığı yazılır.
//
//   pickLang({ az:'Salam', en:'Hello' }, 'ru')  → ''   (+ dev xəbərdarlığı)
//   pickLang('Sadə mətn', 'tr')                 → 'Sadə mətn'
//   hasLang({ az:'Salam' }, 'az')               → true
// ═══════════════════════════════════════════════════════

const IS_DEV = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV
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
