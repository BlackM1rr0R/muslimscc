// ═══════════════════════════════════════════════════════
// PrayerWallpaper (v5.8) — kilid ekranı üçün namaz vaxtları divar kağızı (/prayer)
//
//   <PrayerWallpaper city="Bakı" hijri="17 Cümadəl-ulə 1448" today={{ fajr:'05:42', … }}
//     names={{ fajr:'Sübh', … }} month={[{ day, weekday, times }]} monthLabel="Noyabr 2026" lang="az" />
//
// • Kətanda çəkilir (şəbəkə yoxdur): tünd yaşıl gecə səması, ulduzlar, hilal.
//   Yuxarı ~32% boş qalır — telefonun öz saatı oraya düşür.
// • "Bu gün" — 6 vaxt iri; "Bu ay" — ayın bütün günləri (5 fərz) cədvəldə, bu gün vurğulu.
// • Ölçü: iPhone (1179×2556) və ya Android (1080×2400). Web Share (fayl) və ya PNG yükləmə.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import '../../styles/PrayerWallpaper.css'

const T = {
  az: { ey: 'Kilid ekranı', title: 'Namaz vaxtları divar kağızı', lead: 'Telefonun kilid ekranına qoymaq üçün gözəl şəkil — bu günün və ya bütün ayın vaxtları ilə.', day: 'Bu gün', month: 'Bu ay', make: 'Şəkli yarat', made: 'Hazırdır', hint: 'Şəkli «Şəkillər»də açın → Paylaş → «Divar kağızı kimi istifadə et».' },
  en: { ey: 'Lock screen', title: 'Prayer times wallpaper', lead: 'A beautiful image for your phone’s lock screen — with today’s times or the whole month.', day: 'Today', month: 'This month', make: 'Create image', made: 'Ready', hint: 'Open the image in Photos → Share → “Use as Wallpaper”.' },
  ru: { ey: 'Экран блокировки', title: 'Обои со временем намаза', lead: 'Красивая картинка для экрана блокировки — со временем на сегодня или на весь месяц.', day: 'Сегодня', month: 'Этот месяц', make: 'Создать картинку', made: 'Готово', hint: 'Откройте картинку в «Фото» → Поделиться → «Сделать обоями».' },
  ar: { ey: 'شاشة القفل', title: 'خلفية مواقيت الصلاة', lead: 'صورة جميلة لشاشة قفل هاتفك — بمواقيت اليوم أو الشهر كله.', day: 'اليوم', month: 'هذا الشهر', make: 'أنشئ الصورة', made: 'جاهزة', hint: 'افتح الصورة في «الصور» ← مشاركة ← «استخدام كخلفية».' },
  tr: { ey: 'Kilit ekranı', title: 'Namaz vakitleri duvar kâğıdı', lead: 'Telefonunuzun kilit ekranı için güzel bir görsel — bugünün veya bütün ayın vakitleriyle.', day: 'Bugün', month: 'Bu ay', make: 'Görseli oluştur', made: 'Hazır', hint: 'Görseli «Fotoğraflar»da açın → Paylaş → «Duvar Kâğıdı Olarak Kullan».' },
}
const SIZES = { ios: [1179, 2556], android: [1080, 2400] }
const DAY6 = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
const FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

