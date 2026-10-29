// ═══════════════════════════════════════════════════════
// Qlobal axtarış mühərriki — normallaşdırma, indeks və sıralama
//
// Bu fayl React-dan asılı DEYİL: GlobalSearch.jsx onu istifadə edir,
// Node isə birbaşa test edə və ölçə bilir.
//
// NORMALLAŞDIRMA (bütün dillər üçün eyni qayda — toqquşma yoxdur):
//   • böyük/kiçik hərf fərqi yoxdur: İ, I → i
//   • az/tr: ə→e, ı→i, ş→s, ç→c, ğ→g, ö→o, ü→u (â, î, û → a, i, u)
//   • ru: ё→е (й olduğu kimi qalır)
//   • ərəb: hərəkələr (U+064B–U+065F, U+0670), uzatma xətti (tətvil) və Quran işarələri
//     silinir; أ إ آ ٱ → ا, ى → ي, ة → ه, ؤ → و, ئ → ي
//   • apostroflar silinir (Bid'ah → bidah), qalan durğu işarələri boşluq olur
//
// UYĞUNLUQ: çox sözlü sorğuda HƏR söz tapılmalıdır. Ən azı 2 simvol.
// SIRALAMA: tam söz (3) > sözün əvvəli (2) > kök (1.5) > sözün içi (1),
//   sahənin çəkisinə vurulur (başlıq > açar sözlər > mətn > mənbə).
// ═══════════════════════════════════════════════════════

import { parseSurahRef, localizeSource } from './sourceNames.js'
import { uniqueHadithsFor } from './uniqueHadiths.js'

export const MIN_QUERY = 2

// Qrupların standart sırası (bərabər xalda bu sıra qalır)
export const GROUP_ORDER = ['page', 'quran', 'hadith', 'dua', 'name', 'glossary']

// ── Simvol səviyyəsində normallaşdırma ────────────────

// Açıq xəritə — NFD ilə açılmayan və ya xüsusi davranış istəyən hərflər
const EXPLICIT = {
  'ə': 'e', 'ǝ': 'e', 'ı': 'i', 'ё': 'е',
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ٲ': 'ا', 'ٳ': 'ا',
  'ى': 'ي', 'ی': 'ي', 'ئ': 'ي', 'ؤ': 'و', 'ة': 'ه', 'ک': 'ك',
}

// Silinən apostrof növləri — sözü ikiyə bölməsin deyə boşluq deyil, heç nə
const APOSTROPHES = new Set(["'", '’', '‘', '`', '´', 'ʼ', 'ʾ', 'ʿ', 'ʻ', '′'])

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u
const LATIN_BASE = /^[a-z]$/

function isArabicMark(cp) {
  return (cp >= 0x064B && cp <= 0x065F) || cp === 0x0670 || cp === 0x0640 ||
    (cp >= 0x06D6 && cp <= 0x06ED) || (cp >= 0x08D3 && cp <= 0x08FF)
}

function isCombining(cp) {
  return (cp >= 0x0300 && cp <= 0x036F) || isArabicMark(cp)
}

const CHAR_CACHE = new Map()

/** Artıq kiçik hərfə salınmış TƏK simvolun normal forması ('' | ' ' | hərf). */
function normLowerChar(c) {
  let r = CHAR_CACHE.get(c)
  if (r !== undefined) return r
  r = computeChar(c)
  CHAR_CACHE.set(c, r)
  return r
}

function computeChar(c) {
  if (EXPLICIT[c] !== undefined) return EXPLICIT[c]
  if (APOSTROPHES.has(c)) return ''
  const cp = c.codePointAt(0)
  if (isCombining(cp)) return ''
  // Ərəb-hind rəqəmləri → 0-9
  if (cp >= 0x0660 && cp <= 0x0669) return String(cp - 0x0660)
  if (cp >= 0x06F0 && cp <= 0x06F9) return String(cp - 0x06F0)
  // Latın diakritikləri: ş → s, ā → a, ṣ → s ... (kiril й toxunulmur)
  const d = c.normalize('NFD')
  if (d.length > 1 && LATIN_BASE.test(d[0])) return d[0]
  return LETTER_OR_DIGIT.test(c) ? c : ' '
}

