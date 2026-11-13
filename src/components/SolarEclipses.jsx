// ═══════════════════════════════════════════════════════
// SolarEclipses (v6.6) — "Günəş tutulmaları": Ayın kölgəsi Yer üzərində (/calendar)
//
//   <SolarEclipses lang="az" lessonHref="/learn/kusuf-prayer" />
//
// • 2026–2040 arası 34 tutulma — NASA Bessel elementləri (data/solarEclipses.js).
// • Xəritə (canvas, d3-geo Equal Earth): seçilmiş anda yarımkölgə (Günəşin örtülmə faizi ilə
//   tündləşir), gecə tərəfi, tamlıq/həlqə zolağının mərkəzi xətti və kölgənin mərkəzi; "Oynat" —
//   kölgə ~10 saniyədə Yer üzərindən keçir (hərəkət azaldılıbsa — yalnız sürüşdürücü).
// • Sizin şəhər: neçə faiz örtülür, təmas anları, tamlığın müddəti (utils/solarEclipse.js) —
//   Günəş üfüqdən aşağıdırsa, görünən hissə ayrıca hesablanır. Məkkədən görünüşü də göstərilir.
// • Tutulma namazı haqqında — saytın küsuf dərsinə keçid (hökm burada yazılmır).
// Stillər: src/styles/SolarEclipses.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { geoEqualEarth, geoPath, geoGraticule10 } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { getPrayerLocation } from '../utils/prayerLocation'
import { G_MONTHS } from '../utils/hijri'
import { SOLAR_ECLIPSES } from '../data/solarEclipses'
import { localCircumstances, phaseAt, centralPoint, centralLine, penumbraSpan, msOf } from '../utils/solarEclipse'
import '../styles/SolarEclipses.css'

