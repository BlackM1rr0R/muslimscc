// ═══════════════════════════════════════════════════════
// Surə atmosferi — oxuyucunun ARXASINDA çox zəif, yavaş fon səhnəsi (lazy chunk)
//
// Səhnə surənin adının hərfi mənasından gəlir: data/surahAtmosphere.js (yalnız təbiət / səma
// hadisələri, canlı varlıq yoxdur). Stillər: styles/QuranAtmos.css.
//
// Qaydalar:
//   • position: fixed, z-index -1 — bütün mətn öz qeyri-şəffaf kartının (başlıq da) üstündədir;
//     fon mətnin kontrastını dəyişmir (yoxlanılıb — QuranAtmos.css başlığı).
//   • Yalnız transform/opacity animasiyaları; hər hərəkət edən qat HTML/<svg> kökü (kompozitorda).
//   • Vərəq gizlənəndə (visibilitychange) və ya oxuyucu ekranda deyilsə (IntersectionObserver) —
//     data-paused → animation-play-state: paused. Ölçü oxunmur (layout məcbur edilmir).
//   • prefers-reduced-motion və html.a11y-reduce-motion — tam statik (eyni şəkil, hərəkətsiz).
//   • Ulduzların yeri sabit toxumla hesablanır — hər açılışda eyni səma.
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useRef } from 'react'
import { atmosSceneOf } from '../../data/surahAtmosphere'
import '../../styles/QuranAtmos.css'

// Sabit toxumlu PRNG (mulberry32) — ulduzlar hər dəfə eyni yerdə
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r1 = (x) => Math.round(x * 10) / 10

/** Üç sayrışma qrupu üçün ulduzlar (viewBox 0 0 160 100; yuxarı hissədə sıx) */
function starField(seed, count, maxY = 70) {
  const rand = rng(seed)
  const groups = [[], [], []]
  for (let i = 0; i < count; i++) {
    const y = Math.pow(rand(), 1.4) * maxY
    groups[i % 3].push({ x: r1(rand() * 160), y: r1(y), r: r1(0.18 + rand() * rand() * 0.55) })
  }
  return groups
}

// Bürclər (ən-Nəcm, əl-Buruc): əl ilə qurulmuş həndəsi naxışlar (real bürc xəritəsi iddiası yoxdur)
const CONSTELLATIONS = {
  53: [
    [[18, 20], [27, 14], [36, 18], [44, 12], [52, 22]],
    [[112, 16], [121, 26], [133, 22], [141, 31], [128, 38]],
  ],
  85: [
    [[14, 30], [24, 22], [34, 27], [30, 38], [20, 40], [14, 30]],
    [[70, 12], [80, 18], [90, 14], [98, 22]],
    [[118, 34], [128, 26], [140, 28], [146, 18], [138, 12]],
  ],
}

function Stars({ seed, count, maxY, className = '' }) {
  const groups = starField(seed, count, maxY)
  return groups.map((g, gi) => (
    <svg key={gi} className={`qa-stars qa-stars--${gi} ${className}`} viewBox="0 0 160 100" preserveAspectRatio="xMidYMin slice" focusable="false">
      {g.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} />)}
    </svg>
  ))
}

function Constellation({ n }) {
  const lines = CONSTELLATIONS[n] || CONSTELLATIONS[53]
  return (
    <svg className="qa-const" viewBox="0 0 160 100" preserveAspectRatio="xMidYMin slice" focusable="false">
      {lines.map((pts, i) => (
        <g key={i}>
          <polyline points={pts.map(p => p.join(',')).join(' ')} />
          {pts.map(([x, y], j) => <circle key={j} cx={x} cy={y} r={j % 2 ? 0.55 : 0.75} />)}
        </g>
      ))}
    </svg>
  )
}

