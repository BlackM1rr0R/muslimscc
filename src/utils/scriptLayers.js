// ═══════════════════════════════════════════════════════
// Quranın yazı tarixi qat-qat (components/ScriptLayers.jsx) — saf çevirmə
//
// QAYDA: mətnə heç bir hərf ƏLAVƏ OLUNMUR, sıra DƏYİŞMİR. Qatlar yalnız
// gizlədir:
//   3 — mənbə mətn olduğu kimi (saytın Osmani mətni);
//   2 — yalnız hərəkələr və kiçik işarələr gizlənir (fəthə, kəsrə, zəmmə,
//       tənvin, sükun, şəddə, üstün əlif, mədd, kiçik vav/ya/mim, təcvid
//       işarələri, təthvil) — hərflər toxunulmaz qalır;
//   1 — "rəsm": 2-ci qatın hər hərfi öz NÖQTƏSİZ skeletinə (Unicode-un hazır
//       nöqtəsiz hərfləri) çevrilir — hərf-hərf, söz sayı və sırası eyni.
//       Həmzə işarəsi də sonrakı əlavədir: أ إ آ ٱ → ا, ؤ → و, ئ → ya dişi.
//       Mövqe: ن və ي (ئ) sözün sonunda ں / ى, əvvəl və ortada ٮ (eyni diş).
// ═══════════════════════════════════════════════════════

// Hərəkə və kiçik işarələr: bütün birləşən işarələr (Mn) + kiçik vav/ya (U+06E5/06E6,
// Unicode-da "Lm") + təthvil (U+0640, yalnız işarə daşıyıcısı). BOM da (görünməz).
export const MARKS_RE = /[\p{Mn}\u06E5\u06E6\u0640\uFEFF]/gu

/** 2-ci qat: yalnız hərəkə/işarələr gizlənir, hərflər olduğu kimi */
export const stripMarks = (text) => String(text ?? '').replace(MARKS_RE, '')

export const DOTLESS_BEH = '\u066E'   // ٮ nöqtəsiz bə (diş)
export const DOTLESS_QAF = '\u066F'   // ٯ
export const DOTLESS_FEH = '\u06A1'   // ڡ
export const NOON_GHUNNA = '\u06BA'   // ں nöqtəsiz son nun
export const ALEF_MAKSURA = '\u0649'  // ى nöqtəsiz son ya

// Mövqedən asılı olmayan xəritə (nöqtəli hərf → skelet)
export const RASM_MAP = {
  'ب': DOTLESS_BEH, 'ت': DOTLESS_BEH, 'ث': DOTLESS_BEH,
  'ج': 'ح', 'خ': 'ح',
  'ذ': 'د', 'ز': 'ر', 'ش': 'س', 'ض': 'ص', 'ظ': 'ط', 'غ': 'ع',
  'ف': DOTLESS_FEH, 'ق': DOTLESS_QAF, 'ة': 'ه',
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ٲ': 'ا', 'ٳ': 'ا',
  'ؤ': 'و',
}
// Mövqedən asılı: [son/tək, əvvəl/orta]
const POSITIONAL = {
  'ن': [NOON_GHUNNA, DOTLESS_BEH],
  'ي': [ALEF_MAKSURA, DOTLESS_BEH],
  'ئ': [ALEF_MAKSURA, DOTLESS_BEH],
  'ى': [ALEF_MAKSURA, DOTLESS_BEH],
}

// Ərəb hərfi (təthvil U+0640 xaric)
const isArabicLetter = (c) => /[\u0621-\u063F\u0641-\u064A\u066E-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC\u06FF]/.test(c)

/** Bir hərfin skeleti; isFinal — sözdə ondan sonra hərf yoxdur */
export function rasmLetter(ch, isFinal) {
  const p = POSITIONAL[ch]
  if (p) return isFinal ? p[0] : p[1]
  return RASM_MAP[ch] ?? ch
}

/** Bir söz (işarəsiz) → skelet, hərf-hərf (uzunluq eyni) */
export function rasmWord(word) {
  const chars = [...word]
  return chars.map((ch, i) => {
    const isFinal = !chars.slice(i + 1).some(isArabicLetter)
    return rasmLetter(ch, isFinal)
  }).join('')
}

/** 1-ci qat: işarələr gizlənir, sonra hər söz hərf-hərf skeletə çevrilir (boşluqlar yerində) */
export const toRasm = (text) => stripMarks(text).split(' ').map(rasmWord).join(' ')

/** Qat (1|2|3) → göstəriləcək mətn */
export function layerText(text, layer) {
  if (layer === 3) return String(text ?? '')
  if (layer === 2) return stripMarks(text)
  return toRasm(text)
}
