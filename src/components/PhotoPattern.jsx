// ═══════════════════════════════════════════════════════
// PhotoPattern — "Fotodan naxış": fotonun rəngləri → İslam həndəsi naxışı
//
//   <PhotoPattern />            (dil — useLang(); istəyə görə lang="en" ilə əvəz olunur)
//
// • İstifadəçi foto seçir (fayl, sürüklə-burax; telefonda seçici kameranı da təklif edir).
//   Şəkil YALNIZ cihazda açılır (createImageBitmap / Image + canvas), ~120 px-ə kiçildilir,
//   utils/photoPalette (k-means, sabit toxum) 5–6 dominant rəng çıxarır. Heç nə serverə
//   göndərilmir; fotonun özü nəticədə çəkilmir — yalnız rəngləri (insan təsviri olmur).
// • Həndəsə — utils/girih (Hankin): 4.8.8 → səkkizguşəli, 3.12.12 → onikiguşəli ulduzlar.
//   Hər tilin içindəki ulduz və künc "uçurtmaları" dəstin rəngləri ilə doldurulur, xətlər
//   ən açıq (fon açıqdırsa — ən qaranlıq) rəngdədir, kənarları əks rəngdə (strapColors).
// • Rəng nümunələrinin sırası = rolu (fon, ulduz, kiçik ulduz…). Toxun — seç, başqasına
//   toxun — yerini dəyiş; kilid — "Qarışdır" ona toxunmur.
// • Görünmə: tillər mərkəzdən kənara doğru açılır (~1.6 s); hərəkət azaldılıbsa — dərhal.
// • İxrac: divar kağızı 1080×1920 və kvadrat 1440 PNG — Web Share (fayl) və ya yükləmə.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced.js'
import { tiling, hankin, vertices } from '../utils/girih'
import { extractPalette, expandPalette, sortByLuminance, shuffleUnlocked, contrast, strapColors } from '../utils/photoPalette'
import { canShareFile, preopenWindow, saveBlob } from '../utils/quoteCard'
import '../styles/PhotoPattern.css'

