// ═══════════════════════════════════════════════════════
// Hekayə kitabı səhnələri III — Yunus (gəmi, dərin dəniz, qaranlıq, sahildəki
// bitki), Süleyman (külək, bayraqlar, vadi), İsa (xurma, beşik, nur).
// Canlı təsviri (insan, heyvan, quş, balıq, həşərat) YOXDUR — yalnız təbiət, bitki, əşya, rəmz.
// ═══════════════════════════════════════════════════════
import {
  Sky, Layer, Hill, Stars, Sparkle, Moon, Sun, Cloud, Waves, Palm, Flowers, Grass,
  Lantern, Rays, Motes, House, Ship, LG, RG,
} from './kit'

// ── Yunus ───────────────────────────────────────────────
function Seaweed({ x, y, h = 90, fill = '#2f7a5a', i = 0 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={`sb-sway sb-sway--${(i % 3) + 1}`}>
        <path d={`M0 0Q-14 ${-h * 0.3} 0 ${-h * 0.5}T0 ${-h}Q10 ${-h * 0.7} 6 ${-h * 0.5}T8 0Z`} fill={fill} />
      </g>
    </g>
  )
}

function Gourd({ x, y, s = 1 }) {
  // Sahildəki bitki: enli yarpaqlı tağ (kölgəlik), sarı çiçəklər, yumru qabaq
  const leaves = [[-110, -150, -30], [-70, -186, -10], [-20, -200, 10], [30, -198, 0], [80, -184, 20], [118, -150, 35], [-120, -100, -60], [124, -100, 60], [0, -176, 0]]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-120 0Q-130 -150 -40 -180Q40 -205 110 -160Q140 -120 124 0" stroke="#7a5a32" strokeWidth="6" fill="none" />
      <path d="M-120 0Q-130 -150 -40 -180Q40 -205 110 -160Q140 -120 124 0" stroke="#5f9a46" strokeWidth="3" fill="none" strokeDasharray="10 14" />
      <g className="sb-sway sb-sway--1">
        {leaves.map(([lx, ly, r], i) => (
          <g key={i} transform={`translate(${lx} ${ly}) rotate(${r})`}>
            <path d="M0 26C-30 10 -34 -20 -14 -30C-6 -34 0 -28 0 -24C0 -28 6 -34 14 -30C34 -20 30 10 0 26Z" fill={i % 2 ? '#4f9a46' : '#66b45a'} />
            <path d="M0 24V-22M0 0l-12 -10M0 0l12 -10" stroke="#2f6a32" strokeWidth="1.6" fill="none" opacity=".6" />
          </g>
        ))}
        {[[-60, -150], [56, -168], [-14, -150], [96, -120]].map(([fx, fy], i) => (
          <g key={i} transform={`translate(${fx} ${fy})`}>{[0, 72, 144, 216, 288].map(a => <ellipse key={a} cy={-6} rx={4.5} ry={7} fill="#ffd23a" transform={`rotate(${a})`} />)}<circle r={3.5} fill="#f29a1a" /></g>
        ))}
      </g>
      <ellipse cx={-70} cy={-12} rx={26} ry={20} fill="#9ccf5a" />
      <path d="M-84 -26q14 -6 28 0" stroke="#7aa83a" strokeWidth="2" fill="none" />
      <ellipse cx={-70} cy={-4} rx={30} ry={6} fill="#000" opacity=".1" />
    </g>
  )
}

