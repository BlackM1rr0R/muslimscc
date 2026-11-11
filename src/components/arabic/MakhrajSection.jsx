// ═══════════════════════════════════════════════════════
// MakhrajSection (v6.2) — "Məxrəc kəsiyi" (/arabic#tajweed): ağız və boğazın yandan kəsiyi
//
//   <MakhrajSection lang="az" audio={audio} />
//
// • 28 hərf → data/arabicCourse.js LETTERS[].makhraj (kursun öz açarı) → MAKHRAJ mətni (5 dil).
//   Kəsikdə həmin yer parlayır; dil, dodaqlar və yumşaq damaq hərfin vəziyyətinə keçir
//   (JS ilə interpolyasiya — Safari-də də işləsin), hava yolu (ağız / burun) axır.
// • 3D: üç qat (arxa — boğaz/kəllə, orta — dil/damaq, ön — diş/dodaq) ayrı müstəvilərdədir;
//   barmaq/siçan hərəkətilə kəsik fırlanır. Hərəkət azaldılıbsa — düz, animasiyasız.
// • Sxemdir (anatomik atlas deyil) — yerlər İbnül-Cəzərinin "Müqəddimə"sindəki 17 məxrəcə görə.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { LETTERS, MAKHRAJ } from '../../data/arabicCourse.js'
import { letterAudioUrl } from './useCourseAudio.js'
import { pick } from './strings.js'
import { pickUi } from '../../utils/uiText'
import Icon from '../Icon'
import '../../styles/MakhrajSection.css'

const T = {
  az: { ey: 'Məxrəc', title: 'Hərf haradan çıxır?', lead: 'Hərfə toxunun — ağız və boğazın kəsiyində çıxış yeri parlayır, dil və dodaqlar həmin vəziyyətə keçir. Kəsiyi barmaqla fırladın.', listen: 'Dinlə',
    areas: { jawf: 'Boşluq (cövf)', halq: 'Boğaz', lisan: 'Dil', shafatan: 'Dodaqlar', khayshum: 'Burun (ğunnə)' }, nasal: 'Hava burundan da keçir (ğunnə)', note: 'Sxemdir, anatomik atlas deyil — yerlər İbnül-Cəzərinin «Müqəddimə»sindəki məxrəclərə görədir.', fig: 'Ağız və boğazın yandan kəsiyi' },
  en: { ey: 'Makhraj', title: 'Where does the letter come from?', lead: 'Tap a letter — its point of articulation lights up on a side cut of the mouth and throat, and the tongue and lips move into place. Drag to turn the cut.', listen: 'Listen',
    areas: { jawf: 'Open space (al-jawf)', halq: 'Throat', lisan: 'Tongue', shafatan: 'Lips', khayshum: 'Nose (ghunnah)' }, nasal: 'Air also passes through the nose (ghunnah)', note: 'A diagram, not an anatomical atlas — the points follow the makharij in Ibn al-Jazari’s “Muqaddimah”.', fig: 'Side cut of the mouth and throat' },
  ru: { ey: 'Махрадж', title: 'Откуда выходит буква?', lead: 'Коснитесь буквы — на разрезе рта и гортани загорится место её произношения, а язык и губы примут нужное положение. Поворачивайте разрез пальцем.', listen: 'Слушать',
    areas: { jawf: 'Полость (аль-джауф)', halq: 'Гортань', lisan: 'Язык', shafatan: 'Губы', khayshum: 'Нос (гунна)' }, nasal: 'Воздух проходит и через нос (гунна)', note: 'Это схема, а не анатомический атлас — места даны по махраджам из «Мукаддимы» Ибн аль-Джазари.', fig: 'Боковой разрез рта и гортани' },
  ar: { ey: 'المخرج', title: 'من أين يخرج الحرف؟', lead: 'المس حرفًا — يضيء مخرجه في مقطع جانبي للفم والحلق، ويتّخذ اللسان والشفتان وضعه. حرّك المقطع بإصبعك.', listen: 'استمع',
    areas: { jawf: 'الجوف', halq: 'الحلق', lisan: 'اللسان', shafatan: 'الشفتان', khayshum: 'الخيشوم (الغنّة)' }, nasal: 'يخرج الهواء من الأنف أيضًا (غنّة)', note: 'رسم توضيحي لا أطلس تشريحي — المواضع بحسب المخارج في «المقدمة الجزرية».', fig: 'مقطع جانبي للفم والحلق' },
  tr: { ey: 'Mahreç', title: 'Harf nereden çıkar?', lead: 'Bir harfe dokunun — ağız ve boğazın kesitinde çıkış yeri parlar, dil ve dudaklar o konuma geçer. Kesiti parmakla döndürün.', listen: 'Dinle',
    areas: { jawf: 'Boşluk (cevf)', halq: 'Boğaz', lisan: 'Dil', shafatan: 'Dudaklar', khayshum: 'Burun (gunne)' }, nasal: 'Hava burundan da geçer (gunne)', note: 'Şemadır, anatomik atlas değildir — yerler İbnü’l-Cezerî’nin «Mukaddime»sindeki mahreçlere göredir.', fig: 'Ağız ve boğazın yandan kesiti' },
}

