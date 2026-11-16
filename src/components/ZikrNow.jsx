// ═══════════════════════════════════════════════════════
// ZikrNow — "İndi zikr edənlər" (/dhikr) — son 10 dəqiqədə saytda zikr edilən yerlər qlobusda
//
// • Məlumat: GET /api/ummah/here (server/ummah.js) — ~200 km-lik xanalar, ad / IP / dəqiq yer yoxdur.
//   Siz yalnız namaz vaxtları üçün ÖZ şəhərinizi seçmisinizsə və zikr etdikcə xəritəyə düşürsünüz
//   (utils/ummah.js → sendHere, 2 dəq-də bir). Xaricdən heç nə yüklənmir.
// • Qlobus yavaş fırlanır (barmaqla da), nöqtənin parıltısı say ilə böyüyür. 30 s-dən bir yenilənir,
//   yalnız ekrandadırsa və vərəq görünürsə. Hərəkət azaldılıbsa — fırlanmır.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { geoOrthographic, geoPath, geoGraticule10 } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced.js'
import { fetchUmmahHere } from '../utils/ummah'
import '../styles/ZikrNow.css'

const T = {
  az: { ey: 'Canlı', title: 'İndi zikr edənlər', lead: 'Son 10 dəqiqədə saytda zikr və salavat deyilən yerlər. Hər işıq — bir bölgə (~200 km), kim olduğu bilinmir.', places: (n) => `${n} bölgə`, people: (n) => `${n} toxunuş seriyası`, empty: 'Hələ heç kim yoxdur — ilk siz olun.', how: 'Siz də görünmək istəyirsinizsə, namaz vaxtları üçün şəhərinizi seçin. Ad, IP və dəqiq yer saxlanmır.' },
  en: { ey: 'Live', title: 'Remembering Allah right now', lead: 'Places where dhikr and salawat were said on the site in the last 10 minutes. Each light is a region (~200 km) — nobody is identified.', places: (n) => `${n} regions`, people: (n) => `${n} dhikr sessions`, empty: 'No one yet — be the first.', how: 'To appear yourself, choose your city for prayer times. No name, IP or exact location is stored.' },
  ru: { ey: 'Вживую', title: 'Сейчас поминают Аллаха', lead: 'Места, где за последние 10 минут на сайте произносили зикр и салават. Каждый огонёк — регион (~200 км), личности не известны.', places: (n) => `регионов: ${n}`, people: (n) => `сессий зикра: ${n}`, empty: 'Пока никого — будьте первым.', how: 'Чтобы появиться на карте, выберите свой город для времени намаза. Имя, IP и точное место не хранятся.' }, // lang-ok[IP]: texniki qısaltma
  tr: { ey: 'Canlı', title: 'Şu an zikredenler', lead: 'Son 10 dakikada sitede zikir ve salavat okunan yerler. Her ışık bir bölgedir (~200 km) — kim olduğu bilinmez.', places: (n) => `${n} bölge`, people: (n) => `${n} zikir oturumu`, empty: 'Henüz kimse yok — ilk siz olun.', how: 'Siz de görünmek isterseniz namaz vakitleri için şehrinizi seçin. Ad, IP ve tam konum saklanmaz.' },
  ar: { ey: 'مباشر', title: 'الذاكرون الآن', lead: 'أماكن قيل فيها الذكر والصلاة على النبي ﷺ في الموقع خلال آخر ١٠ دقائق. كل ضوء منطقة (~٢٠٠ كم) — ولا يُعرف أحد.', places: (n) => `${n} منطقة`, people: (n) => `${n} جلسة ذكر`, empty: 'لا أحد بعد — كن أول الذاكرين.', how: 'لتظهر على الخريطة اختر مدينتك لمواقيت الصلاة. لا يُحفظ اسم ولا عنوان IP ولا موقع دقيق.' }, // lang-ok[IP]: texniki qısaltma
}

let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then((r) => r.json()).then((topo) => feature(topo, topo.objects.land)))

