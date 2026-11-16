// ═══════════════════════════════════════════════════════
// IznikTile — İznik kaşı ustası (simmetrik kaşı naxışı çəkmək)
//
// • Barmaq/siçanla sərbəst çəkilir; hər xətt canlı olaraq 4 qat (X+Y güzgü)
//   və ya 8 qat (4 dönmə × güzgü) kaleydoskop simmetriyasına salınır.
// • Klassik İznik palitrası: kobalt göyü, firuzəyi, qabarıq «pomidor
//   qırmızısı», zümrüd yaşılı, qara kontur; ağ şirli fon.
// • Möhür motivləri (utils/iznik.js — vektor çoxbucaqlılar): lalə, qərənfil,
//   saz yarpağı, rozet, bulud zolağı. Möhür də simmetrikləşir.
// • «Divar» rejimi: bir kaşı 3×3 divar panelinə çevrilir (orada da çəkmək olur).
// • Model koordinatları kaşının eninə nisbidir — ixrac 1440×1440 kaşı və
//   1080×1920 telefon fonu (kaşılarla döşənmiş) kəskin yenidən çəkilir.
// • Şəbəkə, şəkil faylı, kitabxana yoxdur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced.js'
import { MOTIFS, SYMS, placeMotif, pointerToModel, stampAngle, symMatrices, wallLayout } from '../utils/iznik'
import { canShareFile, preopenWindow, saveBlob } from '../utils/quoteCard'
import '../styles/IznikTile.css'

const COLORS = [
  { id: 'cobalt', hex: '#1f3f99' },
  { id: 'turq', hex: '#2b9fa0' },
  { id: 'red', hex: '#b8322a' },
  { id: 'green', hex: '#2f7a4f' },
  { id: 'black', hex: '#1b1c22' },
]
const HEX = Object.fromEntries(COLORS.map(c => [c.id, c.hex]))
// Möhürdə ikinci (accent) və yarpaq rəngi seçilmiş rəngə görə
const ACCENT = { cobalt: 'red', turq: 'red', red: 'cobalt', green: 'red', black: 'turq' }
const LEAF = { cobalt: 'green', turq: 'green', red: 'green', green: 'turq', black: 'green' }
const SIZES = [
  { id: 's', w: 0.008, m: 0.06 },
  { id: 'm', w: 0.016, m: 0.09 },
  { id: 'l', w: 0.03, m: 0.13 },
]
const GROUND = '#fbf9f2'
const OUTLINE = '#1b1c22'
const GROUT = '#d9d4c7'
const TILE_PX = 1440
const WALL_W = 1080
const WALL_H = 1920
const UNDO_MAX = 40

