// ═══════════════════════════════════════════════════════
// IslamicScience (v6.6) — "Elm adamları": İslam sivilizasiyasının alimləri xəritədə və zaman xəttində (/history)
//
//   <IslamicScience lang="az" />
//
// • 14 alim (data/islamicScientists.js): xəritə (d3-geo, Fəsdən Qəznəyə), 750–1400 zaman xətti (ömür zolaqları),
//   sahə süzgəci; seçilmiş alimin kartı — əsas əsərinin ərəbcə adı və bir əsas töhfə.
// • Canlı nümayişlər: Xarəzmi — x² + 10x = 39 (kvadratı tamamlama, addım-addım), İbn əl-Heysəm — kamera
//   obskura (cismin məsafəsi → tərs təsvirin ölçüsü), Biruni — dağdan üfüqün enmə bucağı ilə Yerin radiusu.
// Stillər: src/styles/IslamicScience.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { SCIENTISTS, SCIENCE_FIELDS } from '../data/islamicScientists'
import '../styles/IslamicScience.css'

const T = {
  az: { ey: 'Elm adamları', title: 'İslam sivilizasiyasının alimləri', lead: 'Bağdaddan Kordovaya, Fəsdən Marağaya — cəbri, optikanı, cərrahiyyəni və astronomiyanı irəli aparan alimlər. Xəritədə və ya zaman xəttində birini seçin.',
    all: 'Hamısı', map: 'Xəritə: alimlərin işlədiyi şəhərlər', time: 'Zaman xətti (miladi)', work: 'Əsas əsəri', c: 'təq.', demo: 'Özünüz yoxlayın',
    alg: ['Məsələ: kvadrat və on kökü 39-a bərabərdir: x² + 10x = 39', '10x-i iki yerə bölün: kvadratın iki yanına 5x-lik iki düzbucaqlı', 'Küncə 5 × 5 = 25 əlavə edin: böyük kvadrat 39 + 25 = 64 olur', 'Böyük kvadratın tərəfi 8-dir: x + 5 = 8, deməli x = 3'], next: 'Növbəti addım', again: 'Yenidən',
    cam: 'Cismin deşikdən məsafəsi', camNote: 'İşıq düz xətlə gedir: deşikdən keçən şüalar kəsişir və divarda tərs təsvir yaranır. Cisim yaxınlaşdıqca təsvir böyüyür.', obj: 'Cisim', img: 'Tərs təsvir', hole: 'Deşik',
    earth: 'Dağın hündürlüyü', dip: 'Üfüqün enmə bucağı', radius: 'Yerin radiusu', earthNote: 'Biruni dağın hündürlüyünü və zirvədən üfüqün nə qədər aşağı göründüyünü ölçdü. Düstur: R = h · cos θ / (1 − cos θ). O, təxminən 6339,9 km tapdı.',
    // lang-ok[Encyclopaedia,Britannica,of,MacTutor,R,cos,x’i]: mənbə adları və riyazi düstur
    src: 'Mənbələr: Britannica, Encyclopaedia of Islam, MacTutor (St Andrews). İllər — təxmini olanlar "təq." ilə.' },
  en: { ey: 'Scientists', title: 'Scholars of science in Islamic civilisation', lead: 'From Baghdad to Córdoba, from Fez to Maragheh — the scholars who advanced algebra, optics, surgery and astronomy. Pick one on the map or the timeline.',
    all: 'All', map: 'Map: cities where they worked', time: 'Timeline (CE)', work: 'Main work', c: 'c.', demo: 'Try it yourself',
    alg: ['Problem: a square and ten roots equal 39: x² + 10x = 39', 'Split 10x in two: two 5x rectangles on two sides of the square', 'Add 5 × 5 = 25 in the corner: the big square is 39 + 25 = 64', 'The big square’s side is 8: x + 5 = 8, so x = 3'], next: 'Next step', again: 'Again',
    cam: 'Object’s distance from the hole', camNote: 'Light travels in straight lines: rays through the hole cross and form an inverted image on the wall. The closer the object, the larger the image.', obj: 'Object', img: 'Inverted image', hole: 'Hole',
    earth: 'Mountain height', dip: 'Dip of the horizon', radius: 'Earth’s radius', earthNote: 'Al-Biruni measured a mountain’s height and how far below level the horizon appears from its top. Formula: R = h · cos θ / (1 − cos θ). He found about 6,339.9 km.',
    src: 'Sources: Britannica, Encyclopaedia of Islam, MacTutor (St Andrews). Approximate years are marked “c.”.' },
  ru: { ey: 'Учёные', title: 'Учёные исламской цивилизации', lead: 'От Багдада до Кордовы, от Феса до Мераге — учёные, двинувшие вперёд алгебру, оптику, хирургию и астрономию. Выберите одного на карте или на шкале времени.',
    all: 'Все', map: 'Карта: города, где они работали', time: 'Шкала времени (н. э.)', work: 'Главный труд', c: 'ок.', demo: 'Проверьте сами',
    alg: ['Задача: квадрат и десять корней равны 39: x² + 10x = 39', 'Разделите 10x надвое: два прямоугольника 5x по двум сторонам квадрата', 'Добавьте в угол 5 × 5 = 25: большой квадрат равен 39 + 25 = 64', 'Сторона большого квадрата 8: x + 5 = 8, значит x = 3'], next: 'Следующий шаг', again: 'Сначала',
    cam: 'Расстояние предмета до отверстия', camNote: 'Свет идёт по прямой: лучи, проходящие через отверстие, пересекаются, и на стене возникает перевёрнутое изображение. Чем ближе предмет, тем оно больше.', obj: 'Предмет', img: 'Перевёрнутое изображение', hole: 'Отверстие',
    // lang-ok[Encyclopaedia,Britannica,of,MacTutor,R,cos,x’i]: mənbə adları və riyazi düstur
    earth: 'Высота горы', dip: 'Понижение горизонта', radius: 'Радиус Земли', earthNote: 'Аль-Бируни измерил высоту горы и то, насколько ниже уровня виден горизонт с её вершины. Формула: R = h · cos θ / (1 − cos θ). Он получил около 6339,9 км.',
    // lang-ok[Encyclopaedia,Britannica,of,MacTutor,R,cos,x’i]: mənbə adları və riyazi düstur
    src: 'Источники: Britannica, Encyclopaedia of Islam, MacTutor (St Andrews). Приблизительные годы отмечены «ок.».' },
  ar: { ey: 'العلماء', title: 'علماء الحضارة الإسلامية', lead: 'من بغداد إلى قرطبة، ومن فاس إلى مراغة — علماء نهضوا بالجبر والبصريات والجراحة والفلك. اختر أحدهم على الخريطة أو الخط الزمني.',
    all: 'الكل', map: 'الخريطة: مدن عملهم', time: 'الخط الزمني (ميلادي)', work: 'أشهر مؤلفاته', c: 'نحو', demo: 'جرّب بنفسك',
    alg: ['المسألة: مال وعشرة أجذار يعدل تسعة وثلاثين: x² + 10x = 39', 'نصّف الأجذار: مستطيلان 5x على ضلعين من المربع', 'أضف في الزاوية 5 × 5 = 25: يصير المربع الكبير 39 + 25 = 64', 'ضلع المربع الكبير 8: x + 5 = 8، إذن x = 3'], next: 'الخطوة التالية', again: 'من جديد',
    cam: 'بُعد الجسم عن الثقب', camNote: 'يسير الضوء في خطوط مستقيمة: تتقاطع الأشعة المارّة من الثقب فتتكوّن على الجدار صورة مقلوبة، وكلما اقترب الجسم كبرت الصورة.', obj: 'الجسم', img: 'الصورة المقلوبة', hole: 'الثقب',
    // lang-ok[Encyclopaedia,Britannica,of,MacTutor,R,cos,x’i]: mənbə adları və riyazi düstur
    earth: 'ارتفاع الجبل', dip: 'زاوية انحطاط الأفق', radius: 'نصف قطر الأرض', earthNote: 'قاس البيروني ارتفاع الجبل ومقدار انخفاض الأفق المرئي من قمته. القاعدة: R = h · cos θ / (1 − cos θ)، فوجد نحو 6339.9 كم.',
    // lang-ok[Encyclopaedia,Britannica,of,MacTutor,R,cos,x’i]: mənbə adları və riyazi düstur
    src: 'المصادر: بريتانيكا، دائرة المعارف الإسلامية، MacTutor (سانت أندروز). السنوات التقريبية مسبوقة بـ«نحو».' },
  tr: { ey: 'Bilim insanları', title: 'İslam medeniyetinin âlimleri', lead: 'Bağdat’tan Kurtuba’ya, Fes’ten Merağa’ya — cebiri, optiği, cerrahiyi ve astronomiyi ileri götüren âlimler. Haritada veya zaman çizelgesinde birini seçin.',
    all: 'Tümü', map: 'Harita: çalıştıkları şehirler', time: 'Zaman çizelgesi (miladi)', work: 'Başlıca eseri', c: 'y.', demo: 'Kendiniz deneyin',
    // lang-ok[Encyclopaedia,Britannica,of,MacTutor,R,cos,x’i]: mənbə adları və riyazi düstur
    alg: ['Problem: bir kare ve on kök 39’a eşittir: x² + 10x = 39', '10x’i ikiye bölün: karenin iki kenarına 5x’lik iki dikdörtgen', 'Köşeye 5 × 5 = 25 ekleyin: büyük kare 39 + 25 = 64 olur', 'Büyük karenin kenarı 8’dir: x + 5 = 8, yani x = 3'], next: 'Sonraki adım', again: 'Yeniden',
    cam: 'Cismin delikten uzaklığı', camNote: 'Işık düz çizgide ilerler: delikten geçen ışınlar kesişir ve duvarda ters bir görüntü oluşur. Cisim yaklaştıkça görüntü büyür.', obj: 'Cisim', img: 'Ters görüntü', hole: 'Delik',
    earth: 'Dağın yüksekliği', dip: 'Ufkun alçalma açısı', radius: 'Dünya’nın yarıçapı', earthNote: 'Bîrûnî dağın yüksekliğini ve zirveden ufkun ne kadar aşağıda göründüğünü ölçtü. Formül: R = h · cos θ / (1 − cos θ). Yaklaşık 6339,9 km buldu.',
    src: 'Kaynaklar: Britannica, Encyclopaedia of Islam, MacTutor (St Andrews). Yaklaşık yıllar “y.” ile gösterilir.' },
}

