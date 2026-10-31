// ═══════════════════════════════════════════════════════
// Dəstəmaz təsvirləri — PrayerPose ilə eyni üslub (eyni rəng dəyişənləri,
// halo, yumşaq formalar). Hər səhnə 240×240; səhnə dəyişəndə yumşaq görünür
// (CSS: .wp-scene). Su — --pp-water.
//
// Mənhəc qaydası: canlı təsviri yoxdur — baş, üz, bədən çəkilmir. Yalnız
// əllər (sadə ovuc işarəsi), su, qab və sxematik kontur (qol — dirsəyə qədər,
// ayaq — topuğa qədər). Yuyulan/məsh olunan yer söz nişanı ilə göstərilir
// ("Üz", "Baş" …) — nişanlar 5 dildədir; ekran oxuyucusu üçün isə SVG-nin
// aria-label-i (addımın adı) kifayətdir.
// ═══════════════════════════════════════════════════════
import { useLang } from '../../contexts/LangContext'

// Söz nişanları (yalnız təsvirin içində; mətnin özü prayerGuide.js-dədir)
const WORDS = {
  // lang-ok: "Ağız · burun" az və tr dillərində eyni yazılır
  mouth: { az: 'Ağız · burun', en: 'Mouth · nose', ru: 'Рот · нос', tr: 'Ağız · burun', ar: 'الفم · الأنف' },
  face: { az: 'Üz', en: 'Face', ru: 'Лицо', tr: 'Yüz', ar: 'الوجه' },
  elbow: { az: 'Dirsək', en: 'Elbow', ru: 'Локоть', tr: 'Dirsek', ar: 'المرفق' },
  // lang-ok: "Baş" az və tr dillərində eyni yazılır
  head: { az: 'Baş', en: 'Head', ru: 'Голова', tr: 'Baş', ar: 'الرأس' },
  ears: { az: 'Qulaqlar', en: 'Ears', ru: 'Уши', tr: 'Kulaklar', ar: 'الأذنان' },
  ankle: { az: 'Topuq', en: 'Ankle', ru: 'Щиколотка', tr: 'Topuk', ar: 'الكعبان' },
}