function Scene({ scene, n, uid }) {
  switch (scene) {
    case 'dawn':
      return (
        <>
          <div className="qa-sky" />
          <Stars seed={89} count={36} maxY={45} className="qa-fadeout" />
          <div className="qa-glow qa-glow--horizon qa-rise" />
          <div className="qa-horizon" />
        </>
      )
    case 'daybreak':
      return (
        <>
          <div className="qa-sky" />
          <div className="qa-glow qa-glow--horizon qa-rise" />
          <div className="qa-split" />
        </>
      )
    case 'night':
      return (
        <>
          <div className="qa-sky" />
          <Stars seed={n * 7 + 3} count={66} maxY={85} />
          <div className="qa-glow qa-glow--low" />
        </>
      )
    case 'stars':
      return (
        <>
          <div className="qa-sky" />
          <Stars seed={n * 11} count={48} maxY={80} />
          <Constellation n={n} />
        </>
      )
    case 'piercing':
      return (
        <>
          <div className="qa-sky" />
          <Stars seed={86} count={24} maxY={70} className="qa-dim" />
          <div className="qa-pierce">
            <svg viewBox="-50 -50 100 100" focusable="false">
              <path className="qa-pierce__rays" d="M0-48L1.6-1.6 48 0 1.6 1.6 0 48-1.6 1.6-48 0-1.6-1.6z" />
              <circle className="qa-pierce__core" r="3.2" />
            </svg>
          </div>
        </>
      )
    case 'moon':
      return (
        <>
          <div className="qa-sky" />
          <Stars seed={54} count={30} maxY={75} className="qa-dim" />
          <div className="qa-glow qa-glow--moon" />
          <svg className="qa-moon" viewBox="0 0 100 100" focusable="false">
            <defs>
              <mask id={`${uid}m`}>
                <rect width="100" height="100" fill="#fff" />
                <circle cx="66" cy="40" r="36" fill="#000" />
              </mask>
            </defs>
            <circle cx="50" cy="50" r="40" mask={`url(#${uid}m)`} />
          </svg>
        </>
      )
    case 'sun':
    case 'duha':
      return (
        <>
          <div className="qa-sky" />
          <div className="qa-rays" />
          <div className="qa-glow qa-glow--sun" />
        </>
      )
    case 'rain':
      return (
        <>
          <div className="qa-sky" />
          <div className="qa-flash" />
          <div className="qa-rain qa-rain--far" />
          <div className="qa-rain qa-rain--near" />
        </>
      )
    case 'cave':
      return (
        <>
          <div className="qa-sky" />
          <div className="qa-glow qa-glow--cave" />
          <svg className="qa-cave" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" focusable="false">
            <path className="qa-cave__rock" fillRule="evenodd"
              d="M0 200V118C48 96 96 70 150 76C180 44 226 42 252 70C304 62 352 88 400 108V200ZM158 200C158 146 178 112 204 112C230 112 250 146 250 200Z" />
          </svg>
        </>
      )
    case 'mountain':
      return (
        <>
          <div className="qa-sky" />
          <div className="qa-haze" />
          <svg className="qa-mount" viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" focusable="false">
            <path className="qa-mount__far" d="M0 160V112L46 92 80 104 128 70 168 96 214 58 262 94 300 80 350 102 400 88V160Z" />
            <path className="qa-mount__near" d="M0 160V132L60 118 104 126 170 92 206 110 236 100 296 128 352 120 400 134V160Z" />
          </svg>
        </>
      )
    case 'wind':
      return (
        <>
          <div className="qa-sky" />
          {[0, 1, 2, 3, 4].map(i => (
            <svg key={i} className={`qa-wind qa-wind--${i}`} viewBox="0 0 200 20" preserveAspectRatio="none" focusable="false">
              <path d="M0 12C40 4 70 18 110 10S170 4 200 9" />
            </svg>
          ))}
        </>
      )
    case 'light':
      return (
        <>
          <div className="qa-sky" />
          <div className="qa-beams" />
          <div className="qa-glow qa-glow--nur" />
        </>
      )
    case 'mist':
      return (
        <>
          <div className="qa-sky" />
          <div className="qa-mist qa-mist--0" />
          <div className="qa-mist qa-mist--1" />
          <div className="qa-mist qa-mist--2" />
        </>
      )
    default:
      return null
  }
}

export default function SurahAtmosphere({ n }) {
  const ref = useRef(null)
  const uid = useId().replace(/:/g, '')
  const scene = atmosSceneOf(n)

  // Fasilə: vərəq gizli və ya oxuyucu (valideyn) ekranda deyil — atributla, React render-siz
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    let hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden'
    let off = false
    const apply = () => { if (hidden || off) el.setAttribute('data-paused', ''); else el.removeAttribute('data-paused') }
    const onVis = () => { hidden = document.visibilityState === 'hidden'; apply() }
    document.addEventListener('visibilitychange', onVis)
    const host = el.parentElement
    let io = null
    if (host && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((es) => { off = !es[es.length - 1].isIntersecting; apply() })
      io.observe(host)
    }
    apply()
    return () => { document.removeEventListener('visibilitychange', onVis); io?.disconnect() }
  }, [scene])

  if (!scene) return null
  return (
    <div ref={ref} className={`qa-atmos qa-atmos--${scene}`} data-scene={scene} data-testid="surah-atmos" aria-hidden="true">
      <Scene scene={scene} n={Number(n)} uid={uid} />
    </div>
  )
}