const T = {
  az: { ey: 'Günəş tutulmaları', title: 'Ayın kölgəsi Yer üzərində', lead: c => `Ay Günəşin qarşısından keçəndə kölgəsi Yer üzərində zolaq kimi sürüşür. Xəritədə kölgənin yolunu, aşağıda isə 2040-a qədər bütün tutulmaları və şəhərinizdən${c ? ` (${c})` : ''} Günəşin neçə faizinin örtüləcəyini görün.`,
    kinds: { T: 'Tam tutulma', A: 'Həlqəvi tutulma', H: 'Hibrid tutulma', P: 'Qismən tutulma' },
    yours: 'Sizin şəhərdə', covered: p => `Günəşin ${p}%-i örtüləcək`, totalHere: d => `Tam tutulma — ${d} qaranlıq`, ringHere: d => `Həlqə — ${d}`, none: 'Sizin şəhərdən görünməyəcək',
    rise: 'Günəş tutulu halda doğacaq', set: 'Günəş tutulu halda batacaq', start: 'Başlanğıc', max: 'Ən böyük faza', end: 'Son', totStart: 'Tamlıq', ringStart: 'Həlqə',
    days: n => `${n} gün qalıb`, today: 'Bu gün', makkah: 'Məkkədə', makkahT: d => `Kəbənin üstündə tam tutulma — ${d}`, makkahP: p => `Günəşin ${p}%-i örtüləcək`, makkahN: 'görünməyəcək',
    map: 'Xəritə: Ayın kölgəsi seçilmiş anda (tünd — Günəşin daha çox örtüldüyü yerlər), qırıq xətt — tamlıq/həlqə zolağı', time: 'Vaxt (sizin saatla)', play: 'Oynat', pause: 'Dayandır',
    list: 'Bütün Günəş tutulmaları (2040-a qədər)', lesson: 'Küsuf namazı dərsi', sel: 'Seçilmiş tutulma', minS: (m, s) => `${m} dəq ${s} san`,
    // lang-ok[kamerası]: azərbaycanca söz (telefon kamerası)
    safety: 'Günəşə heç vaxt adi gözlə, günəş eynəyi və ya telefon kamerası ilə baxmayın — yalnız ISO 12312-2 sertifikatlı tutulma eynəyi ilə. Eynəyi yalnız tam tutulmanın özündə — Günəş tamamilə örtüləndə çıxarmaq olar.',
    // lang-ok[Espenak]: astronomun adı (Fred Espenak)
    note: 'Hesab: NASA (F. Espenak, J. Meeus) Bessel elementləri — saytda, sizin cihazda; vaxtların dəqiqliyi ~1 dəqiqə.' },
  en: { ey: 'Solar eclipses', title: 'The Moon’s shadow on the Earth', lead: c => `When the Moon passes in front of the Sun, its shadow sweeps across the Earth in a band. The map shows the shadow’s path; below are all eclipses until 2040 and how much of the Sun will be covered in your city${c ? ` (${c})` : ''}.`,
    kinds: { T: 'Total eclipse', A: 'Annular eclipse', H: 'Hybrid eclipse', P: 'Partial eclipse' },
    yours: 'In your city', covered: p => `${p}% of the Sun will be covered`, totalHere: d => `Total eclipse — ${d} of darkness`, ringHere: d => `Ring of fire — ${d}`, none: 'Not visible from your city',
    rise: 'The Sun rises already eclipsed', set: 'The Sun sets while eclipsed', start: 'Begins', max: 'Maximum', end: 'Ends', totStart: 'Totality', ringStart: 'Ring',
    days: n => `${n} days left`, today: 'Today', makkah: 'In Makkah', makkahT: d => `Total eclipse over the Kaaba — ${d}`, makkahP: p => `${p}% of the Sun covered`, makkahN: 'not visible',
    map: 'Map: the Moon’s shadow at the chosen moment (darker — more of the Sun covered); dashed line — the path of totality or the ring', time: 'Time (your clock)', play: 'Play', pause: 'Pause',
    list: 'All solar eclipses (until 2040)', lesson: 'Lesson: the eclipse prayer', sel: 'Selected eclipse', minS: (m, s) => `${m} min ${s} s`,
    safety: 'Never look at the Sun with the naked eye, sunglasses or a phone camera — only through ISO 12312-2 certified eclipse glasses. Remove them only while the Sun is completely covered during totality.',
    note: 'Calculation: NASA (F. Espenak, J. Meeus) Besselian elements, computed on your device; times accurate to about a minute.' },
  ru: { ey: 'Солнечные затмения', title: 'Тень Луны на Земле', lead: c => `Когда Луна проходит перед Солнцем, её тень скользит по Земле полосой. На карте — путь тени, ниже — все затмения до 2040 года и сколько процентов Солнца закроется в вашем городе${c ? ` (${c})` : ''}.`,
    kinds: { T: 'Полное затмение', A: 'Кольцеобразное затмение', H: 'Гибридное затмение', P: 'Частное затмение' },
    yours: 'В вашем городе', covered: p => `Будет закрыто ${p}% Солнца`, totalHere: d => `Полное затмение — ${d} темноты`, ringHere: d => `Огненное кольцо — ${d}`, none: 'Из вашего города не видно',
    rise: 'Солнце взойдёт уже затмённым', set: 'Солнце зайдёт затмённым', start: 'Начало', max: 'Максимум', end: 'Конец', totStart: 'Полная фаза', ringStart: 'Кольцо',
    days: n => `Осталось дней: ${n}`, today: 'Сегодня', makkah: 'В Мекке', makkahT: d => `Полное затмение над Каабой — ${d}`, makkahP: p => `закрыто ${p}% Солнца`, makkahN: 'не видно',
    map: 'Карта: тень Луны в выбранный момент (темнее — сильнее закрыто Солнце), пунктир — полоса полной или кольцеобразной фазы', time: 'Время (по вашим часам)', play: 'Показать', pause: 'Пауза',
    list: 'Все солнечные затмения (до 2040 года)', lesson: 'Урок: молитва затмения', sel: 'Выбранное затмение', minS: (m, s) => `${m} мин ${s} с`,
    // lang-ok[ISO]: standartın adı (ISO 12312-2)
    safety: 'Никогда не смотрите на Солнце невооружённым глазом, через солнцезащитные очки или камеру телефона — только через сертифицированные очки ISO 12312-2. Снимать их можно лишь когда Солнце полностью закрыто.',
    // lang-ok[NASA]: təşkilatın adı
    note: 'Расчёт: элементы Бесселя NASA (Ф. Эспенак, Ж. Меус), вычисляются на вашем устройстве; точность времени около минуты.' },
  ar: { ey: 'كسوف الشمس', title: 'ظل القمر على الأرض', lead: c => `حين يمرّ القمر أمام الشمس ينزلق ظله على الأرض شريطًا. على الخريطة مسار الظل، وتحتها كل حالات الكسوف حتى 2040 وكم يُحجب من الشمس في مدينتك${c ? ` (${c})` : ''}.`,
    kinds: { T: 'كسوف كلي', A: 'كسوف حلقي', H: 'كسوف هجين', P: 'كسوف جزئي' },
    yours: 'في مدينتك', covered: p => `يُحجب ${p}% من قرص الشمس`, totalHere: d => `كسوف كلي — ظلام ${d}`, ringHere: d => `حلقة نار — ${d}`, none: 'لا يُرى من مدينتك',
    rise: 'تشرق الشمس مكسوفة', set: 'تغرب الشمس مكسوفة', start: 'البداية', max: 'الذروة', end: 'النهاية', totStart: 'الكلي', ringStart: 'الحلقة',
    days: n => `بقي ${n} يومًا`, today: 'اليوم', makkah: 'في مكة', makkahT: d => `كسوف كلي فوق الكعبة — ${d}`, makkahP: p => `يُحجب ${p}% من الشمس`, makkahN: 'لا يُرى',
    map: 'الخريطة: ظل القمر في اللحظة المختارة (الأغمق — حجب أكبر للشمس)، والخط المتقطع — مسار الكلي أو الحلقي', time: 'الوقت (بساعتك)', play: 'شغّل', pause: 'إيقاف',
    list: 'كل حالات كسوف الشمس (حتى 2040)', lesson: 'درس صلاة الكسوف', sel: 'الكسوف المختار', minS: (m, s) => `${m} د ${s} ث`,
    // lang-ok[ISO]: standartın adı (ISO 12312-2)
    safety: 'لا تنظر إلى الشمس بالعين المجردة ولا بالنظارة الشمسية ولا بكاميرا الهاتف — بل بنظارة كسوف معتمدة (ISO 12312-2) فقط، ولا تُنزع إلا حين تُحجب الشمس كليًا.',
    note: 'الحساب: عناصر بيسل من ناسا (ف. إسبيناك وج. ميوس)، على جهازك؛ دقة الأوقات نحو دقيقة.' },
  tr: { ey: 'Güneş tutulmaları', title: 'Ay’ın gölgesi Dünya üzerinde', lead: c => `Ay Güneş’in önünden geçerken gölgesi Dünya üzerinde bir şerit gibi kayar. Haritada gölgenin yolunu, aşağıda 2040’a kadar bütün tutulmaları ve şehrinizde${c ? ` (${c})` : ''} Güneş’in yüzde kaçının örtüleceğini görün.`,
    kinds: { T: 'Tam tutulma', A: 'Halkalı tutulma', H: 'Hibrit tutulma', P: 'Parçalı tutulma' },
    yours: 'Şehrinizde', covered: p => `Güneş’in %${p}’i örtülecek`, totalHere: d => `Tam tutulma — ${d} karanlık`, ringHere: d => `Ateş halkası — ${d}`, none: 'Şehrinizden görünmeyecek',
    rise: 'Güneş tutulmuş olarak doğacak', set: 'Güneş tutulmuş olarak batacak', start: 'Başlangıç', max: 'En büyük evre', end: 'Bitiş', totStart: 'Tamlık', ringStart: 'Halka',
    days: n => `${n} gün kaldı`, today: 'Bugün', makkah: 'Mekke’de', makkahT: d => `Kâbe’nin üstünde tam tutulma — ${d}`, makkahP: p => `Güneş’in %${p}’i örtülecek`, makkahN: 'görünmeyecek',
    map: 'Harita: seçilen anda Ay’ın gölgesi (koyu — Güneş’in daha çok örtüldüğü yerler), kesikli çizgi — tamlık veya halka şeridi', time: 'Saat (sizin saatinizle)', play: 'Oynat', pause: 'Durdur',
    list: 'Bütün Güneş tutulmaları (2040’a kadar)', lesson: 'Küsuf namazı dersi', sel: 'Seçilen tutulma', minS: (m, s) => `${m} dk ${s} sn`,
    safety: 'Güneş’e asla çıplak gözle, güneş gözlüğüyle veya telefon kamerasıyla bakmayın — yalnızca ISO 12312-2 sertifikalı tutulma gözlüğüyle. Gözlük ancak Güneş tamamen örtülünce çıkarılabilir.',
    note: 'Hesap: NASA (F. Espenak, J. Meeus) Bessel elemanları, cihazınızda; saatlerin doğruluğu yaklaşık 1 dakika.' },
}

