// ═══════════════════════════════════════════════════════
// HajjMap — Həcc səyahəti xəritəsi (/hajj-guide, "Həcc" rejimi)
//   Məscidül-Haram → Mina → Ərafat → Müzdəlifə → Cəmərat → Haram → Mina → Haram
//   Məkanlar real koordinatlarla (ekvidistant proyeksiya, km); yollar sxematikdir.
//   Keçilmiş yol qızılı dolur, hacı nöqtəsi cari addımın məkanına sürüşür.
//   Məkana toxunuş — orada olan ilk addımı açır.
// Animasiya: transform + stroke-dashoffset keçidi (sonsuz deyil).
// Stillər: src/styles/HajjMap.css
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/HajjMap.css'

/** Real koordinatlar (təxmini mərkəz nöqtələri) */
export const PLACES = {
  haram:      { lat: 21.4225, lon: 39.8262 },
  jamarat:    { lat: 21.4227, lon: 39.8730 },
  mina:       { lat: 21.4130, lon: 39.8935 },
  muzdalifah: { lat: 21.3836, lon: 39.9372 },
  arafat:     { lat: 21.3549, lon: 39.9842 },
}
/** Addım → məkan (HajjGuidePage HAJJ_STEPS id-ləri) */
export const STEP_PLACE = {
  ihram: 'haram', tawaf: 'haram', sai: 'haram', mina: 'mina', arafat: 'arafat', muzdalifah: 'muzdalifah',
  ramy: 'jamarat', qurbanliq: 'mina', halq: 'mina', ifadah: 'haram', tashriq: 'jamarat', wada: 'haram',
}

const NAMES = {
  az: { haram: 'Məscidül-Haram', jamarat: 'Cəmərat', mina: 'Mina', muzdalifah: 'Müzdəlifə', arafat: 'Ərəfat' },
  en: { haram: 'Masjid al-Haram', jamarat: 'Jamarat', mina: 'Mina', muzdalifah: 'Muzdalifah', arafat: 'Arafat' },
  ru: { haram: 'Запретная мечеть', jamarat: 'Джамарат', mina: 'Мина', muzdalifah: 'Муздалифа', arafat: 'Арафат' },
  tr: { haram: 'Mescid-i Haram', jamarat: 'Cemerat', mina: 'Mina', muzdalifah: 'Müzdelife', arafat: 'Arafat' },
  ar: { haram: 'المسجد الحرام', jamarat: 'الجمرات', mina: 'منى', muzdalifah: 'مزدلفة', arafat: 'عرفات' },
}
const DAYS = {
  az: { mina: '8 Zilhiccə', arafat: '9 Zilhiccə', muzdalifah: '9→10 gecəsi', jamarat: '10–13 Zilhiccə' },
  en: { mina: '8 Dhul-Hijjah', arafat: '9 Dhul-Hijjah', muzdalifah: 'night of 9→10', jamarat: '10–13 Dhul-Hijjah' },
  ru: { mina: '8 зуль-хиджа', arafat: '9 зуль-хиджа', muzdalifah: 'ночь на 10-е', jamarat: '10–13 зуль-хиджа' },
  tr: { mina: '8 Zilhicce', arafat: '9 Zilhicce', muzdalifah: '9→10 gecesi', jamarat: '10–13 Zilhicce' },
  ar: { mina: '٨ ذو الحجة', arafat: '٩ ذو الحجة', muzdalifah: 'ليلة العاشر', jamarat: 'من ١٠ إلى ١٣ ذي الحجة' },
}
const T = {
  az: { title: 'Səyahət xəritəsi', note: 'Məkanlar real yerindədir, yollar sxematikdir.', here: 'Siz buradasınız', go: (p) => `${p}: buradakı addımı aç`, km: 'km' },
  en: { title: 'Journey map', note: 'Places are at their real positions; routes are schematic.', here: 'You are here', go: (p) => `${p}: open the step here`, km: 'km' },
  ru: { title: 'Карта пути', note: 'Места — на реальных позициях, маршруты схематичны.', here: 'Вы здесь', go: (p) => `${p}: открыть шаг здесь`, km: 'км' },
  tr: { title: 'Yolculuk haritası', note: 'Mekânlar gerçek konumlarında, yollar şematiktir.', here: 'Buradasınız', go: (p) => `${p}: buradaki adımı aç`, km: 'km' },
  ar: { title: 'خريطة الرحلة', note: 'الأماكن في مواقعها الحقيقية، والطرق تخطيطية.', here: 'أنت هنا', go: (p) => `${p}: افتح الخطوة هنا`, km: 'كم' },
}

// Proyeksiya: km (şərq → x, şimal → yuxarı), sonra viewBox-a sığdırılır
const LAT0 = 21.39, KX = 111.32 * Math.cos((LAT0 * Math.PI) / 180), KY = 110.57
const LON_MIN = 39.8262, LAT_MAX = 21.4225
const PAD = 1.6, PAD_Y = 2.4, SCALE = 36              // 1 km = 36 vahid; yuxarıda yazılar üçün əlavə yer
const toXY = ({ lat, lon }) => ({ x: (PAD + (lon - LON_MIN) * KX) * SCALE, y: (PAD_Y + (LAT_MAX - lat) * KY) * SCALE })
const XY = Object.fromEntries(Object.entries(PLACES).map(([k, v]) => [k, toXY(v)]))
const W = Math.round(XY.arafat.x + PAD * SCALE * 1.4), H = Math.round(XY.arafat.y + PAD * SCALE * 1.3)

