// ═══════════════════════════════════════════════════════
// EbruCanvas — interaktiv ebru (su üzərində boya naxışı)
//
// • Toxunuş/klik — seçilmiş rəngdə boya damcısı; sürüşdürmə — barmaq iynə
//   kimi boyanı dartır (hər pointermove seqmenti requestAnimationFrame ilə).
// • Riyaziyyat utils/ebru.js-dədir (Jaffer & Lu, «Mathematical Marbling»):
//   damcı sahəni qoruyaraq köhnə boyanı itələyir, iynə xətti məsafə ilə
//   sönən qüvvə ilə dartır. Boya — çoxbucaqlılar, ardıcıllıqla rənglənir.
// • Klassik hazır naxışlar: Battal, Gəl-get, Daraqlı, Çiçək — addım-addım
//   (azaldılmış hərəkətdə dərhal) qurulur.
// • Model koordinatları vərəqə nisbidir (eni 1, 9:16) — ixrac 1080×1920
//   "story" ölçüsündə yenidən çəkilir (bulanıq deyil), küncdə muslims.cc.
// • Şəbəkə, şəkil faylı, kitabxana yoxdur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced.js'
import { ASPECT, applyOp, cloneDrops, presetOps } from '../utils/ebru'
import { canShareFile, preopenWindow, saveBlob } from '../utils/quoteCard'
import '../styles/EbruCanvas.css'

// Ənənəvi ebru boyaları (sıra presetOps üçün vacibdir)
const INKS = [
  { id: 'indigo', hex: '#26346b' },
  { id: 'ochre', hex: '#c98f2c' },
  { id: 'madder', hex: '#a3312b' },
  { id: 'turq', hex: '#1f8f8c' },
  { id: 'ivory', hex: '#f2e8d2' },
  { id: 'green', hex: '#1e5640' },
]
const PAPERS = [
  { id: 'cream', hex: '#ece0c4' },
  { id: 'sky', hex: '#d9e3e6' },
  { id: 'rose', hex: '#ecd8cc' },
]
const PRESETS = ['battal', 'gelgit', 'tarakli', 'flower']
const INK_HEX = INKS.map(i => i.hex)
const EXPORT_W = 1080
const EXPORT_H = 1920
const UNDO_MAX = 15
const PRESET_PER_FRAME = 3