const T = {
  az: {
    ey: 'İslam sənəti', title: 'İznik kaşı ustası',
    lead: 'Ağ şirli kaşının üzərində barmağınızla və ya siçanla çəkin — hər xətt kaleydoskop kimi əks olunur və simmetrik Osmanlı kaşısı yaranır. Sonra kaşını divara düzün.', // lang-ok[simmetrik]: az dilində «simmetrik» belə yazılır
    hint: 'Çəkin — fırça; motiv seçib toxunun — möhür', hintWall: 'Divar görünüşündə də çəkmək olar — hər kaşı eyni naxışı alır',
    canvas: 'İznik kaşısı',
    sym: 'Simmetriya', sym4: '4 qat', sym8: '8 qat', // lang-ok[Simmetriya]: az dilində elmi termin belə yazılır
    color: 'Rəng', size: 'Fırça ölçüsü', mode: 'Fırça növü', modeFill: 'Rəng fırçası', modeLine: 'Konturlu fırça',
    sizes: { s: 'İncə', m: 'Orta', l: 'Qalın' },
    colors: { cobalt: 'Kobalt göyü', turq: 'Firuzəyi', red: 'Pomidor qırmızısı', green: 'Zümrüd yaşılı', black: 'Qara kontur' },
    motifs: 'Motivlər', brush: 'Sərbəst fırça',
    m: { tulip: 'Lalə', carnation: 'Qərənfil', saz: 'Saz yarpağı', rosette: 'Rozet', cloud: 'Bulud zolağı' }, // lang-ok[Rozet]: az dilində «rozet» (memarlıq naxışı) belə yazılır
    wall: 'Divar görünüşü', undo: 'Geri al', clear: 'Təmizlə',
    dlTile: 'Kaşı (PNG)', dlWall: 'Telefon fonu', share: 'Paylaş',
    hist: 'İznik (Türkiyə) şəhərində bişirilən frit gilli kaşılar Osmanlı sənətinin şah əsərlərindəndir. XVI əsrdə onlar Süleymaniyə, Rüstəm Paşa və Sultan Əhməd («Göy məscid») kimi məscidlərin divarlarını bəzəyib. Kobalt göyü, firuzəyi və bir az qabarıq dayanan parlaq qırmızı bu kaşıların tanınan rənglərdir; lalə, qərənfil və əyri, dişli saz yarpaqları isə ən sevilən motivlərdir.',
    note: 'Naxış kaşının mərkəzinə görə əks olunur, ona görə kaşılar yan-yana düzüləndə kənarlar bir-birinə uyğun gəlir.',
  },
  en: {
    ey: 'Islamic art', title: 'Iznik tile maker',
    lead: 'Draw on the white glazed tile with your finger or mouse — every line is mirrored like a kaleidoscope and a symmetric Ottoman tile emerges. Then lay it out as a wall.',
    hint: 'Drag — brush; pick a motif and tap — stamp', hintWall: 'You can draw in the wall view too — every tile gets the same pattern',
    canvas: 'Iznik tile',
    sym: 'Symmetry', sym4: '4-fold', sym8: '8-fold',
    color: 'Colour', size: 'Brush size', mode: 'Brush type', modeFill: 'Colour brush', modeLine: 'Outlined brush',
    sizes: { s: 'Fine', m: 'Medium', l: 'Bold' },
    colors: { cobalt: 'Cobalt blue', turq: 'Turquoise', red: 'Tomato red', green: 'Emerald green', black: 'Black outline' },
    motifs: 'Motifs', brush: 'Free brush',
    m: { tulip: 'Tulip', carnation: 'Carnation', saz: 'Saz leaf', rosette: 'Rosette', cloud: 'Cloud band' },
    wall: 'Wall view', undo: 'Undo', clear: 'Clear',
    dlTile: 'Tile (PNG)', dlWall: 'Phone wallpaper', share: 'Share',
    hist: 'Fritware tiles fired in Iznik (Turkey) are among the masterpieces of Ottoman art. In the 16th century they adorned the walls of mosques such as the Süleymaniye, Rüstem Pasha and Sultan Ahmed (the “Blue Mosque”). Cobalt blue, turquoise and a bright, slightly raised red are their signature colours; tulips, carnations and curved, serrated saz leaves are the best-loved motifs.',
    note: 'The pattern is mirrored about the tile’s centre, so the edges match when tiles are laid side by side.',
  },
  ru: {
    ey: 'Исламское искусство', title: 'Мастер изникских изразцов',
    lead: 'Рисуйте пальцем или мышью по белой глазури — каждая линия отражается, как в калейдоскопе, и рождается симметричный османский изразец. Затем выложите из него стену.',
    hint: 'Ведите — кисть; выберите мотив и коснитесь — штамп', hintWall: 'Рисовать можно и в виде стены — каждая плитка получает тот же узор',
    canvas: 'Изникский изразец',
    sym: 'Симметрия', sym4: '4 луча', sym8: '8 лучей',
    color: 'Цвет', size: 'Размер кисти', mode: 'Тип кисти', modeFill: 'Цветная кисть', modeLine: 'Кисть с контуром',
    sizes: { s: 'Тонкая', m: 'Средняя', l: 'Толстая' },
    colors: { cobalt: 'Кобальтовый синий', turq: 'Бирюзовый', red: 'Томатный красный', green: 'Изумрудный', black: 'Чёрный контур' },
    motifs: 'Мотивы', brush: 'Свободная кисть',
    m: { tulip: 'Тюльпан', carnation: 'Гвоздика', saz: 'Лист саз', rosette: 'Розетка', cloud: 'Облачная лента' },
    wall: 'Вид стены', undo: 'Отменить', clear: 'Очистить',
    dlTile: 'Изразец (PNG)', dlWall: 'Обои для телефона', share: 'Поделиться',
    hist: 'Фаянсовые изразцы из Изника (Турция) — одни из шедевров османского искусства. В XVI веке они украсили стены таких мечетей, как Сулеймание, Рустем-паши и Султанахмет («Голубая мечеть»). Кобальтовый синий, бирюзовый и яркий, слегка выпуклый красный — их узнаваемые цвета, а тюльпаны, гвоздики и изогнутые зубчатые листья саз — любимые мотивы.',
    note: 'Узор отражается относительно центра плитки, поэтому края совпадают, когда плитки кладут рядом.',
  },
  ar: {
    ey: 'فن إسلامي', title: 'صانع بلاط إزنيق',
    lead: 'ارسم بإصبعك أو بالفأرة على البلاطة البيضاء المزججة — ينعكس كل خط كما في المشكال فتولد بلاطة عثمانية متناظرة. ثم رصّها جدارًا.',
    hint: 'اسحب — فرشاة؛ اختر زخرفة والمس — ختم', hintWall: 'يمكنك الرسم في عرض الجدار أيضًا — كل بلاطة تأخذ النقش نفسه',
    canvas: 'بلاطة إزنيق',
    sym: 'التناظر', sym4: 'رباعي', sym8: 'ثماني',
    color: 'اللون', size: 'حجم الفرشاة', mode: 'نوع الفرشاة', modeFill: 'فرشاة لون', modeLine: 'فرشاة بحدّ داكن',
    sizes: { s: 'رفيعة', m: 'متوسطة', l: 'عريضة' },
    colors: { cobalt: 'أزرق كوبالت', turq: 'فيروزي', red: 'أحمر طماطمي', green: 'أخضر زمردي', black: 'حدّ أسود' },
    motifs: 'الزخارف', brush: 'فرشاة حرة',
    m: { tulip: 'خزامى', carnation: 'قرنفل', saz: 'ورقة ساز', rosette: 'وردة', cloud: 'شريط سحابي' },
    wall: 'عرض الجدار', undo: 'تراجع', clear: 'مسح',
    dlTile: 'بلاطة (PNG)', dlWall: 'خلفية للهاتف', share: 'مشاركة',
    hist: 'بلاط الخزف المصنوع في إزنيق (تركيا) من روائع الفن العثماني. في القرن السادس عشر زيّن جدران مساجد مثل السليمانية ورستم باشا والسلطان أحمد («المسجد الأزرق»). الأزرق الكوبالتي والفيروزي والأحمر الزاهي البارز قليلًا ألوانه المميزة، والخزامى والقرنفل وأوراق الساز المقوّسة المسننة أحبّ زخارفه.',
    note: 'ينعكس النقش حول مركز البلاطة، لذلك تتطابق الحواف عند رصّ البلاطات جنبًا إلى جنب.',
  },
  tr: {
    ey: 'İslam sanatı', title: 'İznik çini ustası',
    lead: 'Beyaz sırlı çininin üzerine parmağınızla ya da fareyle çizin — her çizgi kaleydoskop gibi yansır ve simetrik bir Osmanlı çinisi ortaya çıkar. Sonra onu duvara dizin.',
    hint: 'Sürükleyin — fırça; motif seçip dokunun — damga', hintWall: 'Duvar görünümünde de çizebilirsiniz — her çini aynı deseni alır',
    canvas: 'İznik çinisi',
    sym: 'Simetri', sym4: '4 kat', sym8: '8 kat',
    color: 'Renk', size: 'Fırça boyu', mode: 'Fırça türü', modeFill: 'Renk fırçası', modeLine: 'Kontürlü fırça',
    sizes: { s: 'İnce', m: 'Orta', l: 'Kalın' },
    colors: { cobalt: 'Kobalt mavisi', turq: 'Turkuaz', red: 'Domates kırmızısı', green: 'Zümrüt yeşili', black: 'Siyah kontür' },
    motifs: 'Motifler', brush: 'Serbest fırça',
    m: { tulip: 'Lale', carnation: 'Karanfil', saz: 'Saz yaprağı', rosette: 'Rozet', cloud: 'Bulut bandı' },
    wall: 'Duvar görünümü', undo: 'Geri al', clear: 'Temizle',
    dlTile: 'Çini (PNG)', dlWall: 'Telefon duvar kâğıdı', share: 'Paylaş',
    hist: 'İznik’te (Türkiye) pişirilen frit hamurlu çiniler Osmanlı sanatının şaheserlerindendir. 16. yüzyılda Süleymaniye, Rüstem Paşa ve Sultan Ahmed («Mavi Cami») gibi camilerin duvarlarını süslediler. Kobalt mavisi, turkuaz ve hafifçe kabarık duran parlak kırmızı bu çinilerin tanınan renkleridir; lale, karanfil ve kıvrık, dişli saz yaprakları en sevilen motiflerdir.',
    note: 'Desen çininin merkezine göre yansıtılır, bu yüzden çiniler yan yana dizildiğinde kenarlar birbirine uyar.',
  },
}

