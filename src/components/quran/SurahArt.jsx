// ═══════════════════════════════════════════════════════
// SurahArt — hər surə üçün UNİKAL həndəsi rozet (dekor, aria-hidden)
//
//   <SurahArt n={36} madani={false} />
//
// Surənin nömrəsindən determinist yaranır (təsadüf yox — hər dəfə eyni):
//   • ulduzun guşə sayı (5, 6, 8, 10, 12, 16)
//   • qat sayı (2–4), daxili/xarici nisbət, fırlanma (qızıl bucaqla)
//   • xarici halqa və nöqtə çələngi bəzi surələrdə
// Rəng currentColor-dandır: Məkki — zümrüd, Mədəni — qızılı (CSS).
// Şəkil faylı və şəbəkə sorğusu yoxdur — 114 kart üçün yüngül SVG.
// ═══════════════════════════════════════════════════════
import { memo } from 'react'

const FOLDS = [8, 12, 6, 10, 16, 5]

function star(cx, cy, n, rOut, rIn, rot) {
  let d = ''
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? rIn : rOut
    const a = rot + (i * Math.PI) / n
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`
  }
  return `${d}Z`
}

/** Surənin rozet parametrləri (saf funksiya) */
export function surahArtSpec(n) {
  const k = Number(n) || 1
  const folds = FOLDS[k % FOLDS.length]
  const layers = 2 + (k % 3)
  const ratio = 0.42 + ((k * 7) % 5) * 0.06
  const rot = ((k * 137.508) % 360) * (Math.PI / 180)
  return { folds, layers, ratio, rot, ring: k % 2 === 0, dots: k % 3 === 0 }
}

function SurahArt({ n, className = '' }) {
  const s = surahArtSpec(n)
  const paths = []
  for (let i = 0; i < s.layers; i++) {
    const r = 46 - i * (30 / s.layers)
    paths.push(<path key={i} d={star(50, 50, s.folds, r, r * s.ratio, s.rot + (i * Math.PI) / s.folds)} />)
  }
  const dots = s.dots
    ? Array.from({ length: s.folds }, (_, i) => {
        const a = s.rot + (i * 2 * Math.PI) / s.folds
        return <circle key={i} cx={(50 + 48 * Math.cos(a)).toFixed(2)} cy={(50 + 48 * Math.sin(a)).toFixed(2)} r="1.8" />
      })
    : null
  return (
    <svg className={`surah-art ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g className="surah-art__g">
        {s.ring && <circle cx="50" cy="50" r="48" className="surah-art__ring" />}
        {paths}
        <circle cx="50" cy="50" r={(46 - (s.layers - 1) * (30 / s.layers)) * s.ratio * 0.55} className="surah-art__core" />
        {dots && <g className="surah-art__dots">{dots}</g>}
      </g>
    </svg>
  )
}

export default memo(SurahArt)
