// ═══════════════════════════════════════════════════════
// SpreadTimeline — İslamın yayılması: zaman xəttli canlı xəritə (/history)
//   • Real sahil xətləri (Natural Earth 110m, world-atlas) + d3-geo Merkator
//   • "Oynat" — hadisələr il sırası ilə bir-bir: Mədinədən böyük dairə qövsü çəkilir
//   • Sürgü — istənilən ilə keç; ilkin halda hamısı görünür (statik oxunuş)
//   • Məlumat: SiraMaps.CITIES (632–762) + sonrakı əsrlərin ümumi qəbul olunmuş tarixləri
// Animasiya: transform/opacity + stroke-dashoffset keçidi; sonsuz heç nə yoxdur.
// Stillər: src/components/media/SpreadTimeline.css
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath, geoInterpolate } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import { CITIES, SPREAD_L } from './SiraMaps'
import './SpreadTimeline.css'

const T = (o, lang) => (o && (o[lang] || o.en)) || ''

// Sonrakı əsrlər — yalnız geniş qəbul olunmuş tarixlər
const LATER = [
  [54.98, 49.06, 'abbasid', '922', { az: 'Volqa Bulqarıstanı', en: 'Volga Bulgaria', ru: 'Волжская Булгария', ar: 'بلغار الفولغا', tr: 'İdil Bulgarları' }, 'start'],
  [39.14, 42.54, 'later', '1071', { az: 'Anadolu (Malazgird)', en: 'Anatolia (Manzikert)', ru: 'Анатолия (Манцикерт)', ar: 'الأناضول (ملاذكرد)', tr: 'Anadolu (Malazgirt)' }, 'end', -6],
  [28.61, 77.21, 'later', '1206', { az: 'Dehli sultanlığı', en: 'Delhi Sultanate', ru: 'Делийский султанат', ar: 'سلطنة دلهي', tr: 'Delhi Sultanlığı' }, 'start'],
  [5.17, 97.14, 'later', '≈1297', { az: 'Samudra-Pasay (Sumatra)', en: 'Samudera Pasai (Sumatra)', ru: 'Самудра-Пасай (Суматра)', ar: 'سامودرا باساي (سومطرة)', tr: 'Samudra Pasai (Sumatra)' }, 'end'],
  [41.01, 28.98, 'later', '1453', { az: 'İstanbul', en: 'Istanbul', ru: 'Стамбул', ar: 'إسطنبول', tr: 'İstanbul' }, 'middle', -4],
]
const LATER_ERA = { k: 'later', az: 'Sonrakı dövlətlər', en: 'Later states', ru: 'Последующие государства', ar: 'الدول اللاحقة', tr: 'Sonraki devletler' }

const L = {
  az: { play: 'Oynat', pause: 'Dayandır', year: 'İl', all: 'Hamısı', slider: 'Zaman xətti', note: 'Sahil xətləri: Natural Earth. Qövslər Mədinədən çəkilib və yayılmanın yolunu deyil, istiqamətini göstərir.' },
  en: { play: 'Play', pause: 'Pause', year: 'Year', all: 'All', slider: 'Timeline', note: 'Coastlines: Natural Earth. Arcs are drawn from Medina and show direction, not the actual route.' },
  ru: { play: 'Воспроизвести', pause: 'Пауза', year: 'Год', all: 'Все', slider: 'Шкала времени', note: 'Береговые линии: Natural Earth. Дуги проведены от Медины и показывают направление, а не реальный путь.' },
  tr: { play: 'Oynat', pause: 'Duraklat', year: 'Yıl', all: 'Tümü', slider: 'Zaman çizelgesi', note: 'Kıyı çizgileri: Natural Earth. Yaylar Medine’den çizilmiştir; gerçek yolu değil, yönü gösterir.' },
  ar: { play: 'تشغيل', pause: 'إيقاف', year: 'السنة', all: 'الكل', slider: 'الخط الزمني', note: 'خطوط السواحل: Natural Earth. الأقواس مرسومة من المدينة وتدل على الاتجاه لا على الطريق الفعلي.' },
}

// Bu geniş xəritədə statik sxemdən fərqli yerləşən yazılar (ingiliscə ada görə)
const LABEL_FIX = { Kairouan: ['start', 16], Samarkand: ['middle', 0] }

const MEDINA = [39.6112, 24.4672]          // [lon, lat]
const W = 960, H = 600
const firstYear = (s) => Number(/\d{3,4}/.exec(s)?.[0] || 0)

let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)))

/** Hadisələr il sırası ilə (Məkkə 630 daxil; Mədinə — başlanğıc nöqtəsidir) */
export const SPREAD_EVENTS = [...CITIES, ...LATER]
  .map(([lat, lon, era, year, name, anchor = 'start', off = 0]) => {
    const [a, o] = LABEL_FIX[name.en] || [anchor, off]
    return { lat, lon, era, year, name, anchor: a, off: o, y: firstYear(year) }
  })
  .sort((a, b) => a.y - b.y)

