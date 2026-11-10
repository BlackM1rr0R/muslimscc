// ═══════════════════════════════════════════════════════
// TraceCanvas (v7 "Toxunma") — ərəbcə yazının üstündən barmaqla yazmaq
//
//   <TraceCanvas text="بسم الله" kind="word" lang="az" onDone={r => …} />
//   <TraceCanvas text="ب" kind="letter" kid />
//   <TraceCanvas text="محمد" font="'Aref Ruqaa', serif" onNext={…} />
//
// • Şablon: şrift (Amiri / Aref Ruqaa / Reem Kufi …) kətana çəkilir —
//   solğun dolğu + qırıq kontur. Maska aşağı ayırdetmədə (¼) hesablanır.
// • Yazmaq: Pointer Events + setPointerCapture, touch-action: none YALNIZ
//   kətanda (səhifə başqa yerdən sürüşür), rAF ilə çəkmə, DPR-ə görə.
//   Hərfin üstünə düşən mürəkkəb QIZILI dolur (yalnız hərfin içində), kənara
//   çıxan xətt QIRMIZI görünüb solur.
// • Qiymət (utils/traceScore): örtük + kənara çıxma; sıra — söz bitişik
//   qruplara bölünür, sağdan sola başlanmalıdır; tək hərfdə — yalnız yazılışı
//   dəqiq bilinən hərflərdə ilk xəttin tərəfi və istiqaməti (LETTER_STROKES).
// • Tamamlananda: titrəmə (haptic) + kiçik ulduz partlayışı (celebrate).
// • Əlçatanlıq: "Göstər" — animasiyalı nümunə + mətn izahı (aria-live);
//   "Yazmadan tamamla" — barmaqla yaza bilməyən üçün (heç kəs ilişib qalmır).
// Stillər: src/styles/Trace.css
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Icon from '../Icon'
import { haptic } from '../../hooks/useHaptic'
import { celebrate } from '../../utils/celebrate'
import {
  dilate, evaluate, isComplete, THRESHOLDS, groupRTL, spreadLabels, strokeStartGroup, checkOrder, pathLength,
  LETTER_STROKES, checkLetterStart, penPath, strokeWidth,
} from '../../utils/traceScore'
import { pickUi } from '../../utils/uiText'
import '../../styles/Trace.css'

