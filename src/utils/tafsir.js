// ═══════════════════════════════════════════════════════
// Təfsir — Quran.com API v4 (api.quran.com/api/v4/tafsirs/{id}/by_ayah/{s}:{a})
//
// MƏNHƏC: sayt Sələf mənhəcinə əsaslanır — kataloqda YALNIZ Əhli-sünnə /
// Sələf təfsirləri var (İbn Kəsir, əs-Sədi, əl-Müyəssər, əl-Bəğəvi, ət-Təbəri).
// API-dəki digərləri QƏSDƏN götürülməyib: əl-Qurtubi (əşari təvilləri),
// əl-Vəsit (Tantavi — müasir əşari/Əzhər), Məarifül-Quran (maturidi/deobəndi),
// Fi Zilalil-Quran (Seyyid Qutb), Təzkirul-Quran (Vəhidəddin Xan), Bəyanul-Quran
// (İsrar Əhməd). Zəməxşəri, Razi, sufi və şiə təfsirləri API-də də yoxdur.
//
// DİL: API-də Azərbaycan və türk dilində Sələf təfsiri YOXDUR (yoxlanılıb:
// /resources/tafsirs). Maşın tərcüməsi göstərmirik — az/tr istifadəçisi
// rusca (əs-Sədi), ingiliscə (İbn Kəsir) və ya ərəbcə təfsiri özü seçir.
//
// Keş: yaddaş (Map) + sessionStorage; eyni ayə/təfsir təkrar sorğulanmır.
// Sanitizer: API HTML qaytarır — yalnız ağ siyahıdakı teqlər qalır.
// ═══════════════════════════════════════════════════════

export const TAFSIR_API = 'https://api.quran.com/api/v4/tafsirs'

const NAME_SADI = { az: 'Təfsir əs-Sədi', en: 'Tafsir al-Sa’di', ru: 'Тафсир ас-Саади', ar: 'تفسير السعدي', tr: 'Sa’dî Tefsiri' }
const BY_SADI = {
  az: 'Əbdürrəhman ibn Nasir əs-Sədi (vəfatı 1376 h.)',
  en: 'Abd al-Rahman ibn Nasir al-Sa’di (d. 1376 AH)',
  ru: 'Абдуррахман ибн Насир ас-Саади (ум. 1376 г. х.)',
  ar: 'عبد الرحمن بن ناصر السعدي (ت ١٣٧٦هـ)',
  tr: 'Abdurrahman b. Nâsır es-Sa’dî (vefatı 1376 h.)',
}
const NAME_IBN_KATHIR = { az: 'Təfsir İbn Kəsir', en: 'Tafsir Ibn Kathir', ru: 'Тафсир Ибн Касира', ar: 'تفسير ابن كثير', tr: 'İbn Kesîr Tefsiri' }
const BY_IBN_KATHIR = {
  az: 'İmad əd-Din İsmail ibn Kəsir (vəfatı 774 h.)',
  en: 'Imad al-Din Isma’il ibn Kathir (d. 774 AH)',
  ru: 'Имад ад-Дин Исмаил ибн Касир (ум. 774 г. х.)',
  ar: 'عماد الدين إسماعيل بن كثير (ت ٧٧٤هـ)',
  tr: 'İmâdüddîn İsmâil b. Kesîr (vefatı 774 h.)',
}

