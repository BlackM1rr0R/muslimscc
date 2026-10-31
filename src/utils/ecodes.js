// ═══════════════════════════════════════════════════════
// E-KODLAR (qida əlavələri) və ŞTRİXKOD — saf köməkçilər
//
// • normalizeECode    — "e-120", "E120a", "120", "Е 160a(ii)", "en:e322i" → "e120" …
// • extractECodes     — sərbəst mətndən / siyahıdan E-kodları çıxarır
// • lookupECode       — məlumat bazasında tapır; "e322i" yoxdursa "e322"-yə enir
// • categorize        — Open Food Facts-in FAKTLARINDAN (vegan / vegetarian
//                       statusu, mənbə mətni, Wikidata takson əlaqəsi) bizim
//                       kateqoriyaya keçid. Hökm (halal/haram) VERMİR —
//                       yalnız mənşə barədə OFF nə deyirsə, onu qruplaşdırır.
// • parseAnalysisTags, halalLabelTags, normalizeBarcode, gtinCheckOk, fetchProduct
//
// scripts/build-ecodes.mjs da categorize()-i buradan götürür — qayda bir yerdədir.
// ═══════════════════════════════════════════════════════

/** Kateqoriyalar — göstərilmə sırası ilə. */
export const CATEGORIES = ['insect', 'animal', 'alcohol', 'maybe', 'none', 'unknown']

/**
 * Spirtlə bağlılıq — iki dar qayda:
 * • ALCOHOL_NAME_RE — OFF ADI etanolun özüdür. Bilərəkdən "alcohol" sözünün
 *   özü YOXDUR: "sugar alcohol" (poliollar), "polyvinyl alcohol", "benzyl
 *   alcohol" kimyəvi addır, içki spirti deyil.
 * • ALCOHOL_ORIGIN_RE — OFF TƏSVİRİ mənşəyi şərab/şərabçılıq kimi göstərir
 *   ("byproduct of winemaking"). "Şərabda işlədilir" (istifadə yeri) SAYILMIR.
 */
export const ALCOHOL_NAME_RE = /\b(ethanol|ethyl alcohol)\b/i
export const ALCOHOL_ORIGIN_RE = /\b(by-?products? of|derived from|obtained from|made from|produced from|extracted from)\s+(the\s+)?(wine|winemaking|wine-making|fermented grapes?)\b/i
/** Həşərat — mənbə mətnində açıq deyilibsə ("lac insects" və s.). */
export const INSECT_RE = /\binsects?\b/i

const ARABIC_DIGITS = /[٠-٩۰-۹]/g
const toLatinDigits = (s) => s.replace(ARABIC_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10))

/**
 * İstifadəçinin yazdığı kodu vahid formaya salır: "e" + 3–4 rəqəm + şəkilçi.
 * "e-120", "E 120", "E120a", "120", "Е120" (kiril Е), "E160a(ii)", "en:e322i", "١٢٠".
 * Tanınmırsa null.
 */
export function normalizeECode(input) {
  if (input == null) return null
  let s = toLatinDigits(String(input)).trim().toLowerCase()
  s = s.replace(/^[a-z]{2}:/, '')          // OFF teqi: "en:e322i"
  s = s.replace(/[еэ]/g, 'e')              // kiril е / э
  s = s.replace(/[\s\-–—_.()[\]]/g, '')    // "e-160 a (ii)" → "e160aii"
  const m = /^e?(\d{3,4})([a-z]{0,5})$/.exec(s)
  if (!m) return null
  return `e${m[1]}${m[2]}`
}

/** "e341iii" → "E341iii" (göstərmək üçün). */
export const displayECode = (code) => (code ? `E${String(code).slice(1)}` : '')

/**
 * Sərbəst mətndən E-kodlar (təkrarsız, sıra saxlanır).
 * • "E" ilə başlayanlar mətnin istənilən yerində tapılır: "emulqator (E471), E 322".
 * • Vergül / nöqtəli vergül / sətirlə ayrılmış siyahıda tək rəqəmlər də ("120, 330") qəbul olunur.
 */
export function extractECodes(text) {
  const src = toLatinDigits(String(text || ''))
  const out = []
  const add = (c) => { if (c && !out.includes(c)) out.push(c) }
  // şəkilçi koda bitişik olmalıdır ("E160a(ii)", "E322i"); sonra hərf/rəqəm gəlməməlidir ("E120 and" → e120)
  const re = /(?<![\p{L}\d])[eеэ]\s?[-–]?\s?(\d{3,4})([a-d]?(?:\((?:i|ii|iii|iv|v|vi)\)|iii|ii|iv|vi|v|i)?)(?![\p{L}\d])/giu
  for (const m of src.matchAll(re)) add(normalizeECode(`e${m[1]}${m[2].replace(/[()]/g, '')}`))
  for (const tok of src.split(/[,;\n]+/)) {
    const t = tok.trim()
    if (/^\d{3,4}[a-z]{0,5}$/i.test(t)) add(normalizeECode(t))
  }
  return out
}

/**
 * Kodu bazada tapır. Dəqiq tapılmasa, son şəkilçini ataraq "valideynə" enir:
 * e160aii → e160a → e160. Qaytarır { code, entry, exact } və ya null.
 */
export function lookupECode(items, input) {
  const code = normalizeECode(input)
  if (!code || !items) return null
  if (items[code]) return { code, entry: items[code], exact: true }
  let c = code
  while (/[a-z]$/.test(c)) {
    c = c.replace(/(iii|ii|iv|vi|v|i|[a-z])$/, '')
    if (items[c]) return { code: c, entry: items[c], exact: false, requested: code }
  }
  return null
}