export function YunusScene({ uid, k, cam, pal }) {
  if (k === 'deep' || k === 'dark') {
    // Dənizin dərinliyi və "qaranlıqlar" — heç bir canlı yoxdur: qat-qat
    // qaranlıq, ortada dua kimi yuxarı qalxan isti işıq.
    const dark = k === 'dark'
    return (
      <g>
        <defs>
          <LG id={`${uid}-deep`} stops={dark ? [[0, '#0d2340'], [0.4, '#06182c'], [1, '#020a14']] : [[0, '#3fa7b8'], [0.45, pal.a], [1, pal.b]]} />
          <RG id={`${uid}-dua`} stops={[[0, '#fff1b8', 0.95], [0.3, '#ffd77a', 0.45], [1, '#ffd77a', 0]]} />
        </defs>
        <rect x={-200} y={-20} width={1200} height={560} fill={`url(#${uid}-deep)`} />
        {dark && <Stars n={22} seed={111} y0={6} y1={50} big={1} color="#cfe0ff" />}
        <Layer cam={cam} depth={0.2}>
          <Waves y={62} amp={8} len={140} fill={dark ? '#0b1f38' : '#5fc3cf'} speed={3} opacity={0.9} />
          {!dark && <Rays uid={uid} x={360} y={40} n={7} spread={46} len={520} opacity={0.32} color="#e6fbff" />}
        </Layer>
        <Layer cam={cam} depth={0.45}>
          {dark
            ? (
              <g>
                {/* üç qaranlıq: gecə, dəniz, dərinlik */}
                <ellipse cx={400} cy={280} rx={330} ry={190} fill="#061224" opacity=".7" />
                <ellipse cx={400} cy={280} rx={230} ry={135} fill="#030b18" opacity=".75" />
                <ellipse cx={400} cy={280} rx={140} ry={85} fill="#01060f" opacity=".8" />
                <circle cx={400} cy={280} r={120} fill={`url(#${uid}-dua)`} className="sb-glow" />
                <Motes seed={113} n={20} x0={340} x1={460} y0={110} y1={300} color="#ffe9a0" r0={2.6} />
              </g>
            )
            : (
              <g>
                <circle cx={400} cy={300} r={150} fill={`url(#${uid}-dua)`} opacity=".45" className="sb-glow" />
                <Motes seed={114} n={22} x0={180} x1={620} y0={160} y1={440} color="#e6fbff" r0={3.2} />
              </g>
            )}
        </Layer>
        <Layer cam={cam} depth={0.8}>
          <path d="M-200 520V470Q0 440 200 470T600 462T1000 470V520Z" fill={dark ? '#06121e' : '#d9c08a'} opacity={dark ? 1 : 0.85} />
          {[[200, 480, 110], [240, 486, 80], [560, 480, 120], [600, 486, 70], [330, 490, 60]].map(([x, y, h], i) => (
            <Seaweed key={i} x={x} y={y} h={h} i={i} fill={dark ? '#0b2a2a' : '#2f8a6a'} />
          ))}
          {!dark && [[300, 486, 9], [460, 490, 12], [500, 484, 7]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r * 1.4} ry={r * 0.8} fill="#b8a070" />)}
        </Layer>
      </g>
    )
  }
  if (k === 'shore') {
    return (
      <g>
        <Sky uid={uid} time="dawn" glow="#fff0c8" glowY={300} glowA={0.85} />
        <Sun uid={uid} x={260} y={250} r={40} color="#ffd98a" halo="#fff2cc" />
        <Layer cam={cam} depth={0.15}>
          <Cloud x={540} y={90} s={0.9} fill="#ffe2d8" drift={1} />
        </Layer>
        <Layer cam={cam} depth={0.4}>
          <Waves y={300} amp={6} len={140} fill="#7cc6d2" speed={3} />
          <Waves y={330} amp={8} len={160} fill={pal.a} speed={2} crest="#e6fbff" />
        </Layer>
        <Layer cam={cam} depth={0.7}>
          <path d="M-200 520V380Q100 352 400 372T1000 366V520Z" fill="#f2dcae" />
          <path d="M-200 384Q100 356 400 376T1000 370" stroke="#ffffff" strokeWidth="5" fill="none" opacity=".7" className="sb-tw sb-tw--2" />
          <Gourd x={400} y={470} s={1.05} />
        </Layer>
        <Layer cam={cam} depth={1}>
          <path d="M-200 520V478Q200 462 500 482T1000 474V520Z" fill="#e6c992" />
          {[[240, 490, 8], [262, 494, 5], [570, 492, 9], [592, 496, 6]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r * 1.5} ry={r} fill={i % 2 ? '#c9a878' : '#b8946a'} />)}
          <Motes seed={116} n={10} x0={200} x1={600} y0={300} y1={460} color="#fff8d8" />
        </Layer>
      </g>
    )
  }
  // ship
  return (
    <g>
      <Sky uid={uid} time="dusk" glow="#ffb38a" glowY={320} glowA={0.6} />
      <Layer cam={cam} depth={0.12}>
        <Cloud x={200} y={70} s={1.3} fill="#6a5a8a" shade="#5a4a7a" drift={1} />
        <Cloud x={600} y={100} s={1.1} fill="#7a6a9a" shade="#6a5a8a" drift={2} />
      </Layer>
      <Layer cam={cam} depth={0.3}>
        <Hill y={316} amp={6} seed={115} fill="#7a5a7a" peaks={[{ x: 200, h: 40, w: 100 }]} />
        <Waves y={318} amp={6} len={150} fill="#3a6a86" speed={3} />
      </Layer>
      <Layer cam={cam} depth={0.6}>
        <Waves y={380} amp={14} len={180} fill={pal.a} speed={2} crest="#bfe4ea" />
        <Ship uid={uid} x={400} y={384} s={1} cabin={false} sail="#f4ead2" cargo />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Waves y={450} amp={18} len={220} fill={pal.b} speed={1} crest="#9fd0da" />
      </Layer>
    </g>
  )
}