/** Kontekst artıq kaşı koordinatındadır (0…1). Bir obyekti bir dəfə çək. */
function drawItem(ctx, it) {
  if (it.t === 'stroke') {
    const p = it.pts
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const path = () => {
      ctx.beginPath()
      ctx.moveTo(p[0], p[1])
      if (p.length === 2) ctx.lineTo(p[0] + 1e-5, p[1])
      for (let i = 2; i < p.length - 2; i += 2) {
        const mx = (p[i] + p[i + 2]) / 2, my = (p[i + 1] + p[i + 3]) / 2
        ctx.quadraticCurveTo(p[i], p[i + 1], mx, my)
      }
      if (p.length > 2) ctx.lineTo(p[p.length - 2], p[p.length - 1])
    }
    path()
    if (it.mode === 'line' && it.color !== 'black') {
      ctx.strokeStyle = OUTLINE
      ctx.lineWidth = it.w + 0.006
      ctx.stroke()
    }
    ctx.strokeStyle = HEX[it.color]
    ctx.lineWidth = it.w
    ctx.stroke()
    // Qabarıq qırmızı: incə açıq «şir» xətti
    if (it.color === 'red') {
      ctx.strokeStyle = 'rgba(255, 214, 196, 0.32)'
      ctx.lineWidth = it.w * 0.32
      ctx.stroke()
    }
    return
  }
  const parts = placeMotif(it.motif, it.x, it.y, it.size, it.angle)
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(0.0025, it.size * 0.045)
  ctx.strokeStyle = OUTLINE
  for (const part of parts) {
    const p = part.pts
    ctx.beginPath()
    ctx.moveTo(p[0], p[1])
    for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1])
    ctx.closePath()
    const col = part.role === 'main' ? it.color : part.role === 'accent' ? ACCENT[it.color] : LEAF[it.color]
    ctx.fillStyle = HEX[col]
    ctx.fill()
    ctx.stroke()
  }
}

