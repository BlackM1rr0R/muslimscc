// ═══════════════════════════════════════════════════════
// NurMosaic (v6.9) — ömürlük zikr sayı nur mozaikasına çevrilir (/dhikr)
//
//   <NurMosaic total={1234} lang="az" />
//
// • 99 kafel = 3 halqa × 33 (namazdan sonrakı təsbehin 33-lük dövrələri).
//   Hər toxunuş bir kafel yandırır; halqa (33) dolanda o halqa parlayır,
//   99 dolanda bütöv naxış tamamlanır və aşağıda bir "nur medalyonu" qalır.
// • Sayı DhikrPage-in ömürlük sayğacıdır (localStorage 'dhikr_count_total')
//   — yalnız bu cihazda. Dekor SVG; rəqəmlər ayrıca mətndir (oxuyucu üçün).
// • Animasiya yalnız transform/opacity; hərəkət azaldılıbsa — sabit.
// ═══════════════════════════════════════════════════════
import { memo } from 'react'
import { pickUi } from '../../utils/uiText'
import '../../styles/NurMosaic.css'

const T = {
  az: { title: 'Nur mozaikanız', sub: 'Hər zikr mozaikanın bir parçasını işıqlandırır: 33-də halqa, 99-da bütöv naxış tamamlanır.', done: 'tamamlanmış naxış', now: 'bu naxışda', only: 'Yalnız bu cihazda sayılır.' },
  en: { title: 'Your mosaic of light', sub: 'Every dhikr lights one tile: a ring at 33, the whole pattern at 99.', done: 'completed patterns', now: 'in this pattern', only: 'Counted on this device only.' },
  ru: { title: 'Ваша мозаика света', sub: 'Каждый зикр зажигает плитку: кольцо — на 33, весь узор — на 99.', done: 'завершённых узоров', now: 'в этом узоре', only: 'Считается только на этом устройстве.' },
  ar: { title: 'فسيفساء النور', sub: 'كل ذكر يضيء قطعة: حلقة عند ٣٣، والنقش كله عند ٩٩.', done: 'نقوش مكتملة', now: 'في هذا النقش', only: 'يُحسب على هذا الجهاز فقط.' },
  tr: { title: 'Nur mozaiğiniz', sub: 'Her zikir bir parçayı yakar: 33 olunca halka, 99 olunca bütün desen tamamlanır.', done: 'tamamlanan desen', now: 'bu desende', only: 'Yalnızca bu cihazda sayılır.' },
}

const RINGS = [{ r: 22, s: 2.1 }, { r: 34, s: 3.1 }, { r: 46, s: 4.1 }]
// Kafel — kiçik 8 guşəli ulduz (radiusu s)
const star = (s) => {
  const p = []
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2
    const rr = i % 2 ? s * 0.55 : s
    p.push(`${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`)
  }
  return p.join(' ')
}

/** 99 kafelin yeri (saf funksiya) */
export function mosaicCells() {
  const out = []
  RINGS.forEach((ring, ri) => {
    for (let i = 0; i < 33; i++) {
      const a = (2 * Math.PI * i) / 33 - Math.PI / 2
      out.push({ ring: ri, x: 50 + Math.cos(a) * ring.r, y: 50 + Math.sin(a) * ring.r, rot: (a * 180) / Math.PI + 90 })
    }
  })
  return out
}
const CELLS = mosaicCells()
const SHAPES = RINGS.map(r => star(r.s))
const CORE = star(9)
const MEDALS = Array.from({ length: 12 }, (_, i) => i)

function NurMosaic({ total, lang }) {
  const u = pickUi(T, lang, 'en')
  const n = Math.max(0, Math.floor(total || 0))
  const lit = n % 99
  const full = Math.floor(n / 99)
  const ringsDone = Math.floor(lit / 33)
  return (
    <section className="ui-card nm" aria-labelledby="nm-title" data-testid="nur-mosaic">
      <div className="nm__head">
        <h2 className="nm__title" id="nm-title">{u.title}</h2>
        <p className="nm__sub">{u.sub}</p>
      </div>
      <div className="nm__body">
        <svg className="nm__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <circle className="nm__halo" cx="50" cy="50" r="49" />
          {RINGS.map((r, i) => <circle key={i} className={`nm__orbit${i < ringsDone ? ' is-done' : ''}`} cx="50" cy="50" r={r.r} />)}
          <g className="nm__core"><polygon points={CORE} transform="translate(50 50)" /></g>
          {CELLS.map((c, i) => (
            <polygon key={i} points={SHAPES[c.ring]}
              className={`nm__tile${i < lit ? ' is-lit' : ''}${i === lit - 1 ? ' is-new' : ''}${c.ring < ringsDone ? ' is-ring' : ''}`}
              transform={`translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) rotate(${c.rot.toFixed(1)})`} />
          ))}
        </svg>
        <div className="nm__stats">
          <p><b className="ui-num">{lit}</b> / 99 <span>{u.now}</span></p>
          <p><b className="ui-num">{full}</b> <span>{u.done}</span></p>
          {full > 0 && (
            <div className="nm__medals" aria-hidden="true">
              {MEDALS.slice(0, Math.min(full, 12)).map(i => <svg key={i} viewBox="-10 -10 20 20" className="nm__medal"><polygon points={CORE} /></svg>)}
              {full > 12 && <span className="nm__more">+{full - 12}</span>}
            </div>
          )}
          <p className="nm__only">{u.only}</p>
        </div>
      </div>
    </section>
  )
}

export default memo(NurMosaic)
