// ═══════════════════════════════════════════════════════
// Şablon seçicisi (dizayn v3.1) — vizual miniatür şəbəkəsi.
// Hər miniatür kartın ÖZÜDÜR: cari mətn və cari ölçü ilə eyni funksiya
// (renderThumb → renderCard) çəkir — istifadəçi öz sitatını hər şablonda
// görür. Hekayə (9:16) ölçüsündə miniatürlər 4:5 çəkilir ki, şəbəkə çox
// uzanmasın. Yuxarıda süzgəc: hamısı / işıqlı / tünd.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { TEMPLATES, renderThumb, ensureFonts, formatById } from '../../utils/quoteCard'
import { TEMPLATE_NAMES, TEMPLATE_FILTERS } from './labels'
import { pickUi } from '../../utils/uiText'

// Mehrab fonu tünddür (tağın içi açıq olsa da)
const isDark = (tpl) => Boolean(tpl.dark) || tpl.id === 'mihrab'

function Thumb({ tpl, card, fmt }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return undefined
    let alive = true
    const draw = () => {
      if (!alive) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const cssW = Math.max(60, c.clientWidth || 120)
      const pw = Math.round(cssW * dpr), ph = Math.round((cssW * fmt.h / fmt.w) * dpr)
      if (c.width !== pw) c.width = pw
      if (c.height !== ph) c.height = ph
      const ctx = c.getContext('2d')
      ctx.setTransform(pw / fmt.w, 0, 0, ph / fmt.h, 0, 0)
      renderThumb(ctx, tpl, fmt.w, fmt.h, card)
    }
    draw()
    // Şriftlər gələndə yenidən (ilk çəkiliş ehtiyat şriftlə ola bilər)
    if (card) ensureFonts(card).then(draw)
    return () => { alive = false }
  }, [tpl, card, fmt])
  return <canvas ref={ref} className="qg-tpl__thumb" aria-hidden="true" style={{ aspectRatio: `${fmt.w} / ${fmt.h}` }} />
}

export default function TemplatePicker({ value, onChange, lang, label, card, format }) {
  const f = pickUi(TEMPLATE_FILTERS, lang, 'en')
  const [tone, setTone] = useState('all')
  const fmt = format?.id === 'story' ? formatById('portrait') : (format || formatById('square'))
  const list = TEMPLATES.filter(t => tone === 'all' || (tone === 'dark' ? isDark(t) : !isDark(t)))
  return (
    <div className="qg-tplbox">
      <div className="qg-tplbar">
        <div className="m-seg qg-seg qg-tone" role="group" aria-label={label}>
          {['all', 'light', 'dark'].map(k => (
            <button key={k} type="button" className="m-seg-btn" aria-pressed={tone === k} onClick={() => setTone(k)}>{f[k]}</button>
          ))}
        </div>
        <span className="qg-tplcount ui-num" aria-hidden="true">{list.length} {f.count}</span>
      </div>
      <div className="qg-tpls" role="group" aria-label={label} data-format={fmt.id}>
        {list.map(tpl => {
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
              <span className="qg-tpl__frame">
                <Thumb tpl={tpl} card={card} fmt={fmt} />
                {on && <span className="qg-tpl__check" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>}
              </span>
              <span className="qg-tpl__name">{name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