const T = {
  az: {
    ey: 'İslam sənəti', title: 'Ebru: su üzərində naxış',
    lead: 'Suya boya damcısı salın, sonra barmağınızla və ya siçanla dartın — naxış ebru ustalarının su üzərində çəkdiyi kimi yaranır.',
    hint: 'Toxunun — damcı; sürüşdürün — boyanı dartın', canvas: 'Ebru vərəqi',
    ink: 'Boya', paper: 'Su (fon)', presets: 'Klassik naxışlar',
    battal: 'Battal', gelgit: 'Gəl-get', tarakli: 'Daraqlı', flower: 'Çiçək',
    undo: 'Geri al', clear: 'Təmizlə', download: 'Yüklə', share: 'Paylaş',
    inks: { indigo: 'İndiqo', ochre: 'Oxra', madder: 'Boyaqotu qırmızısı', turq: 'Firuzəyi', ivory: 'Fil sümüyü', green: 'Tünd yaşıl' },
    papers: { cream: 'Krem', sky: 'Açıq mavi', rose: 'Çəhrayı' },
    hist: 'Ebru İslam dünyasının klassik kitab sənətlərindən biridir. Su bitki yapışqanı ilə qatılaşdırılır, üzərinə təbii boyalar səpilir, iynə və daraqla naxış çəkilir, sonra kağız suyun üstünə qoyulur və naxış ona köçür. Bu sənət Səfəvi İranında və Osmanlı Türkiyəsində geniş yayılmışdı: kitab cildlərində və xəttatlıq əsərlərinin haşiyələrində işlənirdi. Adının farsca «əbri» — «buludvari» sözündən gəldiyi deyilir.',
    // lang-ok[Jaffer]: müəllif adı
    note: 'Üsul: «Riyazi mərmərləmə» — Jaffer və Lu. Hər yeni damcı boyanı sahəsini qoruyaraq itələyir; iynə xətti boyanı məsafə ilə zəifləyən qüvvə ilə dartır.',
  },
  en: {
    ey: 'Islamic art', title: 'Ebru: patterns on water',
    lead: 'Drop ink on the water, then drag it with your finger or mouse — the pattern forms the way ebru masters draw on water.',
    hint: 'Tap — drop ink; drag — pull the paint', canvas: 'Ebru sheet',
    ink: 'Ink', paper: 'Water (background)', presets: 'Classic patterns',
    battal: 'Battal (stone)', gelgit: 'Gel-git (wave)', tarakli: 'Comb', flower: 'Flower',
    undo: 'Undo', clear: 'Clear', download: 'Download', share: 'Share',
    inks: { indigo: 'Indigo', ochre: 'Ochre', madder: 'Madder red', turq: 'Ottoman turquoise', ivory: 'Ivory', green: 'Deep green' },
    papers: { cream: 'Cream', sky: 'Pale blue', rose: 'Rose' },
    hist: 'Ebru is one of the classic book arts of the Islamic world. Water is thickened with a plant gum, natural paints are sprinkled on it, patterns are drawn with a needle and comb, and then a sheet of paper is laid on the water to take up the pattern. The art was widespread in Safavid Iran and Ottoman Turkey, used for bookbindings and the margins of calligraphy. Its name is said to come from the Persian “abrī” — cloudlike.',
    note: 'Method: “Mathematical Marbling” by Jaffer and Lu. Each new drop pushes the paint outward while preserving its area; a tine line pulls the paint with a force that fades with distance.',
  },
  ru: {
    ey: 'Исламское искусство', title: 'Эбру: узоры на воде',
    lead: 'Капните краску на воду, затем потяните её пальцем или мышью — узор возникает так же, как у мастеров эбру.',
    hint: 'Касание — капля; протягивание — тянет краску', canvas: 'Лист эбру',
    ink: 'Краска', paper: 'Вода (фон)', presets: 'Классические узоры',
    battal: 'Баттал', gelgit: 'Гельгит (волна)', tarakli: 'Гребень', flower: 'Цветок',
    undo: 'Отменить', clear: 'Очистить', download: 'Скачать', share: 'Поделиться',
    inks: { indigo: 'Индиго', ochre: 'Охра', madder: 'Мареновый красный', turq: 'Османская бирюза', ivory: 'Слоновая кость', green: 'Тёмно-зелёный' },
    papers: { cream: 'Кремовый', sky: 'Голубой', rose: 'Розовый' },
    hist: 'Эбру — одно из классических книжных искусств исламского мира. Воду загущают растительной камедью, на неё набрызгивают природные краски, иглой и гребнем рисуют узор, а затем кладут на воду лист бумаги, и узор переходит на него. Это искусство было распространено в Сефевидском Иране и Османской Турции: им украшали переплёты книг и поля каллиграфических работ. Считается, что название происходит от персидского «абри» — «облачный».',
    note: 'Метод: «Математическое мраморирование» — Джаффер и Лу. Каждая новая капля раздвигает краску, сохраняя её площадь; линия иглы тянет краску с силой, убывающей с расстоянием.',
  },
  ar: {
    ey: 'فن إسلامي', title: 'الإبرو: نقوش على الماء',
    lead: 'أسقط قطرة لون على الماء ثم اسحبها بإصبعك أو بالفأرة — يتشكّل النقش كما يرسمه أساتذة الإبرو على الماء.',
    hint: 'المس — قطرة؛ اسحب — جرّ اللون', canvas: 'ورقة الإبرو',
    ink: 'اللون', paper: 'الماء (الخلفية)', presets: 'نقوش كلاسيكية',
    battal: 'بطّال', gelgit: 'مدّ وجزر', tarakli: 'المشط', flower: 'زهرة',
    undo: 'تراجع', clear: 'مسح', download: 'تنزيل', share: 'مشاركة',
    inks: { indigo: 'نيلي', ochre: 'مغرة', madder: 'أحمر الفوّة', turq: 'فيروزي عثماني', ivory: 'عاجي', green: 'أخضر داكن' },
    papers: { cream: 'كريمي', sky: 'أزرق فاتح', rose: 'وردي' },
    hist: 'الإبرو من فنون الكتاب الكلاسيكية في العالم الإسلامي: يُكثَّف الماء بصمغ نباتي، وتُرشّ عليه ألوان طبيعية، ويُرسم النقش بالإبرة والمشط، ثم توضع ورقة على الماء فينتقل النقش إليها. انتشر هذا الفن في إيران الصفوية وتركيا العثمانية، واستُعمل في تجليد الكتب وحواشي أعمال الخط. ويقال إن اسمه من الفارسية «أبري» أي «شبيه بالسحاب».',
    note: 'الطريقة: «الترخيم الرياضي» لجافر ولو. كل قطرة جديدة تدفع اللون مع حفظ مساحته، وخط الإبرة يجرّ اللون بقوة تضعف مع المسافة.',
  },
  tr: {
    ey: 'İslam sanatı', title: 'Ebru: suyun üstünde desen',
    lead: 'Suya bir boya damlası bırakın, sonra parmağınızla ya da fareyle çekin — desen, ebru ustalarının su üstünde yaptığı gibi oluşur.',
    hint: 'Dokunun — damla; sürükleyin — boyayı çekin', canvas: 'Ebru kâğıdı',
    ink: 'Boya', paper: 'Su (zemin)', presets: 'Klasik desenler',
    battal: 'Battal', gelgit: 'Gelgit', tarakli: 'Taraklı', flower: 'Çiçek',
    undo: 'Geri al', clear: 'Temizle', download: 'İndir', share: 'Paylaş',
    inks: { indigo: 'Çivit mavisi', ochre: 'Aşı boyası', madder: 'Kök boya kırmızısı', turq: 'Osmanlı turkuazı', ivory: 'Fildişi', green: 'Koyu yeşil' },
    papers: { cream: 'Krem', sky: 'Açık mavi', rose: 'Pembe' },
    hist: 'Ebru, İslam dünyasının klasik kitap sanatlarından biridir. Su bitkisel bir zamkla koyulaştırılır, üzerine doğal boyalar serpilir, iğne ve tarakla desen çizilir, sonra kâğıt suyun üstüne yatırılır ve desen ona geçer. Bu sanat Safevi İran’ında ve Osmanlı Türkiye’sinde yaygındı: kitap ciltlerinde ve hat eserlerinin kenarlarında kullanılırdı. Adının Farsça «ebrî» — «bulut gibi» kelimesinden geldiği söylenir.',
    note: 'Yöntem: «Matematiksel ebru» — Jaffer ve Lu. Her yeni damla boyayı alanını koruyarak iter; iğne çizgisi boyayı mesafeyle azalan bir kuvvetle çeker.',
  },
}

