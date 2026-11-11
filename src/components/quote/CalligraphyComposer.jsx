// ═══════════════════════════════════════════════════════
// CalligraphyComposer (v6.1) — zikr və Bismillah xəttatlıq kompozisiyası (/quotes)
//
//   <CalligraphyComposer lang="az" />
//
// • İfadələr — sabit, tanınmış zikr sözləri (yeni dini mətn yoxdur, tərcümə edilmir).
// • Üç kompozisiya: "Günəş" (rozet — ifadə mərkəz ətrafında N dəfə), "Güzgü" (müsənna —
//   ifadə və onun güzgü əksi ortada birləşir), "Möhür" (dairəvi çərçivə, kənarda ifadə halqası).
// • Şriftlər: Amiri (nəsx), Aref Ruqaa (rüq‘ə), Reem Kufi (kufi) — SIL OFL 1.1; Adın ərəb xəttilə
//   səhifəsindəki eyni kiçildilmiş fayllar (styles/CalligraphyFonts.css).
// • Mürəkkəb animasiyası ~2.4 s; hərəkət azaldılıbsa — dərhal son şəkil.
// • Yükləmə: telefon divar kağızı (1170×2532) və ya kvadrat (2048×2048), Web Share / yükləmə.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import '../../styles/CalligraphyFonts.css'
import '../../styles/PatternStudio.css'
import '../../styles/CalligraphyComposer.css'

