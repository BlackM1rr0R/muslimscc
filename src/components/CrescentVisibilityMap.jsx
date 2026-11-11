// ═══════════════════════════════════════════════════════
// CrescentVisibilityMap (v6.2) — "Hilalın görünmə xəritəsi" (/calendar)
//
//   <CrescentVisibilityMap lang="az" />
//
// • Növbəti (və ya son 3 gündəki) birləşmədən sonrakı 3 axşam; hər axşam üçün dünya
//   2°-lik şəbəkədə Odeh (2004) meyarı ilə rənglənir — utils/crescentVis.js (saf, testli).
// • Xəritəyə toxun → həmin nöqtənin rəqəmləri (gün batımı, ay batımı, fərq, yaş, ARCL, W).
// • Zonalar şərqdən qərbə "açılır" (gün batımı kimi); hərəkət azaldılıbsa — dərhal.
// • Proqnozdur: ru’yəti əvəz etmir, elanı yerli qurum verir — bu qeyd həmişə görünür.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { crescentEvenings, crescentGrid, crescentAt } from '../utils/crescentVis'
import { getPrayerLocation } from '../utils/prayerLocation'
import { G_MONTHS, G_MONTHS_SHORT, WEEKDAYS_SHORT } from '../utils/hijri'
import '../styles/CrescentVisibilityMap.css'

