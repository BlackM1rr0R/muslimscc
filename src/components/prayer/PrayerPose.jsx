// ═══════════════════════════════════════════════════════
// Namaz mövqeləri — abstrakt sxem (öz çəkilmiş inline SVG, xarici şəkil yoxdur)
//
// Mənhəc qaydası: canlı təsviri yoxdur. Baş, üz və insan bədəni forması
// ÇƏKİLMİR (İbn Useymin: başı olmayan, şəxsləşdirilməmiş forma). Mövqe üç
// hissəli "duruş xətti" ilə (bel · bud · baldır — həndəsi bucaq), əllərin yeri
// sadə ovuc işarəsi ilə, yerə toxunan üzvlər isə nöqtələrlə göstərilir.
// Səcdədə yeddi üzv nöqtəsi: alın (burunla), iki əl, iki diz, iki ayağın
// barmaqları (Buxari 812, Muslim 490) — alın da yalnız nöqtədir.
//
// Animasiya: xəttin hissələri ayrıca <g>-dir, bucağı CSS `transform` ilə
// verilir; əl işarələri və nöqtələr də transform ilə yer dəyişir — mövqelər
// arası keçid yumşaqdır (yalnız transform/opacity; hərəkəti azaltma seçilibsə
// CSS keçidi söndürür). Salam — yuxarıdan baxış sxemi (xalça + qiblə + dönmə
// oxu), yan sxemlə arasında yalnız opacity keçidi olur.
// Rənglər yalnız CSS dəyişənləridir (PrayerGuidePage.css, .pp-svg).
//
// Bucaq qaydası (dərəcə, "mütləq"): bel üçün 0 = yuxarı, müsbət = irəli
// (qibləyə — sağa) əyilmə; bud/baldır üçün 0 = aşağı, müsbət = arxaya.
// ═══════════════════════════════════════════════════════

const BACK = 74  // omba → bel xəttinin ucu
const TH = 52    // bud
const SH = 50    // baldır
const GROUND = 214
const G = GROUND - 3 // duruş xəttinin yerə dəydiyi səviyyə
const GD = GROUND + 3 // yerə toxunan nöqtələrin səviyyəsi (xalçanın üzü)

// Əl işarəsi: [x, y, fırlanma] — biləyin yeri; 0° = barmaqlar yuxarı.
// Nöqtələr (7): alın, sağ əl, sol əl, sağ diz, sol diz, sağ ayaq, sol ayaq —
// [x, görünür]; hamısı xalçanın üzündədir (GD).
const UP = G - TH - SH // ayaq üstə omba hündürlüyü
const FEET = (x) => [[x, 0], [x, 0], [x, 0], [x, 0], [x, 0], [x + 4, 1], [x - 4, 1]]
const STAND = { hip: [120, UP], torso: 0, th: 0, sh: 0, dots: FEET(120) }
const SIT = { hip: [98, 192], torso: -2, th: -75.5, sh: 88 }
const SIT_DOTS = [[148, 0], [148, 0], [148, 0], [150, 1], [144, 1], [101, 1], [94, 1]]
const POSES = {
  // Niyyət — dik duruş, əllər yanda
  stand: { ...STAND, handN: [137, 104, 180], handF: [131, 101, 180], hands: 1 },
  // Təkbir — əllər çiyin/qulaq bərabərində qaldırılıb, ovuclar qibləyə
  takbir: { ...STAND, handN: [141, 68, 0], handF: [134, 64, 0], hands: 1, raise: 1 },
  // Qiyam — sağ əl sol əlin üstündə, sinə üzərində
  qiyam: { ...STAND, handN: [143, 66, -90], handF: [144, 73, -90], hands: 1 },
  // Rüku — bel üfüqi (90°), əllər dizlərdə
  ruku: { ...STAND, hip: [96, UP], torso: 90, handN: [105, 148, 180], handF: [101, 146, 180], hands: 1, angle: 1, dots: FEET(96) },
  // İtidal — rükudan qalxarkən əllər qaldırılır
  itidal: { ...STAND, handN: [141, 68, 0], handF: [134, 64, 0], hands: 1, raise: 1 },
  // Səcdə — yeddi üzv yerə toxunur (əl işarəsi gizlənir, əllər nöqtədir)
  sujud: {
    hip: [92, 157.5], torso: 130, th: -8, sh: 92,
    handN: [138, G - 4, 90], handF: [131, G - 4, 90], hands: 0, seven: 1,
    dots: [[156, 1], [138, 1], [129, 1], [102, 1], [94, 1], [50, 1], [42, 1]],
  },
  // İki səcdə arası oturuş — sol ayaq üstündə, əllər budlarda
  jalsa: { ...SIT, handN: [121, 193, 90], handF: [116, 189, 90], hands: 1, dots: SIT_DOTS },
  // Təşəhhüd — eyni oturuş, sağ əlin şəhadət barmağı işarə edir
  tashahhud: { ...SIT, handN: [121, 193, 90], handF: [116, 189, 90], hands: 1, finger: 1, dots: SIT_DOTS },
  // Son təşəhhüd (3–4 rükətli namazda) — təvərrük: oturaq yerdə, sol ayaq
  // sağ baldırın altından çıxır
  tawarruk: {
    hip: [98, 201], torso: -3, th: -85.6, sh: 88, finger: 1, seat: 1,
    handN: [121, 199, 90], handF: [116, 195, 90], hands: 1,
    dots: [[150, 0], [150, 0], [150, 0], [151, 1], [150, 0], [104, 1], [128, 1]],
  },
}