/** Damcıları (model koordinatları) kontekstə çək: s — vərəqin piksel eni */
function paint(ctx, drops, s, bg) {
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, s, s * ASPECT)
  for (const d of drops) {
    const p = d.pts
    if (p.length < 6) continue
    ctx.beginPath()
    ctx.moveTo(p[0] * s, p[1] * s)
    for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i] * s, p[i + 1] * s)
    ctx.closePath()
    ctx.fillStyle = d.color
    ctx.fill()
  }
}

function renderExport(drops, bg) {
  const c = document.createElement('canvas')
  c.width = EXPORT_W
  c.height = EXPORT_H
  const ctx = c.getContext('2d')
  paint(ctx, drops, EXPORT_W, bg)
  // Kiçik nişan (sağ aşağı künc)
  const label = 'muslims.cc'
  ctx.font = '600 30px Inter, system-ui, sans-serif'
  const w = ctx.measureText(label).width
  const x = EXPORT_W - w - 56, y = EXPORT_H - 56
  ctx.fillStyle = 'rgba(255, 250, 238, 0.72)'
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x - 18, y - 36, w + 36, 50, 25)
  else ctx.rect(x - 18, y - 36, w + 36, 50)
  ctx.fill()
  ctx.fillStyle = 'rgba(30, 28, 26, 0.78)'
  ctx.fillText(label, x, y)
  return new Promise(res => c.toBlob(res, 'image/png'))
}

