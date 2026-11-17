// ═══════════════════════════════════════════════════════
// Hekayə kitablarının SVG "fırça qutusu" (storybook/*.jsx səhnələri üçün)
//
// Hamısı əl ilə çəkilmiş sadə formalardır: səma, ulduz, ay, günəş, bulud,
// təpə, dalğa, xurma, çiçək, ot, fənər, yağış, işıq şüaları, gəmi, daş.
// Səhnənin ölçüsü 800×500 (viewBox); təbəqələr kənarlardan ~150 vahid geniş
// çəkilir ki, kamera (parallaks) sürüşəndə boşluq görünməsin.
// Hərəkət yalnız CSS sinifləri ilə (StoryBooks.css: sb-sway, sb-drift, sb-wave,
// sb-tw, sb-bob, sb-flick, sb-rise, sb-float, sb-spin, sb-rain) — transform/opacity;
// .sb-live xaricində (üz qabıqları) və "hərəkəti azalt" rejimində dayanır.
// CANLI TƏSVİRİ YOXDUR (sahibin qərarı): insan, peyğəmbər, mələk, heyvan, quş,
// balıq, həşərat çəkilmir — yalnız bitki, təbiət, əşya və rəmz.
// tests/unit/story-books.test.js bunu yoxlayır.
// ═══════════════════════════════════════════════════════
import { createContext, useContext } from 'react'
import { rng } from '../../utils/storyBooks'

/** Səhnənin unikal id prefiksi (gradiyentlər üçün) — StoryScene verir */
export const SceneCtx = createContext('sb')

export const W = 800
export const H = 500
const f1 = (n) => Math.round(n * 10) / 10

/** Nöqtələrdən hamar əyri (Catmull-Rom → kub Bezye) */
export function smooth(pts) {
  if (pts.length < 2) return ''
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`
  }
  return d
}

/** Təpə silsiləsi: bağlı forma (aşağısı doldurulur) */
export function ridge({ y = 320, amp = 30, seed = 1, step = 120, x0 = -200, x1 = 1000, bottom = 560, peaks }) {
  const r = rng(seed)
  const pts = []
  for (let x = x0; x <= x1; x += step) {
    let yy = y + (r() - 0.5) * 2 * amp
    if (peaks) for (const p of peaks) yy -= p.h * Math.exp(-(((x - p.x) / (p.w || 120)) ** 2))
    pts.push([x, yy])
  }
  return `${smooth(pts)}L${x1} ${bottom}L${x0} ${bottom}Z`
}

/** Təpə: rəng + yuxarıdan işıq, aşağıya kölgə gradiyenti + kənarında nazik işıq xətti */
export function Hill({ fill, opacity = 1, rim = 0.28, ...o }) {
  const uid = useContext(SceneCtx)
  const d = ridge(o)
  const top = d.slice(0, d.indexOf('L' + (o.x1 ?? 1000) + ' '))
  return (
    <g opacity={opacity}>
      <path d={d} fill={fill} />
      <path d={d} fill={`url(#${uid}-hsh)`} />
      {rim > 0 && <path d={top} fill="none" stroke="#fff" strokeWidth="2.2" opacity={rim} strokeLinecap="round" />}
    </g>
  )
}

/** Xətti gradiyent qısaltması */
export function LG({ id, stops, x2 = 0, y2 = 1, x1 = 0, y1 = 0 }) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      {stops.map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />)}
    </linearGradient>
  )
}
export function RG({ id, stops, cx = 0.5, cy = 0.5, r = 0.5 }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      {stops.map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />)}
    </radialGradient>
  )
}

// Günün vaxtına görə səma rəngləri (yuxarı → üfüq)
export const SKIES = {
  dawn: ['#7d88c9', '#f2a9b4', '#ffd9a8'],
  morning: ['#8fd0f2', '#cdeef7', '#fff1cf'],
  day: ['#5fb6ea', '#a8dcf4', '#e9f7f2'],
  golden: ['#f6a96b', '#ffcf8a', '#fff0c4'],
  dusk: ['#3c3f86', '#b46aa0', '#ffb38a'],
  night: ['#0b1236', '#1d2a68', '#3d4a8c'],
  deepnight: ['#060a24', '#101a48', '#24306b'],
  storm: ['#2b3a4f', '#4f6273', '#8a9aa0'],
}

