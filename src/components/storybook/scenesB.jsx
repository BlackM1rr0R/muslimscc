// ═══════════════════════════════════════════════════════
// Hekayə kitabı səhnələri II — Kəbənin divarları, Musa (çay və yarılan
// dəniz), Yusif (yuxu, quyu, Misir, çadırlı yol).
// Canlı təsviri (insan, heyvan, quş, balıq, həşərat) YOXDUR — yalnız təbiət, bitki, əşya, rəmz.
// ═══════════════════════════════════════════════════════
import {
  Sky, Layer, Hill, Stars, Star5, Moon, Sun, Cloud, Waves, Palm, Flowers, Grass,
  Lantern, Rays, Motes, House, StoneBlock, LG, RG,
} from './kit'

// ── Kəbənin divarları ───────────────────────────────────
function Kaaba({ uid, x, y, built = 1 }) {
  // önüzü 150×150, yan üzü perspektivdə
  const w = 150, h = 150, hh = Math.round(h * built)
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <LG id={`${uid}-kf`} stops={[[0, '#b39a80'], [1, '#8a735e']]} />
        <LG id={`${uid}-ks`} stops={[[0, '#8d7660'], [1, '#6a5646']]} />
      </defs>
      <ellipse cx={20} cy={4} rx={150} ry={16} fill="#000" opacity=".18" />
      <path d={`M${w / 2} 0L${w / 2 + 56} -18V${-hh - 18}L${w / 2} ${-hh}Z`} fill={`url(#${uid}-ks)`} />
      <rect x={-w / 2} y={-hh} width={w} height={hh} fill={`url(#${uid}-kf)`} />
      <StoneBlock x={-w / 2} y={-hh} w={w} h={hh} fill="transparent" line="#5e4c3e" rows={Math.max(1, Math.round(6 * built))} />
      {built >= 1 && <path d={`M${-w / 2} ${-hh}L${-w / 2 + 56} ${-hh - 18}H${w / 2 + 56}L${w / 2} ${-hh}Z`} fill="#c9b196" />}
      {built < 1 && [[-w / 2 + 14, -hh - 14], [-w / 2 + 50, -hh - 14], [w / 2 - 40, -hh - 14]].map(([bx, by], i) => (
        <rect key={i} x={bx} y={by} width={30} height={14} rx={2} fill="#a38b74" stroke="#5e4c3e" strokeWidth="1.5" />
      ))}
    </g>
  )
}

export function KaabaScene({ uid, k, cam }) {
  const dua = k === 'dua'
  return (
    <g>
      <Sky uid={uid} time={dua ? 'dusk' : 'golden'} glow={dua ? '#ffc39a' : '#fff1c8'} glowY={340} glowA={0.7} />
      {dua && <Stars n={26} seed={52} y1={170} big={4} />}
      {dua ? <Moon uid={uid} x={600} y={86} r={24} /> : <Sun uid={uid} x={530} y={115} r={34} color="#ffd06a" halo="#fff2c6" />}
      <Layer cam={cam} depth={0.15}>
        {!dua && <Cloud x={200} y={90} s={0.8} fill="#fff4e4" drift={1} />}
        <Hill y={300} amp={10} seed={61} fill={dua ? '#8a5a7a' : '#d9a088'} peaks={[{ x: 60, h: 120, w: 120 }, { x: 760, h: 140, w: 130 }]} />
      </Layer>
      <Layer cam={cam} depth={0.4}>
        <Hill y={340} amp={8} seed={62} fill={dua ? '#6e4462' : '#b9705c'} peaks={[{ x: 120, h: 110, w: 110 }, { x: 690, h: 100, w: 110 }]} />
      </Layer>
      <Layer cam={cam} depth={0.65}>
        <Hill y={420} amp={4} seed={63} fill={dua ? '#a57a6a' : '#e7c08e'} />
        <defs><RG id={`${uid}-kglow`} stops={[[0, '#ffe9a8', 0.55], [1, '#ffe9a8', 0]]} /></defs>
        <Kaaba uid={uid} x={380} y={428} built={dua ? 1 : 0.62} />
        {dua && <Motes seed={64} n={20} x0={300} x1={520} y0={160} y1={330} color="#ffe9a8" r0={3} />}
        {dua && <circle cx={420} cy={290} r={150} fill={`url(#${uid}-kglow)`} className="sb-glow" />}
      </Layer>
      <Layer cam={cam} depth={1}>
        <Hill y={472} amp={5} seed={65} fill={dua ? '#7a5048' : '#d6a46e'} />
        {!dua && [[240, 470, 44, 22], [286, 474, 36, 20], [258, 452, 40, 20], [520, 476, 48, 22], [570, 470, 34, 18]].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y - h} width={w} height={h} rx={3} fill={i % 2 ? '#a38b74' : '#b8a088'} stroke="#6e5a4a" strokeWidth="1.5" />
        ))}
        <Palm x={190} y={500} h={150} lean={22} s={0.8} trunk={dua ? '#5a3a2e' : '#8a5a3b'} leaf={dua ? '#2e5a4a' : '#3f8a57'} leaf2={dua ? '#3a6a56' : '#56a86a'} />
        <Palm x={630} y={505} h={130} lean={-20} s={0.75} trunk={dua ? '#5a3a2e' : '#8a5a3b'} leaf={dua ? '#2e5a4a' : '#3f8a57'} leaf2={dua ? '#3a6a56' : '#56a86a'} sway={2} />
      </Layer>
    </g>
  )
}