const T = {
  az: { clear: 'Təmizlə', show: 'Göstər', next: 'Növbəti', skip: 'Yazmadan tamamla', done: 'Tamamlandı', area: (s) => `«${s}» yazısının üstündən yazmaq üçün sahə`,
    cov: (p) => `örtük ${p}%`, res: ['Yazının üstündən yazmağa davam edin', 'Yaxşı başlanğıc', 'Çox yaxşı — bir az da', 'Əla — maşaAllah!'],
    doneMsg: 'Əla — maşaAllah! Tamamlandı.', manualMsg: 'Tamamlandı kimi qeyd edildi.',
    orderWrong: 'Forma yaxşıdır, amma ərəbcə sağdan sola yazılır: ən sağdakı hissədən başlayın. «Təmizlə» və yenidən.',
    startTop: 'Bu hərf yuxarıdan aşağı yazılır — yuxarıdan başlayın.', startRight: 'Bu hərf sağdan sola yazılır — sağ ucundan başlayın.',
    descWord: (n) => `Sağdan sola yazılır: ${n} bitişik hissə, hər hissə sağ tərəfdən başlanır; nöqtələr sonda qoyulur.`,
    descTop: 'Hərfin əsas xətti yuxarıdan başlanır və aşağı enir; nöqtə (varsa) sonda qoyulur.',
    descRight: 'Hərfin əsas xətti sağ ucdan başlanır və sola gedir; nöqtələr (varsa) sonda qoyulur.',
    descFree: 'Hərfin formasını üstündən izləyin; nöqtələr (varsa) sonda qoyulur.',
    hint: 'Barmaqla, siçanla və ya qələmlə yazın. Barmaqla yaza bilmirsinizsə — «Göstər» və «Yazmadan tamamla».' },
  en: { clear: 'Clear', show: 'Show me', next: 'Next', skip: 'Complete without drawing', done: 'Done', area: (s) => `Area to trace “${s}”`,
    cov: (p) => `${p}% covered`, res: ['Keep writing over the letters', 'A good start', 'Very good — a little more', 'Excellent — masha’Allah!'],
    doneMsg: 'Excellent — masha’Allah! Completed.', manualMsg: 'Marked as completed.',
    orderWrong: 'The shape is good, but Arabic is written right to left: start with the rightmost part. Clear and try again.',
    startTop: 'This letter is written from the top down — start at the top.', startRight: 'This letter is written right to left — start at its right end.',
    descWord: (n) => `Written right to left: ${n} connected part(s), each started from its right side; dots are added at the end.`,
    descTop: 'The main stroke starts at the top and goes down; any dot is added at the end.',
    descRight: 'The main stroke starts at the right end and moves left; any dots are added at the end.',
    descFree: 'Follow the shape of the letter; any dots are added at the end.',
    hint: 'Write with a finger, mouse or stylus. If you can’t draw, use “Show me” and “Complete without drawing”.' },
  ru: { clear: 'Очистить', show: 'Показать', next: 'Дальше', skip: 'Завершить без письма', done: 'Готово', area: (s) => `Поле для обводки «${s}»`,
    cov: (p) => `покрыто ${p}%`, res: ['Продолжайте писать поверх букв', 'Хорошее начало', 'Очень хорошо — ещё немного', 'Отлично — машаАллах!'],
    doneMsg: 'Отлично — машаАллах! Готово.', manualMsg: 'Отмечено как выполненное.',
    orderWrong: 'Форма хорошая, но по-арабски пишут справа налево: начните с самой правой части. Очистите и попробуйте снова.',
    startTop: 'Эта буква пишется сверху вниз — начните сверху.', startRight: 'Эта буква пишется справа налево — начните с правого конца.',
    descWord: (n) => `Пишется справа налево: связанных частей — ${n}, каждая начинается справа; точки ставятся в конце.`,
    descTop: 'Основная линия начинается сверху и идёт вниз; точка (если есть) ставится в конце.',
    descRight: 'Основная линия начинается с правого конца и идёт влево; точки (если есть) ставятся в конце.',
    descFree: 'Обведите форму буквы; точки (если есть) ставятся в конце.',
    hint: 'Пишите пальцем, мышью или стилусом. Если писать неудобно — «Показать» и «Завершить без письма».' },
  ar: { clear: 'امسح', show: 'أرِني', next: 'التالي', skip: 'أتمِم دون كتابة', done: 'تمّ', area: (s) => `مساحة لتتبّع «${s}»`,
    cov: (p) => `غُطّي ${p}٪`, res: ['واصل الكتابة فوق الحروف', 'بداية طيبة', 'جيد جدًا — قليلًا بعد', 'ممتاز — ما شاء الله!'],
    doneMsg: 'ممتاز — ما شاء الله! تمّ.', manualMsg: 'عُلِّم على أنه مكتمل.',
    orderWrong: 'الشكل جيد، لكن العربية تُكتب من اليمين إلى اليسار: ابدأ بالجزء الأيمن. امسح وأعد المحاولة.',
    startTop: 'يُكتب هذا الحرف من أعلى إلى أسفل — ابدأ من الأعلى.', startRight: 'يُكتب هذا الحرف من اليمين إلى اليسار — ابدأ من طرفه الأيمن.',
    descWord: (n) => `تُكتب من اليمين إلى اليسار: ${n} من الأجزاء المتصلة، يبدأ كل جزء من يمينه، والنقاط في الآخر.`,
    descTop: 'تبدأ الجرة الأساسية من الأعلى وتنزل، والنقطة إن وُجدت في الآخر.',
    descRight: 'تبدأ الجرة الأساسية من الطرف الأيمن وتتجه يسارًا، والنقاط إن وُجدت في الآخر.',
    descFree: 'تتبّع شكل الحرف، والنقاط إن وُجدت في الآخر.',
    hint: 'اكتب بإصبعك أو بالفأرة أو بالقلم. إن تعذّرت الكتابة فاستعمل «أرِني» و«أتمِم دون كتابة».' },
  tr: { clear: 'Temizle', show: 'Göster', next: 'Sonraki', skip: 'Yazmadan tamamla', done: 'Tamamlandı', area: (s) => `“${s}” yazısının üzerinden yazma alanı`,
    cov: (p) => `%${p} kaplandı`, res: ['Harflerin üzerinden yazmaya devam edin', 'İyi bir başlangıç', 'Çok iyi — biraz daha', 'Mükemmel — maşallah!'],
    doneMsg: 'Mükemmel — maşallah! Tamamlandı.', manualMsg: 'Tamamlandı olarak işaretlendi.',
    orderWrong: 'Şekil güzel, ama Arapça sağdan sola yazılır: en sağdaki parçadan başlayın. Temizleyip tekrar deneyin.',
    startTop: 'Bu harf yukarıdan aşağı yazılır — yukarıdan başlayın.', startRight: 'Bu harf sağdan sola yazılır — sağ ucundan başlayın.',
    descWord: (n) => `Sağdan sola yazılır: ${n} bitişik parça, her parça sağ tarafından başlar; noktalar en sonda konur.`,
    descTop: 'Harfin ana çizgisi yukarıdan başlar ve aşağı iner; nokta (varsa) en sonda konur.',
    descRight: 'Harfin ana çizgisi sağ uçtan başlar ve sola gider; noktalar (varsa) en sonda konur.',
    descFree: 'Harfin şeklini üzerinden takip edin; noktalar (varsa) en sonda konur.',
    hint: 'Parmakla, fareyle veya kalemle yazın. Yazamıyorsanız «Göster» ve «Yazmadan tamamla» düğmelerini kullanın.' },
}

