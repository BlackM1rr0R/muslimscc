// ═══════════════════════════════════════════════════════
// SkyPlanetarium (v6.9) — "Sizin səmanız indi" (/qibla)
//
// • Namaz yerinizin (utils/prayerLocation) hazırkı göyü: ~2000 ulduz (mag ≤ 5.2,
//   /data/sky/sky.json — HYG, CC BY-SA), bürc xətləri, Süd Yolu, Günəş, Ay və
//   5 planet (utils/skyMath — JPL elementləri), üfüq, istiqamətlər və QİBLƏ.
// • Barmaqla / siçanla çəkmək — göyə baxış dönür; "Telefonla bax" — cihazın
//   oriyentasiyası (DeviceOrientation; iOS icazə istəyir). Vaxt sürgüsü ±12 saat.
// • Ulduza / planetə toxunuş — ad, ərəb adı və mənası (data/starNamesAr.js).
// • Kətan yalnız dəyişəndə çəkilir (sonsuz animasiya yoxdur).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getPrayerLocation } from '../utils/prayerLocation'
import { horizontal } from '../utils/lunar'
import { bodiesNow, galacticEquator, project } from '../utils/skyMath'
import { qiblaBearing } from '../utils/starQibla'
import { BRIGHT_STARS } from '../data/brightStars'
import { STAR_MEANING, EXTRA_STARS } from '../data/starNamesAr'
import { pickUi } from '../utils/uiText'
import Icon from './Icon'
import '../styles/SkyPlanetarium.css'