// Kataloq. lang — təfsir mətninin dili; slug — quran.com-dakı ad (mənbə linki)
export const TAFSIRS = [
  {
    id: 16, lang: 'ar', slug: 'ar-tafsir-muyassar',
    name: { az: 'Əl-Təfsir əl-Müyəssər', en: 'Al-Tafsir al-Muyassar', ru: 'Тафсир аль-Муяссар', ar: 'التفسير الميسر', tr: 'Tefsîr-i Müyesser' },
    by: {
      az: 'Kral Fəhd Quran Çap Kompleksinin alimlər heyəti',
      en: 'A committee of scholars, King Fahd Quran Printing Complex',
      ru: 'Коллектив учёных Комплекса короля Фахда',
      ar: 'نخبة من العلماء — مجمع الملك فهد لطباعة المصحف الشريف',
      tr: 'Kral Fahd Kur’an Basım Kompleksi âlimler heyeti',
    },
  },
  { id: 91, lang: 'ar', slug: 'ar-tafseer-al-saddi', name: NAME_SADI, by: BY_SADI },
  { id: 170, lang: 'ru', slug: 'ru-tafseer-al-saddi', name: NAME_SADI, by: BY_SADI },
  { id: 14, lang: 'ar', slug: 'ar-tafsir-ibn-kathir', name: NAME_IBN_KATHIR, by: BY_IBN_KATHIR },
  {
    id: 169, lang: 'en', slug: 'en-tafisr-ibn-kathir',
    name: { az: 'Təfsir İbn Kəsir (ixtisarla)', en: 'Tafsir Ibn Kathir (abridged)', ru: 'Тафсир Ибн Касира (сокращённый)', ar: 'تفسير ابن كثير (مختصر)', tr: 'İbn Kesîr Tefsiri (muhtasar)' },
    by: {
      az: 'İbn Kəsir · ingilis dilinə tərcümə: Darussalam',
      en: 'Ibn Kathir · English translation: Darussalam',
      // lang-ok[Darussalam]: naşirin rəsmi latın adı
      ru: 'Ибн Касир · перевод на английский: Darussalam',
      ar: 'ابن كثير · الترجمة الإنجليزية: دار السلام',
      tr: 'İbn Kesîr · İngilizce tercüme: Darussalam',
    },
  },
  {
    id: 94, lang: 'ar', slug: 'ar-tafsir-al-baghawi',
    name: { az: 'Təfsir əl-Bəğəvi (Məalimut-tənzil)', en: 'Tafsir al-Baghawi (Ma’alim al-Tanzil)', ru: 'Тафсир аль-Багави («Маалим ат-танзиль»)', ar: 'تفسير البغوي (معالم التنزيل)', tr: 'Begavî Tefsiri (Meâlimü’t-tenzîl)' },
    by: {
      az: 'Hüseyn ibn Məsud əl-Bəğəvi (vəfatı 516 h.)',
      en: 'Al-Husayn ibn Mas’ud al-Baghawi (d. 516 AH)',
      ru: 'Аль-Хусейн ибн Масуд аль-Багави (ум. 516 г. х.)',
      ar: 'الحسين بن مسعود البغوي (ت ٥١٦هـ)',
      tr: 'Hüseyin b. Mes’ûd el-Begavî (vefatı 516 h.)',
    },
  },
  {
    id: 15, lang: 'ar', slug: 'ar-tafsir-al-tabari',
    name: { az: 'Təfsir ət-Təbəri (Camiul-bəyan)', en: 'Tafsir al-Tabari (Jami’ al-Bayan)', ru: 'Тафсир ат-Табари («Джами аль-баян»)', ar: 'تفسير الطبري (جامع البيان)', tr: 'Taberî Tefsiri (Câmiu’l-beyân)' },
    by: {
      az: 'Muhəmməd ibn Cərir ət-Təbəri (vəfatı 310 h.)',
      en: 'Muhammad ibn Jarir al-Tabari (d. 310 AH)',
      ru: 'Мухаммад ибн Джарир ат-Табари (ум. 310 г. х.)',
      ar: 'محمد بن جرير الطبري (ت ٣١٠هـ)',
      tr: 'Muhammed b. Cerîr et-Taberî (vefatı 310 h.)',
    },
  },
]
export const TAFSIR_IDS = TAFSIRS.map(t => t.id)
export const getTafsir = id => TAFSIRS.find(t => t.id === Number(id)) || null

// Susmaya görə seçim. az/tr — öz dilində yoxdur: az üçün rusca əs-Sədi
// (Azərbaycanda rus dili daha geniş anlaşılır), tr üçün ingiliscə İbn Kəsir
export const DEFAULT_TAFSIR = { az: 170, en: 169, ru: 170, ar: 16, tr: 169 }
// Saytın bu dilində təfsir mətni varmı (yoxdursa panel dürüst qeyd göstərir)
export const hasNativeTafsir = lang => TAFSIRS.some(t => t.lang === lang)

