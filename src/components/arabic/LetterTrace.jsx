// ═══════════════════════════════════════════════════════
// LetterTrace — hərfi barmaqla yazma məşqi (/arabic → Hərflər)
//
//   <LetterTrace ch="ب" lang="az" />
//
// • Hərf böyük, solğun şablon kimi çəkilir (Amiri şrifti); üstündən barmaqla /
//   siçanla / qələmlə yazılır (Pointer Events, touch-action: none).
// • "Yoxla": hərfin nə qədəri örtülüb və xəttin nə qədəri kənara çıxıb —
//   0–3 ulduz (utils/traceScore). Yazılış ardıcıllığı yoxlanılmır (etibarlı
//   məlumat olmadan uydurulmur) — yalnız forma.
// • Hər şey brauzerdə; heç nə saxlanmır, göndərilmir. Stillər: src/styles/LetterTrace.css
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { haptic } from '../../hooks/useHaptic'
import { traceScore, dilate } from '../../utils/traceScore'
import '../../styles/LetterTrace.css'

const T = {
  az: { title: 'Barmaqla yaz', lead: 'Solğun hərfin üstündən yazın, sonra «Yazını yoxla» düyməsinə basın.', check: 'Yazını yoxla', clear: 'Təmizlə', res: ['Yenidən cəhd edin — hərfin üstündən yazın', 'Yaxşı başlanğıc', 'Çox yaxşı!', 'Əla — maşaAllah!'], cov: (p) => `örtük ${p}%`, label: (c) => `${c} hərfini yazmaq üçün sahə` },
  en: { title: 'Trace with your finger', lead: 'Write over the faint letter, then press “Check my writing”.', check: 'Check my writing', clear: 'Clear', res: ['Try again — write over the letter', 'A good start', 'Very good!', 'Excellent — masha’Allah!'], cov: (p) => `${p}% covered`, label: (c) => `Area to trace the letter ${c}` },
  ru: { title: 'Напиши пальцем', lead: 'Обведите бледную букву и нажмите «Проверить написание».', check: 'Проверить написание', clear: 'Очистить', res: ['Попробуйте ещё — пишите поверх буквы', 'Хорошее начало', 'Очень хорошо!', 'Отлично — машаАллах!'], cov: (p) => `покрыто ${p}%`, label: (c) => `Поле для письма буквы ${c}` },
  tr: { title: 'Parmağınla yaz', lead: 'Soluk harfin üzerinden yazın, sonra «Yazımı kontrol et»e basın.', check: 'Yazımı kontrol et', clear: 'Temizle', res: ['Tekrar deneyin — harfin üzerinden yazın', 'İyi bir başlangıç', 'Çok iyi!', 'Mükemmel — maşallah!'], cov: (p) => `%${p} kaplandı`, label: (c) => `${c} harfini yazma alanı` },
  ar: { title: 'اكتب بإصبعك', lead: 'اكتب فوق الحرف الباهت ثم اضغط «تحقّق من الكتابة».', check: 'تحقّق من الكتابة', clear: 'امسح', res: ['حاول مجددًا — اكتب فوق الحرف', 'بداية طيبة', 'جيد جدًا!', 'ممتاز — ما شاء الله!'], cov: (p) => `غُطّي ${p}٪`, label: (c) => `مساحة لكتابة الحرف ${c}` },
}
const S = 320 // canvas ölçüsü (CSS piksel)
const BRUSH = 22