const NON_TRIVIAL = /[^a-z0-9 ]/gu

/**
 * Mətni axtarış üçün normallaşdır.
 * normalize('Səbr, İman!') → 'sebr iman'
 */
export function normalize(str) {
  if (str == null || str === '') return ''
  return String(str)
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(NON_TRIVIAL, normLowerChar)
    .replace(/ {2,}/g, ' ')
    .trim()
}

/**
 * normalize() ilə EYNİ nəticə + hər normal simvolun orijinal mətndəki yeri.
 * Vurğulama (<mark>) üçün lazımdır: normal mətndə tapılan uyğunluğu
 * orijinal mətnin [start, end) aralığına çevirir.
 */
export function normalizeWithMap(str) {
  const s = String(str ?? '')
  let norm = ''
  const starts = []
  const ends = []
  let i = 0
  for (const ch of s) {
    const len = ch.length
    const lower = ch === 'İ' ? 'i' : ch.toLowerCase()
    let out = ''
    for (const lc of lower) out += (lc >= 'a' && lc <= 'z') || (lc >= '0' && lc <= '9') || lc === ' ' ? lc : normLowerChar(lc)
    for (const oc of out) {
      if (oc === ' ' && (norm === '' || norm[norm.length - 1] === ' ')) continue
      norm += oc
      starts.push(i)
      ends.push(i + len)
    }
    i += len
  }
  if (norm.endsWith(' ')) {
    norm = norm.slice(0, -1)
    starts.pop()
    ends.pop()
  }
  return { norm, starts, ends }
}

// Ərəb əlifbası blokları: U+0600–U+06FF, U+0750–U+077F, U+08A0–U+08FF
function isArabicCode(c) {
  return (c >= 0x0600 && c <= 0x06FF) || (c >= 0x0750 && c <= 0x077F) || (c >= 0x08A0 && c <= 0x08FF)
}

/** Mətndə ərəb hərfi varmı? */
export function hasArabic(str) {
  const s = String(str || '')
  for (let i = 0; i < s.length; i++) if (isArabicCode(s.charCodeAt(i))) return true
  return false
}

// ── Sorğu ─────────────────────────────────────────────

/**
 * Xam sorğunu hazırla.
 * → { raw, norm, words:[{ w, stem, ar }], valid, arabic }
 *   stem — uzun latın/kiril sözü üçün qısaldılmış kök (namazı → namaz),
 *          söz özü tapılmayanda ehtiyat kimi yoxlanılır.
 */
export function prepareQuery(raw) {
  const text = String(raw ?? '')
  const norm = normalize(text)
  const seen = new Set()
  const words = []
  for (const w of norm.split(' ')) {
    if (!w || seen.has(w)) continue
    seen.add(w)
    const ar = hasArabic(w)
    let stem = null
    if (!ar && w.length >= 5) stem = w.length >= 7 ? w.slice(0, -2) : w.slice(0, -1)
    words.push({ w, stem, ar })
  }
  return {
    raw: text,
    norm,
    words,
    valid: norm.replace(/ /g, '').length >= MIN_QUERY,
    arabic: hasArabic(text),
  }
}

// ── İndeks ────────────────────────────────────────────

/**
 * Element: { id, type, ...göstəriş sahələri, fields:[[mətn, çəki, başlıqdır?], ...] }
 * İndeks girişi: { item, f:[{ p:' norm ', w, t }], all, len, order }
 */
