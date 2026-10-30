// ═══════════════════════════════════════════════════════
// Şablon seçicisi — hər şablonun miniatürü kanvasda çəkilir (renderThumb),
// ona görə seçicidəki görünüş kartın özü ilə eynidir.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef } from 'react'
import { TEMPLATES, renderThumb } from '../../utils/quoteCard'
import { TEMPLATE_NAMES } from './labels'

function Thumb({ tpl }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const size = 84
    c.width = size * dpr
    c.height = size * dpr
    const ctx = c.getContext('2d')
    ctx.setTransform((size * dpr) / 1080, 0, 0, (size * dpr) / 1080, 0, 0)
    renderThumb(ctx, tpl, 1080, 1080)
  }, [tpl])
  return <canvas ref={ref} className="qg-tpl__thumb" aria-hidden="true" />
}

export default function TemplatePicker({ value, onChange, lang, label }) {
  return (
    <div className="qg-tpls" role="group" aria-label={label}>
      {TEMPLATES.map(tpl => {
        const name = TEMPLATE_NAMES[tpl.id]?.[lang] || TEMPLATE_NAMES[tpl.id]?.en || tpl.id
        const on = value === tpl.id
        return (
          <button
            key={tpl.id}
            type="button"
            aria-pressed={on}
            className={`qg-tpl${on ? ' is-active' : ''}`}
            data-template-id={tpl.id}
            onClick={() => onChange(tpl.id)}
          >
            <Thumb tpl={tpl} />
            <span className="qg-tpl__name">{name}</span>
          </button>
        )
      })}
    </div>
  )
}
