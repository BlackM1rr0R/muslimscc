// ═══════════════════════════════════════════════════════
// NasridTile — «Əndəlus kaşısının sehri»: Əlhəmranın Nəsri «pajarita»
// (quşcuq) kaşısı addım-addım necə yaranır.
//
// • Riyaziyyat utils/nasridTile.js-dədir: bərabərtərəfli üçbucağın hər
//   tərəfinin yarısı əyrilir, o biri yarısı həmin əyrinin orta nöqtə
//   ətrafında 180° dönməsidir → qonşu (180° döndərilmiş) kaşı boşluqsuz bitişir.
// • «Qurulmanı göstər»: üçbucaq → pajarita (morph 0→1) → uzaqlaşma, döşəmə.
//   Animasiya yalnız oynayanda rAF ilə; ekrandan çıxanda / vərəq gizlinəndə
//   dayanır; hərəkət azaldılıbsa dərhal son vəziyyət. Dəyişiklik olmayanda
//   kətan yenidən çəkilmir (yalnız state dəyişəndə).
// • Rəngləmə rejimi: kaşıya toxun — seçilmiş rəng; 2/3/4 rəngli simmetrik hazırlar.
// • İxrac: divar kağızı 1080×1920 və kvadrat 1080×1080 PNG, küncdə muslims.cc.
// • Günbəz təsviri yoxdur; şəbəkə, kitabxana yoxdur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced.js'
import {
  A, B, C, CENTROID, DEPTH_MAX, DEPTH_MIN, PRESETS, easeInOut, mapPts, presetSlot,
  tileAt, tileCenter, tileEdges, tileKey, tileOutline, tileTransform,
} from '../utils/nasridTile'
import { canShareFile, preopenWindow, saveBlob } from '../utils/quoteCard'
import '../styles/NasridTile.css'

// Əlhəmra kaşılarının rəngləri (yuva sırası utils/presetSlot üçün vacibdir)
const PALETTE = [
  { id: 'ochre', hex: '#c8912e' },
  { id: 'cobalt', hex: '#234e9a' },
  { id: 'emerald', hex: '#1d7a57' },
  { id: 'white', hex: '#f4efe3' },
]
const GROUT = '#17130f'
const PLASTER = '#efe7d6'
const FORMATS = { wall: [1080, 1920], square: [1080, 1080] }
const N = 14 // yarım tərəfdəki nöqtə sayı
// Oyun ssenarisi (saniyə): üçbucaq → morph → fasilə → döşəmə
const T_HOLD = 0.9, T_MORPH = 2.8, T_PAUSE = 0.6, T_ZOOM = 2.2
const T_TOTAL = T_HOLD + T_MORPH + T_PAUSE + T_ZOOM