export function buildEntries(items) {
  const out = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const f = []
    for (const spec of item.fields || []) {
      const [text, w, t] = spec
      if (!text) continue
      const n = normalize(text)
      if (!n) continue
      f.push({ p: ' ' + n + ' ', w, t: Boolean(t) })
    }
    if (!f.length) continue
    out.push({ item, f, all: f.map(x => x.p).join(''), len: f[0].p.length, order: i })
  }
  return out
}

/** Qruplar üzrə indeks: { page:[...], quran:[...], ... } */
export function buildIndex(sources) {
  const index = {}
  for (const type of Object.keys(sources)) index[type] = buildEntries(sources[type] || [])
  return index
}

// ── Uyğunluq və xal ───────────────────────────────────

/**
 * Sözün İÇİNDƏ tapılma nə vaxt sayılır?
 *   • latın/kiril: 4+ hərf — az/tr/ru şəkilçiləri sözün SONUNA gəlir, qısa söz
 *     üçün "sözün əvvəli" kifayətdir ("ana" → "anası", amma "insana" yox)
 *   • ərəb: 3+ hərf — önə yapışan و ب ل ف ك hissəcikləri üçün ("صبر" → "والصبر")
 */
function substringOk(wd) {
  return wd.w.length >= (wd.ar ? 3 : 4)
}

/** Bir sözün bir sahədə uyğunluq növü: 3 tam söz, 2 əvvəl, 1.5 kök, 1 içində, 0 yox. */
export function matchKind(p, wd) {
  const w = wd.w
  if (p.indexOf(w) !== -1) {
    if (p.indexOf(' ' + w + ' ') !== -1) return 3
    if (p.indexOf(' ' + w) !== -1) return 2
    if (wd.ar && !w.startsWith('ال')) {
      // Ərəbcə artikl: "رحمن" → "الرحمن" tam söz sayılır
      if (p.indexOf(' ال' + w + ' ') !== -1) return 3
      if (p.indexOf(' ال' + w) !== -1) return 2
    }
    if (wd.stem && p.indexOf(' ' + wd.stem) !== -1) return 1.5
    return substringOk(wd) ? 1 : 0
  }
  if (wd.stem && p.indexOf(' ' + wd.stem) !== -1) return 1.5
  return 0
}

/** Bir girişin xalı; hər söz tapılmasa null. */
export function scoreEntry(entry, q) {
  let total = 0
  let titleHit = false
  for (const wd of q.words) {
    // Sürətli rədd: söz də, kökü də heç bir sahədə yoxdursa
    if (entry.all.indexOf(wd.w) === -1 && !(wd.stem && entry.all.indexOf(' ' + wd.stem) !== -1)) return null
    let best = 0
    let bestTitle = false
    for (const f of entry.f) {
      const k = matchKind(f.p, wd)
      if (!k) continue
      const s = k * f.w
      if (s > best) { best = s; bestTitle = f.t && k >= 2 }
    }
    if (!best) return null
    total += best
    if (bestTitle) titleHit = true
  }
  const phrase = ' ' + q.norm
  for (const f of entry.f) {
    if (f.t && f.p === phrase + ' ') { total += 6; titleHit = true; break }
  }
  if (q.words.length > 1) {
    for (const f of entry.f) {
      if (f.p.indexOf(phrase) !== -1) { total += 2 * f.w; break }
    }
  }
  // Qısa, məqsədli mətnlər bərabər xalda yuxarı çıxsın (< 0.6)
  total += 0.6 * 60 / (60 + entry.len)
  return { s: total, titleHit }
}

/** Bir qrupun girişlərində axtar → xala görə sıralanmış [{ item, s, titleHit }] */
export function searchEntries(entries, q) {
  const res = []
  if (!entries || !q.valid || !q.words.length) return res
  for (const e of entries) {
    const r = scoreEntry(e, q)
    if (r) res.push({ item: e.item, s: r.s, titleHit: r.titleHit, order: e.order })
  }
  res.sort((a, b) => b.s - a.s || a.order - b.order)
  return res
}