const reduced = () => typeof document !== 'undefined' && (document.documentElement.classList.contains('a11y-reduce-motion') ||
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

export default function SpreadTimeline({ lang = 'az' }) {
  const t = L[lang] || L.az
  const id = `st${useId().replace(/:/g, '')}`
  const N = SPREAD_EVENTS.length
  const [idx, setIdx] = useState(N - 1)           // görünən son hadisə (ilkin: hamısı)
  const [playing, setPlaying] = useState(false)
  const [land, setLand] = useState(null)
  const timer = useRef(0)

  useEffect(() => { let on = true; loadLand().then(l => on && setLand(l), () => {}); return () => { on = false } }, [])

  const geo = useMemo(() => {
    const proj = geoMercator().fitExtent([[20, 20], [W - 20, H - 20]], {
      type: 'MultiPoint', coordinates: [[-12, 57], [100, 57], [-12, 2], [100, 2]],
    })
    const path = geoPath(proj)
    const pts = SPREAD_EVENTS.map(e => proj([e.lon, e.lat]))
    const arcs = SPREAD_EVENTS.map(e => {
      const ip = geoInterpolate(MEDINA, [e.lon, e.lat])
      return path({ type: 'LineString', coordinates: Array.from({ length: 33 }, (_, i) => ip(i / 32)) })
    })
    return { proj, path, pts, arcs, medina: proj(MEDINA) }
  }, [])
  const landD = useMemo(() => (land ? geo.path(land) : null), [land, geo])

  useEffect(() => {
    if (!playing) return
    if (idx >= N - 1) { setPlaying(false); return }
    timer.current = setTimeout(() => setIdx(i => i + 1), reduced() ? 400 : 1100)
    return () => clearTimeout(timer.current)
  }, [playing, idx, N])

  const toggle = () => {
    if (playing) { setPlaying(false); return }
    if (idx >= N - 1) setIdx(0)
    setPlaying(true)
  }

  const cur = SPREAD_EVENTS[idx]
  const eras = [...SPREAD_L.eras, LATER_ERA]
  const eraName = T(eras.find(e => e.k === cur.era), lang)

  return (
    <figure className="st" data-testid="spread-timeline">
      <div className="st__canvas">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`} style={{ direction: 'ltr' }}>
          <title id={`${id}-t`}>{T(SPREAD_L.title, lang)}</title>
          <rect width={W} height={H} className="st__sea" />
          {landD && <path d={landD} className="st__land" />}
          {SPREAD_EVENTS.map((e, i) => (
            <path key={`a${i}`} d={geo.arcs[i]} pathLength="1"
              className={`st__arc st__arc--${e.era}${i <= idx ? ' is-on' : ''}${i === idx ? ' is-cur' : ''}`} />
          ))}
          <g className="st__medina" transform={`translate(${geo.medina[0]} ${geo.medina[1]})`}>
            <circle r="8" /><text x="12" y="-8">{T({ az: 'Mədinə', en: 'Medina', ru: 'Медина', ar: 'المدينة', tr: 'Medine' }, lang)} · 622</text>
          </g>
          {SPREAD_EVENTS.map((e, i) => {
            const [x, y] = geo.pts[i]
            // Yazı mövqeyi məlumatdan (SiraMaps.CITIES ilə eyni): start — sağa, end — sola, middle — üstə
            const a = e.anchor, dx = a === 'end' ? -9 : a === 'middle' ? 0 : 9
            const ly = a === 'middle' ? -12 + e.off * 0.6 : 4 + e.off * 0.6
            return (
              <g key={`c${i}`} className={`st__city st__city--${e.era}${i <= idx ? ' is-on' : ''}${i === idx ? ' is-cur' : ''}`}
                transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                <circle className="st__dot" r="5.5" />
                <text className="st__label" x={dx} y={ly.toFixed(1)} textAnchor={a}>{T(e.name, lang)}</text>
                <text className="st__sub" x={dx} y={(a === 'middle' ? ly - 15 : ly + 14).toFixed(1)} textAnchor={a}>{e.year}</text>
              </g>
            )
          })}
        </svg>
        <div className="st__now" aria-live="polite" data-testid="spread-now">
          <b className="ui-num">{cur.year}</b>
          <span>{T(cur.name, lang)}</span>
          <small>{eraName}</small>
        </div>
      </div>
      <div className="st__ctrl">
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm st__play" onClick={toggle} aria-pressed={playing} data-testid="spread-play">
          {playing ? '❚❚' : '▶'} <span>{playing ? t.pause : t.play}</span>
        </button>
        <input type="range" className="st__range" min="0" max={N - 1} step="1" value={idx}
          aria-label={t.slider} aria-valuetext={`${cur.year} — ${T(cur.name, lang)}`}
          onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)) }} />
        <span className="st__ends ui-num" dir="ltr" aria-hidden="true">{SPREAD_EVENTS[0].y}–{SPREAD_EVENTS[N - 1].y}</span>
      </div>
      <figcaption className="smap__cap">
        <strong className="smap__title">{T(SPREAD_L.title, lang)}</strong>
        <span className="smap__legends">
          {eras.map(e => <span key={e.k} className="smap__legend"><i className={`smap__key smap__key--${e.k}`} /> {T(e, lang)}</span>)}
        </span>
        <span className="smap__note">{T(SPREAD_L.desc, lang)} {t.note}</span>
      </figcaption>
    </figure>
  )
}