// ── Süleyman: külək, bayraqlar, sakit vadi ──────────────
// Canlı təsviri yoxdur: "evlərinə girin" — kiçik təpəciklərdəki qapılar
// və onlara doğru axan kiçik işıq nöqtələri ilə danışılır.
function Mound({ x, y, s = 1, glow }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-90 0Q-60 -64 0 -70Q60 -64 90 0Z" fill="#c49a6a" />
      <path d="M-60 -20q20 -6 30 4M20 -40q14 -4 24 6M30 -12q10 -2 20 6" stroke="#a87a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M-16 -18a16 16 0 0 1 32 0Z" fill={glow ? '#ffd77a' : '#5a3a22'} />
      {glow && <ellipse cx={0} cy={-22} rx={30} ry={22} fill="#ffd77a" opacity=".3" className="sb-glow" />}
    </g>
  )
}

function WindLines({ seed = 1, color = '#ffffff' }) {
  const out = []
  for (let i = 0; i < 5; i++) {
    const x = 200 + ((i * 97 + seed * 31) % 380), y = 90 + ((i * 53 + seed * 17) % 170)
    out.push(<path key={i} d={`M${x} ${y}q40 -14 80 0t70 -6q18 -2 16 -16q-2 -12 -14 -8`} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" className={`sb-tw sb-tw--${(i % 3) + 1}`} />)
  }
  return <g className="sb-drift sb-drift--2">{out}</g>
}

function Banners({ xs, y, pal, h = 46 }) {
  return xs.map((fx, i) => (
    <g key={fx} transform={`translate(${fx} ${y - (i % 2) * 6})`}>
      <path d={`M0 0V${-h}`} stroke="#6b4b2a" strokeWidth="3" />
      <g className={`sb-sway sb-sway--${(i % 3) + 1}`}><path d={`M0 ${-h}Q14 ${-h - 4} 26 ${-h + 4}Q14 ${-h + 10} 0 ${-h + 14}Z`} fill={[pal.c, '#d9534f', '#5a8ac8'][i % 3]} /></g>
    </g>
  ))
}

export function SulaymanScene({ uid, k, cam, pal }) {
  if (k === 'homes') {
    return (
      <g>
        <Sky uid={uid} time="morning" glow="#fffbe0" glowY={260} />
        <Sun uid={uid} x={560} y={80} r={28} />
        <Layer cam={cam} depth={0.25}>
          <Hill y={250} amp={10} seed={121} fill="#b8e0a0" />
          <Cloud x={220} y={80} s={0.7} drift={2} />
        </Layer>
        <Layer cam={cam} depth={0.5}>
          <Hill y={300} amp={6} seed={122} fill="#8cc878" />
          {/* yaxından görünən nəhəng ot yarpaqları və çiçəklər */}
          <g className="sb-wind sb-wind--1">
            {[[120, 200], [170, 260], [210, 220], [600, 240], [640, 200], [690, 270]].map(([x, h], i) => (
              <path key={i} d={`M${x} 520Q${x + 10} ${520 - h * 0.6} ${x + (i % 2 ? 40 : -30)} ${520 - h}Q${x + 20} ${520 - h * 0.5} ${x + 26} 520Z`} fill={i % 2 ? '#4f9a46' : '#66b45a'} />
            ))}
          </g>
          <g transform="translate(250 330)"><g className="sb-sway sb-sway--2">
            <path d="M0 190V0" stroke="#3d8a4f" strokeWidth="5" />
            {[0, 60, 120, 180, 240, 300].map(a => <ellipse key={a} cy={-22} rx={12} ry={22} fill="#ff9db0" transform={`rotate(${a})`} />)}
            <circle r={13} fill="#ffc23a" />
          </g></g>
          <g transform="translate(580 300)"><g className="sb-sway sb-sway--3">
            <path d="M0 220V0" stroke="#3d8a4f" strokeWidth="5" />
            {[0, 72, 144, 216, 288].map(a => <ellipse key={a} cy={-20} rx={13} ry={20} fill="#fff" transform={`rotate(${a})`} />)}
            <circle r={12} fill="#ffc23a" />
          </g></g>
        </Layer>
        <Layer cam={cam} depth={0.8}>
          <path d="M-200 520V420Q200 396 400 412T1000 404V520Z" fill="#d9b884" />
          <path d="M230 452Q330 438 420 446T500 430" stroke="#c9a46e" strokeWidth="14" fill="none" strokeLinecap="round" />
          <Mound x={500} y={440} s={1.1} glow />
          <g fill="#fff3b0">
            {[[250, 450], [290, 446], [330, 442], [370, 444], [410, 444], [450, 438], [478, 432]].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}><g className={`sb-tw sb-tw--${(i % 3) + 1}`}><circle r={3.4} /></g></g>
            ))}
          </g>
        </Layer>
        <Layer cam={cam} depth={1}>
          <Grass seed={123} y={512} h={34} fill="#3f8a4a" />
          <path d="M-200 520V500Q300 490 1000 500V520Z" fill="#c9a26e" />
        </Layer>
      </g>
    )
  }
  const thanks = k === 'thanks'
  const wind = k === 'wind'
  return (
    <g>
      <Sky uid={uid} time={thanks ? 'golden' : 'day'} glow={thanks ? '#fff0c0' : '#ffffff'} glowY={320} glowA={thanks ? 0.8 : 0.5} />
      {thanks ? <Sun uid={uid} x={400} y={300} r={52} color="#ffcf6a" halo="#fff0c4" /> : <Sun uid={uid} x={560} y={90} r={30} />}
      <Layer cam={cam} depth={0.15}>
        <Cloud x={220} y={90} s={0.9} fill={thanks ? '#ffe6c8' : '#fff'} drift={1} />
        <Cloud x={560} y={70} s={0.7} fill={thanks ? '#ffe6c8' : '#fff'} opacity={0.8} drift={2} />
        {wind && <WindLines seed={3} />}
      </Layer>
      <Layer cam={cam} depth={0.35}>
        <Hill y={330} amp={16} seed={126} fill={thanks ? '#c9b07a' : '#a8d890'} peaks={[{ x: 220, h: 60, w: 160 }, { x: 600, h: 70, w: 160 }]} />
        {wind && (
          <g transform="translate(400 300)">
            {/* təpədə sarayın sakit zalı */}
            <rect x={-90} y={-60} width={180} height={60} rx={4} fill="#f2e2c0" />
            {[-60, -20, 20, 60].map(cx => <path key={cx} d={`M${cx - 12} 0V-34a12 12 0 0 1 24 0V0Z`} fill="#c9a77a" />)}
            <path d="M-100 -60H100L88 -72H-88Z" fill="#d9bf90" />
            <path d="M-30 -72a30 30 0 0 1 60 0Z" fill="#e0b860" />
            <Banners xs={[-96, 96]} y={-60} pal={pal} h={50} />
          </g>
        )}
        {k === 'valley' && (
          <g>
            {/* uzaq silsilədə bayraqlar və toz — ordu görünmür */}
            <Banners xs={[440, 480, 520, 560, 600]} y={282} pal={pal} />
            <Cloud x={520} y={292} s={0.9} fill="#efe0c0" shade="#e0cca0" opacity={0.75} drift={3} />
          </g>
        )}
      </Layer>
      <Layer cam={cam} depth={0.65}>
        <Hill y={400} amp={10} seed={127} fill={thanks ? '#a8a060' : '#7cc06a'} />
        {k === 'valley' && <path d="M560 392Q470 400 420 414T300 440" stroke="#e8d6a8" strokeWidth="16" fill="none" strokeLinecap="round" opacity=".9" />}
        {(k === 'valley' || thanks) && [[230, 412, 0.55], [400, 420, 0.7], [560, 414, 0.5]].map(([x, y, s], i) => <Mound key={i} x={x} y={y} s={s} glow={thanks} />)}
      </Layer>
      <Layer cam={cam} depth={1}>
        <Hill y={472} amp={6} seed={129} fill={thanks ? '#7a8a4a' : pal.a} />
        <Grass seed={130} y={500} fill={thanks ? '#5a6a32' : '#2f7a3a'} />
        <Flowers seed={131} n={22} y0={466} y1={500} colors={['#ff9db0', '#ffd36b', '#ffffff', pal.d]} />
        {thanks && <Motes seed={132} n={16} x0={180} x1={620} y0={240} y1={440} color="#fff6c8" />}
      </Layer>
    </g>
  )
}