/**
 * Bütün qruplarda axtar.
 * → { groups:{ type:[...] }, order:[type...] }  — order: "Hamısı" görünüşünün
 *   qrup sırası (ən yaxşı xala görə; səhifə başlığı uyğun gəlibsə səhifələr ilk).
 */
export function searchIndex(index, q) {
  const groups = {}
  for (const type of Object.keys(index)) groups[type] = searchEntries(index[type], q)
  return { groups, order: groupOrder(groups) }
}

/** "Hamısı" görünüşündə qrupların sırası. */
export function groupOrder(groups) {
  const types = GROUP_ORDER.filter(t => groups[t] && groups[t].length)
    .concat(Object.keys(groups).filter(t => !GROUP_ORDER.includes(t) && groups[t].length))
  const best = t => groups[t].reduce((m, r) => Math.max(m, r.s), 0)
  const pagesFirst = (groups.page || []).some(r => r.titleHit)
  return types
    .map((t, i) => ({ t, i, b: best(t) }))
    .sort((a, b) => {
      if (pagesFirst) {
        if (a.t === 'page') return -1
        if (b.t === 'page') return 1
      }
      return b.b - a.b || a.i - b.i
    })
    .map(x => x.t)
}

// ── Vurğulama və fraqment ─────────────────────────────

/** Orijinal mətndə uyğun gələn [start, end) aralıqları (birləşdirilmiş, sıralı). */
export function matchRanges(text, q) {
  const s = String(text ?? '')
  if (!s || !q || !q.words.length) return []
  const { norm, starts, ends } = normalizeWithMap(s)
  const ranges = []
  const push = (idx, len) => {
    let end = ends[idx + len - 1]
    // Arxadan gələn hərəkələri də daxil et ki, işarə hərfdən qopmasın
    while (end < s.length && isCombining(s.codePointAt(end))) end++
    ranges.push([starts[idx], end])
  }
  for (const wd of q.words) {
    // Sözün əvvəlində tapılanlar varsa, yalnız onlar vurğulanır; yoxdursa
    // (və icazəlidirsə) sözün içindəkilər — səs-küylü vurğudan qaçmaq üçün
    const atStart = []
    const inside = []
    const needles = [wd.w]
    if (wd.stem) needles.push(wd.stem)
    for (const n of needles) {
      const isStem = n !== wd.w
      let from = 0
      let idx
      while ((idx = norm.indexOf(n, from)) !== -1) {
        const wordStart = idx === 0 || norm[idx - 1] === ' ' ||
          (wd.ar && idx >= 2 && norm[idx - 2] === 'ا' && norm[idx - 1] === 'ل' && (idx === 2 || norm[idx - 3] === ' '))
        if (wordStart) atStart.push([idx, n.length])
        else if (!isStem && substringOk(wd)) inside.push([idx, n.length])
        from = idx + n.length
      }
    }
    for (const [idx, len] of (atStart.length ? atStart : inside)) push(idx, len)
  }
  if (!ranges.length) return ranges
  ranges.sort((a, b) => a[0] - b[0])
  const merged = [ranges[0].slice()]
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1]
    if (ranges[i][0] <= last[1]) last[1] = Math.max(last[1], ranges[i][1])
    else merged.push(ranges[i].slice())
  }
  return merged
}

function toSegments(text, ranges, from = 0, to = text.length) {
  const segs = []
  let pos = from
  for (const [a0, b0] of ranges) {
    const a = Math.max(a0, from)
    const b = Math.min(b0, to)
    if (b <= a) continue
    if (a > pos) segs.push({ text: text.slice(pos, a), hit: false })
    segs.push({ text: text.slice(a, b), hit: true })
    pos = b
  }
  if (pos < to) segs.push({ text: text.slice(pos, to), hit: false })
  return segs
}

