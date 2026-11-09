// ═══════════════════════════════════════════════════════
// <CardStack items={duas} lang={lang} renderItem={(d) => <DuaCard d={d} />} getKey={d => d.id}
//   label="Günün duaları" index={i} onIndexChange={setI} />
// Dəstə: üstdəki kart sürüşdürülür (drag="x", domMax tənbəl), arxadakılar azca kiçik və aşağıda.
// Sola at → növbəti, sağa → əvvəlki (RTL-də güzgü). WCAG 2.5.7: həmişə düymələr də var
// (Əvvəlki/Növbəti) + ←/→ klaviatura; mövqe aria-live ilə elan olunur. Dövri (sonda başa qayıdır).
// Hərəkəti azalt → sürüşdürmə yox, kart dərhal dəyişir. visible — arxada görünən kart sayı (≤3).
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import LayoutFeatures from './LayoutFeatures'
import { SPRING, exitT, DUR, swipeDecision } from './presets'
import { useReduced } from './reduced'
import { motionLabels, posText } from './labels'

export default function CardStack({ items = [], renderItem, getKey = (_, i) => i, lang = 'az', label, index, onIndexChange, visible = 2, className = '' }) {
  const reduced = useReduced()
  const t = motionLabels(lang)
  const [own, setOwn] = useState(0)
  const [dir, setDir] = useState(1)
  const n = items.length
  const cur = n ? (((index ?? own) % n) + n) % n : 0
  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
  const go = (d) => {
    if (n < 2) return
    const next = (cur + d + n) % n
    setDir(d)
    if (index == null) setOwn(next)
    onIndexChange?.(next)
  }
  const onKey = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    go((e.key === 'ArrowRight') !== rtl ? 1 : -1)
  }
  if (!n) return null
  const back = Math.min(visible, n - 1)
  const exitX = (d) => (d > 0 ? -1 : 1) * (rtl ? -1 : 1) * 220
  return (
    <LayoutFeatures>
      <div className={`mo-stack${className ? ` ${className}` : ''}`} role="group" aria-roledescription={t.deck} aria-label={label} onKeyDown={onKey} data-wow-off="">
        <div className="mo-stack__deck">
          {Array.from({ length: back }, (_, k) => back - k).map((depth) => (
            <div key={`b${depth}`} className="mo-stack__ghost" aria-hidden="true" style={{ '--depth': depth }}>
              {renderItem(items[(cur + depth) % n], (cur + depth) % n)}
            </div>
          ))}
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <m.div key={getKey(items[cur], cur)} className="mo-stack__card" custom={dir}
              initial={reduced ? false : { opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0, rotate: 0, transition: SPRING.soft }}
              exit={(d) => ({ opacity: 0, x: exitX(d), rotate: (d > 0 ? -6 : 6) * (rtl ? -1 : 1), transition: exitT(DUR.md) })}
              drag={reduced || n < 2 ? false : 'x'} dragSnapToOrigin dragElastic={0.6}
              onDragEnd={(_, info) => { const s = swipeDecision(info.offset.x * (rtl ? -1 : 1), info.velocity.x * (rtl ? -1 : 1)); if (s) go(s) }}
              whileDrag={{ cursor: 'grabbing', scale: 1.02 }}>
              {renderItem(items[cur], cur)}
            </m.div>
          </AnimatePresence>
        </div>
        {n > 1 && (
          <div className="mo-stack__nav">
            <button type="button" className="ui-icon-btn mo-stack__btn" onClick={() => go(-1)} aria-label={t.prev}>
              <svg viewBox="0 0 24 24" width="20" height="20" className="ui-flip-rtl" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <span className="mo-stack__pos ui-num" aria-live="polite" dir="ltr">{posText(cur, n)}</span>
            <button type="button" className="ui-icon-btn mo-stack__btn" onClick={() => go(1)} aria-label={t.next}>
              <svg viewBox="0 0 24 24" width="20" height="20" className="ui-flip-rtl" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}
      </div>
    </LayoutFeatures>
  )
}
