// Mushafda canlı qiraət (components/quran/MushafRecite.jsx) — saf köməkçilər (tests/unit/mushaf-recite.test.js)
//
// Quran.com API v4: /recitations/7/by_page/{səhifə}?fields=segments
//   → audio_files: [{ verse_key, url: 'Alafasy/mp3/002006.mp3', segments: [[idx, söz, başla ms, bitir ms], …] }]
// Mədinə mushafında hər səhifə yeni ayə ilə başlayır — ayə iki səhifəyə bölünmür.
const AUDIO_BASE = 'https://verses.quran.com/'

/** API cavabı → Map(ayə açarı → { url, segs: [[söz, başla, bitir], …] (sözə görə sıralı) }) */
export function buildPageTimings(json) {
  const m = new Map()
  for (const f of json?.audio_files || []) {
    if (!f?.verse_key || !f.url) continue
    const segs = (f.segments || []).filter(s => Array.isArray(s) && s.length >= 4)
      .map(s => [Number(s[1]), Number(s[2]), Number(s[3])]).sort((a, b) => a[0] - b[0])
    m.set(f.verse_key, { url: /^https?:/.test(f.url) ? f.url : AUDIO_BASE + String(f.url).replace(/^\/+/, ''), segs })
  }
  return m
}

/** Səhifə sözləri (MushafPage → data.words) → ayələr sırası [{ key, words: [mövqelər] }] */
export function pageVerses(words) {
  const out = [], at = new Map()
  for (const w of words || []) {
    if (w.type !== 'word' || !w.key) continue
    if (!at.has(w.key)) { at.set(w.key, out.length); out.push({ key: w.key, words: [] }) }
    out[at.get(w.key)].words.push(Number(w.p))
  }
  return out
}

/** ms → oxunan sözün mövqeyi (null — hələ başlamayıb) */
export function wordAtMs(segs, ms) {
  let cur = null
  for (const [p, from] of segs || []) {
    if (from <= ms) cur = p
    else break
  }
  return cur
}

/** Sözün başlanğıc anı (ms); vaxt yoxdursa 0 */
export function startOf(segs, pos) {
  const s = (segs || []).find(x => x[0] === pos)
  return s ? s[1] : 0
}
