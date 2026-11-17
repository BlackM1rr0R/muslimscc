// ═══════════════════════════════════════════════════════
// Hekayə kitabı səhnələri I — Adəm (bağ), Nuh (gəmi), İbrahim (sərin od)
// Hər səhnə: ({ uid, k, cam, pal }) — k: books.js-dəki addımın açarı.
// Canlı təsviri (insan, heyvan, quş, balıq, həşərat) YOXDUR — yalnız təbiət, bitki, əşya, rəmz.
// ═══════════════════════════════════════════════════════
import {
  Sky, Layer, Hill, Stars, Sparkle, Moon, Sun, Cloud, Waves, Tree, Flowers, Grass,
  Lantern, Rain, Rays, Motes, House, Ship, LG, RG,
} from './kit'

// ── Adəm: Cənnət bağı ───────────────────────────────────
// "Adlar" — ağacın ətrafında üzən qızılı kürələrdə kiçik rəmzlər (yarpaq, damla,
// ulduz, günəş, ay, çiçək); "işıq" — yuxarıdan nur şüaları; "bağ" — çay və
// tək qadağan ağac; "axşam" — bənövşəyi alaqaranlıq, düşən yarpaqlar;
// "sübh" — tövbədən sonra açılan sübh və çiçəklər.
const GLYPHS = {
  leaf: <path d="M-7 6Q-8 -8 8 -9Q8 6 -7 6ZM-7 6L4 -4" fill="#2f7a4f" stroke="#2f7a4f" strokeWidth="1.2" />,
  drop: <path d="M0 -9Q7 0 6 4A6 6 0 0 1 -6 4Q-7 0 0 -9Z" fill="#3a8fd0" />,
  star: <path d="M0 -9L2.6 -3H9L4 1L6 8L0 4L-6 8L-4 1L-9 -3H-2.6Z" fill="#e7a51c" />,
  sun: <g fill="#f0a020"><circle r={4.5} />{[0, 45, 90, 135, 180, 225, 270, 315].map(a => <rect key={a} x={-1.2} y={-10} width={2.4} height={3.6} rx={1.2} transform={`rotate(${a})`} />)}</g>,
  moon: <path d="M3 -8A8.5 8.5 0 1 0 3 8A7 7 0 0 1 3 -8Z" fill="#7a6bc4" />,
  flower: <g fill="#ef7f98">{[0, 72, 144, 216, 288].map(a => <ellipse key={a} cy={-4} rx={2.6} ry={4} transform={`rotate(${a})`} />)}<circle r={2.4} fill="#ffc23a" /></g>,
}

function Orb({ x, y, g, i }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={`sb-float sb-float--${(i % 3) + 1}`}>
        <circle r={22} fill="#fff7dc" opacity=".35" />
        <circle r={16} fill="#fffaf0" stroke="#f2c65a" strokeWidth="2.5" />
        {GLYPHS[g]}
      </g>
    </g>
  )
}