/** Marşrut: addımların ardıcıl, təkrarlanmayan məkanları */
export function routeStops(stepIds) {
  const stops = []
  stepIds.forEach((id, i) => {
    const p = STEP_PLACE[id]
    if (!p) return
    if (!stops.length || stops[stops.length - 1].place !== p) stops.push({ place: p, firstStep: i })
  })
  return stops
}

// Yumşaq əyri: iki nöqtə arası, perpendikulyar istiqamətdə kiçik qövs (gediş/qayıdış üst-üstə düşməsin)
function seg(a, b, bend) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1
  return { d: `Q ${(mx - (dy / len) * bend).toFixed(1)} ${(my + (dx / len) * bend).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`, len }
}

export default function HajjMap({ stepIds, current, onGo }) {
  const { lang } = useLang()
  const t = T[lang] || T.az, names = NAMES[lang] || NAMES.az, days = DAYS[lang] || DAYS.az

  const { stops, path, cum, total } = useMemo(() => {
    const stops = routeStops(stepIds)
    let d = `M ${XY[stops[0].place].x.toFixed(1)} ${XY[stops[0].place].y.toFixed(1)}`
    const cum = [0]
    stops.slice(1).forEach((s, i) => {
      const sg = seg(XY[stops[i].place], XY[s.place], i % 2 ? -26 : 26)
      d += ` ${sg.d}`
      cum.push(cum[cum.length - 1] + sg.len * 1.04)        // qövs düz xətdən bir az uzundur
    })
    return { stops, path: d, cum, total: cum[cum.length - 1] || 1 }
  }, [stepIds])

  // Cari addım hansı dayanacaqdadır?
  let stopIdx = 0
  stops.forEach((s, i) => { if (s.firstStep <= current) stopIdx = i })
  const here = stops[stopIdx]?.place || 'haram'
  const done = Math.min(1, cum[stopIdx] / total)
  const goPlace = (p) => {
    const ids = stepIds.map((id, i) => ({ id, i })).filter(x => STEP_PLACE[x.id] === p)
    const next = ids.find(x => x.i > current) || ids[0]
    if (next) onGo(next.i)
  }
  const km2 = 2 * SCALE

  return (
    <figure className="hm" data-testid="hajj-map">
      <figcaption className="hm__cap">
        <b>{t.title}</b>
        <span>{t.here}: <strong data-testid="hajj-map-here">{names[here]}</strong></span>
      </figcaption>
      <div className="hm__stage" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg className="hm__svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
          <defs>
            <pattern id="hm-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" /></pattern>
          </defs>
          <rect className="hm__bg" width={W} height={H} rx="18" />
          <rect className="hm__dots" width={W} height={H} rx="18" fill="url(#hm-dots)" />
          {/* Ərafat düzü və Mina vadisi — yumşaq ləkələr */}
          <ellipse className="hm__zone" cx={XY.arafat.x - 8} cy={XY.arafat.y} rx="62" ry="44" />
          <ellipse className="hm__zone" cx={(XY.mina.x + XY.jamarat.x) / 2} cy={(XY.mina.y + XY.jamarat.y) / 2} rx="58" ry="26"
            transform={`rotate(-18 ${(XY.mina.x + XY.jamarat.x) / 2} ${(XY.mina.y + XY.jamarat.y) / 2})`} />
          <path className="hm__route" d={path} />
          <path className="hm__route hm__route--done" d={path} pathLength="1" style={{ strokeDashoffset: 1 - done }} />
          {/* Miqyas: 2 km */}
          <g className="hm__scale" transform={`translate(${SCALE * 0.8} ${H - SCALE * 0.7})`}>
            <line x1="0" y1="0" x2={km2} y2="0" /><line x1="0" y1="-5" x2="0" y2="5" /><line x1={km2} y1="-5" x2={km2} y2="5" />
          </g>
          <g className="hm__me" style={{ transform: `translate(${XY[here].x}px, ${XY[here].y}px)` }}>
            <circle className="hm__me-halo" r="16" /><circle r="7" />
          </g>
        </svg>
        <span className="hm__scale-l" style={{ left: `${((SCALE * 0.8 + km2 / 2) / W) * 100}%`, top: `${((H - SCALE * 0.7 - 14) / H) * 100}%` }}>2 {t.km}</span>
        <ul className="hm__places">
          {Object.keys(PLACES).map((p) => (
            <li key={p} className={`hm__place hm__place--${p}${p === here ? ' is-here' : ''}`}
              style={{ left: `${(XY[p].x / W) * 100}%`, top: `${(XY[p].y / H) * 100}%` }}>
              <button type="button" onClick={() => goPlace(p)} aria-label={t.go(names[p])} aria-current={p === here ? 'location' : undefined}>
                <i aria-hidden="true" />
                <span className="hm__name">{names[p]}</span>
                {days[p] && <small className="hm__day">{days[p]}</small>}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="hm__note">{t.note}</p>
    </figure>
  )
}