const T = {
  az: {
    ey: 'Yaradıcılıq', title: 'Fotodan naxış',
    lead: 'Sevdiyiniz bir fotonu seçin — onun rəngləri ilə səkkiz və ya onikiguşəli İslam həndəsi naxışı yaranacaq. Telefonunuza divar kağızı edin.',
    pick: 'Foto seçin', drop: 'və ya bura sürükləyin',
    privacy: 'Foto yalnız sizin cihazınızda açılır — heç yerə yüklənmir. Naxışda fotonun özü görünmür, yalnız rəngləri götürülür.',
    samples: 'Hazır rənglər', sunset: 'Qürub', sea: 'Dəniz', rose: 'Gül bağı', photo: 'Fotonuz',
    kind: 'Ulduz', k8: '8 guşə', k12: '12 guşə',
    colors: 'Rənglər', hint: 'Rəngə toxunun, sonra başqasına — yerləri dəyişər. Kilid rəngi yerində saxlayır.',
    lock: 'Kilidlə', unlock: 'Kilidi aç', shuffle: 'Rəngləri qarışdır', replay: 'Yenidən aç',
    format: 'Ölçü', wall: 'Divar kağızı', square: 'Kvadrat',
    download: 'Yüklə', share: 'Paylaş', saved: 'Hazırdır',
    reading: 'Rənglər oxunur…', done: 'Rənglər fotodan götürüldü', err: 'Bu şəkli açmaq olmadı. Başqa foto seçin (JPG və ya PNG).',
    roles: ['Fon', 'Ulduz', 'Kiçik ulduz', 'İkinci ulduz', 'Mərkəz', 'Künclər'], line: 'Xətt',
    canvas: 'Fotonun rəngləri ilə İslam həndəsi naxışı',
  },
  en: {
    ey: 'Create', title: 'Pattern from a photo',
    lead: 'Pick a photo you love — its colours become an eight- or twelve-pointed Islamic geometric pattern. Make it your phone wallpaper.',
    pick: 'Choose a photo', drop: 'or drop it here',
    privacy: 'Your photo is opened only on your device — nothing is uploaded. The photo itself is not shown in the pattern; only its colours are used.',
    samples: 'Ready palettes', sunset: 'Sunset', sea: 'Sea', rose: 'Rose garden', photo: 'Your photo',
    kind: 'Star', k8: '8 points', k12: '12 points',
    colors: 'Colours', hint: 'Tap a colour, then another — they swap places. The lock keeps a colour in place.',
    lock: 'Lock', unlock: 'Unlock', shuffle: 'Shuffle colours', replay: 'Reveal again',
    format: 'Size', wall: 'Wallpaper', square: 'Square',
    download: 'Download', share: 'Share', saved: 'Done',
    reading: 'Reading colours…', done: 'Colours taken from the photo', err: 'Could not open this image. Please choose another photo (JPG or PNG).',
    roles: ['Ground', 'Star', 'Small star', 'Second star', 'Centre', 'Corners'], line: 'Line',
    canvas: 'Islamic geometric pattern in the colours of the photo',
  },
  ru: {
    ey: 'Творчество', title: 'Узор из фотографии',
    lead: 'Выберите любимое фото — из его цветов получится восьми- или двенадцатиконечный исламский геометрический орнамент. Сделайте из него обои для телефона.',
    pick: 'Выбрать фото', drop: 'или перетащите сюда',
    privacy: 'Фото открывается только на вашем устройстве — ничего не загружается. Само фото в узоре не показывается, берутся только его цвета.',
    samples: 'Готовые палитры', sunset: 'Закат', sea: 'Море', rose: 'Розовый сад', photo: 'Ваше фото',
    kind: 'Звезда', k8: '8 лучей', k12: '12 лучей',
    colors: 'Цвета', hint: 'Коснитесь цвета, затем другого — они поменяются местами. Замок оставляет цвет на месте.',
    lock: 'Закрепить', unlock: 'Открепить', shuffle: 'Перемешать цвета', replay: 'Показать снова',
    format: 'Размер', wall: 'Обои', square: 'Квадрат',
    download: 'Скачать', share: 'Поделиться', saved: 'Готово',
    reading: 'Считываем цвета…', done: 'Цвета взяты из фото', err: 'Не удалось открыть это изображение. Выберите другое фото.',
    roles: ['Фон', 'Звезда', 'Малая звезда', 'Вторая звезда', 'Центр', 'Углы'], line: 'Линия',
    canvas: 'Исламский геометрический орнамент в цветах фотографии',
  },
  ar: {
    ey: 'إبداع', title: 'زخرفة من صورة',
    lead: 'اختر صورة تحبها — فتتحوّل ألوانها إلى زخرفة هندسية إسلامية بنجوم ثمانية أو اثني عشرية. اجعلها خلفية لهاتفك.',
    pick: 'اختر صورة', drop: 'أو اسحبها إلى هنا',
    privacy: 'تُفتح الصورة على جهازك فقط — لا يُرفع شيء. ولا تظهر الصورة نفسها في الزخرفة، بل تؤخذ ألوانها فقط.',
    samples: 'ألوان جاهزة', sunset: 'الغروب', sea: 'البحر', rose: 'حديقة الورد', photo: 'صورتك',
    kind: 'النجمة', k8: '8 رؤوس', k12: '12 رأسًا',
    colors: 'الألوان', hint: 'المس لونًا ثم آخر — يتبادلان المكان. القفل يُبقي اللون في مكانه.',
    lock: 'قفل', unlock: 'فتح القفل', shuffle: 'امزج الألوان', replay: 'أظهرها من جديد',
    format: 'المقاس', wall: 'خلفية', square: 'مربع',
    download: 'تنزيل', share: 'مشاركة', saved: 'تم',
    reading: 'تُقرأ الألوان…', done: 'أُخذت الألوان من الصورة', err: 'تعذّر فتح هذه الصورة. اختر صورة أخرى.',
    roles: ['الأرضية', 'النجمة', 'نجمة صغيرة', 'نجمة ثانية', 'المركز', 'الزوايا'], line: 'الخط',
    canvas: 'زخرفة هندسية إسلامية بألوان الصورة',
  },
  tr: {
    ey: 'Üret', title: 'Fotoğraftan desen',
    lead: 'Sevdiğiniz bir fotoğrafı seçin — renklerinden sekiz ya da on iki köşeli bir İslami geometrik desen oluşsun. Telefonunuza duvar kâğıdı yapın.',
    pick: 'Fotoğraf seçin', drop: 'ya da buraya sürükleyin',
    privacy: 'Fotoğraf yalnızca cihazınızda açılır — hiçbir yere yüklenmez. Desende fotoğrafın kendisi görünmez, yalnızca renkleri alınır.',
    samples: 'Hazır renkler', sunset: 'Gün batımı', sea: 'Deniz', rose: 'Gül bahçesi', photo: 'Fotoğrafınız',
    kind: 'Yıldız', k8: '8 köşe', k12: '12 köşe',
    colors: 'Renkler', hint: 'Bir renge, sonra başka birine dokunun — yer değiştirirler. Kilit rengi yerinde tutar.',
    lock: 'Kilitle', unlock: 'Kilidi aç', shuffle: 'Renkleri karıştır', replay: 'Yeniden göster',
    format: 'Boyut', wall: 'Duvar kâğıdı', square: 'Kare',
    download: 'İndir', share: 'Paylaş', saved: 'Hazır',
    reading: 'Renkler okunuyor…', done: 'Renkler fotoğraftan alındı', err: 'Bu görsel açılamadı. Başka bir fotoğraf seçin (JPG ya da PNG).',
    roles: ['Zemin', 'Yıldız', 'Küçük yıldız', 'İkinci yıldız', 'Merkez', 'Köşeler'], line: 'Çizgi',
    canvas: 'Fotoğrafın renkleriyle İslami geometrik desen',
  },
}

