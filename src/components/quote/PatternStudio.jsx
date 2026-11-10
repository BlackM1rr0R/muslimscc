// ═══════════════════════════════════════════════════════
// PatternStudio (v5.9) — İslam həndəsi naxışı: pərgar və xətkeşlə "çəkilir" (/quotes)
//
//   <PatternStudio lang="az" />
//
// • Həndəsə — utils/girih (Hankin üsulu: 4.8.8 → səkkizguşəli, 3.12.12 → onikiguşəli,
//   6.6.6 → altıguşəli ulduzlar). Bucaq, ölçü və rəng dəstini istifadəçi seçir.
// • Qurulma animasiyası: əvvəl pərgar dairələri və xətkeş xətləri (tillər), sonra ulduz
//   xətləri mərkəzdən kənara doğru çəkilir, sonda zolaq (strapwork) görünüşü. ~3 s.
//   Hərəkət azaldılıbsa — dərhal son şəkil.
// • "Divar kağızı kimi yüklə" — 1170×2532 PNG (telefon ekranı), Web Share / yükləmə.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { tiling, hankin, vertices } from '../../utils/girih'
import '../../styles/PatternStudio.css'

const T = {
  // lang-ok[xətkeşlə,xətkeş]: az dilinin öz sözüdür (xətkeş — cetvel)
  az: { ey: 'Yaradıcılıq', title: 'İslam həndəsi naxışı', lead: 'Səkkiz və onikiguşəli ulduzlar ustaların üsulu ilə — pərgar və xətkeşlə qurulur. Bucağı, ölçünü və rəngi seçin, telefonunuza divar kağızı edin.', star: 'Ulduz', angle: 'Bucaq', size: 'Ölçü', colors: 'Rənglər', replay: 'Yenidən çək', save: 'Divar kağızı kimi yüklə', saved: 'Yükləndi', s6: '6 guşə', s8: '8 guşə', s12: '12 guşə' },
  en: { ey: 'Create', title: 'Islamic geometric pattern', lead: 'Eight- and twelve-pointed stars, built the way the masters did — with compass and straightedge. Pick the angle, size and colours, and make it your phone wallpaper.', star: 'Star', angle: 'Angle', size: 'Size', colors: 'Colours', replay: 'Draw again', save: 'Download as wallpaper', saved: 'Downloaded', s6: '6 points', s8: '8 points', s12: '12 points' },
  ru: { ey: 'Творчество', title: 'Исламский геометрический орнамент', lead: 'Восьми- и двенадцатиконечные звёзды строятся, как у мастеров, — циркулем и линейкой. Выберите угол, размер и цвета и сделайте обои для телефона.', star: 'Звезда', angle: 'Угол', size: 'Размер', colors: 'Цвета', replay: 'Нарисовать снова', save: 'Скачать как обои', saved: 'Скачано', s6: '6 лучей', s8: '8 лучей', s12: '12 лучей' },
  ar: { ey: 'إبداع', title: 'زخرفة هندسية إسلامية', lead: 'نجوم ثمانية واثنا عشرية تُبنى كما بناها المعلّمون — بالفرجار والمسطرة. اختر الزاوية والحجم والألوان، واجعلها خلفية لهاتفك.', star: 'النجمة', angle: 'الزاوية', size: 'الحجم', colors: 'الألوان', replay: 'ارسم من جديد', save: 'نزّلها خلفية', saved: 'تم التنزيل', s6: '6 رؤوس', s8: '8 رؤوس', s12: '12 رأسًا' },
  tr: { ey: 'Üret', title: 'İslami geometrik desen', lead: 'Sekiz ve on iki köşeli yıldızlar, ustaların yöntemiyle — pergel ve cetvelle kurulur. Açıyı, boyutu ve renkleri seçin, telefonunuza duvar kâğıdı yapın.', star: 'Yıldız', angle: 'Açı', size: 'Boyut', colors: 'Renkler', replay: 'Yeniden çiz', save: 'Duvar kâğıdı olarak indir', saved: 'İndirildi', s6: '6 köşe', s8: '8 köşe', s12: '12 köşe' },
}
// [fon, zolaq, kontur, parıltı]
const PALETTES = {
  night: ['#0b1730', '#e2b857', '#0b1730', 'rgba(226,184,87,.18)'],
  isfahan: ['#0d4f63', '#f2ead8', '#0d4f63', 'rgba(64,196,214,.22)'],
  emerald: ['#06281f', '#d9c27a', '#06281f', 'rgba(70,190,140,.2)'],
  terracotta: ['#f3e6d0', '#a5462b', '#f3e6d0', 'rgba(165,70,43,.12)'],
  ivory: ['#faf6ee', '#1d3b5a', '#faf6ee', 'rgba(29,59,90,.08)'],
}
const DEFAULTS = { '6': 60, '8': 67, '12': 70 }
const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion-user') } catch { return false } }