// Görünüş: viewBox 150 110 240 250 (burun ucundan qırtlağa qədər)
// Dilin üst konturu: kökdən (boğaz) ucuna 7 nöqtə — neytral vəziyyət
const TONGUE0 = [[212, 300], [206, 264], [214, 234], [240, 216], [272, 210], [302, 214], [322, 225]]
// Məxrəc → { at: parlayan nöqtə, area, tongue: {indeks: [x,y]}, lips: open|closed|teeth|round, nasal, jaw (0..1 açıqlıq), side }
const MK = {
  jawf: { at: [266, 216], area: 'jawf', jaw: 1 },
  tongueMidMadd: { at: [266, 206], area: 'jawf', jaw: 0.6, tongue: { 4: [270, 186], 3: [240, 196] } },
  throatDeep: { at: [199, 328], area: 'halq', jaw: 0.7 },
  throatMid: { at: [197, 284], area: 'halq', jaw: 0.6, tongue: { 1: [204, 258] } },
  throatMidVoiced: { at: [197, 284], area: 'halq', jaw: 0.6, tongue: { 1: [204, 258] } },
  throatTop: { at: [200, 234], area: 'halq', jaw: 0.5, tongue: { 2: [210, 226] } },
  throatTopVoiced: { at: [200, 234], area: 'halq', jaw: 0.5, tongue: { 2: [210, 226] } },
  tongueBackDeep: { at: [212, 196], area: 'lisan', jaw: 0.4, tongue: { 2: [208, 210], 3: [226, 192] } },
  tongueBack: { at: [234, 184], area: 'lisan', jaw: 0.35, tongue: { 3: [234, 184], 4: [266, 190] } },
  tongueMid: { at: [264, 174], area: 'lisan', jaw: 0.25, tongue: { 3: [240, 190], 4: [266, 176], 5: [300, 190] } },
  tongueSide: { at: [282, 186], area: 'lisan', jaw: 0.3, side: true, tongue: { 4: [276, 186], 5: [304, 194] } },
  tongueEdges: { at: [308, 190], area: 'lisan', jaw: 0.35, side: true, tongue: { 5: [306, 194], 6: [322, 195] } },
  tongueTipNasal: { at: [319, 191], area: 'lisan', jaw: 0.3, nasal: true, tongue: { 5: [304, 197], 6: [320, 192] } },
  tongueTipBack: { at: [315, 189], area: 'lisan', jaw: 0.35, tongue: { 5: [300, 198], 6: [316, 190] } },
  tongueTipRoots: { at: [324, 196], area: 'lisan', jaw: 0.3, tongue: { 5: [308, 198], 6: [325, 197] } },
  tongueTipEdges: { at: [337, 212], area: 'lisan', jaw: 0.45, tongue: { 5: [314, 206], 6: [339, 212] } },
  whistle: { at: [328, 219], area: 'lisan', jaw: 0.12, tongue: { 5: [312, 204], 6: [328, 220] } },
  lipTeeth: { at: [334, 214], area: 'shafatan', jaw: 0.2, lips: 'teeth' },
  lips: { at: [352, 214], area: 'shafatan', jaw: 0.04, lips: 'closed' },
  lipsNasal: { at: [352, 214], area: 'shafatan', jaw: 0.04, lips: 'closed', nasal: true },
  lipsRound: { at: [361, 216], area: 'shafatan', jaw: 0.25, lips: 'round' },
}
// [alt dodaq dx, dy, üst dodaq dx] — çənə açıqlığından əlavə
const LIP_STATE = { open: [0, 0, 0], closed: [0, -12, 0], teeth: [-15, -14, 0], round: [5, -7, 5] }

const lerp = (a, b, k) => a + (b - a) * k
function smoothPath(pts) {
  // Catmull-Rom → kub Bezye (yumşaq kontur)
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}
function poseOf(key) {
  const m = MK[key] || MK.jawf
  const tongue = TONGUE0.map((p, i) => m.tongue?.[i] || p)
  return { tongue, lips: LIP_STATE[m.lips || 'open'], jaw: m.jaw ?? 0.4, nasal: m.nasal ? 1 : 0 }
}
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'))

