// ═══════════════════════════════════════════════════════
// Qiraətçiləri müqayisə (v6.2) — components/quran/ReciterCompare.jsx (/quran)
// Saf məntiq: Quran.com cavabı → söz vaxtları, səs dalğası zirvələri, söz uzunluqları.
// Söz vaxtları — Quran.com API v4 (/recitations/{id}/by_ayah/{key}?fields=segments),
// səs — verses.quran.com (CORS açıq). tests/unit/reciter-compare.test.js
// ═══════════════════════════════════════════════════════
const AUDIO_BASE = 'https://verses.quran.com/'

// Quran.com qiraət id → utils/quranAudio RECITERS id (ad 5 dildə oradan götürülür)
export const COMPARE_RECITERS = [
  { qc: 7, id: 'alafasy' },
  { qc: 2, id: 'abdulbasit' },
  { qc: 9, id: 'minshawi' },
  { qc: 3, id: 'sudais' },
  { qc: 10, id: 'shuraym' },
]

/** Səs ünvanı: nisbi yol → verses.quran.com; "//host/…" → https: */
export function audioUrl(url) {
  if (!url) return null
  if (/^https?:/.test(url)) return url
  if (url.startsWith('//')) return 'https:' + url
  return AUDIO_BASE + url.replace(/^\/+/, '')
}

/** Cavab → { url, segs: Map(sözün yeri → [from, to] ms), end } (Sudaisdə rəqəmlər sətirdir) */
export function parseRecitation(json) {
  const f = json?.audio_files?.[0]
  if (!f?.url) return null
  const segs = new Map()
  let end = 0
  for (const s of f.segments || []) {
    if (!Array.isArray(s) || s.length < 4) continue
    const pos = Number(s[1]), from = Number(s[2]), to = Number(s[3])
    if (!Number.isFinite(pos) || !Number.isFinite(from) || !Number.isFinite(to) || to < from) continue
    segs.set(pos, [from, to]); end = Math.max(end, to)
  }
  return { url: audioUrl(f.url), segs, end }
}

/** Ayənin sözləri (yalnız "word", "end" nişanı xaric): [{ pos, text }] */
export function verseWords(json) {
  return (json?.verse?.words || []).filter(w => w.char_type_name === 'word').map(w => ({ pos: w.position, text: w.text_uthmani }))
}

/** PCM → bins sayda zirvə (0…1) */
export function peaksOf(data, bins = 400) {
  const out = new Float32Array(bins)
  if (!data?.length) return out
  const step = data.length / bins
  let max = 0
  for (let b = 0; b < bins; b++) {
    let m = 0
    const s = Math.floor(b * step), e = Math.min(data.length, Math.floor((b + 1) * step))
    for (let i = s; i < e; i += 4) { const v = Math.abs(data[i]); if (v > m) m = v }
    out[b] = m; if (m > max) max = m
  }
  if (max > 0) for (let b = 0; b < bins; b++) out[b] /= max
  return out
}

/** Söz üzrə müddət (ms) hər qari üçün: [{ pos, ms: [..] }] — yoxdursa null */
export function wordDurations(words, recs) {
  return words.map(w => ({ pos: w.pos, ms: recs.map(r => { const s = r?.segs?.get(w.pos); return s ? s[1] - s[0] : null }) }))
}

/** ms anında hansı söz oxunur (pos) — yoxdursa null */
export function wordAtTime(segs, ms) {
  if (!segs) return null
  for (const [pos, [a, b]] of segs) if (ms >= a && ms <= b) return pos
  return null
}