/** Səma — gradiyent + üfüqdə yumşaq parıltı */
export function Sky({ uid, time = 'day', glow = '#fff3d0', glowX = 400, glowY = 330, glowA = 0.55 }) {
  const c = SKIES[time] || SKIES.day
  return (
    <g>
      <defs>
        <LG id={`${uid}-sky`} stops={[[0, c[0]], [0.62, c[1]], [1, c[2]]]} />
        <RG id={`${uid}-hz`} stops={[[0, glow, glowA], [1, glow, 0]]} />
      </defs>
      <rect x={-200} y={-20} width={1200} height={560} fill={`url(#${uid}-sky)`} />
      <ellipse cx={glowX} cy={glowY} rx={520} ry={230} fill={`url(#${uid}-hz)`} />
    </g>
  )
}

/** Parallaks təbəqəsi: depth 0 (uzaq) … 1 (yaxın) */
export function Layer({ cam = 0, depth = 0.5, children }) {
  const x = f1(-cam * depth * 90)
  return <g className="sb-pl" style={{ transform: `translate(${x}px, 0px)` }}>{children}</g>
}

/** Ulduzlar — üç qrup, fərqli fazada sayrışır */
export function Stars({ n = 40, seed = 3, x0 = -100, x1 = 900, y0 = 10, y1 = 240, color = '#fff6d8', big = 5 }) {
  const r = rng(seed)
  const groups = [[], [], []]
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + Math.pow(r(), 1.4) * (y1 - y0), s = 0.8 + r() * 1.6
    groups[i % 3].push(<circle key={i} cx={f1(x)} cy={f1(y)} r={f1(s)} fill={color} />)
  }
  const sparkles = []
  for (let i = 0; i < big; i++) {
    const x = x0 + 80 + r() * (x1 - x0 - 160), y = y0 + r() * (y1 - y0) * 0.8
    sparkles.push(<Sparkle key={i} x={x} y={y} s={7 + r() * 6} color={color} cls={`sb-tw sb-tw--${(i % 3) + 1}`} />)
  }
  return (
    <g>
      {groups.map((g, i) => <g key={i} className={`sb-tw sb-tw--${i + 1}`}>{g}</g>)}
      {sparkles}
    </g>
  )
}

/** Dörd guşəli parıltı ulduzu */
export function Sparkle({ x, y, s = 8, color = '#fff6d8', cls, opacity = 1 }) {
  const d = `M0 ${-s}C${s * 0.12} ${-s * 0.12} ${s * 0.12} ${-s * 0.12} ${s} 0C${s * 0.12} ${s * 0.12} ${s * 0.12} ${s * 0.12} 0 ${s}C${-s * 0.12} ${s * 0.12} ${-s * 0.12} ${s * 0.12} ${-s} 0C${-s * 0.12} ${-s * 0.12} ${-s * 0.12} ${-s * 0.12} 0 ${-s}Z`
  return (
    <g transform={`translate(${f1(x)} ${f1(y)})`} opacity={opacity}>
      <g className={cls}><path d={d} fill={color} /></g>
    </g>
  )
}

/** Beşguşəli yumru ulduz (Yusifin 11 ulduzu kimi) */
export function Star5({ x, y, r = 12, fill = '#ffd76a', rot = 0 }) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2 + (rot * Math.PI) / 180
    const rr = i % 2 ? r * 0.48 : r
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr])
  }
  return <path d={`M${pts.map(p => `${f1(p[0])} ${f1(p[1])}`).join('L')}Z`} fill={fill} stroke={fill} strokeWidth={r * 0.18} strokeLinejoin="round" />
}

/** Aypara (hilal) + parıltı */
export function Moon({ uid, x = 620, y = 90, r = 34, color = '#fff2c2', phase = 0.55, glow = 0.5, tilt = -20 }) {
  const id = `${uid}-moon${Math.round(x)}`
  return (
    <g>
      <defs>
        <RG id={`${id}-g`} stops={[[0, color, glow], [1, color, 0]]} />
        <mask id={`${id}-m`}>
          <rect x={x - r - 2} y={y - r - 2} width={r * 2 + 4} height={r * 2 + 4} fill="#fff" />
          <circle cx={x + r * phase * Math.cos((tilt * Math.PI) / 180)} cy={y + r * phase * Math.sin((tilt * Math.PI) / 180)} r={r * 0.92} fill="#000" />
        </mask>
      </defs>
      <circle cx={x} cy={y} r={r * 3.2} fill={`url(#${id}-g)`} />
      <circle cx={x} cy={y} r={r} fill={color} mask={phase ? `url(#${id}-m)` : undefined} />
    </g>
  )
}

