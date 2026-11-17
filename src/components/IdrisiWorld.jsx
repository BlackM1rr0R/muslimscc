// ═══════════════════════════════════════════════════════
// IdrisiWorld — "Əl-İdrisinin dünyası (1154)" (/history, elm bölməsi)
//
//   <IdrisiWorld />            (dil useLang()-dən; istəyə görə lang="az")
//
// • Əl-İdrisinin bildiyi dünya: Atlantikdən Çinə, ekvatordan ~64° şimala — əlyazma
//   üslubunda (perqament, mavi dəniz, oxra quru), CƏNUB YUXARIDA, onun çəkdiyi kimi.
// • Yeddi iqlim (əqalim) enlik zolaqları kimi; hər iqlim 10 hissəyə bölünür (sxematik).
//   Sərhədlər təxminidir — utils/idrisi.js-də Ptolemeyin paralellərinə istinadla izah olunub.
// • Düymə "əl-İdrisinin baxışı" ↔ "müasir baxış" (şimal yuxarıda) arasında xəritəni
//   180° hamar fırladır (rAF ilə yalnız keçid zamanı; hərəkət azaldılıbsa — dərhal).
//   Şəhər adları əks istiqamətdə fırlanır ki, həmişə düz oxunsun.
// • 10 şəhər (5 dildə); seçilmiş şəhərin iqlimi və hissəsi göstərilir.
// • d3-geo (ekvidistant silindrik) + world-atlas land-110m + topojson-client — IslamicScience kimi.
// Stillər: src/styles/IdrisiWorld.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced.js'
import { CLIMATES, IDRISI_CITIES, IDRISI_EXTENT, climateOf, sectionOf, sectionLines, roman } from '../utils/idrisi'
import '../styles/IdrisiWorld.css'