const SIDE_POSES = new Set(Object.keys(POSES))
export const POSE_NAMES = [...SIDE_POSES, 'salamR', 'salamL']

const tr = (x, y, deg = 0) => `translate(${x}px, ${y}px) rotate(${deg}deg)`

// Duruş xəttinin bir hissəsi: (0,0)→(0,len); iki qat — əsas zolaq + işıq xətti
function Bar({ len }) {
  return (
    <>
      <line x1="0" y1="0" x2="0" y2={len} className="pp-bar" strokeWidth="13" strokeLinecap="round" />
      <line x1="0" y1={Math.sign(len) * 4} x2="0" y2={len - Math.sign(len) * 4} className="pp-bar-hi" strokeWidth="2.4" strokeLinecap="round" />
    </>
  )
}

// Ovuc işarəsi (barmaqlar bitişik, sadə forma; 0° = barmaqlar yuxarı)
function Palm({ far, finger }) {
  return (
    <g className={far ? 'pp-palm pp-palm--far' : 'pp-palm'} transform="scale(1.3)">
      <path d="M -5 0 C -5.6 -8 -5.4 -15 -3.2 -19.4 C -2 -21.6 1 -21.6 1.6 -19.4 L 2.2 -16.4 C 3.4 -18 6 -17.4 6 -14.8 L 5.6 -6.8 C 7.2 -8.4 9.4 -7.2 8.8 -5 C 7.8 -1 5 2.2 2.2 3.2 L -3.2 3.2 C -4.4 2.6 -5 1.6 -5 0 Z" />
      {!far && (
        <g className={`pp-finger ${finger ? '' : 'is-hidden'}`}>
          <line x1="0" y1="-21" x2="0" y2="-31" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="0" cy="-35" r="2.2" />
        </g>
      )}
    </g>
  )
}