export default function ZikrNow() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const cv = useRef(null), wrap = useRef(null)
  const [cells, setCells] = useState(null)
  const [land, setLand] = useState(null)
  const rot = useRef([-45, -20])
  const drag = useRef(null)
  const visible = useRef(true)

  useEffect(() => { let live = true; loadLand().then((l) => { if (live) setLand(l) }).catch(() => {}); return () => { live = false } }, [])

  // Məlumat: 30 s-dən bir, yalnız ekrandadırsa və vərəq görünürsə
  useEffect(() => {
    let live = true, timer = 0
    const load = () => {
      if (visible.current && document.visibilityState === 'visible') fetchUmmahHere().then((c) => { if (live) setCells(c) }).catch(() => { if (live) setCells((c) => c || []) })
      timer = setTimeout(load, 30000)
    }
    load()
    return () => { live = false; clearTimeout(timer) }
  }, [])

  useEffect(() => {
    const el = wrap.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Çəkiliş: requestAnimationFrame (yalnız görünəndə), yavaş fırlanma
  useEffect(() => {
    const c = cv.current
    if (!c) return undefined
    let raf = 0, last = performance.now()
    // Hərəkət azaldılıbsa — yalnız dəyişəndə (sürükləmə, ölçü) çəkilir; əks halda ~30 kadr/s,
    // ekrandan kənarda və gizli vərəqdə heç çəkilmir (əsas axın boş qalsın)
    let lastDrawn = -1e9, lastKey = ''
    const draw = (now) => {
      const dt = Math.min(64, now - last); last = now
      const key = `${rot.current[0].toFixed(2)},${rot.current[1].toFixed(2)},${c.clientWidth}`
      const due = reduced ? key !== lastKey : (now - lastDrawn > 33 || drag.current)
      if (due && visible.current && document.visibilityState === 'visible') {
        lastDrawn = now
        if (!reduced && !drag.current) rot.current = [rot.current[0] + Math.max(dt, 33) * 0.006, rot.current[1]]
        lastKey = `${rot.current[0].toFixed(2)},${rot.current[1].toFixed(2)},${c.clientWidth}`
        const size = c.clientWidth || 300
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        if (c.width !== Math.round(size * dpr)) { c.width = Math.round(size * dpr); c.height = Math.round(size * dpr) }
        const ctx = c.getContext('2d')
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, size, size)
        const proj = geoOrthographic().translate([size / 2, size / 2]).scale(size * 0.46).rotate(rot.current).clipAngle(90)
        const path = geoPath(proj, ctx)
        const g = ctx.createRadialGradient(size * 0.4, size * 0.35, size * 0.05, size / 2, size / 2, size * 0.48)
        g.addColorStop(0, '#1d3a5c'); g.addColorStop(1, '#0a1626')
        ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); path(geoGraticule10()); ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 0.6; ctx.stroke()
        if (land) { ctx.beginPath(); path(land); ctx.fillStyle = '#28486b'; ctx.fill() }
        const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(now / 500)
        for (const cell of cells || []) {
          const p = proj([cell.lng, cell.lat])
          // arxa tərəfdəki nöqtələr görünmür
          const r0 = rot.current, lam = (cell.lng + r0[0]) * Math.PI / 180, phi = cell.lat * Math.PI / 180, phi0 = -r0[1] * Math.PI / 180
          if (!p || Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lam) < 0) continue
          const R = (4 + Math.min(14, Math.sqrt(cell.n) * 3)) * pulse
          const glow = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], R * 2.4)
          glow.addColorStop(0, 'rgba(255,214,120,.95)'); glow.addColorStop(0.35, 'rgba(255,190,90,.45)'); glow.addColorStop(1, 'rgba(255,190,90,0)')
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p[0], p[1], R * 2.4, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.arc(p[0], p[1], 2.2, 0, Math.PI * 2); ctx.fill()
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [cells, land, reduced])

  const onDown = (e) => { drag.current = { x: e.clientX, y: e.clientY, r: rot.current }; e.currentTarget.setPointerCapture?.(e.pointerId) }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    rot.current = [d.r[0] + (e.clientX - d.x) * 0.4, Math.max(-60, Math.min(60, d.r[1] - (e.clientY - d.y) * 0.4))]
  }
  const onUp = () => { drag.current = null }

  const total = (cells || []).reduce((a, c) => a + c.n, 0)
  return (
    <section className="ui-card zn" aria-labelledby="zn-title" data-testid="zikr-now" data-cells={cells ? cells.length : -1} ref={wrap}>
      <span className="ui-eyebrow">{t.ey}</span>
      <h2 id="zn-title" className="zn__title">{t.title}</h2>
      <p className="zn__lead">{t.lead}</p>
      <div className="zn__body">
        <canvas ref={cv} className="zn__globe" role="img" aria-label={`${t.title}: ${t.places((cells || []).length)}`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
        <div className="zn__stats" aria-live="polite">
          {cells && cells.length > 0 ? (
            <>
              <b className="ui-num">{t.places(cells.length)}</b>
              <span>{t.people(total)}</span>
            </>
          ) : cells ? <span>{t.empty}</span> : null}
          <p className="zn__how">{t.how}</p>
        </div>
      </div>
    </section>
  )
}