const MAKKAH = { lat: 21.4225, lng: 39.8262 }
const W = 720, H = 370, STEP = 3
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'))
let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)))
const maxMs = (s) => Date.parse(`${s.d}T${s.td}Z`) - s.e[5] * 1000

function partsIn(ms, tz) {
  try {
    const o = {}
    for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ms))) o[x.type] = x.value
    return { y: +o.year, m: +o.month - 1, d: +o.day, hm: `${o.hour}:${o.minute}` }
  } catch { const d = new Date(ms); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), hm: d.toISOString().slice(11, 16) } }
}

// Xəritə şəbəkəsi (3°): proyeksiya edilmiş nöqtələr bir dəfə hesablanır
const projection = geoEqualEarth().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' })
const GRID = []
for (let lat = -84; lat <= 84; lat += STEP) for (let lng = -180; lng < 180; lng += STEP) { const p = projection([lng, lat]); if (p) GRID.push({ lat, lng, x: p[0], y: p[1] }) }
const COARSE = GRID.filter(g => g.lat % 12 === 0 && g.lng % 12 === 0).map(g => [g.lng, g.lat])

export default function SolarEclipses({ lang = 'az', lessonHref }) {
  const t = pickUi(T, lang)
  const months = pickUi(G_MONTHS, lang)
  const loc = useMemo(() => (typeof window === 'undefined' ? null : getPrayerLocation()), [])
  const tz = loc?.tz || 'UTC'
  const list = useMemo(() => {
    const now = Date.now() - 86400000
    return SOLAR_ECLIPSES.filter(s => maxMs(s) > now).map(s => ({ s, lc: loc ? localCircumstances(s.e, loc.lat, loc.lng) : null }))
  }, [loc])
  const firstIdx = useMemo(() => Math.max(0, list.findIndex(x => x.lc?.visible && x.lc.seenObsc >= 0.05)), [list])
  const [idx, setIdx] = useState(firstIdx)
  const cur = list[idx] || list[0]
  const span = useMemo(() => (cur ? penumbraSpan(cur.s.e, COARSE) || [msOf(cur.s.e, cur.s.e[2]), msOf(cur.s.e, cur.s.e[3])] : null), [cur])
  const line = useMemo(() => (cur ? centralLine(cur.s.e, 2) : []), [cur])
  const mk = useMemo(() => (cur ? localCircumstances(cur.s.e, MAKKAH.lat, MAKKAH.lng) : null), [cur])
  const [at, setAt] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [land, setLand] = useState(null)
  const canvasRef = useRef(null)
  const raf = useRef(0)

  useEffect(() => { let ok = true; loadLand().then(l => { if (ok) setLand(l) }).catch(() => {}); return () => { ok = false } }, [])
  useEffect(() => { if (cur) setAt(maxMs(cur.s)) }, [cur])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // Xəritəni çək
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || !cur || at == null) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr }
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const path = geoPath(projection, ctx)
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = '#16365c'; ctx.fill()
    ctx.beginPath(); path(geoGraticule10()); ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 0.6; ctx.stroke()
    if (land) { ctx.beginPath(); path(land); ctx.fillStyle = '#5f7f63'; ctx.fill() }
    const cell = (W / 360) * STEP * 1.15
    for (const g of GRID) {
      const p = phaseAt(cur.s.e, at, g.lat, g.lng)
      if (p.alt < 0) { ctx.fillStyle = 'rgba(4,8,24,.42)'; ctx.fillRect(g.x - cell / 2, g.y - cell / 2, cell, cell) }
      else if (p.mag > 0) { ctx.fillStyle = `rgba(8,4,20,${(0.12 + 0.7 * p.obsc).toFixed(3)})`; ctx.fillRect(g.x - cell / 2, g.y - cell / 2, cell, cell) }
    }
    ctx.setLineDash([5, 4]); ctx.strokeStyle = cur.s.t === 'P' ? 'transparent' : '#ffcf5a'; ctx.lineWidth = 1.6
    for (const part of line) { ctx.beginPath(); path({ type: 'LineString', coordinates: part }); ctx.stroke() }
    ctx.setLineDash([])
    const cp = centralPoint(cur.s.e, at)
    if (cp) {
      const [x, y] = projection([cp.lng, cp.lat])
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,207,90,.25)'; ctx.fill()
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fillStyle = cur.s.t === 'A' ? '#ffb347' : '#000'; ctx.fill(); ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = 1.5; ctx.stroke()
    }
    const pin = (la, ln, color) => { const [x, y] = projection([ln, la]); ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke() }
    pin(MAKKAH.lat, MAKKAH.lng, '#2e9a73')
    if (loc) pin(loc.lat, loc.lng, '#e5484d')
  }, [cur, at, land, line, loc])

  if (!cur || !span) return null
  const { s, lc } = cur
  const fmtD = (ms) => { const p = partsIn(ms, tz); return `${p.d} ${months[p.m]} ${p.y}` }
  const hm = (ms) => partsIn(ms, tz).hm
  const dur = (ms) => { const sec = Math.round(ms / 1000); return t.minS(Math.floor(sec / 60), sec % 60) }
  const pct = (x) => (x >= 0.995 && x < 1 ? '99' : String(Math.round(x * 100)))
  const days = Math.max(0, Math.ceil(((lc?.c1 ?? span[0]) - Date.now()) / 86400000))
  const play = () => {
    if (playing) { cancelAnimationFrame(raf.current); setPlaying(false); return }
    cancelAnimationFrame(raf.current); setPlaying(true)
    const t0 = performance.now()
    const step = (x) => { const k = Math.min(1, (x - t0) / 10000); setAt(Math.round(span[0] + (span[1] - span[0]) * k)); if (k < 1) raf.current = requestAnimationFrame(step); else setPlaying(false) }
    raf.current = requestAnimationFrame(step)
  }
  let here = null
  if (lc?.visible && lc.seenObsc > 0) {
    const central = lc.c2 && lc.c3 && lc.kind !== 'P'
    here = central && lc.alt > 0 ? (lc.kind === 'T' ? t.totalHere(dur(lc.c3 - lc.c2)) : t.ringHere(dur(lc.c3 - lc.c2))) : t.covered(pct(lc.seenObsc))
  }
  const sunNote = lc?.visible && lc.seenMs !== lc.max ? (lc.seenMs < lc.max ? t.set : t.rise) : null
  const events = lc?.visible ? [[t.start, lc.c1], ...(lc.c2 && lc.kind !== 'P' ? [[lc.kind === 'T' ? t.totStart : t.ringStart, lc.c2]] : []), [t.max, lc.max], [t.end, lc.c4]] : []
  const mkTxt = !mk || !mk.visible ? t.makkahN : mk.kind === 'T' && mk.alt > 0 ? t.makkahT(dur(mk.c3 - mk.c2)) : t.makkahP(pct(mk.seenObsc))

  return (
    <section className="ui-section ui-section--tight sec-wrap">
      <div className="ui-container">
        <div className="sec ui-card" data-testid="solar-eclipses">
          <div className="sec__head">
            <span className="ui-eyebrow">{t.ey}</span>
            <h2 className="ui-title ui-title--sm">{t.title}</h2>
            <p className="ui-lead">{t.lead(loc?.city?.[lang] || loc?.city?.en)}</p>
          </div>
          <div className="sec__grid">
            <div className="sec__hero">
              <span className="sec__sel">{t.sel}</span>
              <b className="sec__date" data-testid="sec-date">{fmtD(maxMs(s))}</b>
              <span className={`sec__type sec__type--${s.t}`}>{t.kinds[s.t]}</span>
              <span className="sec__days ui-num">{days ? t.days(days) : t.today}</span>
              <div className={`sec__here${here ? ' is-on' : ''}`} data-testid="sec-here">
                <span className="sec__cap">{t.yours}</span>
                <b>{here || t.none}</b>
                {sunNote && <span className="sec__cap">{sunNote}</span>}
              </div>
              {events.length > 0 && (
                <ol className="sec__times">
                  {events.map(([n, ms]) => <li key={n}><span>{n}</span> <b className="ui-num">{hm(ms)}</b></li>)}
                </ol>
              )}
              <p className="sec__mk" data-testid="sec-makkah"><Icon name="hajjguide" size={14} /> <span>{t.makkah}: <b>{mkTxt}</b></span></p>
              {lessonHref && <a className="ui-btn ui-btn--secondary ui-btn--sm" href={lessonHref}><Icon name="books" size={15} className="ui-btn__icon" /> {t.lesson}</a>}
            </div>
            <div className="sec__mapbox">
              <canvas ref={canvasRef} className="sec__map" role="img" aria-label={t.map} data-testid="sec-map" />
              <div className="sec__ctl">
                {!reduced() && <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={play} data-testid="sec-play"><Icon name={playing ? 'pause' : 'play'} size={14} className="ui-btn__icon" /> {playing ? t.pause : t.play}</button>}
                <label className="sec__range">
                  <span>{t.time}: <b className="ui-num" data-testid="sec-time">{at != null ? hm(at) : '—'}</b></span>
                  <input type="range" min={span[0]} max={span[1]} step={60000} value={at ?? span[0]} onChange={ev => { cancelAnimationFrame(raf.current); setPlaying(false); setAt(+ev.target.value) }} aria-label={t.time} data-testid="sec-range" />
                </label>
              </div>
              <p className="sec__cap">{t.map}</p>
            </div>
          </div>
          <h3 className="sec__h3">{t.list}</h3>
          <ul className="sec__list" data-testid="sec-list">
            {list.map(({ s: x, lc: w }, i) => (
              <li key={x.d}>
                <button type="button" className={i === idx ? 'is-on' : ''} onClick={() => setIdx(i)} aria-pressed={i === idx}>
                  <span>{fmtD(maxMs(x))}</span>
                  <span className={`sec__lt sec__lt--${x.t}`}>{t.kinds[x.t]}</span>
                  <span className="ui-num sec__lp">{w?.visible && w.seenObsc > 0 ? `${pct(w.seenObsc)}%` : '—'}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="sec__safety"><Icon name="info" size={15} /> {t.safety}</p>
          <p className="sec__note">{t.note}</p>
        </div>
      </div>
    </section>
  )
}