// ── İsa: xurma, beşik, nur ──────────────────────────────
function Cradle({ x, y, s = 1, uid, glow = 0.7 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><RG id={`${uid}-cg`} stops={[[0, '#fff3c0', glow], [1, '#fff3c0', 0]]} /></defs>
      <ellipse cx={0} cy={-50} rx={170} ry={120} fill={`url(#${uid}-cg)`} className="sb-glow" />
      <g className="sb-rock">
        <path d="M-96 6Q0 34 96 6" stroke="#7a4a26" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M-74 -6V-74M74 -6V-74" stroke="#8a5a32" strokeWidth="8" strokeLinecap="round" />
        <circle cx={-74} cy={-78} r={7} fill="#c8954f" />
        <circle cx={74} cy={-78} r={7} fill="#c8954f" />
        <path d="M-70 -54Q-70 -6 0 -4Q70 -6 70 -54Z" fill="#c8954f" />
        <path d="M-66 -40Q0 -30 66 -40M-60 -24Q0 -14 60 -24" stroke="#9a6a32" strokeWidth="3" fill="none" />
        <path d="M-72 -56Q-40 -74 0 -64Q40 -76 72 -56Q40 -48 0 -52Q-40 -46 -72 -56Z" fill="#f6efdf" />
        <path d="M-30 -60q10 6 22 2q12 -4 26 2" stroke="#cdbb9a" strokeWidth="2" fill="none" />
        <path d="M-70 -54H70" stroke="#e0ad66" strokeWidth="4" strokeLinecap="round" />
      </g>
      <ellipse cx={0} cy={14} rx={110} ry={10} fill="#000" opacity=".15" />
    </g>
  )
}

