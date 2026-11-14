// ═══════════════════════════════════════════════════════
// Əlavə dillərdə interfeys yazıları (src/seo/langs.js → EXTRA_LANGS)
//
// Komponentlərin yazıları 5 dilli obyektlərdədir: LABELS = { az, en, ru, ar, tr }.
// Əlavə dildə (/id/…) interfeysin "dili" ingiliscədir (LangContext → lang = 'en'),
// ingiliscə yazı isə həmin dilin LÜĞƏTİ ilə əvəz olunur:
//   src/i18n/<dil>.json — { "<ingiliscə yazı>": "<tərcümə>" }
// Lüğətdə olmayan yazı ingiliscə qalır — heç nə sınmır, tərcümə hissə-hissə artır.
//
//   pickUi(LABELS, lang)      — əvvəlki "LABELS[lang] || LABELS.az" ilə eyni,
//   pickUi(LABELS, lang, 'en')üstəlik əlavə dildə tərcümə (iç-içə obyekt,
//                               massiv və funksiyanın nəticəsi də)
//   txt('Close')              — tək sətir
//
// QAYDA (sahibin qərarı, 2026-11-06): lüğətdə YALNIZ interfeys yazıları var.
// Dini mətn (ayə, hədis, dua, dərs, lüğət izahı) AI ilə tərcümə olunmur —
// o, hazır nəşr olunmuş mənbədən gəlir və ya ingiliscə qalır.
// ═══════════════════════════════════════════════════════

let dictLang = null
let dict = null
let cache = new WeakMap()

// ── Qeydiyyat (scripts/vite-ui-dict-plugin.mjs) ──
// Interfeys fayllarındakı hər 5 dilli obyekt build zamanı __uiReg(...) ilə
// bükülür. Lüğət qoyulanda obyektin "en" dəyəri YERİNDƏ tərcümə ilə əvəz
// olunur (orijinalı ORIG-də qalır) — yazının hansı üsulla seçilməsindən
// asılı olmayaraq (LABELS[lang], L[k][lk], pick(o, lang) …) hər yer tərcümə
// olunur. Render zamanı yaradılan obyektlər WeakRef ilə izlənir (yaddaş sızmasın).
const ORIG = new WeakMap()
const HAS_WEAKREF = typeof WeakRef === 'function'
let REG = new Set()

export function __uiReg(o) {
  if (!o || typeof o !== 'object' || o.en === undefined || ORIG.has(o)) return o
  ORIG.set(o, o.en)
  REG.add(HAS_WEAKREF ? new WeakRef(o) : { deref: () => o })
  if (dict) o.en = deep(o.en)
  return o
}

function swapAll() {
  const next = new Set()
  for (const ref of REG) {
    const o = ref.deref()
    if (!o) continue
    next.add(ref)
    const orig = ORIG.get(o)
    o.en = dict ? deep(orig) : orig
  }
  REG = next
}

/** Əlavə dilin lüğətini qoy (null — sil, ingiliscəyə qayıt). */
export function setUiDict(lang, d) {
  const was = dict
  dictLang = d ? lang : null
  dict = d || null
  cache = new WeakMap()
  TPL = null
  tplMemo = new Map()
  if (was !== dict) swapAll()
}

/** Lüğəti yüklənmiş dil (və ya null). */
export const uiDictLang = () => dictLang

// ── Tarix formatı ──
// Komponentlər tarixi interfeys dilinin lokalı ilə göstərir (LOCALES[lang] ||
// 'en-GB'); əlavə dildə interfeys "en" olduğu üçün tarix ingiliscə çıxırdı
// ("Friday, 6 November"). Lüğət aktivdirsə, Date-in GÖSTƏRMƏ funksiyalarında
// ingiliscə lokal (en, en-GB, en-US) həmin dilin lokalı ilə əvəz olunur.
// Intl.DateTimeFormat-a QƏSDƏN toxunulmur: namaz vaxtı və hicri təqvim
// formatToParts ilə rəqəmləri oxuyur (en-GB, en-u-ca-…) — orada dəyişiklik hesabı pozardı.
// Lokal kodu: src/seo/langs.js → locale (uz — kiril, bs — latın)
const DATE_LOCALE_FIX = { uz: 'uz-Cyrl-UZ', bs: 'bs-Latn-BA' }
const EN_LOCALE = /^en(?:-(?:GB|US))?$/
let dateLocale = null
const dateLocaleFor = (lang, locale) => DATE_LOCALE_FIX[lang] || String(locale || lang).replace('_', '-')