function draw(ctx, W, H, { kind, angle, size, pal }, prog = 1) {
  const [bg, strap, edge, glow] = PALETTES[pal]
  ctx.save()
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  const gr = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7)
  gr.addColorStop(0, glow); gr.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H)
  const s = size
  // Mərkəz tilin ortasına düşsün — naxışı sürüşdür
  const polys = tiling(kind, s, W + s * 6, H + s * 6)
  const cx = W / 2, cy = H / 2
  const first = polys.reduce((b, p) => (p.n >= 6 && Math.hypot(p.c[0] - cx - s * 3, p.c[1] - cy - s * 3) < Math.hypot(b.c[0] - cx - s * 3, b.c[1] - cy - s * 3) ? p : b), polys[0])
  const dx = cx - first.c[0], dy = cy - first.c[1]
  ctx.translate(dx, dy)
  const ox = cx - dx, oy = cy - dy
  const dist = (x, y) => Math.hypot(x - ox, y - oy)
  const maxD = Math.hypot(W, H) / 2 + s * 4
  // 1) Pərgar və xətkeş (0 → 0.4)
  const pA = Math.min(1, prog / 0.4)
  const faint = prog < 1 ? 1 - Math.max(0, (prog - 0.75) / 0.25) * 0.75 : 0.25
  ctx.lineWidth = Math.max(0.6, s / 60)
  ctx.strokeStyle = strap
  for (const p of polys) {
    const d = dist(p.c[0], p.c[1]) / maxD
    if (d > pA) continue
    ctx.globalAlpha = 0.22 * faint
    ctx.beginPath(); ctx.arc(p.c[0], p.c[1], p.R, 0, Math.PI * 2); ctx.stroke()
    ctx.globalAlpha = 0.35 * faint
    const v = vertices(p); ctx.beginPath(); v.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke()
  }
  // 2) Ulduz xətləri (0.35 → 1) — mərkəzdən kənara
  const segs = hankin(polys, (angle * Math.PI) / 180)
  const pB = Math.max(0, (prog - 0.35) / 0.65)
  const band = Math.max(3, s * 0.16)
  const visible = []
  for (const g of segs) {
    const d = dist((g[0] + g[2]) / 2, (g[1] + g[3]) / 2) / maxD
    const k = Math.max(0, Math.min(1, (pB - d * 0.85) / 0.15))
    if (k > 0) visible.push([g[0], g[1], g[0] + (g[2] - g[0]) * k, g[1] + (g[3] - g[1]) * k])
  }
  ctx.globalAlpha = 1
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const stroke = (w, c) => { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); for (const g of visible) { ctx.moveTo(g[0], g[1]); ctx.lineTo(g[2], g[3]) } ctx.stroke() }
  stroke(band, strap)
  if (prog >= 1) stroke(band * 0.38, edge)   // zolağın içi — strapwork
  ctx.restore()
}

