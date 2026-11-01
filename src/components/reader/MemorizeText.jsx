import { useEffect, useMemo, useState } from 'react'
import Icon from '../Icon'

/* ══════════════════════════════════════════════════════════════════
   MemorizeText — əzbər rejimi: mətn gizlənir, söz-söz açılır.
   • "Növbəti söz" ilk gizli sözü açır; gizli sözə toxunmaq onu açır
   • "Hamısını göstər" / "Yenidən gizlət"
   • Gizli söz ekran oxuyucudan da gizlidir (yerində "…")
   Mətn dəyişəndə (növbəti hədis) vəziyyət sıfırlanır.
   ══════════════════════════════════════════════════════════════════ */

export default function MemorizeText({ text, lang, dir, className = '', labels = {} }) {
  const words = useMemo(() => String(text || '').split(/\s+/).filter(Boolean), [text])
  const [shown, setShown] = useState(() => new Set())
  useEffect(() => { setShown(new Set()) }, [text])

  const next = () => setShown(prev => {
    const i = words.findIndex((_, k) => !prev.has(k))
    if (i < 0) return prev
    const s = new Set(prev); s.add(i); return s
  })
  const reveal = (i) => setShown(prev => { const s = new Set(prev); s.add(i); return s })
  const all = shown.size >= words.length

  return (
    <div className="rd-memo">
      <p className={`rd-memo__text ${className}`} lang={lang} dir={dir}>
        {words.map((w, i) => (shown.has(i)
          ? <span key={i} className="rd-memo__w is-shown">{w} </span>
          : (
            <span key={i} className="rd-memo__w" onClick={() => reveal(i)}>
              <span className="rd-memo__mask" aria-hidden="true">{w}</span>
              <span className="ui-sr-only">…</span>{' '}
            </span>
          )))}
      </p>
      <div className="rd-memo__bar">
        <span className="rd-memo__count ui-num" aria-live="polite" dir="ltr">{shown.size} / {words.length}</span>
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={next} disabled={all}>
          <Icon name="eye" className="ui-btn__icon" /> {labels.next}
        </button>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setShown(all ? new Set() : new Set(words.map((_, i) => i)))}>
          <Icon name={all ? 'refresh' : 'check'} className="ui-btn__icon" /> {all ? labels.hide : labels.all}
        </button>
      </div>
    </div>
  )
}