/** Tam mətn → [{ text, hit }] seqmentləri. */
export function highlightSegments(text, q) {
  const s = String(text ?? '')
  return toSegments(s, matchRanges(s, q))
}

/**
 * Uzun mətndən ilk uyğunluğun ətrafında fraqment.
 * → { segs:[{ text, hit }], cutStart, cutEnd }
 */
export function snippetSegments(text, q, maxLen = 180) {
  const s = String(text ?? '')
  const ranges = matchRanges(s, q)
  if (s.length <= maxLen) return { segs: toSegments(s, ranges), cutStart: false, cutEnd: false }
  const first = ranges.length ? ranges[0][0] : 0
  let start = Math.max(0, first - Math.floor(maxLen / 3))
  if (start > 0) {
    const sp = s.lastIndexOf(' ', start)
    start = sp > 0 && start - sp < 20 ? sp + 1 : start
  }
  let end = Math.min(s.length, start + maxLen)
  if (end < s.length) {
    const sp = s.lastIndexOf(' ', end)
    if (sp > start + maxLen / 2) end = sp
  }
  return { segs: toSegments(s, ranges, start, end), cutStart: start > 0, cutEnd: end < s.length }
}

// ── Mənbə adapterləri (xam data → axtarış elementləri) ─

/** "Quran 2:255" → { s:2, a:255 } | null */
export function parseQuranRef(source) {
  const m = /(\d{1,3})\s*:\s*(\d{1,3})/.exec(String(source || ''))
  return m ? { s: +m[1], a: +m[2] } : null
}

/** hadiths.js-dəki qeyd hədis deyilsə (Quran ayəsi və ya məşhur söz) true. */
export function isNotHadith(source) {
  const src = String(source || '').trim()
  if (!src) return false
  if (src === 'Məşhur') return true
  if (/^Quran(?![\p{L}])/u.test(src)) return true
  return parseSurahRef(src) !== null
}

/**
 * Yerli məlumatdan axtarış elementləri.
 * data  = { hadiths: HADITHS | hadithList: təkrarsız siyahı, quotes: QUOTES, duas: DUAS_DATA, names: NAMES_99, glossary: GLOSSARY }
 * pages = [{ key, title, desc, group, icon, keywords }]
 */