export default function MakhrajSection({ lang = 'az', audio }) {
  const t = pickUi(T, lang)
  const [id, setId] = useState('qaf')
  const letter = LETTERS.find(l => l.id === id) || LETTERS[0]
  const key = letter.makhraj
  const m = MK[key] || MK.jawf
  const target = useMemo(() => poseOf(key), [key])
  const [pose, setPose] = useState(target)
  const poseRef = useRef(pose)
  const [tilt, setTilt] = useState([0, 0])
  const sameAt = LETTERS.filter(l => l.makhraj === key)

  // Vəziyyətlər arası yumşaq keçid (≈420 ms)
  useEffect(() => {
    const from = poseRef.current
    if (reduced()) { poseRef.current = target; setPose(target); return undefined }
    let raf = 0
    const t0 = performance.now()
    const step = (now) => {
      const k0 = Math.min(1, (now - t0) / 420), k = 1 - (1 - k0) ** 3
      const p = {
        tongue: from.tongue.map((q, i) => [lerp(q[0], target.tongue[i][0], k), lerp(q[1], target.tongue[i][1], k)]),
        lips: from.lips.map((q, i) => lerp(q, target.lips[i], k)),
        jaw: lerp(from.jaw, target.jaw, k), nasal: lerp(from.nasal, target.nasal, k),
      }
      poseRef.current = p; setPose(p)
      if (k0 < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])

  const choose = (l) => {
    setId(l.id)
    if (audio && l.audio) audio.play(`mk-${l.id}`, [letterAudioUrl(l.audio)])
  }
  const onMove = (e) => {
    if (reduced()) return
    const r = e.currentTarget.getBoundingClientRect()
    setTilt([((e.clientX - r.left) / r.width - 0.5) * 34, ((e.clientY - r.top) / r.height - 0.5) * -16])
  }

  // Çənə: aşağı diş, alt dodaq və dilin dibi aşağı enir
  const jy = pose.jaw * 12
  const tongueTop = pose.tongue.map(([x, y], i) => [x, y + (i >= 4 ? jy * (i - 3) / 3 : 0)])
  const tongueD = `${smoothPath(tongueTop)} C${326},${230 + jy} ${318},${236 + jy} ${304},${240 + jy} C${272},${250 + jy} ${242},${266 + jy / 2} ${218},${302} Z`
  const [lx, ly, ux] = pose.lips
  const ljy = jy + ly * (pose.jaw < 0.3 ? 1 : 1 - (pose.jaw - 0.3))   // bağlı dodaq çənə ilə də birləşsin
  const velumDown = pose.nasal   // 0 — yuxarı (burun bağlı), 1 — aşağı (hava buruna)
  const uvula = [lerp(198, 212, velumDown), lerp(198, 214, velumDown)]
  const closedMouth = m.lips === 'closed'
  const air = m.area === 'halq' ? 'M199,346 L198,300 L198,250' : `M199,346 L197,250 Q200,212 236,${210 + jy / 2} L${closedMouth ? 334 : 376},${220 + jy / 2}`
  const airNose = 'M199,346 L197,240 Q194,190 214,168 Q270,148 362,160'
  const glowR = m.area === 'jawf' ? 16 : m.side ? 11 : 8
  const gy = m.at[1] + ((m.area === 'lisan' && m.at[0] > 300) || m.area === 'shafatan' ? jy / 2 : 0)

  return (
    <section className="mkh ui-card" aria-labelledby="mkh-title" data-testid="makhraj">
      <div className="mkh__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h3 id="mkh-title" className="ui-title ui-title--sm">{t.title}</h3>
        <p className="ui-lead">{t.lead}</p>
      </div>
      <div className="mkh__grid">
        <div className="mkh__stage" onPointerMove={onMove} onPointerLeave={() => setTilt([0, 0])} role="img" aria-label={`${t.fig}: ${pick(letter.name, lang)} — ${t.areas[m.nasal ? 'khayshum' : m.area]}`}>
          <div className="mkh__rig" style={{ transform: `rotateY(${tilt[0]}deg) rotateX(${tilt[1]}deg)` }}>
            {/* Arxa qat: üz (profil), burun boşluğu, boğaz divarı, burun hava yolu */}
            <svg viewBox="150 110 240 250" className="mkh__layer mkh__layer--back" aria-hidden="true">
              <path className="mkh__skin" d="M120,90 L334,90 C344,112 362,132 380,150 C383,160 374,168 358,170 C360,178 362,184 362,190 L338,194 L330,214 L330,236 L338,248 C352,250 358,258 352,268 C364,282 366,302 352,314 C332,322 314,330 308,370 L120,370 Z" />
              <path className="mkh__cavity" d="M216,162 Q282,140 356,156 L360,170 Q302,166 230,176 Z" />
              <path className="mkh__pharynx" d="M190,148 L218,160 L228,178 Q206,186 200,200 L206,240 L212,300 L210,370 L184,370 C179,262 181,200 190,148 Z" />
              <path className="mkh__wall" d="M190,148 C181,200 179,262 184,370" />
              <path className={`mkh__airN${velumDown > 0.5 ? ' is-on' : ''}`} d={airNose} key={`n${key}`} />
            </svg>
            {/* Orta qat: ağız boşluğu, damaq, yumşaq damaq, dil, qırtlaq qapağı, səs telləri */}
            <svg viewBox="150 110 240 250" className="mkh__layer mkh__layer--mid" aria-hidden="true">
              <path className="mkh__mouth" d={`M322,194 C300,176 262,170 228,178 Q206,186 200,200 L206,240 L212,300 L238,${270 + jy / 2} L272,${252 + jy} L306,${240 + jy} L332,${238 + jy} L334,214 Z`} />
              <path className="mkh__tongue" d={tongueD} />
              <path className="mkh__palate" d="M323,194 C302,176 264,169 228,178" />
              <path className="mkh__velum" d={`M228,178 Q212,183 ${uvula[0]},${uvula[1]}`} />
              <path className="mkh__epi" d="M212,302 Q204,292 197,298" />
              <path className="mkh__larynx" d="M186,326 L210,322 M186,334 L210,330" />
              <path className={`mkh__air${closedMouth && !m.nasal ? ' is-held' : ''}`} d={air} key={`a${key}`} />
              <g className="mkh__glow" key={key}>
                <circle cx={m.at[0]} cy={gy} r={glowR * 2.2} className="mkh__halo" />
                <circle cx={m.at[0]} cy={gy} r={glowR} className="mkh__dot" />
              </g>
            </svg>
            {/* Ön qat: dişlər, dodaqlar */}
            <svg viewBox="150 110 240 250" className="mkh__layer mkh__layer--front" aria-hidden="true">
              <path className="mkh__tooth" d="M321,192 L334,195 L338,213 L327,213 Z" />
              <path className="mkh__tooth" d={`M325,${240 + jy} L335,${238 + jy} L335,${222 + jy} L327,${222 + jy} Z`} />
              <path className="mkh__lip" d={`M336,190 C352,184 ${365 + ux},190 ${367 + ux},201 C${367 + ux},209 ${360 + ux},213 ${351 + ux},213 L334,214 Z`} />
              <path className="mkh__lip" d={`M${332 + lx},${227 + ljy} L${351 + lx},${226 + ljy} C${362 + lx},${227 + ljy} ${367 + lx},${235 + ljy} ${362 + lx},${243 + ljy} C${356 + lx},${251 + ljy} ${343 + lx},${251 + ljy} ${334 + lx},${247 + ljy} Z`} />
            </svg>
          </div>
        </div>
        <div className="mkh__panel">
          <div className="mkh__now">
            <span className="mkh__big ui-arabic" lang="ar">{letter.ch}</span>
            <div>
              <b className="mkh__name">{pick(letter.name, lang)}</b>
              <span className={`mkh__area is-${m.area}`}>{t.areas[m.area]}{m.nasal ? ` · ${t.areas.khayshum}` : ''}</span>
            </div>
            {audio && letter.audio && (
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => audio.play(`mk-${letter.id}`, [letterAudioUrl(letter.audio)])} aria-pressed={audio.playing === `mk-${letter.id}`}>
                <Icon name="volume" className="ui-btn__icon" /> {t.listen}
              </button>
            )}
          </div>
          <p className="mkh__desc" data-testid="makhraj-desc">{pick(MAKHRAJ[key], lang)}</p>
          {m.nasal && <p className="mkh__nasal"><Icon name="info" size={14} /> {t.nasal}</p>}
          {sameAt.length > 1 && <p className="mkh__same ui-arabic" lang="ar" dir="rtl">{sameAt.map(l => l.ch).join(' · ')}</p>}
          <div className="mkh__letters" role="group" aria-label={t.title} dir="rtl">
            {LETTERS.map(l => (
              <button key={l.id} type="button" lang="ar" className={`mkh__l is-${(MK[l.makhraj] || MK.jawf).area}`} aria-pressed={l.id === id} aria-label={pick(l.name, lang)}
                onClick={() => choose(l)} data-testid={`mkh-${l.id}`}>{l.ch}</button>
            ))}
          </div>
        </div>
      </div>
      <p className="mkh__note"><Icon name="info" size={14} /> {t.note}</p>
    </section>
  )
}
