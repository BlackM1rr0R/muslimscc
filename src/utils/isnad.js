// ═══════════════════════════════════════════════════════
// İsnad (ravilər zənciri) — hədisin ərəbcə tam mətnindən (hadith-api) çıxarılır
// (scripts/build-hadith-full.mjs işlədir; test: tests/unit/isnad.test.js)
//
// "حَدَّثَنَا A، قَالَ أَخْبَرَنَا B، عَنْ C، عَنِ ابْنِ عُمَرَ ـ رضى الله عنهما ـ قَالَ قَالَ رَسُولُ اللَّهِ ﷺ"
//   → ['A', 'B', 'C', 'ابْنِ عُمَرَ']
// • Adlar mətndən OLDUĞU KİMİ kəsilir (hərəkələr qalır) — heç nə əlavə edilmir.
// • Yalnız birinci zəncir (تحويل "ح"-dən əvvəl). Mətn (mətn hissəsi) Peyğəmbərin
//   ﷺ adı / "أن النبي" / "قال رسول الله" kimi işarədə başlayır.
// • Əmin olmadıqda (çox qısa/uzun zəncir, uzun "ad") — null: zəncir göstərilmir.
// ═══════════════════════════════════════════════════════

const DIAC = /[ؐ-ًؚ-ٰٟۖ-ۭـ‌‏‎]/

/** Hərəkəsiz mətn + hər simvolun orijinal indeksi */
function strip(text) {
  let out = ''
  const map = []
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (DIAC.test(ch)) continue
    out += ch.replace(/[إأآٱ]/, 'ا').replace('ى', 'ي')
    map.push(i)
  }
  map.push(text.length)
  return { s: out, map }
}

// Ötürmə sözləri (hərəkəsiz, normallaşdırılmış)
const TRANS = ['حدثنا', 'حدثني', 'اخبرنا', 'اخبرني', 'انبانا', 'انباني', 'حدثناه', 'سمعت', 'عن', 'قال', 'ان']
// Bu sözlərdən sonra gələn hissə ad deyil ("أخبره أن", "يقول" …) — kəsilir
const STOP = /^(?:قال|قالت|قالا|يقول|يقولان|اخبره|اخبرها|اخبرهم|حدثه|حدثها|حدثهم|علمهم|كان|كانت|انه|انها|ذكر|يحدث|رفعه|يرفعه|سمع)$/
// Mətnin başlanğıcı (Peyğəمbərə ﷺ çatan yer)
const MATN = /(?:^|\s|،)(?:قال|ان|انه|سمع|سمعت|عن|يقول|قالت|ان)?\s*(?:رسول الله|النبي|نبي الله)/
const FILLER = /^(?:قال|قالا|قالوا|قالت|وقال|يقول|يقولان|انه|انها|ان|و)$/

export function parseIsnad(text) {
  if (!text) return null
  const { s, map } = strip(String(text))
  const m = MATN.exec(s)
  if (!m) return null
  const end = m.index
  // تحويل (" ح "): bir neçə yol birləşir — düz zəncir deyil, göstərilmir
  if (/\sح\s/.test(s.slice(0, end))) return null
  const isnad = s.slice(0, end)
  // Ötürmə sözlərinin yerləri (söz sərhədi ilə)
  const re = new RegExp(`(?:^|[\\s،.:"])(?:و)?(${TRANS.join('|')})(?=[\\s،])`, 'g')
  const cuts = []
  let x
  while ((x = re.exec(isnad))) cuts.push({ at: x.index + x[0].length, from: x.index, w: x[1] })
  if (cuts.length < 2) return null
  const names = []
  for (let i = 0; i < cuts.length; i++) {
    const a = cuts[i].at
    const b = i + 1 < cuts.length ? cuts[i + 1].from : isnad.length
    // Orijinal mətndən kəs (hərəkələrlə)
    let seg = String(text).slice(map[a], map[b])
    seg = seg.replace(/ـ?\s*رض[يى]\s*الله\s*عن(?:هما|هم|ها|ه)\s*ـ?/g, '')
      .replace(/[«»"“”‏.:]/g, ' ').replace(/\s+/g, ' ').trim()
    // Sondakı "قال" / "أنه" kimi sözlər (hərəkəsiz müqayisə)
    let words = seg.split(/[\s،]+/).filter(Boolean)
    while (words.length && FILLER.test(strip(words[0]).s)) words.shift()
    const stop = words.findIndex((w, j) => j > 0 && STOP.test(strip(w).s))
    if (stop > 0) words = words.slice(0, stop)
    while (words.length && FILLER.test(strip(words[words.length - 1]).s)) words.pop()
    // "قال"/"أن" ilə başlayan SONUNCU hissə mətnin başlanğıcıdır (məs. "قال لعن"), ad deyil
    // — yalnız ad kimi görünəndə saxlanır ("ابن عمر" bəli, "لعن" yox)
    if ((cuts[i].w === 'قال' || cuts[i].w === 'ان') && i === cuts.length - 1 &&
      !(words.length >= 2 && /(?:^|\s)(?:ابن|ابو|ابي|بن|بنت|ام)(?:\s|$)/.test(strip(words.join(' ')).s))) continue
    const name = words.join(' ').replace(/[،,]\s*$/, '').trim()
    if (!name) continue
    if (name.length > 70) return null
    names.push(name)
  }
  if (names.length < 3 || names.length > 12) return null
  // Bir neçə yol / şübhəli kəsim: "كلاهما", "جميعا", "المعنى واحد", "أو" (şəkk) — göstərilmir
  const flat = names.map(n => strip(n).s)
  if (flat.some(n => /(?:^|\s)(?:كلاهما|جميعا|المعني|او|واحد)(?:\s|$)|-\s*او/.test(n))) return null
  if (new Set(flat).size !== flat.length) return null
  return names
}