// Yan sxem (salamdan başqa bütün mövqelər)
function SideScheme({ p }) {
  const [hx, hy] = p.hip
  return (
    <g>
      {/* yerə toxunan üzvlər — nöqtələr */}
      {p.dots.map(([x, on], i) => (
        <g key={i} className="pp-j" style={{ transform: tr(x, GD) }}>
          <g className={`pp-dot ${on ? '' : 'is-hidden'} ${p.seven ? 'is-seven' : ''}`}>
            <circle r="7.5" className="pp-dot-ring" />
            <circle r="3.6" className="pp-dot-core" />
          </g>
        </g>
      ))}
      {/* təvərrük: oturaq yerdədir */}
      <g className="pp-j" style={{ transform: tr(hx, GD) }}>
        <rect x="-12" y="-2" width="24" height="4" rx="2" className={`pp-seat ${p.seat ? '' : 'is-hidden'}`} />
      </g>

      {/* duruş xətti: omba → bel; omba → bud → baldır */}
      <g className="pp-j" style={{ transform: tr(hx, hy) }}>
        <g className="pp-j" style={{ transform: tr(0, 0, p.th) }}>
          <Bar len={TH} />
          <g className="pp-j" style={{ transform: tr(0, TH, p.sh - p.th) }}>
            <Bar len={SH} />
          </g>
        </g>
        <g className="pp-j" style={{ transform: tr(0, 0, p.torso) }}>
          <Bar len={-BACK} />
        </g>
        {/* rüku: bel ilə ayaq arasında düz bucaq */}
        <path d="M 17 0 L 17 17 L 0 17" className={`pp-angle ${p.angle ? '' : 'is-hidden'}`} fill="none" strokeWidth="2" strokeLinejoin="round" />
      </g>

      {/* əllər */}
      <g className="pp-j" style={{ transform: tr(...p.handF) }}>
        <g className={`pp-hand ${p.hands ? '' : 'is-hidden'}`}><Palm far /></g>
      </g>
      <g className="pp-j" style={{ transform: tr(...p.handN) }}>
        <g className={`pp-hand ${p.hands ? '' : 'is-hidden'}`}><Palm finger={p.finger} /></g>
      </g>

      {/* təkbir/itidal: əllərin qaldırılması — yuxarı ox */}
      <g className={`pp-cue ${p.raise ? '' : 'is-hidden'}`}>
        <path d="M 162 96 L 162 56" className="pp-arrow" fill="none" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M 155.5 63 L 162 55.5 L 168.5 63" className="pp-arrow" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  )
}

// Namaz xalçası (perspektivdə) — qiblə tərəfində (sağda) mehrab tağı
function Rug() {
  return (
    <g className="pp-rug-g" aria-hidden="true">
      <path d={`M 34 ${GROUND - 4} L 206 ${GROUND - 4} L 222 ${GROUND + 12} L 18 ${GROUND + 12} Z`} className="pp-rug" />
      <path d={`M 42 ${GROUND - 1} L 199 ${GROUND - 1} L 210 ${GROUND + 9} L 30 ${GROUND + 9} Z`} className="pp-rug-line" fill="none" strokeWidth="1.2" />
      <path d={`M 176 ${GROUND + 9} L 176 ${GROUND + 3} Q 186 ${GROUND - 3} 196 ${GROUND + 3} L 198 ${GROUND + 9}`} className="pp-rug-line" fill="none" strokeWidth="1.2" />
      {[0, 1, 2, 3, 4, 5].map(i => (
        <line key={i} x1={20 + i * 1.6} y1={GROUND + 13 - i * 2.8} x2={14 + i * 1.6} y2={GROUND + 13 - i * 2.8} className="pp-rug-line" strokeWidth="1" />
      ))}
    </g>
  )
}

// Salam — yuxarıdan baxış: xalça, qiblə (yuxarı) və sağa/sola dönmə oxu.
// Namaz qılanın yeri yalnız "buradasınız" işarəsidir (bədən forması yoxdur).
function SalamScheme({ side }) {
  const R = side === 'R'
  const tip = R ? 182 : 58
  return (
    <g>
      {/* xalça yuxarıdan; mehrab tağı qiblə tərəfdə */}
      <rect x="82" y="66" width="76" height="140" rx="10" className="pp-rug" />
      <rect x="89" y="73" width="62" height="126" rx="6" className="pp-rug-line" fill="none" strokeWidth="1.2" />
      <path d="M 102 104 L 102 90 Q 120 70 138 90 L 138 104" className="pp-rug-line" fill="none" strokeWidth="1.2" />
      {/* qiblə istiqaməti — Kəbə işarəsi */}
      <rect x="111" y="30" width="18" height="18" rx="2.5" className="pp-qibla" />
      <line x1="111" y1="36" x2="129" y2="36" className="pp-qibla-band" strokeWidth="2.4" />
      <path d="M 120 132 L 120 56" className="pp-guide" fill="none" strokeWidth="1.6" strokeDasharray="3 5" strokeLinecap="round" />
      {/* buradasınız */}
      <circle cx="120" cy="150" r="11" className="pp-dot-ring" />
      <circle cx="120" cy="150" r="5" className="pp-dot-core" />
      {/* dönmə oxu */}
      <g className={`pp-turn pp-turn--${side}`}>
        <path d={`M 120 132 C 120 112 ${R ? 136 : 104} 104 ${tip} 104`} className="pp-arrow" fill="none" strokeWidth="3.2" strokeLinecap="round" />
        <path d={R ? `M ${tip - 9} 96 L ${tip + 1} 104 L ${tip - 9} 112` : `M ${tip + 9} 96 L ${tip - 1} 104 L ${tip + 9} 112`} className="pp-arrow" fill="none" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  )
}

/**
 * <PrayerPose pose="ruku" label="Rüku" />
 * pose: stand | takbir | qiyam | ruku | itidal | sujud | jalsa | tashahhud | tawarruk | salamR | salamL
 */
export default function PrayerPose({ pose = 'stand', label, className = '' }) {
  const front = pose === 'salamR' || pose === 'salamL'
  // Salamda yan sxem gizlənir, amma son oturuş mövqeyində qalır — geri qayıdanda keçid yumşaq olsun
  const p = POSES[front ? 'tashahhud' : pose] || POSES.stand
  return (
    <svg
      viewBox="0 0 240 240"
      className={`pp-svg ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
      data-pose={pose}
      focusable="false"
    >
      <circle cx="120" cy="124" r="100" className="pp-halo" />
      <g className={`pp-layer ${front ? 'is-hidden' : ''}`}>
        <Rug />
        <SideScheme p={p} />
      </g>
      <g className={`pp-layer ${front ? '' : 'is-hidden'}`}>
        <SalamScheme side={pose === 'salamL' ? 'L' : 'R'} />
      </g>
    </svg>
  )
}