const T = {
  az: { ey: 'Yaradıcılıq', title: 'Xəttatlıq kompozisiyası', lead: 'Bismillah və ya bir zikr seçin — ustaların kompozisiyaları kimi günəş, güzgü və ya möhür formasında qızılı mürəkkəblə yazılsın. Divar kağızı edin.', phrase: 'İfadə', form: 'Kompozisiya', script: 'Xətt', count: 'Təkrar', colors: 'Rənglər', replay: 'Yenidən yaz', wall: 'Divar kağızı', square: 'Kvadrat şəkil', saved: 'Yükləndi', f: { sun: 'Günəş', mirror: 'Güzgü', seal: 'Möhür' }, s: { naskh: 'Nəsx', ruqaa: 'Rüq‘ə', kufi: 'Kufi' } },
  en: { ey: 'Create', title: 'Calligraphy composition', lead: 'Pick the Basmala or a dhikr — it is written in gold ink as a sunburst, a mirror or a seal, like the masters’ compositions. Make it your wallpaper.', phrase: 'Phrase', form: 'Composition', script: 'Script', count: 'Repeats', colors: 'Colours', replay: 'Write again', wall: 'Wallpaper', square: 'Square image', saved: 'Downloaded', f: { sun: 'Sunburst', mirror: 'Mirror', seal: 'Seal' }, s: { naskh: 'Naskh', ruqaa: 'Ruqʿah', kufi: 'Kufi' } },
  ru: { ey: 'Творчество', title: 'Каллиграфическая композиция', lead: 'Выберите басмалу или зикр — он будет написан золотыми чернилами в форме солнца, зеркала или печати, как в композициях мастеров. Сделайте обои.', phrase: 'Фраза', form: 'Композиция', script: 'Почерк', count: 'Повторы', colors: 'Цвета', replay: 'Написать снова', wall: 'Обои', square: 'Квадрат', saved: 'Скачано', f: { sun: 'Солнце', mirror: 'Зеркало', seal: 'Печать' }, s: { naskh: 'Насх', ruqaa: 'Рук‘а', kufi: 'Куфи' } },
  ar: { ey: 'إبداع', title: 'تكوين خطّي', lead: 'اختر البسملة أو ذكرًا — يُكتب بحبر ذهبي على هيئة شمس أو مرآة أو ختم كتكوينات الخطاطين. واجعله خلفية لهاتفك.', phrase: 'العبارة', form: 'التكوين', script: 'الخط', count: 'التكرار', colors: 'الألوان', replay: 'اكتب من جديد', wall: 'خلفية', square: 'صورة مربعة', saved: 'تم التنزيل', f: { sun: 'شمس', mirror: 'مرآة', seal: 'ختم' }, s: { naskh: 'النسخ', ruqaa: 'الرقعة', kufi: 'الكوفي' } },
  tr: { ey: 'Üret', title: 'Hat kompozisyonu', lead: 'Besmele ya da bir zikir seçin — ustaların kompozisyonları gibi güneş, ayna veya mühür şeklinde altın mürekkeple yazılsın. Duvar kâğıdı yapın.', phrase: 'İfade', form: 'Kompozisyon', script: 'Hat', count: 'Tekrar', colors: 'Renkler', replay: 'Yeniden yaz', wall: 'Duvar kâğıdı', square: 'Kare görsel', saved: 'İndirildi', f: { sun: 'Güneş', mirror: 'Ayna', seal: 'Mühür' }, s: { naskh: 'Nesih', ruqaa: 'Rika', kufi: 'Kûfî' } },
}
// Sabit ifadələr (ərəbcə; tərcümə edilmir)
export const PHRASES = [
  { id: 'bismillah', ar: 'بسم الله الرحمن الرحيم' },
  { id: 'allah', ar: 'الله' },
  { id: 'subhan', ar: 'سبحان الله' },
  { id: 'hamd', ar: 'الحمد لله' },
  { id: 'akbar', ar: 'الله أكبر' },
  { id: 'tawhid', ar: 'لا إله إلا الله' },
  { id: 'masha', ar: 'ما شاء الله' },
  { id: 'hasbuna', ar: 'حسبنا الله ونعم الوكيل' },
]
const FONTS = {
  naskh: { family: "'Amiri', serif", weight: 700 },
  ruqaa: { family: "'Aref Ruqaa', 'Amiri', serif", weight: 400 },
  kufi: { family: "'Reem Kufi', 'Amiri', sans-serif", weight: 500 },
}
// [fon, mürəkkəb 1, mürəkkəb 2, parıltı]
const PALETTES = {
  night: ['#0b1730', '#f6dc8e', '#c7932f', 'rgba(226,184,87,.22)'],
  emerald: ['#062a20', '#f1df9a', '#b98a2c', 'rgba(70,190,140,.22)'],
  lapis: ['#10245a', '#f7f1e0', '#d9c27a', 'rgba(120,150,255,.22)'],
  ivory: ['#f7f1e3', '#16355a', '#0d2240', 'rgba(29,59,90,.10)'],
  rose: ['#2a0f1c', '#f6d2a6', '#d08a5a', 'rgba(220,120,140,.2)'],
}
const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion-user') } catch { return false } }
const ease = (k) => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3)

function inkStyle(ctx, x0, y0, x1, y1, pal) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, pal[1]); g.addColorStop(0.55, pal[2]); g.addColorStop(1, pal[1])
  return g
}
// Mətni verilən enə sığdıran şrift ölçüsü
function fitSize(ctx, text, font, maxW, maxH) {
  ctx.font = `${font.weight} 100px ${font.family}`
  const w = ctx.measureText(text).width || 1
  return Math.min(100 * maxW / w, maxH)
}
function star(ctx, cx, cy, r, n = 8) {
  ctx.beginPath()
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2, rr = i % 2 ? r * 0.55 : r
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.closePath()
}