/**
 * OFF faktlarından kateqoriya. Qayda (sıra ilə, ilk uyğun gələn):
 *  1. insect   — mənbə mətnində "insect" var və ya Wikidata takson zənciri Insecta-ya çıxır
 *  2. animal   — OFF: vegetarian = "no" və ya vegan = "no"
 *  3. alcohol  — OFF adı etanoldur və ya təsviri mənşəyi şərabçılıq deyir (ALCOHOL_*_RE)
 *  4. maybe    — OFF: vegan və ya vegetarian = "maybe"
 *  5. none     — OFF: vegan = "yes" və vegetarian = "yes"
 *  6. unknown  — OFF-da status yoxdur
 * @param {{vegan?:string, vegetarian?:string, name?:string, desc?:string, insectEvidence?:boolean}} f
 */
export function categorize(f = {}) {
  const vegan = f.vegan || null
  const veg = f.vegetarian || null
  const name = String(f.name || '')
  const desc = String(f.desc || '')
  if (f.insectEvidence || INSECT_RE.test(name) || INSECT_RE.test(desc)) return 'insect'
  if (veg === 'no' || vegan === 'no') return 'animal'
  if (ALCOHOL_NAME_RE.test(name) || ALCOHOL_ORIGIN_RE.test(desc)) return 'alcohol'
  if (vegan === 'maybe' || veg === 'maybe') return 'maybe'
  if (vegan === 'yes' && veg === 'yes') return 'none'
  return 'unknown'
}

/** "en:e322i" → "e322i"; E-kod deyilsə null. */
export const offTagToCode = (tag) => normalizeECode(String(tag || '').replace(/^[a-z]{2}:/, ''))

/**
 * OFF ingredients_analysis_tags → { vegan, vegetarian, palmOil }
 * vegan/vegetarian: 'yes' | 'no' | 'maybe' | 'unknown' ; palmOil: 'free' | 'contains' | 'maybe' | 'unknown'
 */
export function parseAnalysisTags(tags) {
  const t = new Set((tags || []).map(String))
  const status = (k) => (t.has(`en:${k}`) ? 'yes' : t.has(`en:non-${k}`) ? 'no' : t.has(`en:maybe-${k}`) ? 'maybe' : 'unknown')
  const palmOil = t.has('en:palm-oil-free') ? 'free' : t.has('en:palm-oil') ? 'contains'
    : t.has('en:may-contain-palm-oil') ? 'maybe' : 'unknown'
  return { vegan: status('vegan'), vegetarian: status('vegetarian'), palmOil }
}

/** labels_tags içindən halal nişanları (xam teq olduğu kimi qaytarılır). */
export const halalLabelTags = (tags) => (tags || []).map(String).filter((s) => /halal|helal|حلال|халял/i.test(s))

/** Ştrixkod: yalnız rəqəmlər, 8–14 simvol (EAN-8, UPC-A, EAN-13, GTIN-14). Yoxsa null. */
export function normalizeBarcode(input) {
  const s = toLatinDigits(String(input || '')).replace(/[\s-]/g, '')
  return /^\d{8,14}$/.test(s) ? s : null
}

/** GTIN yoxlama rəqəmi (mod 10). Yanlışdırsa, kod çox güman səhv yazılıb. */
export function gtinCheckOk(code) {
  if (!/^\d{8,14}$/.test(String(code || ''))) return false
  const d = String(code).split('').map(Number)
  const check = d.pop()
  const sum = d.reverse().reduce((a, n, i) => a + n * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check
}

export const OFF_FIELDS = 'code,product_name,brands,ingredients_text,additives_tags,ingredients_analysis_tags,labels_tags'

export class ProductError extends Error {
  /** @param {'invalid'|'notfound'|'offline'|'timeout'|'http'} kind */
  constructor(kind, message) { super(message || kind); this.name = 'ProductError'; this.kind = kind }
}

/**
 * Open Food Facts-dən məhsul. Xətalar ProductError.kind ilə:
 * invalid (kod səhv) · notfound · offline · timeout · http.
 */
export async function fetchProduct(barcode, { fetchImpl = globalThis.fetch, timeoutMs = 12000, signal, online } = {}) {
  const code = normalizeBarcode(barcode)
  if (!code) throw new ProductError('invalid')
  const isOnline = online ?? (typeof navigator === 'undefined' ? true : navigator.onLine !== false)
  if (!isOnline) throw new ProductError('offline')
  const ctrl = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; ctrl.abort() }, timeoutMs)
  const onAbort = () => ctrl.abort()
  signal?.addEventListener?.('abort', onAbort)
  try {
    let res
    try {
      res = await fetchImpl(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`, { signal: ctrl.signal })
    } catch (e) {
      if (timedOut) throw new ProductError('timeout')
      if (signal?.aborted) throw e
      throw new ProductError('offline', e?.message)
    }
    if (res.status === 404) throw new ProductError('notfound')
    if (!res.ok) throw new ProductError('http', `HTTP ${res.status}`)
    let body
    try { body = await res.json() } catch (e) { if (timedOut) throw new ProductError('timeout'); throw new ProductError('http', 'bad json') }
    if (!body || body.status !== 1 || !body.product) throw new ProductError('notfound')
    return { code, product: body.product }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener?.('abort', onAbort)
  }
}