/** Günəş — disk, yumşaq hale, yavaş fırlanan şüalar */
export function Sun({ uid, x = 400, y = 120, r = 40, color = '#ffd56b', halo = '#fff0b8', rays = true }) {
  const id = `${uid}-sun${Math.round(x)}${Math.round(y)}`
  const rs = []
  if (rays) for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const a1 = a - 0.07, a2 = a + 0.07
    rs.push(<path key={i} d={`M${f1(Math.cos(a1) * r * 1.35)} ${f1(Math.sin(a1) * r * 1.35)}L${f1(Math.cos(a) * r * 2.1)} ${f1(Math.sin(a) * r * 2.1)}L${f1(Math.cos(a2) * r * 1.35)} ${f1(Math.sin(a2) * r * 1.35)}Z`} />)
  }
  return (
    <g>
      <defs><RG id={id} stops={[[0, halo, 0.9], [0.35, halo, 0.35], [1, halo, 0]]} /></defs>
      <circle cx={x} cy={y} r={r * 4} fill={`url(#${id})`} />
      {rays && <g transform={`translate(${x} ${y})`}><g className="sb-spin" fill={color} opacity=".45">{rs}</g></g>}
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x - r * 0.25} cy={y - r * 0.25} r={r * 0.55} fill="#fff" opacity=".25" />
    </g>
  )
}

/** Yumşaq bulud (dairələr + düz alt) */
export function Cloud({ x, y, s = 1, fill = '#fff', opacity = 0.9, shade, drift = 1 }) {
  const shadeFill = shade || fill
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) scale(${s})`} opacity={opacity}>
      <g className={drift ? `sb-drift sb-drift--${drift}` : undefined}>
        <ellipse cx={0} cy={14} rx={78} ry={16} fill={shadeFill} />
        <circle cx={-42} cy={4} r={24} fill={fill} />
        <circle cx={-8} cy={-12} r={34} fill={fill} />
        <circle cx={30} cy={-2} r={27} fill={fill} />
        <circle cx={58} cy={8} r={17} fill={fill} />
        <rect x={-62} y={4} width={132} height={22} rx={11} fill={fill} />
      </g>
    </g>
  )
}

/** Dalğalı su zolağı — sonsuz sürüşən (sb-wave), dalğa uzunluğu len */
export function Waves({ y = 360, amp = 10, len = 120, fill = '#2a8a9a', speed = 1, bottom = 560, opacity = 1, crest }) {
  let d = `M${-400} ${y}`
  for (let x = -400; x < 1200; x += len) {
    d += `Q${x + len / 4} ${y - amp} ${x + len / 2} ${y}T${x + len} ${y}`
  }
  d += `L1200 ${bottom}L-400 ${bottom}Z`
  let c = null
  if (crest) {
    let cd = ''
    for (let x = -400; x < 1200; x += len) cd += `M${x + len * 0.12} ${y - amp * 0.45}Q${x + len / 4} ${y - amp * 1.02} ${x + len * 0.38} ${y - amp * 0.45}`
    c = <path d={cd} fill="none" stroke={crest} strokeWidth="3" strokeLinecap="round" opacity=".7" />
  }
  return (
    <g opacity={opacity}>
      <g className={`sb-wave sb-wave--${speed}`} style={{ '--sb-len': `${len}px` }}>
        <path d={d} fill={fill} />
        {c}
      </g>
    </g>
  )
}

/** Xurma ağacı (yarpaqlar küləkdə yırğalanır) */
export function Palm({ x, y, h = 170, lean = 18, trunk = '#8a5a3b', leaf = '#2f8a57', leaf2 = '#3fa86a', dates = '#d8762e', s = 1, sway = 1 }) {
  const top = [lean, -h]
  const trunkD = `M-7 0Q${f1(lean * 0.3 - 6)} ${f1(-h * 0.5)} ${f1(top[0] - 4)} ${f1(top[1])}L${f1(top[0] + 4)} ${f1(top[1])}Q${f1(lean * 0.3 + 6)} ${f1(-h * 0.5)} 7 0Z`
  const rings = []
  for (let i = 1; i < 9; i++) {
    const t = i / 9
    const cx = lean * t * t * 0.9 + lean * 0.1 * t, cy = -h * t
    rings.push(<path key={i} d={`M${f1(cx - 6)} ${f1(cy)}q6 4 12 0`} stroke="#5b3a24" strokeWidth="1.6" fill="none" opacity=".55" />)
  }
  const fr = []
  const angs = [-168, -140, -112, -70, -40, -12, -90]
  angs.forEach((a, i) => {
    const rad = (a * Math.PI) / 180
    const L = i === 6 ? 52 : 78 + (i % 2) * 12
    const tx = Math.cos(rad) * L, ty = Math.sin(rad) * L * 0.75 + L * 0.35
    const mx = Math.cos(rad) * L * 0.5, my = Math.sin(rad) * L * 0.5 - 18
    fr.push(<path key={i} d={`M0 0Q${f1(mx - 8)} ${f1(my - 8)} ${f1(tx)} ${f1(ty)}Q${f1(mx + 6)} ${f1(my + 14)} 0 0Z`} fill={i % 2 ? leaf : leaf2} />)
    fr.push(<path key={`v${i}`} d={`M0 0Q${f1(mx)} ${f1(my)} ${f1(tx)} ${f1(ty)}`} stroke="#1f5a3a" strokeWidth="1.2" fill="none" opacity=".45" />)
  })
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) scale(${s})`}>
      <g className={sway ? `sb-sway sb-sway--${sway}` : undefined}>
        <path d={trunkD} fill={trunk} />
        {rings}
        <g transform={`translate(${f1(top[0])} ${f1(top[1])})`}>
          {dates && <g fill={dates}><circle cx={-6} cy={10} r={5} /><circle cx={2} cy={13} r={5} /><circle cx={9} cy={9} r={4.5} /><circle cx={-1} cy={19} r={4.5} /></g>}
          {fr}
        </g>
      </g>
    </g>
  )
}

