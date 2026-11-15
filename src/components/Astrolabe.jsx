// ═══════════════════════════════════════════════════════
// Astrolabe (v6.9) — işləyən usturlab (/history, elm bölməsi)
//
// • Lövhə (tympan) istifadəçinin enliyi üçün çəkilir: stereoqrafik proyeksiya
//   (cənub qütbündən ekvator müstəvisinə — klassik şimal usturlabı): üfüq,
//   hündürlük dairələri (almukantarlar, 10°-dən), −18° alaqaranlıq xətti,
//   tropiklər və ekvator. Fırlanan "örümçək" (rete): ekliptika, Günəşin bu
//   günkü yeri və 14 parlaq ulduzun göstəricisi (ərəb adları ilə).
// • Rete-nin bucağı = yerli ulduz vaxtı. "İndi" — hazırkı səma; barmaqla
//   fırladanda yerli vaxt dəyişir. Düymələr Günəşi üfüqə / −18° xəttinə /
//   meridiana gətirir: həmin anın vaxtı = günəşin çıxışı, batışı, sübh/işa
//   (−18°, klassik alaqaranlıq), zöhr (meridian) — usturlabçıların üsulu ilə.
// • Hesab utils/lunar.js (Meeus) ilə; saf SVG, şəbəkə yoxdur.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { getPrayerLocation } from '../utils/prayerLocation'
import { gmst, sunEcliptic, toEquatorial } from '../utils/lunar'
import { BRIGHT_STARS } from '../data/brightStars'
import { STAR_MEANING } from '../data/starNamesAr'
import { pickUi } from '../utils/uiText'
import '../styles/Astrolabe.css'

const RAD = Math.PI / 180
const norm = (x) => ((x % 360) + 360) % 360
const wrap180 = (x) => norm(x + 180) - 180
const R_EQ = 118          // ekvatorun radiusu (SVG vahidi)
const LIMB = 228          // xarici halqa