const T = {
  az: { ey: 'Planetari', title: 'Sizin səmanız indi', lead: 'Olduğunuz yerin göyü bu an: ulduzlar, Ay, planetlər və Süd Yolu. Çəkərək çevirin, ulduza toxunun — çoxunun adı ərəbcədəndir.', gyro: 'Telefonla bax', gyroOff: 'Barmaqla idarə', now: 'İndi', time: 'Vaxt', qibla: 'Qiblə', arName: 'Ərəbcə adı', meaning: 'Mənası', planet: 'Planet', star: 'Ulduz', close: 'Bağla', day: 'Gündüzdür — ulduzlar göydə var, amma Günəşin işığında görünmür.', src: 'Ulduzlar: HYG bazası (CC BY-SA); planetlər: JPL; adların mənası: Kunitzsch və Smart, «A Dictionary of Modern Star Names».', loc: 'Yer', noGyro: 'Bu cihazda oriyentasiya sensoru yoxdur və ya icazə verilmədi.', N: 'Şm', E: 'Ş', S: 'C', W: 'Q' }, // lang-ok[HYG,BY-SA,JPL,Kunitzsch,Smart,Names,Modern,Star,Dictionary,A,of]: mənbə adları
  en: { ey: 'Planetarium', title: 'Your sky right now', lead: 'The sky above you at this moment: stars, the Moon, planets and the Milky Way. Drag to look around and tap a star — many star names come from Arabic.', gyro: 'Look with your phone', gyroOff: 'Drag to look', now: 'Now', time: 'Time', qibla: 'Qibla', arName: 'Arabic name', meaning: 'Meaning', planet: 'Planet', star: 'Star', close: 'Close', day: 'It is daytime — the stars are there, but the Sun outshines them.', src: 'Stars: HYG database (CC BY-SA); planets: JPL; name meanings: Kunitzsch & Smart, “A Dictionary of Modern Star Names”.', loc: 'Location', noGyro: 'This device has no orientation sensor, or permission was denied.', N: 'N', E: 'E', S: 'S', W: 'W' }, // lang-ok[HYG,BY-SA,JPL,Kunitzsch,Smart,Names,Modern,Star,Dictionary,A,of]: mənbə adları
  ru: { ey: 'Планетарий', title: 'Ваше небо сейчас', lead: 'Небо над вами в эту минуту: звёзды, Луна, планеты и Млечный Путь. Перетаскивайте, коснитесь звезды — у многих звёзд арабские имена.', gyro: 'Смотреть телефоном', gyroOff: 'Управлять пальцем', now: 'Сейчас', time: 'Время', qibla: 'Кибла', arName: 'Арабское имя', meaning: 'Значение', planet: 'Планета', star: 'Звезда', close: 'Закрыть', day: 'Сейчас день — звёзды на небе, но Солнце их затмевает.', src: 'Звёзды: база HYG (CC BY-SA); планеты: JPL; значения имён: Kunitzsch, Smart, «A Dictionary of Modern Star Names».', loc: 'Место', noGyro: 'На этом устройстве нет датчика ориентации или доступ не разрешён.', N: 'С', E: 'В', S: 'Ю', W: 'З' }, // lang-ok[HYG,BY-SA,JPL,Kunitzsch,Smart,Names,Modern,Star,Dictionary,A,of]: mənbə adları
  ar: { ey: 'القبة السماوية', title: 'سماؤك الآن', lead: 'السماء فوقك في هذه اللحظة: النجوم والقمر والكواكب ودرب التبانة. اسحب لتنظر حولك والمس نجمًا — كثير من أسماء النجوم عربية الأصل.', gyro: 'انظر بهاتفك', gyroOff: 'التحكم باللمس', now: 'الآن', time: 'الوقت', qibla: 'القبلة', arName: 'الاسم العربي', meaning: 'المعنى', planet: 'كوكب', star: 'نجم', close: 'إغلاق', day: 'الوقت نهار — النجوم في السماء لكن ضوء الشمس يحجبها.', src: 'النجوم: قاعدة HYG؛ الكواكب: JPL؛ معاني الأسماء: كونتش وسمارت.', loc: 'الموقع', noGyro: 'لا يوجد مستشعر اتجاه في هذا الجهاز أو لم يُمنح الإذن.', N: 'ش', E: 'شر', S: 'ج', W: 'غ' }, // lang-ok[HYG,BY-SA,JPL,Kunitzsch,Smart,Names,Modern,Star,Dictionary,A,of]: mənbə adları
  tr: { ey: 'Planetaryum', title: 'Şu anki gökyüzünüz', lead: 'Bulunduğunuz yerin şu anki gökyüzü: yıldızlar, Ay, gezegenler ve Samanyolu. Sürükleyerek çevirin, bir yıldıza dokunun — pek çok yıldızın adı Arapçadan gelir.', gyro: 'Telefonla bak', gyroOff: 'Parmakla yönet', now: 'Şimdi', time: 'Zaman', qibla: 'Kıble', arName: 'Arapça adı', meaning: 'Anlamı', planet: 'Gezegen', star: 'Yıldız', close: 'Kapat', day: 'Şu an gündüz — yıldızlar gökte ama Güneş’in ışığında görünmüyor.', src: 'Yıldızlar: HYG veritabanı (CC BY-SA); gezegenler: JPL; ad anlamları: Kunitzsch ve Smart.', loc: 'Konum', noGyro: 'Bu cihazda yön sensörü yok ya da izin verilmedi.', N: 'K', E: 'D', S: 'G', W: 'B' }, // lang-ok[HYG,BY-SA,JPL,Kunitzsch,Smart,Names,Modern,Star,Dictionary,A,of]: mənbə adları
}
const BODY = {
  sun: { az: 'Günəş', en: 'Sun', ru: 'Солнце', ar: 'الشمس', tr: 'Güneş', c: '#ffd257', r: 9 }, // lang-ok: planet adları
  moon: { az: 'Ay', en: 'Moon', ru: 'Луна', ar: 'القمر', tr: 'Ay', c: '#f4f1e6', r: 8 }, // lang-ok: planet adları
  mercury: { az: 'Merkuri', en: 'Mercury', ru: 'Меркурий', ar: 'عطارد', tr: 'Merkür', c: '#cfc6b8', r: 3 }, // lang-ok: planet adları
  venus: { az: 'Venera', en: 'Venus', ru: 'Венера', ar: 'الزهرة', tr: 'Venüs', c: '#fff6d6', r: 4.5 }, // lang-ok: planet adları
  mars: { az: 'Mars', en: 'Mars', ru: 'Марс', ar: 'المريخ', tr: 'Mars', c: '#ff8a5c', r: 3.6 }, // lang-ok: planet adları
  jupiter: { az: 'Yupiter', en: 'Jupiter', ru: 'Юпитер', ar: 'المشتري', tr: 'Jüpiter', c: '#ffe2b0', r: 4.2 }, // lang-ok: planet adları
  saturn: { az: 'Saturn', en: 'Saturn', ru: 'Сатурн', ar: 'زحل', tr: 'Satürn', c: '#f2dca0', r: 3.8 }, // lang-ok: planet adları
}
const HOUR = 3600000

// B−V rəng indeksi → ulduz rəngi
function starColor(bv) {
  if (bv < 0) return '#b9ccff'
  if (bv < 0.3) return '#dfe7ff'
  if (bv < 0.6) return '#fbf8ff'
  if (bv < 1.0) return '#fff1d6'
  if (bv < 1.4) return '#ffd9a8'
  return '#ffbf86'
}