export function buildSources(data, lang, pages = []) {
  const isAr = lang === 'ar'
  const src = { page: [], quran: [], hadith: [], dua: [], name: [], glossary: [] }

  for (const p of pages) {
    src.page.push({
      type: 'page', id: 'p:' + p.key, key: p.key, title: p.title, desc: p.desc || '',
      group: p.group || '', icon: p.icon || '',
      // keywords — görünməyən açar sözlər (məs. "cümə" → Camaat vaxtları)
      fields: [[p.title, 4, true], [p.keywords, 3], [p.desc, 1], [p.group, 1]],
    })
  }

  // hadiths.js-də eyni hədis bir neçə id ilə təkrarlanır (məs. "Buxari 645").
  // Axtarış /hadith səhifəsi ilə eyni təkrarsız siyahını işlədir
  // (utils/uniqueHadiths: normallaşdırılmış ərəb mətni və ya Azərbaycanca
  // tərcümə eynidirsə — bir hədis; ilk rast gələn qalır).
  // Mənbə həm orijinal ("Buxari 645"), həm cari dildəki yazılışla ("Bukhari 645") tapılır.
  const srcAlt = (s) => { const l = localizeSource(s, lang); return l !== s ? l : '' }
  // data.hadithList — cari dilin build-zamanı hazırlanmış təkrarsız siyahısı
  // (GlobalSearch → utils/hadithData.js); data.hadiths (bütöv HADITHS) — köhnə yol
  // (Node / testlər), nəticə eynidir
  const hadiths = data.hadithList || (data.hadiths ? uniqueHadithsFor(data.hadiths, lang) : [])
  for (const h of hadiths) {
    // Hədis olmayanlar "Hədislər" qrupuna düşmür:
    //   • mənbəsi surə + ayə olanlar ("Bəqərə 155", "Quran, Hucurat 13") —
    //     Quran ayələridir, Quran qrupu onları yoxlanılmış tərcümə ilə göstərir;
    //   • "Məşhur" — heç bir hədis toplusunda olmayan məşhur sözlər.
    if (isNotHadith(h.source)) continue
    const ar = isAr ? '' : h.ar
    const source = h.source || ''
    src.hadith.push({
      type: 'hadith', id: 'h:' + h.id, text: h.text, ar, source, cat: h.cat,
      fields: [[h.text, 1.5], [source, 1], [srcAlt(source), 1], [ar, 1.2]],
    })
  }

  const quotes = data.quotes || []
  for (let i = 0; i < quotes.length; i++) {
    const q = quotes[i]
    if (q.cat !== 'quran') continue
    const text = isAr ? q.ar : ((q.text && (q.text[lang] || q.text.en)) || '')
    src.quran.push({
      type: 'quran', id: 'q:' + i, local: true, text, ar: isAr ? '' : q.ar, source: q.source,
      ref: parseQuranRef(q.source),
      fields: [[text, 1.5], [q.source, 1], [isAr ? '' : q.ar, 1.2]],
    })
  }

  for (const d of data.duas || []) {
    const text = isAr ? d.ar : (d[lang] || d.en || '')
    src.dua.push({
      type: 'dua', id: 'd:' + d.id, text, ar: isAr ? '' : d.ar, translit: d.translit || '',
      source: d.source || '', cat: d.cat,
      fields: [[text, 1.5], [d.translit, 1.2], [d.source, 1], [srcAlt(d.source || ''), 1], [isAr ? '' : d.ar, 1.2]],
    })
  }

  // NAMES_99: `tr` sahəsi TÜRKCƏ deyil, transliterasiyadır (Ar-Rahman).
  // Türk və ərəb dillərində ayrıca məna yoxdur — yalnız ad göstərilir.
  for (const n of data.names || []) {
    const meaning = (lang === 'az' || lang === 'en' || lang === 'ru') ? (n[lang] || '') : ''
    src.name.push({
      type: 'name', id: 'n:' + n.n, n: n.n, ar: n.ar, translit: n.tr, meaning,
      fields: [[n.ar, 3, true], [n.tr, 3, true], [meaning, 3, true]],
    })
  }

  const glossary = data.glossary || []
  for (let i = 0; i < glossary.length; i++) {
    const g = glossary[i]
    const def = (g.def && (g.def[lang] || g.def.en)) || ''
    src.glossary.push({
      type: 'glossary', id: 'g:' + i, term: g.term, ar: g.ar, translit: g.translit, def,
      fields: [[g.term, 3.5, true], [g.translit, 3, true], [g.ar, 3, true], [def, 1]],
    })
  }

  return src
}

/**
 * api.alquran.cloud/v1/quran/<edition> cavabı → Quran elementləri.
 * Bütün Quran (6236 ayə) bir dəfə yüklənir və yerli axtarılır.
 */
export function buildQuranEditionItems(json) {
  const surahs = json && json.data && json.data.surahs
  if (!Array.isArray(surahs)) return []
  const ed = (json.data && json.data.edition) || {}
  // Tərcüməçi adı göstərilir ki, mətnin kimin tərcüməsi olduğu aydın olsun
  const translator = ed.type === 'translation' ? (ed.englishName || ed.name || '') : ''
  const items = []
  for (const s of surahs) {
    for (const a of s.ayahs || []) {
      items.push({
        type: 'quran', id: 'qa:' + a.number, local: false, text: a.text, translator,
        ref: { s: s.number, a: a.numberInSurah },
        surah: { number: s.number, name: s.name, englishName: s.englishName },
        fields: [[a.text, 1.5]],
      })
    }
  }
  return items
}
