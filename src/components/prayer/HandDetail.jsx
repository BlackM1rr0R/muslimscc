// ═══════════════════════════════════════════════════════
// Əllərin yaxın planı — hər namaz mövqeyində əllər necə tutulur, harada durur
//
// Ümumi sxemin (PrayerPose) yanında iri, aydın təsvir: ovuc, barmaqlar, baş
// barmaq; qolun sxematik qolluğu, diz/bud konturu, yer. Baş, üz, bədən
// çəkilmir (PrayerPose ilə eyni qayda). "Sağ/Sol" nişanları güzgü
// çaşqınlığını aradan qaldırır.
//
// Hər təsvirin altında qısa izah (5 dil) və yalnız dəqiq bilinən dəlil:
//   təkbir     — ovuclar çiyin/qulaq ucu bərabərində: Buxari 735, Müslim 391
//   qiyam      — sağ əl sol əlin (biləyin, qolun) üstündə, sinədə:
//                Buxari 740, İbn Xuzeymə 479
//   rüku       — ovuclar dizləri tutur: Buxari 828
//   səcdə      — yeddi üzv: Buxari 812; ovuclar yerdə, dirsəklər qalxıq:
//                Müslim 494; qollar yanlardan aralı: Buxari 807
//   təşəhhüd   — sol ovuc sol budda, sağ əlin barmaqları yığılıb, şəhadət
//                barmağı ilə işarə: Müslim 580
//   salam      — əllər budlarda qalır, əllə işarə edilmir: Müslim 431
// Rənglər: PrayerGuidePage.css (.hd-*, --pp-*).
// ═══════════════════════════════════════════════════════
import { Hand } from './handShape'
import Icon from '../Icon'
import { refText, refUrl } from '../../data/prayerGuide'

const WORDS = {
  // lang-ok: "Sağ" az və tr dillərində eyni yazılır
  R: { az: 'Sağ', en: 'Right', ru: 'Правая', ar: 'اليمنى', tr: 'Sağ' },
  // lang-ok: "Sol" az və tr dillərində eyni yazılır
  L: { az: 'Sol', en: 'Left', ru: 'Левая', ar: 'اليسرى', tr: 'Sol' },
  chest: { az: 'Sinə', en: 'Chest', ru: 'Грудь', ar: 'الصدر', tr: 'Göğüs' },
  qibla: { az: 'Qiblə', en: 'Qibla', ru: 'Кибла', ar: 'القبلة', tr: 'Kıble' },
  // lang-ok: "Alın · burun" az və tr dillərində eyni yazılır
  brow: { az: 'Alın · burun', en: 'Forehead · nose', ru: 'Лоб · нос', ar: 'الجبهة · الأنف', tr: 'Alın · burun' },
}

const VIEW = {
  front: { az: 'Öndən görünüş', en: 'Front view', ru: 'Вид спереди', ar: 'منظر من الأمام', tr: 'Önden görünüm' },
  top: { az: 'Yuxarıdan görünüş', en: 'View from above', ru: 'Вид сверху', ar: 'منظر من الأعلى', tr: 'Yukarıdan görünüm' },
}

