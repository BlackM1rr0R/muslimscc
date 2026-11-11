// ═══════════════════════════════════════════════════════
// SahabaTree (v6.0) — "Ailə və yaxınlıq ağacı" (/sahaba): Peyğəmbər ﷺ ətrafında səhabələrin əlaqələri
//
//   <SahabaTree sahaba={SAHABA} lang="az" nameOf={s => …} hrefOf={s => …} onOpen={(s, e) => …} />
//
// QAYDA: yalnız səhabə kartlarının ÖZ tərcümeyi-halında yazılan əlaqələr (data/sahaba.js → bio):
//   Əbu Bəkr — "Peyğəmbərin ﷺ qayınatası"; Aişə — "Peyğəmbərin ﷺ zövcəsi, Əbu Bəkrin qızı";
//   Xədicə — "ilk zövcəsi"; Fatimə — "qızı", "Əliyə ərə getdi, Həsən və Hüseynin anası";
//   Əli — "əmisi oğlu və kürəkəni"; Osman — "Peyğəmbərin ﷺ iki qızı ilə evləndi"; Zübeyr — "əmisi oğlu"
//   (kartda yalnız "cousin" — ona görə ümumi "qohumu"); Zeyd — "övladlığa götürdüyü"; Bilal — "Əbu Bəkr satın alıb azad etdi".
//   Kartda yazılmayan əlaqə çəkilmir (məs. Xədicə–Fatimə də doğrudur, amma kartlarda yoxdur).
// • Toxun/üzərinə gəl → əlaqə və kart; Peyğəmbər ﷺ yalnız ad ilə (təsvir yoxdur).
// ═══════════════════════════════════════════════════════
import { useMemo, useRef, useState } from 'react'
import { pickUi } from '../utils/uiText'
import '../styles/SahabaTree.css'