function OpenBook({ x, y, s = 1, uid }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><RG id={`${uid}-ob`} stops={[[0, '#fff8d8', 0.95], [1, '#fff8d8', 0]]} /></defs>
      <g className="sb-float sb-float--2">
        <circle r={90} fill={`url(#${uid}-ob)`} className="sb-glow" />
        <path d="M0 -6Q-30 -26 -64 -18V26Q-30 18 0 36Z" fill="#fffaf0" />
        <path d="M0 -6Q30 -26 64 -18V26Q30 18 0 36Z" fill="#f6eedb" />
        <path d="M-54 -6q24 -8 44 4M-54 6q24 -8 44 4M10 -2q22 -12 44 -4M10 10q22 -12 44 -4" stroke="#d6c39a" strokeWidth="2.4" fill="none" />
        <path d="M0 -6V36" stroke="#c9a96a" strokeWidth="2" />
        <path d="M-64 26Q-30 18 0 36Q30 18 64 26" stroke="#c8954f" strokeWidth="3" fill="none" />
      </g>
    </g>
  )
}

export function IsaScene({ uid, k, cam }) {
  if (k === 'path') {
    return (
      <g>
        <Sky uid={uid} time="dusk" glow="#ffc79a" glowY={330} glowA={0.75} />
        <Stars n={18} seed={141} y1={140} big={3} />
        <Moon uid={uid} x={540} y={84} r={22} />
        <Layer cam={cam} depth={0.25}>
          <Hill y={300} amp={10} seed={142} fill="#8a6aa8" peaks={[{ x: 420, h: 50, w: 160 }]} />
          {[[320, 286], [370, 274], [420, 266], [470, 274], [515, 286]].map(([hx, hy], i) => (
            <House key={i} x={hx} y={hy} w={40 + (i % 2) * 8} h={28 + (i % 3) * 5} wall="#c9a6c0" roof="#8a6a98" win="#ffd77a" dome={i === 2} />
          ))}
        </Layer>
        <Layer cam={cam} depth={0.55}>
          <Hill y={380} amp={10} seed={143} fill="#6a5a98" />
          <path d="M410 296Q440 330 400 356Q330 390 360 430Q390 470 320 520H440Q490 470 460 432Q430 396 470 366Q510 330 432 296Z" fill="#d8b88a" opacity=".75" />
          <Lantern uid={uid} x={500} y={350} s={0.55} />
        </Layer>
        <Layer cam={cam} depth={1}>
          <Hill y={470} amp={6} seed={144} fill="#3f356e" />
          <Palm x={230} y={492} h={200} lean={24} s={0.85} trunk="#4a3a5a" leaf="#2f5a5a" leaf2="#3f6e6a" />
          <Palm x={590} y={496} h={170} lean={-20} s={0.8} trunk="#4a3a5a" leaf="#2f5a5a" leaf2="#3f6e6a" sway={2} />
        </Layer>
      </g>
    )
  }
  const bright = k === 'light'
  return (
    <g>
      <Sky uid={uid} time={k === 'cradle' ? 'night' : 'deepnight'} glow="#bfa8ff" glowA={0.35} glowY={360} />
      <Stars n={k === 'night' ? 70 : 50} seed={145} y1={300} big={k === 'night' ? 7 : 4} />
      <Moon uid={uid} x={k === 'night' ? 290 : 540} y={90} r={k === 'night' ? 30 : 24} />
      {bright && <Rays uid={uid} x={400} y={330} n={7} spread={80} len={380} opacity={0.2} color="#fff3c8" up />}
      <Layer cam={cam} depth={0.25}>
        <Hill y={340} amp={12} seed={146} fill="#3a3478" />
      </Layer>
      <Layer cam={cam} depth={0.5}>
        <Hill y={400} amp={8} seed={147} fill="#4a4288" />
        {/* çay */}
        <path d="M-200 430Q100 410 300 428T700 420T1000 430V452Q700 442 500 450T100 440T-200 452Z" fill="#5a8ac8" opacity=".85" />
        <path d="M40 436h60M420 438h80M720 432h50" stroke="#dbe9ff" strokeWidth="2.5" strokeLinecap="round" opacity=".7" className="sb-tw sb-tw--2" />
        {k === 'cradle' && <Palm x={540} y={420} h={210} lean={-26} s={0.9} trunk="#5a4060" leaf="#2f6a62" leaf2="#3f7e70" />}
      </Layer>
      <Layer cam={cam} depth={0.8}>
        <Hill y={466} amp={4} seed={148} fill="#2c2660" />
        <Cradle uid={uid} x={k === 'cradle' ? 380 : 400} y={466} s={k === 'night' ? 1.25 : 1.05} glow={bright ? 0.95 : 0.6} />
        {bright && <OpenBook uid={uid} x={400} y={250} s={1.1} />}
        {bright && <Motes seed={149} n={18} x0={280} x1={520} y0={260} y1={440} color="#fff4c8" />}
        {k === 'night' && <Motes seed={150} n={12} x0={160} x1={640} y0={300} y1={440} color="#e6ff9a" r0={2} />}
        {k !== 'cradle' && <g><Sparkle x={300} y={320} s={8} cls="sb-tw sb-tw--1" /><Sparkle x={510} y={300} s={10} cls="sb-tw sb-tw--3" /></g>}
      </Layer>
      <Layer cam={cam} depth={1}>
        <Hill y={492} amp={4} seed={151} fill="#211c4c" />
        <Grass seed={152} y={504} fill="#1a1640" sway={1} />
        <Flowers seed={153} n={12} y0={482} y1={500} colors={['#e6dcff', '#ffe58a', '#ffffff']} s={0.8} />
      </Layer>
    </g>
  )
}