// Rol sırası: [fon, ulduz, kiçik ulduz, ikinci ulduz, mərkəz, künclər]
const SAMPLES = {
  sunset: ['#2a1638', '#f4a259', '#e2604b', '#ffd8a0', '#8c3a5e', '#4a2148'],
  sea: ['#0a2a3b', '#2f8f9d', '#7fd1c7', '#e6f4f1', '#f2c14e', '#14465a'],
  rose: ['#3b1f2b', '#e8a0b4', '#9cbf8a', '#f7e3e8', '#c2456b', '#2f4a34'],
}
const KINDS = ['8', '12']
const THETA = { '8': 67.5, '12': 70 }
const FORMATS = { wall: [1080, 1920], square: [1440, 1440] }
const ANALYSE = 120
const REVEAL_MS = 1600
const MARK = 'muslims.cc'

// Parlaqlığa görə sıralanmış dəstdən ilk rol sırası (fon — ən qaranlıq, ulduz — açıq)
function rolesFromSorted(s) {
  if (s.length >= 6) return [s[0], s[4], s[2], s[5], s[1], s[3]]
  if (s.length === 5) return [s[0], s[3], s[2], s[4], s[1]]
  return s
}

// ── Həndəsə: hər til üçün ulduz, künc uçurtmaları, xətlər (girih.hankin-dən) ──
function tileRegions(poly, theta) {
  const segs = hankin([poly], theta)
  const v = vertices(poly)
  const star = [], kites = []
  const full = segs.length === poly.n * 2
  for (let j = 0; j < segs.length; j += 2) {
    const a = segs[j], b = segs[j + 1]
    const m1 = [a[0], a[1]], p = [a[2], a[3]], m2 = [b[0], b[1]]
    star.push(m1, p)
    if (full) kites.push([m1, v[(j / 2 + 1) % poly.n], m2, p])
  }
  const inner = star.map(([x, y]) => [poly.c[0] + (x - poly.c[0]) * 0.42, poly.c[1] + (y - poly.c[1]) * 0.42])
  return { star, kites, inner, segs }
}