const T = {
  az: { ey: 'Elm tarixi', title: 'İşləyən usturlab', lead: 'Səmanın cibdə gəzən modeli. Lövhə sizin enliyiniz üçün çəkilib, üstündəki ulduz "örümçəyi" göyün fırlanmasını təkrarlayır. Fırladın və ya düymə ilə Günəşi istənilən yerə gətirin — usturlab vaxtı göstərəcək.', now: 'İndi', rise: 'Günəş çıxır', noon: 'Günorta (meridian)', set: 'Günəş batır', dawn: 'Sübh (−18°)', dusk: 'İşa (−18°)', local: 'Yerli vaxt', sunAlt: 'Günəşin hündürlüyü', lat: 'Enlik', drag: 'Örümçəyi fırladın', hist: 'Usturlab (ərəbcə «əl-usturlab») qədim yunanlardan qalmışdı, amma onu ən incə şəkildə müsəlman alimləri işlədib təkmilləşdirdilər. VIII əsrdə Məhəmməd əl-Fəzari İslam dünyasında ilk usturlab düzəldənlərdən sayılır; X əsrdə Əbdürrəhman əs-Sufi usturlabın yüzlərlə istifadəsini təsvir etdi; Hələbdə Məryəm əl-İcliyyə usturlab ustası kimi tanınırdı (İbn ən-Nədim, «əl-Fihrist»). Usturlabla vaxt, namaz vaxtları, qiblə və ulduzların yeri tapılırdı.', note: 'Hesab: Meeus; −18° — klassik alaqaranlıq həddi (saytdakı namaz vaxtları öz metodu ilə hesablanır).' }, // lang-ok[Meeus]: müəllif adı
  en: { ey: 'History of science', title: 'A working astrolabe', lead: 'A pocket model of the sky. The plate is drawn for your latitude and the star “rete” above it repeats the turning of the heavens. Turn it, or use the buttons to bring the Sun anywhere — the astrolabe tells the time.', now: 'Now', rise: 'Sunrise', noon: 'Noon (meridian)', set: 'Sunset', dawn: 'Dawn (−18°)', dusk: 'Nightfall (−18°)', local: 'Local time', sunAlt: 'Sun’s altitude', lat: 'Latitude', drag: 'Turn the rete', hist: 'The astrolabe (Arabic al-asṭurlāb) came from the ancient Greeks, but Muslim scholars used and refined it most finely. In the 8th century Muḥammad al-Fazārī is counted among the first to build one in the Islamic world; in the 10th, ʿAbd al-Raḥmān al-Ṣūfī described hundreds of its uses; in Aleppo, Maryam al-ʿIjliyya was known as an astrolabe maker (Ibn al-Nadīm, al-Fihrist). It told the time, prayer times, the qibla and the positions of stars.', note: 'Calculation: Meeus; −18° is the classical twilight limit (the site’s prayer times use their own method).' },
  ru: { ey: 'История науки', title: 'Работающая астролябия', lead: 'Карманная модель неба. Пластина начерчена для вашей широты, а звёздная «паук» над ней повторяет вращение неба. Поворачивайте её или кнопками ставьте Солнце в нужное место — астролябия покажет время.', now: 'Сейчас', rise: 'Восход', noon: 'Полдень (меридиан)', set: 'Закат', dawn: 'Рассвет (−18°)', dusk: 'Ночь (−18°)', local: 'Местное время', sunAlt: 'Высота Солнца', lat: 'Широта', drag: 'Поверните «паука»', hist: 'Астролябия (араб. аль-астурляб) пришла от древних греков, но тоньше всего её использовали и совершенствовали мусульманские учёные. В VIII веке Мухаммад аль-Фазари считается одним из первых, кто изготовил её в исламском мире; в X веке Абд ар-Рахман ас-Суфи описал сотни её применений; в Алеппо мастером астролябий была известна Марьям аль-Иджлия (Ибн ан-Надим, «аль-Фихрист»). Ею определяли время, время молитв, киблу и положение звёзд.', note: 'Расчёт: Меёс; −18° — классическая граница сумерек (время молитв на сайте считается своим методом).' },
  ar: { ey: 'تاريخ العلوم', title: 'أسطرلاب يعمل', lead: 'نموذج للسماء يُحمل في اليد. الصفيحة مرسومة لخط عرضك، والعنكبوت فوقها يحاكي دوران السماء. أدِره أو ضع الشمس بالأزرار في أي موضع — فيخبرك الأسطرلاب بالوقت.', now: 'الآن', rise: 'الشروق', noon: 'الزوال', set: 'الغروب', dawn: 'الفجر (−18°)', dusk: 'العشاء (−18°)', local: 'الوقت المحلي', sunAlt: 'ارتفاع الشمس', lat: 'العرض', drag: 'أدر العنكبوت', hist: 'جاء الأسطرلاب من الإغريق، لكن علماء المسلمين استعملوه وأتقنوه أيما إتقان. يُعدّ محمد بن إبراهيم الفزاري في القرن الثاني الهجري من أوائل صانعيه في العالم الإسلامي، ووصف عبد الرحمن الصوفي مئات من استعمالاته، وعُرفت مريم العجلية في حلب صانعةً للأسطرلاب (ابن النديم، الفهرست). وكان يُعرف به الوقت ومواقيت الصلاة والقبلة ومواضع النجوم.', note: 'الحساب: ميوس؛ −18° حدّ الشفق التقليدي (مواقيت الموقع تُحسب بطريقتها).' },
  tr: { ey: 'Bilim tarihi', title: 'Çalışan usturlap', lead: 'Cepte taşınan bir gök modeli. Levha sizin enleminiz için çizildi, üstündeki yıldız “örümceği” göğün dönüşünü tekrarlar. Çevirin ya da düğmelerle Güneş’i istediğiniz yere getirin — usturlap saati gösterecek.', now: 'Şimdi', rise: 'Güneş doğuyor', noon: 'Öğle (meridyen)', set: 'Güneş batıyor', dawn: 'Sabah (−18°)', dusk: 'Yatsı (−18°)', local: 'Yerel saat', sunAlt: 'Güneşin yüksekliği', lat: 'Enlem', drag: 'Örümceği çevirin', hist: 'Usturlap (Arapça el-usturlâb) eski Yunanlardan kalmıştı, ama onu en incelikli biçimde Müslüman âlimler kullanıp geliştirdi. VIII. yüzyılda Muhammed el-Fezârî İslam dünyasında ilk usturlap yapanlardan sayılır; X. yüzyılda Abdurrahman es-Sûfî usturlabın yüzlerce kullanımını anlattı; Halep’te Meryem el-İcliyye usturlap ustası olarak tanınırdı (İbnü’n-Nedîm, el-Fihrist). Usturlapla saat, namaz vakitleri, kıble ve yıldızların yeri bulunurdu.', note: 'Hesap: Meeus; −18° klasik alacakaranlık sınırıdır (sitedeki namaz vakitleri kendi yöntemiyle hesaplanır).' },
}