// ── Musa: çaydakı səbət və yarılan dəniz ────────────────
function Reeds({ x0 = -60, x1 = 860, y = 470, seed = 1, fill = '#3f7a4a', head = '#7a5a2a', n = 16 }) {
  const out = []
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) / n) * i + ((i * 37 + seed * 13) % 23), h = 70 + ((i * 53 + seed * 7) % 60)
    out.push(
      <g key={i}>
        <path d={`M${x} ${y}Q${x + 4} ${y - h / 2} ${x + 2} ${y - h}`} stroke={fill} strokeWidth="4" fill="none" strokeLinecap="round" />
        {i % 3 === 0
          ? <g transform={`translate(${x + 2} ${y - h})`}>{[-50, -25, 0, 25, 50].map(a => <path key={a} d="M0 0l-4 -22l8 0Z" fill={fill} transform={`rotate(${a})`} />)}</g>
          : <ellipse cx={x + 2} cy={y - h + 8} rx={4} ry={12} fill={head} />}
      </g>
    )
  }
  return <g className="sb-wind sb-wind--2">{out}</g>
}

function Basket({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="sb-bob sb-bob--1">
        <ellipse cx={0} cy={10} rx={70} ry={10} fill="#0b2a3a" opacity=".25" />
        <path d="M-56 -14Q-60 10 -40 12H40Q60 10 56 -14Z" fill="#c8954f" />
        <path d="M-52 -4H52M-48 6H48" stroke="#9a6a32" strokeWidth="3" />
        {[-40, -24, -8, 8, 24, 40].map(bx => <path key={bx} d={`M${bx} -14v26`} stroke="#9a6a32" strokeWidth="2" opacity=".6" />)}
        <path d="M-50 -14Q-30 -30 0 -26Q30 -30 50 -14Z" fill="#f4ead2" />
        <path d="M-50 -14Q-20 -22 10 -16Q36 -20 50 -14" stroke="#d9c7a0" strokeWidth="2" fill="none" />
        <path d="M-58 -14H58" stroke="#e0ad66" strokeWidth="4" strokeLinecap="round" />
      </g>
    </g>
  )
}

function Ripples({ x, y }) {
  return (
    <g fill="none" stroke="#e6f6ff" strokeWidth="2" opacity=".55">
      <ellipse cx={x} cy={y} rx={90} ry={9} className="sb-tw sb-tw--1" />
      <ellipse cx={x} cy={y + 6} rx={130} ry={13} className="sb-tw sb-tw--2" />
    </g>
  )
}