/** Yumru ağac (yarpaq kütləsi üç tonda) */
export function Tree({ x, y, s = 1, trunk = '#7a5236', c1 = '#2f7a4f', c2 = '#3f9a5f', c3 = '#5cb874', fruit, sway = 0 }) {
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) scale(${s})`}>
      <g className={sway ? `sb-sway sb-sway--${sway}` : undefined}>
        <path d="M-9 0Q-6 -40 -14 -70L-4 -66Q0 -40 2 -30Q8 -55 18 -72L24 -66Q10 -40 9 0Z" fill={trunk} />
        <circle cx={-34} cy={-88} r={36} fill={c1} />
        <circle cx={30} cy={-92} r={38} fill={c1} />
        <circle cx={0} cy={-120} r={44} fill={c2} />
        <circle cx={-18} cy={-96} r={30} fill={c2} />
        <circle cx={22} cy={-108} r={28} fill={c3} opacity=".9" />
        <circle cx={-10} cy={-136} r={22} fill={c3} opacity=".85" />
        {fruit && [[-30, -84], [26, -80], [6, -112], [-14, -122], [36, -104], [-42, -100]].map(([fx, fy], i) => (
          <circle key={i} cx={fx} cy={fy} r={5.5} fill={fruit} />
        ))}
      </g>
    </g>
  )
}

/** Çiçək tarlası */
export function Flowers({ seed = 7, n = 18, x0 = -60, x1 = 860, y0 = 420, y1 = 490, colors = ['#ff9db0', '#ffd36b', '#ffffff', '#c7a6ff'], s = 1, cls }) {
  const r = rng(seed)
  const out = []
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), c = colors[i % colors.length], k = (0.7 + r() * 0.6) * s
    out.push(
      <g key={i} transform={`translate(${f1(x)} ${f1(y)}) scale(${f1(k)})`}>
        <path d="M0 0q-2 10 0 18" stroke="#3d8a4f" strokeWidth="2" fill="none" />
        {[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx={0} cy={-6} rx={4} ry={6.5} fill={c} transform={`rotate(${a})`} />)}
        <circle r={3.2} fill="#ffb43a" />
      </g>
    )
  }
  return <g className={cls}>{out}</g>
}

/** Ot topaları */
export function Grass({ seed = 11, n = 26, x0 = -100, x1 = 900, y = 470, h = 22, fill = '#3d8a4f', sway = 2 }) {
  const r = rng(seed)
  const out = []
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), hh = h * (0.6 + r() * 0.8)
    out.push(<path key={i} d={`M${f1(x - 7)} ${y}Q${f1(x - 6)} ${f1(y - hh * 0.6)} ${f1(x - 12)} ${f1(y - hh)}Q${f1(x - 2)} ${f1(y - hh * 0.6)} ${f1(x)} ${y}Q${f1(x + 1)} ${f1(y - hh * 0.8)} ${f1(x + 4)} ${f1(y - hh * 1.2)}Q${f1(x + 5)} ${f1(y - hh * 0.6)} ${f1(x + 8)} ${y}Z`} fill={fill} />)
  }
  return <g className={sway ? `sb-wind sb-wind--${sway}` : undefined}>{out}</g>
}

/** Asılı fənər (yumşaq işıq) */
export function Lantern({ uid, x, y, s = 1, glass = '#ffd77a', metal = '#7a4d1f', rope = true }) {
  const id = `${uid}-lan${Math.round(x)}`
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) scale(${s})`}>
      <defs><RG id={id} stops={[[0, glass, 0.75], [1, glass, 0]]} /></defs>
      <g className="sb-swing">
        {rope && <path d="M0 -60V-22" stroke={metal} strokeWidth="2" />}
        <circle cx={0} cy={6} r={60} fill={`url(#${id})`} className="sb-glow" />
        <path d="M-10 -22h20l4 8h-28Z" fill={metal} />
        <path d="M-14 -14h28l-3 32h-22Z" fill={glass} />
        <path d="M-4 -14v32M4 -14v32" stroke={metal} strokeWidth="1.6" opacity=".7" />
        <path d="M-16 18h32l-6 8h-20Z" fill={metal} />
        <circle cx={0} cy={0} r={5} fill="#fff7d6" />
      </g>
    </g>
  )
}

