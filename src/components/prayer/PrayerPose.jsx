// ═══════════════════════════════════════════════════════
// Namaz mövqeləri — öz çəkilmiş inline SVG (xarici şəkil yoxdur)
//
// Fiqur "oynaqlı" qurulub: omba → gövdə → çiyin → qol → biləyin, omba → bud →
// baldır → ayaq. Hər oynaq ayrıca <g>-dir və bucağı CSS `transform` ilə verilir
// — mövqe dəyişəndə brauzer bucaqları yumşaq keçirir (yalnız transform; hərəkəti
// azaltma seçilibsə CSS keçidi söndürür). Salam önden görünüşdür — yan fiqurla
// arasında yalnız opacity keçidi olur.
//
// İslami ədəbə uyğun: üz cizgisi YOXDUR (baş sadə formadır). Kişi — uzun köynək
// (thobe) və araqçın; qadın — başı, boynu və çiyinləri örtən ximar, uzun paltar,
// ayaqlar örtülü. Rənglər yalnız CSS dəyişənləridir (PrayerGuidePage.css,
// .pp-svg) — işıqlı/qaranlıq rejimə avtomatik uyğunlaşır.
//
// Bucaq qaydası (dərəcə, "mütləq"): əza üçün 0 = aşağı, müsbət = arxaya (fiqur
// sağa — qibləyə baxır); gövdə üçün 0 = yuxarı, müsbət = irəli əyilmə.
// ═══════════════════════════════════════════════════════

const UA = 32   // çiyin → dirsək
const FA = 30   // dirsək → bilək
const TH = 44   // bud
const SH = 42   // baldır
const FT = 16   // ayaq
const TO = 56   // omba → çiyin
const GROUND = 214

// Mövqelər (mütləq bucaqlar). s/fs — qol hissəsinin "dərinliyə" getdiyi üçün
// qısalması (yan görünüşdə proyeksiya).
const POSES = {
  stand: {
    hip: [118, GROUND - 3 - TH - SH], torso: 0, head: 0,
    armN: -5, faN: -9, armF: 3, faF: -2,
    thN: -1, shN: -1, ftN: -90, thF: 3, shF: 3, ftF: -90,
  },
  takbir: {
    hip: [118, GROUND - 3 - TH - SH], torso: 0, head: 0,
    armN: -40, faN: -170, armF: -34, faF: -166,
    thN: -1, shN: -1, ftN: -90, thF: 3, shF: 3, ftF: -90, palms: true,
  },
  qiyam: {
    hip: [118, GROUND - 3 - TH - SH], torso: 0, head: 6,
    armN: -10, faN: -154, fsN: 0.72, armF: -4, faF: -150, fsF: 0.62,
    thN: -1, shN: -1, ftN: -90, thF: 3, shF: 3, ftF: -90,
  },
  ruku: {
    hip: [88, GROUND - 3 - TH - SH], torso: 89, head: 1,
    armN: 52, faN: 54, armF: 49, faF: 51,
    thN: 0, shN: 0, ftN: -90, thF: 3, shF: 3, ftF: -90,
  },
  itidal: {
    hip: [118, GROUND - 3 - TH - SH], torso: 0, head: 0,
    armN: -40, faN: -170, armF: -34, faF: -166,
    thN: -1, shN: -1, ftN: -90, thF: 3, shF: 3, ftF: -90, palms: true,
  },
  sujud: {
    hip: [96, 166], torso: 113, head: 30,
    armN: 47, faN: -58, usN: 0.5, fsN: 0.72, armF: 40, faF: -52, usF: 0.42, fsF: 0.66,
    thN: -8, shN: 96, ftN: -32, thF: -5, shF: 95, ftF: -28, handFlat: true,
  },
  jalsa: {
    hip: [100, 188], torso: -2, head: 4,
    armN: -32, faN: -46, armF: -28, faF: -42,
    thN: -80, shN: 102, ftN: -14, thF: -82, shF: 89, ftF: 92,
  },
  tashahhud: {
    hip: [100, 188], torso: -2, head: 6,
    armN: -32, faN: -46, armF: -28, faF: -42,
    thN: -80, shN: 102, ftN: -14, thF: -82, shF: 89, ftF: 92, finger: true,
  },
  // Son təşəhhüd (3–4 rükətli namazda) — təvərrük: omba yerdə, sol ayaq sağ baldırın altından çıxır
  tawarruk: {
    hip: [98, 196], torso: -3, head: 6,
    armN: -34, faN: -50, armF: -30, faF: -46,
    thN: -82, shN: 100, ftN: -14, thF: -86, shF: 88, ftF: -90, finger: true,
  },
}

const SIDE_POSES = new Set(Object.keys(POSES))
export const POSE_NAMES = [...SIDE_POSES, 'salamR', 'salamL']

// Bucaq/yerdəyişməni CSS transform sətrinə çevirir
const tr = (x, y, deg = 0, sy = 1) =>
  `translate(${x}px, ${y}px) rotate(${deg}deg)${sy !== 1 ? ` scale(1, ${sy})` : ''}`

