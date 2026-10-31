// ═══════════════════════════════════════════════════════
// Mushaf görünüşü — saf köməkçilər + səhifənin yüklənməsi
//
// Mətn: Quran.com API v4 /verses/by_page/<p> (Mədinə mushafı, 604 səhifə,
// 15 sətir). Hər söz öz line_number-i ilə gəlir — səhifəni sətir-sətir
// yenidən qururuq (layoutPage). Sözsüz sətirlər surə başlığı / bəsmələdir.
// Təcvid: sözün text_uthmani_tajweed sahəsi (<rule class=…>) — ağ siyahı
// ilə təmizlənir (sanitizeTajweed), sinif → CSS rəngi (MushafPage.css).
// Quran mətni saytda saxlanmır — həmişə API-dən gəlir (keş: yaddaş + sessionStorage).
// ═══════════════════════════════════════════════════════
import { MUSHAF_PAGES, SURAH_TABLE, JUZ_START_PAGES } from '../data/mushafIndex'

export { MUSHAF_PAGES }
export const MUSHAF_API = 'https://api.quran.com/api/v4/verses/by_page'

// ── Səhifə cədvəlləri ──
export const clampPage = p => {
  const n = Math.trunc(Number(p))
  return Number.isFinite(n) ? Math.min(MUSHAF_PAGES, Math.max(1, n)) : 1
}
export const isValidPage = p => Number.isInteger(Number(p)) && Number(p) >= 1 && Number(p) <= MUSHAF_PAGES

/** Surənin ilk səhifəsi (1…114) */
export const surahStartPage = s => SURAH_TABLE[s - 1]?.[0] ?? null
/** Cüzün ilk səhifəsi (1…30) */
export const juzStartPage = j => JUZ_START_PAGES[j - 1] ?? null
/** Səhifənin cüzü — cədvəldən (API cavabı gəlməmiş də göstərmək üçün) */
export function juzForPage(p) {
  const page = clampPage(p)
  let j = 1
  for (let i = 0; i < JUZ_START_PAGES.length; i++) if (JUZ_START_PAGES[i] <= page) j = i + 1
  return j
}
/** Səhifədə olan surələr (nömrələr, artan sıra ilə) */
export function surahsOnPage(p) {
  const page = clampPage(p)
  const out = []
  SURAH_TABLE.forEach(([start, end], i) => { if (start <= page && page <= end) out.push(i + 1) })
  return out
}
export const surahInfo = s => {
  const r = SURAH_TABLE[s - 1]
  return r ? { number: s, start: r[0], end: r[1], verses: r[2], basmala: !!r[3], ar: r[4], latin: r[5] } : null
}
/** Bəsmələ surədən əvvəl ayrıca sətirdirmi (Fatihədə ayə 1-dir, Tövbədə yoxdur) */
export const surahHasBasmalaLine = s => s !== 1 && s !== 9

/** Hizb və rübü: rub_el_hizb_number (1…240) → { hizb: 1…60, quarter: 0…3 } */
export function hizbFromRub(rub) {
  const r = Number(rub)
  if (!Number.isInteger(r) || r < 1) return null
  return { hizb: Math.ceil(r / 4), quarter: (r - 1) % 4 }
}

// ── Səhifənin sətirlərə düzülməsi ──
/**
 * words: [{ key:'2:255', s, a, p, line, type:'word'|'end', … }] (API sırası ilə)
 * Qaytarır: [{ n, kind:'words'|'header'|'basmala'|'blank', words?, surah? }]
 * Səhifə 1–2-də 8 sətir, qalanlarda 15. Sözsüz sətir — sözlərdən əvvəl
 * başlayan surənin başlığı (+ bəsmələ); səhifə surə başlığı ilə bitirsə
 * (sonrakı surə növbəti səhifədən başlayır) — sonda qalan boş sətirlər.
 */