function Palace({ x, y, s = 1, wall = '#e9d2a6', shade = '#c9a97a', accent = '#3a8a9a' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-150 0V-90L-120 -100H120L150 -90V0Z" fill={wall} />
      <path d="M-150 -90L-120 -100H120L150 -90Z" fill={shade} />
      <rect x={-160} y={-112} width={320} height={14} rx={3} fill={shade} />
      <rect x={-160} y={-112} width={320} height={4} fill={accent} />
      {[-110, -66, -22, 22, 66, 110].map(cx => (
        <g key={cx}>
          <rect x={cx - 9} y={-92} width={18} height={92} fill="#f5e4c0" />
          <path d={`M${cx - 15} -92Q${cx} -110 ${cx + 15} -92Z`} fill={accent} />
          <path d={`M${cx - 9} -70h18M${cx - 9} -24h18`} stroke={shade} strokeWidth="2" />
        </g>
      ))}
      <rect x={-170} y={-4} width={340} height={10} rx={3} fill={shade} />
      <rect x={-140} y={6} width={280} height={8} rx={3} fill="#d8bd8c" />
    </g>
  )
}

function WaterWall({ uid, side, pal }) {
  const id = `${uid}-ww${side}`
  const L = side === 'l'
  const d = L
    ? 'M-200 520V170Q-120 150 -40 170T120 168Q200 150 268 200Q300 300 292 520Z'
    : 'M1000 520V170Q920 150 840 170T680 168Q600 150 532 200Q500 300 508 520Z'
  const bub = L ? [[200, 260, 6], [230, 330, 4], [180, 400, 7], [240, 450, 5]] : [[600, 280, 5], [570, 350, 7], [620, 410, 4], [560, 460, 6]]
  return (
    <g>
      <defs><LG id={id} stops={[[0, '#7fd6e0'], [0.45, pal.a], [1, pal.b]]} /></defs>
      <path d={d} fill={`url(#${id})`} />
      <path d={L ? 'M-200 172Q-120 152 -40 172T120 170Q200 152 268 202' : 'M1000 172Q920 152 840 172T680 170Q600 152 532 202'} stroke="#effcff" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".85" />
      <path d={L ? 'M268 200Q300 300 292 520' : 'M532 200Q500 300 508 520'} stroke="#c9f2f6" strokeWidth="5" fill="none" opacity=".6" />
      {bub.map(([bx, by, r], i) => (
        <g key={i} transform={`translate(${bx} ${by})`}>
          <g className={`sb-float sb-float--${(i % 3) + 1}`}><circle r={r} fill="none" stroke="#e6fbff" strokeWidth="2" opacity=".6" /></g>
        </g>
      ))}
    </g>
  )
}

function Staff({ x, y, s = 1, uid }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><RG id={`${uid}-st`} stops={[[0, '#fff3c0', 0.85], [1, '#fff3c0', 0]]} /></defs>
      <ellipse cx={0} cy={-90} rx={70} ry={110} fill={`url(#${uid}-st)`} className="sb-glow" />
      <path d="M2 0V-170Q2 -196 -18 -196Q-34 -194 -30 -178" stroke="#7a4a26" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M5 -10V-160" stroke="#a8703f" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <ellipse cx={2} cy={2} rx={22} ry={5} fill="#000" opacity=".2" />
    </g>
  )
}