const T = {
  az: { ey: 'Ailə ağacı', title: 'Peyğəmbər ﷺ ətrafında yaxınlar', lead: 'Səhabə kartlarında yazılan ailə və yaxınlıq əlaqələri. Bir adın üzərinə gəlin və ya toxunun — əlaqəsi görünsün; ikinci toxunuş kartı açır.', prophet: 'Peyğəmbər ﷺ', others: 'Digər səhabələr — kartlarında ailə əlaqəsi qeyd olunmayıb', hint: 'Bir səhabəyə toxunun.', fromCard: 'Səhabənin kartından', open: 'Kartı aç' },
  en: { ey: 'Family tree', title: 'Those close to the Prophet ﷺ', lead: 'The family and close ties written on the Companions’ cards. Hover over or tap a name to see the tie; a second tap opens the card.', prophet: 'The Prophet ﷺ', others: 'Other Companions — no family tie is noted on their cards', hint: 'Tap a Companion.', fromCard: 'From the Companion’s card', open: 'Open the card' },
  ru: { ey: 'Родословная', title: 'Близкие Пророка ﷺ', lead: 'Семейные и близкие связи, указанные в карточках сподвижников. Наведите на имя или коснитесь — появится связь; повторное касание открывает карточку.', prophet: 'Пророк ﷺ', others: 'Другие сподвижники — в их карточках семейная связь не указана', hint: 'Коснитесь сподвижника.', fromCard: 'Из карточки сподвижника', open: 'Открыть карточку' },
  ar: { ey: 'شجرة القرابة', title: 'المقرّبون من النبي ﷺ', lead: 'صلات القرابة والقرب المذكورة في بطاقات الصحابة. مرّر على اسم أو المسه لتظهر الصلة، واللمسة الثانية تفتح البطاقة.', prophet: 'النبي ﷺ', others: 'صحابة آخرون — لم تُذكر في بطاقاتهم صلة قرابة', hint: 'المس صحابيًا.', fromCard: 'من بطاقة الصحابي', open: 'افتح البطاقة' },
  tr: { ey: 'Aile ağacı', title: 'Peygamber’e ﷺ yakın olanlar', lead: 'Sahâbe kartlarında yazılan aile ve yakınlık bağları. Bir ismin üzerine gelin veya dokunun — bağı görünsün; ikinci dokunuş kartı açar.', prophet: 'Peygamber ﷺ', others: 'Diğer sahâbîler — kartlarında aile bağı belirtilmemiş', hint: 'Bir sahâbîye dokunun.', fromCard: 'Sahâbînin kartından', open: 'Kartı aç' },
}
// Əlaqə növləri (5 dil) — kartlardakı ifadələrə uyğun
const REL = {
  wife: { az: 'zövcəsi', en: 'wife', ru: 'жена', ar: 'زوجته', tr: 'eşi' },
  firstWife: { az: 'ilk zövcəsi', en: 'first wife', ru: 'первая жена', ar: 'أول زوجاته', tr: 'ilk eşi' },
  daughter: { az: 'qızı', en: 'daughter', ru: 'дочь', ar: 'ابنته', tr: 'kızı' },
  fatherInLaw: { az: 'qayınatası', en: 'father-in-law', ru: 'тесть', ar: 'صهره (والد زوجته)', tr: 'kayınpederi' },
  cousinSonInLaw: { az: 'əmisi oğlu və kürəkəni', en: 'cousin and son-in-law', ru: 'двоюродный брат и зять', ar: 'ابن عمه وصهره', tr: 'amcasının oğlu ve damadı' },
  sonInLaw2: { az: 'iki qızı ilə evlənib', en: 'married two of his daughters', ru: 'был женат на двух его дочерях', ar: 'تزوج اثنتين من بناته', tr: 'iki kızıyla evlendi' },
  cousin: { az: 'qohumu', en: 'cousin', ru: 'двоюродный брат', ar: 'قريبه', tr: 'kuzeni' },
  adopted: { az: 'övladlığa götürdüyü', en: 'adopted by him', ru: 'приёмный сын', ar: 'تبنّاه', tr: 'evlatlık edindiği' },
  father: { az: 'atası', en: 'father', ru: 'отец', ar: 'أبوها', tr: 'babası' },
  husband: { az: 'əri', en: 'husband', ru: 'муж', ar: 'زوجها', tr: 'kocası' },
  children: { az: 'övladları', en: 'children', ru: 'дети', ar: 'أبناؤها', tr: 'çocukları' },
  freed: { az: 'satın alıb azad etdi', en: 'bought and freed him', ru: 'выкупил и освободил', ar: 'اشتراه وأعتقه', tr: 'satın alıp azat etti' },
}
// [kimdən, kimə, növ]  — 'P' = Peyğəmbər ﷺ; rəqəm — SAHABA id; 'hasan-husayn' — Fatimənin kartındakı övladlar
const EDGES = [
  ['P', 5, 'firstWife'], ['P', 6, 'wife'], ['P', 7, 'daughter'], [1, 'P', 'fatherInLaw'],
  [4, 'P', 'cousinSonInLaw'], [3, 'P', 'sonInLaw2'], [18, 'P', 'cousin'], [14, 'P', 'adopted'],
  [1, 6, 'father'], [4, 7, 'husband'], [7, 'hh', 'children'], [1, 8, 'freed'],
]
const HH = { az: 'Həsən və Hüseyn', en: 'Hasan and Husayn', ru: 'Хасан и Хусейн', ar: 'الحسن والحسين', tr: 'Hasan ve Hüseyin' }
// Yerləşmə (SVG 900×560)
const POS = { P: [450, 270], 5: [250, 120], 6: [620, 130], 7: [450, 470], 1: [800, 230], 4: [270, 420], 3: [130, 260], 18: [770, 410], 14: [450, 70], 8: [790, 60], hh: [640, 520] }

