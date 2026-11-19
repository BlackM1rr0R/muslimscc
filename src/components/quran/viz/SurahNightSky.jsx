// ═══════════════════════════════════════════════════════
// SurahNightSky — "Quranın gecə səması" (/quran/<surə> → "Gecə səması")
//
//   <SurahNightSky n={1} player={player} lang="az" title="Fatihə" onClose={…} />
//
// • Dinlədikcə hər ayə bir ulduz kimi yanır və surənin ÖZ bürcü yaranır. Ulduzların
//   yeri ayələrin söz sayından qəti hesablanır (surahViz → constellation) — hər dəfə eyni.
// • Səs — səhifənin öz pleyeri (useQuranPlayer); yeni pleyer yoxdur.
// • Bürc tamamlananda — divar kağızı PNG (telefon 1080×1920, kompüter 2560×1440).
//   Yalnız şəxsi yükləmə: paylaş düyməsi YOXDUR (sahibin qərarı). Şəkil cihazda çəkilir.
// • Şəkildə yalnız saytın məlumatı: surənin ərəbcə adı, adı, ayə sayı — yeni mətn yox.
// • Dialoq: fokus içəridə qalır, Esc / Geri bağlayır, fokus düyməyə qayıdır.
//   Hərəkət azaldılıbsa — ulduz parlaması animasiyasız (şəkil eyni dərəcədə gözəl).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../../Icon'
import { pickUi } from '../../../utils/uiText'
import { useBackToClose } from '../../../utils/useBackToClose'
import { saveBlob } from '../../../utils/quoteCard'
import { ayahCountText } from '../../../utils/quranText'
import { SURAH_TABLE } from '../../../data/mushafIndex'
import { brandName } from '../../../config/brand'
import { constellation, backgroundStars, fitBox, surahFacts, WALLPAPERS } from './surahViz'
import '../../../styles/SurahViz.css'

const T = {
  az: {
    title: 'Gecə səması', lead: 'Dinlədiyiniz hər ayə bir ulduz kimi yanır.', listen: 'Dinlə', pause: 'Dayandır',
    all: 'Bütün bürcü göstər', lit: (k, n) => `Yanan ulduzlar: ${k} / ${n}`,
    done: 'Bürc tamamlandı — onu divar kağızı kimi saxlaya bilərsiniz.',
    phone: 'Telefon üçün', desktop: 'Kompüter üçün', saving: 'Hazırlanır…', saved: 'Saxlanıldı',
    fail: 'Şəkil yaradılmadı.', privacy: 'Şəkil bu cihazda yaranır — heç yerə göndərilmir.', close: 'Bağla',
    meccan: 'Məkki', medinan: 'Mədəni',
  },
  en: {
    title: 'Night sky', lead: 'Each ayah you listen to lights up as a star.', listen: 'Listen', pause: 'Pause',
    all: 'Show the whole constellation', lit: (k, n) => `Stars lit: ${k} of ${n}`,
    done: 'The constellation is complete — you can save it as a wallpaper.',
    phone: 'Phone wallpaper', desktop: 'Desktop wallpaper', saving: 'Preparing…', saved: 'Saved',
    fail: 'The image could not be created.', privacy: 'The image is made on this device — nothing is uploaded.', close: 'Close',
    meccan: 'Meccan', medinan: 'Medinan',
  },
  ru: {
    title: 'Ночное небо', lead: 'Каждый прослушанный аят загорается звездой.', listen: 'Слушать', pause: 'Пауза',
    all: 'Показать всё созвездие', lit: (k, n) => `Зажжено звёзд: ${k} из ${n}`,
    done: 'Созвездие сложилось — его можно сохранить как обои.',
    phone: 'Обои для телефона', desktop: 'Обои для компьютера', saving: 'Готовим…', saved: 'Сохранено',
    fail: 'Не удалось создать изображение.', privacy: 'Изображение создаётся на этом устройстве и никуда не отправляется.', close: 'Закрыть',
    meccan: 'Мекканская', medinan: 'Мединская',
  },
  ar: {
    title: 'سماء الليل', lead: 'كل آية تستمع إليها تضيء نجمةً.', listen: 'استمع', pause: 'إيقاف',
    all: 'أظهر الكوكبة كاملة', lit: (k, n) => `النجوم المضيئة: ${k} من ${n}`,
    done: 'اكتملت الكوكبة — يمكنك حفظها خلفيةً.',
    phone: 'خلفية للهاتف', desktop: 'خلفية للحاسوب', saving: 'جارٍ التحضير…', saved: 'تم الحفظ',
    fail: 'تعذّر إنشاء الصورة.', privacy: 'تُنشأ الصورة على هذا الجهاز ولا تُرسل إلى أي مكان.', close: 'إغلاق',
    meccan: 'مكية', medinan: 'مدنية',
  },
  tr: {
    title: 'Gece gökyüzü', lead: 'Dinlediğiniz her ayet bir yıldız gibi yanar.', listen: 'Dinle', pause: 'Durdur',
    all: 'Tüm takımyıldızı göster', lit: (k, n) => `Yanan yıldızlar: ${k} / ${n}`,
    done: 'Takımyıldız tamamlandı — duvar kağıdı olarak kaydedebilirsiniz.',
    phone: 'Telefon için', desktop: 'Bilgisayar için', saving: 'Hazırlanıyor…', saved: 'Kaydedildi',
    fail: 'Görsel oluşturulamadı.', privacy: 'Görsel bu cihazda oluşturulur — hiçbir yere gönderilmez.', close: 'Kapat',
    meccan: 'Mekkî', medinan: 'Medenî',
  },
}

