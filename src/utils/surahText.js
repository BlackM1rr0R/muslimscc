// ═══════════════════════════════════════════════════════
// Surənin ərəbcə mətni — alquran.cloud, Quran səhifəsi ilə eyni nəşr (ar.alafasy). Mətn saytda saxlanmır.
// HifzPage (məşq kartı) və HifzTestPage ("Məni yoxla" — yoxlayan) üçün ortaq; modul səviyyəsində keş.
// ═══════════════════════════════════════════════════════
import { displayAyah } from './quranText'

// Modul səviyyəsində keş: eyni surə bir dəfə gətirilir; xəta keşdə qalmır.
const SURAH_CACHE = new Map()
/** → Promise<[{ a, g, ar }]> */
export function fetchSurahText(s) {
  if (SURAH_CACHE.has(s)) return SURAH_CACHE.get(s)
  const p = fetch(`https://api.alquran.cloud/v1/surah/${s}/editions/ar.alafasy`)
    .then(r => { if (!r.ok) throw new Error('http'); return r.json() })
    .then(d => {
      const ed = Array.isArray(d?.data) ? d.data[0] : null
      if (!Array.isArray(ed?.ayahs)) throw new Error('bad-response')
      return ed.ayahs.map((v, i) => ({ a: v.numberInSurah, g: v.number, ar: displayAyah(v.text, s, i) }))
    })
  SURAH_CACHE.set(s, p)
  p.catch(() => SURAH_CACHE.delete(s))
  return p
}
