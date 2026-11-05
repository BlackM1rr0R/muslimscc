// ═══════════════════════════════════════════════════════
// ZakatFlow — malın axını (Sankey üslubu) — /zakat nəticəsinin altında
//
//   <ZakatFlow sources={[{ key, label, value, tone }]} debt={500} net={12000}
//     zakat={300} above labels={{ title, total, debt, zakat, rest, below }} money={fmt} />
//
//   sol: varlıq növləri → orta: cəm → sağ: ödənilən borc · zəkat (2.5%) · sizdə qalan
// • Lent qalınlığı məbləğə mütənasibdir; zəkat lenti incə qızıl xətdir —
//   "malın çox kiçik bir hissəsi" hissini verir (görünsün deyə ən azı 3px).
// • Nisabdan aşağı: sağda yalnız "sizdə qalır" (boz qeyd ilə).
// • Kitabxanasız SVG; mətn ölçülər həm də aria-label-də. Animasiya bir dəfəlik
//   (lentlər sola→sağa açılır, opacity/transform). Stillər: src/styles/ZakatFlow.css
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import { vizColor } from './viz'
import { flowLayout, W, H, NODE, XL, XM, XR } from '../utils/zakatFlow'
import '../styles/ZakatFlow.css'

export default function ZakatFlow({ sources, debt = 0, net, zakat, above, labels, money }) {
  const L = useMemo(() => flowLayout({ sources, debt, net, zakat }), [sources, debt, net, zakat])
  if (!L) return null
  const rightLabel = { debt: labels.debt, zakat: labels.zakat, rest: labels.rest }
  const summary = [
    ...L.left.map(n => `${n.label}: ${money(n.value)}`),
    `${labels.total}: ${money(net)}`,
    ...L.right.map(n => `${rightLabel[n.key]}: ${money(n.value)}`),
  ].join('; ')
  const restColor = above ? 'var(--zf-rest)' : 'var(--zf-muted)'

  return (
    <figure className="ui-card zf" data-testid="zakat-flow">
      <figcaption className="zf__title">{labels.title}</figcaption>
      <svg className="zf__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} dir="ltr">
        <g className="zf__links zf__links--in">
          {L.inLinks.map((l, i) => <path key={l.key} d={l.d} fill={vizColor(l.tone)} style={{ '--i': i }} />)}
        </g>
        <g className="zf__links zf__links--out">
          {L.outLinks.map((l, i) => (
            <path key={l.key} d={l.d} style={{ '--i': i + 2 }} className={`zf__out zf__out--${l.key}`}
              fill={l.key === 'zakat' ? 'var(--zf-zakat)' : l.key === 'debt' ? 'var(--zf-debt)' : restColor} />
          ))}
        </g>
        {L.left.map(n => <rect key={n.key} className="zf__node" x={XL} y={n.y} width={NODE} height={Math.max(1, n.h)} rx={2} fill={vizColor(n.tone)} />)}
        <rect className="zf__node zf__node--mid" x={XM} y={L.mid.y} width={NODE} height={L.mid.h} rx={2} />
        {L.right.map(n => (
          <rect key={n.key} className={`zf__node zf__node--${n.key}`} x={XR} y={n.y} width={NODE} height={Math.max(1, n.h)} rx={2}
            fill={n.key === 'zakat' ? 'var(--zf-zakat)' : n.key === 'debt' ? 'var(--zf-debt)' : restColor} />
        ))}

        {L.left.map(n => (
          <text key={n.key} className="zf__lbl" x={XL - 6} y={n.ly} textAnchor="end">
            <tspan x={XL - 6} dy="-0.6em">{n.label}</tspan>
            <tspan x={XL - 6} dy="1.2em" className="zf__amt">{money(n.value)}</tspan>
          </text>
        ))}
        <text className="zf__lbl zf__lbl--mid" x={XM + NODE / 2} y={Math.max(11, L.mid.y - 6)} textAnchor="middle">{labels.total}</text>
        {L.right.map(n => (
          <text key={n.key} className={`zf__lbl zf__lbl--${n.key}`} x={XR + NODE + 6} y={n.ly}>
            <tspan x={XR + NODE + 6} dy="-0.6em">{rightLabel[n.key]}{n.key === 'zakat' ? ' · 2.5%' : ''}</tspan>
            <tspan x={XR + NODE + 6} dy="1.2em" className="zf__amt">{money(n.value)}</tspan>
          </text>
        ))}
      </svg>
      {!above && <p className="zf__note">{labels.below}</p>}
    </figure>
  )
}
