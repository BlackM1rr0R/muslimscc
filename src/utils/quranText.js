// ═══════════════════════════════════════════════════════
// Quran mətninin GÖSTƏRİLMƏ qaydaları — tətbiq (QuranPage.jsx) və statik
// SEO səhifələri (scripts/prerender.mjs → /quran/<n>-<slug>) eyni qaydanı
// işlətsin. Mətnin özü dəyişdirilmir.
// ═══════════════════════════════════════════════════════

// ── Bəsmələnin təkrarlanmaması ──
// API (ar.alafasy / quran-uthmani) Fatihə və Tövbədən başqa 112 surədə 1-ci
// ayənin mətninin əvvəlinə Bəsmələni yapışdırır. Oxuyucuda Bəsmələ ayrıca
// kartda olduğu üçün 1-ci ayədə onun ilk dörd sözünü göstərmirik (mətn
// dəyişmir, yalnız təkrar gizlənir). Müqayisə hərəkələrsiz aparılır: 95 və
// 97-ci surələrdə yazılış "بِّسْمِ" kimidir.
const AR_MARKS = /[ً-ٰٟۖ-ۭـ]/g
const plainArabic = s => s.replace(AR_MARKS, '').replace(/ٱ/g, 'ا')
const BASMALA_PLAIN = 'بسم الله الرحمن الرحيم'
export function withoutLeadingBasmala(text) {
  const words = text.split(' ')
  if (words.length > 4 && plainArabic(words.slice(0, 4).join(' ')) === BASMALA_PLAIN) {
    return words.slice(4).join(' ')
  }
  return text
}

// Ayrıca kartda göstərilən Bəsmələ (oxuyucunun başlığı altında)
export const BASMALA_DISPLAY = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ'

/** Fatihədə Bəsmələ 1-ci ayənin özüdür, Tövbədə isə oxunmur. */
export const hasSeparateBasmala = (surah) => surah !== 1 && surah !== 9

/**
 * Ayənin göstərilən ərəbcə mətni: Fatihənin 1-ci ayəsindəki BOM (U+FEFF)
 * atılır, 1-ci ayədə təkrar Bəsmələ gizlənir.
 */
export function displayAyah(text, surah, index) {
  const t = String(text || '').replace(/^﻿/, '')
  return index === 0 && hasSeparateBasmala(surah) ? withoutLeadingBasmala(t) : t
}

// ── Ayə sayının sözü (cəm qaydası) ──
// Rus və ərəb dillərində söz rəqəmə görə dəyişir: "123 аята" / "7 аятов",
// "7 آيات" / "286 آية". Əvvəl hər yerdə tək forma idi ("286 آيات", "123 аятов").
// Formalar Intl.PluralRules kateqoriyalarına görədir (ar few = 3–10).
export const AYAH_WORDS = {
  az: 'ayə',
  en: { one: 'verse', few: 'verses', many: 'verses', other: 'verses' },
  ru: { one: 'аят', few: 'аята', many: 'аятов', other: 'аята' },
  ar: { one: 'آية', few: 'آيات', many: 'آية', other: 'آية' },
  tr: 'ayet',
}
/** Rəqəmə uyğun söz: forms[lang] sətirdirsə həmişə odur, obyektdirsə — cəm kateqoriyası. */
export function pluralWord(n, lang, forms = AYAH_WORDS) {
  const f = forms[lang] ?? forms.en
  if (typeof f === 'string') return f
  let cat = 'other'
  try { cat = new Intl.PluralRules(lang).select(Number(n) || 0) } catch { /* köhnə brauzer */ }
  return f[cat] ?? f.other
}
/** "286 ayə", "123 аята", "7 آيات" */
export const ayahCountText = (n, lang, forms = AYAH_WORDS) => `${n} ${pluralWord(n, lang, forms)}`