export function drawWallpaper(ctx, { W, H, mode, city, hijri, today, names, month, monthLabel, todayDay, rtl }) {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#050b18'); bg.addColorStop(0.45, '#0b2a22'); bg.addColorStop(1, '#061a14')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  // ulduzlar (deterministik)
  let seed = 7
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  for (let i = 0; i < 160; i++) {
    ctx.globalAlpha = 0.25 + rnd() * 0.6
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H * 0.6, rnd() * 2.2 + 0.4, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1
  // hilal — ayrıca kətanda (destination-out yalnız orada işləyir, fonu silmir)
  const mr = Math.round(W * 0.05), mc = document.createElement('canvas'); mc.width = mc.height = mr * 4
  const m = mc.getContext('2d')
  m.fillStyle = '#f3e6b5'; m.beginPath(); m.arc(mr * 2, mr * 2, mr, 0, Math.PI * 2); m.fill()
  m.globalCompositeOperation = 'destination-out'
  m.beginPath(); m.arc(mr * 2 + mr * 0.45, mr * 2 - mr * 0.2, mr * 0.88, 0, Math.PI * 2); m.fill()
  ctx.save(); ctx.shadowColor = 'rgba(243,230,181,.7)'; ctx.shadowBlur = 40
  ctx.drawImage(mc, W * 0.8 - mr * 2, H * 0.07 - mr * 2); ctx.restore()

  const cx = W / 2
  ctx.textAlign = 'center'; ctx.direction = rtl ? 'rtl' : 'ltr'
  let y = H * 0.34
  ctx.fillStyle = '#e7c77d'; ctx.font = `700 ${Math.round(W * 0.034)}px system-ui, sans-serif`
  ctx.fillText(String(city || '').toLocaleUpperCase(rtl ? 'ar' : undefined), cx, y)
  y += W * 0.05
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = `500 ${Math.round(W * 0.032)}px system-ui, sans-serif`
  const ml = String(monthLabel || '')
  ctx.fillText(mode === 'month' ? ml.charAt(0).toLocaleUpperCase() + ml.slice(1) + (/\d{4}/.test(ml) ? '' : ` ${new Date().getFullYear()}`) : (hijri || ''), cx, y)

  const card = (x, yy, w, h, r = 36) => {
    ctx.beginPath(); ctx.roundRect(x, yy, w, h, r)
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill()
    ctx.strokeStyle = 'rgba(231,199,125,0.28)'; ctx.lineWidth = 2; ctx.stroke()
  }

  if (mode === 'day') {
    const top = y + W * 0.06, rowH = W * 0.15, pad = W * 0.08
    card(pad, top, W - pad * 2, rowH * DAY6.length + W * 0.04)
    DAY6.forEach((k, i) => {
      const ry = top + W * 0.02 + rowH * i + rowH / 2
      const aux = k === 'sunrise'
      ctx.textAlign = rtl ? 'right' : 'left'
      ctx.fillStyle = aux ? 'rgba(255,255,255,.55)' : '#fff'
      ctx.font = `${aux ? 500 : 600} ${Math.round(W * (aux ? 0.042 : 0.05))}px system-ui, sans-serif`
      ctx.fillText(names?.[k] || k, rtl ? W - pad * 1.6 : pad * 1.6, ry + W * 0.017)
      ctx.textAlign = rtl ? 'left' : 'right'
      ctx.fillStyle = aux ? 'rgba(255,255,255,.55)' : '#f3e6b5'
      ctx.font = `${aux ? 500 : 700} ${Math.round(W * (aux ? 0.046 : 0.062))}px ui-monospace, "SF Mono", Menlo, monospace`
      ctx.fillText(today?.[k] || '--:--', rtl ? pad * 1.6 : W - pad * 1.6, ry + W * 0.02)
      if (i < DAY6.length - 1) { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(pad * 1.6, top + W * 0.02 + rowH * (i + 1), W - pad * 3.2, 2) }
    })
  } else {
    const days = Array.isArray(month) ? month : []
    const top = y + W * 0.045, pad = W * 0.05
    const headH = W * 0.05
    const rowH = Math.min(W * 0.045, (H * 0.93 - top - headH) / Math.max(28, days.length))
    card(pad, top, W - pad * 2, headH + rowH * days.length + W * 0.025, 28)
    const colX = (i) => pad + W * 0.16 + i * ((W - pad * 2 - W * 0.2) / FARD.length) + (W - pad * 2 - W * 0.2) / FARD.length / 2
    ctx.textAlign = 'center'
    ctx.fillStyle = '#e7c77d'; ctx.font = `700 ${Math.round(W * 0.026)}px system-ui, sans-serif`
    FARD.forEach((k, i) => ctx.fillText(String(names?.[k] || k), colX(i), top + headH * 0.75))
    days.forEach((d, r) => {
      const ry = top + headH + rowH * r + rowH * 0.72
      const cur = d.day === todayDay
      if (cur) { ctx.fillStyle = 'rgba(231,199,125,.2)'; ctx.fillRect(pad + 6, ry - rowH * 0.74, W - pad * 2 - 12, rowH) }
      ctx.fillStyle = cur ? '#f3e6b5' : d.weekday === 5 ? '#a7f3d0' : 'rgba(255,255,255,.7)'
      ctx.font = `${cur ? 800 : 600} ${Math.round(rowH * 0.56)}px ui-monospace, "SF Mono", Menlo, monospace`
      ctx.fillText(String(d.day), pad + W * 0.08, ry)
      ctx.fillStyle = cur ? '#fff' : 'rgba(255,255,255,.88)'
      FARD.forEach((k, i) => ctx.fillText(d.times?.[k] || '—', colX(i), ry))
    })
  }
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(231,199,125,.85)'; ctx.font = `700 ${Math.round(W * 0.03)}px system-ui, sans-serif`
  ctx.fillText('muslims.cc', cx, H - W * 0.06)
}

export default function PrayerWallpaper({ city, hijri, today, names, month, monthLabel, lang = 'az' }) {
  const t = pickUi(T, lang)
  const [mode, setMode] = useState('day')
  const [dev, setDev] = useState(() => (typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent) ? 'android' : 'ios'))
  const [done, setDone] = useState(false)
  const hasMonth = Array.isArray(month) && month.length > 0
  if (!today) return null

  const make = async () => {
    const [W, H] = SIZES[dev]
    const c = document.createElement('canvas'); c.width = W; c.height = H
    drawWallpaper(c.getContext('2d'), { W, H, mode: hasMonth ? mode : 'day', city, hijri, today, names, month, monthLabel, todayDay: new Date().getDate(), rtl: lang === 'ar' })
    const blob = await new Promise(r => c.toBlob(r, 'image/png'))
    if (!blob) return
    const file = new File([blob], `namaz-vaxtlari-${mode}.png`, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); setDone(true); return } catch (e) { if (e?.name === 'AbortError') return }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    setDone(true)
  }

  return (
    <div className="ui-card pwp" data-testid="prayer-wallpaper">
      <div className="pwp__text">
        <span className="ui-eyebrow"><Icon name="image" size={14} /> {t.ey}</span>
        <h3 className="pwp__title">{t.title}</h3>
        <p className="pwp__lead">{t.lead}</p>
        <div className="pwp__opts">
          {hasMonth && (
            <div className="pwp__seg" role="group">
              {['day', 'month'].map(m => <button key={m} type="button" className={mode === m ? 'is-on' : ''} aria-pressed={mode === m} onClick={() => setMode(m)}>{t[m]}</button>)}
            </div>
          )}
          <div className="pwp__seg" role="group">
            {['ios', 'android'].map(d => <button key={d} type="button" className={dev === d ? 'is-on' : ''} aria-pressed={dev === d} onClick={() => setDev(d)}>{d === 'ios' ? 'iPhone' : 'Android'}</button>)}
          </div>
        </div>
        <button type="button" className="ui-btn ui-btn--primary" onClick={make} data-testid="pwp-make">
          <Icon name={done ? 'check' : 'download'} className="ui-btn__icon" /> {done ? t.made : t.make}
        </button>
        <small className="pwp__hint">{t.hint}</small>
      </div>
      <div className="pwp__phone" aria-hidden="true">
        <div className="pwp__screen">
          <span className="pwp__clock ui-num">{new Date().toTimeString().slice(0, 5)}</span>
          <div className="pwp__list">
            {(mode === 'month' && hasMonth ? FARD : DAY6).map(k => (
              <span key={k} className={k === 'sunrise' ? 'is-aux' : ''}><b>{names?.[k] || k}</b><i className="ui-num">{today[k] || '--:--'}</i></span>
            ))}
          </div>
          <span className="pwp__brand">muslims.cc</span>
        </div>
      </div>
    </div>
  )
}
