// ═══════════════════════════════════════════════════════
// <OrbitalTimeline items={[{ id, title, meta, icon, content }]} lang={lang} label="Peyğəmbərlər" />
// Elementlər dairəvi orbitdə yavaş fırlanır (21st.dev "radial orbital timeline" ideyası);
// birinə basanda orbit dayanır, element vurğulanır, mərkəzdə onun məzmunu açılır (PresenceSwap).
// • Fırlanma CSS transform (kompozitor); siçan üstündə / fokusda / seçiləndə / ekrandan kənarda
//   dayanır. Hərəkəti azalt ('decor') → orbit sabit.
// • Klaviatura: hər element <button aria-pressed>; ←/→ (və ↑/↓) qonşuya keçir, Esc seçimi götürür.
// • Kiçik ekranda (<560px konteyner) orbit əvəzinə üfüqi çiplər + məzmun (CSS container query).
//   props: items, value/onChange (idarəli, istəyə görə), radius (px, susma 42% konteyner), label, lang
// ═══════════════════════════════════════════════════════
import { useRef, useState } from 'react'
import PresenceSwap from './PresenceSwap'
import { orbitPositions } from './presets'
import { useReduced } from './reduced'
import useOffscreenPause from './useOffscreenPause'
import { motionLabels } from './labels'

export default function OrbitalTimeline({ items = [], value, onChange, label, lang = 'az', className = '', centerFallback = null }) {
  const [own, setOwn] = useState(null)
  const sel = value !== undefined ? value : own
  const set = (id) => { if (value === undefined) setOwn(id); onChange?.(id) }
  const root = useRef(null)
  const decorOff = useReduced('decor')
  const running = useOffscreenPause(root)
  const pos = orbitPositions(items.length, 1)
  const t = motionLabels(lang)
  const active = items.find(x => x.id === sel)

  const onKey = (e) => {
    const i = items.findIndex(x => x.id === (sel ?? items[0]?.id))
    if (e.key === 'Escape' && sel != null) { e.preventDefault(); set(null); return }
    const rtl = root.current && getComputedStyle(root.current).direction === 'rtl'
    let d = 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') d = rtl && e.key === 'ArrowRight' ? -1 : 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') d = rtl && e.key === 'ArrowLeft' ? 1 : -1
    if (!d || !items.length) return
    e.preventDefault()
    const next = items[(i + d + items.length) % items.length]
    set(next.id)
    root.current?.querySelector(`[data-orbit-id="${CSS.escape(String(next.id))}"]`)?.focus()
  }

  const spin = !decorOff && running && sel == null
  return (
    <div ref={root} className={`mo-orbit${spin ? '' : ' is-paused'}${className ? ` ${className}` : ''}`}
      role="group" aria-roledescription={t.orbit} aria-label={label} onKeyDown={onKey} data-wow-off="">
      <div className="mo-orbit__stage">
        <div className="mo-orbit__ring" aria-hidden="true" />
        <ul className="mo-orbit__track">
          {items.map((it, i) => (
            <li key={it.id} className="mo-orbit__slot" style={{ '--ox': pos[i].x, '--oy': pos[i].y }}>
              <button type="button" data-orbit-id={it.id} aria-pressed={sel === it.id}
                className={`mo-orbit__item${sel === it.id ? ' is-active' : ''}`} onClick={() => set(sel === it.id ? null : it.id)}>
                <span className="mo-orbit__dot" aria-hidden="true">{it.icon}</span>
                <span className="mo-orbit__title">{it.title}</span>
                {it.meta && <span className="mo-orbit__meta">{it.meta}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="mo-orbit__center" aria-live="polite">
          <PresenceSwap swapKey={active ? active.id : '__none'} variant="blur">
            {active ? active.content : centerFallback}
          </PresenceSwap>
        </div>
      </div>
    </div>
  )
}
