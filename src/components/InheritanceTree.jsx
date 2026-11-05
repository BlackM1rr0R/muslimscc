// ═══════════════════════════════════════════════════════
// InheritanceTree — mirasın ailə ağacında bölünməsi (/inheritance nəticəsi)
//
//   <InheritanceTree shares={result.shares} net={result.net} name={heirName}
//     fmt={money} labels={{ title, deceased, blocked }} />
//
// • Nəsillər sıra-sıra (utils/familyTree.treeLayout): babalar → valideynlər →
//   vəfat edən + qardaş-bacı + həyat yoldaşı → övlad → nəvələr.
// • Hər varis qutusunda: ad (× say), kəsr, məbləğ və payın zolağı (malın neçə faizi).
// • Məhrum olanlar (həcb) qırıq xətlə, solğun, "məhrum" nişanı ilə; xətti də qırıqdır.
// • Xətlər SVG-dədir (non-scaling-stroke), qutular HTML — mətn ekran oxuyucuya
//   siyahı kimi çatır. Animasiya bir dəfəlik: xətlər görünür, qutular açılır.
// Stillər: src/styles/InheritanceTree.css
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import { treeLayout, elbow, ME } from '../utils/familyTree'
import '../styles/InheritanceTree.css'

const frac = (f) => { const [n, d = '1'] = String(f).split('/'); return Number(n) / Number(d) }

export default function InheritanceTree({ shares, net, name, fmt, labels }) {
  const byKey = useMemo(() => Object.fromEntries(shares.map(s => [s.heir, s])), [shares])
  const L = useMemo(() => treeLayout(shares.map(s => s.heir)), [shares])
  const me = L.nodes.find(n => n.key === ME)
  const sig = shares.map(s => `${s.heir}:${s.count}:${s.fraction}`).join('|')

  return (
    <figure className="it" data-testid="inheritance-tree" key={sig}>
      <figcaption className="it__title">{labels.title}</figcaption>
      <div className="it__stage" style={{ '--rows': L.rows }}>
        <svg className="it__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {L.nodes.filter(n => n.key !== ME).map((n, i) => (
            <path key={n.key} d={elbow(me, n)} style={{ '--i': i }}
              className={`it__link${byKey[n.key]?.type === 'blocked' ? ' is-blocked' : ''}`} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        <ul className="it__nodes">
          {L.nodes.map((n, i) => {
            const pos = { left: `${n.x}%`, top: `${n.y}%`, '--i': i }
            if (n.key === ME) {
              return (
                <li key={n.key} className="it__node it__node--me" style={pos}>
                  <span className="it__name">{labels.deceased}</span>
                  <span className="it__amt ui-num">{fmt(net)}</span>
                </li>
              )
            }
            const s = byKey[n.key]
            const blocked = s.type === 'blocked'
            const p = blocked ? 0 : frac(s.fraction)
            return (
              <li key={n.key} className={`it__node${blocked ? ' is-blocked' : ''}`} style={pos}>
                <span className="it__name">{name(n.key)}{s.count > 1 && <span className="ui-num"> × {s.count}</span>}</span>
                {blocked
                  ? <span className="it__tag">{labels.blocked}</span>
                  : <>
                      <span className="it__frac ui-num" dir="ltr">{s.fraction}</span>
                      <span className="it__amt ui-num">{fmt(s.total)}</span>
                      <span className="it__bar" aria-hidden="true"><i style={{ '--p': p.toFixed(4) }} /></span>
                    </>}
              </li>
            )
          })}
        </ul>
      </div>
    </figure>
  )
}