export default function SahabaTree({ sahaba, lang = 'az', nameOf, hrefOf, onOpen }) {
  const t = pickUi(T, lang)
  const [focus, setFocus] = useState(null)
  const ptr = useRef('mouse')
  const byId = useMemo(() => Object.fromEntries(sahaba.map(s => [s.id, s])), [sahaba])
  const inTree = new Set(EDGES.flatMap(e => [e[0], e[1]]).filter(x => typeof x === 'number'))
  const others = sahaba.filter(s => !inTree.has(s.id))
  const label = (k) => (k === 'P' ? t.prophet : k === 'hh' ? pickUi(HH, lang) : nameOf(byId[k]))
  const lit = focus == null ? null : new Set(EDGES.filter(e => e[0] === focus || e[1] === focus).flatMap(e => [e[0], e[1]]))
  const tap = (k, e) => {
    const s = typeof k === 'number' ? byId[k] : null
    if (s && (ptr.current === 'mouse' || focus === k)) { onOpen?.(s, e); return }
    e.preventDefault(); setFocus(k)
  }
  const rels = focus == null ? [] : EDGES.filter(e => e[0] === focus || e[1] === focus)
  const fs = typeof focus === 'number' ? byId[focus] : null

  return (
    <section className="ui-section sct" aria-labelledby="sct-title" data-testid="sahaba-tree">
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="sct-title" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
        <div className="sct__frame">
          <svg viewBox="0 0 900 560" className="sct__svg" role="group" aria-label={t.title} style={{ direction: 'ltr' }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') setFocus(null) }}>
            {EDGES.map(([a, b, k], i) => {
              const [x1, y1] = POS[a], [x2, y2] = POS[b]
              const on = lit && lit.has(a) && lit.has(b) && (a === focus || b === focus)
              const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
              return (
                <g key={i} className={`sct__edge${on ? ' is-on' : ''}${lit && !on ? ' is-dim' : ''}`}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} />
                  <text x={mx} y={my - 6} textAnchor="middle" className="sct__rel">{pickUi(REL[k], lang)}</text>
                </g>
              )
            })}
            {Object.keys(POS).map(raw => {
              const k = /^\d+$/.test(raw) ? Number(raw) : raw
              const [x, y] = POS[raw], isP = k === 'P'
              const s = typeof k === 'number' ? byId[k] : null
              const on = !lit || lit.has(k)
              const node = (
                <g className={`sct__node${isP ? ' is-p' : ''}${on ? '' : ' is-dim'}${focus === k ? ' is-focus' : ''}`}>
                  <circle cx={x} cy={y} r={isP ? 46 : k === 'hh' ? 26 : 32} />
                  <text x={x} y={y + 4} textAnchor="middle">{label(k)}</text>
                </g>
              )
              return s ? (
                <a key={raw} href={hrefOf(s)} onClick={(e) => tap(k, e)} onPointerDown={(e) => { ptr.current = e.pointerType || 'mouse' }}
                  onPointerEnter={(e) => { if (e.pointerType === 'mouse') setFocus(k) }} aria-label={label(k)}>{node}</a>
              ) : (
                <g key={raw} role="button" tabIndex={0} onClick={() => setFocus(k)} onKeyDown={(e) => { if (e.key === 'Enter') setFocus(k) }} aria-label={label(k)}
                  onPointerEnter={(e) => { if (e.pointerType === 'mouse') setFocus(k) }}>{node}</g>
              )
            })}
          </svg>
          <div className="sct__info" aria-live="polite" data-testid="sct-info">
            {focus != null ? (
              <>
                <b>{label(focus)}</b>
                <ul>{rels.map(([a, b, k], i) => <li key={i}>{label(a)} → {label(b)}: <i>{pickUi(REL[k], lang)}</i></li>)}</ul>
                {fs && <span className="sct__src">{t.fromCard} · <a className="ui-link" href={hrefOf(fs)} onClick={(e) => onOpen?.(fs, e)}>{t.open} →</a></span>}
              </>
            ) : <span>{t.hint}</span>}
          </div>
        </div>
        <p className="sct__others-t">{t.others}</p>
        <ul className="sct__others">
          {others.map(s => <li key={s.id}><a className="ui-chip" href={hrefOf(s)} onClick={(e) => onOpen?.(s, e)}>{nameOf(s)}</a></li>)}
        </ul>
      </div>
    </section>
  )
}