const T = {
  az: { ey: 'Hilal', title: 'Hilalın görünmə xəritəsi', lead: 'Təzə aydan sonrakı üç axşamda hilalın dünyanın harasında gözlə, harasında yalnız durbinlə görünə biləcəyi. Xəritəyə toxunun — həmin yerin rəqəmləri çıxsın.',
    // lang-ok[teleskopla,Odeh,Sh,Experimental,Astronomy]: alimin adı və jurnalın adı (mənbə), «teleskop» az sözüdür
    conj: 'Birləşmə (təzə ay)', eve: 'axşamı', zA: 'gözlə görünür', zB: 'durbinlə, bəlkə gözlə də', zC: 'yalnız durbin/teleskopla', zD: 'görünmür',
    city: 'Sizin şəhər', pt: 'Seçilmiş nöqtə', sunset: 'Gün batımı', moonset: 'Ay batımı', lag: 'fərq', min: 'dəq', age: 'Ayın yaşı', h: 'saat', arcl: 'Ay–Günəş bucağı', width: 'Hilalın eni',
    setFirst: 'Ay Günəşdən əvvəl batır', before: 'Gün batanda hələ birləşmə olmayıb', polar: 'Bu tarixdə burada gün batmır',
    // lang-ok[teleskopla,Odeh,Sh,Experimental,Astronomy]: alimin adı və jurnalın adı (mənbə), «teleskop» az sözüdür
    solar: 'təxmini yerli vaxt', calc: 'Hesablanır…', note: 'Astronomik proqnozdur (Odeh meyarı, 2004). Hilalın görülməsini (ru’yət) əvəz etmir — ayın başlanğıcını yerli dini qurum elan edir.', src: 'Mənbə: M. Ş. Odeh, Experimental Astronomy 18 (2004)', map: 'Hilalın görünmə zonaları xəritəsi' },
  en: { ey: 'Crescent', title: 'Crescent visibility map', lead: 'On the three evenings after the new moon: where in the world the crescent may be seen with the naked eye, and where only with binoculars. Tap the map to see the numbers for that spot.',
    conj: 'Conjunction (new moon)', eve: 'evening', zA: 'visible to the naked eye', zB: 'with optics, perhaps by eye', zC: 'only with binoculars/telescope', zD: 'not visible',
    city: 'Your city', pt: 'Selected point', sunset: 'Sunset', moonset: 'Moonset', lag: 'lag', min: 'min', age: 'Moon’s age', h: 'h', arcl: 'Moon–Sun angle', width: 'Crescent width',
    setFirst: 'The moon sets before the sun', before: 'At sunset the conjunction has not happened yet', polar: 'The sun does not set here on this date',
    solar: 'approx. local time', calc: 'Calculating…', note: 'An astronomical forecast (Odeh criterion, 2004). It does not replace sighting the crescent (ru’yah) — the local religious authority announces the start of the month.', src: 'Source: M. Sh. Odeh, Experimental Astronomy 18 (2004)', map: 'Map of crescent visibility zones' },
  ru: { ey: 'Полумесяц', title: 'Карта видимости молодого месяца', lead: 'Три вечера после новолуния: где в мире молодой месяц можно увидеть невооружённым глазом, а где только в бинокль. Коснитесь карты — появятся данные для этого места.',
    conj: 'Соединение (новолуние)', eve: 'вечер', zA: 'виден невооружённым глазом', zB: 'в оптику, возможно и глазом', zC: 'только в бинокль/телескоп', zD: 'не виден',
    city: 'Ваш город', pt: 'Выбранная точка', sunset: 'Закат', moonset: 'Заход Луны', lag: 'разница', min: 'мин', age: 'Возраст Луны', h: 'ч', arcl: 'Угол Луна–Солнце', width: 'Ширина серпа',
    setFirst: 'Луна заходит раньше Солнца', before: 'На закате соединения ещё не было', polar: 'В эту дату здесь солнце не заходит',
    // lang-ok[teleskopla,Odeh,Sh,Experimental,Astronomy]: alimin adı və jurnalın adı (mənbə), «teleskop» az sözüdür
    solar: 'примерное местное время', calc: 'Расчёт…', note: 'Астрономический прогноз (критерий Одеха, 2004). Не заменяет наблюдение месяца (ру’ят) — начало месяца объявляет местное духовное управление.', src: 'Источник: M. Sh. Odeh, Experimental Astronomy 18 (2004)', map: 'Карта зон видимости месяца' },
  ar: { ey: 'الهلال', title: 'خريطة رؤية الهلال', lead: 'في الأمسيات الثلاث بعد الاقتران: أين يمكن رؤية الهلال بالعين المجردة، وأين بالمنظار فقط. المس الخريطة لتظهر أرقام ذلك الموضع.',
    conj: 'الاقتران (المحاق)', eve: 'مساء', zA: 'يُرى بالعين المجردة', zB: 'بالمنظار، وربما بالعين', zC: 'بالمنظار/التلسكوب فقط', zD: 'لا يُرى',
    city: 'مدينتك', pt: 'النقطة المختارة', sunset: 'الغروب', moonset: 'غروب القمر', lag: 'المكث', min: 'د', age: 'عمر القمر', h: 'س', arcl: 'زاوية القمر والشمس', width: 'عرض الهلال',
    setFirst: 'يغرب القمر قبل الشمس', before: 'لم يحدث الاقتران عند الغروب', polar: 'لا تغرب الشمس هنا في هذا التاريخ',
    // lang-ok[teleskopla,Odeh,Sh,Experimental,Astronomy]: alimin adı və jurnalın adı (mənbə), «teleskop» az sözüdür
    solar: 'توقيت محلي تقريبي', calc: 'جارٍ الحساب…', note: 'توقّع فلكي (معيار عودة، 2004). لا يغني عن رؤية الهلال — والجهة الدينية المحلية هي التي تعلن بداية الشهر.', src: 'المصدر: محمد شوكت عودة، Experimental Astronomy 18 (2004)', map: 'خريطة مناطق رؤية الهلال' },
  tr: { ey: 'Hilal', title: 'Hilal görünürlük haritası', lead: 'Yeni aydan sonraki üç akşam: hilalin dünyanın neresinde çıplak gözle, neresinde yalnızca dürbünle görülebileceği. Haritaya dokunun — o yerin değerleri çıksın.',
    conj: 'İçtimâ (yeni ay)', eve: 'akşamı', zA: 'çıplak gözle görünür', zB: 'dürbünle, belki gözle de', zC: 'yalnızca dürbün/teleskopla', zD: 'görünmez',
    city: 'Şehriniz', pt: 'Seçilen nokta', sunset: 'Gün batımı', moonset: 'Ay batımı', lag: 'fark', min: 'dk', age: 'Ay’ın yaşı', h: 'sa', arcl: 'Ay–Güneş açısı', width: 'Hilalin eni',
    setFirst: 'Ay Güneş’ten önce batıyor', before: 'Gün batarken içtimâ henüz olmadı', polar: 'Bu tarihte burada güneş batmıyor',
    // lang-ok[teleskopla,Odeh,Sh,Experimental,Astronomy]: alimin adı və jurnalın adı (mənbə), «teleskop» az sözüdür
    solar: 'yaklaşık yerel saat', calc: 'Hesaplanıyor…', note: 'Astronomik tahmindir (Odeh kriteri, 2004). Hilalin görülmesinin (rü’yet) yerini tutmaz — ayın başlangıcını yerel dinî kurum ilan eder.', src: 'Kaynak: M. Ş. Odeh, Experimental Astronomy 18 (2004)', map: 'Hilal görünürlük bölgeleri haritası' },
}
const COLORS = ['#35c27a', '#9bd35a', '#f0a93a', null]   // A, B, C, D
const W = 1080, LAT_MAX = 64, LAT_MIN = -60
const H = Math.round(W * (LAT_MAX - LAT_MIN) / 360)

let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)).catch(e => { landCache = null; throw e }))
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'))