/** Bir kaşını (0,0)–(size,size) sahəsinə çək (kontekstin cari transformu ilə) */
function paintTile(ctx, items, size) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, size, size)
  ctx.clip()
  ctx.fillStyle = GROUND
  ctx.fillRect(0, 0, size, size)
  ctx.scale(size, size)
  for (const it of items) {
    for (const m of symMatrices(it.sym)) {
      ctx.save()
      // p' = 0.5 + M(p − 0.5)
      ctx.translate(0.5, 0.5)
      ctx.transform(m[0], m[2], m[1], m[3], 0, 0)
      ctx.translate(-0.5, -0.5)
      drawItem(ctx, it)
      ctx.restore()
    }
  }
  // Şir parıltısı: yuxarı-sol işıq, kənarlarda yüngül kölgə
  const g = ctx.createRadialGradient(0.3, 0.25, 0.02, 0.3, 0.25, 0.75)
  g.addColorStop(0, 'rgba(255, 255, 255, 0.28)')
  g.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)')
  g.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1, 1)
  const e = ctx.createRadialGradient(0.5, 0.5, 0.45, 0.5, 0.5, 0.75)
  e.addColorStop(0, 'rgba(60, 50, 30, 0)')
  e.addColorStop(1, 'rgba(60, 50, 30, 0.1)')
  ctx.fillStyle = e
  ctx.fillRect(0, 0, 1, 1)
  ctx.restore()
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function drawMark(ctx, W, H, k = 1) {
  const label = 'muslims.cc'
  ctx.font = `600 ${Math.round(30 * k)}px Inter, system-ui, sans-serif`
  const w = ctx.measureText(label).width
  const x = W - w - 48 * k, y = H - 48 * k
  ctx.fillStyle = 'rgba(255, 252, 244, 0.8)'
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x - 18 * k, y - 36 * k, w + 36 * k, 50 * k, 25 * k)
  else ctx.rect(x - 18 * k, y - 36 * k, w + 36 * k, 50 * k)
  ctx.fill()
  ctx.fillStyle = 'rgba(27, 28, 34, 0.8)'
  ctx.fillText(label, x, y)
}