// Seqment: yuxarıdan aşağı (0,0)→(0,len) kapsul. k — proyeksiya qısalması
// (yalnız xəttin özünə tətbiq olunur, uşaq oynaqlara keçmir — əyilmə olmasın)
function Seg({ len, w, cls, k = 1 }) {
  return (
    <line
      x1="0" y1="0" x2="0" y2={len}
      className={`${cls} pp-seg`}
      strokeWidth={w}
      strokeLinecap="round"
      style={{ transform: `scale(1, ${k})` }}
    />
  )
}

// Bir qol: çiyin oynağının içində çəkilir. Bucaqlar nisbi verilir.
function Arm({ rel, relFa, us = 1, fs = 1, far, finger, palms, handFlat, female }) {
  const sleeve = far ? 'pp-garment-far' : 'pp-garment'
  const skin = far ? 'pp-skin-far' : 'pp-skin'
  return (
    <g className="pp-j" style={{ transform: tr(0, 0, rel) }}>
      <Seg len={UA} k={us} w={female ? 15 : 14} cls={sleeve} />
      <g className="pp-j" style={{ transform: tr(0, UA * us, relFa) }}>
        <Seg len={FA} k={fs} w={female ? 13 : 12} cls={sleeve} />
        {/* əl — biləkdən sonra; ovuc qiyamda yuxarı (qibləyə), səcdədə yerə düz */}
        <g className="pp-j" style={{ transform: tr(0, FA * fs + 2) }}>
          {handFlat
            ? <ellipse cx="0" cy="2" rx="4.4" ry="6.6" className={skin} />
            : <rect x="-4" y="-1" width="8" height={palms ? 12 : 11} rx="4" className={skin} />}
          {finger && !far && <line x1="0" y1="8" x2="0" y2="16" className="pp-skin-line" strokeWidth="2.6" strokeLinecap="round" />}
        </g>
      </g>
    </g>
  )
}

function Leg({ rel, relSh, relFt, far, female }) {
  const cloth = far ? 'pp-garment-far' : 'pp-garment'
  // Qadında ayaq örtülüdür (corab/paltar), kişidə açıq
  const foot = female ? (far ? 'pp-sock-far' : 'pp-sock') : (far ? 'pp-skin-far' : 'pp-skin')
  return (
    <g className="pp-j" style={{ transform: tr(0, 0, rel) }}>
      <Seg len={TH} w={female ? 30 : 27} cls={cloth} />
      <g className="pp-j" style={{ transform: tr(0, TH, relSh) }}>
        <Seg len={SH} w={female ? 26 : 22} cls={cloth} />
        <g className="pp-j" style={{ transform: tr(0, SH, relFt) }}>
          <Seg len={FT} w="9" cls={foot} />
        </g>
      </g>
    </g>
  )
}

// Yan görünüşlü fiqur (bütün mövqelər salamdan başqa)
function SideFigure({ p, female }) {
  const t = p.torso
  return (
    <g className="pp-j" style={{ transform: tr(p.hip[0], p.hip[1]) }}>
      {/* arxa əzalar (solğun) */}
      <Leg rel={p.thF} relSh={p.shF - p.thF} relFt={p.ftF - p.shF} far female={female} />
      <g className="pp-j" style={{ transform: tr(0, 0, t) }}>
        <g className="pp-j" style={{ transform: tr(0, -TO + 6) }}>
          <Arm rel={p.armF - t} relFa={p.faF - p.armF} us={p.usF} fs={p.fsF} far palms={p.palms} handFlat={p.handFlat} female={female} />
        </g>
        {/* gövdə: thobe / uzun paltar (yuvarlaq uclar çiyni və ombanı formalaşdırır) */}
        <line x1="0" y1="-6" x2="0" y2={-TO + 17} className="pp-garment" strokeWidth={female ? 40 : 37} strokeLinecap="round" />
        {/* bel qatı — gövdəyə həcm verir */}
        <line x1="-10" y1="-22" x2="12" y2="-22" className="pp-fold" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* ön ayaq gövdənin önündə */}
      <Leg rel={p.thN} relSh={p.shN - p.thN} relFt={p.ftN - p.shN} female={female} />
      <g className="pp-j" style={{ transform: tr(0, 0, t) }}>
        {/* baş + boyun — üz cizgisi yoxdur */}
        <g className="pp-j" style={{ transform: tr(0, -TO + 1, p.head) }}>
          {female ? (
            <>
              {/* ximar: başı, boynu, çiyinləri örtür; üz yeri — cizgisiz açıq oval */}
              <path d="M -19 8 C -22 -10 -18 -37 1 -37 C 20 -37 23 -12 19 8 C 12 13 -12 13 -19 8 Z" className="pp-khimar" />
              <ellipse cx="9" cy="-20" rx="6.2" ry="8.6" className="pp-skin" />
            </>
          ) : (
            <>
              <line x1="0" y1="2" x2="0" y2="-10" className="pp-skin" strokeWidth="11" strokeLinecap="round" />
              <circle cx="1.5" cy="-21" r="13.2" className="pp-skin" />
              {/* araqçın */}
              <path d="M -11.6 -24 A 13.2 13.2 0 0 1 14.6 -24.6 C 6 -27.6 -4 -27.6 -11.6 -24 Z" className="pp-cap" />
            </>
          )}
        </g>
        <g className="pp-j" style={{ transform: tr(0, -TO + 6) }}>
          <Arm rel={p.armN - t} relFa={p.faN - p.armN} us={p.usN} fs={p.fsN} finger={p.finger} palms={p.palms} handFlat={p.handFlat} female={female} />
        </g>
        {female && (
          // ximarın çiyinlərə düşən hissəsi qolun yuxarısını örtür
          <path d={`M -21 ${-TO + 2} C -24 ${-TO + 24} -16 ${-TO + 38} 1 ${-TO + 40} C 16 ${-TO + 38} 23 ${-TO + 24} 20 ${-TO + 2} C 10 ${-TO - 4} -10 ${-TO - 4} -21 ${-TO + 2} Z`} className="pp-khimar" />
        )}
      </g>
    </g>
  )
}