const T = {
  az: {
    ey: 'Coğrafiya tarixi', title: 'Əl-İdrisinin dünyası (1154)',
    lead: 'Məhəmməd əl-İdrisi (təq. 1100–1165) Səbtədə doğulub, Kordovada oxuyub və Siciliya kralı II Rogerin Palermodakı sarayında işləyib. 1154-cü ildə «Nüzhət əl-müştaq fi ixtiraq əl-afaq» kitabını tamamladı; ona əlavə olunan dünya xəritəsi «Tabula Rogeriana» adı ilə tanınır. Bu xəritədə cənub yuxarıdadır, dünya isə yeddi iqlimə, hər iqlim on hissəyə bölünür.', // lang-ok[Tabula,Rogeriana,Rogerin]: xəritənin latınca adı, kral II Roger (xüsusi ad)
    toIdr: 'Əl-İdrisinin baxışı', toMod: 'Müasir baxış', viewIdr: 'Əl-İdrisinin baxışı: cənub yuxarıda, yeddi iqlim', viewMod: 'Müasir baxış: şimal yuxarıda',
    south: 'Cənub', north: 'Şimal', clime: 'iqlim', section: 'hissə', cities: 'Şəhərlər',
    born: 'Əl-İdrisinin doğulduğu şəhər.', study: 'Əl-İdrisinin oxuduğu şəhər.', work: 'Əl-İdrisinin II Rogerin sarayında işlədiyi şəhər.', // lang-ok[Rogerin]: kral II Roger (xüsusi ad)
    note: 'İqlim sərhədləri təxminidir: Ptolemeyin klassik iqlim paralelləri (Meroe ~16½°, Siena ~24°, Aşağı Misir ~30½°, Rodos ~36°, Hellespont ~41°, Pontun ortası ~45°, Borisfen ~48½° şm. e.) arasındakı orta xətlər götürülüb. Əl-İdrisidə olduğu kimi I iqlim ekvatordan başlayır, VII iqlim isə şimal kənarına qədər uzanır. On hissə burada sxematikdir — bərabər uzunluq dilimləri. Sahil xətləri müasirdir (Natural Earth), əl-İdrisinin öz çertyoju deyil. Mənbələr: Ptolemey, «Almagest» II.6; Britannica, «al-Idrisi».', // lang-ok[Natural,Earth,Britannica,al-Idrisi,Ptolemeyin]: mənbə adları, Ptolemey (xüsusi ad)
  },
  en: {
    ey: 'History of geography', title: 'The world of al-Idrisi (1154)',
    lead: 'Muhammad al-Idrisi (c. 1100–1165) was born in Ceuta, studied in Córdoba and worked at the court of King Roger II of Sicily in Palermo. In 1154 he completed his book “Nuzhat al-mushtāq fī ikhtirāq al-āfāq”; its world map is known as the “Tabula Rogeriana”. On it south is at the top, and the world is divided into seven climates, each split into ten sections.',
    toIdr: 'Al-Idrisi’s view', toMod: 'Modern view', viewIdr: 'Al-Idrisi’s view: south at the top, seven climates', viewMod: 'Modern view: north at the top',
    south: 'South', north: 'North', clime: 'climate', section: 'section', cities: 'Cities',
    born: 'Where al-Idrisi was born.', study: 'Where al-Idrisi studied.', work: 'Where al-Idrisi worked at the court of Roger II.',
    note: 'The climate boundaries are approximate: they are taken midway between Ptolemy’s classical climate parallels (Meroë ~16½°, Syene ~24°, Lower Egypt ~30½°, Rhodes ~36°, Hellespont ~41°, mid-Pontus ~45°, Borysthenes ~48½° N). As with al-Idrisi, climate I starts at the equator and climate VII reaches the northern edge. The ten sections are drawn schematically as equal slices of longitude. Coastlines are modern (Natural Earth), not al-Idrisi’s own drawing. Sources: Ptolemy, Almagest II.6; Britannica, “al-Idrisi”.',
  },
  ru: {
    ey: 'История географии', title: 'Мир аль-Идриси (1154)',
    lead: 'Мухаммад аль-Идриси (ок. 1100–1165) родился в Сеуте, учился в Кордове и работал при дворе сицилийского короля Рожера II в Палермо. В 1154 году он завершил книгу «Нузхат аль-муштак фи ихтирак аль-афак»; её карта мира известна как «Табула Рожериана». На ней юг наверху, а мир разделён на семь климатов, каждый — на десять частей.',
    toIdr: 'Взгляд аль-Идриси', toMod: 'Современный вид', viewIdr: 'Взгляд аль-Идриси: юг наверху, семь климатов', viewMod: 'Современный вид: север наверху',
    south: 'Юг', north: 'Север', clime: 'климат', section: 'часть', cities: 'Города',
    born: 'Здесь родился аль-Идриси.', study: 'Здесь учился аль-Идриси.', work: 'Здесь аль-Идриси работал при дворе Рожера II.',
    note: 'Границы климатов приблизительны: взяты середины между классическими параллелями климатов Птолемея (Мероэ ~16½°, Сиена ~24°, Нижний Египет ~30½°, Родос ~36°, Геллеспонт ~41°, середина Понта ~45°, Борисфен ~48½° с. ш.). Как у аль-Идриси, 1-й климат начинается от экватора, а 7-й доходит до северного края. Десять частей показаны схематично — равными долями по долготе. Береговые линии современные (Natural Earth), а не рисунок самого аль-Идриси. Источники: Птолемей, «Альмагест» II.6; Britannica, «al-Idrisi».', // lang-ok[Natural,Earth,Britannica,al-Idrisi,II]: mənbə adları, Roma rəqəmi
  },
  ar: {
    ey: 'تاريخ الجغرافيا', title: 'عالم الإدريسي (1154)',
    lead: 'وُلد محمد الإدريسي (نحو 1100–1165) في سبتة، ودرس في قرطبة، وعمل في بلاط روجر الثاني ملك صقلية في بلرم. أتمّ سنة 1154 كتابه «نزهة المشتاق في اختراق الآفاق»، وتُعرف خريطته للعالم باسم «الخريطة الروجرية». الجنوب فيها في الأعلى، والعالم مقسوم إلى سبعة أقاليم، كل إقليم عشرة أجزاء.',
    toIdr: 'منظور الإدريسي', toMod: 'المنظور الحديث', viewIdr: 'منظور الإدريسي: الجنوب في الأعلى، الأقاليم السبعة', viewMod: 'المنظور الحديث: الشمال في الأعلى',
    south: 'الجنوب', north: 'الشمال', clime: 'الإقليم', section: 'الجزء', cities: 'المدن',
    born: 'مولد الإدريسي.', study: 'حيث درس الإدريسي.', work: 'حيث عمل الإدريسي في بلاط روجر الثاني.',
    note: 'حدود الأقاليم تقريبية: أُخذت في منتصف المسافة بين متوازيات الأقاليم الكلاسيكية عند بطليموس (مروي ~16½°، أسوان ~24°، مصر السفلى ~30½°، رودس ~36°، الدردنيل ~41°، وسط البحر الأسود ~45°، بوريسثينس ~48½° شمالًا). وكما عند الإدريسي يبدأ الإقليم الأول من خط الاستواء ويمتد السابع إلى الطرف الشمالي. الأجزاء العشرة مرسومة تخطيطيًا شرائحَ متساوية في خطوط الطول. السواحل حديثة (Natural Earth) وليست رسم الإدريسي نفسه. المصادر: بطليموس، «المجسطي» 2.6؛ Britannica.', // lang-ok[Natural,Earth,Britannica]: mənbə adları
  },
  tr: {
    ey: 'Coğrafya tarihi', title: 'İdrîsî’nin dünyası (1154)',
    lead: 'Muhammed el-İdrîsî (y. 1100–1165) Sebte’de doğdu, Kurtuba’da okudu ve Sicilya Kralı II. Roger’in Palermo’daki sarayında çalıştı. 1154’te «Nüzhetü’l-müştâk fî ihtirâki’l-âfâk» adlı kitabını tamamladı; kitabın dünya haritası «Tabula Rogeriana» olarak bilinir. Haritada güney yukarıdadır ve dünya yedi iklime, her iklim on bölüme ayrılır.',
    toIdr: 'İdrîsî’nin bakışı', toMod: 'Modern bakış', viewIdr: 'İdrîsî’nin bakışı: güney yukarıda, yedi iklim', viewMod: 'Modern bakış: kuzey yukarıda',
    south: 'Güney', north: 'Kuzey', clime: 'iklim', section: 'bölüm', cities: 'Şehirler',
    born: 'İdrîsî’nin doğduğu şehir.', study: 'İdrîsî’nin okuduğu şehir.', work: 'İdrîsî’nin II. Roger’in sarayında çalıştığı şehir.',
    note: 'İklim sınırları yaklaşıktır: Batlamyus’un klasik iklim paralelleri (Meroe ~16½°, Siene ~24°, Aşağı Mısır ~30½°, Rodos ~36°, Hellespont ~41°, Karadeniz’in ortası ~45°, Borysthenes ~48½° K) arasındaki orta çizgiler alındı. İdrîsî’de olduğu gibi I. iklim ekvatordan başlar, VII. iklim kuzey kenarına uzanır. On bölüm şematik olarak eşit boylam dilimleriyle çizildi. Kıyı çizgileri moderndir (Natural Earth), İdrîsî’nin kendi çizimi değildir. Kaynaklar: Batlamyus, Almagest II.6; Britannica, “al-Idrisi”.',
  },
}