function renderExport(items, kind) {
  if (kind === 'wall') {
    const c = makeCanvas(WALL_W, WALL_H)
    const ctx = c.getContext('2d')
    const lay = wallLayout(WALL_W, WALL_H, 3)
    const tile = makeCanvas(Math.round(lay.size), Math.round(lay.size))
    paintTile(tile.getContext('2d'), items, tile.width)
    ctx.fillStyle = GROUT
    ctx.fillRect(0, 0, WALL_W, WALL_H)
    const gap = 3
    for (const t of lay.tiles) ctx.drawImage(tile, t.x + gap / 2, t.y + gap / 2, lay.size - gap, lay.size - gap)
    drawMark(ctx, WALL_W, WALL_H)
    return new Promise(res => c.toBlob(res, 'image/png'))
  }
  const c = makeCanvas(TILE_PX, TILE_PX)
  const ctx = c.getContext('2d')
  paintTile(ctx, items, TILE_PX)
  drawMark(ctx, TILE_PX, TILE_PX, 0.9)
  return new Promise(res => c.toBlob(res, 'image/png'))
}

export default function IznikTile() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [sym, setSym] = useState(8)
  const [color, setColor] = useState('cobalt')
  const [size, setSize] = useState('m')
  const [mode, setMode] = useState('line')
  const [motif, setMotif] = useState(null)
  const [wall, setWall] = useState(false)
  const [count, setCount] = useState(0)
  const [canUndo, setCanUndo] = useState(false)
  const [busy, setBusy] = useState(false)
  const [flipped, setFlipped] = useState(false)

  const canvasRef = useRef(null)
  const itemsRef = useRef([])
  const histRef = useRef([])
  const liveRef = useRef(null)
  const ptrRef = useRef(null)
  const rafRef = useRef(0)
  const scaleRef = useRef({ s: 0, dpr: 1 })
  const tileCanvasRef = useRef(null)
  const wallRef = useRef(false)
  wallRef.current = wall

  const draw = useCallback(() => {
    const c = canvasRef.current
    const { s, dpr } = scaleRef.current
    if (!c || !s) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const items = liveRef.current ? [...itemsRef.current, liveRef.current] : itemsRef.current
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (!wallRef.current) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paintTile(ctx, items, s)
      return
    }
    const px = Math.round(c.width / 3)
    let tc = tileCanvasRef.current
    if (!tc || tc.width !== px) { tc = makeCanvas(px, px); tileCanvasRef.current = tc }
    const tctx = tc.getContext('2d')
    tctx.setTransform(1, 0, 0, 1, 0, 0)
    paintTile(tctx, items, px)
    ctx.fillStyle = GROUT
    ctx.fillRect(0, 0, c.width, c.height)
    const step = c.width / 3, gap = Math.max(1, dpr)
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
      ctx.drawImage(tc, k * step + gap / 2, r * step + gap / 2, step - gap, step - gap)
    }
  }, [])

  const schedule = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => { rafRef.current = 0; draw() })
  }, [draw])

  // Ölçü: ResizeObserver + DPR (≤ 2)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return undefined
    const fit = () => {
      const w = c.clientWidth
      if (!w) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = Math.round(w * dpr)
      c.height = Math.round(w * dpr)
      scaleRef.current = { s: w, dpr }
      draw()
    }
    fit()
    let ro = null
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(fit); ro.observe(c) }
    else window.addEventListener('resize', fit)
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', fit) }
  }, [draw])

  useEffect(() => { draw() }, [wall, draw])
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const commit = (item) => {
    const h = histRef.current
    h.push(itemsRef.current)
    if (h.length > UNDO_MAX) h.shift()
    itemsRef.current = [...itemsRef.current, item]
    setCanUndo(true)
    setCount(itemsRef.current.length)
    draw()
  }

  const sz = SIZES.find(x => x.id === size)
  const stamp = (x, y) => commit({ t: 'stamp', motif, x, y, size: sz.m, angle: stampAngle(x, y), color, sym })

  const toModel = (e, tile) => {
    const r = canvasRef.current.getBoundingClientRect()
    return pointerToModel((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, wallRef.current, tile)
  }

  const onDown = (e) => {
    if (e.button && e.button !== 0) return
    e.preventDefault()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* köhnə brauzer */ }
    const p = toModel(e)
    if (motif) { stamp(p.x, p.y); return }
    // Divarda xətt kiçik kaşıya düşür — eni də ona uyğun kiçilmir (model nisbidir)
    liveRef.current = { t: 'stroke', color, w: sz.w, mode, sym, pts: [p.x, p.y] }
    ptrRef.current = { id: e.pointerId, tile: p.tile, lx: p.x, ly: p.y }
    schedule()
  }
  const onMove = (e) => {
    const st = ptrRef.current
    if (!st || st.id !== e.pointerId || !liveRef.current) return
    const p = toModel(e, st.tile)
    if (Math.hypot(p.x - st.lx, p.y - st.ly) < 0.003) return
    st.lx = p.x; st.ly = p.y
    liveRef.current.pts.push(p.x, p.y)
    schedule()
  }
  const onUp = (e) => {
    const st = ptrRef.current
    if (!st || st.id !== e.pointerId) return
    ptrRef.current = null
    const it = liveRef.current
    liveRef.current = null
    if (it && e.type === 'pointerup') commit(it)
    else draw()
  }
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    const x = 0.2 + Math.random() * 0.3, y = 0.2 + Math.random() * 0.3
    if (motif) stamp(x, y)
    else commit({ t: 'stamp', motif: 'rosette', x, y, size: sz.m, angle: stampAngle(x, y), color, sym })
  }

  const clear = () => {
    if (!itemsRef.current.length) return
    histRef.current.push(itemsRef.current)
    itemsRef.current = []
    setCanUndo(true)
    setCount(0)
    draw()
  }
  const undo = () => {
    const h = histRef.current
    if (!h.length) return
    liveRef.current = null
    ptrRef.current = null
    itemsRef.current = h.pop()
    setCanUndo(h.length > 0)
    setCount(itemsRef.current.length)
    draw()
  }

  const fileName = (kind) => (kind === 'wall' ? 'iznik-wallpaper-muslims-cc.png' : 'iznik-tile-muslims-cc.png')
  const download = async (kind) => {
    const win = preopenWindow()
    setBusy(true)
    try {
      const blob = await renderExport(itemsRef.current, kind)
      if (blob) saveBlob(blob, fileName(kind), win)
    } finally { setBusy(false) }
  }
  const share = async () => {
    const kind = wall ? 'wall' : 'tile'
    setBusy(true)
    try {
      const blob = await renderExport(itemsRef.current, kind)
      if (!blob) return
      const file = new File([blob], fileName(kind), { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file], title: u.title }) } catch { /* istifadəçi imtina etdi */ }
      } else saveBlob(blob, fileName(kind))
    } finally { setBusy(false) }
  }

  return (
    <section className="ui-card iznik" aria-labelledby="iznik-title" data-testid="iznik" data-strokes={count}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="iznik-title" className="iznik__title">{u.title}</h2>
      <p className="iznik__lead">{u.lead}</p>
      <div className="iznik__grid">
        <div className="iznik__stage">
          <canvas
            ref={canvasRef}
            className={`iznik__canvas ${wall ? 'is-wall' : 'is-tile'}${reduced || !flipped ? '' : ' iznik__canvas--anim'}`}
            data-testid="iznik-canvas"
            data-wall={wall ? '1' : '0'}
            role="img"
            tabIndex={0}
            aria-label={`${u.canvas}. ${wall ? u.hintWall : u.hint}`}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            onKeyDown={onKey}
          />
          <p className="iznik__hint">{wall ? u.hintWall : u.hint}</p>
        </div>
        <div className="iznik__panel">
          <div className="iznik__row">
            <fieldset className="iznik__group">
              <legend>{u.sym}</legend>
              <div className="iznik__seg">
                {SYMS.map(n => (
                  <button key={n} type="button" className="iznik__chip" data-sym={n}
                    aria-pressed={sym === n} onClick={() => setSym(n)}>
                    {n === 4 ? u.sym4 : u.sym8}
                  </button>
                ))}
              </div>
            </fieldset>
            <button type="button" className="iznik__chip iznik__wallbtn" data-testid="iznik-wall"
              aria-pressed={wall} onClick={() => { setFlipped(true); setWall(w => !w) }}>
              <Icon name="image" size={16} />{u.wall}
            </button>
          </div>
          <fieldset className="iznik__group">
            <legend>{u.color}</legend>
            <div className="iznik__swatches">
              {COLORS.map(c => (
                <button key={c.id} type="button" className={`iznik__sw${c.id === 'red' ? ' iznik__sw--raised' : ''}`}
                  style={{ '--sw': c.hex }} data-color={c.id}
                  aria-pressed={color === c.id} aria-label={u.colors[c.id]} title={u.colors[c.id]}
                  onClick={() => setColor(c.id)} />
              ))}
            </div>
          </fieldset>
          <div className="iznik__row">
            <fieldset className="iznik__group">
              <legend>{u.size}</legend>
              <div className="iznik__seg">
                {SIZES.map(s => (
                  <button key={s.id} type="button" className="iznik__chip" data-size={s.id}
                    aria-pressed={size === s.id} aria-label={u.sizes[s.id]} title={u.sizes[s.id]}
                    onClick={() => setSize(s.id)}>
                    <span className="iznik__dot" style={{ '--d': `${6 + SIZES.indexOf(s) * 5}px` }} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="iznik__group">
              <legend>{u.mode}</legend>
              <div className="iznik__seg">
                <button type="button" className="iznik__chip" data-mode="line" aria-pressed={mode === 'line'} onClick={() => setMode('line')}>{u.modeLine}</button>
                <button type="button" className="iznik__chip" data-mode="fill" aria-pressed={mode === 'fill'} onClick={() => setMode('fill')}>{u.modeFill}</button>
              </div>
            </fieldset>
          </div>
          <fieldset className="iznik__group">
            <legend>{u.motifs}</legend>
            <div className="iznik__seg iznik__seg--wrap">
              <button type="button" className="iznik__chip" data-motif="brush" aria-pressed={motif === null} onClick={() => setMotif(null)}>
                {u.brush}
              </button>
              {MOTIFS.map(m => (
                <button key={m} type="button" className="iznik__chip" data-motif={m}
                  aria-pressed={motif === m} onClick={() => setMotif(m)}>
                  {u.m[m]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="iznik__btns">
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={undo} disabled={!canUndo}>
              <Icon name="refresh" size={16} className="iznik__undo-ic" />{u.undo}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={clear} disabled={!count}>
              <Icon name="trash" size={16} />{u.clear}
            </button>
          </div>
          <div className="iznik__btns">
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" data-export="tile" onClick={() => download('tile')} disabled={busy}>
              <Icon name="download" size={16} />{u.dlTile}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" data-export="wall" onClick={() => download('wall')} disabled={busy}>
              <Icon name="phone" size={16} />{u.dlWall}
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={share} disabled={busy}>
              <Icon name="share" size={16} />{u.share}
            </button>
          </div>
          <p className="iznik__hist">{u.hist}</p>
          <p className="iznik__note">{u.note}</p>
        </div>
      </div>
    </section>
  )
}