const geoCache = new Map()
function geometry(kind, W, H) {
  const key = `${kind}|${W}|${H}`
  if (geoCache.has(key)) return geoCache.get(key)
  const m = Math.min(W, H)
  const s = m / (kind === '8' ? 10 : 15)
  const L = kind === '8' ? s * (1 + Math.SQRT2) : 2 * (s / (2 * Math.tan(Math.PI / 12)))
  const ay = kind === '8' ? L : (Math.sqrt(3) * L) / 2
  const polys = tiling(kind, s, W + L * 3, H + L * 3)
  // Böyük til kətanın mərkəzinə düşsün
  const big = polys.filter(p => p.n >= 8)
  const ref = big.reduce((b, p) => (Math.hypot(p.c[0] - W / 2 - L, p.c[1] - H / 2 - L) < Math.hypot(b.c[0] - W / 2 - L, b.c[1] - H / 2 - L) ? p : b), big[0])
  const dx = W / 2 - ref.c[0], dy = H / 2 - ref.c[1]
  const maxD = Math.hypot(W, H) / 2 + L
  const theta = (THETA[kind] * Math.PI) / 180
  const tiles = []
  for (const p0 of polys) {
    const p = { ...p0, c: [p0.c[0] + dx, p0.c[1] + dy] }
    if (p.c[0] < -p.R || p.c[0] > W + p.R || p.c[1] < -p.R || p.c[1] > H + p.R) continue
    // Rəng qrupu: 8 — şahmat (2), 12 — altıbucaqlı şəbəkənin düzgün 3-rənglənməsi
    let group = 0
    const rx = (p.c[0] - W / 2) / L, ry = (p.c[1] - H / 2) / ay
    if (p.n >= 8) {
      if (kind === '8') group = (Math.round(rx) + Math.round(ry)) & 1
      else {
        const j = Math.round(ry), i = Math.round(rx - (j & 1 ? 0.5 : 0))
        const q = i - (j - (j & 1)) / 2
        group = (((q - j) % 3) + 3) % 3
      }
    }
    tiles.push({ p, big: p.n >= 8, group, d: Math.hypot(p.c[0] - W / 2, p.c[1] - H / 2) / maxD, ...tileRegions(p, theta) })
  }
  tiles.sort((a, b) => a.d - b.d)
  const g = { tiles, s }
  if (geoCache.size > 12) geoCache.clear()
  geoCache.set(key, g)
  return g
}

const path = (ctx, pts) => { pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath() }
const ease = (k) => 1 - (1 - k) ** 3

/** Naxışı çək. prog: 0..1 — mərkəzdən kənara açılma */
function draw(ctx, W, H, kind, pal, prog = 1) {
  const [ground, star, small, alt = star, centre = small, corners = ground] = pal
  const bigCols = kind === '8' ? [star, alt] : [star, alt, centre]
  const { line, edge } = strapColors(pal)
  const { tiles, s } = geometry(kind, W, H)
  ctx.save()
  ctx.fillStyle = ground; ctx.fillRect(0, 0, W, H)
  const band = Math.max(2, s * 0.13)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  // Görünən tillər və açılma əmsalı (0..1) — mərkəzdən kənara
  const vis = []
  for (const t of tiles) {
    const k = prog >= 1 ? 1 : Math.max(0, Math.min(1, (prog * 1.3 - t.d) / 0.3))
    if (k > 0) vis.push([t, k])
  }
  const each = (fn) => {
    for (const [t, k] of vis) {
      ctx.save()
      if (k < 1) {
        const e = ease(k)
        ctx.globalAlpha = Math.min(1, k * 1.6)
        ctx.translate(t.p.c[0], t.p.c[1]); ctx.scale(e, e); ctx.translate(-t.p.c[0], -t.p.c[1])
      }
      fn(t)
      ctx.restore()
    }
  }
  const segs = (t) => { ctx.beginPath(); for (const g of t.segs) { ctx.moveTo(g[0], g[1]); ctx.lineTo(g[2], g[3]) } ctx.stroke() }
  // 1) Doldurmalar
  each((t) => {
    if (corners !== ground && t.kites.length) {
      ctx.fillStyle = corners
      ctx.beginPath(); for (const q of t.kites) path(ctx, q); ctx.fill()
    }
    if (!t.star.length) return
    const fill = t.big ? bigCols[t.group % bigCols.length] : small
    ctx.fillStyle = fill
    ctx.beginPath(); path(ctx, t.star); ctx.fill()
    if (t.big) { ctx.fillStyle = centre === fill ? ground : centre; ctx.beginPath(); path(ctx, t.inner); ctx.fill() }
  })
  // 2) Zolağın kənarı, 3) zolağın özü — ayrı keçidlərdə ki, qonşu tillərin birləşməsində ləkə qalmasın
  ctx.strokeStyle = edge; ctx.lineWidth = band
  each(segs)
  ctx.strokeStyle = line; ctx.lineWidth = band * 0.55
  each(segs)
  // Kiçik nişan — sağ alt küncdə
  if (prog >= 1) {
    const fs = Math.max(10, Math.round(Math.min(W, H) * 0.026))
    ctx.font = `600 ${fs}px system-ui, -apple-system, "Segoe UI", sans-serif`
    const tw = ctx.measureText(MARK).width
    const pad = fs * 0.55, x = W - tw - pad * 3, y = H - fs * 2.4
    ctx.globalAlpha = 0.82
    ctx.fillStyle = ground
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(x - pad, y - pad * 0.6, tw + pad * 2, fs + pad * 1.2, fs)
    else ctx.rect(x - pad, y - pad * 0.6, tw + pad * 2, fs + pad * 1.2)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.fillStyle = contrast(line, ground) >= 3 ? line : (contrast('#ffffff', ground) > contrast('#111111', ground) ? '#ffffff' : '#111111')
    ctx.textBaseline = 'top'
    ctx.fillText(MARK, x, y)
  }
  ctx.restore()
}