export function layoutPage(words, page) {
  const total = Number(page) <= 2 ? 8 : 15
  const byLine = new Map()
  for (const w of words || []) {
    const n = Number(w.line)
    if (!Number.isInteger(n) || n < 1 || n > 15) continue
    if (!byLine.has(n)) byLine.set(n, [])
    byLine.get(n).push(w)
  }
  const maxLine = Math.max(total, ...byLine.keys())
  const lines = []
  for (let n = 1; n <= maxLine; n++) {
    lines.push(byLine.has(n) ? { n, kind: 'words', words: byLine.get(n) } : { n, kind: 'blank' })
  }
  const at = n => lines[n - 1]
  const fillBefore = (firstLine, s) => {
    const free = []
    for (let n = firstLine - 1; n >= 1 && at(n).kind === 'blank'; n--) free.push(n)
    if (!free.length) return
    if (surahHasBasmalaLine(s) && free.length >= 2) {
      Object.assign(at(free[0]), { kind: 'basmala', surah: s })
      Object.assign(at(free[1]), { kind: 'header', surah: s })
    } else {
      Object.assign(at(free[0]), { kind: 'header', surah: s })
    }
  }
  // Bu səhifədə başlayan surələr: ilk ayənin ilk sözünün sətri
  const starts = []
  for (const w of words || []) {
    if (Number(w.a) === 1 && !starts.some(x => x.s === Number(w.s))) starts.push({ s: Number(w.s), line: Number(w.line) })
  }
  for (const { s, line } of starts) fillBefore(line, s)
  // Səhifənin sonunda boş sətirlər → növbəti surənin başlığı (+ bəsmələ)
  const used = [...byLine.keys()]
  if (used.length && Number(page) > 2) {
    const last = Math.max(...used)
    const lastWord = byLine.get(last).at(-1)
    const next = Number(lastWord?.s) + 1
    const tail = []
    for (let n = last + 1; n <= maxLine; n++) tail.push(n)
    if (tail.length && next <= 114) {
      Object.assign(at(tail[0]), { kind: 'header', surah: next })
      if (surahHasBasmalaLine(next) && tail.length >= 2) Object.assign(at(tail[1]), { kind: 'basmala', surah: next })
    }
  }
  return lines
}

/** Sətir ortalanmalıdırmı (səhifə 1–2, ya da çox qısa sətir) — əks halda iki tərəfə düzlənir */
export function isCenteredLine(line, page) {
  if (line.kind !== 'words') return true
  if (Number(page) <= 2) return true
  return line.words.filter(w => w.type === 'word').length <= 2
}

// ── Təcvid HTML-inin təmizlənməsi (ağ siyahı) ──
// API: <rule class=ham_wasl>ٱ</rule>, köhnə formatda <tajweed class=…>, iç-içə
// ola bilər (<rule class=madda_normal><rule class=custom-alef-maksora>…).
// Çıxışda YALNIZ <span class="tj tj-<qayda>"> və </span> olur; qalan hər şey mətn
// kimi qaçırılır. Naməlum sinif → sinifsiz <span> (mətn qalır, rəng yoxdur).
export const TAJWEED_RULES = [
  'ham_wasl', 'laam_shamsiyah', 'slnt',
  'madda_normal', 'madda_permissible', 'madda_necessary', 'madda_obligatory_mottasel', 'madda_obligatory_monfasel',
  'ghunnah', 'qalaqah', 'ikhafa', 'ikhafa_shafawi', 'iqlab',
  'idgham_ghunnah', 'idgham_wo_ghunnah', 'idgham_shafawi', 'idgham_mutajanisayn', 'idgham_mutaqaribayn',
]
const RULE_SET = new Set(TAJWEED_RULES)
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ESC[c])
const T_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g

