// ═══════════════════════════════════════════════════════
// FastingWorldMap (v6.3) — "Dünyada oruc müddəti" (/ramadan)
//
//   <FastingWorldMap lang="az" />
//
// • Ramazanın istənilən günü (sürüşdürücü) üçün dünya xəritəsi oruc müddətinə görə rənglənir
//   (sübh 18° → məğrib) — utils/fastingMap.js (saf, testli). Ən uzun / ən qısa oruc şəhərləri,
//   sizin şəhər ayrıca. Yüksək enlikdə "sübh əlaməti yoxdur" ayrıca rəngdədir (hesablanmır).
// • Xəritəyə toxun → həmin yerin müddəti.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { fastingGrid, fastLength, ramadanDays } from '../utils/fastingMap'
import { worldPoints } from '../data/worldCities'
import { getPrayerLocation } from '../utils/prayerLocation'
import { G_MONTHS } from '../utils/hijri'
import '../styles/FastingWorldMap.css'

const T = {
  az: { ey: 'Ramazan', title: 'Dünyada oruc müddəti', lead: 'Ramazanın hər günü dünyanın hər yerində oruc nə qədər çəkir — sübhdən məğribə. Günü dəyişin, xəritəyə toxunun.', day: 'Ramazanın günü', longest: 'Ən uzun', shortest: 'Ən qısa', yours: 'Sizin şəhər', pt: 'Seçilmiş nöqtə', h: 'saat', m: 'dəq',
    noFajr: 'Sübh əlaməti yoxdur (ağ gecə)', polarDay: 'Günəş batmır', polarNight: 'Günəş doğmur', note: 'Sübh — Günəş üfüqdən 18° aşağıda (Dünya İslam Liqası), məğrib — gün batımı. Yerli təqvimlər başqa bucaq işlədə bilər; dəqiq vaxt üçün öz şəhərinizin cədvəlinə baxın. Sübh əlaməti olmayan yerlərdə yerli alimlərin fətvasına əməl olunur.', map: 'Oruc müddəti xəritəsi' },
  en: { ey: 'Ramadan', title: 'Fasting hours around the world', lead: 'How long the fast lasts, from dawn to sunset, everywhere in the world on each day of Ramadan. Change the day, tap the map.', day: 'Day of Ramadan', longest: 'Longest', shortest: 'Shortest', yours: 'Your city', pt: 'Selected point', h: 'h', m: 'min',
    noFajr: 'No sign of dawn (white night)', polarDay: 'The sun does not set', polarNight: 'The sun does not rise', note: 'Dawn: the sun 18° below the horizon (Muslim World League); sunset: maghrib. Local timetables may use another angle — check your own city’s timetable for exact times. Where there is no sign of dawn, people follow the rulings of local scholars.', map: 'Map of fasting hours' },
  ru: { ey: 'Рамадан', title: 'Продолжительность поста в мире', lead: 'Сколько длится пост — от рассвета до заката — в любой точке мира в каждый день Рамадана. Меняйте день, касайтесь карты.', day: 'День Рамадана', longest: 'Самый долгий', shortest: 'Самый короткий', yours: 'Ваш город', pt: 'Выбранная точка', h: 'ч', m: 'мин',
    noFajr: 'Нет признака рассвета (белая ночь)', polarDay: 'Солнце не заходит', polarNight: 'Солнце не восходит', note: 'Рассвет — Солнце на 18° под горизонтом (Всемирная исламская лига), закат — магриб. Местные расписания могут использовать другой угол — точное время смотрите в расписании своего города. Где нет признака рассвета, следуют фетвам местных учёных.', map: 'Карта продолжительности поста' },
  ar: { ey: 'رمضان', title: 'مدة الصيام حول العالم', lead: 'كم يطول الصيام من الفجر إلى المغرب في كل مكان من العالم في كل يوم من رمضان. غيّر اليوم والمس الخريطة.', day: 'اليوم من رمضان', longest: 'الأطول', shortest: 'الأقصر', yours: 'مدينتك', pt: 'النقطة المختارة', h: 'س', m: 'د',
    noFajr: 'لا تظهر علامة الفجر (ليل أبيض)', polarDay: 'الشمس لا تغرب', polarNight: 'الشمس لا تشرق', note: 'الفجر: الشمس تحت الأفق بـ18° (رابطة العالم الإسلامي)، والمغرب: غروب الشمس. قد تعتمد التقاويم المحلية زاوية أخرى — راجع جدول مدينتك للأوقات الدقيقة. وحيث لا تظهر علامة الفجر يُعمل بفتوى علماء البلد.', map: 'خريطة مدة الصيام' },
  tr: { ey: 'Ramazan', title: 'Dünyada oruç süresi', lead: 'Ramazan’ın her günü dünyanın her yerinde oruç ne kadar sürer — imsaktan iftara. Günü değiştirin, haritaya dokunun.', day: 'Ramazan’ın günü', longest: 'En uzun', shortest: 'En kısa', yours: 'Şehriniz', pt: 'Seçilen nokta', h: 'sa', m: 'dk',
    noFajr: 'Tan belirtisi yok (beyaz gece)', polarDay: 'Güneş batmıyor', polarNight: 'Güneş doğmuyor', note: 'İmsak — Güneş ufkun 18° altında (Dünya İslam Birliği), iftar — gün batımı. Yerel takvimler başka açı kullanabilir; kesin vakit için kendi şehrinizin takvimine bakın. Tan belirtisi olmayan yerlerde yerel âlimlerin fetvasına uyulur.', map: 'Oruç süresi haritası' },
}
const W = 1080, LAT_MAX = 66, LAT_MIN = -60
const H = Math.round(W * (LAT_MAX - LAT_MIN) / 360)
// Rəng şkalası: qısa — mavi, orta — yaşıl/sarı, uzun — qırmızı
const STOPS = [[0, [64, 120, 220]], [0.3, [54, 190, 160]], [0.55, [150, 210, 80]], [0.75, [245, 190, 60]], [1, [225, 70, 60]]]
function colorOf(h, H_MIN, H_MAX) {
  const x = Math.max(0, Math.min(1, (h - H_MIN) / Math.max(1, H_MAX - H_MIN)))
  for (let i = 1; i < STOPS.length; i++) {
    if (x <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], k = (x - a) / (b - a)
      return ca.map((v, j) => Math.round(v + (cb[j] - v) * k))
    }
  }
  return STOPS[STOPS.length - 1][1]
}
const KIND_RGB = [null, [150, 110, 210], [235, 235, 240], [40, 50, 80]]

