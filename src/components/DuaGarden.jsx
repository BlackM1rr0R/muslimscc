// ═══════════════════════════════════════════════════════
// DuaGarden — "Dua bağçası" (/duajournal) — yalnız bu cihazda
//
//   <DuaGarden duas={[{ id, text, category, priority, date, answered, answeredDate }]} lang="az" />
//
// • Hər dua bir bitkidir: aktiv dua — qönçə (gözləyir), qəbul olunan — açılmış
//   səkkizləçəkli çiçək. Rəng — kateqoriya, boy — prioritet.
// • Bitkiyə toxunuş → aşağıda duanın mətni və tarixi (yalnız sizə görünür).
// • Ən çox son 40 dua (köhnədən yeniyə, soldan sağa).
// • Canlı varlıq yoxdur — yalnız bitki. Animasiya bir dəfəlik: bitkilər
//   yerdən qalxır (transform), çiçək açılır (scale). Stillər: src/styles/DuaGarden.css
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import '../styles/DuaGarden.css'

const T = {
  az: { title: 'Dua bağçası', lead: 'Hər dua bir qönçədir; qəbul olunanda çiçək açır.', bud: 'gözləyir', bloom: 'qəbul olundu', pick: 'Duanın mətnini görmək üçün bitkiyə toxunun.', summary: (a, b) => `${a} qönçə, ${b} açılmış çiçək` },
  en: { title: 'Dua garden', lead: 'Every dua is a bud; when it is answered, it blooms.', bud: 'waiting', bloom: 'answered', pick: 'Tap a plant to see the dua.', summary: (a, b) => `${a} buds, ${b} flowers in bloom` },
  ru: { title: 'Сад дуа', lead: 'Каждое дуа — бутон; когда оно принято, он распускается.', bud: 'ожидает', bloom: 'принято', pick: 'Коснитесь растения, чтобы увидеть дуа.', summary: (a, b) => `бутонов: ${a}, цветов: ${b}` },
  tr: { title: 'Dua bahçesi', lead: 'Her dua bir tomurcuktur; kabul edilince çiçek açar.', bud: 'bekliyor', bloom: 'kabul edildi', pick: 'Duayı görmek için bitkiye dokunun.', summary: (a, b) => `${a} tomurcuk, ${b} açmış çiçek` },
  ar: { title: 'حديقة الدعاء', lead: 'كل دعاء برعم، فإذا استُجيب أزهر.', bud: 'ينتظر', bloom: 'استُجيب', pick: 'المس نبتة لترى الدعاء.', summary: (a, b) => `${a} براعم، ${b} أزهار متفتحة` },
}
const CAT_COLOR = { personal: 'var(--viz-1)', family: 'var(--viz-2)', health: 'var(--viz-3)', work: 'var(--viz-4)', ummah: 'var(--gold, #c59a2c)' }
const HEIGHT = { low: 46, medium: 62, high: 80 }
const MAX = 40
const W = 600, GROUND = 150
const PETALS = Array.from({ length: 8 }, (_, i) => i * 45)

export default function DuaGarden({ duas, lang = 'az' }) {
  const t = T[lang] || T.az
  const [sel, setSel] = useState(null)
  const list = useMemo(() => duas.slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-MAX), [duas])
  if (!list.length) return null
  const step = W / (list.length + 1)
  const cur = list.find(d => d.id === sel)
  const buds = list.filter(d => !d.answered).length

  return (
    <figure className="ui-card dg" data-testid="dua-garden" data-reveal="fade">
      <figcaption className="dg__head">
        <span className="dg__title">{t.title}</span>
        <span className="dg__lead">{t.lead}</span>
      </figcaption>
      <svg className="dg__svg" viewBox={`0 52 ${W} 118`} role="group" aria-label={t.summary(buds, list.length - buds)}>
        <path className="dg__ground" d={`M0,${GROUND} Q${W / 4},${GROUND - 8} ${W / 2},${GROUND} T${W},${GROUND} L${W},170 L0,170 Z`} />
        {list.map((d, i) => {
          const x = step * (i + 1) + (i % 2 ? 3 : -3)
          const h = HEIGHT[d.priority] || HEIGHT.medium
          const top = GROUND - h
          const c = CAT_COLOR[d.category] || CAT_COLOR.personal
          const label = `${d.text.slice(0, 80)} — ${d.answered ? t.bloom : t.bud}`
          return (
            <g key={d.id} className={`dg__plant${d.answered ? ' is-bloom' : ''}${sel === d.id ? ' is-sel' : ''}`}
              style={{ '--i': i, '--c': c, transformOrigin: `${x}px ${GROUND}px` }}
              role="button" tabIndex={0} aria-label={label} aria-pressed={sel === d.id}
              onClick={() => setSel(s => (s === d.id ? null : d.id))}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(s => (s === d.id ? null : d.id)) } }}>
              <rect x={x - step / 2} y={top - 16} width={step} height={h + 20} fill="transparent" />
              <path className="dg__stem" d={`M${x},${GROUND} C${x - 4},${GROUND - h / 2} ${x + 4},${GROUND - h / 2} ${x},${top}`} />
              <path className="dg__leaf" d={`M${x},${GROUND - h * 0.35} q 10,-4 13,-12 q -9,1 -13,12 z`} />
              {h > 50 && <path className="dg__leaf" d={`M${x},${GROUND - h * 0.55} q -10,-4 -13,-12 q 9,1 13,12 z`} />}
              {d.answered ? (
                <g className="dg__flower" style={{ transformOrigin: `${x}px ${top}px` }}>
                  {PETALS.map(a => (
                    <ellipse key={a} cx={x} cy={top - 7} rx="3.6" ry="7" transform={`rotate(${a} ${x} ${top})`} className="dg__petal" />
                  ))}
                  <circle cx={x} cy={top} r="3.6" className="dg__core" />
                </g>
              ) : (
                <path className="dg__bud" d={`M${x},${top - 12} C${x + 6},${top - 6} ${x + 5},${top + 2} ${x},${top + 2} C${x - 5},${top + 2} ${x - 6},${top - 6} ${x},${top - 12} Z`} />
              )}
            </g>
          )
        })}
      </svg>
      <p className="dg__note" aria-live="polite">
        {cur
          ? <><span className={`dg__tag${cur.answered ? ' is-bloom' : ''}`}>{cur.answered ? t.bloom : t.bud}</span> {cur.text}
              {(cur.answeredDate || cur.date) && <span className="dg__date ui-num"> · {cur.answeredDate || cur.date}</span>}</>
          : t.pick}
      </p>
    </figure>
  )
}