// Adlı ulduzlar: brightStars + əlavələr (ərəb adı və mənası ilə)
const NAMED = [
  ...BRIGHT_STARS.map(s => ({ id: s.id, ra: s.ra, dec: s.dec, name: s.name?.en || s.id, ar: STAR_MEANING[s.id]?.[0] || s.ar || '' })),
  ...EXTRA_STARS.map(([id, name, ra, dec]) => ({ id, ra, dec, name, ar: STAR_MEANING[id]?.[0] || '' })),
]
const MILKY = galacticEquator(2)
// Süd Yolunun eni və parlaqlığı dəyişkəndir (Qalaktika mərkəzinə — l≈0 — yaxın daha parlaq)
const MILKY_R = MILKY.map((_, i) => 26 + 22 * Math.abs(Math.sin(i * 1.7)) + (i % 7) * 2)
const MILKY_K = MILKY.map((_, i) => { const l = i * 2; const c = Math.cos((l * Math.PI) / 180); return 0.025 + 0.035 * Math.max(0, c) + 0.01 * Math.abs(Math.sin(i * 2.3)) })

export default function SkyPlanetarium({ lang = 'az' }) {
  const u = pickUi(T, lang, 'en')
  const loc = useMemo(() => getPrayerLocation(), [])
  const cvs = useRef(null)
  const box = useRef(null)
  const [data, setData] = useState(null)
  const [offset, setOffset] = useState(0)        // saat (±12)
  const [view, setView] = useState({ az: 180, alt: 35, fov: 110 })
  const [gyro, setGyro] = useState(false)
  const [gyroErr, setGyroErr] = useState(false)
  const [pick, setPick] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const hits = useRef([])

  useEffect(() => {
    let live = true
    fetch('/data/sky/sky.json').then(r => r.json()).then(d => { if (live) setData(d) }).catch(() => {})
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => { live = false; clearInterval(t) }
  }, [])

  const ms = now + offset * HOUR
  // Üfüqi koordinatlar — vaxt dəyişəndə (kadrda yox)
  const sky = useMemo(() => {
    if (!data) return null
    const { lat, lng } = loc
    const stars = data.stars.map(([ra, dec, mag, bv]) => ({ ...horizontal(ra, dec, ms, lat, lng), mag, bv }))
    const lines = data.lines.map(l => l.map(([ra, dec]) => horizontal(ra, dec, ms, lat, lng)))
    const milky = MILKY.map(([ra, dec], i) => ({ ...horizontal(ra, dec, ms, lat, lng), r: MILKY_R[i], k: MILKY_K[i] }))
    const named = NAMED.map(s => ({ ...s, ...horizontal(s.ra, s.dec, ms, lat, lng) }))
    const bodies = bodiesNow(ms, lat, lng)
    return { stars, lines, milky, named, bodies, sunAlt: bodies[0].alt }
  }, [data, ms, loc])

  const draw = useCallback(() => {
    const c = cvs.current
    if (!c || !sky) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = c.clientWidth, h = c.clientHeight
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr) }
    const g = c.getContext('2d')
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    const day = Math.max(0, Math.min(1, (sky.sunAlt + 12) / 18))   // −12° → 0, +6° → 1
    const grad = g.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, day > 0.5 ? '#2f6db5' : `rgb(${8 + day * 40},${12 + day * 70},${30 + day * 120})`)
    grad.addColorStop(1, day > 0.5 ? '#9cc7ec' : `rgb(${18 + day * 80},${24 + day * 90},${52 + day * 110})`)
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
    const P = (alt, az) => project(alt, az, view, w, h)
    const starAlpha = 1 - day * 0.85
    // Süd Yolu
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const p of sky.milky) {
      if (p.alt < -2) continue
      const q = P(p.alt, p.az)
      if (!q) continue
      const R = p.r * Math.sqrt(110 / view.fov)
      const rr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], R)
      rr.addColorStop(0, `rgba(190,200,255,${p.k * starAlpha})`)
      rr.addColorStop(1, 'rgba(190,200,255,0)')
      g.fillStyle = rr
      g.fillRect(q[0] - R, q[1] - R, R * 2, R * 2)
    }
    g.restore()
    // Bürc xətləri
    g.strokeStyle = `rgba(150,180,255,${0.28 * starAlpha})`
    g.lineWidth = 1
    for (const l of sky.lines) {
      g.beginPath()
      let pen = false
      for (const p of l) {
        const q = p.alt > -5 ? P(p.alt, p.az) : null
        if (!q) { pen = false; continue }
        if (pen) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1])
        pen = true
      }
      g.stroke()
    }
    // Ulduzlar
    const zoom = 110 / view.fov
    for (const s of sky.stars) {
      if (s.alt < 0) continue
      const q = P(s.alt, s.az)
      if (!q) continue
      const r = Math.max(0.5, (5.6 - s.mag) * 0.55) * Math.sqrt(zoom)
      g.globalAlpha = Math.min(1, (0.35 + (5.5 - s.mag) * 0.17)) * starAlpha
      g.fillStyle = starColor(s.bv)
      g.beginPath(); g.arc(q[0], q[1], r, 0, Math.PI * 2); g.fill()
    }
    g.globalAlpha = 1
    const hit = []
    const boxes = []
    // Adlı ulduzlar (ad yazısı)
    g.font = '600 12px Inter, system-ui, sans-serif'
    g.textAlign = 'left'
    for (const s of sky.named) {
      if (s.alt < 2) continue
      const q = P(s.alt, s.az)
      if (!q || q[0] < -20 || q[0] > w + 20 || q[1] < -20 || q[1] > h + 20) continue
      hit.push({ kind: 'star', id: s.id, name: s.name, ar: s.ar, x: q[0], y: q[1] })
      if (starAlpha < 0.35) continue
      // Yazılar üst-üstə düşməsin — tutulmuş yerə yazılmır (toxunanda yenə açılır)
      const label = s.ar ? `${s.name} · ${s.ar}` : s.name
      const lw = g.measureText(label).width, lx = q[0] + 7, ly = q[1] - 6
      if (boxes.some(b => lx < b[0] + b[2] && lx + lw > b[0] && ly - 12 < b[1] && ly > b[1] - 12)) continue
      boxes.push([lx, ly, lw])
      g.fillStyle = `rgba(231,199,125,${0.85 * starAlpha})`
      g.fillText(label, lx, ly)
    }
    // Günəş, Ay, planetlər
    for (const b of sky.bodies) {
      if (b.alt < -1) continue
      const q = P(b.alt, b.az)
      if (!q) continue
      const B = BODY[b.id]
      g.save()
      g.shadowColor = B.c; g.shadowBlur = b.id === 'sun' ? 30 : 12
      g.fillStyle = B.c
      g.beginPath(); g.arc(q[0], q[1], B.r * Math.sqrt(zoom), 0, Math.PI * 2); g.fill()
      g.restore()
      g.fillStyle = '#fff'
      g.font = '700 12px Inter, system-ui, sans-serif'
      g.fillText(B[lang] || B.en, q[0] + B.r + 5, q[1] + 4)
      hit.push({ kind: 'body', id: b.id, x: q[0], y: q[1] })
    }
    // Yer (üfüqdən aşağı)
    g.beginPath()
    let first = true
    for (let az = 0; az <= 360; az += 3) {
      const q = P(0, az)
      if (!q) { first = true; continue }
      if (first) { g.moveTo(q[0], q[1]); first = false } else g.lineTo(q[0], q[1])
    }
    g.strokeStyle = 'rgba(231,199,125,.75)'; g.lineWidth = 1.5; g.stroke()
    // Yer — üfüqdən aşağı zolaq (tünd)
    for (let az = 0; az < 360; az += 2) {
      const a = P(0, az), b = P(0, az + 2), c2 = P(-40, az + 2), d = P(-40, az)
      if (!a || !b || !c2 || !d) continue
      g.fillStyle = 'rgba(10,22,18,.92)'
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c2[0], c2[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill()
    }
    // İstiqamətlər və qiblə
    g.font = '700 13px Inter, system-ui, sans-serif'
    g.textAlign = 'center'
    for (const [lab, az] of [[u.N, 0], [u.E, 90], [u.S, 180], [u.W, 270]]) {
      const q = P(0, az)
      if (!q) continue
      g.fillStyle = '#e7c77d'; g.fillText(lab, q[0], q[1] + 18)
    }
    const qb = qiblaBearing(loc.lat, loc.lng)
    const qq = P(0, qb)
    if (qq) {
      g.fillStyle = '#e7c77d'
      g.beginPath(); g.moveTo(qq[0], qq[1] - 4); g.lineTo(qq[0] - 7, qq[1] + 9); g.lineTo(qq[0] + 7, qq[1] + 9); g.closePath(); g.fill()
      g.fillText(`🕋 ${u.qibla}`, qq[0], qq[1] + 26)
    }
    hits.current = hit
  }, [sky, view, u, lang, loc])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    if (cvs.current) ro.observe(cvs.current)
    return () => ro.disconnect()
  }, [draw])

  // Çəkmə ilə baxış
  const drag = useRef(null)
  const onDown = (e) => {
    if (gyro) return
    drag.current = { x: e.clientX, y: e.clientY, v: view, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const k = d.v.fov / (cvs.current?.clientWidth || 600)
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true
    setView({ ...d.v, az: ((d.v.az - dx * k) % 360 + 360) % 360, alt: Math.max(-10, Math.min(90, d.v.alt + dy * k)) })
  }
  const onUp = (e) => {
    const d = drag.current
    drag.current = null
    if (d && !d.moved) {
      const r = cvs.current.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      let best = null
      for (const hh of hits.current) {
        const dd = Math.hypot(hh.x - x, hh.y - y)
        if (dd < 24 && (!best || dd < best.d)) best = { ...hh, d: dd }
      }
      setPick(best)
    }
  }
  const onWheel = (e) => setView(v => ({ ...v, fov: Math.max(40, Math.min(150, v.fov * (e.deltaY > 0 ? 1.08 : 0.93))) }))

  // Telefonla bax — DeviceOrientation
  useEffect(() => {
    if (!gyro) return undefined
    const on = (e) => {
      const heading = typeof e.webkitCompassHeading === 'number' ? e.webkitCompassHeading : (e.absolute && e.alpha != null ? (360 - e.alpha) % 360 : null)
      if (heading == null || e.beta == null) return
      setView(v => ({ ...v, az: heading, alt: Math.max(-10, Math.min(90, e.beta - 90)) }))
    }
    window.addEventListener('deviceorientationabsolute', on)
    window.addEventListener('deviceorientation', on)
    return () => { window.removeEventListener('deviceorientationabsolute', on); window.removeEventListener('deviceorientation', on) }
  }, [gyro])
  const toggleGyro = async () => {
    if (gyro) { setGyro(false); return }
    try {
      const DOE = window.DeviceOrientationEvent
      if (!DOE) { setGyroErr(true); return }
      if (typeof DOE.requestPermission === 'function') {
        const res = await DOE.requestPermission()
        if (res !== 'granted') { setGyroErr(true); return }
      }
      setGyroErr(false)
      setGyro(true)
    } catch { setGyroErr(true) }
  }

  const info = pick && (pick.kind === 'body'
    ? { title: BODY[pick.id][lang] || BODY[pick.id].en, ar: BODY[pick.id].ar, kind: u.planet }
    : { title: pick.name, ar: pick.ar, kind: u.star, meaning: STAR_MEANING[pick.id]?.[1] })
  const hh = new Date(ms)
  const timeLabel = hh.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
  return (
    <section className="ui-card skyp" aria-labelledby="skyp-title" data-testid="sky-planetarium" ref={box}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="skyp-title" className="skyp__title">{u.title}</h2>
      <p className="skyp__lead">{u.lead}</p>
      <div className="skyp__stage">
        <canvas ref={cvs} className="skyp__cvs" role="img" aria-label={`${u.title} — ${u.loc}: ${loc.name || ''}`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { drag.current = null }} onWheel={onWheel} />
        {sky && sky.sunAlt > -6 && <p className="skyp__day">{u.day}</p>}
        {info && (
          <div className="skyp__info" role="dialog" aria-label={info.title} data-testid="sky-info">
            <button type="button" className="ui-icon-btn skyp__x" onClick={() => setPick(null)} aria-label={u.close}><Icon name="close" size={16} /></button>
            <span className="skyp__kind">{info.kind}</span>
            <p className="skyp__name">{info.title}</p>
            {info.ar && <p className="skyp__ar"><span>{u.arName}:</span> <b lang="ar" dir="rtl">{info.ar}</b></p>}
            {info.meaning && <p className="skyp__mean"><span>{u.meaning}:</span> {pickUi(info.meaning, lang, 'en')}</p>}
          </div>
        )}
      </div>
      <div className="skyp__bar">
        <button type="button" className={`ui-btn ui-btn--sm ${gyro ? 'ui-btn--primary' : 'ui-btn--secondary'}`} onClick={toggleGyro} aria-pressed={gyro}>
          <Icon name="compass" className="ui-btn__icon" /> {gyro ? u.gyroOff : u.gyro}
        </button>
        <label className="skyp__time">
          <span>{u.time}: <b className="ui-num">{timeLabel}</b></span>
          <input type="range" min="-12" max="12" step="0.25" value={offset} onChange={(e) => setOffset(Number(e.target.value))} aria-label={u.time} />
        </label>
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setOffset(0); setNow(Date.now()) }} disabled={offset === 0}>{u.now}</button>
      </div>
      {gyroErr && <p className="skyp__err" role="status">{u.noGyro}</p>}
      <p className="skyp__src">{u.src}</p>
    </section>
  )
}
