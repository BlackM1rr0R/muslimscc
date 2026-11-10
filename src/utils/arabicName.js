// ═══════════════════════════════════════════════════════
// Ad → ərəb yazısı (/name-in-arabic). Saf məntiq; tests/unit/arabic-name.test.js
//
//  1) Lüğət (data/arabicNames.js) — standart yazılış, "dəqiq" sayılır.
//     Açar: kiçik hərf, az/tr hərfləri sadələşdirilir, kiril → latın
//     (Məhəmməd, Mehmet, Мухаммад … eyni sətrə düşür). Tapılmazsa — "yumşaq"
//     açar (e→a, o→u, y→i, qoşa hərf → tək) ilə yenə axtarılır.
//  2) Tapılmayan söz — fonetik transliterasiya: TƏXMİNİDİR, səhifə bunu
//     açıq yazır ("ərəb dilini bilən birinə yoxladın"). Ərəb əlifbasında
//     olmayan səslər: p→ب, g→غ, v→ف, ç→تش (ərəb mətbuatının adi yolu).
// ═══════════════════════════════════════════════════════
import { NAMES, MEANINGS, SUGGEST, ABD_OTHER } from '../data/arabicNames.js'

// Kiril → "fonetik latın" (az hərfləri ilə: x = kh, ş, ç …)
const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ç', ш: 'ş', щ: 'şç', ъ: '',
  ы: 'ı', ь: '', э: 'e', ю: 'yu', я: 'ya',
  // azərbaycan kirili
  ә: 'ə', ғ: 'ğ', ҹ: 'c', ү: 'ü', ө: 'ö', ҝ: 'g', һ: 'h', ј: 'y', қ: 'q', ң: 'n', ұ: 'u', і: 'i',
}