export function drawComposition(ctx, W, H, { phrase, form, script, count, pal: palKey }, prog = 1) {
  const pal = PALETTES[palKey], font = FONTS[script], text = phrase
  ctx.save()
  ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2, S = Math.min(W, H)
  const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.75)
  gr.addColorStop(0, pal[3]); gr.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H)
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.shadowColor = pal[3]; ctx.shadowBlur = S * 0.02
  const set = (px) => { ctx.font = `${font.weight} ${px}px ${font.family}` }

  if (form === 'sun') {
    const n = count, rIn = S * 0.13, rOut = S * 0.47
    const arcH = (2 * Math.PI * (rIn + (rOut - rIn) * 0.35)) / n
    const px = fitSize(ctx, text, font, (rOut - rIn) * 0.96, arcH * 0.85)
    set(px)
    for (let k = 0; k < n; k++) {
      const p = ease(prog * n * 0.55 - k * 0.45)
      if (p <= 0) continue
      ctx.save()
      const th = (k / n) * Math.PI * 2 - Math.PI / 2
      // Sol yarıda yazı tərs görünməsin — 180° çevir (oxunuş mərkəzə doğru)
      const flip = Math.cos(th) < -1e-6
      ctx.translate(cx, cy); ctx.rotate(flip ? th + Math.PI : th)
      ctx.globalAlpha = p
      const mid = rIn + (rOut - rIn) / 2
      ctx.translate(flip ? -mid : mid, 0)
      ctx.fillStyle = inkStyle(ctx, -(rOut - rIn) / 2, 0, (rOut - rIn) / 2, 0, pal)
      ctx.fillText(text, 0, 0)
      ctx.restore()
    }
    // Mərkəz: səkkizguşəli ulduz
    const p = ease((prog - 0.75) / 0.25)
    if (p > 0) {
      ctx.globalAlpha = p
      ctx.lineWidth = S * 0.006; ctx.strokeStyle = pal[2]
      star(ctx, cx, cy, rIn * 0.8); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, cy, rIn * 0.92, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = pal[1]; star(ctx, cx, cy, rIn * 0.32); ctx.fill()
    }
  } else if (form === 'mirror') {
    // Müsənna: ifadə sağ yarıda, güzgü əksi sol yarıda — ortada naxış oxu.
    // Uzun ifadə (3+ söz) iki sətrə bölünür ki, kompozisiya nazik zolaq olmasın.
    const ws = text.split(' ')
    const cut = ws.length >= 3 ? Math.ceil(ws.length / 2) : ws.length
    const lines = [ws.slice(0, cut).join(' '), ws.slice(cut).join(' ')].filter(Boolean)
    ctx.font = `${font.weight} 100px ${font.family}`
    const wMax = Math.max(...lines.map(l => ctx.measureText(l).width)) || 1
    const px = Math.min(100 * (S * 0.4) / wMax, S * (lines.length > 1 ? 0.19 : 0.3))
    set(px)
    const gap = px * 0.16, lh = px * 1.25
    const y0 = -((lines.length - 1) * lh) / 2
    const half = (side) => {
      ctx.save()
      ctx.translate(cx, cy)
      if (side < 0) ctx.scale(-1, 1)
      lines.forEach((l, i) => {
        const w = ctx.measureText(l).width
        ctx.fillStyle = inkStyle(ctx, gap, -px / 2, gap + w, px / 2, pal)
        ctx.fillText(l, gap + w / 2, y0 + i * lh)
      })
      ctx.restore()
    }
    const p = ease(prog / 0.85)
    ctx.save()
    ctx.beginPath(); ctx.rect(cx - (S / 2) * p - 2, 0, S * p + 4, H); ctx.clip()
    half(1); half(-1)
    ctx.restore()
    // Çərçivə: ellips, yuxarıda/aşağıda ulduz, ortada ox
    const q = ease((prog - 0.6) / 0.4)
    if (q > 0) {
      const RX = (wMax * px) / 100 + gap + px * 0.5, RY = (lines.length - 1) * lh / 2 + px * 1.15
      ctx.globalAlpha = q; ctx.strokeStyle = pal[2]; ctx.lineWidth = S * 0.005
      ctx.beginPath(); ctx.ellipse(cx, cy, RX, RY, 0, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = pal[1]
      star(ctx, cx, cy - RY, S * 0.018); ctx.fill(); star(ctx, cx, cy + RY, S * 0.018); ctx.fill()
      ctx.beginPath(); ctx.moveTo(cx, cy - RY * 0.8); ctx.lineTo(cx, cy + RY * 0.8); ctx.globalAlpha = q * 0.6; ctx.stroke()
      ctx.globalAlpha = q; star(ctx, cx, cy, px * 0.12, 8); ctx.fill()
    }
  } else {
    // Möhür: iki halqa, kənarda ifadə halqası, ortada ifadə
    const R1 = S * 0.45, R2 = S * 0.34
    const ringPx = (R1 - R2) * 0.62
    set(ringPx)
    const wR = ctx.measureText(text).width + ringPx * 0.8
    const n = Math.max(3, Math.floor((2 * Math.PI * ((R1 + R2) / 2)) / wR))
    ctx.lineWidth = S * 0.006; ctx.strokeStyle = pal[2]
    const pa = ease(prog / 0.35)
    ctx.beginPath(); ctx.arc(cx, cy, R1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pa); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, R2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pa); ctx.stroke()
    for (let k = 0; k < n; k++) {
      const p = ease((prog - 0.25) * n * 0.9 - k * 0.6)
      if (p <= 0) continue
      ctx.save(); ctx.globalAlpha = p
      const th = (k / n) * Math.PI * 2
      // Alt yarıda yazı başıaşağı olmasın — 180° çevir
      const flip = Math.cos(th) < -1e-6
      ctx.translate(cx, cy); ctx.rotate(flip ? th + Math.PI : th)
      ctx.translate(0, flip ? (R1 + R2) / 2 : -(R1 + R2) / 2)
      ctx.fillStyle = inkStyle(ctx, -wR / 2, 0, wR / 2, 0, pal)
      ctx.fillText(text, 0, 0)
      ctx.restore()
      // ifadələr arası kiçik ulduz
      ctx.save(); ctx.globalAlpha = p; ctx.translate(cx, cy); ctx.rotate(((k + 0.5) / n) * Math.PI * 2)
      ctx.fillStyle = pal[1]; star(ctx, 0, -(R1 + R2) / 2, ringPx * 0.18, 8); ctx.fill(); ctx.restore()
    }
    const pc = ease((prog - 0.6) / 0.4)
    if (pc > 0) {
      const px = fitSize(ctx, text, font, R2 * 1.55, R2 * 0.8)
      set(px); ctx.globalAlpha = pc
      ctx.fillStyle = inkStyle(ctx, cx - R2, cy, cx + R2, cy, pal)
      ctx.fillText(text, cx, cy)
    }
  }
  ctx.restore()
}