/** Yağış — zolaqlar aşağı axır */
export function Rain({ seed = 9, n = 70, color = '#d8ecf5', opacity = 0.55 }) {
  const r = rng(seed)
  const out = []
  for (let i = 0; i < n; i++) {
    const x = -100 + r() * 1000, y = -40 + r() * 520, l = 14 + r() * 16
    out.push(<path key={i} d={`M${f1(x)} ${f1(y)}l-5 ${f1(l)}`} />)
  }
  return (
    <g opacity={opacity} stroke={color} strokeWidth="2" strokeLinecap="round">
      <g className="sb-rain">{out}</g>
      <g transform="translate(0 -520)"><g className="sb-rain">{out}</g></g>
    </g>
  )
}

/** Yuxarıdan enən işıq şüaları (yavaş "nəfəs alır") */
export function Rays({ uid, x = 400, y = -40, color = '#fff5cf', n = 7, spread = 70, len = 560, opacity = 0.5, up = false }) {
  const id = `${uid}-rays${Math.round(x)}`
  const out = []
  for (let i = 0; i < n; i++) {
    const a = ((-spread / 2 + (spread / (n - 1)) * i + (up ? -90 : 90)) * Math.PI) / 180
    const w = 0.035 + (i % 2) * 0.02
    out.push(<path key={i} d={`M${x} ${y}L${f1(x + Math.cos(a - w) * len)} ${f1(y + Math.sin(a - w) * len)}L${f1(x + Math.cos(a + w) * len)} ${f1(y + Math.sin(a + w) * len)}Z`} className={`sb-tw sb-tw--${(i % 3) + 1}`} />)
  }
  return (
    <g opacity={opacity}>
      <defs><LG id={id} stops={[[0, color, 0.95], [1, color, 0]]} y1={up ? 1 : 0} y2={up ? 0 : 1} /></defs>
      <g fill={`url(#${id})`}>{out}</g>
    </g>
  )
}

/** Yuxarı qalxan işıq zərrələri (dua, şükür) */
export function Motes({ seed = 13, n = 16, x0 = 250, x1 = 550, y0 = 220, y1 = 420, color = '#fff2b8', r0 = 2.5 }) {
  const r = rng(seed)
  const out = []
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), rr = r0 * (0.6 + r() * 0.9)
    out.push(
      <g key={i} transform={`translate(${f1(x)} ${f1(y)})`}>
        <g className={`sb-rise sb-rise--${(i % 4) + 1}`}><circle r={f1(rr)} fill={color} /></g>
      </g>
    )
  }
  return <g>{out}</g>
}

