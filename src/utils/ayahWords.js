// ═══════════════════════════════════════════════════════
// Ayənin sözləri — oxuyucuda uzun basılan sözün tapılması və onun məlumatı
// (components/quran/WordMenu.jsx). tests/unit/ayahWords.test.js
//
// • Oxuyucunun ərəb mətni (api.alquran.cloud, ar.alafasy) bütöv sətirdir —
//   DOM-a söz-söz <span> əlavə edilmir (liqaturlar, seçmə və kopyalama olduğu
//   kimi qalır). Barmağın altındakı simvol caretRangeFromPoint ilə tapılır,
//   sözün sırası isə bu mətndən hesablanır.
// • Sıra Quran.com-un söz nömrəsi (position) ilə eynidir: vəqf işarələri
//   (ۖ ۗ ۚ ۛ …), ۞ və ۩ mətndə ayrıca "söz" kimi durur, amma hərf daşımır —
//   sayılmır.
// • Söz tərcüməsi və transliterasiya — Quran.com API v4 (söz-söz, mushafla eyni
//   mənbə); kök — public/data/quran-roots.json (utils/quranRoots.js);
//   səs — Mişari əl-Əfasinin ayə faylı + söz vaxtları (utils/karaoke.js).
// ═══════════════════════════════════════════════════════
import { VERSE_API } from './quranRoots'
import { buildKaraoke } from './karaoke'

// Ərəb hərfləri (hərəkələr və Quran işarələri daxil deyil)
const LETTER = /[\u0621-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC]/

/**
 * Mətn → sözlər: [{ pos, start, end, text }] (start/end — mətndə simvol indeksi).
 * Hərfsiz parçalar (vəqf işarəsi) sayılmır. Mətndə ərəb hərfi heç yoxdursa
 * (məs. test mətni) hər boşluqla ayrılan parça söz sayılır.
 */
export function ayahWordTokens(text) {
  const s = String(text || '')
  const all = []
  for (const m of s.matchAll(/\S+/g)) all.push({ start: m.index, end: m.index + m[0].length, text: m[0] })
  const words = all.some(t => LETTER.test(t.text)) ? all.filter(t => LETTER.test(t.text)) : all
  return words.map((t, i) => ({ pos: i + 1, ...t }))
}

/** Simvol indeksi → həmin yerdəki söz (boşluqdadırsa — ən yaxını), yoxdursa null */
export function wordAtOffset(tokens, offset) {
  if (!tokens?.length || !Number.isFinite(offset)) return null
  let best = null, bd = Infinity
  for (const t of tokens) {
    if (offset >= t.start && offset <= t.end) return t
    const d = offset < t.start ? t.start - offset : offset - t.end
    if (d < bd) { bd = d; best = t }
  }
  return best
}

/** Harakəsiz müqayisə üçün (axtarış) */
export const stripMarks = s => String(s || '').replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')

// ── Söz-söz məlumat (Quran.com) ──
// Söz tərcüməsi olan dillər (mushafla eyni siyahı — utils/mushaf.js WBW_LANGS)
export const WORD_LANGS = ['en', 'tr']
export const wordLang = lang => (WORD_LANGS.includes(lang) ? lang : 'en')

export function wordInfoUrl(key, wl = 'en') {
  const q = new URLSearchParams({ words: 'true', word_fields: 'text_uthmani', language: wl })
  return `${VERSE_API}/${key}?${q}`
}

/** API cavabı → [{ p, ar, tr, tl }] (yalnız sözlər; ayə sonu nişanı yox) */
export function parseWordInfo(json) {
  return (json?.verse?.words || [])
    .filter(w => (w.char_type_name || 'word') === 'word')
    .map(w => ({
      p: Number(w.position),
      ar: String(w.text_uthmani || w.text || ''),
      tr: String(w.translation?.text || ''),
      tl: String(w.transliteration?.text || ''),
    }))
    .filter(w => w.p > 0)
}

const cache = new Map()
const getJSON = async (url, fetchImpl) => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline')
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = setTimeout(() => ctrl?.abort(), 15000)
  let res
  try { res = await (fetchImpl || globalThis.fetch)(url, ctrl ? { signal: ctrl.signal } : undefined) } catch { throw new Error('network') } finally { clearTimeout(timer) }
  if (!res.ok) throw new Error('network')
  try { return await res.json() } catch { throw new Error('bad-response') }
}
const cached = (k, make) => {
  if (cache.has(k)) return cache.get(k)
  const p = make()
  cache.set(k, p)
  p.catch(() => cache.delete(k))
  return p
}

/** '2:255', 'en' → Promise<[{ p, ar, tr, tl }]> */
export function fetchWordInfo(key, wl = 'en', { fetchImpl } = {}) {
  if (!/^\d{1,3}:\d{1,3}$/.test(String(key))) return Promise.reject(new Error('bad-key'))
  return cached(`w|${key}|${wl}`, async () => {
    const words = parseWordInfo(await getJSON(wordInfoUrl(key, wl), fetchImpl))
    if (!words.length) throw new Error('bad-response')
    return words
  })
}

/** Sözün səsi: Əfasinin ayə faylı + söz vaxtları → Promise<{ url, words: [{ pos, from, to }] }> */
export function fetchWordAudio(key, { fetchImpl } = {}) {
  if (!/^\d{1,3}:\d{1,3}$/.test(String(key))) return Promise.reject(new Error('bad-key'))
  return cached(`a|${key}`, async () => {
    const [v, r] = await Promise.all([
      getJSON(`${VERSE_API}/${key}?words=true&word_fields=text_uthmani`, fetchImpl),
      getJSON(`${VERSE_API.replace('/verses/by_key', '')}/recitations/7/by_ayah/${key}?fields=segments`, fetchImpl),
    ])
    const k = buildKaraoke(v, r)
    if (!k) throw new Error('bad-response')
    return k
  })
}

/** Söz üçün səs aralığı (ms) — vaxtı yoxdursa null */
export function wordSegment(audio, pos) {
  const w = audio?.words?.find(x => x.pos === pos)
  if (!w || w.from == null || w.to == null || !(w.to > w.from)) return null
  return { from: w.from, to: w.to }
}