const reducedNow = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion')
  } catch { return true }
}
const GLOW = '240, 207, 126'   // qızılı (QuranGalaxy ilə eyni ton)
const COOL = '111, 227, 196'   // firuzəyi

/**
 * Səmanı kətana çək. box — bürcün yeri (fitBox), lit — yanan ayələr (Set),
 * pulse — { a, t } son yanan ulduzun parlaması (t: 0…1)
 */
function paintSky(ctx, w, h, { pts, lit, box, bg, madani, pulse, scale = 1 }) {
  const grd = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75)
  grd.addColorStop(0, '#13284a')
  grd.addColorStop(0.55, '#0a1530')
  grd.addColorStop(1, '#040814')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, w, h)
  // fon ulduzları
  for (const s of bg) {
    ctx.globalAlpha = s.o
    ctx.fillStyle = '#dfe8ff'
    ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r * scale, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1
  const P = (p) => [box.x + p.x * box.s, box.y + p.y * box.s]
  const tone = madani ? GLOW : COOL
  // bürcün xətləri: yalnız iki qonşu ayə yanıbsa
  ctx.lineWidth = 1.2 * scale
  ctx.lineCap = 'round'
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    const on = lit.has(a.a) && lit.has(b.a)
    if (!on) continue
    const [x1, y1] = P(a), [x2, y2] = P(b)
    ctx.strokeStyle = `rgba(${tone}, 0.42)`
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  }
  // ulduzlar
  const base = Math.max(1.6, Math.min(5.5, 34 / Math.sqrt(pts.length))) * scale
  for (const p of pts) {
    const [x, y] = P(p)
    const r = base * p.r
    if (!lit.has(p.a)) {
      ctx.fillStyle = 'rgba(200, 214, 255, 0.16)'
      ctx.beginPath(); ctx.arc(x, y, Math.max(0.8 * scale, r * 0.45), 0, Math.PI * 2); ctx.fill()
      continue
    }
    const boost = pulse && pulse.a === p.a ? 1 + (1 - pulse.t) * 1.6 : 1
    const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 4.2 * boost)
    halo.addColorStop(0, `rgba(${GLOW}, ${0.55 * Math.min(1, boost)})`)
    halo.addColorStop(1, `rgba(${GLOW}, 0)`)
    ctx.fillStyle = halo
    ctx.beginPath(); ctx.arc(x, y, r * 4.2 * boost, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff8e6'
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
}

function cssFont(name, fallback) {
  try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback } catch { return fallback }
}