const K = 0.25 // maska ayırdetməsi (kətanın ¼-i)
const dark = () => document.documentElement.getAttribute('data-theme') === 'dark'
const reduced = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion') } catch { return false }
}
const colors = () => (dark()
  ? { guide: 'rgba(231,199,125,.13)', line: 'rgba(127,214,181,.55)', ink: '#7fd6b5', gold: '#e7c77d', red: '#ff7b6b', pen: '#f3e6b5' }
  : { guide: 'rgba(13,92,70,.09)', line: 'rgba(13,92,70,.45)', ink: '#0d5c46', gold: '#c9a24e', red: '#c0392b', pen: '#0d5c46' })

/** Mətni kətana sığdır: ölçü və mövqe (ərəbcə, ortada) */
function fitText(ctx, text, W, H, family, weight, fill) {
  ctx.font = `${weight} 100px ${family}`
  ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(text)
  const L = m.actualBoundingBoxLeft || m.width / 2, R = m.actualBoundingBoxRight || m.width / 2
  const asc = m.actualBoundingBoxAscent || 80, desc = m.actualBoundingBoxDescent || 30
  const s = Math.min((W * fill) / Math.max(1, L + R), (H * 0.72) / Math.max(1, asc + desc))
  return { size: 100 * s, x: W / 2 - ((R - L) / 2) * s, y: H / 2 + ((asc - desc) / 2) * s, family, weight }
}
function drawText(ctx, text, lay, k = 1) {
  ctx.font = `${lay.weight} ${lay.size * k}px ${lay.family}`
  ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, lay.x * k, lay.y * k)
}

