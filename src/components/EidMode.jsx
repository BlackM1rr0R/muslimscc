// ═══════════════════════════════════════════════════════
// EidMode (v5.8) — bayram günlərində saytın bayram görünüşü (App.jsx, boş vaxtda)
//
// • utils/eid: Ramazan bayramı (1–3 Şəvval), Qurban bayramı (10–13 Zülhiccə).
// • html.eid-mode — qızılı vurğular (vau3.css §eid); gündə bir dəfə qızılı ulduz yağışı
//   (kətan, ~6 s, hərəkət azaldılıbsa yoxdur).
// • Ekranın altında bayram zolağı: "Bayramınız mübarək" + "Təkbir" düyməsi → pəncərə:
//   təkbirin ərəbcə mətni, oxunuşu, tərcüməsi və mənbəsi (src/data/eidTakbir.js — dərsdən
//   hərfiyyən) və story ölçülü təbrik kartı (paylaş / yüklə).
// • Pəncərədə kartın kiçik önizləməsi, 3 sakit rəng palitrası və istəyə görə "Kimdən: ad" sətri
//   (ad yalnız bu cihazda — localStorage "qm_eid_from"; heç yerə göndərilmir). Kart yerli çəkilir.
// • Zolaq pleyerin (Quran) üstünə düşmür; açıqkən səhifənin altında yer saxlanılır (html.eid-bar-on).
// • Pəncərə: fokus "Bağla"ya, Esc bağlayır, fokus "Təkbir və kart" düyməsinə qayıdır.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import { eidToday } from '../utils/eid'
import { EID_TAKBIR } from '../data/eidTakbir'
import { pickUi } from '../utils/uiText'
import Icon from './Icon'
import '../styles/EidMode.css'

const T2 = {
  az: { open: 'Təkbir və kart', preview: 'Kartın önizləməsi', palette: 'Rəng', pal: { night: 'Gecə yaşılı', dawn: 'Səhər qumu', ink: 'Mürəkkəb və qızıl' }, from: 'Kimdən (istəyə görə)', fromHint: 'Ad yalnız bu cihazda saxlanılır və heç yerə göndərilmir.', fromLine: (x) => `Kimdən: ${x}` },
  en: { open: 'Takbir & card', preview: 'Card preview', palette: 'Colour', pal: { night: 'Night green', dawn: 'Dawn sand', ink: 'Ink & gold' }, from: 'From (optional)', fromHint: 'The name stays on this device and is never uploaded.', fromLine: (x) => `From: ${x}` },
  ru: { open: 'Такбир и открытка', preview: 'Предпросмотр открытки', palette: 'Цвет', pal: { night: 'Ночной зелёный', dawn: 'Утренний песок', ink: 'Чернила и золото' }, from: 'От кого (необязательно)', fromHint: 'Имя хранится только на этом устройстве и никуда не отправляется.', fromLine: (x) => `От: ${x}` },
  ar: { open: 'التكبير والبطاقة', preview: 'معاينة البطاقة', palette: 'اللون', pal: { night: 'أخضر الليل', dawn: 'رمل الفجر', ink: 'حبر وذهب' }, from: 'من (اختياري)', fromHint: 'يبقى الاسم على هذا الجهاز فقط ولا يُرسَل إلى أي مكان.', fromLine: (x) => `من: ${x}` },
  tr: { open: 'Tekbir ve kart', preview: 'Kart önizlemesi', palette: 'Renk', pal: { night: 'Gece yeşili', dawn: 'Şafak kumu', ink: 'Mürekkep ve altın' }, from: 'Kimden (isteğe bağlı)', fromHint: 'İsim yalnızca bu cihazda kalır, hiçbir yere gönderilmez.', fromLine: (x) => `Kimden: ${x}` },
}
const FROM_KEY = 'qm_eid_from'
const PALETTES = ['night', 'dawn', 'ink']
const readFrom = () => { try { return (localStorage.getItem(FROM_KEY) || '').slice(0, 40) } catch { return '' } }

