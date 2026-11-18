// ═══════════════════════════════════════════════════════
// JourneyFrame (J7) — avatarın ətrafında "yol mərhələsi"nə görə dəyişən həndəsi çərçivə
//
//   <JourneyFrame stage={2}><span className="acc-avatar">Ə</span></JourneyFrame>
//   <JourneyFrame live>…</JourneyFrame>   — mərhələni yaddaşdan özü hesablayır (utils/journeyLevel)
//
// Yalnız həndəsə (dairə, altıbucaq, səkkizguşəli və on ikiguşəli ulduz) — canlı varlıq təsviri YOXDUR.
// Çərçivə bəzəkdir (aria-hidden); mərhələnin adı /account-da mətnlə yazılır. Gizlidir: yalnız sizə görünür.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { currentLevel } from '../../utils/journeyLevel'
import '../../styles/JourneyFrame.css'

// 100×100 koordinat; avatar ortadakı r≈38 dairədədir
const star = (n, r1, r2, rot = -90) => {
  const pts = []
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (180 / n) * i) * Math.PI) / 180
    const r = i % 2 ? r2 : r1
    pts.push(`${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`)
  }
  return pts.join(' ')
}
const poly = (n, r, rot = -90) => star(n / 2, r, r, rot)
const dots = (n, r) => Array.from({ length: n }, (_, i) => {
  const a = ((-90 + (360 / n) * i) * Math.PI) / 180
  return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r]
})

function Shape({ stage }) {
  switch (stage) {
    case 1: return (<>
      <circle cx="50" cy="50" r="44" className="jf__line" />
      {dots(6, 46).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" className="jf__dot" />)}
    </>)
    case 2: return (<>
      <polygon points={poly(6, 48)} className="jf__line" />
      <circle cx="50" cy="50" r="42.5" className="jf__line jf__line--soft" />
    </>)
    case 3: return (<>
      <polygon points={star(8, 49, 42)} className="jf__line" />
      {dots(8, 49).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" className="jf__dot" />)}
    </>)
    case 4: return (<>
      <polygon points={star(12, 49.5, 43)} className="jf__line jf__line--gold" />
      <polygon points={star(12, 49.5, 43, -75)} className="jf__line jf__line--soft" />
      {dots(12, 46).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" className="jf__dot jf__dot--gold" />)}
    </>)
    default: return <circle cx="50" cy="50" r="44" className="jf__line jf__line--soft" />
  }
}

export function useJourneyStage(live) {
  const [stage, setStage] = useState(() => (live && typeof window !== 'undefined' ? currentLevel().stage : 0))
  useEffect(() => {
    if (!live) return undefined
    const re = () => setStage(currentLevel().stage)
    window.addEventListener('storage', re)
    window.addEventListener('mcc-journey', re)
    return () => { window.removeEventListener('storage', re); window.removeEventListener('mcc-journey', re) }
  }, [live])
  return stage
}

export default function JourneyFrame({ stage: given, live = false, size = 'md', children }) {
  const auto = useJourneyStage(live)
  const stage = Math.max(0, Math.min(4, Number.isInteger(given) ? given : auto))
  return (
    <span className={`jf jf--${size} jf--s${stage}`} data-testid="journey-frame" data-stage={stage}>
      {children}
      <svg className="jf__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><Shape stage={stage} /></svg>
    </span>
  )
}
