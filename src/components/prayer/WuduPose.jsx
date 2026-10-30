// ═══════════════════════════════════════════════════════
// Dəstəmaz təsvirləri — PrayerPose ilə eyni üslub (eyni rəng dəyişənləri,
// halo, yumşaq formalar). Üz cizgisi yoxdur. Su — --pp-water.
// Hər səhnə 240×240; səhnə dəyişəndə yumşaq görünür (CSS: .wp-scene).
// ═══════════════════════════════════════════════════════

// Ovuc — barmaqlar bitişik, sadə forma (x,y — biləyin ortası; rot — dərəcə)
function Hand({ x, y, rot = 0, flip = false, cls = 'pp-skin' }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -1 : 1} 1)`}>
      <path d="M -9 0 C -10 -14 -9 -28 -5 -36 C -3 -40 2 -40 3 -36 L 4 -30 C 6 -33 11 -32 11 -27 L 10 -12 C 13 -15 17 -13 16 -9 C 14 -2 9 4 4 6 L -6 6 C -8 5 -9 3 -9 0 Z" className={cls} />
    </g>
  )
}

const Drop = ({ x, y, s = 1 }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M 0 -7 C 3 -2 5 1 5 3.5 A 5 5 0 0 1 -5 3.5 C -5 1 -3 -2 0 -7 Z" className="pp-water" />
)

// Su axını (yuxarıdan)
const Stream = ({ x, y1, y2 }) => (
  <path d={`M ${x - 3} ${y1} C ${x - 2} ${(y1 + y2) / 2} ${x - 4} ${y2 - 10} ${x - 2} ${y2} L ${x + 2} ${y2} C ${x + 4} ${y2 - 10} ${x + 2} ${(y1 + y2) / 2} ${x + 3} ${y1} Z`} className="pp-water" opacity="0.85" />
)

const Arrow = ({ d, head }) => (
  <g className="pp-arrow-g">
    <path d={d} className="pp-arrow" fill="none" strokeWidth="2.6" strokeLinecap="round" />
    <path d={head} className="pp-arrow" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </g>
)

// Öndən baş (üzsüz) — saç forması + qulaqlar
function FrontHead({ cx = 120, cy = 112 }) {
  return (
    <g>
      <rect x={cx - 26} y={cy + 34} width="52" height="60" rx="22" className="pp-garment" />
      <rect x={cx - 8} y={cy + 22} width="16" height="18" rx="7" className="pp-skin" />
      <ellipse cx={cx - 27} cy={cy + 2} rx="5" ry="8" className="pp-skin-far" />
      <ellipse cx={cx + 27} cy={cy + 2} rx="5" ry="8" className="pp-skin-far" />
      <ellipse cx={cx} cy={cy} rx="27" ry="33" className="pp-skin" />
      <path d={`M ${cx - 27} ${cy - 4} C ${cx - 30} ${cy - 30} ${cx - 14} ${cy - 36} ${cx} ${cy - 36} C ${cx + 14} ${cy - 36} ${cx + 30} ${cy - 30} ${cx + 27} ${cy - 4} C ${cx + 22} ${cy - 18} ${cx - 22} ${cy - 18} ${cx - 27} ${cy - 4} Z`} className="pp-hair" />
    </g>
  )
}

// Yandan baş (üzsüz, sağa baxır)
function SideHead({ cx = 112, cy = 108 }) {
  return (
    <g>
      <path d={`M ${cx - 30} ${cy + 96} C ${cx - 32} ${cy + 60} ${cx - 22} ${cy + 40} ${cx} ${cy + 40} C ${cx + 18} ${cy + 40} ${cx + 26} ${cy + 60} ${cx + 26} ${cy + 96} Z`} className="pp-garment" />
      <rect x={cx - 10} y={cy + 22} width="18" height="22" rx="8" className="pp-skin" />
      <path d={`M ${cx - 26} ${cy} C ${cx - 26} ${cy - 22} ${cx - 10} ${cy - 34} ${cx + 6} ${cy - 32} C ${cx + 22} ${cy - 30} ${cx + 30} ${cy - 16} ${cx + 30} ${cy - 2} L ${cx + 34} ${cy + 10} L ${cx + 29} ${cy + 12} C ${cx + 29} ${cy + 24} ${cx + 20} ${cy + 32} ${cx + 4} ${cy + 32} C ${cx - 14} ${cy + 32} ${cx - 26} ${cy + 18} ${cx - 26} ${cy} Z`} className="pp-skin" />
      <path d={`M ${cx - 26} ${cy + 2} C ${cx - 28} ${cy - 24} ${cx - 10} ${cy - 36} ${cx + 8} ${cy - 33} C ${cx + 22} ${cy - 30} ${cx + 28} ${cy - 22} ${cx + 28} ${cy - 16} C ${cx + 12} ${cy - 20} ${cx - 6} ${cy - 14} ${cx - 12} ${cy + 4} Z`} className="pp-hair" />
      <ellipse cx={cx - 10} cy={cy + 4} rx="5" ry="8" className="pp-skin-far" />
    </g>
  )
}

const SCENES = {
  jug: (
    <g>
      {/* ibrik */}
      <path d="M 70 92 C 66 104 62 120 62 140 C 62 164 76 176 96 176 C 116 176 130 164 130 140 C 130 120 126 104 122 92 Z" className="pp-garment" />
      <rect x="74" y="80" width="44" height="14" rx="6" className="pp-garment-far" />
      <path d="M 128 112 C 146 104 156 92 166 80" className="pp-garment" fill="none" strokeWidth="9" strokeLinecap="round" />
      <path d="M 64 108 C 46 112 46 146 64 150" className="pp-garment-far" fill="none" strokeWidth="7" strokeLinecap="round" />
      <path d="M 70 128 L 122 128" className="pp-fold" strokeWidth="1.6" />
      <Stream x={170} y1={84} y2={150} />
      {/* ovuclar suyu qəbul edir */}
      <Hand x={160} y={186} rot={-70} />
      <Hand x={184} y={186} rot={70} flip />
      <Drop x={172} y={198} s={0.9} />
    </g>
  ),
  hands: (
    <g>
      <Stream x={120} y1={36} y2={96} />
      <Hand x={104} y={150} rot={-18} />
      <Hand x={136} y={150} rot={18} flip cls="pp-skin-far" />
      <rect x="86" y="148" width="22" height="40" rx="9" className="pp-garment" transform="rotate(-18 97 168)" />
      <rect x="132" y="148" width="22" height="40" rx="9" className="pp-garment-far" transform="rotate(18 143 168)" />
      <Drop x={92} y={120} /><Drop x={150} y={116} s={0.8} /><Drop x={120} y={196} s={0.9} />
      <text x="120" y="226" textAnchor="middle" className="pp-count">× 3</text>
    </g>
  ),
  mouth: (
    <g>
      <SideHead cx={110} cy={104} />
      {/* ovuc ağıza su gətirir */}
      <path d="M 120 214 C 128 186 144 168 152 150" className="pp-garment" fill="none" strokeWidth="18" strokeLinecap="round" />
      <Hand x={150} y={148} rot={-150} />
      <Drop x={160} y={110} s={0.9} /><Drop x={172} y={124} s={0.7} />
      <text x="196" y="80" textAnchor="middle" className="pp-count">× 3</text>
    </g>
  ),
  face: (
    <g>
      <FrontHead />
      <Hand x={84} y={138} rot={-12} />
      <Hand x={156} y={138} rot={12} flip />
      <Drop x={104} y={150} s={0.8} /><Drop x={138} y={154} s={0.7} /><Drop x={122} y={160} s={0.9} />
      <text x="120" y="226" textAnchor="middle" className="pp-count">× 3</text>
    </g>
  ),
  arms: (
    <g>
      {/* üfüqi qol: barmaqlardan dirsəyə */}
      <rect x="132" y="118" width="80" height="28" rx="14" className="pp-garment" />
      <path d="M 52 124 L 140 120 L 140 144 L 52 140 Z" className="pp-skin" />
      <circle cx="140" cy="132" r="12" className="pp-skin" />
      <Hand x={50} y={132} rot={-90} />
      <Stream x={96} y1={44} y2={118} />
      <Drop x={70} y={160} s={0.8} /><Drop x={112} y={162} s={0.9} />
      <Arrow d="M 34 178 L 148 178" head="M 140 171 L 148 178 L 140 185" />
      <text x="120" y="214" textAnchor="middle" className="pp-count">× 3</text>
    </g>
  ),
  head: (
    <g>
      <FrontHead cy={124} />
      <Hand x={98} y={98} rot={-168} />
      <Hand x={142} y={98} rot={168} flip />
      <Arrow d="M 72 64 C 96 40 144 40 168 64" head="M 160 58 L 168 64 L 164 72" />
      <Arrow d="M 168 76 C 144 56 96 56 72 76" head="M 80 70 L 72 76 L 76 84" />
    </g>
  ),
  ears: (
    <g>
      <FrontHead cy={118} />
      <Hand x={74} y={150} rot={-20} />
      <Hand x={166} y={150} rot={20} flip />
      <circle cx="93" cy="120" r="9" className="pp-ring" fill="none" strokeWidth="2.4" />
      <circle cx="147" cy="120" r="9" className="pp-ring" fill="none" strokeWidth="2.4" />
    </g>
  ),
  feet: (
    <g>
      {/* yandan ayaq — barmaqlar sağda, topuq solda */}
      <rect x="68" y="58" width="36" height="74" rx="16" className="pp-garment" />
      <path d="M 72 120 L 104 120 L 112 156 C 140 158 170 162 182 170 C 188 176 184 186 176 186 L 76 186 C 66 186 64 176 66 166 Z" className="pp-skin" />
      <circle cx="100" cy="164" r="6" className="pp-skin-far" />
      <Stream x={150} y1={58} y2={152} />
      <Drop x={130} y={146} s={0.8} /><Drop x={168} y={150} s={0.7} />
      <Arrow d="M 186 204 L 78 204" head="M 86 197 L 78 204 L 86 211" />
      <text x="196" y="96" textAnchor="middle" className="pp-count">× 3</text>
    </g>
  ),
}

export const WUDU_SCENES = Object.keys(SCENES)

export default function WuduPose({ pose, label, className = '' }) {
  return (
    <svg viewBox="0 0 240 240" className={`pp-svg wp-svg ${className}`} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'} data-pose={pose} focusable="false">
      <circle cx="120" cy="124" r="100" className="pp-halo" />
      <g key={pose} className="wp-scene">{SCENES[pose] || SCENES.hands}</g>
    </svg>
  )
}