/** Ev (düz damlı, işıqlı pəncərə) — kənd və şəhər səhnələri üçün */
export function House({ x, y, w = 70, h = 50, wall = '#e8c69a', roof = '#b9825a', win = '#ffd77a', dome }) {
  return (
    <g transform={`translate(${f1(x)} ${f1(y)})`}>
      <rect x={0} y={-h} width={w} height={h} rx={4} fill={wall} />
      <rect x={-3} y={-h - 6} width={w + 6} height={8} rx={3} fill={roof} />
      {dome && <path d={`M${w * 0.2} ${-h - 6}a${w * 0.3} ${w * 0.3} 0 0 1 ${w * 0.6} 0Z`} fill={roof} />}
      <path d={`M${w * 0.14} ${-h * 0.4}v${-h * 0.22}a${w * 0.08} ${w * 0.08} 0 0 1 ${w * 0.16} 0v${h * 0.22}Z`} fill={win} />
      <path d={`M${w * 0.56} 0v${-h * 0.42}a${w * 0.12} ${w * 0.12} 0 0 1 ${w * 0.24} 0V0Z`} fill={roof} opacity=".85" />
    </g>
  )
}

/** Gəmi (gövdə, taxta xətlər, üstündə ev/yük, istəyə görə yelkən) */
export function Ship({ uid, x, y, s = 1, hull = '#8a5432', hull2 = '#6b3d22', deck = '#c98e5c', cabin = true, sail, cargo, lamp = true }) {
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) scale(${s})`}>
      <g className="sb-bob sb-bob--1">
        {sail && (
          <g>
            <path d="M-4 -150V-20" stroke="#5b3a24" strokeWidth="6" strokeLinecap="round" />
            <path d="M4 -144Q70 -100 66 -34L4 -30Z" fill={sail} />
            <path d="M-12 -140Q-70 -96 -64 -38L-12 -34Z" fill={sail} opacity=".85" />
          </g>
        )}
        {cabin && (
          <g>
            <path d="M-70 -24V-70H70V-24Z" fill={deck} />
            <path d="M-84 -66L0 -100L84 -66Z" fill={hull2} />
            {[-46, -16, 14, 44].map(wx => <rect key={wx} x={wx - 8} y={-60} width={16} height={18} rx={8} fill="#ffd77a" />)}
          </g>
        )}
        {cargo && (
          <g>
            <rect x={-80} y={-48} width={40} height={30} rx={4} fill="#c8894f" />
            <rect x={-36} y={-58} width={44} height={40} rx={4} fill="#a86f3c" />
            <rect x={12} y={-44} width={34} height={26} rx={4} fill="#d9a066" />
            <rect x={48} y={-52} width={30} height={34} rx={4} fill="#b97a44" />
            <path d="M-80 -33h40M-36 -38h44M12 -31h34" stroke="#7a4a26" strokeWidth="2" opacity=".6" />
          </g>
        )}
        <path d="M-140 -26Q-120 -24 -110 -20H110Q120 -24 140 -26Q132 10 92 22H-92Q-132 10 -140 -26Z" fill={hull} />
        <path d="M-128 -10H128M-118 4H118" stroke={hull2} strokeWidth="3" opacity=".6" />
        <path d="M-140 -26Q-120 -24 -110 -20H110Q120 -24 140 -26" stroke="#d9a97a" strokeWidth="4" fill="none" strokeLinecap="round" />
        {lamp && <Lantern uid={`${uid}-ship`} x={112} y={-58} s={0.55} />}
      </g>
    </g>
  )
}

/** Daş divar sırası (Kəbə, quyu, saray) — kərpic xətləri ilə düzbucaqlı */
export function StoneBlock({ x, y, w, h, fill = '#9b8470', line = '#6e5a4a', rows = 5 }) {
  const out = []
  const rh = h / rows
  for (let i = 1; i < rows; i++) out.push(<path key={`r${i}`} d={`M${x} ${f1(y + rh * i)}h${w}`} />)
  for (let i = 0; i < rows; i++) {
    const off = i % 2 ? 0.5 : 0
    for (let c = 1; c < 5; c++) {
      const xx = x + (w / 4) * (c - off)
      if (xx > x + 4 && xx < x + w - 4) out.push(<path key={`c${i}-${c}`} d={`M${f1(xx)} ${f1(y + rh * i)}v${f1(rh)}`} />)
    }
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={fill} />
      <g stroke={line} strokeWidth="2" opacity=".55">{out}</g>
    </g>
  )
}
