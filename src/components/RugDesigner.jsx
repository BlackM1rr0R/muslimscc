// ═══════════════════════════════════════════════════════
// RugDesigner — «Səccadə dizayneri»: öz namaz xalçanızı qurun
//
// • Xalçanın əsl quruluşu: xarici və daxili ensiz haşiyələr, əsas haşiyə
//   (künclər ayrıca kvadratla həll olunur), yuxarıda mehrab tağı (şiş,
//   yarımdairəvi, dilimli, pilləli, Osmanlı lansetvari), tağ üstündə künc
//   sahələri, mərkəzdə qəndil və ya medalyon, qısa uclarda saçaqlar.
// • Naxışlar prosedur vektor yollarla çəkilir (utils/rugDesign.js): lalə,
//   qərənfil, rozet, tənək budağı, 8 guşəli ulduz, altıbucaqlı tor, gül
//   (səkkizbucaq), qarmaqlı romb. Canlı varlıq və günbəz təsviri YOXDUR.
// • Sol–sağ güzgü simmetriyası avtomatikdir. Rəng dəstləri + hər zonanın
//   öz rəngi, toxuma faktura (düyün toru) açılıb-bağlanır.
// • İxrac: telefon divar kağızı 1080×1920 və çap üçün 2:3 (2000×3000) —
//   yenidən çəkilir (bulanıq deyil), küncdə muslims.cc; Web Share və ya yükləmə.
// • Animasiya dövrü yoxdur — kətan yalnız seçim dəyişəndə yenidən çəkilir.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import {
  ARCHES, BORDERS, FIELDS, MEDALLIONS, PALETTES, ZONES, EXPORTS, RUG_W, TOTAL_H,
  drawScene, paletteById,
} from '../utils/rugDesign'
import { canShareFile, preopenWindow, saveBlob } from '../utils/quoteCard'
import '../styles/RugDesigner.css'