// Ovuc — barmaqlar bitişik, sadə forma (x,y — biləyin ortası; rot — dərəcə)
function Hand({ x, y, rot = 0, flip = false, far = false }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -1 : 1} 1)`} className={far ? 'pp-palm pp-palm--far' : 'pp-palm'}>
      <path d="M -9 0 C -10 -14 -9 -28 -5 -36 C -3 -40 2 -40 3 -36 L 4 -30 C 6 -33 11 -32 11 -27 L 10 -12 C 13 -15 17 -13 16 -9 C 14 -2 9 4 4 6 L -6 6 C -8 5 -9 3 -9 0 Z" />
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

// Söz nişanı — yuyulan/məsh olunan yerin adı (bədən forması əvəzinə)
function Chip({ x, y, text, lang, big = false }) {
  const fs = big ? 22 : 17
  const w = Math.max(big ? 84 : 60, Math.round(text.length * fs * 0.56) + (big ? 40 : 28))
  const h = big ? 46 : 34
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} className="pp-chip" />
      <text y={fs * 0.36} textAnchor="middle" className="pp-chip-text" style={{ fontSize: fs }} direction={lang === 'ar' ? 'rtl' : 'ltr'}>{text}</text>
    </g>
  )
}

function scenes(w, lang) {
  return {
    jug: (
      <g>
        {/* ibrik */}
        <path d="M 70 92 C 66 104 62 120 62 140 C 62 164 76 176 96 176 C 116 176 130 164 130 140 C 130 120 126 104 122 92 Z" className="pp-vessel" />
        <rect x="74" y="80" width="44" height="14" rx="6" className="pp-vessel-far" />
        <path d="M 128 112 C 146 104 156 92 166 80" className="pp-vessel-stroke" strokeWidth="9" strokeLinecap="round" />
        <path d="M 64 108 C 46 112 46 146 64 150" className="pp-vessel-stroke" strokeWidth="7" strokeLinecap="round" opacity="0.7" />
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
        <Hand x={136} y={168} rot={18} flip far />
        <Hand x={104} y={168} rot={-18} />
        <Drop x={90} y={120} /><Drop x={152} y={116} s={0.8} /><Drop x={120} y={196} s={0.9} />
        <text x="120" y="226" textAnchor="middle" className="pp-count">× 3</text>
      </g>
    ),
    mouth: (
      <g>
        <Chip x={120} y={62} text={w.mouth} lang={lang} />
        {/* sağ ovucda su — ağıza və buruna aparılır */}
        <Hand x={112} y={182} rot={-62} />
        <Drop x={118} y={150} s={0.9} /><Drop x={130} y={156} s={0.7} />
        <Arrow d="M 142 140 C 160 120 160 100 140 86" head="M 150 88 L 140 86 L 143 96" />
        <text x="196" y="190" textAnchor="middle" className="pp-count">× 3</text>
      </g>
    ),
    face: (
      <g>
        {/* yuyulan sahə — sözlü nişan (üz təsviri yoxdur) */}
        <rect x="70" y="70" width="100" height="100" rx="26" className="pp-guide" fill="none" strokeWidth="1.8" strokeDasharray="4 6" />
        <Chip x={120} y={120} text={w.face} lang={lang} big />
        <Hand x={50} y={160} rot={20} />
        <Hand x={190} y={160} rot={-20} flip />
        <Drop x={92} y={60} s={0.8} /><Drop x={148} y={56} s={0.7} /><Drop x={120} y={46} s={0.9} />
        <text x="120" y="210" textAnchor="middle" className="pp-count">× 3</text>
      </g>
    ),
    arms: (
      <g>
        {/* qolun sxematik konturu: barmaqlardan dirsəyə */}
        <path d="M 62 122 L 166 116 C 176 116 182 124 182 132 C 182 140 176 148 166 148 L 62 142 Z" className="pp-limb" />
        <Hand x={64} y={132} rot={-90} />
        <circle cx="172" cy="132" r="13" className="pp-ring" fill="none" strokeWidth="2.4" />
        <Chip x={172} y={78} text={w.elbow} lang={lang} />
        <path d="M 172 95 L 172 117" className="pp-guide" fill="none" strokeWidth="1.6" strokeDasharray="3 4" />
        <Stream x={110} y1={40} y2={114} />
        <Drop x={84} y={162} s={0.8} /><Drop x={126} y={164} s={0.9} />
        <Arrow d="M 34 180 L 168 180" head="M 160 173 L 168 180 L 160 187" />
        <text x="120" y="216" textAnchor="middle" className="pp-count">× 3</text>
      </g>
    ),
    head: (
      <g>
        <Chip x={120} y={168} text={w.head} lang={lang} big />
        {/* iki ovuc öndən arxaya, sonra geri — bir dəfə */}
        <Hand x={100} y={100} rot={-168} />
        <Hand x={140} y={100} rot={168} flip />
        <Arrow d="M 72 64 C 96 40 144 40 168 64" head="M 160 58 L 168 64 L 164 72" />
        <Arrow d="M 168 76 C 144 56 96 56 72 76" head="M 80 70 L 72 76 L 76 84" />
      </g>
    ),
    ears: (
      <g>
        <Chip x={120} y={120} text={w.ears} lang={lang} big />
        {/* hər iki tərəfdə — şəhadət barmağı içəridən, baş barmaq arxadan */}
        <circle cx="38" cy="120" r="12" className="pp-ring" fill="none" strokeWidth="2.4" />
        <circle cx="202" cy="120" r="12" className="pp-ring" fill="none" strokeWidth="2.4" />
        <Hand x={46} y={188} rot={8} />
        <Hand x={194} y={188} rot={-8} flip />
        <Arrow d="M 38 150 L 38 138" head="M 32 144 L 38 137 L 44 144" />
        <Arrow d="M 202 150 L 202 138" head="M 196 144 L 202 137 L 208 144" />
      </g>
    ),
    feet: (
      <g>
        {/* ayağın sxematik konturu (yandan): barmaqlar sağda, topuq solda */}
        <path d="M 74 118 L 104 118 L 110 154 C 138 156 168 160 182 168 C 190 174 186 186 176 186 L 76 186 C 66 186 64 176 66 166 Z" className="pp-limb" />
        <circle cx="102" cy="160" r="11" className="pp-ring" fill="none" strokeWidth="2.4" />
        <Chip x={72} y={78} text={w.ankle} lang={lang} />
        <path d="M 90 95 L 99 148" className="pp-guide" fill="none" strokeWidth="1.6" strokeDasharray="3 4" />
        <Stream x={150} y1={58} y2={152} />
        <Drop x={130} y={146} s={0.8} /><Drop x={168} y={150} s={0.7} />
        <Arrow d="M 186 204 L 78 204" head="M 86 197 L 78 204 L 86 211" />
        <text x="196" y="96" textAnchor="middle" className="pp-count">× 3</text>
      </g>
    ),
  }
}

export const WUDU_SCENES = ['jug', 'hands', 'mouth', 'face', 'arms', 'head', 'ears', 'feet']

export default function WuduPose({ pose, label, className = '' }) {
  const { lang } = useLang() || {}
  const l = WORDS.face[lang] ? lang : 'en'
  const w = Object.fromEntries(Object.entries(WORDS).map(([k, v]) => [k, v[l]]))
  const all = scenes(w, l)
  return (
    <svg viewBox="0 0 240 240" className={`pp-svg wp-svg ${className}`} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'} data-pose={pose} focusable="false">
      <circle cx="120" cy="124" r="100" className="pp-halo" />
      <g key={pose} className="wp-scene">{all[pose] || all.hands}</g>
    </svg>
  )
}
