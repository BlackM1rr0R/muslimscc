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