export default function CalligraphyComposer({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const [phraseId, setPhraseId] = useState('bismillah')
  const [form, setForm] = useState('sun')
  const [script, setScript] = useState('naskh')
  const [count, setCount] = useState(8)
  const [pal, setPal] = useState('night')
  const [run, setRun] = useState(0)
  const [msg, setMsg] = useState('')
  const [fontsReady, setFontsReady] = useState(0)
  const cvRef = useRef(null)
  const phrase = PHRASES.find(p => p.id === phraseId)?.ar || PHRASES[0].ar
  const opts = useMemo(() => ({ phrase, form, script, count, pal }), [phrase, form, script, count, pal])
  const optsRef = useRef(opts); optsRef.current = opts

  // Şrift yüklənməmiş çəksək ehtiyat şrift görünər — yükləyib yenidən çək
  useEffect(() => {
    const f = FONTS[script]
    if (!document.fonts?.load) return
    document.fonts.load(`${f.weight} 64px ${f.family}`, phrase).then(() => setFontsReady(n => n + 1)).catch(() => {})
  }, [script, phrase])

  const paint = useCallback((prog) => {
    const cv = cvRef.current; if (!cv) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = cv.clientWidth, h = cv.clientHeight
    if (!w || !h) return
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawComposition(ctx, w, h, optsRef.current, prog)
  }, [])

  // Yazılış animasiyası — ilk görünüşdə, ifadə/forma dəyişəndə və "yenidən yaz"-da
  useEffect(() => {
    if (reduced()) { paint(1); return undefined }
    let raf = 0; const t0 = performance.now(), D = 2400
    const tick = () => { const p = Math.min(1, (performance.now() - t0) / D); paint(p); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, phraseId, form, paint])
  useEffect(() => { paint(1) }, [script, count, pal, fontsReady, paint])
  useEffect(() => {
    const ro = new ResizeObserver(() => paint(1)); if (cvRef.current) ro.observe(cvRef.current)
    return () => ro.disconnect()
  }, [paint])

  const save = async (kind) => {
    try {
      const [W, H] = kind === 'wall' ? [1170, 2532] : [2048, 2048]
      const c = document.createElement('canvas'); c.width = W; c.height = H
      drawComposition(c.getContext('2d'), W, H, opts, 1)
      const blob = await new Promise(res => c.toBlob(res, 'image/png'))
      const file = new File([blob], `muslims-cc-${phraseId}-${form}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file] }); return } catch (e) { if (e?.name === 'AbortError') return } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      setMsg(t.saved); setTimeout(() => setMsg(''), 2500)
    } catch { /* */ }
  }

  return (
    <section className="ui-section ccm" aria-labelledby="ccm-title" data-testid="calligraphy-composer">
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="ccm-title" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
        <div className="ps__grid ccm__grid">
          <div className="ccm__stage">
            <canvas ref={cvRef} className="ps__cv" role="img" aria-label={`${t.title}: ${phrase} — ${t.f[form]}`} lang="ar" data-testid="ccm-canvas" />
          </div>
          <div className="ui-card ps__panel">
            <fieldset className="ps__field">
              <legend>{t.phrase}</legend>
              <div className="ccm__phrases" role="radiogroup">
                {PHRASES.map(p => (
                  <button key={p.id} type="button" role="radio" aria-checked={phraseId === p.id} className={`ui-chip ccm__ph${phraseId === p.id ? ' is-on' : ''}`} lang="ar" dir="rtl"
                    onClick={() => setPhraseId(p.id)} data-testid={`ccm-ph-${p.id}`}>{p.ar}</button>
                ))}
              </div>
            </fieldset>
            <fieldset className="ps__field">
              <legend>{t.form}</legend>
              <div className="ps__seg" role="radiogroup">
                {['sun', 'mirror', 'seal'].map(k => (
                  <button key={k} type="button" role="radio" aria-checked={form === k} className={form === k ? 'is-on' : ''} onClick={() => setForm(k)} data-testid={`ccm-form-${k}`}>{t.f[k]}</button>
                ))}
              </div>
            </fieldset>
            <fieldset className="ps__field">
              <legend>{t.script}</legend>
              <div className="ps__seg" role="radiogroup">
                {['naskh', 'ruqaa', 'kufi'].map(k => (
                  <button key={k} type="button" role="radio" aria-checked={script === k} className={script === k ? 'is-on' : ''} onClick={() => setScript(k)}>{t.s[k]}</button>
                ))}
              </div>
            </fieldset>
            {form === 'sun' && (
              <label className="ps__field">
                <span>{t.count} <b className="ui-num">{count}</b></span>
                <input type="range" min="4" max="16" step="1" value={count} onChange={(e) => setCount(Number(e.target.value))} data-testid="ccm-count" />
              </label>
            )}
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
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setRun(r => r + 1)} data-testid="ccm-replay"><Icon name="refresh" className="ui-btn__icon" />{t.replay}</button>
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => save('wall')} data-testid="ccm-save"><Icon name="download" className="ui-btn__icon" />{t.wall}</button>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => save('square')}><Icon name="download" className="ui-btn__icon" />{t.square}</button>
              {msg && <span role="status" className="ps__ok">{msg}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