const T = {
  az: { greet: 'Bayramınız mübarək!', fitr: 'Ramazan bayramı', adha: 'Qurban bayramı', takbir: 'Təkbir', card: 'Təbrik kartı', close: 'Bağla', hide: 'Gizlət' },
  en: { greet: 'Eid Mubarak!', fitr: 'Eid al-Fitr', adha: 'Eid al-Adha', takbir: 'Takbir', card: 'Greeting card', close: 'Close', hide: 'Hide' },
  ru: { greet: 'С праздником!', fitr: 'Ураза-байрам', adha: 'Курбан-байрам', takbir: 'Такбир', card: 'Открытка', close: 'Закрыть', hide: 'Скрыть' },
  ar: { greet: 'عيدكم مبارك!', fitr: 'عيد الفطر', adha: 'عيد الأضحى', takbir: 'التكبير', card: 'بطاقة تهنئة', close: 'إغلاق', hide: 'إخفاء' },
  tr: { greet: 'Bayramınız mübarek olsun!', fitr: 'Ramazan Bayramı', adha: 'Kurban Bayramı', takbir: 'Tekbir', card: 'Tebrik kartı', close: 'Kapat', hide: 'Gizle' },
}
const SHOWER_KEY = 'qm_eid_shower'
const HIDE_KEY = 'qm_eid_hide'
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion-user')

function starShower() {
  const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1)
  const cv = document.createElement('canvas')
  cv.className = 'eid-shower'; cv.setAttribute('aria-hidden', 'true')
  cv.width = W * dpr; cv.height = H * dpr
  document.body.appendChild(cv)
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr)
  const n = window.matchMedia?.('(pointer: coarse)').matches ? 45 : 80
  const P = Array.from({ length: n }, () => ({ x: Math.random() * W, y: -Math.random() * H * 0.6, v: 40 + Math.random() * 70, r: 4 + Math.random() * 7, a: Math.random() * 6, w: (Math.random() - 0.5) * 2, c: ['#e7c77d', '#f3e6b5', '#d9b45c', '#ffffff'][Math.floor(Math.random() * 4)] }))
  const star = (r) => { ctx.beginPath(); for (let i = 0; i < 16; i++) { const t = (Math.PI / 8) * i, rr = i % 2 ? r * 0.6 : r; ctx.lineTo(Math.cos(t) * rr, Math.sin(t) * rr) } ctx.closePath() }
  const t0 = performance.now(); let last = t0
  const step = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    const life = (now - t0) / 1000
    ctx.clearRect(0, 0, W, H)
    ctx.globalAlpha = life > 5 ? Math.max(0, 1 - (life - 5)) : 1
    for (const p of P) {
      p.y += p.v * dt; p.a += p.w * dt; p.x += Math.sin(p.a) * 12 * dt
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; star(p.r); ctx.fill(); ctx.restore()
    }
    if (life < 6) requestAnimationFrame(step); else cv.remove()
  }
  requestAnimationFrame(step)
}

