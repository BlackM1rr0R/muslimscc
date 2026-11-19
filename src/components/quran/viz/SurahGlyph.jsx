// ═══════════════════════════════════════════════════════
// SurahGlyph — surənin məlumatdan doğan rozeti + kartdakı kiçik "ayə dalğası"
//
//   <SurahGlyph n={2} />       — rozet (dekor, aria-hidden; mənası mətndə də var)
//   <SurahSpark n={2} />       — ayələrin söz sayı zolağı (tək <path>)
//
// Həndəsə: ./surahViz.js → glyphGeometry (guşə — ayə sayı, dərinlik — orta söz sayı,
// qatlar — cüzlər, orbit nöqtəsi — nazil olma sırası, romblar — səcdə ayələri).
// İki qat SVG: .sg-base (sabit — məlumat yerində qalır) və .sg-star (ulduz; boş
// dayananda yalnız transform ilə çox yavaş fırlanır — kompozitorda).
// Animasiya yalnız ekranda olan kartda (.surah-card[data-vis]) — stillər SurahViz.css.
// ═══════════════════════════════════════════════════════
import { memo } from 'react'
import { glyphGeometry, sparkBars, sparkPath } from './surahViz'
import '../../../styles/SurahViz.css'

function SurahGlyph({ n, className = '', children }) {
  const g = glyphGeometry(n)
  if (!g) return null
  const { spec } = g
  return (
    <span className={`sg${spec.solid ? ' sg--madani' : ''} ${className}`} data-folds={spec.folds}>
      <svg className="sg-base" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle className={`sg-ring${spec.solid ? '' : ' is-dotted'}`} cx="50" cy="50" r="46" />
        {g.sajdah.map((p, i) => (
          <rect key={i} className="sg-saj" x={p.x - 2.4} y={p.y - 2.4} width="4.8" height="4.8" transform={`rotate(45 ${p.x} ${p.y})`} />
        ))}
        <circle className="sg-orbit" cx={g.orbit.x} cy={g.orbit.y} r="3.4" />
      </svg>
      <svg className="sg-star" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        {g.layers.map((d, i) => <path key={i} className="sg-layer" d={d} pathLength="1" style={{ '--i': i }} />)}
        <circle className="sg-core" cx="50" cy="50" r={g.core} />
      </svg>
      {children}
    </span>
  )
}

export const SurahSpark = memo(function SurahSpark({ n }) {
  const d = sparkPath(sparkBars(n, 40), 20)
  if (!d) return null
  return (
    <svg className="sc-spark" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  )
})

export default memo(SurahGlyph)