// Örümçəkdəki ulduzlar (brightStars id) — klassik usturlablarda olanlar
const RETE_STARS = ['sirius', 'vega', 'altair', 'aldebaran', 'arcturus', 'capella', 'rigel', 'betelgeuse', 'procyon', 'regulus', 'spica', 'antares', 'deneb', 'fomalhaut']

/** Ekvatorial (H — saat bucağı, δ) → lövhə (x, y). Cənub qütbündən proyeksiya, cənub meridianı yuxarıda. */
function plate(H, dec) {
  const r = R_EQ * Math.tan(((90 - dec) / 2) * RAD)
  return [-r * Math.sin(H * RAD), -r * Math.cos(H * RAD)]
}
/** Üfüqi (alt, az) → ekvatorial (H, δ), enlik φ */
function altazToEq(alt, az, phi) {
  const a = alt * RAD, A = az * RAD, p = phi * RAD
  const sd = Math.sin(a) * Math.sin(p) + Math.cos(a) * Math.cos(p) * Math.cos(A)
  const d = Math.asin(sd)
  const H = Math.atan2(-Math.sin(A) * Math.cos(a), Math.cos(p) * Math.sin(a) - Math.sin(p) * Math.cos(a) * Math.cos(A))
  return [H / RAD, d / RAD]
}
const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('')
function altCircle(alt, phi) {
  const pts = []
  for (let az = 0; az <= 360; az += 3) {
    const [H, d] = altazToEq(alt, az, phi)
    if (d < -60) continue
    pts.push(plate(H, d))
  }
  return path(pts)
}