// ── Seçim (localStorage: { az: 170, ar: 16, … } — hər dil üçün ayrıca) ──
const CHOICE_KEY = 'quran_tafsir'
export function readTafsirChoices() {
  try {
    const v = JSON.parse(localStorage.getItem(CHOICE_KEY))
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
    const out = {}
    for (const [k, id] of Object.entries(v)) if (TAFSIR_IDS.includes(Number(id))) out[k] = Number(id)
    return out
  } catch { return {} }
}
export function tafsirFor(lang, choices = readTafsirChoices()) {
  return choices[lang] || DEFAULT_TAFSIR[lang] || DEFAULT_TAFSIR.en
}
export function saveTafsirChoice(lang, id) {
  const next = { ...readTafsirChoices(), [lang]: Number(id) }
  try { localStorage.setItem(CHOICE_KEY, JSON.stringify(next)) } catch { /* yaddaş bağlıdır */ }
  return next
}

// ── Sanitizer (ağ siyahı) ──
// Brauzerdən asılı deyil (DOMParser yox) — unit testdə də işləyir. Çıxışda
// YALNIZ burada qurulan teqlər olur; qalan hər "<" / ">" mətn kimi qaçırılır.
// • script/style/iframe/… — məzmunu ilə birlikdə silinir
// • icazəli teqlər: p b strong i em u br span sup sub h1–h6 (h1/h2 → h3:
//   səhifənin başlıq ardıcıllığı pozulmasın)
// • atributlar: yalnız class (hər sinif "tfc-" önəki ilə — saytın öz sinifləri
//   ilə toqquşmasın), lang, dir. on*, style, href, src — hamısı atılır
// • naməlum teq (a, img, div, font …) atılır, içindəki mətn qalır
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|template|noscript|textarea|title|svg|math|select|option|head|xmp|noembed|noframes)\b[\s\S]*?<\/\1\s*>/gi
const DROP_OPEN = /<(script|style|iframe|object|embed|template|noscript|textarea|title|svg|math|select|option|head|xmp|noembed|noframes)\b[\s\S]*$/i
const ALLOWED = new Set(['p', 'b', 'strong', 'i', 'em', 'u', 'br', 'span', 'sup', 'sub', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const VOID = new Set(['br'])
const RENAME = { h1: 'h3', h2: 'h3' }
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g
const ATTR_RE = /([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g

const escapeText = s => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')

function cleanAttrs(raw) {
  let out = ''
  ATTR_RE.lastIndex = 0
  let m
  while ((m = ATTR_RE.exec(raw))) {
    const name = m[1].toLowerCase()
    const value = m[2] ?? m[3] ?? m[4] ?? ''
    if (name === 'class') {
      const cls = value.split(/\s+/).filter(c => /^[a-zA-Z][\w-]{0,30}$/.test(c)).map(c => `tfc-${c.toLowerCase()}`)
      if (cls.length) out += ` class="${cls.join(' ')}"`
    } else if (name === 'lang' && /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})?$/.test(value)) {
      out += ` lang="${value}"`
    } else if (name === 'dir' && /^(rtl|ltr|auto)$/i.test(value)) {
      out += ` dir="${value.toLowerCase()}"`
    }
  }
  return out
}

export function sanitizeTafsirHtml(input) {
  let html = String(input ?? '')
    .replace(/<!--[\s\S]*?(-->|$)/g, '')
    .replace(DROP_WITH_CONTENT, '')
    .replace(DROP_OPEN, '')
  let out = ''
  let last = 0
  TAG_RE.lastIndex = 0
  let m
  while ((m = TAG_RE.exec(html))) {
    out += escapeText(html.slice(last, m.index))
    last = m.index + m[0].length
    const closing = m[1] === '/'
    const tag = m[2].toLowerCase()
    if (!ALLOWED.has(tag)) continue
    const name = RENAME[tag] || tag
    if (VOID.has(tag)) { if (!closing) out += '<br>'; continue }
    out += closing ? `</${name}>` : `<${name}${cleanAttrs(m[3])}>`
  }
  out += escapeText(html.slice(last))
  return out.trim()
}

// Mətnin təxmini uzunluğu (teqsiz) — "Daha çox" lazımdırmı
export function plainLength(html) {
  return String(html || '').replace(/<[^>]*>/g, '').replace(/&[#\w]+;/g, ' ').replace(/\s+/g, ' ').trim().length
}

// ── Sorğu + keş ──
export class TafsirError extends Error {
  constructor(kind, message) { super(message || kind); this.kind = kind }
}
const FETCH_TIMEOUT = 15000
const SESSION_PREFIX = 'tafsir:v1:'
const SESSION_MAX = 300_000      // çox uzun mətn (ət-Təbəri) sessionStorage-ı doldurmasın
const memory = new Map()          // açar → { html, verses }
const inflight = new Map()        // açar → Promise

const cacheKey = (id, s, a) => `${id}:${s}:${a}`
const session = () => { try { return globalThis.sessionStorage || null } catch { return null } }

/** Keşdə varsa dərhal qaytarır (panel skeletonsuz açılsın), yoxdursa null */
export function getCachedTafsir(id, s, a) {
  const key = cacheKey(id, s, a)
  if (memory.has(key)) return memory.get(key)
  try {
    const raw = session()?.getItem(SESSION_PREFIX + key)
    if (raw) {
      const v = JSON.parse(raw)
      if (v && typeof v.html === 'string' && Array.isArray(v.verses)) { memory.set(key, v); return v }
    }
  } catch { /* pozuq yazı — yenidən yüklənəcək */ }
  return null
}

export function clearTafsirCache() {
  memory.clear()
  inflight.clear()
  try {
    const ss = session()
    if (!ss) return
    for (let i = ss.length - 1; i >= 0; i--) {
      const k = ss.key(i)
      if (k && k.startsWith(SESSION_PREFIX)) ss.removeItem(k)
    }
  } catch { /* yoxdur */ }
}

const verseSort = (x, y) => {
  const [a1, b1] = x.split(':').map(Number)
  const [a2, b2] = y.split(':').map(Number)
  return a1 - a2 || b1 - b2
}

/**
 * Bir ayənin təfsiri: { html (təmizlənmiş), verses: ['2:8','2:9'] } —
 * verses birdən çoxdursa təfsir ayələri birlikdə izah edir.
 * Xəta: TafsirError kind = 'offline' | 'notfound' | 'network' | 'bad-response'
 */
export function fetchTafsir(id, s, a, { fetchImpl } = {}) {
  const key = cacheKey(id, s, a)
  const hit = getCachedTafsir(id, s, a)
  if (hit) return Promise.resolve(hit)
  if (inflight.has(key)) return inflight.get(key)
  const doFetch = fetchImpl || globalThis.fetch
  const p = (async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new TafsirError('offline')
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timer = setTimeout(() => ctrl?.abort(), FETCH_TIMEOUT)
    let res
    try {
      res = await doFetch(`${TAFSIR_API}/${id}/by_ayah/${s}:${a}`, ctrl ? { signal: ctrl.signal } : undefined)
    } catch (e) {
      throw new TafsirError(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'network', e?.message)
    } finally { clearTimeout(timer) }
    if (res.status === 404) throw new TafsirError('notfound')
    if (!res.ok) throw new TafsirError('network', `HTTP ${res.status}`)
    let data
    try { data = await res.json() } catch { throw new TafsirError('bad-response') }
    const t = data?.tafsir
    if (!t || typeof t.text !== 'string') throw new TafsirError('bad-response')
    const verses = Object.keys(t.verses || {}).filter(k => /^\d+:\d+$/.test(k)).sort(verseSort)
    const value = { html: sanitizeTafsirHtml(t.text), verses: verses.length ? verses : [`${s}:${a}`] }
    // Qrup halında izah olunan ayələrin hamısı üçün yaddaşa yaz (2:8 açılıbsa 2:9 da hazırdır)
    for (const vk of value.verses) {
      const [vs, va] = vk.split(':')
      memory.set(cacheKey(id, vs, va), value)
    }
    memory.set(key, value)
    if (value.html.length <= SESSION_MAX) {
      try { session()?.setItem(SESSION_PREFIX + key, JSON.stringify(value)) } catch { /* dolub — yalnız yaddaşda qalır */ }
    }
    return value
  })()
  inflight.set(key, p)
  p.finally(() => inflight.delete(key)).catch(() => {})
  return p
}
