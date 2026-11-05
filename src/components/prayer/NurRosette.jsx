// ═══════════════════════════════════════════════════════
// NurRosette — "Bugünkü nurunuz" (/dailytracker): 10 ləçək, hər əməl bir ləçək
//
//   <NurRosette done={{ fajr: true, quran: true }} inner={['fajr',…5]} outer={['quran',…5]} />
//
// • Daxili 5 ləçək — beş vaxt namaz, xarici 5 — Quran, əzkar, zikr, sədəqə.
// • Qeyd olunan ləçək qızılı yanır (opacity/transform keçidi), mərkəz işığı əməl sayı ilə güclənir.
// • Dekordur (aria-hidden) — mətn və faiz valideyndə. Stillər: src/styles/NurRosette.css
// ═══════════════════════════════════════════════════════
import '../../styles/NurRosette.css'

const petal = (len, w) => `M0,0 C${w},${-len * 0.35} ${w * 0.8},${-len * 0.8} 0,${-len} C${-w * 0.8},${-len * 0.8} ${-w},${-len * 0.35} 0,0 Z`

export default function NurRosette({ done = {}, inner = [], outer = [] }) {
  const all = [...inner, ...outer]
  const k = all.length ? all.filter(x => done[x]).length / all.length : 0
  return (
    <svg className="nr" viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="nr-core"><stop offset="0" stopColor="#fff6d6" /><stop offset=".5" stopColor="#f0c75e" stopOpacity=".7" /><stop offset="1" stopColor="#f0c75e" stopOpacity="0" /></radialGradient>
        <linearGradient id="nr-gold" x1="0" y1="0" x2="0" y2="-1"><stop offset="0" stopColor="#e2a93b" /><stop offset="1" stopColor="#f8e3a0" /></linearGradient>
      </defs>
      <circle className="nr__glow" r="58" style={{ opacity: 0.15 + k * 0.75, transform: `scale(${0.55 + k * 0.45})` }} />
      {outer.map((key, i) => (
        <path key={key} className={`nr__p nr__p--out${done[key] ? ' is-on' : ''}`} d={petal(54, 15)}
          transform={`rotate(${36 + i * 72})`} style={{ '--i': i + 5 }} />
      ))}
      {inner.map((key, i) => (
        <path key={key} className={`nr__p nr__p--in${done[key] ? ' is-on' : ''}`} d={petal(38, 13)}
          transform={`rotate(${i * 72})`} style={{ '--i': i }} />
      ))}
      <circle className="nr__core" r="17" style={{ opacity: 0.35 + k * 0.65 }} />
      <circle className="nr__disc" r="29" />
    </svg>
  )
}