const T = {
  az: {
    ey: 'İslam sənəti', title: 'Səccadə dizayneri', // lang-ok[dizayneri]: az dilində işlənən söz
    lead: 'Öz namaz xalçanızı qurun: mehrab tağını, haşiyə naxışını, ara sahəni və rəngləri seçin. Hər şey avtomatik olaraq sol–sağ simmetrik toxunur.', // lang-ok[simmetrik]: az dilində işlənən söz
    canvas: 'Səccadə eskizi', arch: 'Mehrab tağı', border: 'Haşiyə naxışı', field: 'Ara sahə', medallion: 'Mərkəz',
    palette: 'Rəng dəsti', colors: 'Zonaların rəngləri', weave: 'Toxuma faktura (düyün toru)',
    format: 'Ölçü', download: 'Yüklə', share: 'Paylaş',
    arches: { pointed: 'Şiş', round: 'Yarımdairəvi', cusped: 'Dilimli', stepped: 'Pilləli', lancet: 'Osmanlı lansetvari' }, // lang-ok[lansetvari]: az dilində işlənən söz
    borders: { tulip: 'Lalə və qərənfil', star: 'Səkkizguşəli ulduz', hooked: 'Qarmaqlı romb', rosette: 'Rozet və yarpaq' }, // lang-ok[Rozet]: az dilində işlənən söz
    fields: { tulips: 'Lalə toru', hex: 'Altıbucaqlı tor', stars: 'Ulduzlar', guls: 'Güllər', plain: 'Sadə' },
    medallions: { lantern: 'Qəndil', gul: 'Gül-medalyon', star: 'Ulduz-medalyon', none: 'Yoxdur' },
    palettes: { madder: 'Boyaqotu qırmızısı və indiqo', gazakh: 'Gəncə–Qazax: kərpic və fil sümüyü', teal: 'Firuzəyi və qızılı', night: 'Gecə mavisi və zəfəran' },
    zones: { field: 'Mehrab sahəsi', spandrel: 'Tağ üstü', border: 'Əsas haşiyə', guard: 'Ensiz haşiyələr', motif: 'Naxış', accent: 'Vurğu', outline: 'Kontur' },
    formats: { wallpaper: 'Divar kağızı 1080×1920', print: 'Çap üçün 2:3' },
    hist1: 'Namaz xalçası — səccadə, namazlıq — adətən bir ucunda mehrab, yəni tağ şəklində taxça təsviri ilə toxunur. Namaz qılarkən səccadə mehrabı qibləyə, Kəbə tərəfə baxacaq şəkildə salınır. Xalça namazın şərti deyil — əsas olan yerin təmiz olmasıdır; səccadə rahatlıq və gözəl bir ənənədir.',
    hist2: 'Azərbaycan xalçaçılıq sənəti 2010-cu ildə UNESCO-nun Bəşəriyyətin qeyri-maddi mədəni irsinin Reprezentativ siyahısına daxil edilib. Azərbaycan xalçaları ənənəvi olaraq Quba, Şirvan, Bakı, Gəncə, Qazax, Qarabağ kimi bölgə məktəblərinə ayrılır; həndəsi medalyonlar, qarmaqlı romblar və stilizə olunmuş çiçəklər onların tanınan dilidir.', // lang-ok[Reprezentativ]: az dilində işlənən söz
    note: 'Bu, ilham üçün eskizdir: naxışlar ümumi ənənəyə əsaslanan sadələşdirilmiş vektor təsvirlərdir, konkret muzey xalçasının surəti deyil. Yalnız həndəsi və bitki naxışlarından istifadə olunub.', // lang-ok[konkret]: az dilində işlənən söz
  },
  en: {
    ey: 'Islamic art', title: 'Prayer rug designer',
    lead: 'Design your own prayer rug: choose the mihrab arch, the border motif, the field and the colours. Everything is woven with automatic left–right symmetry.',
    canvas: 'Prayer rug sketch', arch: 'Mihrab arch', border: 'Border motif', field: 'Field', medallion: 'Centre',
    palette: 'Palette', colors: 'Zone colours', weave: 'Weave texture (knot grid)',
    format: 'Size', download: 'Download', share: 'Share',
    arches: { pointed: 'Pointed', round: 'Round', cusped: 'Cusped', stepped: 'Stepped', lancet: 'Ottoman lancet' },
    borders: { tulip: 'Tulip & carnation', star: 'Eight-point star', hooked: 'Hooked lozenge', rosette: 'Rosette & leaf' },
    fields: { tulips: 'Tulip lattice', hex: 'Hexagonal lattice', stars: 'Stars', guls: 'Guls', plain: 'Plain' },
    medallions: { lantern: 'Lamp', gul: 'Gul medallion', star: 'Star medallion', none: 'None' },
    palettes: { madder: 'Madder red & indigo', gazakh: 'Ganja–Gazakh: brick & ivory', teal: 'Teal & gold', night: 'Night blue & saffron' },
    zones: { field: 'Mihrab field', spandrel: 'Spandrels', border: 'Main border', guard: 'Guard stripes', motif: 'Motif', accent: 'Accent', outline: 'Outline' },
    formats: { wallpaper: 'Wallpaper 1080×1920', print: 'Print 2:3' },
    hist1: 'A prayer rug (sajjada) is usually woven with a mihrab — an arched niche — at one end. When praying, the rug is laid so that the niche points towards the qibla, the direction of the Kaaba. A rug is not a condition of prayer — what matters is a clean place; the prayer rug is a convenience and a beautiful tradition.',
    hist2: 'The traditional art of Azerbaijani carpet weaving was inscribed by UNESCO on the Representative List of the Intangible Cultural Heritage of Humanity in 2010. Azerbaijani carpets are traditionally grouped into regional schools such as Guba, Shirvan, Baku, Ganja, Gazakh and Karabakh; geometric medallions, hooked lozenges and stylised flowers are their recognisable language.',
    note: 'This is a sketch for inspiration: the motifs are simplified vector drawings based on the general tradition, not copies of a particular museum rug. Only geometric and plant motifs are used.',
  },
  ru: {
    ey: 'Исламское искусство', title: 'Конструктор молитвенного коврика',
    lead: 'Создайте свой молитвенный коврик: выберите арку михраба, узор каймы, среднее поле и цвета. Всё ткётся с автоматической зеркальной симметрией.',
    canvas: 'Эскиз молитвенного коврика', arch: 'Арка михраба', border: 'Узор каймы', field: 'Среднее поле', medallion: 'Центр',
    palette: 'Палитра', colors: 'Цвета зон', weave: 'Фактура ткани (сетка узлов)',
    format: 'Размер', download: 'Скачать', share: 'Поделиться',
    arches: { pointed: 'Стрельчатая', round: 'Полукруглая', cusped: 'Фестончатая', stepped: 'Ступенчатая', lancet: 'Османская ланцетная' },
    borders: { tulip: 'Тюльпан и гвоздика', star: 'Восьмиконечная звезда', hooked: 'Ромб с крючками', rosette: 'Розетка и листья' },
    fields: { tulips: 'Сетка тюльпанов', hex: 'Шестиугольная сетка', stars: 'Звёзды', guls: 'Гёли', plain: 'Гладкое' },
    medallions: { lantern: 'Лампада', gul: 'Медальон-гёль', star: 'Звёздный медальон', none: 'Нет' },
    palettes: { madder: 'Марена и индиго', gazakh: 'Гянджа–Газах: кирпичный и слоновая кость', teal: 'Бирюза и золото', night: 'Ночная синь и шафран' },
    zones: { field: 'Поле михраба', spandrel: 'Над аркой', border: 'Главная кайма', guard: 'Узкие бордюры', motif: 'Узор', accent: 'Акцент', outline: 'Контур' },
    formats: { wallpaper: 'Обои 1080×1920', print: 'Печать 2:3' },
    hist1: 'Молитвенный коврик (саджжада) обычно ткут с михрабом — арочной нишей — на одном конце. Во время молитвы коврик кладут так, чтобы ниша была обращена к кибле, в сторону Каабы. Коврик не является условием молитвы — важна чистота места; коврик — это удобство и красивая традиция.',
    hist2: 'Традиционное искусство азербайджанского ковроткачества в 2010 году внесено ЮНЕСКО в Репрезентативный список нематериального культурного наследия человечества. Азербайджанские ковры традиционно делят на региональные школы — Губинскую, Ширванскую, Бакинскую, Гянджинскую, Газахскую, Карабахскую и другие; геометрические медальоны, ромбы с крючками и стилизованные цветы — их узнаваемый язык.',
    note: 'Это эскиз для вдохновения: узоры — упрощённые векторные рисунки по мотивам общей традиции, а не копии конкретного музейного ковра. Используются только геометрические и растительные мотивы.',
  },
  ar: {
    ey: 'فن إسلامي', title: 'مصمّم سجادة الصلاة',
    lead: 'صمّم سجادة صلاتك: اختر قوس المحراب ونقش الإطار والمتن والألوان. كل شيء يُنسج بتناظر تلقائي بين اليمين واليسار.',
    canvas: 'مسودة سجادة صلاة', arch: 'قوس المحراب', border: 'نقش الإطار', field: 'المتن', medallion: 'الوسط',
    palette: 'مجموعة الألوان', colors: 'ألوان المناطق', weave: 'ملمس النسيج (شبكة العُقد)',
    format: 'المقاس', download: 'تنزيل', share: 'مشاركة',
    arches: { pointed: 'مدبّب', round: 'نصف دائري', cusped: 'مفصّص', stepped: 'مدرّج', lancet: 'رمحي عثماني' },
    borders: { tulip: 'خزامى وقرنفل', star: 'نجمة ثمانية', hooked: 'معيّن بخطاطيف', rosette: 'وريدة وأوراق' },
    fields: { tulips: 'شبكة خزامى', hex: 'شبكة سداسية', stars: 'نجوم', guls: 'جُلّات مثمّنة', plain: 'سادة' },
    medallions: { lantern: 'قنديل', gul: 'جامة مثمّنة', star: 'جامة نجمية', none: 'بلا' },
    palettes: { madder: 'أحمر الفوّة والنيلي', gazakh: 'كنجه–قازاخ: آجري وعاجي', teal: 'فيروزي وذهبي', night: 'أزرق ليلي وزعفراني' },
    zones: { field: 'متن المحراب', spandrel: 'فوق القوس', border: 'الإطار الرئيسي', guard: 'الأشرطة الضيقة', motif: 'النقش', accent: 'لون مميِّز', outline: 'الحدود' },
    formats: { wallpaper: 'خلفية 1080×1920', print: 'للطباعة 2:3' },
    hist1: 'تُنسج سجادة الصلاة عادةً وفي أحد طرفيها محراب، أي تجويف على هيئة قوس. وعند الصلاة تُبسط السجادة بحيث يتجه المحراب إلى القبلة، جهة الكعبة. وليست السجادة شرطًا للصلاة — المهم طهارة المكان؛ والسجادة راحة وتقليد جميل.',
    hist2: 'أُدرج فن نسج السجاد الأذربيجاني التقليدي عام 2010 في القائمة التمثيلية للتراث الثقافي غير المادي للبشرية لدى اليونسكو. ويُقسَّم السجاد الأذربيجاني تقليديًا إلى مدارس إقليمية مثل قوبا وشيروان وباكو وكنجه وقازاخ وقره باغ؛ والجامات الهندسية والمعيّنات ذات الخطاطيف والزهور المحوّرة هي لغتها المميّزة.',
    note: 'هذه مسودة للإلهام: النقوش رسوم متجهية مبسّطة مستوحاة من التقليد العام، وليست نسخًا لسجادة متحفية بعينها. استُخدمت النقوش الهندسية والنباتية فقط.',
  },
  tr: {
    ey: 'İslam sanatı', title: 'Seccade tasarımcısı',
    lead: 'Kendi seccadenizi tasarlayın: mihrap kemerini, bordür motifini, zemini ve renkleri seçin. Her şey otomatik sağ–sol simetriyle dokunur.',
    canvas: 'Seccade taslağı', arch: 'Mihrap kemeri', border: 'Bordür motifi', field: 'Zemin', medallion: 'Orta',
    palette: 'Renk takımı', colors: 'Bölge renkleri', weave: 'Dokuma dokusu (düğüm ızgarası)',
    format: 'Boyut', download: 'İndir', share: 'Paylaş',
    arches: { pointed: 'Sivri', round: 'Yarım daire', cusped: 'Dilimli', stepped: 'Basamaklı', lancet: 'Osmanlı lanset' },
    borders: { tulip: 'Lale ve karanfil', star: 'Sekiz köşeli yıldız', hooked: 'Çengelli baklava', rosette: 'Rozet ve yaprak' },
    fields: { tulips: 'Lale kafesi', hex: 'Altıgen kafes', stars: 'Yıldızlar', guls: 'Göller', plain: 'Düz' },
    medallions: { lantern: 'Kandil', gul: 'Göl madalyon', star: 'Yıldız madalyon', none: 'Yok' },
    palettes: { madder: 'Kök boya kırmızısı ve çivit', gazakh: 'Gence–Kazak: kiremit ve fildişi', teal: 'Turkuaz ve altın', night: 'Gece mavisi ve safran' },
    zones: { field: 'Mihrap zemini', spandrel: 'Kemer üstü', border: 'Ana bordür', guard: 'Dar bordürler', motif: 'Motif', accent: 'Vurgu', outline: 'Kontur' },
    formats: { wallpaper: 'Duvar kâğıdı 1080×1920', print: 'Baskı 2:3' },
    hist1: 'Seccade genellikle bir ucunda mihrap, yani kemerli bir niş tasviriyle dokunur. Namaz kılarken seccade, mihrabı kıbleye, Kâbe yönüne bakacak şekilde serilir. Seccade namazın şartı değildir — önemli olan yerin temiz olmasıdır; seccade bir kolaylık ve güzel bir gelenektir.',
    hist2: 'Geleneksel Azerbaycan halı dokuma sanatı 2010 yılında UNESCO İnsanlığın Somut Olmayan Kültürel Mirası Temsili Listesi’ne alındı. Azerbaycan halıları geleneksel olarak Kuba, Şirvan, Bakü, Gence, Kazak, Karabağ gibi bölge okullarına ayrılır; geometrik madalyonlar, çengelli baklavalar ve üsluplaştırılmış çiçekler onların tanınan dilidir.',
    note: 'Bu, ilham için bir taslaktır: motifler genel geleneğe dayanan sadeleştirilmiş vektör çizimlerdir, belirli bir müze halısının kopyası değildir. Yalnızca geometrik ve bitkisel motifler kullanılmıştır.',
  },
}