export function AdamScene({ uid, k, cam, pal }) {
  const time = k === 'dusk' ? 'dusk' : k === 'dawn' ? 'dawn' : k === 'light' ? 'golden' : 'morning'
  const night = k === 'dusk'
  const g1 = night ? '#4a5a7a' : '#7cc38a', g2 = night ? '#34466a' : '#4fa36c', g3 = night ? '#26365a' : pal.a
  return (
    <g>
      <Sky uid={uid} time={time} glow={k === 'dusk' ? '#ffb38a' : '#fff3c8'} glowY={k === 'dawn' ? 330 : 300} />
      {night && <Stars n={30} seed={21} y1={180} big={3} />}
      {night && <Moon uid={uid} x={640} y={80} r={26} />}
      {k === 'dawn' && <Sun uid={uid} x={560} y={330} r={46} color="#ffd27a" halo="#ffe2b0" />}
      {k === 'light' && <Rays uid={uid} x={400} y={-60} n={9} spread={80} opacity={0.65} />}
      <Layer cam={cam} depth={0.15}>
        {!night && <Cloud x={170} y={90} s={0.9} drift={1} />}
        {!night && <Cloud x={620} y={60} s={0.7} drift={2} opacity={0.75} />}
        <Hill y={300} amp={20} seed={2} fill={night ? '#5a6a9a' : '#bfe3c4'} opacity={0.9} peaks={[{ x: 120, h: 50, w: 160 }, { x: 700, h: 60, w: 180 }]} />
      </Layer>
      <Layer cam={cam} depth={0.35}>
        <Hill y={345} amp={16} seed={4} fill={g1} />
        <Tree x={215} y={352} s={0.55} c1="#4e9a63" c2="#62b276" c3="#86cc90" fruit={night ? null : '#ffb3a1'} />
        <Tree x={600} y={354} s={0.62} c1="#4e9a63" c2="#62b276" c3="#86cc90" fruit={night ? null : '#ffd36b'} />
      </Layer>
      {(k === 'garden' || k === 'names' || k === 'dawn') && (
        <Layer cam={cam} depth={0.5}>
          <defs><LG id={`${uid}-river`} stops={[[0, '#bfeaf2'], [1, '#6cc3d8']]} /></defs>
          <path d="M330 362Q420 380 380 410Q330 450 470 520L620 520Q470 452 520 412Q560 380 470 362Z" fill={`url(#${uid}-river)`} opacity=".95" />
          <path d="M392 392q30 6 50 0M420 440q36 8 64 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" fill="none" className="sb-tw sb-tw--2" />
        </Layer>
      )}
      <Layer cam={cam} depth={0.7}>
        <Hill y={420} amp={10} seed={6} fill={g2} />
        {/* Ortadakı böyük ağac — "adlar" və qadağan ağac */}
        <g transform="translate(400 430)">
          <defs><RG id={`${uid}-halo`} stops={[[0, k === 'dusk' ? '#c9b6ff' : '#fff6c8', 0.75], [1, '#fff6c8', 0]]} /></defs>
          <circle cx={0} cy={-150} r={k === 'garden' ? 170 : 150} fill={`url(#${uid}-halo)`} className="sb-glow" />
          <Tree x={0} y={0} s={k === 'garden' || k === 'dusk' ? 1.6 : 1.4} trunk="#7a5236" c1={night ? '#2d4a5e' : '#2f8a57'} c2={night ? '#3a5c70' : '#43a368'} c3={night ? '#4f7286' : '#6cc485'} fruit={k === 'dusk' ? '#c98aa8' : '#ffcf5a'} sway={1} />
        </g>
        {k === 'names' && ['leaf', 'drop', 'star', 'sun', 'moon', 'flower'].map((g, i) => {
          const a = (-165 + i * 30) * Math.PI / 180
          return <Orb key={g} g={g} i={i} x={Math.round(400 + Math.cos(a) * 185)} y={Math.round(250 + Math.sin(a) * 160)} />
        })}
        {k === 'light' && <Motes seed={3} n={22} x0={180} x1={620} y0={160} y1={420} />}
        {k === 'dusk' && [[300, 200], [470, 240], [540, 180], [260, 300]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${i * 50})`}>
            <g className={`sb-float sb-float--${(i % 3) + 1}`}><path d="M-8 4Q-9 -8 8 -8Q8 4 -8 4Z" fill={i % 2 ? '#c98a5a' : '#a3b56a'} /></g>
          </g>
        ))}
      </Layer>
      <Layer cam={cam} depth={1}>
        <Hill y={478} amp={8} seed={8} fill={g3} />
        <Grass seed={4} y={492} fill={night ? '#1f2d4a' : '#2f7a4f'} />
        {!night && <Flowers seed={k === 'dawn' ? 31 : 9} n={k === 'dawn' ? 30 : 18} colors={['#ff9db0', '#ffd36b', '#ffffff', pal.d]} cls={k === 'dawn' ? 'sb-pop' : undefined} />}
        {k === 'dawn' && <Motes seed={17} n={12} x0={100} x1={700} y0={300} y1={460} color="#fffbe0" />}
      </Layer>
    </g>
  )
}

// ── Nuh: böyük gəmi ─────────────────────────────────────
export function NuhScene({ uid, k, cam, pal }) {
  const stormy = k === 'flood' || k === 'mountain' || k === 'storm'
  const time = k === 'village' ? 'dusk' : k === 'build' ? 'day' : k === 'judi' ? 'golden' : 'storm'
  const seaY = k === 'flood' ? 400 : k === 'judi' ? 470 : 360
  return (
    <g>
      <Sky uid={uid} time={time} glow={k === 'judi' ? '#fff0c4' : stormy ? '#c6d6dd' : '#ffd9a8'} glowA={stormy ? 0.3 : 0.6} />
      {k === 'judi' && <Sun uid={uid} x={540} y={130} r={40} color="#ffd06a" halo="#fff2c6" />}
      {k === 'build' && <Sun uid={uid} x={640} y={90} r={36} />}
      {k === 'village' && <Moon uid={uid} x={640} y={80} r={22} />}
      {k === 'village' && <Stars n={18} seed={4} y1={150} big={2} />}
      <Layer cam={cam} depth={0.12}>
        {stormy
          ? <>
              <Cloud x={120} y={60} s={1.5} fill="#56687a" shade="#475a6c" drift={1} />
              <Cloud x={420} y={40} s={1.8} fill="#4a5c6f" shade="#3d4e60" drift={2} />
              <Cloud x={700} y={70} s={1.4} fill="#56687a" shade="#475a6c" drift={3} />
            </>
          : <>
              <Cloud x={180} y={80} s={0.9} fill={k === 'village' ? '#f3b6b0' : '#fff'} drift={1} />
              <Cloud x={560} y={120} s={0.6} fill={k === 'village' ? '#e9a0a8' : '#fff'} opacity={0.7} drift={2} />
            </>}
      </Layer>
      {k === 'storm' && (
        <g className="sb-tw sb-tw--3">
          <path d="M520 40L490 120L516 118L480 210L550 100L522 104L550 40Z" fill="#fff6c8" opacity=".9" />
        </g>
      )}
      {(k === 'village' || k === 'build') && (
        <>
          <Layer cam={cam} depth={0.3}>
            <Hill y={300} amp={22} seed={12} fill={k === 'village' ? '#8a6aa0' : '#9cc9a8'} peaks={[{ x: 650, h: 90, w: 140 }]} />
          </Layer>
          <Layer cam={cam} depth={0.55}>
            <Hill y={360} amp={12} seed={13} fill={k === 'village' ? '#6b5a8c' : '#6fb07c'} />
            {k === 'village' && [[200, 372], [270, 366], [340, 376], [470, 368], [545, 374]].map(([x, y], i) => (
              <House key={i} x={x} y={y} w={56 + (i % 2) * 14} h={40 + (i % 3) * 6} wall="#d9b48c" roof="#9c6c4c" />
            ))}
          </Layer>
          <Layer cam={cam} depth={0.8}>
            <Hill y={430} amp={8} seed={14} fill={k === 'village' ? '#4a4372' : '#4f9a63'} />
            {k === 'build' && (
              <g>
                <Ship uid={uid} x={400} y={392} s={1.15} lamp={false} />
                {/* taxtalar */}
                <g transform="translate(130 440)"><rect x={0} y={-12} width={120} height={12} rx={6} fill="#a8703f" /><rect x={14} y={-24} width={110} height={12} rx={6} fill="#c08550" /><rect x={6} y={-36} width={100} height={12} rx={6} fill="#9a6538" /></g>
                <g transform="translate(600 446)"><rect x={0} y={-12} width={90} height={12} rx={6} fill="#c08550" /><rect x={10} y={-24} width={70} height={12} rx={6} fill="#a8703f" /></g>
              </g>
            )}
            {k === 'village' && <Lantern uid={uid} x={420} y={330} s={0.8} />}
          </Layer>
          <Layer cam={cam} depth={1}>
            <Grass seed={7} y={500} fill={k === 'village' ? '#2e2a52' : '#2f7a4f'} h={26} />
            {k === 'build' && <Flowers seed={5} n={10} y0={460} />}
          </Layer>
        </>
      )}
      {(stormy || k === 'judi') && (
        <>
          <Layer cam={cam} depth={0.3}>
            {k === 'mountain' && <Hill y={330} amp={8} seed={18} fill="#5c6f73" peaks={[{ x: 520, h: 200, w: 110 }]} />}
            {k === 'judi' && <Hill y={360} amp={10} seed={19} fill="#93b08f" peaks={[{ x: 380, h: 150, w: 150 }, { x: 720, h: 60, w: 120 }]} />}
            <Waves y={seaY - 30} amp={8} len={160} fill={k === 'judi' ? '#7cc3c4' : '#3d6f7d'} speed={3} opacity={0.9} />
          </Layer>
          {k === 'judi' && (
            <Layer cam={cam} depth={0.45}>
              <Hill y={420} amp={6} seed={22} fill="#6e9a6a" peaks={[{ x: 380, h: 120, w: 170 }]} />
              <Ship uid={uid} x={380} y={300} s={0.9} />
              {/* yumşaq göy qurşağı (canlı deyil) */}
              <g fill="none" strokeWidth="9" opacity=".32">{['#ff8a8a', '#ffd36b', '#8fd88a', '#7ab8ff'].map((c, i) => <path key={c} d={`M${150 + i * 9} 330A${250 - i * 9} ${210 - i * 9} 0 0 1 ${650 - i * 9} 330`} stroke={c} />)}</g>
            </Layer>
          )}
          <Layer cam={cam} depth={0.65}>
            <Waves y={seaY} amp={k === 'storm' ? 22 : 14} len={k === 'storm' ? 200 : 150} fill={k === 'judi' ? '#4fa6ad' : pal.a} speed={2} crest="#d9f1f2" />
            {stormy && <Ship uid={uid} x={k === 'mountain' ? 340 : 400} y={seaY + 6} s={k === 'storm' ? 1.1 : 1} />}
          </Layer>
          <Layer cam={cam} depth={1}>
            <Waves y={seaY + 70} amp={k === 'storm' ? 26 : 16} len={k === 'storm' ? 230 : 170} fill={k === 'judi' ? '#3a8f98' : pal.b} speed={1} crest="#bfe4e6" />
          </Layer>
          {stormy && <Rain seed={k === 'storm' ? 3 : 9} n={k === 'storm' ? 90 : 60} />}
        </>
      )}
    </g>
  )
}

// ── İbrahim: daşlar və sərin od ─────────────────────────
// Bütlər — üzsüz, üst-üstə qoyulmuş daş formalar (kub, kürə, piramida);
// qırılanda yerə səpələnmiş daş parçaları. Heç bir canlı forması yoxdur.
const STONE = ['#9a96b4', '#8a86a6', '#a7a3c0']
function StoneStack({ x, y, s = 1, v = 0 }) {
  const c = (i) => STONE[(i + v) % 3]
  // hamısı həndəsi: pilləli daş sütunlar (yumru "baş" yoxdur — insana bənzəməsin)
  const tops = [
    <path key="t" d="M-18 -96L0 -124L18 -96Z" fill={c(2)} />,
    <path key="t" d="M-22 -96H22L14 -108H-14Z" fill={c(2)} />,
    <path key="t" d="M-12 -96V-112L0 -120L12 -112V-96Z" fill={c(2)} />,
  ]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={40} ry={6} fill="#000" opacity=".25" />
      <rect x={-34} y={-22} width={68} height={22} rx={3} fill={c(0)} />
      <rect x={-26} y={-44} width={52} height={22} rx={3} fill={c(1)} />
      <rect x={-18} y={-96} width={36} height={52} rx={3} fill={c(0)} />
      <path d="M6 -96H18V-44H6ZM14 -44H26V-22H14ZM20 -22H34V0H20Z" fill="#000" opacity=".14" />
      <path d="M-18 -70H18M-18 -78H18" stroke="#000" strokeOpacity=".15" strokeWidth="2" />
      {tops[v % 3]}
      <path d="M-32 -20H-12M-16 -92V-50" stroke="#d6d3ec" strokeWidth="2" opacity=".5" strokeLinecap="round" />
    </g>
  )
}

function Rubble({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={44} ry={6} fill="#000" opacity=".22" />
      <path d="M-40 0L-34 -18L-16 -22L-10 0Z" fill={STONE[0]} />
      <circle cx={6} cy={-11} r={11} fill={STONE[1]} />
      <path d="M14 0L22 -16L36 -10L40 0Z" fill={STONE[2]} />
      <path d="M-14 0L-6 -8L2 0Z" fill={STONE[1]} />
    </g>
  )
}

function Flame({ x, y, s = 1, c1, c2, c3, i = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={`sb-flick sb-flick--${(i % 3) + 1}`}>
        <path d="M0 0C-46 0 -58 -40 -38 -78C-30 -60 -20 -58 -18 -66C-22 -100 -2 -130 14 -150C10 -118 30 -104 40 -80C48 -96 50 -100 48 -110C70 -80 66 -10 0 0Z" fill={c1} />
        <path d="M0 0C-30 0 -38 -30 -24 -54C-18 -42 -10 -42 -8 -50C-10 -76 4 -96 14 -108C12 -84 28 -70 30 -52C34 -60 36 -64 36 -70C48 -46 40 -4 0 0Z" fill={c2} />
        <path d="M0 0C-14 0 -18 -16 -10 -30C-6 -24 -2 -24 0 -30C0 -44 8 -54 12 -60C12 -46 22 -36 20 -24C22 -10 14 0 0 0Z" fill={c3} />
      </g>
    </g>
  )
}

function Rose({ x, y, s = 1, c = '#f27a98', c2 = '#ffb0c2' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 4Q-3 26 2 46" stroke="#3d8a4f" strokeWidth="3" fill="none" />
      <path d="M1 28q14 -12 24 -5q-11 12 -24 5Z" fill="#4fa36c" />
      <path d="M0 20q-14 -10 -22 -2q10 10 22 2Z" fill="#3f8a57" />
      <path d="M-15 2Q-18 -12 -6 -14Q0 -20 6 -14Q18 -12 15 2Q12 14 0 14Q-12 14 -15 2Z" fill={c} />
      <path d="M-9 -2Q-10 -10 -2 -11Q8 -12 9 -3Q8 6 0 7Q-8 6 -9 -2Z" fill={c2} />
      <path d="M-4 -4Q0 -9 4 -4Q2 0 -2 -1" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M-15 2Q-8 10 0 9Q8 10 15 2" stroke="#000" strokeOpacity=".12" strokeWidth="2" fill="none" />
    </g>
  )
}

export function IbrahimScene({ uid, k, cam, pal }) {
  const fire = k === 'fire', cool = k === 'cool'
  const time = cool ? 'dawn' : 'night'
  return (
    <g>
      <Sky uid={uid} time={time} glow={fire ? '#ff7a3d' : cool ? '#ffe3ef' : '#6e7cc8'} glowA={fire ? 0.75 : 0.45} glowY={360} />
      {!fire && <Stars n={cool ? 12 : 46} seed={6} big={cool ? 1 : 5} />}
      {!fire && !cool && <Moon uid={uid} x={540} y={86} r={28} />}
      <Layer cam={cam} depth={0.2}>
        <Hill y={330} amp={18} seed={31} fill={fire ? '#5a2a3a' : cool ? '#c8a7c8' : '#2e3a78'} peaks={[{ x: 140, h: 60, w: 120 }, { x: 690, h: 80, w: 140 }]} />
      </Layer>
      {(k === 'stones' || k === 'broken' || k === 'silent') && (
        <>
          <Layer cam={cam} depth={0.5}>
            {/* uzaqda şəhər */}
            {[[150, 330], [210, 336], [560, 334], [620, 328]].map(([hx, hy], i) => (
              <House key={i} x={hx} y={hy} w={46 + (i % 2) * 12} h={30 + (i % 3) * 6} wall="#3a4486" roof="#2e3878" win="#ffcf7a" />
            ))}
            <Hill y={412} amp={4} seed={33} fill="#262f66" />
          </Layer>
          <Layer cam={cam} depth={0.8}>
            {k === 'stones' && [[250, 0.8, 1], [325, 0.9, 2], [400, 1.25, 0], [475, 0.9, 1], [550, 0.8, 2]].map(([x, sc, v], i) => (
              <StoneStack key={i} x={x} y={442} s={sc} v={v} />
            ))}
            {k !== 'stones' && (
              <>
                {[[255, 0.9], [335, 0.8], [470, 0.85], [550, 0.95]].map(([x, sc], i) => <Rubble key={i} x={x} y={444} s={sc} />)}
                <StoneStack x={400} y={442} s={1.25} v={0} />
              </>
            )}
            {k === 'silent' && <g opacity=".85"><Sparkle x={460} y={250} s={9} cls="sb-tw sb-tw--1" /><Sparkle x={340} y={230} s={7} cls="sb-tw sb-tw--2" /></g>}
          </Layer>
          <Layer cam={cam} depth={1}>
            <Hill y={470} amp={6} seed={35} fill="#1b2152" />
            <Grass seed={5} y={496} fill="#141a3d" sway={0} />
          </Layer>
        </>
      )}
      {(fire || cool) && (
        <>
          <Layer cam={cam} depth={0.45}>
            <Hill y={400} amp={8} seed={37} fill={fire ? '#3e1d2c' : '#a98bb8'} />
          </Layer>
          <Layer cam={cam} depth={0.75}>
            <defs><RG id={`${uid}-fg`} stops={[[0, fire ? '#ffd27a' : '#e6fbff', 0.9], [1, fire ? '#ff6a2a' : '#bfe9ff', 0]]} /></defs>
            <ellipse cx={400} cy={380} rx={300} ry={190} fill={`url(#${uid}-fg)`} className="sb-glow" />
            {fire && [[400, 440, 1.6, 0], [300, 452, 1.1, 1], [505, 450, 1.2, 2], [230, 466, 0.8, 1], [575, 468, 0.85, 0]].map(([x, y, s, i], j) => (
              <Flame key={j} x={x} y={y} s={s} i={i} c1="#ff6a2a" c2="#ffa23a" c3="#ffe18a" />
            ))}
            {fire && <Motes seed={41} n={22} x0={220} x1={580} y0={180} y1={420} color="#ffcf6a" r0={3} />}
            {cool && [[400, 440, 1.5, 0], [300, 452, 1.05, 1], [505, 450, 1.15, 2]].map(([x, y, s, i], j) => (
              <g key={j} opacity=".55"><Flame x={x} y={y} s={s} i={i} c1="#a9e4ff" c2="#d6f4ff" c3="#ffffff" /></g>
            ))}
            {cool && [[330, 430, 1.2], [400, 410, 1.5], [470, 432, 1.25], [260, 452, 1], [540, 452, 1.05], [365, 460, 0.9], [440, 462, 0.95]].map(([x, y, s], i) => (
              <Rose key={i} x={x} y={y} s={s} c={i % 2 ? pal.d : '#f27a98'} />
            ))}
          </Layer>
          <Layer cam={cam} depth={1}>
            <Hill y={478} amp={6} seed={39} fill={fire ? '#2a1420' : '#6aa877'} />
            {cool && <Flowers seed={19} n={26} colors={['#ffffff', '#ffd1dc', '#bfe6ff', '#ffe58a']} />}
            {cool && <Grass seed={21} y={500} fill="#3f8a57" />}
            {cool && <Motes seed={43} n={14} x0={200} x1={600} y0={200} y1={420} color="#ffffff" />}
          </Layer>
        </>
      )}
    </g>
  )
}