export function sanitizeTajweed(input) {
  const html = String(input ?? '').replace(/<!--[\s\S]*?(-->|$)/g, '')
  let out = ''
  let last = 0
  let depth = 0
  T_RE.lastIndex = 0
  let m
  while ((m = T_RE.exec(html))) {
    out += escapeHtml(html.slice(last, m.index).replace(/&(amp|lt|gt|quot|#39);/g, (e, k) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[k]))
    last = m.index + m[0].length
    const tag = m[2].toLowerCase()
    if (tag !== 'rule' && tag !== 'tajweed') continue        // span class=end (ayə nömrəsi) və s. atılır
    if (m[1] === '/') { if (depth > 0) { out += '</span>'; depth-- } continue }
    const cls = /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(m[3])
    const name = (cls?.[1] ?? cls?.[2] ?? cls?.[3] ?? '').toLowerCase()
    out += RULE_SET.has(name) ? `<span class="tj tj-${name}">` : '<span>'
    depth++
  }
  out += escapeHtml(html.slice(last).replace(/<[^>]*$/, ''))
  while (depth-- > 0) out += '</span>'
  return out
}
/** Təmizlənmiş HTML-də hansı qaydalar var (legenddə yalnız bunlar vurğulanır) */
export const tajweedRulesIn = html => [...new Set([...String(html).matchAll(/tj-([a-z_]+)/g)].map(m => m[1]))]

// ── Söz-söz tərcümənin dili ──
// Quran.com-da söz tərcüməsi (yoxlanılıb, 2026-10): en, tr və bir neçə başqa dil;
// az, ru, ar YOXDUR — API ingiliscəyə düşür. Biz də açıq şəkildə ingiliscə istəyirik.
export const WBW_LANGS = ['en', 'tr']
export const wbwLang = lang => (WBW_LANGS.includes(lang) ? lang : 'en')

// ── Son səhifə (localStorage) ──
const LAST_KEY = 'mushaf_last_page'
export function readLastPage(storage = globalThis.localStorage) {
  try {
    const n = Number(storage?.getItem(LAST_KEY))
    return isValidPage(n) ? n : null
  } catch { return null }
}
export function saveLastPage(p, storage = globalThis.localStorage) {
  if (!isValidPage(p)) return
  try { storage?.setItem(LAST_KEY, String(Number(p))) } catch { /* yaddaş bağlıdır */ }
}

// ── API cavabının sıxılması ──
/** quran.com verses → [{ key, s, a, p, line, type, text, tj, tr, tl }] + meta */
export function compactPage(data, page) {
  const verses = Array.isArray(data?.verses) ? data.verses : null
  if (!verses || !verses.length) return null
  const words = []
  for (const v of verses) {
    const [s, a] = String(v.verse_key || '').split(':').map(Number)
    if (!s || !a) continue
    for (const w of v.words || []) {
      if (Number(w.page_number) && Number(w.page_number) !== Number(page)) continue
      const type = w.char_type_name === 'end' ? 'end' : w.char_type_name === 'word' ? 'word' : null
      if (!type) continue
      words.push({
        key: v.verse_key, s, a, p: Number(w.position), line: Number(w.line_number), type,
        text: String(w.text_uthmani || w.text || ''),
        tj: type === 'word' ? sanitizeTajweed(w.text_uthmani_tajweed || w.text_uthmani || '') : '',
        tr: w.translation?.text || '',
        tl: w.transliteration?.text || '',
      })
    }
  }
  const first = verses[0]
  return {
    page: Number(page),
    words,
    juz: Number(first.juz_number) || juzForPage(page),
    rub: Number(first.rub_el_hizb_number) || null,
    hizb: Number(first.hizb_number) || null,
    sajdah: verses.filter(v => v.sajdah_number).map(v => v.verse_key),
  }
}

// ── Sorğu + keş ──
export class MushafError extends Error {
  constructor(kind, message) { super(message || kind); this.kind = kind }
}
const FETCH_TIMEOUT = 15000
const SESSION_PREFIX = 'mushaf:v1:'
const memory = new Map()
const inflight = new Map()
const session = () => { try { return globalThis.sessionStorage || null } catch { return null } }

export function pageUrl(page, wl) {
  const q = new URLSearchParams({
    words: 'true',
    word_fields: 'text_uthmani,text_uthmani_tajweed,line_number,page_number,char_type_name',
    fields: 'chapter_id',
    per_page: '50',
    language: wl,
  })
  return `${MUSHAF_API}/${page}?${q}`
}

export function getCachedPage(page, wl) {
  const key = `${page}:${wl}`
  if (memory.has(key)) return memory.get(key)
  try {
    const raw = session()?.getItem(SESSION_PREFIX + key)
    if (raw) {
      const v = JSON.parse(raw)
      if (v && Array.isArray(v.words)) { memory.set(key, v); return v }
    }
  } catch { /* pozuq yazı */ }
  return null
}

/** Səhifəni yüklə. Xəta: MushafError kind = 'offline' | 'network' | 'bad-response' */
export function fetchMushafPage(page, wl = 'en', { fetchImpl } = {}) {
  const p0 = clampPage(page)
  const key = `${p0}:${wl}`
  const hit = getCachedPage(p0, wl)
  if (hit) return Promise.resolve(hit)
  if (inflight.has(key)) return inflight.get(key)
  const doFetch = fetchImpl || globalThis.fetch
  const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false
  const p = (async () => {
    if (offline()) throw new MushafError('offline')
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timer = setTimeout(() => ctrl?.abort(), FETCH_TIMEOUT)
    let res
    try {
      res = await doFetch(pageUrl(p0, wl), ctrl ? { signal: ctrl.signal } : undefined)
    } catch (e) {
      throw new MushafError(offline() ? 'offline' : 'network', e?.message)
    } finally { clearTimeout(timer) }
    if (!res.ok) throw new MushafError('network', `HTTP ${res.status}`)
    let data
    try { data = await res.json() } catch { throw new MushafError('bad-response') }
    const value = compactPage(data, p0)
    if (!value || !value.words.length) throw new MushafError('bad-response')
    memory.set(key, value)
    try { session()?.setItem(SESSION_PREFIX + key, JSON.stringify(value)) } catch { /* dolub */ }
    return value
  })()
  inflight.set(key, p)
  p.finally(() => inflight.delete(key)).catch(() => {})
  return p
}

/** Arxa planda qonşu səhifəni hazırla (xəta nəzərə alınmır) */
export function prefetchMushafPage(page, wl) {
  if (!isValidPage(page) || getCachedPage(page, wl)) return
  fetchMushafPage(page, wl).catch(() => {})
}
