// ═══════════════════════════════════════════════════════
// Səhifə bələdçiləri üçün ortaq köməkçilər (Uşaqlar, Haqqımızda, Xeyriyyə,
// Sədəqə gündəliyi, Dua gündəliyi — src/data/pageGuides/*.js).
//
// src(...) — hədis/ayə mənbəyini 5 dildə qurur: src(['bukhari', 1423], ['muslim', 1031]).
// Hər nömrə hadith-api ilə (cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1) və
// Quran ayələri api.quran.com ilə yoxlanılıb. Müslimin nömrələri Fuad Abdulbaqi
// nömrələməsidir (API-də "arabicnumber").
// ═══════════════════════════════════════════════════════

const BOOKS = {
  bukhari:  { az: 'Buxari', en: 'al-Bukhari', ru: 'аль-Бухари', ar: 'البخاري', tr: 'Buhârî' },
  muslim:   { az: 'Müslim', en: 'Muslim', ru: 'Муслим', ar: 'مسلم', tr: 'Müslim' },
  abudawud: { az: 'Əbu Davud', en: 'Abu Dawud', ru: 'Абу Дауд', ar: 'أبو داود', tr: 'Ebû Dâvûd' },
  tirmidhi: { az: 'Tirmizi', en: 'at-Tirmidhi', ru: 'ат-Тирмизи', ar: 'الترمذي', tr: 'Tirmizî' },
  ibnmajah: { az: 'İbn Macə', en: 'Ibn Majah', ru: 'Ибн Маджа', ar: 'ابن ماجه', tr: 'İbn Mâce' },
  quran:    { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: 'Kur’an' },
}

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const arNum = (v) => String(v).replace(/\d/g, d => AR_DIGITS[d])

/** src(['bukhari', 1423], ['muslim', 1031]) → { az: 'Buxari 1423; Müslim 1031', … } */
export function src(...parts) {
  const out = {}
  for (const l of LANGS) {
    out[l] = parts.map(([book, n]) => `${BOOKS[book][l]} ${l === 'ar' ? arNum(n) : n}`).join(l === 'ar' ? '؛ ' : '; ')
  }
  return out
}

// Hədis dərəcələri (Albani hökmü — hadith-api-dəki qiymətləndirmə ilə yoxlanılıb)
export const GRADE = {
  agreed:     { az: 'Səhih', en: 'Sahih', ru: 'Достоверный', ar: 'صحيح', tr: 'Sahih' },
  sahihAlb:   { az: 'Səhih (Albani)', en: 'Sahih (al-Albani)', ru: 'Достоверный (аль-Албани)', ar: 'صحيح (الألباني)', tr: 'Sahih (Elbânî)' },
  hasanAlb:   { az: 'Həsən (Albani)', en: 'Hasan (al-Albani)', ru: 'Хороший (аль-Албани)', ar: 'حسن (الألباني)', tr: 'Hasen (Elbânî)' },
  hasanSahih: { az: 'Həsən səhih (Albani)', en: 'Hasan sahih (al-Albani)', ru: 'Хороший достоверный (аль-Албани)', ar: 'حسن صحيح (الألباني)', tr: 'Hasen sahih (Elbânî)' },
}