export function MusaScene({ uid, k, cam, pal }) {
  if (k === 'parted') {
    return (
      <g>
        <Sky uid={uid} time="dawn" glow="#fff0c4" glowY={300} glowA={0.85} />
        <Sun uid={uid} x={400} y={250} r={40} color="#ffe08a" halo="#fff6d6" />
        <Rays uid={uid} x={400} y={250} n={9} spread={150} len={420} opacity={0.3} />
        <Layer cam={cam} depth={0.4}>
          <defs><LG id={`${uid}-bed`} stops={[[0, '#f1d6a8'], [1, '#c99a66']]} /></defs>
          <path d="M330 260Q400 250 470 260L700 520H100Z" fill={`url(#${uid}-bed)`} />
          {[[380, 320], [430, 360], [350, 400], [470, 430], [300, 470], [520, 480]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={10 + i * 2} ry={5 + i} fill="#b48452" opacity=".6" />)}
        </Layer>
        <Layer cam={cam} depth={0.7}>
          <WaterWall uid={uid} side="l" pal={pal} />
          <WaterWall uid={uid} side="r" pal={pal} />
        </Layer>
        <Layer cam={cam} depth={1}>
          <Staff uid={uid} x={420} y={500} s={1} />
          <Motes seed={71} n={14} x0={340} x1={500} y0={300} y1={460} color="#fff6c8" />
        </Layer>
      </g>
    )
  }
  if (k === 'shore' || k === 'hope') {
    const hope = k === 'hope'
    return (
      <g>
        <Sky uid={uid} time={hope ? 'night' : 'storm'} glow={hope ? '#bfe0ff' : '#ffb07a'} glowA={hope ? 0.4 : 0.55} glowX={hope ? 520 : 160} />
        {hope && <Stars n={36} seed={73} y1={200} big={4} />}
        {hope && <Rays uid={uid} x={520} y={-60} n={5} spread={24} len={600} opacity={0.55} />}
        <Layer cam={cam} depth={0.15}>
          <Cloud x={170} y={70} s={1.4} fill={hope ? '#33406e' : '#6b5a6a'} shade={hope ? '#2a3560' : '#5a4a5a'} drift={1} />
          <Cloud x={700} y={60} s={1.2} fill={hope ? '#33406e' : '#5a5a72'} shade={hope ? '#2a3560' : '#4a4a62'} drift={2} />
        </Layer>
        <Layer cam={cam} depth={0.35}>
          <Waves y={300} amp={8} len={150} fill={hope ? '#2a5f8a' : '#3f6f86'} speed={3} />
        </Layer>
        {!hope && (
          <Layer cam={cam} depth={0.5}>
            {/* uzaqdan gələn toz buludu (ordu görünmür) */}
            {[[150, 300, 1.4], [240, 282, 1.15], [310, 302, 0.9]].map(([x, y, s], i) => <Cloud key={i} x={x} y={y} s={s} fill="#e3a874" shade="#c98a5a" opacity={0.85} drift={(i % 3) + 1} />)}
          </Layer>
        )}
        <Layer cam={cam} depth={0.7}>
          <Waves y={360} amp={14} len={170} fill={pal.a} speed={2} crest="#cfeef2" />
          <path d="M-200 520V420Q60 400 300 440Q360 452 380 520Z" fill={hope ? '#8a7a5a' : '#c79a62'} />
        </Layer>
        <Layer cam={cam} depth={1}>
          <Waves y={440} amp={16} len={200} fill={pal.b} speed={1} crest="#a8dbe6" />
          <path d="M-200 520V470Q40 456 220 490Q250 500 260 520Z" fill={hope ? '#6a5a40' : '#a87a48'} />
          {hope && <Staff uid={uid} x={250} y={500} s={0.75} />}
        </Layer>
      </g>
    )
  }
  // river / palace
  const night = k === 'river'
  return (
    <g>
      <Sky uid={uid} time={night ? 'dawn' : 'day'} glow={night ? '#ffd9b8' : '#fff7d6'} glowY={330} />
      {night && <Stars n={16} seed={75} y1={140} big={2} />}
      {night ? <Moon uid={uid} x={170} y={90} r={24} /> : <Sun uid={uid} x={660} y={90} r={34} />}
      <Layer cam={cam} depth={0.2}>
        {!night && <Cloud x={220} y={80} s={0.8} drift={1} />}
        <Hill y={300} amp={10} seed={77} fill={night ? '#a88ab0' : '#e7cf9c'} peaks={[{ x: 640, h: 40, w: 160 }]} />
        {!night && <g fill="#d9b27a" opacity=".8"><path d="M560 300L620 236L680 300Z" /><path d="M640 300L680 258L720 300Z" fill="#c9a06a" /></g>}
      </Layer>
      <Layer cam={cam} depth={0.4}>
        {k === 'palace' && <Palace x={430} y={330} s={0.95} />}
        <Palm x={210} y={336} h={120} lean={14} s={0.7} trunk="#8a5a3b" dates={null} />
        <Palm x={255} y={338} h={140} lean={-10} s={0.65} sway={2} trunk="#8a5a3b" />
        <Palm x={600} y={334} h={130} lean={16} s={0.7} sway={3} trunk="#8a5a3b" dates={null} />
      </Layer>
      <Layer cam={cam} depth={0.6}>
        <defs><LG id={`${uid}-riv`} stops={[[0, night ? '#9cb6d8' : '#8fd6e0'], [1, pal.a]]} /></defs>
        <rect x={-200} y={334} width={1200} height={200} fill={`url(#${uid}-riv)`} />
        {night && <ellipse cx={170} cy={360} rx={30} ry={6} fill="#fff2c2" opacity=".5" className="sb-tw sb-tw--1" />}
        <path d="M60 380h80M520 372h120M260 410h90" stroke="#effaff" strokeWidth="3" strokeLinecap="round" opacity=".55" className="sb-tw sb-tw--2" />
      </Layer>
      <Layer cam={cam} depth={0.85}>
        <Ripples x={night ? 400 : 330} y={k === 'palace' ? 412 : 430} />
        <Basket x={night ? 400 : 330} y={k === 'palace' ? 404 : 422} s={k === 'palace' ? 0.8 : 1} />
        {night && <Motes seed={79} n={10} x0={250} x1={560} y0={300} y1={400} color="#fff1a8" r0={2.2} />}
      </Layer>
      <Layer cam={cam} depth={1}>
        <Reeds seed={2} y={520} x0={-80} x1={180} n={7} />
        <Reeds seed={5} y={520} x0={620} x1={900} n={7} />
      </Layer>
    </g>
  )
}