function drawGlyph(ctx, ch, size, font) {
  ctx.clearRect(0, 0, size, size)
  ctx.font = `${Math.round(size * 0.62)}px ${font}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ch, size / 2, size * 0.5)
}

export default function LetterTrace({ ch, lang = 'az' }) {
  const t = T[lang] || T.az
  const guideRef = useRef(null)
  const inkRef = useRef(null)
  const drawing = useRef(null)
  const [result, setResult] = useState(null)
  const [hasInk, setHasInk] = useState(false)

  // Canvas üçün sabit rənglər (color-mix/color() hər brauzerin canvas-ında işləmir)
  const dark = () => document.documentElement.getAttribute('data-theme') === 'dark'
  const font = () => getComputedStyle(document.documentElement).getPropertyValue('--font-arabic').trim() || 'serif'

  const setup = useCallback(() => {
    const dpr = window.devicePixelRatio || 1
    for (const cv of [guideRef.current, inkRef.current]) {
      if (!cv) continue
      cv.width = S * dpr; cv.height = S * dpr
      cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const g = guideRef.current?.getContext('2d')
    if (g) { g.fillStyle = dark() ? '#3b4944' : '#ddd5c3'; drawGlyph(g, ch, S, font()) }
  }, [ch])

  useEffect(() => {
    setResult(null); setHasInk(false)
    setup()
    // Şrift gec yüklənə bilər — hazır olanda şablonu yenidən çək
    document.fonts?.ready?.then(() => setup())
  }, [ch, setup])

  const pos = (e) => { const r = inkRef.current.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * S, y: ((e.clientY - r.top) / r.height) * S } }
  const down = (e) => {
    e.preventDefault()
    inkRef.current.setPointerCapture?.(e.pointerId)
    drawing.current = pos(e)
    const c = inkRef.current.getContext('2d')
    c.strokeStyle = dark() ? '#7fd6b5' : '#0d5c46'
    c.lineWidth = BRUSH; c.lineCap = 'round'; c.lineJoin = 'round'
    c.beginPath(); c.moveTo(drawing.current.x, drawing.current.y); c.lineTo(drawing.current.x + 0.1, drawing.current.y); c.stroke()
    setHasInk(true); setResult(null)
  }
  const move = (e) => {
    if (!drawing.current) return
    const p = pos(e), c = inkRef.current.getContext('2d')
    c.beginPath(); c.moveTo(drawing.current.x, drawing.current.y); c.lineTo(p.x, p.y); c.stroke()
    drawing.current = p
  }
  const up = () => { drawing.current = null }

  const clear = () => { inkRef.current.getContext('2d').clearRect(0, 0, S, S); setHasInk(false); setResult(null) }

  const check = () => {
    // Aşağı ayırdetmədə (80×80) maskalar — sürətli və fırça qalınlığına dözümlü
    const N = 80
    const off = document.createElement('canvas'); off.width = N; off.height = N
    const o = off.getContext('2d', { willReadFrequently: true })
    o.fillStyle = '#000'; drawGlyph(o, ch, N, font())
    const gd = o.getImageData(0, 0, N, N).data
    o.clearRect(0, 0, N, N); o.drawImage(inkRef.current, 0, 0, N, N)
    const id = o.getImageData(0, 0, N, N).data
    const glyph = new Uint8Array(N * N), ink = new Uint8Array(N * N)
    for (let i = 0; i < N * N; i++) { glyph[i] = gd[i * 4 + 3] > 90 ? 1 : 0; ink[i] = id[i * 4 + 3] > 60 ? 1 : 0 }
    const r = traceScore(glyph, dilate(glyph, N, N, 3), ink)
    setResult(r)
    haptic(r.stars >= 2 ? [10, 40, 10] : 8)
  }

  return (
    <section className="lt" aria-labelledby="lt-title" data-testid="letter-trace">
      <h4 className="ac-h4" id="lt-title">{t.title}</h4>
      <p className="lt__lead">{t.lead}</p>
      <div className={`lt__pad${result?.stars === 3 ? ' is-great' : ''}`}>
        <canvas ref={guideRef} className="lt__guide" aria-hidden="true" />
        <canvas ref={inkRef} className="lt__ink" role="img" aria-label={t.label(ch)}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} />
      </div>
      <div className="lt__bar">
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={check} disabled={!hasInk}>
          <Icon name="check" className="ui-btn__icon" /> {t.check}
        </button>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={clear} disabled={!hasInk}>
          <Icon name="refresh" className="ui-btn__icon" /> {t.clear}
        </button>
        <p className="lt__res" aria-live="polite">
          {result && <>
            <span className="lt__stars" aria-hidden="true">{[0, 1, 2].map(i => <Icon key={i} name="star" size={18} className={i < result.stars ? 'is-on' : ''} />)}</span>
            <b>{t.res[result.stars]}</b> <span className="ui-num">· {t.cov(Math.round(result.coverage * 100))}</span>
          </>}
        </p>
      </div>
    </section>
  )
}