export default function PatternStudio({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const [kind, setKind] = useState('8')
  const [angle, setAngle] = useState(DEFAULTS['8'])
  const [size, setSize] = useState(46)
  const [pal, setPal] = useState('night')
  const [msg, setMsg] = useState('')
  const [run, setRun] = useState(0)
  const cvRef = useRef(null)
  const opts = useMemo(() => ({ kind, angle, size, pal }), [kind, angle, size, pal])
  const optsRef = useRef(opts); optsRef.current = opts

  const paint = useCallback((prog) => {
    const cv = cvRef.current; if (!cv) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = cv.clientWidth, h = cv.clientHeight
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw(ctx, w, h, optsRef.current, prog)
  }, [])

  // Qurulma animasiyası — yalnız "yenidən çək" və ilk görünüşdə; parametr dəyişəndə dərhal
  useEffect(() => {
    if (reduced()) { paint(1); return undefined }
    let raf = 0; const t0 = performance.now(), D = 3200
    const tick = () => { const p = Math.min(1, (performance.now() - t0) / D); paint(p); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, paint])
  useEffect(() => { paint(1) }, [opts, paint])
  useEffect(() => {
    const ro = new ResizeObserver(() => paint(1)); if (cvRef.current) ro.observe(cvRef.current)
    return () => ro.disconnect()
  }, [paint])

  const pickKind = (k) => { setKind(k); setAngle(DEFAULTS[k]); setRun(r => r + 1) }
  const save = async () => {
    try {
      const c = document.createElement('canvas'); c.width = 1170; c.height = 2532
      draw(c.getContext('2d'), 1170, 2532, { ...opts, size: opts.size * 2.6 }, 1)
      const blob = await new Promise(res => c.toBlob(res, 'image/png'))
      const file = new File([blob], `muslims-cc-pattern-${kind}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: t.title }); return } catch (e) { if (e?.name === 'AbortError') return } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      setMsg(t.saved); setTimeout(() => setMsg(''), 2500)
    } catch { /* */ }
  }

  return (
    <section className="ui-section ps" aria-labelledby="ps-title" data-testid="pattern-studio">
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="ps-title" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
        <div className="ps__grid">
          <div className="ps__stage">
            <canvas ref={cvRef} className="ps__cv" aria-label={`${t.title}: ${t[`s${kind}`]}`} role="img" data-testid="ps-canvas" />
          </div>
          <div className="ui-card ps__panel">
            <fieldset className="ps__field">
              <legend>{t.star}</legend>
              <div className="ps__seg" role="radiogroup">
                {['6', '8', '12'].map(k => (
                  <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'is-on' : ''} onClick={() => pickKind(k)} data-testid={`ps-kind-${k}`}>{t[`s${k}`]}</button>
                ))}
              </div>
            </fieldset>
            <label className="ps__field">
              <span>{t.angle} <b className="ui-num">{angle}°</b></span>
              <input type="range" min="30" max="80" step="1" value={angle} onChange={(e) => setAngle(Number(e.target.value))} data-testid="ps-angle" />
            </label>
            <label className="ps__field">
              <span>{t.size}</span>
              <input type="range" min="24" max="80" step="1" value={size} onChange={(e) => setSize(Number(e.target.value))} />
            </label>
            <fieldset className="ps__field">
              <legend>{t.colors}</legend>
              <div className="ps__pals">
                {Object.entries(PALETTES).map(([k, c]) => (
                  <button key={k} type="button" className={`ps__pal${pal === k ? ' is-on' : ''}`} aria-pressed={pal === k} aria-label={k} onClick={() => setPal(k)}
                    style={{ background: `linear-gradient(135deg, ${c[0]} 50%, ${c[1]} 50%)` }} />
                ))}
              </div>
            </fieldset>
            <div className="ps__btns">
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setRun(r => r + 1)} data-testid="ps-replay"><Icon name="refresh" className="ui-btn__icon" />{t.replay}</button>
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={save} data-testid="ps-save"><Icon name="download" className="ui-btn__icon" />{t.save}</button>
              {msg && <span role="status" className="ps__ok">{msg}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