let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)).catch(e => { landCache = null; throw e }))

export default function FastingWorldMap({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const months = pickUi(G_MONTHS, lang)
  const ram = useMemo(() => ramadanDays(new Date()), [])
  const loc = useMemo(() => (typeof window === 'undefined' ? null : getPrayerLocation()), [])
  const todayIdx = useMemo(() => { const i = ram.days.findIndex(d => Date.now() - d.dayStart < 86400000 && Date.now() >= d.dayStart); return i >= 0 ? i : 0 }, [ram])
  const [idx, setIdx] = useState(todayIdx)
  const [land, setLand] = useState(null)
  const [pt, setPt] = useState(null)
  const cvRef = useRef(null)
  const day = ram.days[idx]
  const grid = useMemo(() => fastingGrid(day.dayStart, 2, LAT_MIN, LAT_MAX), [day.dayStart])
  // Rəng şkalası həmin günün aralığına görə (qışda 10–16, yayda 9–22 saat və s.)
  const [H_MIN, H_MAX] = useMemo(() => {
    let a = 24, b = 0
    for (let i = 0; i < grid.hours.length; i++) if (!grid.kinds[i]) { a = Math.min(a, grid.hours[i]); b = Math.max(b, grid.hours[i]) }
    return [Math.floor(a), Math.ceil(b)]
  }, [grid])
  const proj = useMemo(() => geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, (LAT_MAX * Math.PI / 180) * (W / (2 * Math.PI))]), [])
  useEffect(() => { loadLand().then(setLand).catch(() => {}) }, [])

  const cities = useMemo(() => worldPoints().map(c => ({ ...c, f: fastLength(day.dayStart, c.lat, c.lng) })).filter(c => c.f.hours != null), [day.dayStart])
  const sorted = useMemo(() => [...cities].sort((a, b) => b.f.hours - a.f.hours), [cities])

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const img = document.createElement('canvas'); img.width = grid.cols; img.height = grid.rows
    const ic = img.getContext('2d'), data = ic.createImageData(grid.cols, grid.rows)
    for (let i = 0; i < grid.hours.length; i++) {
      const rgb = grid.kinds[i] ? KIND_RGB[grid.kinds[i]] : colorOf(grid.hours[i], H_MIN, H_MAX)
      data.data[i * 4] = rgb[0]; data.data[i * 4 + 1] = rgb[1]; data.data[i * 4 + 2] = rgb[2]; data.data[i * 4 + 3] = 255
    }
    ic.putImageData(data, 0, 0)
    const ch = H / (grid.rows - 1)
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0b1530'; ctx.fillRect(0, 0, W, H)
    ctx.imageSmoothingEnabled = true
    ctx.globalAlpha = 0.85
    ctx.drawImage(img, 0, 0, grid.cols, grid.rows, 0, -ch / 2, W, H + ch)
    ctx.globalAlpha = 1
    if (land) {
      const path = geoPath(proj, ctx)
      ctx.beginPath(); path(land); ctx.strokeStyle = 'rgba(11,21,48,.75)'; ctx.lineWidth = 1.1; ctx.stroke()
    }
    const mark = (p, fill) => { const [x, y] = proj([p.lng, p.lat]); ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#0b1530'; ctx.stroke() }
    if (loc) mark(loc, '#fff')
    if (pt) mark(pt, '#e2b857')
  }, [grid, land, proj, loc, pt, H_MIN, H_MAX])

  const onTap = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const ll = proj.invert([((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H])
    if (ll && ll[1] <= LAT_MAX + 1 && ll[1] >= LAT_MIN - 1) setPt({ lng: ll[0], lat: ll[1] })
  }
  const hm = (h) => `${Math.floor(h)} ${t.h} ${String(Math.round((h % 1) * 60)).padStart(2, '0')} ${t.m}`
  const fText = (f) => (f.hours != null ? hm(f.hours) : t[f.kind])
  const g = new Date(day.dayStart + 43200000)
  const dateText = `${g.getUTCDate()} ${months[g.getUTCMonth()]} ${g.getUTCFullYear()}`
  const yours = loc ? fastLength(day.dayStart, loc.lat, loc.lng) : null
  const ptF = pt ? fastLength(day.dayStart, pt.lat, pt.lng) : null

  return (
    <section className="ui-container fwm-wrap">
      <div className="fwm ui-card" data-testid="fasting-map">
        <div className="fwm__head">
          <span className="ui-eyebrow">{t.ey} {ram.year}</span>
          <h2 className="ui-title ui-title--sm">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
        <label className="fwm__day">
          <span>{t.day}: <b className="ui-num" data-testid="fwm-day">{day.day}</b> · <span className="ui-num">{dateText}</span></span>
          <input type="range" min="0" max={ram.days.length - 1} value={idx} onChange={e => setIdx(Number(e.target.value))} data-testid="fwm-range" />
        </label>
        <div className="fwm__map">
          <canvas ref={cvRef} width={W} height={H} className="fwm__cv" role="img" aria-label={t.map} onClick={onTap} data-testid="fwm-canvas" />
        </div>
        <div className="fwm__legend" aria-hidden="true">
          <span className="ui-num">{H_MIN} {t.h}</span><i className="fwm__grad" /><span className="ui-num">{H_MAX} {t.h}</span>
          <span className="fwm__k"><i style={{ background: 'rgb(150,110,210)' }} /> {t.noFajr}</span>
          <span className="fwm__k"><i style={{ background: 'rgb(235,235,240)' }} /> {t.polarDay}</span>
          <span className="fwm__k"><i style={{ background: 'rgb(40,50,80)' }} /> {t.polarNight}</span>
        </div>
        <div className="fwm__out">
          {yours && <div className="fwm__card is-you" data-testid="fwm-you"><span>{t.yours}{loc?.city ? ` — ${pickUi(loc.city, lang)}` : ''}</span><b className="ui-num">{fText(yours)}</b></div>}
          {ptF && <div className="fwm__card" data-testid="fwm-pt"><span>{t.pt} · <span className="ui-num">{pt.lat.toFixed(1)}°, {pt.lng.toFixed(1)}°</span></span><b className="ui-num">{fText(ptF)}</b></div>}
        </div>
        <div className="fwm__ranks">
          {[[t.longest, sorted.slice(0, 5), 'fwm-long'], [t.shortest, sorted.slice(-5).reverse(), 'fwm-short']].map(([label, list, tid]) => (
            <div key={tid} className="fwm__rank" data-testid={tid}>
              <h3>{label}</h3>
              <ol>
                {list.map(c => (
                  <li key={c.name}><span lang="en" dir="ltr">{c.name}</span><b className="ui-num">{hm(c.f.hours)}</b>
                    <i style={{ width: `${(c.f.hours / H_MAX) * 100}%`, background: `rgb(${colorOf(c.f.hours, H_MIN, H_MAX).join(',')})` }} /></li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <p className="fwm__note"><Icon name="info" size={14} /> {t.note}</p>
      </div>
    </section>
  )
}