// ── Yusif: on bir ulduz, quyu, Misir, karvan ────────────
export function YusufScene({ uid, k, cam }) {
  if (k === 'dream') {
    // On bir ulduz, günəş və ay — hamısı aşağıya, kiçik evə doğru əyilir
    const stars = []
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (1.08 + (0.84 * i) / 10)
      stars.push([400 + Math.cos(a) * 200, 330 + Math.sin(a) * 200, (a * 180) / Math.PI + 90])
    }
    return (
      <g>
        <Sky uid={uid} time="deepnight" glow="#7a6ad0" glowA={0.4} glowY={380} />
        <Stars n={60} seed={81} y1={300} big={3} color="#dfe6ff" />
        <Layer cam={cam} depth={0.25}>
          <Sun uid={uid} x={330} y={205} r={26} color="#ffcf5a" halo="#ffe9a8" />
          <Moon uid={uid} x={470} y={205} r={26} phase={0.5} tilt={60} />
          {stars.map(([x, y, rot], i) => (
            <g key={i} className={`sb-tw sb-tw--${(i % 3) + 1}`}><Star5 x={x} y={y} r={11} rot={rot} fill="#ffd76a" /></g>
          ))}
        </Layer>
        <Layer cam={cam} depth={0.55}>
          <Cloud x={130} y={380} s={1.3} fill="#5a5aa0" shade="#4a4a90" opacity={0.7} drift={1} />
          <Cloud x={680} y={390} s={1.2} fill="#5a5aa0" shade="#4a4a90" opacity={0.7} drift={2} />
          <Hill y={420} amp={8} seed={83} fill="#2a2d6a" />
        </Layer>
        <Layer cam={cam} depth={0.85}>
          <House x={360} y={444} w={80} h={56} wall="#4a4a8a" roof="#34347a" win="#ffd77a" />
          <Hill y={470} amp={5} seed={84} fill="#1c1f52" />
          <Palm x={290} y={480} h={110} lean={10} s={0.7} trunk="#262860" leaf="#2a2f70" leaf2="#33387e" dates={null} />
        </Layer>
      </g>
    )
  }
  if (k === 'tent') {
    return (
      <g>
        <Sky uid={uid} time="night" glow="#ffcf8a" glowA={0.3} glowY={400} />
        <Stars n={50} seed={85} y1={260} big={4} />
        <Moon uid={uid} x={300} y={90} r={22} />
        <Layer cam={cam} depth={0.25}>
          <Hill y={330} amp={14} seed={86} fill="#3a3a7a" />
        </Layer>
        <Layer cam={cam} depth={0.6}>
          <Hill y={410} amp={6} seed={87} fill="#5a4a78" />
          <g transform="translate(420 420)">
            <defs><RG id={`${uid}-tg`} stops={[[0, '#ffcf7a', 0.85], [1, '#ffcf7a', 0]]} /></defs>
            <ellipse cx={0} cy={-30} rx={190} ry={100} fill={`url(#${uid}-tg)`} className="sb-glow" />
            <path d="M-150 0L-110 -90Q-60 -110 0 -96Q60 -112 110 -90L150 0Z" fill="#7a4a3a" />
            <path d="M-110 -90Q-60 -110 0 -96Q60 -112 110 -90" stroke="#5a3428" strokeWidth="4" fill="none" />
            <path d="M-34 0L-20 -70H20L34 0Z" fill="#ffcf7a" />
            <path d="M-150 0L-110 -90M150 0L110 -90" stroke="#b07a5a" strokeWidth="5" />
            {[-120, -60, 60, 120].map(sx => <path key={sx} d={`M${sx} -30h12v6h-12Z`} fill="#d9a066" />)}
          </g>
          <Lantern uid={uid} x={545} y={380} s={0.6} />
        </Layer>
        <Layer cam={cam} depth={1}>
          <Hill y={474} amp={5} seed={88} fill="#2e2650" />
          <Palm x={225} y={500} h={170} lean={20} s={0.75} trunk="#3a2a4a" leaf="#2a3f5a" leaf2="#33506a" dates={null} />
        </Layer>
      </g>
    )
  }
  if (k === 'well') {
    return (
      <g>
        <Sky uid={uid} time="dusk" glow="#ffb38a" glowY={340} glowA={0.7} />
        <Stars n={14} seed={89} y1={120} big={2} />
        <Moon uid={uid} x={540} y={100} r={22} />
        <Layer cam={cam} depth={0.25}>
          <Hill y={340} amp={20} seed={90} fill="#c78a86" step={160} />
        </Layer>
        <Layer cam={cam} depth={0.55}>
          <Hill y={390} amp={18} seed={91} fill="#d9a07a" step={180} />
        </Layer>
        <Layer cam={cam} depth={0.8}>
          <Hill y={440} amp={10} seed={92} fill="#e7b98a" step={200} />
          {/* quyu */}
          <g transform="translate(400 452)">
            <ellipse cx={10} cy={6} rx={110} ry={14} fill="#000" opacity=".15" />
            <path d="M-80 -60V0Q0 18 80 0V-60Z" fill="#a8846a" />
            <StoneBlock x={-80} y={-60} w={160} h={60} fill="transparent" line="#6e5444" rows={3} />
            <ellipse cx={0} cy={-60} rx={80} ry={16} fill="#8a6a54" />
            <ellipse cx={0} cy={-58} rx={64} ry={11} fill="#1d1830" />
            <path d="M-70 -60V-170M70 -60V-170M-84 -168H84" stroke="#7a4a26" strokeWidth="9" strokeLinecap="round" />
            <path d="M0 -168V-104" stroke="#d9b88a" strokeWidth="3" />
            <path d="M-14 -104h28l-4 24h-20Z" fill="#9a6a3a" />
            <circle cx={0} cy={-168} r={9} fill="#5a3418" />
          </g>
        </Layer>
        <Layer cam={cam} depth={1}>
          <Hill y={482} amp={6} seed={93} fill="#d4a070" />
          <Grass seed={13} n={10} y={498} fill="#8a7a4a" h={18} />
        </Layer>
      </g>
    )
  }
  if (k === 'egypt') {
    return (
      <g>
        <Sky uid={uid} time="golden" glow="#fff3c8" glowY={320} glowA={0.75} />
        <Sun uid={uid} x={540} y={110} r={34} />
        <Layer cam={cam} depth={0.2}>
          <Cloud x={190} y={90} s={0.8} fill="#fff6e0" drift={1} />
          <g fill="#e2b778"><path d="M190 330L280 236L370 330Z" /><path d="M320 330L380 268L440 330Z" fill="#d6a868" /></g>
          <Hill y={330} amp={4} seed={94} fill="#e8c890" />
        </Layer>
        <Layer cam={cam} depth={0.45}>
          <rect x={-200} y={336} width={1200} height={26} fill="#5fb3c4" />
          <path d="M40 348h70M380 344h90M640 350h70" stroke="#e6fbff" strokeWidth="3" strokeLinecap="round" opacity=".6" className="sb-tw sb-tw--1" />
          {/* ambarlar */}
          {[[470, 1], [540, 1.2], [620, 1]].map(([x, s], i) => (
            <g key={i} transform={`translate(${x} 372) scale(${s})`}>
              <path d="M-28 0V-40Q-28 -78 0 -84Q28 -78 28 -40V0Z" fill="#f2dcae" />
              <path d="M-28 -40Q-28 -78 0 -84" stroke="#d9b884" strokeWidth="3" fill="none" />
              <rect x={-7} y={-24} width={14} height={24} rx={7} fill="#b5895a" />
            </g>
          ))}
          <Palm x={640} y={376} h={120} lean={-14} s={0.7} trunk="#8a5a3b" />
          <Palm x={400} y={372} h={100} lean={10} s={0.7} trunk="#8a5a3b" sway={2} dates={null} />
          <Hill y={372} amp={3} seed={95} fill="#a9c46a" />
        </Layer>
        <Layer cam={cam} depth={1}>
          <defs><LG id={`${uid}-wh`} stops={[[0, '#f6d26a'], [1, '#d9a23a']]} /></defs>
          <rect x={-200} y={400} width={1200} height={140} fill={`url(#${uid}-wh)`} />
          <g className="sb-wind sb-wind--1">
            {Array.from({ length: 34 }, (_, i) => {
              const x = -80 + i * 28, y = 440 + (i % 3) * 18
              return (
                <g key={i} transform={`translate(${x} ${y})`}>
                  <path d="M0 60V0" stroke="#c48a2a" strokeWidth="2.5" />
                  {[0, 1, 2, 3].map(j => <ellipse key={j} cx={j % 2 ? 4 : -4} cy={-4 - j * 8} rx={4} ry={7} fill="#e8b23a" transform={`rotate(${j % 2 ? 25 : -25} ${j % 2 ? 4 : -4} ${-4 - j * 8})`} />)}
                  <ellipse cx={0} cy={-38} rx={3.5} ry={7} fill="#e8b23a" />
                </g>
              )
            })}
          </g>
        </Layer>
      </g>
    )
  }
  // caravan — sübh, karvan gəlir, bağışlanma
  return (
    <g>
      <Sky uid={uid} time="dawn" glow="#ffe0b0" glowY={330} glowA={0.85} />
      <Sun uid={uid} x={420} y={310} r={56} color="#ffd27a" halo="#ffe9c0" />
      <Layer cam={cam} depth={0.2}>
        <Cloud x={160} y={110} s={0.8} fill="#ffd9d0" drift={1} />
        <Cloud x={660} y={80} s={0.7} fill="#ffe4d6" drift={2} opacity={0.8} />
      </Layer>
      <Layer cam={cam} depth={0.5}>
        <Hill y={360} amp={14} seed={96} fill="#d99a8a" step={180} />
        {/* qardaşların gəldiyi yol: çadırlar və fənərlər (canlı yoxdur) */}
        {[[250, 352, 0.8], [330, 346, 0.95], [560, 350, 0.75]].map(([x, y, sc], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${sc})`}>
            <path d="M-46 0L-30 -40Q0 -50 30 -40L46 0Z" fill={['#9a5a4a', '#b0694f', '#8a4e44'][i]} />
            <path d="M-10 0L-4 -30H4L10 0Z" fill="#ffd88a" />
          </g>
        ))}
        <Lantern uid={uid} x={440} y={326} s={0.45} />
      </Layer>
      <Layer cam={cam} depth={0.8}>
        <Hill y={440} amp={10} seed={97} fill="#e9b48a" step={200} />
        <path d="M420 380Q380 410 420 440T360 520" stroke="#f6d6b0" strokeWidth="22" fill="none" strokeLinecap="round" opacity=".8" />
        <Palm x={600} y={452} h={160} lean={-18} s={0.75} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Hill y={484} amp={6} seed={98} fill="#d99f72" />
        <Flowers seed={99} n={20} y0={470} y1={500} colors={['#ffffff', '#ffd36b', '#ff9db0']} />
        <Motes seed={100} n={10} x0={200} x1={620} y0={260} y1={420} color="#fff4c8" />
      </Layer>
    </g>
  )
}