export default function TraceCanvas({
  text, kind = 'word', font = "'Amiri', 'Noto Naskh Arabic', serif", weight = 400, lang = 'az',
  kid = false, strict = !kid, done: doneProp = false, onDone, onNext, label,
}) {
  const t = pickUi(T, lang, 'en')
  const uid = useId()
  const W = kind === 'letter' ? 320 : 640
  const H = kind === 'letter' ? 320 : 280
  const MW = Math.round(W * K), MH = Math.round(H * K)

  const guideRef = useRef(null), inkRef = useRef(null), redRef = useRef(null), demoRef = useRef(null)
  const st = useRef(null) // dəyişkən vəziyyət (render etmir)
  const [ready, setReady] = useState(false)
  const [score, setScore] = useState(null)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(!!doneProp)
  const [hasInk, setHasInk] = useState(false)
  const [demoing, setDemoing] = useState(false)

  useEffect(() => { setDone(!!doneProp) }, [doneProp, text])

  // ── Qurulum: kətanlar, şablon, maskalar ──
  const setup = useCallback(() => {
    const guide = guideRef.current, ink = inkRef.current
    if (!guide || !ink) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    for (const cv of [guide, ink, redRef.current, demoRef.current]) {
      if (!cv) continue
      cv.width = W * dpr; cv.height = H * dpr
      cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const c = colors()
    const g = guide.getContext('2d')
    const lay = fitText(g, text, W, H, font, weight, kind === 'letter' ? 0.62 : 0.86)
    g.clearRect(0, 0, W, H)
    g.fillStyle = c.guide; drawText(g, text, lay)
    g.save(); g.setLineDash([6, 5]); g.lineWidth = 1.4; g.strokeStyle = c.line
    g.font = `${lay.weight} ${lay.size}px ${lay.family}`; g.strokeText(text, lay.x, lay.y); g.restore()

    // Maska (¼)
    const off = document.createElement('canvas'); off.width = MW; off.height = MH
    const o = off.getContext('2d', { willReadFrequently: true })
    o.fillStyle = '#000'; drawText(o, text, lay, K)
    const data = o.getImageData(0, 0, MW, MH).data
    const glyph = new Uint8Array(MW * MH)
    for (let i = 0; i < glyph.length; i++) glyph[i] = data[i * 4 + 3] > 100 ? 1 : 0
    const sw = strokeWidth(glyph, MW, MH) // maska pikselində
    const brush = Math.max(kid ? 16 : 10, Math.min(kid ? 46 : 36, (sw / K) * (kid ? 1.5 : 1.15)))
    const rNear = Math.max(1, Math.round((brush * K) / 2) + 1)
    const near = dilate(glyph, MW, MH, rNear)
    const { labels, groups } = groupRTL(glyph, MW, MH)
    const spread = spreadLabels(labels, MW, MH, rNear + 1)
    let box = { minX: MW, maxX: 0, minY: MH, maxY: 0 }
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (glyph[y * MW + x]) {
      if (x < box.minX) box.minX = x
      if (x > box.maxX) box.maxX = x
      if (y < box.minY) box.minY = y
      if (y > box.maxY) box.maxY = y
    }
    if (box.maxX < box.minX) box = { minX: 0, maxX: MW - 1, minY: 0, maxY: MH - 1 }

    // "Başla" nöqtəsi (söz) — ən sağdakı hissənin sağ-yuxarısı
    if (kind !== 'letter' && groups[0]) {
      const gx = (groups[0].maxX + 1.2) / K, gy = groups[0].minY / K
      g.fillStyle = c.gold; g.beginPath(); g.arc(Math.min(W - 8, gx + 6), Math.max(8, gy), 5, 0, Math.PI * 2); g.fill()
    }

    const fill = document.createElement('canvas'); fill.width = W * dpr; fill.height = H * dpr
    fill.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    const inkMask = document.createElement('canvas'); inkMask.width = MW; inkMask.height = MH
    st.current = {
      lay, glyph, near, labels: spread, groups, box, brush, fill, inkMask, strokes: [], cur: null,
      red: [], dirty: false, raf: 0, redRaf: 0, demoRaf: 0, colors: c, dpr,
    }
    setReady(true)
  }, [text, font, weight, kind, kid, W, H, MW, MH])

  useEffect(() => {
    setScore(null); setMsg(''); setHasInk(false); setReady(false)
    setup()
    let alive = true
    const fam = (font.match(/'([^']+)'/) || [])[1]
    const p = fam && document.fonts?.load ? document.fonts.load(`${weight} 60px "${fam}"`, text) : document.fonts?.ready
    Promise.resolve(p).then(() => { if (alive) setup() }, () => {})
    return () => {
      alive = false
      const s = st.current
      if (s) { cancelAnimationFrame(s.raf); cancelAnimationFrame(s.redRaf); cancelAnimationFrame(s.demoRaf) }
    }
  }, [setup, font, weight, text])

  // ── Çəkmə ──
  const composite = () => {
    const s = st.current, cv = inkRef.current
    if (!s || !cv) return
    s.dirty = false
    const d = cv.getContext('2d')
    d.save(); d.setTransform(1, 0, 0, 1, 0, 0); d.clearRect(0, 0, cv.width, cv.height); d.restore()
    d.globalCompositeOperation = 'source-over'; d.globalAlpha = 1
    d.drawImage(s.fill, 0, 0, W, H)
    d.globalCompositeOperation = 'source-in'; d.fillStyle = s.colors.gold; drawText(d, text, s.lay)
    d.globalCompositeOperation = 'destination-over'; d.globalAlpha = 0.3; d.drawImage(s.fill, 0, 0, W, H)
    d.globalCompositeOperation = 'source-over'; d.globalAlpha = 1
  }
  const schedule = () => {
    const s = st.current
    if (!s || s.dirty) return
    s.dirty = true
    s.raf = requestAnimationFrame(composite)
  }
  const drawRed = () => {
    const s = st.current, cv = redRef.current
    if (!s || !cv) return
    const d = cv.getContext('2d'), now = performance.now()
    d.clearRect(0, 0, W, H)
    d.lineCap = 'round'; d.lineWidth = s.brush * 0.6; d.strokeStyle = s.colors.red
    s.red = s.red.filter(r => now - r.t < 900)
    for (const r of s.red) {
      d.globalAlpha = Math.max(0, 1 - (now - r.t) / 900) * 0.85
      d.beginPath(); d.moveTo(r.a.x, r.a.y); d.lineTo(r.b.x, r.b.y); d.stroke()
    }
    d.globalAlpha = 1
    s.redRaf = s.red.length ? requestAnimationFrame(drawRed) : 0
  }
  const segment = (a, b) => {
    const s = st.current
    const mx = Math.round(((a.x + b.x) / 2) * K), my = Math.round(((a.y + b.y) / 2) * K)
    const inside = mx >= 0 && my >= 0 && mx < MW && my < MH && s.near[my * MW + mx]
    // Bütün mürəkkəb — qiymət maskasına
    const m = s.inkMask.getContext('2d')
    m.lineCap = 'round'; m.lineJoin = 'round'; m.lineWidth = Math.max(1, s.brush * K * 0.7); m.strokeStyle = '#000'
    m.beginPath(); m.moveTo(a.x * K, a.y * K); m.lineTo(b.x * K + 0.01, b.y * K); m.stroke()
    if (inside) {
      const f = s.fill.getContext('2d')
      f.lineCap = 'round'; f.lineJoin = 'round'; f.lineWidth = s.brush; f.strokeStyle = s.colors.ink
      f.beginPath(); f.moveTo(a.x, a.y); f.lineTo(b.x + 0.01, b.y); f.stroke()
      schedule()
    } else {
      s.red.push({ a, b, t: performance.now() })
      if (!s.redRaf) s.redRaf = requestAnimationFrame(drawRed)
    }
  }
  const pos = (e) => {
    const r = inkRef.current.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
  }
  const down = (e) => {
    const s = st.current
    if (!s || demoing || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault()
    try { inkRef.current.setPointerCapture(e.pointerId) } catch { /* köhnə brauzer */ }
    const p = pos(e)
    s.cur = { pts: [p] }
    s.strokes.push(s.cur)
    segment(p, p)
    if (!hasInk) setHasInk(true)
  }
  const move = (e) => {
    const s = st.current
    if (!s?.cur) return
    const list = e.nativeEvent?.getCoalescedEvents?.() || []
    for (const ev of (list.length ? list : [e])) {
      const p = pos(ev), last = s.cur.pts[s.cur.pts.length - 1]
      if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 1.2) continue
      s.cur.pts.push(p)
      segment(last, p)
    }
  }
  const up = () => {
    const s = st.current
    if (!s?.cur) return
    s.cur = null
    judge()
  }

  // ── Qiymət ──
  const judge = () => {
    const s = st.current
    const id = s.inkMask.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, MW, MH).data
    const ink = new Uint8Array(MW * MH)
    for (let i = 0; i < ink.length; i++) ink[i] = id[i * 4 + 3] > 60 ? 1 : 0
    const r = evaluate(s.glyph, s.near, ink, MW, MH, Math.max(1, Math.round(s.brush * K * 0.35)))
    // Sıra / istiqamət
    const minLen = Math.max(6, (s.box.maxX - s.box.minX + s.box.maxY - s.box.minY) / K * 0.12)
    let orderOk = true, orderMsg = ''
    if (kind === 'letter') {
      const spec = LETTER_STROKES[text]
      const first = s.strokes.find(k => pathLength(k.pts) >= minLen)
      if (spec && first) {
        const c = checkLetterStart(first.pts.map(p => ({ x: p.x * K, y: p.y * K })), s.box, spec)
        if (!c.ok) { orderOk = false; orderMsg = spec.side === 'top' ? t.startTop : t.startRight }
      }
    } else if (s.groups.length > 1) {
      const seq = s.strokes.map(k => ({ group: strokeStartGroup(k.pts.map(p => ({ x: p.x * K, y: p.y * K })), s.labels, MW, MH), len: pathLength(k.pts) }))
      if (!checkOrder(seq, minLen).ok) { orderOk = false; orderMsg = t.orderWrong }
    }
    const th = kid ? THRESHOLDS.kid : THRESHOLDS.normal
    setScore({ ...r, orderOk })
    if (isComplete(r, th) && (orderOk || !strict)) {
      if (!done) finish(false, r)
      setMsg(t.doneMsg)
    } else if (!orderOk && strict && r.coverage >= th.coverage * 0.6) {
      setMsg(orderMsg)
    } else setMsg('')
  }
  const finish = (manual, r) => {
    setDone(true)
    if (!manual) {
      const rect = inkRef.current?.getBoundingClientRect()
      celebrate(rect ? { size: 'small', x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { size: 'small' })
      haptic([12, 40, 12])
    }
    onDone?.({ manual, stars: manual ? 0 : (r?.stars || 3), coverage: r?.coverage ?? 0 })
  }

  const clear = () => {
    const s = st.current
    if (!s) return
    s.strokes = []; s.red = []
    s.fill.getContext('2d').clearRect(0, 0, W, H)
    s.inkMask.getContext('2d').clearRect(0, 0, MW, MH)
    redRef.current?.getContext('2d').clearRect(0, 0, W, H)
    composite()
    setScore(null); setMsg(''); setHasInk(false)
  }

  // ── "Göstər": hissə-hissə sağdan sola (və ya yuxarıdan aşağı) açılan nümunə + qələm ──
  const describe = () => {
    const s = st.current
    if (kind !== 'letter') return t.descWord(Math.max(1, s?.groups.length || 1))
    const spec = LETTER_STROKES[text]
    return !spec ? t.descFree : spec.side === 'top' ? t.descTop : t.descRight
  }
  const demo = () => {
    const s = st.current, cv = demoRef.current
    if (!s || !cv) return
    setMsg(describe())
    const d = cv.getContext('2d')
    cancelAnimationFrame(s.demoRaf)
    if (reduced()) {
      d.clearRect(0, 0, W, H); d.globalAlpha = 0.55; d.fillStyle = s.colors.gold; drawText(d, text, s.lay); d.globalAlpha = 1
      setTimeout(() => d.clearRect(0, 0, W, H), 1600)
      return
    }
    setDemoing(true)
    const vertical = kind === 'letter' && LETTER_STROKES[text]?.side === 'top'
    // Hər qrup üçün qələm yolu (maskadan, sağdan sola)
    const parts = (kind === 'letter' || !s.groups.length ? [s.box] : s.groups).map((gbox, gi) => {
      const only = kind === 'letter' ? s.glyph : s.glyph.map((v, i) => (v && s.labels[i] === gi + 1 ? 1 : 0))
      let pts = penPath(only, MW, MH, gbox)
      if (vertical) {
        pts = []
        for (let y = gbox.minY; y <= gbox.maxY; y++) {
          let sx = 0, n = 0
          for (let x = gbox.minX; x <= gbox.maxX; x++) if (s.glyph[y * MW + x]) { sx += x; n++ }
          if (n) pts.push({ x: sx / n, y })
        }
      }
      return { box: gbox, pts }
    })
    const per = kind === 'letter' ? 1400 : Math.max(700, 2600 / parts.length)
    const t0 = performance.now()
    const step = (now) => {
      // rAF vaxtı performance.now()-dan bir az əvvəl ola bilər — mənfi olmasın
      const el = Math.max(0, now - t0), gi = Math.min(parts.length - 1, Math.floor(el / per)), f = Math.min(1, (el - gi * per) / per)
      d.clearRect(0, 0, W, H)
      parts.forEach((p, i) => {
        if (i > gi) return
        const k = i < gi ? 1 : f
        d.save(); d.beginPath()
        const b = p.box
        if (vertical) d.rect(0, b.minY / K - 4, W, ((b.maxY - b.minY + 2) / K) * k + 4)
        else { const x1 = (b.maxX + 2) / K, w = ((b.maxX - b.minX + 3) / K) * k; d.rect(x1 - w, 0, w, H) }
        d.clip(); d.globalAlpha = 0.6; d.fillStyle = s.colors.gold; drawText(d, text, s.lay); d.restore()
      })
      const cur = parts[gi], pt = cur.pts[Math.min(cur.pts.length - 1, Math.floor(f * cur.pts.length))]
      if (pt && el < per * parts.length) {
        d.fillStyle = s.colors.pen; d.beginPath(); d.arc(pt.x / K, pt.y / K, 7, 0, Math.PI * 2); d.fill()
        d.strokeStyle = s.colors.gold; d.lineWidth = 2; d.stroke()
      }
      if (el < per * parts.length + 500) s.demoRaf = requestAnimationFrame(step)
      else { d.clearRect(0, 0, W, H); setDemoing(false) }
    }
    s.demoRaf = requestAnimationFrame(step)
  }

  const shown = label || text
  const live = msg || (score ? `${t.res[score.stars]} · ${t.cov(Math.round(score.coverage * 100))}` : '')

  return (
    <div className={`trc${kid ? ' trc--kid' : ''}${done ? ' is-done' : ''}`} data-testid="trace-canvas" data-ready={ready ? '1' : '0'}>
      <div className={`trc__pad trc__pad--${kind}`} style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={guideRef} className="trc__layer" aria-hidden="true" />
        <canvas ref={inkRef} className="trc__layer trc__ink" role="img" aria-label={t.area(shown)} aria-describedby={`${uid}-hint`}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} />
        <canvas ref={redRef} className="trc__layer trc__red" aria-hidden="true" />
        <canvas ref={demoRef} className="trc__layer trc__demo" aria-hidden="true" />
        {done && <span className="trc__badge"><Icon name="check" size={16} /> {t.done}</span>}
      </div>
      <p className="trc__hint" id={`${uid}-hint`}>{t.hint}</p>
      <div className="trc__bar">
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={clear} disabled={!hasInk}>
          <Icon name="refresh" className="ui-btn__icon" /> {t.clear}
        </button>
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={demo} disabled={!ready || demoing}>
          <Icon name="play" className="ui-btn__icon" /> {t.show}
        </button>
        {!done && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm trc__skip" onClick={() => { finish(true); setMsg(t.manualMsg) }}>
            <Icon name="check" className="ui-btn__icon" /> {t.skip}
          </button>
        )}
        {onNext && (
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={onNext}>
            {t.next} <Icon name="arrow" size={16} className="ui-btn__icon ui-flip-rtl" />
          </button>
        )}
      </div>
      <p className={`trc__res${msg && score && !score.orderOk && strict ? ' is-warn' : ''}`} aria-live="polite" data-testid="trace-result">
        {score && !msg && <span className="trc__stars" aria-hidden="true">{[0, 1, 2].map(i => <Icon key={i} name="star" size={16} className={i < score.stars ? 'is-on' : ''} />)}</span>}
        {live}
      </p>
    </div>
  )
}