export const HAND_TEXT = {
  title: { az: 'Əllər', en: 'Hands', ru: 'Руки', ar: 'اليدان', tr: 'Eller' },
  takbir: {
    az: 'Əllər çiyin və ya qulaq ucları bərabərinə qaldırılır, ovuclar qibləyə, barmaqlar yuxarı.',
    en: 'Hands raised to the shoulders or the earlobes, palms toward the Qibla, fingers pointing up.',
    ru: 'Руки подняты до плеч или мочек ушей, ладони к кибле, пальцы вверх.',
    ar: 'تُرفع اليدان حذو المنكبين أو فروع الأذنين، والكفّان إلى القبلة، والأصابع إلى أعلى.',
    tr: 'Eller omuz veya kulak memesi hizasına kaldırılır, avuçlar kıbleye, parmaklar yukarı.',
  },
  itidal: {
    az: 'Rükudan qalxarkən əllər yenə çiyin bərabərinə qaldırılır.',
    en: 'When rising from ruku‘, the hands are raised again to shoulder level.',
    ru: 'Поднимаясь из поясного поклона, руки снова поднимают до уровня плеч.',
    ar: 'عند الرفع من الركوع تُرفع اليدان حذو المنكبين.',
    tr: 'Rükûdan kalkarken eller yine omuz hizasına kaldırılır.',
  },
  qiyam: {
    az: 'Sağ əl sol əlin üstündə — sol biləyi və qolu tutur, sinə üzərində.',
    en: 'Right hand over the left — holding the left wrist and forearm — on the chest.',
    ru: 'Правая рука поверх левой — на левом запястье и предплечье — на груди.',
    ar: 'اليد اليمنى على اليسرى — على الرسغ والساعد — على الصدر.',
    tr: 'Sağ el sol elin üstünde — sol bileği ve kolu tutar — göğüs üzerinde.',
  },
  ruku: {
    az: 'Ovuclar dizləri möhkəm tutur, barmaqlar aralı; bel düz.',
    en: 'Palms grip the knees firmly, fingers spread; the back is straight.',
    ru: 'Ладони крепко обхватывают колени, пальцы расставлены; спина прямая.',
    ar: 'الكفّان ممكَّنتان من الركبتين، والأصابع مفرَّجة، والظهر مستوٍ.',
    tr: 'Avuçlar dizleri sıkıca kavrar, parmaklar açık; bel düz.',
  },
  sujud: {
    az: 'Ovuclar yerdə, çiyin bərabərində, barmaqlar bitişik və qibləyə; dirsəklər yerdən qalxıq, yanlardan aralı.',
    en: 'Palms flat on the ground level with the shoulders, fingers together toward the Qibla; elbows raised off the ground and away from the sides.',
    ru: 'Ладони на земле на уровне плеч, пальцы сомкнуты и направлены к кибле; локти подняты от земли и отведены от боков.',
    ar: 'الكفّان على الأرض حذو المنكبين، والأصابع مضمومة نحو القبلة، والمرفقان مرفوعان عن الأرض مجافيان عن الجنبين.',
    tr: 'Avuçlar yerde, omuz hizasında, parmaklar bitişik ve kıbleye; dirsekler yerden kalkık, yanlardan ayrık.',
  },
  jalsa: {
    az: 'Hər iki əl budların üstündə.',
    en: 'Both hands rest on the thighs.',
    ru: 'Обе руки лежат на бёдрах.',
    ar: 'اليدان على الفخذين.',
    tr: 'İki el de uylukların üstünde.',
  },
  tashahhud: {
    az: 'Sol ovuc sol budun üstündə açıq; sağ əlin barmaqları yığılıb, şəhadət barmağı ilə işarə edilir.',
    en: 'Left palm open on the left thigh; the right hand’s fingers are folded and the index finger points.',
    ru: 'Левая ладонь раскрыта на левом бедре; пальцы правой руки сжаты, указательным пальцем указывают.',
    ar: 'الكفّ اليسرى مبسوطة على الفخذ اليسرى، وأصابع اليمنى مقبوضة ويُشار بالسبّابة.',
    tr: 'Sol avuç sol uyluğun üstünde açık; sağ elin parmakları kapalı, şehadet parmağıyla işaret edilir.',
  },
  salam: {
    az: 'Əllər budların üstündə qalır — salam verərkən əllə işarə edilmir.',
    en: 'The hands stay on the thighs — no gesturing with the hands at the salam.',
    ru: 'Руки остаются на бёдрах — при саламе рукой не указывают.',
    ar: 'تبقى اليدان على الفخذين، ولا يُشار باليد عند التسليم.',
    tr: 'Eller uylukların üstünde kalır — selam verirken elle işaret edilmez.',
  },
}

const SCENE_OF = {
  takbir: 'takbir', itidal: 'itidal', qiyam: 'qiyam', ruku: 'ruku', sujud: 'sujud',
  jalsa: 'jalsa', tashahhud: 'tashahhud', tawarruk: 'tashahhud', salamR: 'salam', salamL: 'salam',
}
const REFS = {
  takbir: [{ c: 'bukhari', n: '735' }, { c: 'muslim', n: '391' }],
  itidal: [{ c: 'bukhari', n: '735' }],
  qiyam: [{ c: 'bukhari', n: '740' }, { c: 'ibnkhuzayma', n: '479' }],
  ruku: [{ c: 'bukhari', n: '828' }],
  sujud: [{ c: 'bukhari', n: '812' }, { c: 'muslim', n: '494' }, { c: 'bukhari', n: '807' }],
  jalsa: [],
  tashahhud: [{ c: 'muslim', n: '580' }],
  salam: [{ c: 'muslim', n: '431' }],
}
const VIEW_OF = { takbir: 'front', itidal: 'front', qiyam: 'front', ruku: 'front', sujud: 'top', jalsa: 'top', tashahhud: 'top', salam: 'top' }

export const hasHandDetail = (pose) => !!SCENE_OF[pose]

// Söz nişanı
function Tag({ x, y, text, lang, accent = false, fs = 13 }) {
  const w = Math.round(text.length * fs * 0.58) + 22
  return (
    <g transform={`translate(${x} ${y})`} className={accent ? 'hd-tag is-accent' : 'hd-tag'}>
      <rect x={-w / 2} y={-12} width={w} height={24} rx={12} />
      <text y={fs * 0.36} style={{ fontSize: fs }} textAnchor="middle" direction={lang === 'ar' ? 'rtl' : 'ltr'}>{text}</text>
    </g>
  )
}