const PREVIEW_ASPECT = TOTAL_H / RUG_W

function renderExport(opts, fmt) {
  const e = EXPORTS[fmt] || EXPORTS.wallpaper
  const c = document.createElement('canvas')
  c.width = e.w
  c.height = e.h
  const ctx = c.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  drawScene(ctx, e.w, e.h, opts, e.mode)
  return new Promise(res => c.toBlob(res, 'image/png'))
}

function Chips({ legend, items, value, onPick, labels, attr }) {
  return (
    <fieldset className="rg__group">
      <legend>{legend}</legend>
      <div className="rg__chips">
        {items.map(id => (
          <button key={id} type="button" className="ui-chip" aria-pressed={value === id}
            onClick={() => onPick(id)} {...{ [attr]: id }}>
            {labels[id]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function RugDesigner() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const [arch, setArch] = useState('pointed')
  const [border, setBorder] = useState('tulip')
  const [field, setField] = useState('tulips')
  const [medallion, setMedallion] = useState('lantern')
  const [paletteId, setPaletteId] = useState(PALETTES[0].id)
  const [colors, setColors] = useState(() => ({ ...PALETTES[0].colors }))
  const [weave, setWeave] = useState(true)
  const [fmt, setFmt] = useState('wallpaper')
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef(null)
  const sizeRef = useRef({ w: 0, dpr: 1 })
  const rafRef = useRef(0)

  const opts = { arch, border, field, medallion, colors, weave }
  const optsRef = useRef(opts)
  optsRef.current = opts

  // Yalnız dəyişəndə çək (rAF ilə birləşdirilir — rəng seçici sürüşəndə də yüngül)
  const schedule = () => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const c = canvasRef.current
      const { w } = sizeRef.current
      if (!c || !w) return
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      drawScene(ctx, c.width, c.height, optsRef.current, 'preview')
    })
  }
  const scheduleRef = useRef(schedule)
  scheduleRef.current = schedule

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return undefined
    const fit = () => {
      const w = c.clientWidth
      if (!w) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const W = Math.round(w * dpr)
      const H = Math.round(w * PREVIEW_ASPECT * dpr)
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H }
      sizeRef.current = { w, dpr }
      scheduleRef.current()
    }
    fit()
    let ro = null
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(fit); ro.observe(c) }
    else window.addEventListener('resize', fit)
    return () => {
      if (ro) ro.disconnect(); else window.removeEventListener('resize', fit)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => { scheduleRef.current() }, [arch, border, field, medallion, colors, weave])

  const pickPalette = (id) => {
    setPaletteId(id)
    setColors({ ...paletteById(id).colors })
  }
  const setZone = (zone, hex) => {
    setPaletteId('')
    setColors(prev => ({ ...prev, [zone]: hex }))
  }

  const fileName = `seccade-${fmt}-muslims-cc.png`
  const download = async () => {
    const win = preopenWindow()
    setBusy(true)
    try {
      const blob = await renderExport(optsRef.current, fmt)
      if (blob) saveBlob(blob, fileName, win)
    } finally { setBusy(false) }
  }
  const share = async () => {
    setBusy(true)
    try {
      const blob = await renderExport(optsRef.current, fmt)
      if (!blob) return
      const file = new File([blob], fileName, { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file], title: u.title }) } catch { /* istifadəçi imtina etdi */ }
      } else saveBlob(blob, fileName)
    } finally { setBusy(false) }
  }

  const summary = `${u.canvas}: ${u.arches[arch]}, ${u.borders[border]}, ${u.fields[field]}, ${u.medallions[medallion]}`

  return (
    <section className="ui-card rg" aria-labelledby="rg-title" data-testid="rug-designer" data-arch={arch}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="rg-title" className="rg__title">{u.title}</h2>
      <p className="rg__lead">{u.lead}</p>
      <div className="rg__grid">
        <div className="rg__stage">
          <canvas ref={canvasRef} className="rg__canvas" data-testid="rug-canvas" role="img" aria-label={summary} />
        </div>
        <div className="rg__panel">
          <Chips legend={u.arch} items={ARCHES} value={arch} onPick={setArch} labels={u.arches} attr="data-arch-btn" />
          <Chips legend={u.border} items={BORDERS} value={border} onPick={setBorder} labels={u.borders} attr="data-border-btn" />
          <Chips legend={u.field} items={FIELDS} value={field} onPick={setField} labels={u.fields} attr="data-field-btn" />
          <Chips legend={u.medallion} items={MEDALLIONS} value={medallion} onPick={setMedallion} labels={u.medallions} attr="data-medallion-btn" />
          <fieldset className="rg__group">
            <legend>{u.palette}</legend>
            <div className="rg__pals">
              {PALETTES.map(p => (
                <button key={p.id} type="button" className="rg__pal" aria-pressed={paletteId === p.id}
                  data-palette-btn={p.id} onClick={() => pickPalette(p.id)}>
                  <span className="rg__pal-sw" aria-hidden="true">
                    {['field', 'border', 'spandrel', 'motif', 'accent'].map(z => <i key={z} style={{ background: p.colors[z] }} />)}
                  </span>
                  <span className="rg__pal-name">{u.palettes[p.id]}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="rg__group">
            <legend>{u.colors}</legend>
            <div className="rg__zones">
              {ZONES.map(z => (
                <label key={z} className="rg__zone">
                  <input type="color" value={colors[z]} onChange={e => setZone(z, e.target.value)} data-zone={z} />
                  <span>{u.zones[z]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="rg__toggle">
            <input type="checkbox" checked={weave} onChange={e => setWeave(e.target.checked)} data-testid="rug-weave" />
            <span>{u.weave}</span>
          </label>
          <fieldset className="rg__group">
            <legend>{u.format}</legend>
            <div className="rg__chips">
              {Object.keys(EXPORTS).map(f => (
                <button key={f} type="button" className="ui-chip" aria-pressed={fmt === f} data-format-btn={f} onClick={() => setFmt(f)}>
                  {u.formats[f]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="rg__btns">
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={download} disabled={busy} data-testid="rug-export">
              <Icon name="download" size={16} />{u.download}
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={share} disabled={busy}>
              <Icon name="share" size={16} />{u.share}
            </button>
          </div>
        </div>
      </div>
      <div className="rg__info">
        <p>{u.hist1}</p>
        <p>{u.hist2}</p>
        <p className="rg__note">{u.note}</p>
      </div>
    </section>
  )
}
