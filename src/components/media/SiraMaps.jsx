import { useId } from 'react'
import './media.css'

/* ═══════════════════════════════════════════════════════
   Siyər və həcc xəritələri — öz çəkdiyimiz SVG (şəkil faylı yox)
   • Nöqtələr real enlik/uzunluqdan (ekvidistant proyeksiya, cos(φ)
     düzəlişi ilə) — nisbi mövqelər düzgündür, sahil xətti sadələşdirilib.
   • Yalnız ümumi qəbul olunmuş coğrafiya; dəqiq bilinməyən (hicrət yolu,
     xəndəyin xətti) "təxmini" kimi qırıq xətlə və qeydlə göstərilir.
   • Canlı təsvir yoxdur: yalnız xətt, nöqtə, yazı.
   • SVG həmişə LTR (coğrafiya güzgülənmir); ərəbcə yazılar da düzgün durur.
   • Əlçatanlıq: role="img" + <title>/<desc>; izah figcaption-dadır.
   ═══════════════════════════════════════════════════════ */

const T = (o, lang) => (o && (o[lang] || o.en)) || ''

// Proyeksiya: bbox { lat:[s,n], lon:[w,e] } → piksel
function projector(box, W) {
  const latC = ((box.lat[0] + box.lat[1]) / 2) * Math.PI / 180
  const kx = Math.cos(latC)
  const H = Math.round(W * (box.lat[1] - box.lat[0]) / ((box.lon[1] - box.lon[0]) * kx))
  const p = (lat, lon) => [
    +(((lon - box.lon[0]) / (box.lon[1] - box.lon[0])) * W).toFixed(1),
    +(((box.lat[1] - lat) / (box.lat[1] - box.lat[0])) * H).toFixed(1),
  ]
  return { p, W, H }
}
const pathOf = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
// Yumşaq əyri (Catmull-Rom → Bezier)
function smooth(pts) {
  if (pts.length < 3) return pathOf(pts)
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`
  }
  return d
}

/* ── Ortaq yerlər (enlik, uzunluq) ── */
const G = {
  mecca: [21.4225, 39.8262], medina: [24.4672, 39.6112], quba: [24.4393, 39.6173],
  thawr: [21.3771, 39.8497], badr: [23.7795, 38.7905], hudaybiyyah: [21.4395, 39.6055],
}
// Qırmızı dəniz sahili (sadələşdirilmiş: Cidde, Rabiğ, Məstura, Yənbu ətrafı)
const COAST = [[20.9, 39.35], [21.3, 39.12], [21.5, 39.16], [21.9, 39.02], [22.4, 39.08], [22.8, 39.03], [23.1, 38.82], [23.5, 38.6], [23.9, 38.3], [24.1, 38.06], [24.5, 37.75], [25.0, 37.3]]

const NAMES = {
  mecca: { az: 'Məkkə', en: 'Mecca', ru: 'Мекка', ar: 'مكة', tr: 'Mekke' },
  medina: { az: 'Mədinə', en: 'Medina', ru: 'Медина', ar: 'المدينة', tr: 'Medine' },
  quba: { az: 'Quba', en: 'Quba', ru: 'Куба', ar: 'قباء', tr: 'Kuba' },
  thawr: { az: 'Sevr mağarası', en: 'Cave of Thawr', ru: 'Пещера Саур', ar: 'غار ثور', tr: 'Sevr Mağarası' },
  badr: { az: 'Bədr', en: 'Badr', ru: 'Бадр', ar: 'بدر', tr: 'Bedir' },
  hudaybiyyah: { az: 'Hüdeybiyyə', en: 'Hudaybiyyah', ru: 'Худайбия', ar: 'الحديبية', tr: 'Hudeybiye' },
  sea: { az: 'Qırmızı dəniz', en: 'Red Sea', ru: 'Красное море', ar: 'البحر الأحمر', tr: 'Kızıldeniz' },
  north: { az: 'Ş', en: 'N', ru: 'С', ar: 'ش', tr: 'K' },
}
const NOTE = {
  schematic: { az: 'Sxematik xəritə: nöqtələr real koordinatlardandır, sahil xətti sadələşdirilib.', en: 'Schematic map: points use real coordinates; the coastline is simplified.', ru: 'Схематичная карта: точки по реальным координатам, береговая линия упрощена.', ar: 'خريطة تخطيطية: النقاط بإحداثيات حقيقية، وخط الساحل مبسّط.', tr: 'Şematik harita: noktalar gerçek koordinatlardandır, kıyı çizgisi sadeleştirilmiştir.' },
  approx: { az: 'Qırıq xətt — təxmini', en: 'Dashed line — approximate', ru: 'Пунктир — приблизительно', ar: 'الخط المتقطع — تقريبي', tr: 'Kesik çizgi — yaklaşık' },
}

/* ── Ortaq parçalar ── */
function Defs({ id }) {
  return (
    <defs>
      <marker id={`${id}-arr`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 1 9 5 0 9z" className="smap__arrow" />
      </marker>
      <pattern id={`${id}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" className="smap__grid" />
      </pattern>
    </defs>
  )
}
function Point({ x, y, label, kind = 'city', anchor = 'start', dx = 10, dy = 4, sub }) {
  const tx = anchor === 'end' ? x - dx : anchor === 'middle' ? x : x + dx
  return (
    <g className={`smap__pt smap__pt--${kind}`}>
      {kind === 'star'
        ? <path transform={`translate(${x} ${y})`} d="M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2z" className="smap__star" />
        : <circle cx={x} cy={y} r={kind === 'major' ? 6 : 4.5} />}
      <text x={tx} y={y + dy} textAnchor={anchor} className="smap__label">{label}</text>
      {sub && <text x={tx} y={y + dy + 15} textAnchor={anchor} className="smap__sub">{sub}</text>}
    </g>
  )
}
function North({ x, y, lang }) {
  return (
    <g className="smap__north" transform={`translate(${x} ${y})`}>
      <path d="M0-14 6 4 0 0-6 4z" />
      <text y="18" textAnchor="middle">{T(NAMES.north, lang)}</text>
    </g>
  )
}
function Frame({ id, W, H, title, desc, children, className = '', caption, legend }) {
  return (
    <figure className={`smap ${className}`} data-reveal="fade">
      <div className="smap__canvas">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t ${id}-d`} style={{ direction: 'ltr' }}>
          <title id={`${id}-t`}>{title}</title>
          <desc id={`${id}-d`}>{desc}</desc>
          <Defs id={id} />
          <rect width={W} height={H} className="smap__bg" />
          <rect width={W} height={H} fill={`url(#${id}-grid)`} />
          {children}
        </svg>
      </div>
      {(caption || legend) && (
        <figcaption className="smap__cap">
          {caption && <strong className="smap__title">{caption}</strong>}
          {legend}
        </figcaption>
      )}
    </figure>
  )
}
function Sea({ prj, coast, lang, label = true, at }) {
  // Sahildən qərbə — kənara qədər bağlı çoxbucaqlı
  const pts = coast.map(([la, lo]) => prj.p(la, lo))
  const d = `${pathOf(pts)} L-20 ${pts[pts.length - 1][1]} L-20 ${pts[0][1]} Z`
  const [lx, ly] = at || prj.p(22.6, 38.55)
  return (
    <g>
      <path d={`${d}`} className="smap__sea" />
      <path d={smooth(pts)} className="smap__coast" />
      {label && <text x={lx} y={ly} className="smap__sea-label" textAnchor="middle" transform={`rotate(-62 ${lx} ${ly})`}>{T(NAMES.sea, lang)}</text>}
    </g>
  )
}

/* ═══ 1. Hicrət yolu: Məkkə → Sevr mağarası → sahil yolu → Quba → Mədinə ═══ */
const HIJRA_L = {
  title: { az: 'Hicrət yolu (622)', en: 'Route of the Hijrah (622)', ru: 'Путь хиджры (622)', ar: 'طريق الهجرة (٦٢٢م)', tr: 'Hicret yolu (622)' },
  desc: {
    az: 'Peyğəmbər ﷺ və Əbu Bəkr Məkkədən cənuba, Sevr mağarasına getdilər, üç gün orada qaldılar, sonra az işlənən sahil yolu ilə şimala yönəlib Qubaya, oradan Mədinəyə çatdılar. Yolun dəqiq xətti təxminidir.',
    en: 'The Prophet ﷺ and Abu Bakr went south from Mecca to the Cave of Thawr, stayed there three days, then took the little-used coastal road north to Quba and on to Medina. The exact line of the route is approximate.',
    ru: 'Пророк ﷺ и Абу Бакр направились из Мекки на юг, к пещере Саур, провели там три дня, затем по малолюдной прибрежной дороге двинулись на север к Кубе, а оттуда в Медину. Точная линия пути приблизительна.',
    ar: 'خرج النبي ﷺ وأبو بكر من مكة جنوبًا إلى غار ثور فمكثا فيه ثلاثًا، ثم سلكا طريق الساحل قليل السلوك شمالًا إلى قباء ثم إلى المدينة. والخط الدقيق للطريق تقريبي.',
    tr: 'Peygamber ﷺ ve Ebu Bekir Mekke’den güneye, Sevr Mağarası’na gittiler, orada üç gün kaldılar, sonra az kullanılan sahil yoluyla kuzeye yönelip Kuba’ya, oradan Medine’ye ulaştılar. Yolun tam çizgisi yaklaşıktır.',
  },
  route: { az: 'Təxmini yol (sahil yolu)', en: 'Approximate route (coastal road)', ru: 'Примерный путь (прибрежная дорога)', ar: 'الطريق التقريبي (طريق الساحل)', tr: 'Yaklaşık yol (sahil yolu)' },
  days: { az: '3 gün mağarada', en: '3 days in the cave', ru: '3 дня в пещере', ar: 'ثلاثة أيام في الغار', tr: 'Mağarada 3 gün' },
  arrive: { az: 'ilk məscid', en: 'first mosque', ru: 'первая мечеть', ar: 'أول مسجد', tr: 'ilk mescid' },
}
export function HijraMap({ lang = 'az' }) {
  const id = `hj${useId().replace(/:/g, '')}`
  const prj = projector({ lat: [21.1, 24.75], lon: [37.6, 40.35] }, 440)
  const P = (k) => prj.p(...G[k])
  // Təxmini yol: Sevr → qərbə, sahilə yaxın → şimala → içəri, Qubaya
  const route = [G.mecca, G.thawr, [21.55, 39.42], [22.05, 39.2], [22.7, 39.18], [23.3, 39.1], [23.85, 39.25], [24.2, 39.45], G.quba, G.medina].map(([a, b]) => prj.p(a, b))
  return (
    <Frame id={id} W={prj.W} H={prj.H} className="smap--tall" title={T(HIJRA_L.title, lang)} desc={T(HIJRA_L.desc, lang)} caption={T(HIJRA_L.title, lang)}
      legend={<>
        <span className="smap__legend"><i className="smap__key smap__key--route" /> {T(HIJRA_L.route, lang)}</span>
        <span className="smap__note">{T(HIJRA_L.desc, lang)}</span>
        <span className="smap__note">{T(NOTE.schematic, lang)}</span>
      </>}>
      <Sea prj={prj} coast={COAST} lang={lang} at={prj.p(22.5, 38.45)} />
      <path d={smooth(route)} className="smap__route smap__route--approx smap__draw smap__draw--up" markerEnd={`url(#${id}-arr)`} />
      <Point {...xy(P('mecca'))} kind="major" label={T(NAMES.mecca, lang)} sub="622" />
      <Point {...xy(P('thawr'))} kind="star" label={T(NAMES.thawr, lang)} sub={T(HIJRA_L.days, lang)} anchor="end" dy={16} />
      <Point {...xy(P('quba'))} kind="star" label={T(NAMES.quba, lang)} sub={T(HIJRA_L.arrive, lang)} anchor="end" dy={16} />
      <Point {...xy(P('medina'))} kind="major" label={T(NAMES.medina, lang)} dy={-8} />
      <Point {...xy(P('badr'))} kind="ghost" label={T(NAMES.badr, lang)} />
      <North x={prj.W - 26} y={30} lang={lang} />
    </Frame>
  )
}
const xy = ([x, y]) => ({ x, y })

/* ═══ 2. Həcc mərhələləri: Məkkə → Mina → Ərəfat → Müzdəlifə → Mina → Məkkə ═══ */
const HAJJ_L = {
  title: { az: 'Həccin mərhələləri — xəritə', en: 'The stages of Hajj — map', ru: 'Этапы хаджа — карта', ar: 'مراحل الحج — خريطة', tr: 'Haccın aşamaları — harita' },
  desc: {
    az: 'Məkkədən şərqə: Mina (8 Zülhiccə), Ərəfat (9), gecə Müzdəlifə, 10-da Minaya qayıdış (Cəmrətül-Əqəbə, qurban, təraş), Məkkədə ifada təvafı, 11–13 Minada təşriq günləri, sonda vida təvafı.',
    en: 'East of Mecca: Mina (8 Dhul-Hijjah), Arafat (9th), the night at Muzdalifah, back to Mina on the 10th (Jamrat al-Aqabah, sacrifice, shaving), Tawaf al-Ifadah in Mecca, the days of Tashriq in Mina (11–13), and finally the farewell tawaf.',
    ru: 'К востоку от Мекки: Мина (8 зуль-хиджжа), Арафат (9-е), ночь в Муздалифе, 10-го возвращение в Мину (Джамрат аль-Акаба, жертвоприношение, бритьё), таваф аль-ифада в Мекке, дни ташрика в Мине (11–13) и в конце прощальный таваф.',
    ar: 'شرق مكة: منى (٨ ذي الحجة)، ثم عرفة (٩)، ثم المبيت بمزدلفة، ثم الرجوع إلى منى يوم ١٠ (جمرة العقبة، النحر، الحلق)، ثم طواف الإفاضة بمكة، ثم أيام التشريق بمنى (١١–١٣)، وأخيرًا طواف الوداع.',
    tr: 'Mekke’nin doğusunda: Mina (8 Zilhicce), Arafat (9), gece Müzdelife, 10’unda Mina’ya dönüş (Akabe cemresi, kurban, tıraş), Mekke’de ifâda tavafı, 11–13 Mina’da teşrik günleri, sonunda veda tavafı.',
  },
  stops: {
    haram: { az: 'Məscidül-Haram', en: 'Masjid al-Haram', ru: 'Масджид аль-Харам', ar: 'المسجد الحرام', tr: 'Mescid-i Haram' },
    mina: { az: 'Mina', en: 'Mina', ru: 'Мина', ar: 'منى', tr: 'Mina' },
    jamarat: { az: 'Cəmərat', en: 'Jamarat', ru: 'Джамарат', ar: 'الجمرات', tr: 'Cemerât' },
    muzdalifah: { az: 'Müzdəlifə', en: 'Muzdalifah', ru: 'Муздалифа', ar: 'مزدلفة', tr: 'Müzdelife' },
    arafat: { az: 'Ərəfat', en: 'Arafat', ru: 'Арафат', ar: 'عرفات', tr: 'Arafat' },
  },
  legend: [
    { n: 1, az: '8 Zülhiccə — Minaya', en: '8 Dhul-Hijjah — to Mina', ru: '8 зуль-хиджжа — в Мину', ar: '٨ ذي الحجة — إلى منى', tr: '8 Zilhicce — Mina’ya' },
    { n: 2, az: '9 — Ərəfatda vüquf', en: '9th — standing at Arafat', ru: '9-е — стояние на Арафате', ar: '٩ — الوقوف بعرفة', tr: '9 — Arafat’ta vakfe' },
    { n: 3, az: 'Gecə — Müzdəlifə', en: 'Night — Muzdalifah', ru: 'Ночь — Муздалифа', ar: 'الليل — مزدلفة', tr: 'Gece — Müzdelife' },
    { n: 4, az: '10 — Mina: Əqəbə cəmrəsi, qurban, təraş', en: '10th — Mina: Jamrat al-Aqabah, sacrifice, shaving', ru: '10-е — Мина: Джамрат аль-Акаба, жертва, бритьё', ar: '١٠ — منى: جمرة العقبة والنحر والحلق', tr: '10 — Mina: Akabe cemresi, kurban, tıraş' },
    { n: 5, az: 'Məkkə — ifada təvafı və səy', en: 'Mecca — Tawaf al-Ifadah and Sa‘y', ru: 'Мекка — таваф аль-ифада и сай', ar: 'مكة — طواف الإفاضة والسعي', tr: 'Mekke — ifâda tavafı ve sa‘y' },
    { n: 6, az: '11–13 — Minada təşriq günləri', en: '11–13 — days of Tashriq in Mina', ru: '11–13 — дни ташрика в Мине', ar: '١١–١٣ — أيام التشريق بمنى', tr: '11–13 — Mina’da teşrik günleri' },
  ],
}
const H = {
  haram: [21.4225, 39.8262], jamarat: [21.4227, 39.8727], mina: [21.4135, 39.8935],
  muzdalifah: [21.3905, 39.9255], arafat: [21.3549, 39.9841], namirah: [21.3524, 39.9665],
}
export function HajjRouteMap({ lang = 'az', highlight = null, compact = false }) {
  const id = `hm${useId().replace(/:/g, '')}`
  const prj = projector({ lat: [21.335, 21.435], lon: [39.77, 40.0] }, 720)
  const P = (k) => prj.p(...H[k])
  const [hx, hy] = P('haram'), [jx, jy] = P('jamarat'), [mx, my] = P('mina'), [zx, zy] = P('muzdalifah'), [ax, ay] = P('arafat')
  // Ayaqlar (bir az əyilmiş — bir-birinin üstünə düşməsin)
  const leg = (a, b, bend) => {
    const cx = (a[0] + b[0]) / 2 + bend[0], cy = (a[1] + b[1]) / 2 + bend[1]
    return `M${a[0]} ${a[1]} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b[0]} ${b[1]}`
  }
  const legs = [
    { n: 1, d: leg([hx, hy], [mx, my], [0, -34]) },
    { n: 2, d: leg([mx, my], [ax, ay], [26, -20]) },
    { n: 3, d: leg([ax, ay], [zx, zy], [-6, 26]) },
    { n: 4, d: leg([zx, zy], [jx, jy], [-26, 10]) },
    { n: 5, d: leg([jx, jy], [hx, hy], [0, 40]) },
  ]
  const hl = (k) => (highlight && highlight !== k ? ' is-dim' : highlight === k ? ' is-hl' : '')
  const legend = !compact && (
    <>
      <ol className="smap__steps">
        {HAJJ_L.legend.map(s => <li key={s.n}><span className="smap__badge ui-num">{s.n}</span> {T(s, lang)}</li>)}
      </ol>
      <span className="smap__note">{T(NOTE.schematic, lang)}</span>
    </>
  )
  return (
    <Frame id={id} W={prj.W} H={prj.H} className={`smap--wide${compact ? ' smap--compact' : ''}`} title={T(HAJJ_L.title, lang)} desc={T(HAJJ_L.desc, lang)}
      caption={compact ? null : T(HAJJ_L.title, lang)} legend={legend}>
      {/* Ərəfat və Müzdəlifə hüdudları — sxematik sahə */}
      <ellipse cx={ax - 16} cy={ay} rx="62" ry="46" className={`smap__area${hl('arafat')}`} />
      <ellipse cx={zx} cy={zy} rx="44" ry="30" className={`smap__area${hl('muzdalifah')}`} />
      <ellipse cx={(mx + jx) / 2} cy={my - 4} rx="48" ry="24" className={`smap__area${hl('mina')}`} />
      <g className="smap__legs">
        {legs.map((l, i) => (
          <g key={l.n}>
            <path d={l.d} className="smap__route smap__draw" style={{ '--d': `${i * 220}ms` }} markerEnd={`url(#${id}-arr)`} />
          </g>
        ))}
      </g>
      {!compact && legs.map(l => {
        // Nömrə ayağın ortasında
        const m = /Q([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)$/.exec(l.d)
        const s = /^M([\d.-]+) ([\d.-]+)/.exec(l.d)
        const bx = 0.25 * +s[1] + 0.5 * +m[1] + 0.25 * +m[3], by = 0.25 * +s[2] + 0.5 * +m[2] + 0.25 * +m[4]
        return (
          <g key={`b${l.n}`} className="smap__num">
            <circle cx={bx} cy={by} r="10" />
            <text x={bx} y={by + 4} textAnchor="middle">{l.n}</text>
          </g>
        )
      })}
      <Point x={hx} y={hy} kind="star" label={T(NAMES.mecca, lang)} sub={compact ? null : T(HAJJ_L.stops.haram, lang)} anchor="end" dx={14} />
      {!compact && <Point x={jx} y={jy} label={T(HAJJ_L.stops.jamarat, lang)} anchor="middle" dy={-14} />}
      <Point x={mx} y={my} kind="major" label={T(HAJJ_L.stops.mina, lang)} anchor="start" dy={-10} />
      {!compact && (
        <g className="smap__num">
          <circle cx={mx + 20} cy={my + 20} r="10" />
          <text x={mx + 20} y={my + 24} textAnchor="middle">6</text>
        </g>
      )}
      <Point x={zx} y={zy} kind="major" label={T(HAJJ_L.stops.muzdalifah, lang)} anchor="end" dy={26} dx={8} />
      <Point x={ax} y={ay} kind="major" label={T(HAJJ_L.stops.arafat, lang)} anchor="end" dy={-12} />
      <North x={prj.W - 26} y={30} lang={lang} />
    </Frame>
  )
}

/* ═══ 3. Siyər döyüşləri: Bədr · Hüdeybiyyə · Məkkənin fəthi + Mədinə (Uhud, Xəndək) ═══ */
const SIRAH_L = {
  title: { az: 'Siyərin yerləri: Bədr, Uhud, Xəndək, Hüdeybiyyə, Məkkə', en: 'Places of the Sirah: Badr, Uhud, the Trench, Hudaybiyyah, Mecca', ru: 'Места сиры: Бадр, Ухуд, Ров, Худайбия, Мекка', ar: 'أماكن السيرة: بدر، أحد، الخندق، الحديبية، مكة', tr: 'Siyerin mekânları: Bedir, Uhud, Hendek, Hudeybiye, Mekke' },
  desc: {
    az: 'Bədr Mədinənin cənub-qərbində, sahilə yaxın vadidir (624). Hüdeybiyyə Məkkənin qərb kənarındadır (628). Mədinə planında: şimalda Uhud dağı və oxatanlar təpəsi (625), şimal tərəfdə qazılan xəndək (627) — xəndəyin xətti təxminidir.',
    en: 'Badr is a valley south-west of Medina near the coast (624). Hudaybiyyah lies at the western edge of the Haram of Mecca (628). On the Medina plan: Mount Uhud to the north and the archers’ hill (625), and the trench dug on the northern side (627) — the line of the trench is approximate.',
    ru: 'Бадр — долина к юго-западу от Медины, недалеко от побережья (624). Худайбия — на западной границе Мекки (628). На плане Медины: на севере гора Ухуд и холм лучников (625), ров, вырытый с северной стороны (627), — линия рва приблизительна.',
    ar: 'بدر وادٍ جنوب غرب المدينة قرب الساحل (٦٢٤م). والحديبية على الطرف الغربي لحرم مكة (٦٢٨م). وفي مخطط المدينة: جبل أحد شمالًا وجبل الرماة (٦٢٥م)، والخندق المحفور من الجهة الشمالية (٦٢٧م) — وخط الخندق تقريبي.',
    tr: 'Bedir, Medine’nin güneybatısında, sahile yakın bir vadidir (624). Hudeybiye, Mekke Haremi’nin batı ucundadır (628). Medine planında: kuzeyde Uhud Dağı ve okçular tepesi (625), kuzey tarafta kazılan hendek (627) — hendeğin çizgisi yaklaşıktır.',
  },
  inset: { az: 'Mədinə planı', en: 'Medina plan', ru: 'План Медины', ar: 'مخطط المدينة', tr: 'Medine planı' },
  uhud: { az: 'Uhud dağı', en: 'Mount Uhud', ru: 'Гора Ухуд', ar: 'جبل أحد', tr: 'Uhud Dağı' },
  rumat: { az: 'Oxatanlar təpəsi', en: 'Archers’ hill', ru: 'Холм лучников', ar: 'جبل الرماة', tr: 'Okçular tepesi' },
  sal: { az: 'Səl dağı', en: 'Mount Sal‘', ru: 'Гора Саль', ar: 'جبل سلع', tr: 'Sel‘ Dağı' },
  trench: { az: 'Xəndək (təxmini)', en: 'Trench (approx.)', ru: 'Ров (примерно)', ar: 'الخندق (تقريبي)', tr: 'Hendek (yaklaşık)' },
  harra: { az: 'Hərrə (lava sahəsi)', en: 'Harrah (lava field)', ru: 'Харра (лавовое поле)', ar: 'حرّة', tr: 'Harre (lav alanı)' },
  mosque: { az: 'Peyğəmbər ﷺ məscidi', en: 'Prophet’s Mosque ﷺ', ru: 'Мечеть Пророка ﷺ', ar: 'المسجد النبوي', tr: 'Mescid-i Nebevî' },
  fath: { az: 'Fəth · 630', en: 'Conquest · 630', ru: 'Завоевание · 630', ar: 'الفتح · ٦٣٠م', tr: 'Fetih · 630' },
}
export function SirahMap({ lang = 'az' }) {
  const id = `sm${useId().replace(/:/g, '')}`
  const prj = projector({ lat: [21.1, 24.75], lon: [37.6, 40.35] }, 440)
  const P = (k) => prj.p(...G[k])
  const [mdx, mdy] = P('medina')
  // Mədinə planı (iç xəritə) — sağ yuxarı küncdə
  const box = { lat: [24.44, 24.535], lon: [39.545, 39.69] }
  const ip = projector(box, 250)
  const ox = prj.W - ip.W - 14, oy = 290
  const I = (la, lo) => { const [x, y] = ip.p(la, lo); return [x + ox, y + oy] }
  const uhud = [[24.503, 39.565], [24.512, 39.58], [24.516, 39.6], [24.515, 39.622], [24.512, 39.645], [24.505, 39.668], [24.498, 39.66], [24.502, 39.635], [24.505, 39.605], [24.5, 39.58]].map(([a, b]) => I(a, b))
  const trench = [[24.478, 39.57], [24.483, 39.585], [24.4855, 39.598], [24.486, 39.612], [24.483, 39.628], [24.478, 39.643]].map(([a, b]) => I(a, b))
  const [rx, ry] = I(24.4985, 39.6155), [sx, sy] = I(24.476, 39.597), [nx, ny] = I(24.4672, 39.6112)
  return (
    <Frame id={id} W={prj.W} H={prj.H} className="smap--tall" title={T(SIRAH_L.title, lang)} desc={T(SIRAH_L.desc, lang)} caption={T(SIRAH_L.title, lang)}
      legend={<>
        <span className="smap__note">{T(SIRAH_L.desc, lang)}</span>
        <ol className="smap__steps smap__steps--plan" aria-label={T(SIRAH_L.inset, lang)}>
          <li><span className="smap__badge ui-num">1</span> {T(SIRAH_L.rumat, lang)} · 625</li>
          <li><span className="smap__badge ui-num">2</span> {T(SIRAH_L.sal, lang)}</li>
          <li><span className="smap__badge ui-num">3</span> {T(SIRAH_L.trench, lang)} · 627</li>
          <li><span className="smap__badge ui-num">4</span> {T(SIRAH_L.mosque, lang)}</li>
        </ol>
        <span className="smap__legend"><i className="smap__key smap__key--trench" /> {T(NOTE.approx, lang)}</span>
        <span className="smap__note">{T(NOTE.schematic, lang)}</span>
      </>}>
      <Sea prj={prj} coast={COAST} lang={lang} at={prj.p(22.2, 38.45)} />
      {/* İç xəritəyə bağlayan xətt */}
      <path d={`M${mdx} ${mdy + 8} L${ox + ip.W / 2} ${oy - 22}`} className="smap__leader" />
      <Point x={mdx} y={mdy} kind="major" label={T(NAMES.medina, lang)} anchor="end" dy={18} />
      <Point {...xy(P('badr'))} kind="star" label={T(NAMES.badr, lang)} sub="624" />
      <Point {...xy(P('hudaybiyyah'))} kind="star" label={T(NAMES.hudaybiyyah, lang)} sub="628" anchor="end" />
      <Point {...xy(P('mecca'))} kind="major" label={T(NAMES.mecca, lang)} sub={T(SIRAH_L.fath, lang)} />

      <g className="smap__inset">
        <rect x={ox} y={oy} width={ip.W} height={ip.H} rx="10" className="smap__inset-bg" />
        <text x={ox + 10} y={oy - 8} className="smap__sub smap__sub--strong">{T(SIRAH_L.inset, lang)}</text>
        {/* Şərq və qərb hərrələri — Mədinəni təbii qoruyan lava sahələri (sxematik) */}
        <rect x={ox + 4} y={oy + ip.H * 0.5} width={ip.W * 0.12} height={ip.H * 0.46} rx="8" className="smap__harra" />
        <rect x={ox + ip.W * 0.86} y={oy + ip.H * 0.5} width={ip.W * 0.12} height={ip.H * 0.46} rx="8" className="smap__harra" />
        <path d={`${smooth(uhud)} Z`} className="smap__mount" />
        <text x={(uhud[2][0] + uhud[3][0]) / 2} y={uhud[2][1] - 7} textAnchor="middle" className="smap__label smap__label--sm">{T(SIRAH_L.uhud, lang)} · 625</text>
        <path d={smooth(trench)} className="smap__trench smap__draw" />
        <path transform={`translate(${sx} ${sy})`} d="M-11 6 0-8 11 6z" className="smap__mount" />
        <circle cx={rx} cy={ry} r="4" className="smap__dot" />
        <path transform={`translate(${nx} ${ny})`} d="M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2z" className="smap__star" />
        {/* Nömrələr — izahı şəklin altındadır (yazılar dar planda üst-üstə düşməsin) */}
        {[[rx + 14, ry - 2, 1], [sx - 18, sy + 2, 2], [trench[5][0] + 4, trench[5][1] + 14, 3], [nx + 16, ny + 6, 4]].map(([x, y, n]) => (
          <g key={n} className="smap__num smap__num--sm">
            <circle cx={x} cy={y} r="8" />
            <text x={x} y={y + 3.5} textAnchor="middle">{n}</text>
          </g>
        ))}
      </g>
      <North x={26} y={30} lang={lang} />
    </Frame>
  )
}

/* ═══ 4. İslamın yayılması (sxematik): Mədinədən şəhərlərə, dövrlərə görə ═══ */
const SPREAD_L = {
  title: { az: 'İslamın yayılması (sxematik)', en: 'The spread of Islam (schematic)', ru: 'Распространение ислама (схема)', ar: 'انتشار الإسلام (مخطط)', tr: 'İslam’ın yayılışı (şematik)' },
  desc: {
    az: 'Mədinədən əsas şəhərlərə xətlər; rəng dövrü göstərir: Peyğəmbər ﷺ dövrü (632-yə qədər), Raşidi xilafəti (632–661), Əməvilər (661–750), Abbasilər (750-dən). İllər ümumi qəbul olunmuş tarixlərdir; bəziləri təxminidir.',
    en: 'Lines from Medina to major cities; colour shows the period: the Prophet’s ﷺ lifetime (to 632), the Rashidun caliphate (632–661), the Umayyads (661–750), the Abbasids (from 750). Years are the commonly accepted dates; some are approximate.',
    ru: 'Линии от Медины к крупным городам; цвет обозначает период: время Пророка ﷺ (до 632), праведный халифат (632–661), Омейяды (661–750), Аббасиды (с 750). Годы — общепринятые даты, некоторые приблизительны.',
    ar: 'خطوط من المدينة إلى المدن الكبرى، واللون يدل على الحقبة: عهد النبي ﷺ (إلى ٦٣٢م)، الخلافة الراشدة (٦٣٢–٦٦١م)، الأمويون (٦٦١–٧٥٠م)، العباسيون (من ٧٥٠م). والسنوات هي التواريخ المشهورة، وبعضها تقريبي.',
    tr: 'Medine’den büyük şehirlere çizgiler; renk dönemi gösterir: Peygamber ﷺ dönemi (632’ye kadar), Raşid halifeler (632–661), Emeviler (661–750), Abbasiler (750’den itibaren). Yıllar genel kabul gören tarihlerdir; bazıları yaklaşıktır.',
  },
  eras: [
    { k: 'nabi', az: 'Peyğəmbər ﷺ dövrü', en: 'The Prophet’s ﷺ time', ru: 'Время Пророка ﷺ', ar: 'عهد النبي ﷺ', tr: 'Peygamber ﷺ dönemi' },
    { k: 'rashidun', az: 'Raşidi xilafəti', en: 'Rashidun caliphate', ru: 'Праведный халифат', ar: 'الخلافة الراشدة', tr: 'Raşid halifeler' },
    { k: 'umayyad', az: 'Əməvilər', en: 'Umayyads', ru: 'Омейяды', ar: 'الأمويون', tr: 'Emeviler' },
    { k: 'abbasid', az: 'Abbasilər', en: 'Abbasids', ru: 'Аббасиды', ar: 'العباسيون', tr: 'Abbasiler' },
  ],
}
// [enlik, uzunluq, dövr, il, ad, yazı mövqeyi, yazının şaquli sürüşməsi]
const CITIES = [
  [21.42, 39.83, 'nabi', '630', { az: 'Məkkə', en: 'Mecca', ru: 'Мекка', ar: 'مكة', tr: 'Mekke' }, 'end'],
  [33.51, 36.29, 'rashidun', '634–636', { az: 'Dəməşq', en: 'Damascus', ru: 'Дамаск', ar: 'دمشق', tr: 'Şam' }, 'end', -16],
  [31.78, 35.23, 'rashidun', '637–638', { az: 'Qüds', en: 'Jerusalem', ru: 'Иерусалим', ar: 'القدس', tr: 'Kudüs' }, 'start', 6],
  [33.09, 44.58, 'rashidun', '637', { az: 'Mədain', en: 'Ctesiphon', ru: 'Ктесифон', ar: 'المدائن', tr: 'Medâin' }, 'start', 8],
  [31.2, 29.92, 'rashidun', '641–642', { az: 'İsgəndəriyyə', en: 'Alexandria', ru: 'Александрия', ar: 'الإسكندرية', tr: 'İskenderiye' }, 'end', 14],
  [38.25, 48.3, 'rashidun', '≈639–643', { az: 'Azərbaycan (Ərdəbil)', en: 'Azerbaijan (Ardabil)', ru: 'Азербайджан (Ардебиль)', ar: 'أذربيجان (أردبيل)', tr: 'Azerbaycan (Erdebil)' }, 'start'],
  [35.68, 10.1, 'umayyad', '670', { az: 'Qeyrəvan', en: 'Kairouan', ru: 'Кайруан', ar: 'القيروان', tr: 'Kayrevan' }, 'middle'],
  [37.88, -4.78, 'umayyad', '711', { az: 'Əndəlüs (Qurtuba)', en: 'Al-Andalus (Córdoba)', ru: 'Андалус (Кордова)', ar: 'الأندلس (قرطبة)', tr: 'Endülüs (Kurtuba)' }, 'start'],
  [39.65, 66.96, 'umayyad', '712', { az: 'Səmərqənd', en: 'Samarkand', ru: 'Самарканд', ar: 'سمرقند', tr: 'Semerkant' }, 'end'],
  [30.2, 71.47, 'umayyad', '711–713', { az: 'Sind (Multan)', en: 'Sindh (Multan)', ru: 'Синд (Мултан)', ar: 'السند (الملتان)', tr: 'Sind (Multan)' }, 'end'],
  [33.31, 44.36, 'abbasid', '762', { az: 'Bağdad', en: 'Baghdad', ru: 'Багдад', ar: 'بغداد', tr: 'Bağdat' }, 'start', -24],
]
export function SpreadMap({ lang = 'az' }) {
  const id = `sp${useId().replace(/:/g, '')}`
  const prj = projector({ lat: [17, 46], lon: [-12, 76] }, 900)
  const [mx, my] = prj.p(24.4672, 39.6112)
  // Enlik/uzunluq şəbəkəsi (hər 10°) — "xəritə" hissi verir, sahil çəkilmir
  const grat = []
  for (let lo = -10; lo <= 70; lo += 10) { const [x] = prj.p(0, lo); grat.push(<line key={`lo${lo}`} x1={x} x2={x} y1="0" y2={prj.H} className="smap__grat" />) }
  for (let la = 20; la <= 40; la += 10) { const [, y] = prj.p(la, 0); grat.push(<line key={`la${la}`} y1={y} y2={y} x1="0" x2={prj.W} className="smap__grat" />) }
  return (
    <Frame id={id} W={prj.W} H={prj.H} className="smap--spread" title={T(SPREAD_L.title, lang)} desc={T(SPREAD_L.desc, lang)} caption={T(SPREAD_L.title, lang)}
      legend={<>
        <span className="smap__legends">
          {SPREAD_L.eras.map(e => <span key={e.k} className="smap__legend"><i className={`smap__key smap__key--${e.k}`} /> {T(e, lang)}</span>)}
        </span>
        <span className="smap__note">{T(SPREAD_L.desc, lang)}</span>
      </>}>
      {grat}
      {CITIES.map(([la, lo, era], i) => {
        const [x, y] = prj.p(la, lo)
        const cx = (mx + x) / 2, cy = Math.min(my, y) - Math.abs(x - mx) * 0.18 - 10
        return <path key={`l${i}`} d={`M${mx} ${my} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x} ${y}`} className={`smap__arc smap__arc--${era} smap__draw`} style={{ '--d': `${i * 90}ms` }} />
      })}
      {CITIES.map(([la, lo, era, year, name, anchor, off = 0], i) => {
        const [x, y0] = prj.p(la, lo)
        const y = y0 + off   // yalnız yazılar sürüşür, nöqtə yerində qalır
        return (
          <g key={`c${i}`} className={`smap__city smap__city--${era}`}>
            <circle cx={x} cy={y0} r="5" />
            <text x={anchor === 'end' ? x - 9 : anchor === 'middle' ? x : x + 9} y={anchor === 'middle' ? y - 12 : y + 4} textAnchor={anchor} className="smap__label smap__label--sm">{T(name, lang)}</text>
            <text x={anchor === 'end' ? x - 9 : anchor === 'middle' ? x : x + 9} y={anchor === 'middle' ? y + 20 : y + 18} textAnchor={anchor} className="smap__sub">{year}</text>
          </g>
        )
      })}
      <Point x={mx} y={my} kind="star" label={T(NAMES.medina, lang)} sub="622" anchor="start" />
      <North x={prj.W - 26} y={30} lang={lang} />
    </Frame>
  )
}