export default function CrescentVisibilityMap({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const ev = useMemo(() => crescentEvenings(Date.now()), [])
  const loc = useMemo(() => (typeof window === 'undefined' ? null : getPrayerLocation()), [])
  const [day, setDay] = useState(1)
  const [grid, setGrid] = useState(null)
  const [land, setLand] = useState(null)
  const [pt, setPt] = useState(null)        // { lat, lng }
  const cvRef = useRef(null)
  const cache = useRef({})

  const proj = useMemo(() => geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, (LAT_MAX * Math.PI / 180) * (W / (2 * Math.PI))]), [])
  useEffect(() => { loadLand().then(setLand).catch(() => {}) }, [])

  // Şəbəkə — səhifəni dondurmasın deyə növbəti kadrda hesablanır, axşam başına bir dəfə
  useEffect(() => {
    if (!ev) return undefined
    setGrid(cache.current[day] || null)
    if (cache.current[day]) return undefined
    const id = setTimeout(() => { cache.current[day] = crescentGrid(ev.conj, ev.days[day], 2, LAT_MIN, LAT_MAX); setGrid(cache.current[day]) }, 30)
    return () => clearTimeout(id)
  }, [ev, day])

  // Çəkiliş: dəniz → quru → zonalar (şərqdən qərbə açılır) → sahil xətti → şəhər
  useEffect(() => {
    const cv = cvRef.current
    if (!cv || !grid) return undefined
    const ctx = cv.getContext('2d')
    const path = geoPath(proj, ctx)
    const ch = H / (grid.rows - 1)
    const zoneImg = document.createElement('canvas')
    zoneImg.width = grid.cols; zoneImg.height = grid.rows
    const zc = zoneImg.getContext('2d'), img = zc.createImageData(grid.cols, grid.rows)
    for (let i = 0; i < grid.codes.length; i++) {
      const hex = COLORS[grid.codes[i]]
      if (!hex) continue
      img.data[i * 4] = parseInt(hex.slice(1, 3), 16); img.data[i * 4 + 1] = parseInt(hex.slice(3, 5), 16)
      img.data[i * 4 + 2] = parseInt(hex.slice(5, 7), 16); img.data[i * 4 + 3] = 255
    }
    zc.putImageData(img, 0, 0)
    let raf = 0
    const start = performance.now(), dur = reduced() ? 0 : 1100
    const draw = (now) => {
      const k = dur ? Math.min(1, (now - start) / dur) : 1
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1530'; ctx.fillRect(0, 0, W, H)
      if (land) { ctx.beginPath(); path(land); ctx.fillStyle = '#1b2a4a'; ctx.fill() }
      // Zonalar: kiçik şəkil (1 xana = 1 piksel) hamar böyüdülür; şərqdən qərbə açılır
      ctx.save()
      ctx.beginPath(); ctx.rect(W * (1 - k), 0, W * k, H); ctx.clip()
      ctx.globalAlpha = 0.68
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(zoneImg, 0, 0, grid.cols, grid.rows, 0, -ch / 2, W, H + ch)
      ctx.restore()
      ctx.globalAlpha = 1
      if (land) { ctx.beginPath(); path(land); ctx.strokeStyle = 'rgba(220,232,255,.45)'; ctx.lineWidth = 0.8; ctx.stroke() }
      const mark = (p, colr, r0) => {
        const [x, y] = proj([p.lng, p.lat])
        ctx.beginPath(); ctx.arc(x, y, r0, 0, Math.PI * 2); ctx.fillStyle = colr; ctx.fill()
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#0b1530'; ctx.stroke()
      }
      if (loc) mark(loc, '#ffffff', 6)
      if (pt) mark(pt, '#e2b857', 6)
      if (k < 1) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [grid, land, proj, loc, pt])

  const at = (p) => (grid && p ? crescentAt(grid.eph, ev.conj, ev.days[day], p.lat, p.lng) : null)
  const cityRes = useMemo(() => at(loc), [grid, loc]) // eslint-disable-line react-hooks/exhaustive-deps
  const ptRes = useMemo(() => at(pt), [grid, pt]) // eslint-disable-line react-hooks/exhaustive-deps

  const onTap = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H
    const ll = proj.invert([x, y])
    if (ll && Math.abs(ll[1]) <= 66) setPt({ lng: ll[0], lat: ll[1] })
  }

  if (!ev) return null
  const tz = loc?.tz
  // ICU-da bəzi dillərin ay adları yoxdur ("M11") — adlar utils/hijri-dən, saat Intl ilə (24 saat)
  const partsIn = (ms, zone) => {
    try {
      const f = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      const o = {}; for (const x of f.formatToParts(new Date(ms))) o[x.type] = x.value
      return { d: Number(o.day), m: Number(o.month) - 1, hm: `${o.hour}:${o.minute}` }
    } catch { const d = new Date(ms); return { d: d.getDate(), m: d.getMonth(), hm: d.toTimeString().slice(0, 5) } }
  }
  const fmtTime = (ms, off) => (off == null ? partsIn(ms, tz).hm : partsIn(ms + off * 3600000, 'UTC').hm)
  const fmtDay = (ms) => { const d = new Date(ms + 12 * 3600000); return `${pickUi(WEEKDAYS_SHORT, lang)[d.getUTCDay()]}, ${d.getUTCDate()} ${pickUi(G_MONTHS_SHORT, lang)[d.getUTCMonth()]}` }
  const fmtFull = (ms) => { const p = partsIn(ms, tz); return `${p.d} ${pickUi(G_MONTHS, lang)[p.m]}, ${p.hm}` }
  const zoneText = (z) => t[`z${z}`]
  const ZONE_I = { A: 0, B: 1, C: 2, D: 3 }
  const ptOff = pt ? Math.round(pt.lng / 15) : 0

  const Res = ({ label, res, testid, off }) => res && (
    <div className="cvm__res" data-testid={testid}>
      <span className="cvm__res-l">{label}</span>
      <b className={`cvm__zone is-${res.zone}`}><i style={{ background: COLORS[ZONE_I[res.zone]] || 'transparent' }} /> {zoneText(res.zone)}</b>
      {res.why === 'polar' ? <span className="cvm__why">{t.polar}</span> : (
        <ul className="cvm__nums ui-num">
          {res.sunset != null && <li><span>{t.sunset}</span> <b>{fmtTime(res.sunset, off)}</b></li>}
          {res.moonset != null && <li><span>{t.moonset}</span> <b>{fmtTime(res.moonset, off)}</b> <small>({t.lag} {Math.round(res.lag)} {t.min})</small></li>}
          {res.age != null && <li><span>{t.age}</span> <b>{res.age < 0 ? '—' : `${Math.round(res.age)} ${t.h}`}</b></li>}
          {res.arcl != null && <li><span>{t.arcl}</span> <b>{res.arcl.toFixed(1)}°</b></li>}
          {res.w != null && <li><span>{t.width}</span> <b>{res.w.toFixed(2)}′</b></li>}
        </ul>
      )}
      {res.why === 'set' && <span className="cvm__why">{t.setFirst}</span>}
      {res.why === 'before' && <span className="cvm__why">{t.before}</span>}
    </div>
  )

  return (
    <section className="cvm ui-card" aria-labelledby="cvm-title" data-testid="crescent-map">
      <div className="cvm__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h3 id="cvm-title" className="ui-title ui-title--sm">{t.title}</h3>
        <p className="ui-lead">{t.lead}</p>
      </div>
      <p className="cvm__conj"><Icon name="moonStar" size={16} /> {t.conj}: <b className="ui-num" data-testid="cvm-conj">{fmtFull(ev.conj)}</b></p>
      <div className="cvm__days" role="group" aria-label={t.title}>
        {ev.days.map((d, i) => (
          <button key={d} type="button" className="ui-chip" aria-pressed={day === i} onClick={() => setDay(i)} data-testid={`cvm-day-${i}`}>
            {fmtDay(d)} {t.eve}
          </button>
        ))}
      </div>
      <div className="cvm__map">
        <canvas ref={cvRef} width={W} height={H} className="cvm__cv" role="img" aria-label={t.map} onClick={onTap} data-testid="cvm-canvas"
          data-ready={grid ? 'true' : 'false'} />
        {!grid && <span className="cvm__calc" role="status"><span className="ui-spin" aria-hidden="true" /> {t.calc}</span>}
      </div>
      <ul className="cvm__legend">
        {['A', 'B', 'C', 'D'].map((z, i) => <li key={z}><i style={{ background: COLORS[i] || 'transparent' }} className={COLORS[i] ? '' : 'is-none'} /> {zoneText(z)}</li>)}
      </ul>
      <div className="cvm__out" aria-live="polite">
        <Res label={`${t.city}${loc?.city ? ` — ${pickUi(loc.city, lang)}` : ''}`} res={cityRes} testid="cvm-city" />
        <Res label={`${t.pt} · ${pt ? `${pt.lat.toFixed(1)}°, ${pt.lng.toFixed(1)}° · ${t.solar} UTC${ptOff >= 0 ? '+' : '−'}${Math.abs(ptOff)}` : ''}`} res={ptRes} testid="cvm-pt" off={ptOff} />
      </div>
      <p className="cvm__note"><Icon name="info" size={14} /> {t.note} <span className="cvm__src">{t.src}</span></p>
    </section>
  )
}