export default function EbruCanvas() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [ink, setInk] = useState(INKS[2].id)
  const [paper, setPaper] = useState(PAPERS[0].id)
  const [count, setCount] = useState(0)
  const [canUndo, setCanUndo] = useState(false)
  const [busy, setBusy] = useState(false)

  const canvasRef = useRef(null)
  const dropsRef = useRef([])
  const histRef = useRef([])
  const queueRef = useRef([])
  const rafRef = useRef(0)
  const scaleRef = useRef({ s: 0, dpr: 1 })
  const ptrRef = useRef(null)
  const bgRef = useRef(PAPERS[0].hex)
  const inkHex = INKS.find(i => i.id === ink).hex
  bgRef.current = PAPERS.find(p => p.id === paper).hex

  const draw = useCallback(() => {
    const c = canvasRef.current
    const { s, dpr } = scaleRef.current
    if (!c || !s) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paint(ctx, dropsRef.current, s, bgRef.current)
  }, [])

  const flush = useCallback((all) => {
    const q = queueRef.current
    let presetDone = 0
    while (q.length && (all || presetDone < PRESET_PER_FRAME)) {
      const op = q.shift()
      if (op.preset) presetDone++
      dropsRef.current = applyOp(dropsRef.current, op)
    }
    draw()
    setCount(dropsRef.current.length)
  }, [draw])

  const pump = useCallback(() => {
    if (rafRef.current) return
    const tick = () => {
      rafRef.current = 0
      flush(false)
      if (queueRef.current.length) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [flush])

  const snapshot = useCallback(() => {
    const h = histRef.current
    h.push(cloneDrops(dropsRef.current))
    if (h.length > UNDO_MAX) h.shift()
    setCanUndo(true)
  }, [])

  // Ölçü: ResizeObserver + DPR (≤ 2)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return undefined
    const fit = () => {
      const w = c.clientWidth
      if (!w) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = Math.round(w * dpr)
      c.height = Math.round(w * ASPECT * dpr)
      scaleRef.current = { s: w, dpr }
      draw()
    }
    fit()
    let ro = null
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(fit); ro.observe(c) }
    else window.addEventListener('resize', fit)
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', fit) }
  }, [draw])

  useEffect(() => { draw() }, [paper, draw])
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const toModel = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.width }
  }

  const dropAt = (x, y) => {
    snapshot()
    queueRef.current.push({ t: 'drop', x, y, r: 0.035 + Math.random() * 0.05, color: inkHex })
    pump()
  }

  const onDown = (e) => {
    if (e.button && e.button !== 0) return
    e.preventDefault()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* köhnə brauzer */ }
    const p = toModel(e)
    ptrRef.current = { id: e.pointerId, start: p, last: p, moved: false }
  }
  const onMove = (e) => {
    const st = ptrRef.current
    if (!st || st.id !== e.pointerId) return
    const p = toModel(e)
    if (!st.moved) {
      if (Math.hypot(p.x - st.start.x, p.y - st.start.y) < 0.012) return
      st.moved = true
      snapshot()
    }
    const dx = p.x - st.last.x, dy = p.y - st.last.y
    const seg = Math.hypot(dx, dy)
    if (seg < 0.004) return
    queueRef.current.push({ t: 'tine', bx: st.last.x, by: st.last.y, mx: dx, my: dy, alpha: seg * 0.9, lambda: 0.022, len: seg })
    st.last = p
    pump()
  }
  const onUp = (e) => {
    const st = ptrRef.current
    if (!st || st.id !== e.pointerId) return
    ptrRef.current = null
    if (!st.moved && e.type === 'pointerup') dropAt(st.start.x, st.start.y)
  }
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    dropAt(0.2 + Math.random() * 0.6, ASPECT * (0.2 + Math.random() * 0.6))
  }

  const runPreset = (name) => {
    snapshot()
    queueRef.current = presetOps(name, INK_HEX).map(op => ({ ...op, preset: true }))
    dropsRef.current = []
    if (reduced) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; flush(true) }
    else { draw(); pump() }
  }
  const clear = () => {
    snapshot()
    queueRef.current = []
    dropsRef.current = []
    flush(true)
  }
  const undo = () => {
    const h = histRef.current
    if (!h.length) return
    queueRef.current = []
    ptrRef.current = null
    dropsRef.current = h.pop()
    setCanUndo(h.length > 0)
    flush(true)
  }

  const exportBlob = () => {
    flush(true)
    return renderExport(dropsRef.current, bgRef.current)
  }
  const download = async () => {
    const win = preopenWindow()
    setBusy(true)
    try {
      const blob = await exportBlob()
      if (blob) saveBlob(blob, 'ebru-muslims-cc.png', win)
    } finally { setBusy(false) }
  }
  const share = async () => {
    setBusy(true)
    try {
      const blob = await exportBlob()
      if (!blob) return
      const file = new File([blob], 'ebru-muslims-cc.png', { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file], title: u.title }) } catch { /* istifadəçi imtina etdi */ }
      } else saveBlob(blob, 'ebru-muslims-cc.png')
    } finally { setBusy(false) }
  }

  return (
    <section className="ui-card ebru" aria-labelledby="ebru-title" data-testid="ebru" data-drops={count}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="ebru-title" className="ebru__title">{u.title}</h2>
      <p className="ebru__lead">{u.lead}</p>
      <div className="ebru__grid">
        <div className="ebru__stage">
          <canvas
            ref={canvasRef}
            className="ebru__canvas"
            data-testid="ebru-canvas"
            role="img"
            tabIndex={0}
            aria-label={`${u.canvas}. ${u.hint}`}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            onKeyDown={onKey}
          />
          <p className="ebru__hint">{u.hint}</p>
        </div>
        <div className="ebru__panel">
          <fieldset className="ebru__group">
            <legend>{u.ink}</legend>
            <div className="ebru__swatches">
              {INKS.map(i => (
                <button key={i.id} type="button" className="ebru__sw" style={{ '--sw': i.hex }}
                  aria-pressed={ink === i.id} aria-label={u.inks[i.id]} title={u.inks[i.id]}
                  onClick={() => setInk(i.id)} />
              ))}
            </div>
          </fieldset>
          <fieldset className="ebru__group">
            <legend>{u.paper}</legend>
            <div className="ebru__swatches">
              {PAPERS.map(p => (
                <button key={p.id} type="button" className="ebru__sw ebru__sw--paper" style={{ '--sw': p.hex }}
                  aria-pressed={paper === p.id} aria-label={u.papers[p.id]} title={u.papers[p.id]}
                  onClick={() => setPaper(p.id)} />
              ))}
            </div>
          </fieldset>
          <fieldset className="ebru__group">
            <legend>{u.presets}</legend>
            <div className="ebru__btns">
              {PRESETS.map(p => (
                <button key={p} type="button" className="ui-btn ui-btn--secondary ui-btn--sm" data-preset={p} onClick={() => runPreset(p)}>
                  {u[p]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="ebru__btns">
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={undo} disabled={!canUndo}>
              <Icon name="refresh" size={16} className="ebru__undo-ic" />{u.undo}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={clear}>
              <Icon name="trash" size={16} />{u.clear}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={download} disabled={busy}>
              <Icon name="download" size={16} />{u.download}
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={share} disabled={busy}>
              <Icon name="share" size={16} />{u.share}
            </button>
          </div>
          <p className="ebru__hist">{u.hist}</p>
          <p className="ebru__note">{u.note}</p>
        </div>
      </div>
    </section>
  )
}
