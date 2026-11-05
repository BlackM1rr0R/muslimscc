// Sözbəsöz tilavət (components/quran/KaraokeAyah.jsx) — API cavabı → sözlər + vaxtlar (saf; tests/unit/karaoke.test.js)
const AUDIO_BASE = 'https://verses.quran.com/'

/** API cavablarından → { words: [{ pos, text, from, to }], url } (saf; tests/unit/karaoke.test.js) */
export function buildKaraoke(verseJson, recJson) {
  const words = (verseJson?.verse?.words || []).filter(w => w.char_type_name === 'word')
    .map(w => ({ pos: w.position, text: w.text_uthmani }))
  const file = recJson?.audio_files?.[0]
  if (!words.length || !file?.url) return null
  const seg = new Map()
  for (const s of file.segments || []) {
    if (Array.isArray(s) && s.length >= 4) seg.set(Number(s[1]), [Number(s[2]), Number(s[3])])
  }
  return {
    url: /^https?:/.test(file.url) ? file.url : AUDIO_BASE + file.url.replace(/^\/+/, ''),
    words: words.map(w => ({ ...w, from: seg.get(w.pos)?.[0] ?? null, to: seg.get(w.pos)?.[1] ?? null })),
  }
}

/** ms → aktiv sözün indeksi (−1 — hələ başlamayıb) */
export function wordAt(words, ms) {
  let cur = -1
  for (let i = 0; i < words.length; i++) {
    if (words[i].from != null && words[i].from <= ms) cur = i
    else if (words[i].from != null) break
  }
  return cur
}