const T = {
  az: {
    ey: 'İslam sənəti', title: 'Əndəlus kaşısının sehri',
    lead: 'Əlhəmranın məşhur «pajarita» (quşcuq) kaşısı adi bərabərtərəfli üçbucaqdan yaranır. Tərəfləri əyin, sonra kaşıları yan-yana düzün — boşluqsuz, sonsuz naxış alınır.',
    play: 'Qurulmanı göstər', stop: 'Dayandır', step: 'Addım',
    steps: [
      'Bərabərtərəfli üçbucaq: hər tərəfin ortasını qeyd edirik.',
      'Hər tərəfin bir yarısı çölə əyilir, o biri yarısı isə həmin əyrinin orta nöqtə ətrafında 180° döndərilmiş surətidir — hər qabarığı bir çökək tam tarazlayır.',
      'Qonşu kaşı eyni kaşının 180° döndərilmiş surətidir: tərəflər üst-üstə düşür, kaşılar müstəvini boşluqsuz doldurur.',
    ],
    morph: 'Çevrilmə', morph0: 'üçbucaq', morph1: 'pajarita',
    depth: 'Əyrinin dərinliyi', zoom: 'Görünüş', zoom0: 'bir kaşı', zoom1: 'döşəmə',
    paint: 'Rəngləmə rejimi', paintHint: 'Kaşıya toxunun — seçilmiş rəngə boyanır',
    palette: 'Rəng', colors: { ochre: 'Oxra', cobalt: 'Kobalt', emerald: 'Zümrüd', white: 'Ağ' },
    presets: 'Hazır rəngləmələr', two: '2 rəng', three: '3 rəng', four: '4 rəng',
    format: 'Şəkil ölçüsü', wall: 'Divar kağızı', square: 'Kvadrat',
    download: 'Yüklə', share: 'Paylaş', canvas: 'Pajarita kaşısı və onun döşəməsi',
    hist: 'Qranadadakı Əlhəmra sarayını XIII–XIV əsrlərdə Nəsrilər sülaləsi ucaldıb. Sarayın divarlarındakı kaşı mozaikaları — kəsilmiş şirli kaşı parçalarından yığılan, Məğribdə «zellic», İspaniyada «alikatado» adlanan naxışlar — həndəsi döşəmələri ilə məşhurdur. «Pajarita» (ispanca «quşcuq») ən tanınmış Nəsri kaşı formalarındandır.',
    note: 'Riyaziyyat: tərəfin yarısındakı əyri orta nöqtə ətrafında 180° dönmə ilə o biri yarıya keçirilir. Ona görə tərəf bu dönmədə özünə keçir, kaşının sahəsi üçbucağınkı qədər qalır, bütün döşəmə isə əsas kaşının köçürmələri və 180° dönmələrindən ibarətdir.',
  },
  en: {
    ey: 'Islamic art', title: 'The magic of the Andalusian tile',
    lead: 'The Alhambra’s famous “pajarita” (little bird) tile grows out of a plain equilateral triangle. Bend its sides, then lay the tiles side by side — an endless pattern with no gaps.',
    play: 'Show the construction', stop: 'Stop', step: 'Step',
    steps: [
      'An equilateral triangle: mark the midpoint of each side.',
      'One half of each side bends outward; the other half is the same curve turned 180° about the midpoint — every bulge is exactly compensated by a dent.',
      'The neighbouring tile is the same tile turned 180°: the sides coincide and the tiles fill the plane with no gaps.',
    ],
    morph: 'Morph', morph0: 'triangle', morph1: 'pajarita',
    depth: 'Curve depth', zoom: 'View', zoom0: 'one tile', zoom1: 'tiling',
    paint: 'Paint mode', paintHint: 'Tap a tile to paint it with the chosen colour',
    palette: 'Colour', colors: { ochre: 'Ochre', cobalt: 'Cobalt', emerald: 'Emerald', white: 'White' },
    presets: 'Symmetric colourings', two: '2 colours', three: '3 colours', four: '4 colours',
    format: 'Image size', wall: 'Wallpaper', square: 'Square',
    download: 'Download', share: 'Share', canvas: 'The pajarita tile and its tiling',
    hist: 'The Alhambra palace in Granada was built by the Nasrid dynasty in the 13th–14th centuries. Its walls are famous for tile mosaics — patterns assembled from cut glazed tile pieces, called zellij in the Maghreb and alicatado in Spain — with geometric tessellations. The “pajarita” (Spanish for “little bird”) is one of the best-known Nasrid tile shapes.',
    note: 'The maths: the curve on one half of a side is carried to the other half by a 180° turn about the midpoint. So each side maps onto itself under that turn, the tile keeps the triangle’s area, and the whole tiling consists of translations and 180° turns of one tile.',
  },
  ru: {
    ey: 'Исламское искусство', title: 'Волшебство андалусской плитки',
    lead: 'Знаменитая плитка Альгамбры «пахарита» («птичка») рождается из обычного равностороннего треугольника. Изогните его стороны, затем уложите плитки рядом — получится бесконечный узор без зазоров.',
    play: 'Показать построение', stop: 'Стоп', step: 'Шаг',
    steps: [
      'Равносторонний треугольник: отмечаем середину каждой стороны.',
      'Одна половина каждой стороны выгибается наружу, другая — та же кривая, повёрнутая на 180° вокруг середины: каждый выступ точно компенсируется впадиной.',
      'Соседняя плитка — та же плитка, повёрнутая на 180°: стороны совпадают, и плитки заполняют плоскость без зазоров.',
    ],
    morph: 'Превращение', morph0: 'треугольник', morph1: 'пахарита',
    depth: 'Глубина кривой', zoom: 'Вид', zoom0: 'одна плитка', zoom1: 'узор',
    paint: 'Режим раскраски', paintHint: 'Коснитесь плитки — она окрасится выбранным цветом',
    palette: 'Цвет', colors: { ochre: 'Охра', cobalt: 'Кобальт', emerald: 'Изумрудный', white: 'Белый' },
    presets: 'Симметричные раскраски', two: '2 цвета', three: '3 цвета', four: '4 цвета',
    format: 'Размер изображения', wall: 'Обои', square: 'Квадрат',
    download: 'Скачать', share: 'Поделиться', canvas: 'Плитка пахарита и её узор',
    hist: 'Дворец Альгамбра в Гранаде построила династия Насридов в XIII–XIV веках. Его стены знамениты плиточными мозаиками — узорами из вырезанных кусочков глазурованной плитки, которые в Магрибе называют «зеллидж», а в Испании «аликатадо», — с геометрическими разбиениями плоскости. «Пахарита» (по-испански «птичка») — одна из самых известных насридских форм плитки.',
    note: 'Математика: кривая на одной половине стороны переносится на другую половину поворотом на 180° вокруг середины. Поэтому сторона переходит в себя при этом повороте, площадь плитки равна площади треугольника, а весь узор состоит из параллельных переносов и поворотов на 180° одной плитки.',
  },
  ar: {
    ey: 'فن إسلامي', title: 'سحر البلاطة الأندلسية',
    lead: 'تنشأ بلاطة «الباخاريتا» (العصفور الصغير) الشهيرة في قصر الحمراء من مثلث متساوي الأضلاع بسيط. اثنِ أضلاعه ثم صفّ البلاطات جنبًا إلى جنب — فيتكوّن نقش لا نهائي بلا فراغات.',
    play: 'اعرض طريقة البناء', stop: 'إيقاف', step: 'الخطوة',
    steps: [
      'مثلث متساوي الأضلاع: نحدّد منتصف كل ضلع.',
      'ينثني نصف كل ضلع إلى الخارج، والنصف الآخر هو المنحنى نفسه مُدارًا 180° حول المنتصف — فكل بروز يعوّضه تجويف تمامًا.',
      'البلاطة المجاورة هي البلاطة نفسها مُدارة 180°: تتطابق الأضلاع وتملأ البلاطات المستوى بلا فراغات.',
    ],
    morph: 'التحويل', morph0: 'مثلث', morph1: 'باخاريتا',
    depth: 'عمق المنحنى', zoom: 'العرض', zoom0: 'بلاطة واحدة', zoom1: 'التبليط',
    paint: 'وضع التلوين', paintHint: 'المس بلاطة لتلوينها باللون المختار',
    palette: 'اللون', colors: { ochre: 'مغرة', cobalt: 'كوبالت', emerald: 'زمردي', white: 'أبيض' },
    presets: 'تلوينات متناظرة', two: 'لونان', three: '3 ألوان', four: '4 ألوان',
    format: 'مقاس الصورة', wall: 'خلفية للهاتف', square: 'مربع',
    download: 'تنزيل', share: 'مشاركة', canvas: 'بلاطة الباخاريتا وتبليطها',
    hist: 'بنت الدولة النصرية قصر الحمراء في غرناطة في القرنين السابع والثامن الهجريين (الثالث عشر والرابع عشر الميلاديين). وتشتهر جدرانه بفسيفساء البلاط — نقوش مركّبة من قطع البلاط المزجج المقصوصة، تُسمّى في المغرب «الزليج» وفي إسبانيا «أليكاتادو» — ذات التبليطات الهندسية. و«الباخاريتا» (أي «العصفور الصغير» بالإسبانية) من أشهر أشكال البلاط النصري.',
    note: 'الرياضيات: يُنقل المنحنى من نصف الضلع إلى نصفه الآخر بدوران 180° حول المنتصف، فينطبق الضلع على نفسه بهذا الدوران، وتبقى مساحة البلاطة مساوية لمساحة المثلث، ويتكوّن التبليط كله من انسحابات ودورانات 180° لبلاطة واحدة.',
  },
  tr: {
    ey: 'İslam sanatı', title: 'Endülüs çinisinin büyüsü',
    lead: 'Elhamra’nın ünlü «pajarita» (kuşçuk) çinisi sıradan bir eşkenar üçgenden doğar. Kenarlarını bükün, sonra çinileri yan yana dizin — boşluksuz, sonsuz bir desen ortaya çıkar.',
    play: 'Yapılışı göster', stop: 'Durdur', step: 'Adım',
    steps: [
      'Eşkenar üçgen: her kenarın orta noktasını işaretliyoruz.',
      'Her kenarın bir yarısı dışa bükülür, öteki yarısı aynı eğrinin orta nokta etrafında 180° döndürülmüş hâlidir — her çıkıntıyı bir girinti tam olarak dengeler.',
      'Komşu çini aynı çininin 180° döndürülmüş hâlidir: kenarlar çakışır ve çiniler düzlemi boşluksuz doldurur.',
    ],
    morph: 'Dönüşüm', morph0: 'üçgen', morph1: 'pajarita',
    depth: 'Eğrinin derinliği', zoom: 'Görünüm', zoom0: 'tek çini', zoom1: 'döşeme',
    paint: 'Boyama modu', paintHint: 'Bir çiniye dokunun — seçili renge boyanır',
    palette: 'Renk', colors: { ochre: 'Aşı boyası', cobalt: 'Kobalt', emerald: 'Zümrüt', white: 'Beyaz' },
    presets: 'Simetrik boyamalar', two: '2 renk', three: '3 renk', four: '4 renk',
    format: 'Görsel boyutu', wall: 'Duvar kâğıdı', square: 'Kare',
    download: 'İndir', share: 'Paylaş', canvas: 'Pajarita çinisi ve döşemesi',
    hist: 'Gırnata’daki Elhamra Sarayı’nı 13.–14. yüzyıllarda Nasrîler hanedanı inşa etti. Duvarları, kesilmiş sırlı çini parçalarından oluşan ve Mağrib’de «zellij», İspanya’da «alicatado» denen mozaiklerin geometrik döşemeleriyle ünlüdür. «Pajarita» (İspanyolca «kuşçuk») en bilinen Nasrî çini biçimlerinden biridir.',
    note: 'Matematik: kenarın bir yarısındaki eğri, orta nokta etrafında 180° döndürülerek öbür yarıya taşınır. Böylece kenar bu dönmede kendine gider, çininin alanı üçgeninkiyle aynı kalır ve bütün döşeme tek bir çininin ötelemeleri ile 180° dönmelerinden oluşur.',
  },
}

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const r2 = (x) => Math.round(x * 100) / 100