// ── Foto → rənglər (yalnız cihazda) ──
async function decodeSmall(file) {
  const c = document.createElement('canvas')
  const put = (src, w, h) => {
    const k = Math.min(1, ANALYSE / Math.max(w, h))
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k))
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(src, 0, 0, c.width, c.height)
    return ctx.getImageData(0, 0, c.width, c.height).data
  }
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file)
      try { return put(bmp, bmp.width, bmp.height) } finally { bmp.close?.() }
    } catch { /* Image ilə yenidən cəhd */ }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
    return put(img, img.naturalWidth, img.naturalHeight)
  } finally { URL.revokeObjectURL(url) }
}

function paletteFromPixels(data) {
  const raw = extractPalette(data, { k: 6, seed: 7 }).slice(0, 6).map(c => c.hex)
  const full = raw.length >= 5 ? raw : expandPalette(raw, 5)
  return rolesFromSorted(sortByLuminance(full))
}

const LockIcon = ({ open }) => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <rect x="3" y="7" width="10" height="7" rx="1.6" fill="currentColor" />
    <path d={open ? 'M5.5 7V5a2.5 2.5 0 0 1 4.9-.7' : 'M5.5 7V5a2.5 2.5 0 0 1 5 0v2'} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export default function PhotoPattern({ lang: langProp }) {
  const { lang: ctxLang } = useLang() || {}
  const t = pickUi(T, langProp || ctxLang)
  const reduced = useReduced()
  const [source, setSource] = useState('sunset')
  const [pal, setPal] = useState(SAMPLES.sunset)
  const [locked, setLocked] = useState(() => SAMPLES.sunset.map(() => false))
  const [sel, setSel] = useState(-1)
  const [kind, setKind] = useState('8')
  const [fmt, setFmt] = useState('wall')
  const [run, setRun] = useState(0)
  const [seen, setSeen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [err, setErr] = useState('')
  const [drag, setDrag] = useState(false)
  const cvRef = useRef(null)
  const shuffleSeed = useRef(1)
  const progRef = useRef(1)
  const stateRef = useRef({ kind, pal })
  stateRef.current = { kind, pal }

  const paint = useCallback((prog) => {
    const cv = cvRef.current; if (!cv) return
    const w = Math.round(cv.clientWidth), h = Math.round(cv.clientHeight)
    if (!w || !h) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    progRef.current = prog
    draw(ctx, w, h, stateRef.current.kind, stateRef.current.pal, prog)
  }, [])

  // İlk görünüşdə açılsın (ekrandan kənarda boşa animasiya olmasın)
  useEffect(() => {
    const cv = cvRef.current
    if (!cv || typeof IntersectionObserver === 'undefined') { setSeen(true); return undefined }
    const io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) { setSeen(true); io.disconnect() } }, { threshold: 0.25 })
    io.observe(cv)
    return () => io.disconnect()
  }, [])

  // Açılma animasiyası — yeni rəng mənbəyi, ulduz növü, "yenidən aç"
  useEffect(() => {
    if (reduced || !seen) { paint(1); return undefined }
    let raf = 0; const t0 = performance.now()
    const tick = () => { const p = Math.min(1, (performance.now() - t0) / REVEAL_MS); paint(p); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); if (progRef.current < 1) paint(1) }
  }, [run, seen, reduced, paint])
  // Rəng yerdəyişməsi, ölçü — animasiyasız dərhal (açılma gedirsə, onun kadrına qoşulur)
  useEffect(() => { if (progRef.current >= 1) paint(1) }, [pal, fmt, paint])
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => { if (progRef.current >= 1) paint(1) })
    if (cvRef.current) ro.observe(cvRef.current)
    return () => ro.disconnect()
  }, [paint])

  const applyPalette = (cols, src) => {
    setPal(cols); setLocked(cols.map(() => false)); setSel(-1); setSource(src); setRun(r => r + 1)
  }
  const pickSample = (id) => { setErr(''); setStatus(''); applyPalette(SAMPLES[id], id) }

  const onFile = async (file) => {
    if (!file) return
    setErr('')
    if (file.type && !file.type.startsWith('image/')) { setErr(t.err); return }
    setBusy(true); setStatus(t.reading)
    try {
      const data = await decodeSmall(file)
      const cols = paletteFromPixels(data)
      if (cols.length < 2) throw new Error('empty')
      applyPalette(cols, 'photo')
      setStatus(t.done)
    } catch {
      setStatus(''); setErr(t.err)
    } finally { setBusy(false) }
  }

  const tapSwatch = (i) => {
    if (sel === -1) { setSel(i); return }
    if (sel === i) { setSel(-1); return }
    setPal(p => { const n = p.slice(); [n[sel], n[i]] = [n[i], n[sel]]; return n })
    setLocked(l => { const n = l.slice(); [n[sel], n[i]] = [n[i], n[sel]]; return n })
    setSel(-1)
  }
  const toggleLock = (i) => setLocked(l => l.map((v, j) => (j === i ? !v : v)))
  const shuffle = () => {
    // Eyni nəticə təkrarlanmasın deyə bir neçə toxum yoxla
    for (let n = 0; n < 8; n++) {
      const next = shuffleUnlocked(pal, locked, shuffleSeed.current++)
      if (next.join() !== pal.join()) { setPal(next); break }
    }
    setSel(-1)
  }

  const exportBlob = () => {
    const [W, H] = FORMATS[fmt]
    const c = document.createElement('canvas'); c.width = W; c.height = H
    draw(c.getContext('2d'), W, H, kind, pal, 1)
    return new Promise(res => c.toBlob(res, 'image/png'))
  }
  const fileName = `naxis-${kind}-${fmt}-muslims-cc.png`
  const flash = () => { setStatus(t.saved); setTimeout(() => setStatus(s => (s === t.saved ? '' : s)), 2500) }
  const download = async () => {
    const win = preopenWindow()
    setBusy(true)
    try { const blob = await exportBlob(); if (blob) { saveBlob(blob, fileName, win); flash() } } finally { setBusy(false) }
  }
  const share = async () => {
    setBusy(true)
    try {
      const blob = await exportBlob()
      if (!blob) return
      const file = new File([blob], fileName, { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file], title: t.title }) } catch { /* istifadəçi imtina etdi */ }
      } else { saveBlob(blob, fileName); flash() }
    } finally { setBusy(false) }
  }

  const line = useMemo(() => strapColors(pal).line, [pal])

  return (
    <section className="ui-section pp" aria-labelledby="pp-title" data-testid="photo-pattern" data-colors={pal.length}>
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="pp-title" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
        <div className="pp__grid">
          <div className={`pp__stage pp__stage--${fmt}`}>
            <canvas ref={cvRef} className="pp__cv" role="img" aria-label={`${t.canvas}: ${t[`k${kind}`]}`} data-testid="pp-canvas" />
          </div>
          <div className="ui-card pp__panel">
            <label
              className={`pp__drop${drag ? ' is-drag' : ''}${busy ? ' is-busy' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer?.files?.[0]) }}
            >
              <input type="file" accept="image/*" className="pp__file" data-testid="pp-file"
                onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
              <Icon name="image" className="pp__drop-ic" />
              <span className="pp__drop-t"><b>{t.pick}</b> <span>{t.drop}</span></span>
            </label>
            <p className="pp__privacy"><Icon name="shield" className="pp__privacy-ic" />{t.privacy}</p>
            {err && <p className="pp__err" role="alert">{err}</p>}

            <fieldset className="pp__field">
              <legend>{t.samples}</legend>
              <div className="pp__samples">
                {Object.keys(SAMPLES).map(id => (
                  <button key={id} type="button" className={`pp__sample${source === id ? ' is-on' : ''}`} aria-pressed={source === id} onClick={() => pickSample(id)}>
                    <span className="pp__sample-dots" aria-hidden="true">{SAMPLES[id].slice(0, 4).map(c => <i key={c} style={{ background: c }} />)}</span>
                    {t[id]}
                  </button>
                ))}
                {source === 'photo' && <span className="pp__sample is-on pp__sample--photo"><Icon name="image" className="pp__sample-ic" />{t.photo}</span>}
              </div>
            </fieldset>

            <fieldset className="pp__field">
              <legend>{t.colors}</legend>
              <ul className="pp__swatches">
                {pal.map((c, i) => (
                  <li key={i} className="pp__sw-item">
                    <button type="button" className={`pp__sw${sel === i ? ' is-sel' : ''}`} style={{ '--sw': c }}
                      aria-pressed={sel === i} aria-label={`${t.roles[i] || ''} ${c}`} onClick={() => tapSwatch(i)} data-testid="pp-swatch" data-color={c} />
                    <span className="pp__sw-role">{t.roles[i]}</span>
                    <button type="button" className={`pp__lock${locked[i] ? ' is-on' : ''}`} aria-pressed={!!locked[i]}
                      aria-label={`${locked[i] ? t.unlock : t.lock}: ${t.roles[i] || c}`} title={locked[i] ? t.unlock : t.lock} onClick={() => toggleLock(i)}>
                      <LockIcon open={!locked[i]} />
                    </button>
                  </li>
                ))}
                <li className="pp__sw-item pp__sw-item--line" aria-hidden="true">
                  <span className="pp__sw pp__sw--line" style={{ '--sw': line }} />
                  <span className="pp__sw-role">{t.line}</span>
                </li>
              </ul>
              <p className="pp__hint">{t.hint}</p>
            </fieldset>

            <div className="pp__row">
              <fieldset className="pp__field">
                <legend>{t.kind}</legend>
                <div className="pp__seg" role="radiogroup" aria-label={t.kind}>
                  {KINDS.map(k => (
                    <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'is-on' : ''}
                      onClick={() => { if (k !== kind) { setKind(k); setRun(r => r + 1) } }} data-testid={`pp-kind-${k}`}>{t[`k${k}`]}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="pp__field">
                <legend>{t.format}</legend>
                <div className="pp__seg" role="radiogroup" aria-label={t.format}>
                  {Object.keys(FORMATS).map(f => (
                    <button key={f} type="button" role="radio" aria-checked={fmt === f} className={fmt === f ? 'is-on' : ''} onClick={() => setFmt(f)}>
                      {t[f]} <small className="ui-num">{FORMATS[f][0]}×{FORMATS[f][1]}</small>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="pp__btns">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={shuffle} data-testid="pp-shuffle"><Icon name="sparkle" className="ui-btn__icon" />{t.shuffle}</button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setRun(r => r + 1)}><Icon name="refresh" className="ui-btn__icon" />{t.replay}</button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={download} disabled={busy} data-testid="pp-download"><Icon name="download" className="ui-btn__icon" />{t.download}</button>
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={share} disabled={busy} data-testid="pp-share"><Icon name="share" className="ui-btn__icon" />{t.share}</button>
            </div>
            <p className="pp__status" role="status" aria-live="polite">{status}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