/** Göstərmə lokalı (lüğət aktivdirsə həmin dil, yoxsa verilən). */
function displayLocale(locales) {
  if (!dateLocale) return locales
  if (locales == null || (typeof locales === 'string' && EN_LOCALE.test(locales))) return dateLocale
  return locales
}

let datePatched = false
/** Date.prototype.toLocale*String yamağı — bir dəfə (main.jsx). */
export function installDateLocale() {
  if (datePatched || typeof Date === 'undefined') return
  datePatched = true
  for (const name of ['toLocaleDateString', 'toLocaleTimeString', 'toLocaleString']) {
    const orig = Date.prototype[name]
    Object.defineProperty(Date.prototype, name, {
      configurable: true,
      writable: true,
      value: function (locales, opts) {
        try { return orig.call(this, displayLocale(locales), opts) } catch { return orig.call(this, locales, opts) }
      },
    })
  }
}

/** Lüğətlə birlikdə tarix lokalını qoy (load.js → applyUiDict). */
export function setUiDateLocale(lang, locale) {
  dateLocale = lang ? dateLocaleFor(lang, locale) : null
}

/** Tək sətrin tərcüməsi (lüğətdə yoxdursa — şablonla; o da yoxdursa — olduğu kimi). */
export function txt(s) {
  if (!dict || typeof s !== 'string') return s
  const v = dict[s]
  if (typeof v === 'string' && v) return v
  return tplTranslate(s)
}

// ── v6.7: şablonlu (dinamik) yazılar ──
// Lüğətdə "{0} days left" kimi açarlar var (scripts/extract-ui-strings.mjs `${n} days left`-dən yazır).
// Hazır sətir ("27 days left") tapılmayanda şablonlarla tutuşdurulur, tərcümədə {0} yerinə dəyər qoyulur
// (dəyərin özü də lüğətdə varsa — tərcümə olunur: "surahs"). Nəticələr yaddaşda (həcmi məhdud).
let TPL = null
let tplMemo = new Map()
const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function buildTpl() {
  TPL = []
  for (const [k, v] of Object.entries(dict)) {
    if (typeof v !== 'string' || !/\{\d\}/.test(k)) continue
    const parts = k.split(/\{(\d)\}/)
    const order = []
    let re = '^'
    parts.forEach((p, i) => { if (i % 2) { order.push(+p); re += '([\\s\\S]+?)' } else re += escRe(p) })
    const chunks = parts.filter((_, i) => i % 2 === 0).filter(Boolean).sort((a, b) => b.length - a.length)
    TPL.push({ re: new RegExp(re + '$'), order, v, key: chunks[0] || '' })
  }
  TPL.sort((a, b) => b.key.length - a.key.length)
}
function tplTranslate(s) {
  if (s.length > 600 || !/\p{L}/u.test(s)) return s
  const m0 = tplMemo.get(s)
  if (m0 !== undefined) return m0
  if (!TPL) buildTpl()
  let out = s
  for (const t of TPL) {
    if (t.key && !s.includes(t.key)) continue
    const m = t.re.exec(s)
    if (!m) continue
    const vals = []
    t.order.forEach((n, i) => { const x = m[i + 1]; const tv = dict[x]; vals[n] = typeof tv === 'string' && tv ? tv : x })
    out = t.v.replace(/\{(\d)\}/g, (_, n) => (vals[n] ?? ''))
    break
  }
  if (tplMemo.size > 3000) tplMemo = new Map()
  tplMemo.set(s, out)
  return out
}

function deep(v) {
  if (typeof v === 'string') return txt(v)
  if (Array.isArray(v)) return v.map(deep)
  if (typeof v === 'function') {
    const f = v
    return (...a) => deep(f(...a))
  }
  if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    const out = {}
    for (const k of Object.keys(v)) out[k] = deep(v[k])
    return out
  }
  return v
}

/**
 * 5 dilli obyektdən cari dilin dəyəri. Lüğət yüklənibsə və dil ingiliscədirsə
 * (əlavə dilin interfeysi) — tərcümə olunmuş surət (obyekt başına yaddaşda).
 */
export function pickUi(obj, lang, fallback = 'az') {
  if (!obj) return obj
  const base = obj[lang] || obj[fallback]
  if (!dict || lang !== 'en' || base == null) return base
  if (typeof base !== 'object' && typeof base !== 'function') return txt(base)
  let hit = cache.get(obj)
  if (!hit) { hit = deep(base); cache.set(obj, hit) }
  return hit
}