/** Görünüş eni (dünya vahidi) — spread 0: bir kaşı, 1: döşəmə */
const viewWidth = (spread) => 1.9 + (7.2 - 1.9) * easeInOut(clamp01(spread))

function tracePath(ctx, pts, toS) {
  ctx.beginPath()
  pts.forEach((p, k) => { const [x, y] = toS(p); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
  ctx.closePath()
}

/**
 * Səhnəni çək. W×H piksel, vw — dünya eni, opts: { spread, overlay, colorOf }
 */
function paintScene(ctx, W, H, vw, outline, edges, opts) {
  const { spread, overlay, colorOf } = opts
  const scale = W / vw
  const [cx, cy] = CENTROID
  const toS = (p) => [W / 2 + (p[0] - cx) * scale, H / 2 - (p[1] - cy) * scale]
  ctx.fillStyle = spread > 0.02 ? GROUT : PLASTER
  ctx.fillRect(0, 0, W, H)
  if (spread > 0.02 && spread < 1) {
    ctx.globalAlpha = 1 - clamp01(spread * 1.6)
    ctx.fillStyle = PLASTER
    ctx.fillRect(0, 0, W, H)
    ctx.globalAlpha = 1
  }
  const others = clamp01((spread - 0.04) / 0.5)
  const vh = H / scale
  const reach = Math.hypot(vw, vh) / 2 + 1
  const R = Math.ceil(reach / 0.85) + 1
  const lw = Math.max(1, scale * 0.022)
  ctx.lineJoin = 'round'
  ctx.strokeStyle = GROUT
  ctx.lineWidth = lw
  for (let j = -R; j <= R; j++) {
    for (let i = -R - Math.ceil(j / 2); i <= R - Math.floor(j / 2); i++) {
      for (const kind of ['up', 'down']) {
        const base = kind === 'up' && i === 0 && j === 0
        if (!base && others <= 0) continue
        const c = tileCenter(kind, i, j)
        if (Math.abs(c[0] - cx) > vw / 2 + 1 || Math.abs(c[1] - cy) > vh / 2 + 1) continue
        ctx.globalAlpha = base ? 1 : others
        tracePath(ctx, mapPts(tileTransform(kind, i, j), outline), toS)
        ctx.fillStyle = colorOf(kind, i, j)
        ctx.fill()
        ctx.stroke()
      }
    }
  }
  ctx.globalAlpha = 1
  if (overlay > 0.01) drawConstruction(ctx, edges, toS, scale, overlay)
}

/** Qurulma köməkçiləri: düz üçbucaq, orta nöqtələr, 180° oxları */
function drawConstruction(ctx, edges, toS, scale, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([scale * 0.03, scale * 0.025])
  ctx.strokeStyle = 'rgba(23,19,15,.55)'
  ctx.lineWidth = Math.max(1, scale * 0.008)
  tracePath(ctx, [A, B, C], toS)
  ctx.stroke()
  ctx.setLineDash([])
  const n = (edges[0].length - 1) / 2
  for (const e of edges) {
    // Birinci yarı — oxra, ikinci (döndərilmiş surət) — kobalt
    for (const [from, to, col] of [[0, n, '#e0a93f'], [n, 2 * n, '#5f8fe0']]) {
      ctx.beginPath()
      for (let k = from; k <= to; k++) { const [x, y] = toS(e[k]); if (k === from) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
      ctx.strokeStyle = col
      ctx.lineWidth = Math.max(2, scale * 0.02)
      ctx.stroke()
    }
    const [mx, my] = toS(e[n])
    // 180° dönmə qövsü
    ctx.beginPath()
    ctx.arc(mx, my, scale * 0.07, 0.2, Math.PI - 0.2)
    ctx.strokeStyle = 'rgba(23,19,15,.7)'
    ctx.lineWidth = Math.max(1, scale * 0.008)
    ctx.stroke()
    const ax = mx - Math.cos(0.2) * scale * 0.07, ay = my + Math.sin(0.2) * scale * 0.07
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(ax - scale * 0.025, ay - scale * 0.012)
    ctx.lineTo(ax + scale * 0.004, ay - scale * 0.03)
    ctx.closePath()
    ctx.fillStyle = 'rgba(23,19,15,.7)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(mx, my, Math.max(3, scale * 0.018), 0, Math.PI * 2)
    ctx.fillStyle = '#fffaf0'
    ctx.fill()
    ctx.strokeStyle = GROUT
    ctx.stroke()
  }
  ctx.restore()
}

function renderExport(fmt, outline, colorOf) {
  const [W, Hh] = FORMATS[fmt]
  const c = document.createElement('canvas')
  c.width = W
  c.height = Hh
  const ctx = c.getContext('2d')
  paintScene(ctx, W, Hh, fmt === 'wall' ? 4.6 : 5.4, outline, null, { spread: 1, overlay: 0, colorOf })
  const label = 'muslims.cc'
  ctx.font = '600 30px Inter, system-ui, sans-serif'
  const w = ctx.measureText(label).width
  const x = W - w - 56, y = Hh - 56
  ctx.fillStyle = 'rgba(255, 250, 238, 0.82)'
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x - 18, y - 36, w + 36, 50, 25)
  else ctx.rect(x - 18, y - 36, w + 36, 50)
  ctx.fill()
  ctx.fillStyle = 'rgba(23, 19, 15, 0.85)'
  ctx.fillText(label, x, y)
  return new Promise(res => c.toBlob(res, 'image/png'))
}

export default function NasridTile() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [morph, setMorph] = useState(0)
  const [depth, setDepth] = useState(0.35)
  const [spread, setSpread] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [paintMode, setPaintMode] = useState(false)
  const [slot, setSlot] = useState(0)
  const [preset, setPreset] = useState('two')
  const [overrides, setOverrides] = useState({})
  const [fmt, setFmt] = useState('wall')
  const [busy, setBusy] = useState(false)
  const [size, setSize] = useState({ w: 0, dpr: 1 })

  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const playRef = useRef({ t: 0, last: 0 })
  const visibleRef = useRef(true)
  const playingRef = useRef(false)
  playingRef.current = playing

  const colorOf = useCallback((kind, i, j) => {
    const s = overrides[tileKey(kind, i, j)]
    return PALETTE[s ?? presetSlot(preset, kind, i, j)].hex
  }, [overrides, preset])

  // Ölçü: ResizeObserver + DPR (≤ 2)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return undefined
    const fit = () => {
      const w = c.clientWidth
      if (w) setSize(s => (s.w === w ? s : { w, dpr: Math.min(2, window.devicePixelRatio || 1) }))
    }
    fit()
    let ro = null
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(fit); ro.observe(c) }
    else window.addEventListener('resize', fit)
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', fit) }
  }, [])

  // Çəkiliş — yalnız vəziyyət dəyişəndə
  useEffect(() => {
    const c = canvasRef.current
    if (!c || !size.w) return
    const px = Math.round(size.w * size.dpr)
    if (c.width !== px) { c.width = px; c.height = px }
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
    const outline = tileOutline(morph, depth, N)
    const edges = tileEdges(morph, depth, N)
    const overlay = paintMode ? 0 : clamp01(1 - spread * 2.2)
    paintScene(ctx, size.w, size.w, viewWidth(spread), outline, edges, { spread, overlay, colorOf })
  }, [morph, depth, spread, paintMode, colorOf, size])

  // Oyun: rAF yalnız oynayanda; görünməzdə dayanır
  const stopLoop = () => { cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
  const tick = useCallback((now) => {
    rafRef.current = 0
    const st = playRef.current
    const dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 0
    st.last = now
    st.t += dt
    const t = st.t
    const m = clamp01((t - T_HOLD) / T_MORPH)
    const z = clamp01((t - T_HOLD - T_MORPH - T_PAUSE) / T_ZOOM)
    setMorph(easeInOut(m))
    setSpread(z)
    if (t >= T_TOTAL) { setMorph(1); setSpread(1); setPlaying(false); return }
    if (visibleRef.current && !document.hidden) rafRef.current = requestAnimationFrame(tick)
  }, [])
  const startLoop = useCallback(() => {
    if (rafRef.current) return
    playRef.current.last = 0
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  useEffect(() => {
    if (!playing) { stopLoop(); return undefined }
    startLoop()
    return stopLoop
  }, [playing, startLoop])

  useEffect(() => {
    const el = rootRef.current
    let io = null
    if (el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => {
        visibleRef.current = e.isIntersecting
        if (e.isIntersecting && playingRef.current) startLoop()
      })
      io.observe(el)
    }
    const onVis = () => { if (!document.hidden && playingRef.current && visibleRef.current) startLoop() }
    document.addEventListener('visibilitychange', onVis)
    return () => { if (io) io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [startLoop])
  const play = () => {
    if (playing) { setPlaying(false); return }
    setPaintMode(false)
    if (reduced) { setMorph(1); setSpread(1); return }
    playRef.current = { t: 0, last: 0 }
    setMorph(0)
    setSpread(0)
    setPlaying(true)
  }

  const togglePaint = () => {
    setPlaying(false)
    const next = !paintMode
    if (next) { setSpread(1); if (morph < 0.5) setMorph(1) }
    setPaintMode(next)
  }
  const applyPreset = (p) => { setPreset(p); setOverrides({}) }

  const onCanvasDown = (e) => {
    if (!paintMode) return
    if (e.button && e.button !== 0) return
    e.preventDefault()
    const r = canvasRef.current.getBoundingClientRect()
    const vw = viewWidth(spread)
    const scale = r.width / vw
    const p = [CENTROID[0] + (e.clientX - r.left - r.width / 2) / scale, CENTROID[1] - (e.clientY - r.top - r.height / 2) / scale]
    const hit = tileAt(p, tileOutline(morph, depth, N))
    if (hit) setOverrides(o => ({ ...o, [hit.key]: slot }))
  }

  const exportBlob = () => renderExport(fmt, tileOutline(morph < 0.05 ? 1 : morph, depth, N), colorOf)
  const fileName = `pajarita-${fmt}-muslims-cc.png`
  const download = async () => {
    const win = preopenWindow()
    setBusy(true)
    try {
      const blob = await exportBlob()
      if (blob) saveBlob(blob, fileName, win)
    } finally { setBusy(false) }
  }
  const share = async () => {
    setBusy(true)
    try {
      const blob = await exportBlob()
      if (!blob) return
      const file = new File([blob], fileName, { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file], title: u.title }) } catch { /* istifadəçi imtina etdi */ }
      } else saveBlob(blob, fileName)
    } finally { setBusy(false) }
  }

  const stepIdx = spread >= 0.5 ? 2 : morph < 0.02 ? 0 : 1
  const pct = (x) => `${Math.round(x * 100)}%`
  return (
    <section ref={rootRef} className="ui-card ns" aria-labelledby="ns-title" data-testid="nasrid-tile" data-morph={r2(morph).toFixed(2)}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="ns-title" className="ns__title">{u.title}</h2>
      <p className="ns__lead">{u.lead}</p>
      <div className="ns__grid">
        <div className="ns__stage">
          <canvas
            ref={canvasRef}
            className={`ns__canvas${paintMode ? ' is-paint' : ''}`}
            role="img"
            aria-label={paintMode ? `${u.canvas}. ${u.paintHint}` : u.canvas}
            onPointerDown={onCanvasDown}
          />
          <p className="ns__step" aria-live="polite">
            <b>{u.step} {stepIdx + 1}/3.</b> {paintMode ? u.paintHint : u.steps[stepIdx]}
          </p>
        </div>
        <div className="ns__panel">
          <div className="ns__btns">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={play} aria-pressed={playing}>
              <Icon name={playing ? 'pause' : 'play'} size={16} />{playing ? u.stop : u.play}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={togglePaint} aria-pressed={paintMode}>
              <Icon name="palette" size={16} />{u.paint}
            </button>
          </div>
          <label className="ns__range">
            <span className="ns__rl"><span>{u.morph}</span><output>{pct(morph)}</output></span>
            <input type="range" min="0" max="1" step="0.01" value={morph} data-testid="nt-morph"
              onChange={e => { setPlaying(false); setMorph(Number(e.target.value)) }} />
            <span className="ns__ends"><span>{u.morph0}</span><span>{u.morph1}</span></span>
          </label>
          <label className="ns__range">
            <span className="ns__rl"><span>{u.depth}</span><output>{pct((depth - DEPTH_MIN) / (DEPTH_MAX - DEPTH_MIN))}</output></span>
            <input type="range" min={DEPTH_MIN} max={DEPTH_MAX} step="0.01" value={depth}
              onChange={e => setDepth(Number(e.target.value))} />
          </label>
          <label className="ns__range">
            <span className="ns__rl"><span>{u.zoom}</span></span>
            <input type="range" min="0" max="1" step="0.01" value={spread}
              onChange={e => { setPlaying(false); setSpread(Number(e.target.value)) }} />
            <span className="ns__ends"><span>{u.zoom0}</span><span>{u.zoom1}</span></span>
          </label>
          <fieldset className="ns__group">
            <legend>{u.palette}</legend>
            <div className="ns__swatches">
              {PALETTE.map((p, k) => (
                <button key={p.id} type="button" className="ns__sw" style={{ '--sw': p.hex }}
                  aria-pressed={slot === k} aria-label={u.colors[p.id]} title={u.colors[p.id]}
                  onClick={() => { setSlot(k); if (!paintMode) togglePaint() }} />
              ))}
            </div>
          </fieldset>
          <fieldset className="ns__group">
            <legend>{u.presets}</legend>
            <div className="ns__btns">
              {PRESETS.map(p => (
                <button key={p} type="button" className="ui-chip" aria-pressed={preset === p && !Object.keys(overrides).length}
                  onClick={() => applyPreset(p)}>{u[p]}</button>
              ))}
            </div>
          </fieldset>
          <fieldset className="ns__group">
            <legend>{u.format}</legend>
            <div className="ns__btns">
              {Object.keys(FORMATS).map(f => (
                <button key={f} type="button" className="ui-chip" aria-pressed={fmt === f} onClick={() => setFmt(f)}>
                  {u[f]} <small>{FORMATS[f].join('×')}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="ns__btns">
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={download} disabled={busy} data-testid="nt-export">
              <Icon name="download" size={16} />{u.download}
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={share} disabled={busy}>
              <Icon name="share" size={16} />{u.share}
            </button>
          </div>
          <p className="ns__hist">{u.hist}</p>
          <p className="ns__note">{u.note}</p>
        </div>
      </div>
    </section>
  )
}
