// ═══════════════════════════════════════════════════════
// ProphetPlacesMap (v5.9) — "Quranda adı keçən yerlər" (/history → Peyğəmbərlər)
//
//   <ProphetPlacesMap lang="az" prophets={PROPHETS} />
//
// • Yerlər və ayələr — data/prophetPlaces.js (Quranın özü adını çəkən yerlər, testlə yoxlanılıb).
//   Peyğəmbər seçiləndə onun xatırlandığı yerlər parlayır, qalanı solur; aşağıda ayələr (keçid).
// • Xəritə: real sahil xətləri (Natural Earth 110m, world-atlas) + d3-geo Merkator.
//   Nöqtələr məşhur, təxmini təyinlərdir — "təxmini" nişanı ilə.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { PROPHET_PLACES } from '../../data/prophetPlaces'
import { getSurahLocal } from '../../data/surahNamesAz'
import { SURAH_TABLE } from '../../data/mushafIndex'
import { pathFor } from '../../seo/routes'
import '../../styles/ProphetPlacesMap.css'

const T = {
  az: { title: 'Quranda adı keçən yerlər', lead: 'Quranın özünün adını çəkdiyi yerlər və orada xatırlanan peyğəmbərlər — hər birinin yanında ayəsi. Peyğəmbəri seçin.', all: 'Hamısı', approx: 'yeri təxminidir', place: 'Yer', none: 'Quranda bu peyğəmbər adı çəkilən bir yerlə birgə xatırlanmır.' },
  en: { title: 'Places named in the Quran', lead: 'Places the Quran itself names, and the prophets mentioned there — each with its ayah. Pick a prophet.', all: 'All', approx: 'location approximate', place: 'Place', none: 'The Quran does not mention this prophet together with a named place.' },
  ru: { title: 'Места, названные в Коране', lead: 'Места, которые называет сам Коран, и пророки, упомянутые в связи с ними, — с аятами. Выберите пророка.', all: 'Все', approx: 'место приблизительно', place: 'Место', none: 'Коран не упоминает этого пророка вместе с названным местом.' },
  ar: { title: 'أماكن ذُكرت في القرآن', lead: 'أماكن سمّاها القرآن نفسه، والأنبياء المذكورون فيها — مع الآية. اختر نبيًا.', all: 'الكل', approx: 'الموضع تقريبي', place: 'المكان', none: 'لم يُذكر هذا النبي في القرآن مع اسم مكان محدد.' },
  tr: { title: 'Kur’an’da adı geçen yerler', lead: 'Kur’an’ın bizzat adını verdiği yerler ve orada anılan peygamberler — her birinin âyetiyle. Bir peygamber seçin.', all: 'Hepsi', approx: 'yeri yaklaşıktır', place: 'Yer', none: 'Kur’an bu peygamberi adı verilen bir yerle birlikte anmaz.' },
}
const W = 640, H = 600
// Etiketin yeri [dx, dy, anchor] — yaxın nöqtələr (Mədyən–Tur, Misir) üst-üstə düşməsin
const LAB = { d: [10, -10, 'start'], madyan: [12, -10, 'start'], tur: [-12, 20, 'end'], misr: [-12, -10, 'end'], aqsa: [12, -8, 'start'] }
let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)).catch(e => { landCache = null; throw e }))

export default function ProphetPlacesMap({ lang = 'az', prophets = [] }) {
  const t = pickUi(T, lang)
  const [land, setLand] = useState(null)
  const [sel, setSel] = useState(0)            // 0 — hamısı, əks halda PROPHETS[].num
  useEffect(() => { loadLand().then(setLand).catch(() => {}) }, [])
  const proj = useMemo(() => geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], { type: 'MultiPoint', coordinates: [[28.5, 39], [51, 13]] }), [])
  const path = useMemo(() => geoPath(proj), [proj])
  const pts = useMemo(() => PROPHET_PLACES.map(p => ({ ...p, xy: proj([p.at[1], p.at[0]]) })), [proj])
  const nums = useMemo(() => [...new Set(PROPHET_PLACES.flatMap(p => p.refs.flatMap(r => r[1])))].sort((a, b) => a - b), [])
  const pName = (n) => pickUi(prophets.find(x => x.num === n)?.name, lang) || String(n)
  const on = (p) => !sel || p.refs.some(r => r[1].includes(sel))
  const rows = pts.flatMap(p => p.refs.filter(r => !sel || r[1].includes(sel)).map(r => ({ p, ref: r[0], who: r[1] })))
  const surah = (s) => getSurahLocal(s, lang)?.name || SURAH_TABLE[s - 1]?.[5] || s

  return (
    <figure className="ppm ui-card" data-testid="prophet-places">
      <figcaption className="ppm__head"><strong>{t.title}</strong><span>{t.lead}</span></figcaption>
      <div className="ppm__chips" role="radiogroup" aria-label={t.title}>
        <button type="button" role="radio" aria-checked={!sel} className={`ui-chip${!sel ? ' is-on' : ''}`} onClick={() => setSel(0)}>{t.all}</button>
        {nums.map(n => (
          <button key={n} type="button" role="radio" aria-checked={sel === n} className={`ui-chip${sel === n ? ' is-on' : ''}`} onClick={() => setSel(n)} data-testid={`ppm-p-${n}`}>{pName(n)}</button>
        ))}
      </div>
      <div className="ppm__body">
        <svg viewBox={`0 0 ${W} ${H}`} className="ppm__svg" role="img" aria-label={t.title} style={{ direction: 'ltr' }}>
          <rect width={W} height={H} className="ppm__sea" />
          {land && <path d={path(land)} className="ppm__land" />}
          {pts.map(p => (
            <g key={p.id} className={`ppm__pt${on(p) ? ' is-on' : ' is-dim'}`} transform={`translate(${p.xy[0].toFixed(1)} ${p.xy[1].toFixed(1)})`}>
              <circle r="16" className="ppm__halo" />
              <circle r="6" className="ppm__dot" />
              <text x={(LAB[p.id] || LAB.d)[0]} y={(LAB[p.id] || LAB.d)[1]} textAnchor={(LAB[p.id] || LAB.d)[2]} className="ppm__label">{pickUi(p.name, lang)}{p.approx ? ' ~' : ''}</text>
            </g>
          ))}
        </svg>
        <ul className="ppm__list" aria-live="polite">
          {rows.length ? rows.map(({ p, ref, who }) => {
            const [s, a] = ref.split(':').map(Number)
            return (
              <li key={`${p.id}-${ref}`}>
                <span className="ppm__place">{pickUi(p.name, lang)}{p.approx ? <small> · {t.approx}</small> : null}</span>
                <span className="ppm__who">{who.map(pName).join(', ')}</span>
                <a className="ui-link ppm__ref ui-num" href={`${pathFor('quran', lang, s)}?a=${a}`}>{surah(s)} {ref} <Icon name="arrow" size={13} className="ui-flip-rtl" /></a>
              </li>
            )
          }) : <li className="ppm__none">{t.none}</li>}
        </ul>
      </div>
    </figure>
  )
}