// Salam — önden, oturuş; baş sağa/sola çevrilir (yalnız baş yerini dəyişir)
function FrontFigure({ side, female }) {
  const dx = side === 'R' ? 7 : -7
  return (
    <g>
      {/* qatlanmış ayaqlar — enli əsas */}
      <path d="M 66 206 C 70 186 92 178 120 178 C 148 178 170 186 174 206 C 160 212 80 212 66 206 Z" className="pp-garment-far" />
      {/* gövdə */}
      <path d="M 96 120 C 104 114 136 114 144 120 L 152 192 C 136 198 104 198 88 192 Z" className="pp-garment" />
      {/* qollar və dizdə əllər */}
      <path d="M 98 124 C 88 140 86 162 90 186" className="pp-garment" strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M 142 124 C 152 140 154 162 150 186" className="pp-garment" strokeWidth="13" strokeLinecap="round" fill="none" />
      <ellipse cx="91" cy="192" rx="7" ry="5.5" className="pp-skin" />
      <ellipse cx="149" cy="192" rx="7" ry="5.5" className="pp-skin" />
      <g className="pp-j" style={{ transform: `translate(${dx}px, 0px)` }}>
        {female ? (
          <>
            <path d="M 98 132 C 94 108 100 76 120 76 C 140 76 146 108 142 132 C 130 140 110 140 98 132 Z" className="pp-khimar" />
            <ellipse cx={120 + dx * 0.9} cy="100" rx="9" ry="12" className="pp-skin" />
          </>
        ) : (
          <>
            <rect x="113" y="104" width="14" height="14" rx="6" className="pp-skin" />
            <ellipse cx="120" cy="94" rx="15" ry="17" className="pp-skin" />
            <path d="M 105 90 C 106 76 134 76 135 90 C 126 86 114 86 105 90 Z" className="pp-cap" />
          </>
        )}
      </g>
      {/* başın döndüyü tərəf — qövs ox */}
      <g className={`pp-turn pp-turn--${side}`}>
        <path d={side === 'R' ? 'M 150 78 C 162 82 168 92 168 104' : 'M 90 78 C 78 82 72 92 72 104'} className="pp-arrow" fill="none" strokeWidth="2.6" strokeLinecap="round" />
        <path d={side === 'R' ? 'M 162 100 L 168 108 L 173 99' : 'M 67 99 L 72 108 L 78 100'} className="pp-arrow" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
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

/**
 * <PrayerPose pose="ruku" gender="m|f" label="Rüku" />
 * pose: stand | takbir | qiyam | ruku | itidal | sujud | jalsa | tashahhud | tawarruk | salamR | salamL
 */
export default function PrayerPose({ pose = 'stand', gender = 'm', label, className = '' }) {
  const female = gender === 'f'
  const front = pose === 'salamR' || pose === 'salamL'
  // Salamda yan fiqur gizlənir, amma son oturuş mövqeyində qalır — geri qayıdanda keçid yumşaq olsun
  const p = POSES[front ? 'tashahhud' : pose] || POSES.stand
  return (
    <svg
      viewBox="0 0 240 240"
      className={`pp-svg ${female ? 'pp-svg--f' : 'pp-svg--m'} ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
      data-pose={pose}
      focusable="false"
    >
      <circle cx="120" cy="124" r="100" className="pp-halo" />
      <Rug />
      <g className={`pp-layer ${front ? 'is-hidden' : ''}`}>
        <SideFigure p={p} female={female} />
      </g>
      <g className={`pp-layer ${front ? '' : 'is-hidden'}`}>
        <FrontFigure side={pose === 'salamL' ? 'L' : 'R'} female={female} />
      </g>
    </svg>
  )
}
