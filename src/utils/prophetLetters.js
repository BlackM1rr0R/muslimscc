// ═══════════════════════════════════════════════════════
// Peyğəmbərin ﷺ məktubları — saf köməkçilər (components/ProphetLetters.jsx)
//   libHash — Hədis kitabxanasında hədisin ünvanı (#kitab/bölmə/nömrə, SahwGuide kimi)
//   arcPath — iki nöqtə arasında yüngül əyri (SVG "Q" əmri), marşrut xətti üçün
//   routePath — bir neçə nöqtədən ibarət marşrutun bütöv SVG yolu
// ═══════════════════════════════════════════════════════

/**
 * Hədis kitabxanasındakı ünvan: #<kitab>/<bölmə>/<kitabxana nömrəsi>.
 * Bölmə tapılmasa yalnız #<kitab>.
 * @param {{book:string, lib:number}} ref
 * @param {Record<string,{sections:Array}>} bookData  data/hadithLibrary.js → BOOK_DATA
 */
export function libHash(ref, bookData) {
  const secs = bookData?.[ref.book]?.sections || []
  const sec = secs.find(s => s[1] && ref.lib >= s[2] && ref.lib <= s[3])
  return sec ? `#${ref.book}/${sec[0]}/${ref.lib}` : `#${ref.book}`
}

const r1 = (v) => Math.round(v * 10) / 10

/** İki nöqtə arasında əyri: orta nöqtədən perpendikulyar istiqamətdə bend × uzunluq qədər sürüşmə */
export function arcPath([x1, y1], [x2, y2], bend = 0.18) {
  const dx = x2 - x1, dy = y2 - y1
  const cx = (x1 + x2) / 2 - dy * bend, cy = (y1 + y2) / 2 + dx * bend
  return `M${r1(x1)} ${r1(y1)}Q${r1(cx)} ${r1(cy)} ${r1(x2)} ${r1(y2)}`
}

/** Marşrut (ekran nöqtələri) → bir SVG yolu; hər hissə ayrıca əyri */
export function routePath(points, bend = 0.18) {
  if (!points || points.length < 2) return ''
  let d = ''
  for (let i = 1; i < points.length; i++) {
    const seg = arcPath(points[i - 1], points[i], bend)
    d += i === 1 ? seg : seg.replace(/^M[^Q]+/, '')
  }
  return d
}