export default function EidMode() {
  const { lang } = useLang()
  const t = pickUi(T, lang)
  const t2 = pickUi(T2, lang)
  const [eid] = useState(() => eidToday())
  const [open, setOpen] = useState(false)
  const [palette, setPalette] = useState('night')
  const [from, setFrom] = useState('')
  const openBtn = useRef(null)
  const closeBtn = useRef(null)
  const preview = useRef(null)
  const wasOpen = useRef(false)
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem(HIDE_KEY) === '1' } catch { return false } })

  useEffect(() => {
    if (!eid) return undefined
    const root = document.documentElement
    root.classList.add('eid-mode'); root.dataset.eid = eid.kind
    const day = new Date().toDateString()
    try {
      if (!reduced() && (eid.forced || localStorage.getItem(SHOWER_KEY) !== day)) {
        localStorage.setItem(SHOWER_KEY, day)
        setTimeout(starShower, 800)
      }
    } catch { /* */ }
    return () => { root.classList.remove('eid-mode'); delete root.dataset.eid }
  }, [eid])

  // Zolaq görünəndə səhifənin altında yer (məzmun zolağın altında qalmasın)
  const barOn = !!eid && !hidden && !open
  useEffect(() => {
    if (!barOn) return undefined
    document.documentElement.classList.add('eid-bar-on')
    return () => document.documentElement.classList.remove('eid-bar-on')
  }, [barOn])

  // Pəncərə: "Kimdən" adı (yalnız mount-dan sonra oxunur), fokus, Esc; bağlananda fokus geri
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      setFrom(readFrom())
      closeBtn.current?.focus()
      const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false) } }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
    if (wasOpen.current) { wasOpen.current = false; requestAnimationFrame(() => openBtn.current?.focus()) }
    return undefined
  }, [open])

  const name = eid ? t[eid.kind] : ''
  const fromLine = from.trim() ? t2.fromLine(from.trim()) : ''
  const cardOpts = eid ? { greet: t.greet, name: `${name} · ${eid.hYear}`, ar: EID_TAKBIR.ar, rtl: lang === 'ar', from: fromLine, palette } : null

  // Önizləmə: 1080×1920 kart 0.25 miqyasda (270×480 CSS, 2× sıxlıqla)
  useEffect(() => {
    if (!open || !cardOpts) return undefined
    let alive = true
    import('../utils/eidCard.js').then(({ drawEidCard }) => {
      const c = preview.current
      if (!alive || !c) return
      const ctx = c.getContext('2d')
      ctx.setTransform(0.5, 0, 0, 0.5, 0, 0)
      drawEidCard(ctx, { W: 1080, H: 1920, ...cardOpts })
    }).catch(() => {})
    return () => { alive = false }
  }, [open, palette, fromLine, lang]) // eslint-disable-line react-hooks/exhaustive-deps -- cardOpts bu dəyərlərdən qurulur

  if (!eid) return null
  const tk = EID_TAKBIR
  const pick = (o) => o?.[lang] || o?.en || ''
  const saveFrom = (v) => { const x = v.slice(0, 40); setFrom(x); try { if (x.trim()) localStorage.setItem(FROM_KEY, x); else localStorage.removeItem(FROM_KEY) } catch { /* */ } }

  const shareCard = async () => {
    const { drawEidCard } = await import('../utils/eidCard.js')
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920
    drawEidCard(c.getContext('2d'), { W: 1080, H: 1920, ...cardOpts })
    const blob = await new Promise(r => c.toBlob(r, 'image/png'))
    if (!blob) return
    const file = new File([blob], `bayram-${eid.kind}.png`, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file] }); return } catch (e) { if (e?.name === 'AbortError') return } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }

  return createPortal(
    <>
      {!hidden && !open && (
        <div className="eid-bar" role="status" data-testid="eid-bar">
          <span className="eid-bar__moon" aria-hidden="true" />
          <span className="eid-bar__txt"><b>{t.greet}</b> <small>{name}</small></span>
          <button type="button" className="eid-bar__btn" ref={openBtn} onClick={() => setOpen(true)} data-testid="eid-open">{t2.open}</button>
          <button type="button" className="eid-bar__x" aria-label={t.hide} title={t.hide} onClick={() => { setHidden(true); try { sessionStorage.setItem(HIDE_KEY, '1') } catch { /* */ } }}><Icon name="close" size={18} /></button>
        </div>
      )}
      {open && (
        <div className="eid-modal" role="dialog" aria-modal="true" aria-label={t.takbir} data-testid="eid-modal" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="eid-modal__card">
            <button type="button" className="eid-modal__x" ref={closeBtn} onClick={() => setOpen(false)} aria-label={t.close} title={t.close}><Icon name="close" size={18} /></button>
            <span className="eid-modal__ey">{name}</span>
            <h2 className="eid-modal__title">{t.greet}</h2>
            <p className="eid-modal__ar" lang="ar" dir="rtl">{tk.ar}</p>
            {lang !== 'ar' && <p className="eid-modal__tl">{pick(tk.translit)}</p>}
            {lang !== 'ar' && <p className="eid-modal__tr">{pick(tk.text)}</p>}
            <small className="eid-modal__src">{pick(tk.src)}</small>
            <div className="eid-modal__studio">
              <canvas ref={preview} className="eid-modal__preview" width={540} height={960} role="img" aria-label={t2.preview} data-testid="eid-preview" />
              <div className="eid-modal__opts">
                <fieldset className="eid-modal__pal">
                  <legend>{t2.palette}</legend>
                  {PALETTES.map(k => (
                    <label key={k} className={`eid-sw eid-sw--${k}`}>
                      <input type="radio" name="eid-pal" value={k} checked={palette === k} onChange={() => setPalette(k)} />
                      <span className="eid-sw__dot" aria-hidden="true" /><span>{t2.pal[k]}</span>
                    </label>
                  ))}
                </fieldset>
                <label className="eid-modal__from">
                  <span>{t2.from}</span>
                  <input type="text" className="ui-input" value={from} maxLength={40} autoComplete="name" dir="auto"
                    onChange={(e) => saveFrom(e.target.value)} data-testid="eid-from" />
                  <small>{t2.fromHint}</small>
                </label>
              </div>
            </div>
            <button type="button" className="ui-btn ui-btn--primary" onClick={shareCard} data-testid="eid-card"><Icon name="share" className="ui-btn__icon" /> {t.card}</button>
          </div>
        </div>
      )}
    </>,
    document.body,
  )
}
