// Hero fonu: həndəsi ulduz səması (dizayn v4) — kiçik dörd/səkkizguşəli
// ulduzlar yavaş parıldayır, kənarda böyük səkkizguşəli rozet çox yavaş fırlanır.
// Dekordur (aria-hidden); valideyn position:relative olmalıdır.
import '../../styles/ToolsMotion.css'

const STAR8 = 'M12 0l2.6 6.1L21 3l-3.1 6.4L24 12l-6.1 2.6L21 21l-6.4-3.1L12 24l-2.6-6.1L3 21l3.1-6.4L0 12l6.1-2.6L3 3l6.4 3.1z'
const STAR4 = 'M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z'

// Sabit "təsadüfi" düzülüş — prerender ilə eyni olsun deyə Math.random yoxdur
const POS = [
  [8, 18, 7], [17, 62, 5], [26, 30, 9], [34, 78, 6], [43, 14, 5], [52, 52, 8], [61, 26, 6],
  [69, 70, 10], [77, 40, 5], [85, 16, 7], [91, 58, 6], [12, 86, 5], [48, 88, 6], [73, 90, 5],
]

function Rosette() {
  // İki üst-üstə kvadrat (səkkizguşəli ulduz) + daxili halqalar
  return (
    <svg viewBox="-100 -100 200 200" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="-70" y="-70" width="140" height="140" />
      <rect x="-70" y="-70" width="140" height="140" transform="rotate(45)" />
      <rect x="-48" y="-48" width="96" height="96" transform="rotate(22.5)" />
      <rect x="-48" y="-48" width="96" height="96" transform="rotate(67.5)" />
      <circle r="92" />
      <circle r="34" />
      <circle r="20" strokeDasharray="3 5" />
    </svg>
  )
}

export default function GeoStarfield({ rosette = true, className = '' }) {
  return (
    <div className={`tm-sky${className ? ` ${className}` : ''}`} aria-hidden="true">
      {POS.map(([x, y, s], i) => (
        <span key={i} className="tm-sky__star"
          style={{ insetInlineStart: `${x}%`, top: `${y}%`, '--s': `${s + 3}px`, '--d': `${(i * 0.73) % 4}s`, '--t': `${3 + (i % 4)}s` }}>
          <svg viewBox="0 0 24 24"><path d={i % 3 ? STAR4 : STAR8} fill="currentColor" /></svg>
        </span>
      ))}
      {rosette && <span className="tm-sky__rosette"><Rosette /></span>}
    </div>
  )
}