const W = 640, H = 300, Y0 = 750, Y1 = 1400
let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)))
const projection = geoEqualEarth().fitExtent([[10, 10], [W - 10, H - 10]], { type: 'MultiPoint', coordinates: [[-12, 26], [72, 26], [-12, 44], [72, 44]] })
const FIELD_COLOR = { math: '#2f6fb3', astro: '#6b4fc4', med: '#c0453d', phys: '#c47a12', geo: '#1f7a58', eng: '#7a5c3a', edu: '#b03f84' }

export default function IslamicScience({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const [field, setField] = useState(null)
  const [sel, setSel] = useState('khwarizmi')
  const [land, setLand] = useState(null)
  useEffect(() => { let ok = true; loadLand().then(l => { if (ok) setLand(l) }).catch(() => {}); return () => { ok = false } }, [])
  const path = useMemo(() => geoPath(projection), [])
  const list = SCIENTISTS.filter(s => !field || s.field === field)
  const cur = SCIENTISTS.find(s => s.id === sel) || SCIENTISTS[0]
  const years = (s) => `${s.approx ? `${t.c} ` : ''}${s.born}–${s.died}`
  const xOf = (y) => ((y - Y0) / (Y1 - Y0)) * 100

  return (
    <section className="ui-card isci" data-testid="islamic-science" aria-labelledby="isci-title">
      <div className="isci__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="isci-title" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="ui-lead">{t.lead}</p>
      </div>
      <div className="isci__fields" role="group" aria-label={t.ey}>
        <button type="button" className={`isci__chip${!field ? ' is-on' : ''}`} aria-pressed={!field} onClick={() => setField(null)}>{t.all}</button>
        {Object.keys(SCIENCE_FIELDS).map(f => (
          <button key={f} type="button" className={`isci__chip${field === f ? ' is-on' : ''}`} aria-pressed={field === f} onClick={() => setField(v => (v === f ? null : f))} style={{ '--c': FIELD_COLOR[f] }} data-testid={`isci-f-${f}`}>
            <i aria-hidden="true" /> {pickUi(SCIENCE_FIELDS[f], lang)}
          </button>
        ))}
      </div>
      <figure className="isci__map">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.map}>
          <rect width={W} height={H} className="isci__sea" rx="12" />
          {land && <path d={path(land)} className="isci__land" />}
          {list.map(s => {
            const [x, y] = projection([s.city.lng, s.city.lat])
            const on = s.id === cur.id
            return (
              <g key={s.id} className={`isci__pin${on ? ' is-on' : ''}`} onClick={() => setSel(s.id)} style={{ '--c': FIELD_COLOR[s.field] }} data-testid="isci-pin" data-id={s.id}>
                <circle cx={x} cy={y} r={on ? 8 : 5.5} />
                {on && <text x={x} y={y - 12} textAnchor="middle">{pickUi(s.city.name, lang)}</text>}
              </g>
            )
          })}
        </svg>
        <figcaption className="isci__cap">{t.map}</figcaption>
      </figure>
      <div className="isci__time" aria-label={t.time}>
        <div className="isci__axis" aria-hidden="true">{[800, 900, 1000, 1100, 1200, 1300].map(y => <span key={y} style={{ insetInlineStart: `${xOf(y)}%` }} className="ui-num">{y}</span>)}</div>
        <ul className="isci__bars">
          {list.map(s => (
            <li key={s.id}>
              <button type="button" className={`isci__bar${s.id === cur.id ? ' is-on' : ''}`} aria-pressed={s.id === cur.id} onClick={() => setSel(s.id)} data-testid="isci-bar" data-id={s.id}
                style={{ '--c': FIELD_COLOR[s.field], insetInlineStart: `${xOf(s.born)}%`, width: `${xOf(s.died) - xOf(s.born)}%` }}>
                <span>{pickUi(s.name, lang)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <article className="isci__card" style={{ '--c': FIELD_COLOR[cur.field] }} data-testid="isci-card">
        <div className="isci__ctop">
          <h3>{pickUi(cur.name, lang)}</h3>
          <span className="isci__meta ui-num">{years(cur)} · {pickUi(cur.city.name, lang)} · {pickUi(SCIENCE_FIELDS[cur.field], lang)}</span>
        </div>
        {lang !== 'ar' && <p className="isci__arname ui-arabic" lang="ar" dir="rtl">{cur.ar}</p>}
        <p className="isci__fact" data-testid="isci-fact">{pickUi(cur.fact, lang)}</p>
        <p className="isci__work"><span>{t.work}:</span> <b className="ui-arabic" lang="ar" dir="rtl">{cur.work}</b></p>
        {cur.demo && <div className="isci__demo"><h4><Icon name="star" size={14} /> {t.demo}</h4>
          {cur.demo === 'algebra' && <AlgebraDemo t={t} />}
          {cur.demo === 'camera' && <CameraDemo t={t} />}
          {cur.demo === 'earth' && <EarthDemo t={t} />}
        </div>}
      </article>
      <p className="isci__src">{t.src}</p>
    </section>
  )
}

// x² + 10x = 39 — əl-Xarəzminin kitabındakı məşhur misal (kvadratı tamamlama)
function AlgebraDemo({ t }) {
  const [step, setStep] = useState(0)
  const u = 22, x = 3 * u, f = 5 * u, o = 20
  return (
    <div className="isci-alg" data-testid="isci-alg">
      <svg viewBox="0 0 260 260" role="img" aria-label={t.alg[step]}>
        <rect x={o} y={o} width={x} height={x} className="isci-alg__sq" />
        <text x={o + x / 2} y={o + x / 2 + 5} textAnchor="middle">x²</text>
        {step >= 1 && <>
          <rect x={o + x} y={o} width={f} height={x} className="isci-alg__rect" /><text x={o + x + f / 2} y={o + x / 2 + 5} textAnchor="middle">5x</text>
          <rect x={o} y={o + x} width={x} height={f} className="isci-alg__rect" /><text x={o + x / 2} y={o + x + f / 2 + 5} textAnchor="middle">5x</text>
        </>}
        {step >= 2 && <><rect x={o + x} y={o + x} width={f} height={f} className="isci-alg__add" /><text x={o + x + f / 2} y={o + x + f / 2 + 5} textAnchor="middle">25</text></>}
        {step >= 3 && <><rect x={o} y={o} width={x + f} height={x + f} className="isci-alg__big" />
          <text x={o + (x + f) / 2} y={o - 6} textAnchor="middle" className="isci-alg__lbl">x + 5 = 8</text></>}
      </svg>
      <p className="isci-alg__txt" aria-live="polite" data-testid="isci-alg-step">{t.alg[step]}</p>
      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setStep(s => (s + 1) % 4)} data-testid="isci-alg-next">{step < 3 ? t.next : t.again}</button>
    </div>
  )
}

// Kamera obskura: cisim (oxu) — deşik — divar; təsvirin ölçüsü = cismin ölçüsü × (divar məsafəsi / cisim məsafəsi)
function CameraDemo({ t }) {
  const [d, setD] = useState(120)
  const hx = 200, wall = 300, objH = 60, cy = 100
  const img = objH * ((wall - hx) / d)
  const ox = hx - d
  return (
    <div className="isci-cam">
      <svg viewBox="0 0 320 200" role="img" aria-label={t.camNote}>
        <rect x={hx} y="20" width={wall - hx} height="160" className="isci-cam__box" />
        <line x1={hx} y1="20" x2={hx} y2={cy - 3} className="isci-cam__wall" /><line x1={hx} y1={cy + 3} x2={hx} y2="180" className="isci-cam__wall" />
        <line x1={ox} y1={cy - objH / 2} x2={wall} y2={cy + img / 2} className="isci-cam__ray" />
        <line x1={ox} y1={cy + objH / 2} x2={wall} y2={cy - img / 2} className="isci-cam__ray" />
        <line x1={ox} y1={cy + objH / 2} x2={ox} y2={cy - objH / 2} className="isci-cam__obj" markerEnd="url(#isci-arr)" />
        <line x1={wall - 2} y1={cy - img / 2} x2={wall - 2} y2={cy + img / 2} className="isci-cam__img" markerEnd="url(#isci-arr2)" />
        <defs>
          <marker id="isci-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#c47a12" /></marker>
          <marker id="isci-arr2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#e8d9a8" /></marker>
        </defs>
        <text x={ox} y="196" textAnchor="middle" className="isci-cam__t">{t.obj}</text>
        <text x={hx} y="14" textAnchor="middle" className="isci-cam__t">{t.hole}</text>
      </svg>
      <label className="isci__range"><span>{t.cam}</span>
        <input type="range" min="60" max="180" value={d} onChange={e => setD(+e.target.value)} aria-label={t.cam} />
      </label>
      <p className="isci__note">{t.camNote}</p>
    </div>
  )
}

// Biruni: R = h cos θ / (1 − cos θ); h verildikdə həqiqi Yer (6371 km) üçün θ hesablanır
function EarthDemo({ t }) {
  const [h, setH] = useState(320)
  const R = 6371000
  const theta = Math.acos(R / (R + h))
  const back = (h * Math.cos(theta)) / (1 - Math.cos(theta)) / 1000
  const deg = theta * 180 / Math.PI
  const arcmin = deg * 60
  return (
    <div className="isci-earth">
      <svg viewBox="0 0 320 160" role="img" aria-label={t.earthNote}>
        <path d="M0 160 A 420 420 0 0 1 320 160" className="isci-earth__ground" />
        <path d={`M120 ${92 - Math.min(40, h / 25)} L100 112 L140 112 Z`} className="isci-earth__mt" />
        <line x1="120" y1={92 - Math.min(40, h / 25)} x2="300" y2={92 - Math.min(40, h / 25)} className="isci-earth__lvl" />
        <line x1="120" y1={92 - Math.min(40, h / 25)} x2="300" y2={92 - Math.min(40, h / 25) + 10 + arcmin / 4} className="isci-earth__sight" />
        <text x="232" y={84 - Math.min(40, h / 25)} className="isci-cam__t">θ</text>
      </svg>
      <label className="isci__range"><span>{t.earth}: <b className="ui-num">{h} m</b></span>
        <input type="range" min="100" max="2000" step="10" value={h} onChange={e => setH(+e.target.value)} aria-label={t.earth} />
      </label>
      <dl className="isci-earth__out">
        <div><dt>{t.dip}</dt><dd className="ui-num">{arcmin.toFixed(1)}′</dd></div>
        <div><dt>{t.radius}</dt><dd className="ui-num" data-testid="isci-radius">{Math.round(back)} km</dd></div>
      </dl>
      <p className="isci__note">{t.earthNote}</p>
    </div>
  )
}