/** İstənilən yazılış → fonetik latın (kiçik hərf, yalnız hərflər və boşluq) */
export function phonetic(input) {
  let s = String(input || '').normalize('NFC').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
  // "I" türk/az dilində "ı"dır, ingilis/rus dilində "i" — kiçik hərflə yazılmış adda fərq yoxdur;
  // böyük I ilə başlanan adlarda (Ibrahim, Ilyas) "i" daha doğrudur
  s = s.replace(/(^|\s)ı/g, '$1i')
  s = Array.from(s).map(ch => (CYR[ch] !== undefined ? CYR[ch] : ch)).join('')
  s = s.replace(/[âä]/g, 'a').replace(/[îï]/g, 'i').replace(/[ûù]/g, 'u').replace(/[ôò]/g, 'o').replace(/é|è|ê/g, 'e')
  return s.replace(/[’'`ʿʾ‘-]+/g, '').replace(/[^a-zəöüışçğx\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Lüğət açarı: fonetik latın, az/tr hərfləri sadə, boşluqsuz */
export function foldKey(input) {
  return phonetic(input)
    .replace(/ə/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ı/g, 'i')
    .replace(/ş/g, 'sh').replace(/ç/g, 'ch').replace(/ğ/g, 'g').replace(/x/g, 'kh')
    .replace(/\s+/g, '')
}

/** Yumşaq açar — sait fərqləri və qoşa hərflər nəzərə alınmır */
export function looseKey(key) {
  return key.replace(/e/g, 'a').replace(/o/g, 'u').replace(/y/g, 'i').replace(/(.)\1+/g, '$1')
}

let exact = null, loose = null
function index() {
  if (exact) return
  exact = new Map(); loose = new Map()
  const conflict = new Set()
  for (const [ar, variants, mean] of NAMES) {
    const rec = { ar, mean, latin: variants[0] }
    for (const v of variants) {
      const k = foldKey(v)
      if (!exact.has(k)) exact.set(k, rec)
      const l = looseKey(k)
      if (loose.has(l) && loose.get(l).ar !== ar) conflict.add(l)
      else loose.set(l, rec)
    }
  }
  for (const l of conflict) loose.delete(l)
}

/** Lüğətdən tap: { ar, mean, latin } | null */
export function lookupName(input) {
  index()
  const k = foldKey(input)
  if (!k) return null
  return exact.get(k) || loose.get(looseKey(k)) || null
}

export const meaningOf = (key) => (key ? MEANINGS[key] || null : null)

// ── Fonetik transliterasiya (təxmini) ──
const DIGRAPH = { sh: 'ش', ch: 'تش', kh: 'خ', gh: 'غ', th: 'ث', dh: 'ذ', zh: 'ج', ph: 'ف' }
const CONS = {
  b: 'ب', c: 'ج', ç: 'تش', d: 'د', f: 'ف', g: 'غ', ğ: 'غ', h: 'ه', x: 'خ', j: 'ج', k: 'ك', q: 'ق', l: 'ل', m: 'م',
  n: 'ن', p: 'ب', r: 'ر', s: 'س', ş: 'ش', t: 'ت', v: 'ف', w: 'و', y: 'ي', z: 'ز',
}
const VOWEL = { a: 'A', ə: 'A', e: 'E', i: 'I', ı: 'I', o: 'U', ö: 'U', u: 'U', ü: 'U' }

function tokens(word) {
  const out = []
  for (let i = 0; i < word.length;) {
    const two = word.slice(i, i + 2)
    if (two === 'ou' || two === 'oo') { out.push({ v: 'U' }); i += 2; continue }
    if (two === 'ee') { out.push({ v: 'I' }); i += 2; continue }
    if (DIGRAPH[two]) { out.push({ c: DIGRAPH[two] }); i += 2; continue }
    const ch = word[i]
    if (VOWEL[ch]) out.push({ v: VOWEL[ch] })
    else if (CONS[ch]) out.push({ c: CONS[ch] })
    i++
  }
  // Qoşa samit və qoşa sait → tək (şəddə/uzatma qoyulmur)
  return out.filter((t, i) => {
    const p = out[i - 1]
    return !p || (t.c ? t.c !== p.c : t.v !== p.v)
  })
}

/** Bir söz → ərəb hərfləri (təxmini) */
export function transliterateWord(word) {
  const tk = tokens(phonetic(word).replace(/\s+/g, ''))
  let s = ''
  tk.forEach((t, i) => {
    if (t.c) { s += t.c; return }
    if (i === 0) { s += t.v === 'A' ? 'أ' : t.v === 'U' ? 'أو' : 'إ'; return }
    // saitdən sonra gələn sait (hiatus): həmzəli daşıyıcı
    if (!tk[i - 1].c) { s += t.v === 'A' ? 'ئا' : t.v === 'U' ? 'ؤ' : 'ئ'; return }
    const ch = t.v === 'A' ? 'ا' : t.v === 'U' ? 'و' : 'ي'
    // "iy", "ye", "uv"… — sait yanındakı eyni hərfli samitlə birləşir (يي → ي)
    if (ch !== 'ا' && (s.endsWith(ch) || tk[i + 1]?.c === ch)) return
    s += ch
  })
  return s
}

export function transliterate(input) {
  return phonetic(input).split(' ').filter(Boolean).map(transliterateWord).join(' ')
}

/** "Əbd" + Allahdan başqası (Əbdünnəbi, Abdulhuseyn …) */
export function isAbdOther(input) {
  // Ad + soyad: hər söz və qonşu iki söz ("Abdul Nabi") ayrıca yoxlanır
  const w = phonetic(input).split(' ').filter(Boolean)
  if (w.length > 1) return w.some((x, i) => abdOne(x) || (i < w.length - 1 && abdOne(x + w[i + 1])))
  return abdOne(input)
}
function abdOne(input) {
  const k = foldKey(input)
  const m = /^(abdul|abdal|abdel|abdil|abdol|abdu|abd)(.*)$/.exec(k)
  if (!m) return false
  // "abdunnabi", "abdurrasul" — birləşmə hərfini (n, r, z …) at
  const rest = m[2]
  return ABD_OTHER.some(x => rest === x || rest.slice(1) === x || looseKey(rest) === looseKey(x) || looseKey(rest.slice(1)) === looseKey(x))
}

/**
 * Tam çevirmə: əvvəl bütöv ad lüğətdə, sonra söz-söz.
 * Qaytarır: { ar, parts: [{ src, ar, kind: 'dict'|'approx' }], approximate, mean, abdNote, suggest }
 */
export function toArabic(input) {
  const src = String(input || '').trim()
  if (!phonetic(src)) return { ar: '', parts: [], approximate: false, mean: null, abdNote: false, suggest: null }
  const abdNote = isAbdOther(src)
  const whole = lookupName(src)
  const sug = SUGGEST[foldKey(src)] || null
  if (whole && !abdNote) {
    return { ar: whole.ar, parts: [{ src, ar: whole.ar, kind: 'dict' }], approximate: false, mean: meaningOf(whole.mean), abdNote, suggest: null }
  }
  const words = src.split(/[\s-]+/).filter(w => phonetic(w))
  const parts = words.map(w => {
    const hit = lookupName(w)
    return hit ? { src: w, ar: hit.ar, kind: 'dict' } : { src: w, ar: transliterateWord(w), kind: 'approx' }
  })
  return {
    ar: parts.map(p => p.ar).join(' '),
    parts,
    approximate: abdNote || parts.some(p => p.kind === 'approx'),
    mean: null,
    abdNote,
    suggest: sug,
  }
}

// ── Hərf seçici (yalnız standart ərəb hərfləri) ──
export const PICKER_LETTERS = Array.from('ابتثجحخدذرزسشصضطظعغفقكلمنهوي')
export const PICKER_EXTRA = Array.from('أإآءؤئةى')
export const ARABIC_RE = /^[ء-ي\s]*$/