export default function SurahNightSky({ n, player, lang = 'az', title = '', onClose }) {
  const t = pickUi(T, lang, 'en')
  const f = surahFacts(n)
  const pts = useMemo(() => constellation(n), [n])
  const bg = useMemo(() => backgroundStars(240, n * 31 + 7), [n])
  const total = pts.length
  const [lit, setLit] = useState(() => new Set())
  const [busy, setBusy] = useState('')     // '' | 'phone' | 'desktop'
  const [msg, setMsg] = useState('')
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const pulseRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const playing = player.status === 'playing' || player.status === 'loading'
  const complete = total > 0 && lit.size >= total

  useBackToClose(true, onClose)

  // Qiraət irəlilədikcə ulduz yanır
  const cur = player.current
  useEffect(() => {
    if (!playing || !cur) return
    setLit(s => {
      if (s.has(cur)) return s
      const next = new Set(s); next.add(cur)
      pulseRef.current = { a: cur, start: performance.now() }
      return next
    })
  }, [cur, playing])

  // Çəkiliş (kətan ölçüsü — konteynerdən, DPR ≤ 2)
  const draw = useCallback((pulse = null) => {
    const cv = canvasRef.current, st = stageRef.current
    if (!cv || !st) return
    const w = st.clientWidth, h = st.clientHeight
    if (!w || !h) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) }
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paintSky(ctx, w, h, { pts, lit, box: fitBox(w, h, { pad: 0.08 }), bg, madani: f?.madani, pulse })
  }, [pts, lit, bg, f])

  useEffect(() => {
    const p = pulseRef.current
    if (!p || reducedNow()) { pulseRef.current = null; draw(); return undefined }
    let raf = 0
    const tick = () => {
      const k = Math.min(1, (performance.now() - p.start) / 900)
      draw({ a: p.a, t: k })
      if (k < 1) raf = requestAnimationFrame(tick)
      else pulseRef.current = null
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [draw])

  useEffect(() => {
    const st = stageRef.current
    if (!st || typeof ResizeObserver !== 'function') return undefined
    const ro = new ResizeObserver(() => draw())
    ro.observe(st)
    return () => ro.disconnect()
  }, [draw])

  // Açılış: fokus içəri, sürüşmə kilidi; bağlanış: fokus əvvəlki yerə
  useEffect(() => {
    const prev = document.activeElement
    rootRef.current?.querySelector('[data-autofocus]')?.focus()
    document.documentElement.classList.add('qns-open')
    // Esc — sənəd səviyyəsində: fokus dialoqdan düşsə də (məs. düymə yenidən çəkiləndə) işləsin
    const onEsc = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeRef.current?.() } }
    document.addEventListener('keydown', onEsc, true)
    return () => {
      document.removeEventListener('keydown', onEsc, true)
      document.documentElement.classList.remove('qns-open')
      if (prev && prev.isConnected && typeof prev.focus === 'function') prev.focus()
    }
  }, [])

  const onKey = (e) => {
    if (e.key !== 'Tab') return
    const els = [...rootRef.current.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
    if (!els.length) return
    const first = els[0], last = els[els.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  const listen = () => {
    if (playing) { player.pause(); return }
    let next = 1
    while (next <= total && lit.has(next)) next++
    player.toggle(next > total ? 1 : next)
  }
  const lightAll = () => { pulseRef.current = null; setLit(new Set(pts.map(p => p.a))) }

  const download = async (kind) => {
    const size = WALLPAPERS[kind]
    if (!size || busy) return
    setBusy(kind); setMsg('')
    try {
      const { w, h } = size
      const cv = document.createElement('canvas')
      cv.width = w; cv.height = h
      const ctx = cv.getContext('2d')
      if (!ctx) throw new Error('no-canvas')
      const phone = kind === 'phone'
      const scale = phone ? 2.6 : 2.4
      const box = fitBox(w, h, { pad: phone ? 0.1 : 0.06, top: h * 0.06, bottom: h * (phone ? 0.3 : 0.28) })
      const all = new Set(pts.map(p => p.a))
      paintSky(ctx, w, h, { pts, lit: all, box, bg: backgroundStars(phone ? 520 : 820, n * 31 + 7), madani: f?.madani, scale })
      try { await document.fonts?.ready } catch { /* */ }
      const ar = SURAH_TABLE[n - 1]?.[4] || ''
      const fa = cssFont('--font-arabic', "'Amiri', serif")
      const fs = cssFont('--font-heading', 'serif')
      const fb = cssFont('--font-sans', 'sans-serif')
      const cx = w / 2
      let y = h - h * (phone ? 0.22 : 0.25)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff3d6'
      ctx.direction = 'rtl'
      ctx.font = `${Math.round(h * (phone ? 0.05 : 0.075))}px ${fa}`
      ctx.fillText(ar, cx, y)
      ctx.direction = 'ltr'
      y += h * (phone ? 0.055 : 0.085)
      if (title && lang !== 'ar') {
        ctx.fillStyle = 'rgba(255, 248, 230, 0.92)'
        ctx.font = `500 ${Math.round(h * (phone ? 0.024 : 0.036))}px ${fs}`
        ctx.fillText(title, cx, y)
        y += h * (phone ? 0.035 : 0.05)
      }
      ctx.fillStyle = 'rgba(223, 232, 255, 0.7)'
      ctx.font = `${Math.round(h * (phone ? 0.016 : 0.024))}px ${fb}`
      ctx.direction = lang === 'ar' ? 'rtl' : 'ltr'
      ctx.fillText(`${ayahCountText(total, lang)} · ${f?.madani ? t.medinan : t.meccan}`, cx, y)
      ctx.direction = 'ltr'
      ctx.fillStyle = 'rgba(223, 232, 255, 0.45)'
      ctx.font = `${Math.round(h * (phone ? 0.012 : 0.018))}px ${fb}`
      ctx.fillText(brandName(lang), cx, h - h * 0.035)
      const blob = await new Promise((res) => cv.toBlob(res, 'image/png'))
      if (!blob) throw new Error('no-blob')
      saveBlob(blob, `muslims-cc-surah-${n}-${kind}-${w}x${h}.png`)
      setMsg(t.saved)
    } catch {
      setMsg(t.fail)
    } finally {
      setBusy('')
    }
  }

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className={`qns${f?.madani ? ' qns--madani' : ''}`} role="dialog" aria-modal="true" aria-labelledby="qns-ttl" ref={rootRef} onKeyDown={onKey} data-testid="night-sky">
      <div className="qns-top">
        <div className="qns-titles">
          <h2 id="qns-ttl" className="qns-title">{t.title}{title ? <span> · {title}</span> : null}</h2>
          <p className="qns-lead">{t.lead}</p>
        </div>
        <button type="button" className="qns-close" onClick={() => closeRef.current?.()} aria-label={t.close} title={t.close} data-autofocus>
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className="qns-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="qns-canvas" role="img" aria-label={`${t.title}${title ? ` — ${title}` : ''}. ${t.lit(lit.size, total)}`} />
      </div>
      <div className="qns-bar">
        <p className="qns-status" aria-live="polite" data-testid="night-sky-status">
          {complete ? t.done : t.lit(lit.size, total)}
        </p>
        <div className="qns-actions">
          {!complete && (
            <>
              <button type="button" className="ui-btn ui-btn--primary qns-btn" onClick={listen} aria-pressed={playing}>
                <Icon name={playing ? 'pause' : 'play'} size={18} className="ui-btn__icon" />{playing ? t.pause : t.listen}
              </button>
              <button type="button" className="ui-btn ui-btn--ghost qns-btn" onClick={lightAll}>
                <Icon name="sparkle" size={18} className="ui-btn__icon" />{t.all}
              </button>
            </>
          )}
          {complete && (
            <>
              <button type="button" className="ui-btn ui-btn--primary qns-btn" onClick={() => download('phone')} aria-busy={busy === 'phone'} data-testid="night-sky-phone">
                <Icon name="download" size={18} className="ui-btn__icon" />{busy === 'phone' ? t.saving : t.phone}
                <span className="qns-dim ui-num" dir="ltr">1080×1920</span>
              </button>
              <button type="button" className="ui-btn ui-btn--secondary qns-btn" onClick={() => download('desktop')} aria-busy={busy === 'desktop'} data-testid="night-sky-desktop">
                <Icon name="download" size={18} className="ui-btn__icon" />{busy === 'desktop' ? t.saving : t.desktop}
                <span className="qns-dim ui-num" dir="ltr">2560×1440</span>
              </button>
            </>
          )}
        </div>
        {complete && <p className="qns-note">{t.privacy}</p>}
        {msg && <p className="qns-msg" role="status">{msg}</p>}
      </div>
    </div>,
    document.body,
  )
}