export default function Astrolabe({ lang = 'az' }) {
  const u = pickUi(T, lang, 'en')
  const loc = useMemo(() => getPrayerLocation(), [])
  const phi = Math.max(-66, Math.min(66, loc.lat))
  const [now] = useState(() => Date.now())
  const lstNow = norm(gmst(now) + loc.lng)
  const [lst, setLst] = useState(lstNow)
  const [anim, setAnim] = useState(true)
  const svg = useRef(null)

  // Günəşin bu günkü yeri (ekliptika üzərində)
  const sun = useMemo(() => {
    const s = sunEcliptic(now)
    return { lon: s.lon, ...toEquatorial(s.lon, 0, now) }
  }, [now])

  // Lövhə xətləri — yalnız enlikdən asılıdır
  const plateLines = useMemo(() => ({
    horizon: altCircle(0, phi),
    almu: [10, 20, 30, 40, 50, 60, 70, 80].map(a => altCircle(a, phi)),
    twilight: altCircle(-18, phi),
    zenith: plate(0, phi),
  }), [phi])
  const rTrop = (dec) => R_EQ * Math.tan(((90 - dec) / 2) * RAD)

  // Örümçək (LST = 0 halında; qrup LST qədər fırlanır)
  const rete = useMemo(() => {
    const ecl = []
    for (let l = 0; l <= 360; l += 3) { const e = toEquatorial(l, 0, now); ecl.push(plate(-e.ra, e.dec)) }
    const stars = RETE_STARS.map(id => {
      const s = BRIGHT_STARS.find(x => x.id === id)
      if (!s || s.dec < -45) return null
      return { id, xy: plate(-s.ra, s.dec), ar: STAR_MEANING[id]?.[0] || s.ar || '', name: s.name?.en || id }
    }).filter(Boolean)
    return { ecl: path(ecl), stars, sun: plate(-sun.ra, sun.dec) }
  }, [now, sun])

  // Seçilmiş LST-də yerli vaxt və Günəşin hündürlüyü
  const ms = now + (wrap180(lst - lstNow) / 15 / 1.0027379) * 3600000
  const Hsun = lst - sun.ra
  const sunAlt = Math.asin(Math.sin(phi * RAD) * Math.sin(sun.dec * RAD) + Math.cos(phi * RAD) * Math.cos(sun.dec * RAD) * Math.cos(Hsun * RAD)) / RAD
  const timeLabel = new Date(ms).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })

  // Günəşi verilmiş hündürlüyə gətir (səhər / axşam)
  const sunTo = (alt, side) => {
    const c = (Math.sin(alt * RAD) - Math.sin(phi * RAD) * Math.sin(sun.dec * RAD)) / (Math.cos(phi * RAD) * Math.cos(sun.dec * RAD))
    if (c < -1 || c > 1) return
    const H0 = Math.acos(c) / RAD
    setAnim(true)
    setLst(norm(sun.ra + (side === 'am' ? -H0 : H0)))
  }

  // Barmaqla fırlatmaq
  const drag = useRef(null)
  const angleAt = (e) => {
    const r = svg.current.getBoundingClientRect()
    return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) / RAD
  }
  const onDown = (e) => { setAnim(false); drag.current = { a: angleAt(e), lst }; e.currentTarget.setPointerCapture?.(e.pointerId) }
  const onMove = (e) => { if (drag.current) setLst(norm(drag.current.lst - (angleAt(e) - drag.current.a))) }
  const onUp = () => { drag.current = null }
  useEffect(() => { if (!anim) return undefined; const t = setTimeout(() => setAnim(false), 1300); return () => clearTimeout(t) }, [anim, lst])

  const ticks = []
  for (let i = 0; i < 360; i += 2) {
    const long = i % 30 === 0, mid = i % 10 === 0
    const a = i * RAD, r1 = LIMB - 4, r2 = r1 - (long ? 16 : mid ? 10 : 5)
    ticks.push(<line key={i} x1={r1 * Math.sin(a)} y1={-r1 * Math.cos(a)} x2={r2 * Math.sin(a)} y2={-r2 * Math.cos(a)} className={long ? 'al__tick al__tick--l' : 'al__tick'} />)
  }
  const hours = Array.from({ length: 24 }, (_, h) => {
    const a = (h * 15) * RAD, r = LIMB - 32
    return <text key={h} x={r * Math.sin(a)} y={-r * Math.cos(a) + 4} className="al__hour">{(36 - h) % 24 || 24}</text>
  })
  return (
    <section className="ui-card al" aria-labelledby="al-title" data-testid="astrolabe">
      <span className="ui-eyebrow">{u.ey}</span>
      <h3 id="al-title" className="al__title">{u.title}</h3>
      <p className="al__lead">{u.lead}</p>
      <div className="al__grid">
        <div className="al__stage">
          <svg ref={svg} viewBox="-250 -270 500 520" className="al__svg" role="img"
            aria-label={`${u.title}: ${u.local} ${timeLabel}, ${u.sunAlt} ${Math.round(sunAlt)}°`}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <defs>
              <radialGradient id="al-brass" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#f6dd97" /><stop offset="45%" stopColor="#d4a948" /><stop offset="100%" stopColor="#8a6421" />
              </radialGradient>
              <radialGradient id="al-plate" cx="40%" cy="35%" r="80%">
                <stop offset="0%" stopColor="#e9cf86" /><stop offset="100%" stopColor="#b88d39" />
              </radialGradient>
              <linearGradient id="al-rete" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff0bf" /><stop offset="100%" stopColor="#b5852c" />
              </linearGradient>
              <clipPath id="al-clip"><circle r={LIMB - 46} /></clipPath>
              <filter id="al-sh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#3b2a08" floodOpacity=".55" /></filter>
            </defs>
            {/* Tac (asma halqası) */}
            <path d="M-34 -232 Q0 -268 34 -232 Z" fill="url(#al-brass)" stroke="#6d4e17" />
            <circle cx="0" cy="-256" r="10" fill="none" stroke="url(#al-brass)" strokeWidth="5" />
            {/* Ana gövdə (mater) və dərəcə halqası */}
            <circle r={LIMB} fill="url(#al-brass)" stroke="#6d4e17" strokeWidth="2" filter="url(#al-sh)" />
            <circle r={LIMB - 46} fill="url(#al-plate)" stroke="#6d4e17" />
            <g>{ticks}</g>
            <g>{hours}</g>
            {/* Lövhə (tympan) */}
            <g className="al__plate" clipPath="url(#al-clip)">
              <circle r={rTrop(-23.44)} className="al__trop" />
              <circle r={R_EQ} className="al__eq" />
              <circle r={rTrop(23.44)} className="al__trop" />
              <line x1="0" y1={-(LIMB - 46)} x2="0" y2={LIMB - 46} className="al__mer" />
              <line x1={-(LIMB - 46)} y1="0" x2={LIMB - 46} y2="0" className="al__mer" />
              {plateLines.almu.map((d, i) => <path key={i} d={d} className="al__almu" />)}
              <path d={plateLines.twilight} className="al__twi" />
              <path d={plateLines.horizon} className="al__hor" />
              <circle cx={plateLines.zenith[0]} cy={plateLines.zenith[1]} r="3" className="al__zen" />
            </g>
            {/* Örümçək (rete) — LST qədər fırlanır */}
            <g clipPath="url(#al-clip)">
            <g className={`al__rete${anim ? ' is-anim' : ''}`} style={{ transform: `rotate(${-lst}deg)` }} filter="url(#al-sh)">
              <circle r={rTrop(-23.44)} className="al__rete-rim" />
              <path d={rete.ecl} className="al__ecl" />
              {rete.stars.map(s => {
                const [x, y] = s.xy
                const ang = Math.atan2(x, -y) / RAD
                return (
                  <g key={s.id} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`}>
                    <path d="M0 0 L-4 12 Q0 8 4 12 Z" className="al__ptr" />
                    <circle r="2.6" className="al__star" />
                  </g>
                )
              })}
              <line x1="0" y1="0" x2={rete.sun[0]} y2={rete.sun[1]} className="al__sunline" />
              <circle cx={rete.sun[0]} cy={rete.sun[1]} r="8" className="al__sun" />
              <circle r="9" className="al__pin" />
            </g>
            </g>
            {/* Alidada üzərində ulduz adları — fırlanmayan yazı (oxunaqlı) */}
            <g clipPath="url(#al-clip)">
            {rete.stars.map(s => {
              const a = -lst * RAD, [x, y] = s.xy
              const X = x * Math.cos(a) - y * Math.sin(a), Y = x * Math.sin(a) + y * Math.cos(a)
              return <text key={s.id} x={X + 6} y={Y - 6} className="al__sname" lang="ar">{s.ar}</text>
            })}
            </g>
          </svg>
          <p className="al__hint">{u.drag}</p>
        </div>
        <div className="al__panel">
          <dl className="al__read">
            <div><dt>{u.local}</dt><dd className="ui-num" data-testid="al-time">{timeLabel}</dd></div>
            <div><dt>{u.sunAlt}</dt><dd className="ui-num">{Math.round(sunAlt)}°</dd></div>
            <div><dt>{u.lat}</dt><dd className="ui-num">{phi.toFixed(1)}°</dd></div>
          </dl>
          <div className="al__btns">
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => sunTo(-18, 'am')}>{u.dawn}</button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => sunTo(-0.833, 'am')}>{u.rise}</button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setAnim(true); setLst(norm(sun.ra)) }}>{u.noon}</button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => sunTo(-0.833, 'pm')}>{u.set}</button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => sunTo(-18, 'pm')}>{u.dusk}</button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => { setAnim(true); setLst(lstNow) }}>{u.now}</button>
          </div>
          <p className="al__hist">{u.hist}</p>
          <p className="al__note">{u.note}</p>
        </div>
      </div>
    </section>
  )
}