const Arrow = ({ d, head, className = 'hd-arrow' }) => (
  <g className={className}>
    <path d={d} fill="none" strokeWidth="2.6" strokeLinecap="round" />
    <path d={head} fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </g>
)

// İki nöqtə arasında qolluq (sxematik qol)
function Sleeve({ x1, y1, x2, y2, w1 = 34, w2 = 44, className = 'hd-arm' }) {
  const dx = x2 - x1
  const dy = y2 - y1
  const L = Math.hypot(dx, dy) || 1
  const nx = -dy / L
  const ny = dx / L
  const p = (x, y, w, k) => `${(x + nx * w * k).toFixed(1)} ${(y + ny * w * k).toFixed(1)}`
  return <path className={className} d={`M ${p(x1, y1, w1 / 2, 1)} L ${p(x2, y2, w2 / 2, 1)} A ${w2 / 2} ${w2 / 2} 0 0 0 ${p(x2, y2, w2 / 2, -1)} L ${p(x1, y1, w1 / 2, -1)} Z`} />
}

// Bud (yuxarıdan) — aşağıda omba, yuxarıda diz
const Thigh = ({ x1, x2 }) => (
  <path className="hd-limb" d={`M ${x1 - 40} 262 L ${x2 - 38} 62 C ${x2 - 38} 18 ${x2 + 38} 18 ${x2 + 38} 62 L ${x1 + 40} 262 Z`} />
)

// Ayaq (öndən) — diz qabağı ilə
const Leg = ({ x }) => (
  <g>
    <path className="hd-limb" d={`M ${x - 30} -10 L ${x - 31} 118 C ${x - 42} 138 ${x - 42} 168 ${x - 31} 188 L ${x - 27} 260 L ${x + 27} 260 L ${x + 31} 188 C ${x + 42} 168 ${x + 42} 138 ${x + 31} 118 L ${x + 30} -10 Z`} />
    <ellipse cx={x} cy={152} rx={21} ry={25} className="hd-guide" fill="none" strokeWidth="1.4" strokeDasharray="3 4" />
  </g>
)