const W = 640
const { west, east, south, north } = IDRISI_EXTENT
const H = Math.round(W * (north - south) / (east - west))
const PAD = 22                                   // üst/alt yazılar üçün zolaq
const CX = W / 2, CY = PAD + H / 2               // fırlanma mərkəzi
const DUR = 1100

let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)))
const projection = geoEquirectangular()
  .fitExtent([[0, PAD], [W, PAD + H]], { type: 'MultiPoint', coordinates: [[west, south], [east, south], [west, north], [east, north]] })
  .clipExtent([[0, PAD], [W, PAD + H]])
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)

export default function IdrisiWorld({ lang: langProp }) {
  const ctx = useLang()
  const lang = langProp || ctx?.lang || 'az'
  const t = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [view, setView] = useState('idrisi')
  const [angle, setAngle] = useState(180)
  const [sel, setSel] = useState('palermo')
  const [land, setLand] = useState(null)
  const raf = useRef(0)
  const angleRef = useRef(180)

  useEffect(() => { let ok = true; loadLand().then(l => { if (ok) setLand(l) }).catch(() => {}); return () => { ok = false } }, [])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const path = useMemo(() => geoPath(projection), [])
  const landD = useMemo(() => (land ? path(land) : ''), [land, path])
  const yOf = (lat) => projection([0, lat])[1]
  const xOf = (lng) => projection([lng, 0])[0]

  // Keçid: yalnız fırlanma zamanı rAF; hərəkət azaldılıbsa — dərhal son vəziyyət
  const toggle = () => {
    const next = view === 'idrisi' ? 'modern' : 'idrisi'
    const target = next === 'idrisi' ? 180 : 0
    setView(next)
    cancelAnimationFrame(raf.current)
    if (reduced || typeof requestAnimationFrame !== 'function') { angleRef.current = target; setAngle(target); return }
    const from = angleRef.current, t0 = performance.now()
    const step = (now) => {
      const k = Math.min(1, (now - t0) / DUR)
      const a = from + (target - from) * ease(k)
      angleRef.current = a
      setAngle(a)
      if (k < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  const cur = IDRISI_CITIES.find(c => c.id === sel) || IDRISI_CITIES[0]
  const curClime = climateOf(cur.lat), curSec = sectionOf(cur.lng)
  const rot = `rotate(${angle.toFixed(2)} ${CX} ${CY})`
  const upright = (x, y) => `rotate(${(-angle).toFixed(2)} ${x} ${y})`
  const isIdr = view === 'idrisi'
  const sections = sectionLines()
  const roleText = cur.role ? t[cur.role] : null

  return (
    <section className={`ui-card idr${reduced ? ' is-reduced' : ''}`} data-testid="idrisi-world" data-view={view} aria-labelledby="idr-title">
      <span className="ui-eyebrow">{t.ey}</span>
      <h2 id="idr-title" className="idr__title">{t.title}</h2>
      <p className="idr__lead">{t.lead}</p>

      <div className="idr__bar">
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" aria-pressed={!isIdr} onClick={toggle} data-testid="idrisi-toggle">
          <Icon name="compass" size={16} /> {isIdr ? t.toMod : t.toIdr}
        </button>
        <span className="idr__mode" aria-live="polite">{isIdr ? t.viewIdr : t.viewMod}</span>
      </div>

      <figure className="idr__map">
        <svg viewBox={`0 0 ${W} ${H + PAD * 2}`} role="img" aria-label={`${t.title}. ${isIdr ? t.viewIdr : t.viewMod}`}>
          <defs>
            <clipPath id="idr-clip"><rect x="0" y={PAD} width={W} height={H} /></clipPath>
            <pattern id="idr-grain" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r=".7" className="idr__grain" />
              <circle cx="4.5" cy="4.2" r=".5" className="idr__grain" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={W} height={H + PAD * 2} rx="14" className="idr__frame" />
          <text x={CX} y={PAD - 7} className="idr__dir">{isIdr ? t.south : t.north}</text>
          <text x={CX} y={PAD + H + 16} className="idr__dir">{isIdr ? t.north : t.south}</text>

          <g transform={rot}>
            <g clipPath="url(#idr-clip)">
              <rect x="0" y={PAD} width={W} height={H} className="idr__sea" />
              <g className="idr__bands" aria-hidden="true">
                {CLIMATES.map(c => (
                  <rect key={c.n} x="0" y={yOf(c.north)} width={W} height={yOf(c.south) - yOf(c.north)} className={`idr__band idr__band--${c.n % 2 ? 'odd' : 'even'}`} />
                ))}
              </g>
              {landD && <path d={landD} className="idr__land" />}
              <rect x="0" y={PAD} width={W} height={H} fill="url(#idr-grain)" className="idr__grainlayer" />
              <g className="idr__lines" aria-hidden="true">
                {CLIMATES.slice(1).map(c => <line key={c.n} x1="0" x2={W} y1={yOf(c.south)} y2={yOf(c.south)} className="idr__cline" />)}
                {sections.slice(1, -1).map((lng, i) => <line key={i} x1={xOf(lng)} x2={xOf(lng)} y1={PAD} y2={PAD + H} className="idr__sline" />)}
              </g>
              <line x1="0" x2={W} y1={yOf(0) - 0.5} y2={yOf(0) - 0.5} className="idr__equator" aria-hidden="true" />
            </g>
            <g className="idr__clabels" aria-hidden="true">
              {CLIMATES.map(c => {
                const x = 14, y = (yOf(c.south) + yOf(Math.min(c.north, 56))) / 2
                return <text key={c.n} x={x} y={y + 4} transform={upright(x, y)} className="idr__clabel">{roman(c.n)}</text>
              })}
            </g>
            {IDRISI_CITIES.map(c => {
              const [x, y] = projection([c.lng, c.lat])
              const on = c.id === cur.id
              return (
                <g key={c.id} className={`idr__city${on ? ' is-on' : ''}${c.role ? ' is-bio' : ''}`} data-city={c.id} data-testid="idr-city"
                  role="button" tabIndex={0} aria-pressed={on} aria-label={pickUi(c.name, lang)}
                  onClick={() => setSel(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(c.id) } }}>
                  <circle cx={x} cy={y} r="11" className="idr__hit" />
                  <circle cx={x} cy={y} r={on ? 5.5 : 3.8} className="idr__dot" />
                  {on && <text x={x} y={y - 9} transform={upright(x, y)} className="idr__cname">{pickUi(c.name, lang)}</text>}
                </g>
              )
            })}
          </g>
        </svg>
        <figcaption className="idr__cap">{isIdr ? t.viewIdr : t.viewMod}</figcaption>
      </figure>

      <div className="idr__chips" role="group" aria-label={t.cities}>
        {IDRISI_CITIES.map(c => (
          <button key={c.id} type="button" className="ui-chip" aria-pressed={c.id === cur.id} onClick={() => setSel(c.id)}>{pickUi(c.name, lang)}</button>
        ))}
      </div>

      <div className="idr__info" data-testid="idr-info" data-city={cur.id}>
        <b>{pickUi(cur.name, lang)}</b>
        <span className="ui-num">{curClime ? `${roman(curClime)} ${t.clime}` : ''}{curSec ? ` · ${curSec}. ${t.section}` : ''}</span>
        {roleText && <span className="idr__role">{roleText}</span>}
      </div>

      <p className="idr__note">{t.note}</p>
    </section>
  )
}
