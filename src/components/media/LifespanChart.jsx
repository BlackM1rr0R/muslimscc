import { vizColor } from '../viz'
import './media.css'

/* ═══════════════════════════════════════════════════════
   Ömür / zaman qrafiki (Gantt kimi) — əl ilə yazılmış HTML, kitabxanasız.
   Alimlərin ömrü (doğum → vəfat) və ya səhabələrin vəfat ili (nöqtə).

   <LifespanChart min={0} max={1450} ticks={[{ v: 0, label: '0' }, …]}
     bands={[{ from: 11, to: 40, label: 'Raşid xəlifələr' }]}
     markers={[{ v: 0, label: 'Hicrət' }]}
     label="…"  (ekran oxuyucu üçün siyahının adı)
     rows={[{ key, name, sub, href, onClick, start, end, open, tone, approx }]} />

   • start yoxdursa — yalnız nöqtə (end ilində); open — hələ sağdır (ox ucuna qədər).
   • Rəng --viz-1…4 (tone), mətn həmişə mətn tokenlərində; hər sətrin adı və
     illəri MƏTN kimi yazılır (rəng tək daşıyıcı deyil).
   • RTL: inset-inline-start ilə özü güzgülənir (zaman sağdan sola axır).
   ═══════════════════════════════════════════════════════ */
export default function LifespanChart({ rows = [], min = 0, max = 100, ticks = [], bands = [], markers = [], label, className = '' }) {
  const span = max - min || 1
  const pct = (v) => `${Math.max(0, Math.min(100, ((v - min) / span) * 100))}%`
  const width = (a, b) => `${Math.max(0.6, ((Math.min(b, max) - Math.max(a, min)) / span) * 100)}%`

  const overlay = (
    <>
      {bands.map((b, i) => (
        <span key={`b${i}`} className="lc-band" style={{ insetInlineStart: pct(b.from), width: width(b.from, b.to) }} />
      ))}
      {markers.map((m, i) => (
        <span key={`m${i}`} className="lc-marker" style={{ insetInlineStart: pct(m.v) }} />
      ))}
      {ticks.map((t, i) => (
        <span key={`t${i}`} className="lc-grid" style={{ insetInlineStart: pct(t.v) }} />
      ))}
    </>
  )

  const axis = (
    <div className="lc-row lc-row--axis" aria-hidden="true">
      <span className="lc-label" />
      <span className="lc-track">
        {ticks.map((t, i) => (
          <span key={i} className={`lc-tick${t.v <= min ? ' lc-tick--start' : t.v >= max ? ' lc-tick--end' : ''}`} style={{ insetInlineStart: pct(t.v) }}>{t.label}</span>
        ))}
      </span>
    </div>
  )

  return (
    <div className={`lc${className ? ' ' + className : ''}`}>
      {(bands.length > 0 || markers.length > 0) && (
        <ul className="lc-key" aria-hidden="true">
          {bands.map((b, i) => <li key={`b${i}`}><span className="lc-key__band" />{b.label}</li>)}
          {markers.filter(m => m.label).map((m, i) => <li key={`m${i}`}><span className="lc-key__marker" />{m.label}</li>)}
        </ul>
      )}
      {axis}
      <ol className="lc-rows" aria-label={label}>
        {rows.map(r => {
          const color = vizColor(r.tone ?? 1)
          const end = r.open ? max : r.end
          const name = r.href
            ? <a className="lc-name" href={r.href} onClick={r.onClick}>{r.name}</a>
            : <span className="lc-name">{r.name}</span>
          return (
            <li key={r.key} className="lc-row">
              <span className="lc-label">
                {name}
                {r.sub && <span className="lc-sub">{r.sub}</span>}
              </span>
              <span className="lc-track" aria-hidden="true">
                {overlay}
                {r.start != null && end != null ? (
                  <span className={`lc-bar${r.open ? ' is-open' : ''}${r.approx ? ' is-approx' : ''}`}
                    style={{ insetInlineStart: pct(r.start), width: width(r.start, end), '--lc-color': color }} />
                ) : end != null ? (
                  <span className={`lc-dot${r.approx ? ' is-approx' : ''}`} style={{ insetInlineStart: pct(end), '--lc-color': color }} />
                ) : null}
              </span>
            </li>
          )
        })}
      </ol>
      {ticks.length > 0 && rows.length > 12 && axis}
    </div>
  )
}