function scene(id, w, lang) {
  switch (id) {
    case 'takbir':
    case 'itidal':
      return (
        <g>
          {/* çiyin / qulaq ucu səviyyəsi */}
          <path d="M 24 122 L 296 122" className="hd-guide" strokeWidth="1.4" strokeDasharray="4 6" />
          <Hand x={94} y={150} s={1.04} side="R" view="palm" shape="flat" arm={120} />
          <Hand x={226} y={150} s={1.04} side="L" view="palm" shape="flat" arm={120} />
          <Arrow d="M 160 196 L 160 120" head="M 152 129 L 160 119 L 168 129" />
          <Tag x={94} y={218} text={w.R} lang={lang} />
          <Tag x={226} y={218} text={w.L} lang={lang} />
        </g>
      )
    case 'qiyam':
      return (
        <g>
          <rect x="22" y="40" width="276" height="190" rx="44" className="hd-zone" strokeWidth="1.6" strokeDasharray="5 6" />
          <Tag x={160} y={40} text={w.chest} lang={lang} />
          {/* sol əl altda: barmaqlar sağ tərəfə (öndən baxışda sola) */}
          <Hand x={196} y={156} rot={-90} s={1} side="L" view="back" shape="flat" arm={150} className="is-under" />
          {/* sağ əl üstdə: sol biləyi və qolu tutur */}
          <Hand x={110} y={128} rot={90} s={1} side="R" view="back" shape="hold" arm={150} />
          <Tag x={52} y={84} text={w.R} lang={lang} accent />
          <Tag x={270} y={200} text={w.L} lang={lang} />
        </g>
      )
    case 'ruku':
      return (
        <g>
          <Leg x={94} />
          <Leg x={226} />
          <Hand x={94} y={74} rot={180} s={0.96} side="R" view="back" shape="spread" arm={110} />
          <Hand x={226} y={74} rot={180} s={0.96} side="L" view="back" shape="spread" arm={110} />
          <Tag x={94} y={222} text={w.R} lang={lang} />
          <Tag x={226} y={222} text={w.L} lang={lang} />
        </g>
      )
    case 'sujud':
      return (
        <g>
          <rect x="16" y="44" width="288" height="190" rx="18" className="hd-mat" />
          {/* qiblə yuxarıdadır */}
          <Arrow d="M 160 30 L 160 8" head="M 153 15 L 160 7 L 167 15" className="hd-arrow hd-arrow--soft" />
          <Tag x={160} y={40} text={w.qibla} lang={lang} />
          {/* çiyin xətti */}
          <path d="M 30 126 L 290 126" className="hd-guide" strokeWidth="1.4" strokeDasharray="4 6" />
          <Tag x={160} y={104} text={w.brow} lang={lang} accent fs={w.brow.length > 13 ? 11 : 13} />
          {/* qollar: yerdən qalxıq (kölgə aşağıda), yanlardan aralı */}
          <Sleeve x1={82} y1={160} x2={44} y2={222} className="hd-shadow" />
          <Sleeve x1={238} y1={160} x2={276} y2={222} className="hd-shadow" />
          <Sleeve x1={76} y1={150} x2={36} y2={208} w1={30} w2={38} />
          <Sleeve x1={244} y1={150} x2={284} y2={208} w1={30} w2={38} />
          <Hand x={76} y={156} s={0.74} side="L" view="back" shape="flat" />
          <Hand x={244} y={156} s={0.74} side="R" view="back" shape="flat" />
          <Arrow d="M 26 206 L 8 216" head="M 11 206 L 7 216 L 18 217" className="hd-arrow hd-arrow--soft" />
          <Arrow d="M 294 206 L 312 216" head="M 309 206 L 313 216 L 302 217" className="hd-arrow hd-arrow--soft" />
          {/* yandan kiçik baxış: ovuc yerdə, dirsək yerdən yuxarı */}
          <g className="hd-inset">
            <rect x="108" y="150" width="104" height="80" rx="12" className="hd-inset-bg" />
            <path d="M 116 216 L 204 216" className="hd-ground" strokeWidth="2" strokeLinecap="round" />
            <Sleeve x1={170} y1={208} x2={132} y2={174} w1={10} w2={13} />
            <path d="M 166 212 L 198 212" className="hd-edge" strokeWidth="11.4" strokeLinecap="round" />
            <path d="M 166 212 L 198 212" className="hd-skin-s" strokeWidth="8" strokeLinecap="round" />
            <path d="M 132 186 L 132 212" className="hd-guide" strokeWidth="1.4" strokeDasharray="2 3" />
            <path d="M 127 192 L 132 185 L 137 192" className="hd-arrow-line" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <Tag x={76} y={64} text={w.L} lang={lang} />
          <Tag x={244} y={64} text={w.R} lang={lang} />
        </g>
      )
    case 'jalsa':
    case 'tashahhud':
    case 'salam': {
      const point = id !== 'jalsa'
      return (
        <g>
          <Thigh x1={104} x2={118} />
          <Thigh x1={216} x2={202} />
          <Tag x={118} y={40} text={w.L} lang={lang} />
          <Tag x={202} y={40} text={w.R} lang={lang} accent={point} />
          <Hand x={116} y={190} rot={2} s={0.92} side="L" view="back" shape="flat" arm={90} />
          <Hand x={204} y={190} rot={-2} s={0.92} side="R" view="back" shape={point ? 'point' : 'flat'} arm={90} />
          {id === 'tashahhud' && (
            <g className="hd-ray">
              <path d="M 186 92 L 184 62" fill="none" strokeWidth="2" strokeDasharray="3 4" strokeLinecap="round" />
              <circle cx="184" cy="58" r="3.4" />
            </g>
          )}
        </g>
      )
    }
    default:
      return null
  }
}

/** <HandDetail pose="qiyam" lang="az" /> — mövqe üçün əllərin yaxın planı (yoxdursa null) */
export default function HandDetail({ pose, lang = 'az', compact = false, className = '' }) {
  const id = SCENE_OF[pose]
  if (!id) return null
  const l = WORDS.R[lang] ? lang : 'en'
  const w = Object.fromEntries(Object.entries(WORDS).map(([k, v]) => [k, v[l]]))
  const caption = HAND_TEXT[id][l]
  const refs = REFS[id]
  return (
    <figure className={`hd-fig ${compact ? 'hd-fig--compact' : ''} ${className}`} data-hands={id}>
      <div className="hd-frame">
        <span className="hd-badge"><Icon name="touch" size={14} /> {HAND_TEXT.title[l]}</span>
        <svg viewBox="0 0 320 240" className="pp-svg hd-svg" role="img" aria-label={caption} focusable="false">
          {scene(id, w, l)}
        </svg>
        <span className="hd-view">{VIEW[VIEW_OF[id]][l]}</span>
      </div>
      {!compact && (
        <figcaption className="hd-cap">
          <p className="hd-cap-text">{caption}</p>
          {refs.length > 0 && (
            <span className="hd-cap-refs">
              {refs.map((r, i) => {
                const url = refUrl(r)
                const txt = refText(r, l)
                return (
                  <span key={i} className="hd-cap-ref">
                    {url ? <a href={url} target="_blank" rel="noopener noreferrer">{txt}</a> : txt}
                  </span>
                )
              })}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
