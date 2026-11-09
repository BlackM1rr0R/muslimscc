// ═══════════════════════════════════════════════════════
// <AnimatedTabs tabs={[{ id:'all', label:'Hamısı', count:34 }, …]} value={tab} onChange={setTab}
//   label="Bölmələr" idBase="dua" variant="pill" />
// Sekmə siyahısı: seçilmiş sekmənin altındakı hap/xətt layoutId ilə sürüşür (domMax, tənbəl).
// • WAI-ARIA tabs: role=tablist/tab, aria-selected, aria-controls=`${idBase}-panel-${id}`,
//   id=`${idBase}-tab-${id}`; roving tabindex; ←/→ (RTL-də güzgü), Home/End; seçim fokusla (avtomatik).
// • Panel istifadəçidədir: <div role="tabpanel" id={`${idBase}-panel-${id}`} aria-labelledby={`${idBase}-tab-${id}`}>.
// • variant: 'pill' (seqment kimi) | 'underline' (alt xətt). Toxunma hədəfi ≥44px (coarse).
// ═══════════════════════════════════════════════════════
import { useId, useRef } from 'react'
import { LayoutGroup, m } from 'motion/react'
import LayoutFeatures from './LayoutFeatures'
import { SPRING } from './presets'

export default function AnimatedTabs({ tabs = [], value, onChange, label, idBase, variant = 'pill', className = '', size = 'md' }) {
  const uid = useId()
  const base = idBase || `mo-tabs${uid.replace(/:/g, '')}`
  const listRef = useRef(null)

  const onKey = (e) => {
    const i = tabs.findIndex(t => t.id === value)
    const rtl = listRef.current && getComputedStyle(listRef.current).direction === 'rtl'
    let j = -1
    if (e.key === 'ArrowRight') j = rtl ? i - 1 : i + 1
    else if (e.key === 'ArrowLeft') j = rtl ? i + 1 : i - 1
    else if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = tabs.length - 1
    else return
    e.preventDefault()
    const n = tabs.length
    const k = ((j % n) + n) % n
    // disabled sekmələri ötür
    for (let s = 0; s < n; s++) {
      const t = tabs[(k + (j < i ? -s : s) + n * 2) % n]
      if (!t.disabled) {
        onChange?.(t.id)
        listRef.current?.querySelector(`#${CSS.escape(`${base}-tab-${t.id}`)}`)?.focus()
        return
      }
    }
  }

  return (
    <LayoutFeatures>
      <LayoutGroup id={base}>
        <div ref={listRef} role="tablist" aria-label={label} onKeyDown={onKey} data-wow-off=""
          className={`mo-tabs mo-tabs--${variant} mo-tabs--${size}${className ? ` ${className}` : ''}`}>
          {tabs.map((t) => {
            const on = t.id === value
            return (
              <button key={t.id} type="button" role="tab" id={`${base}-tab-${t.id}`} aria-selected={on}
                aria-controls={`${base}-panel-${t.id}`} tabIndex={on ? 0 : -1} disabled={t.disabled}
                className={`mo-tab${on ? ' is-active' : ''}`} onClick={() => onChange?.(t.id)}>
                {on && <m.span layoutId="mo-tab-ind" className="mo-tab__ind" transition={SPRING.snappy} aria-hidden="true" />}
                <span className="mo-tab__label">{t.icon}{t.label}</span>
                {t.count != null && <span className="mo-tab__count">{t.count}</span>}
              </button>
            )
          })}
        </div>
      </LayoutGroup>
    </LayoutFeatures>
  )
}
