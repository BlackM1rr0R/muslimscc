// ═══════════════════════════════════════════════════════
// H1 — "Ana səhifəni fərdiləşdir" dialoqu (tənbəl chunk; yalnız düyməyə basanda yüklənir).
// İki siyahı: ana səhifənin bölmələri və "Bu gün" panelinin kartları. Hər sətir:
//   • sürüşdürüb buraxmaq (siçan — HTML5 drag & drop) və KLAVİATURA ALTERNATİVİ: ↑ / ↓ düymələri;
//   • "Göstər" açarı (checkbox); dəyişiklik dərhal saxlanır (utils/homeLayout → saveLayout) və
//     arxadakı səhifə özü yenilənir; hər hərəkət aria-live ilə elan olunur.
// Brauzerin <dialog> elementi: fokus tələsi, Esc ilə bağlanma.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import Icon from '../Icon'
import { readLayout, saveLayout, moveItem, moveTo, setHidden, defaultLayout } from '../../utils/homeLayout'
import { HOME_TXT } from './homeText'
import '../../styles/My.css'

function OrderList({ part, ids, hidden, names, t, onMove, onDrop, onToggle, label }) {
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  return (
    <ol className="my-order" aria-label={label}>
      {ids.map((id, i) => {
        const name = names[id] || id
        const off = hidden.includes(id)
        return (
          <li key={id}
            className={`my-order__row${off ? ' is-off' : ''}${drag === id ? ' is-drag' : ''}${over === i && drag && drag !== id ? ' is-over' : ''}`}
            draggable
            onDragStart={(e) => { setDrag(id); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id) } catch { /* */ } }}
            onDragOver={(e) => { if (drag) { e.preventDefault(); setOver(i) } }}
            onDragLeave={() => setOver((o) => (o === i ? null : o))}
            onDrop={(e) => { e.preventDefault(); if (drag && drag !== id) onDrop(part, drag, i); setDrag(null); setOver(null) }}
            onDragEnd={() => { setDrag(null); setOver(null) }}
            data-testid={`hl-row-${id}`}>
            <span className="my-order__grip" aria-hidden="true" title={t.drag}><i /><i /><i /></span>
            <span className="my-order__n ui-num" aria-hidden="true">{i + 1}</span>
            <label className="my-order__name">
              <input type="checkbox" checked={!off} onChange={(e) => onToggle(part, id, !e.target.checked)} data-testid={`hl-show-${id}`} />
              <span>{name}{off && <small className="my-order__tag"> · {t.hiddenTag}</small>}</span>
            </label>
            <span className="my-order__btns">
              <button type="button" className="ui-icon-btn ui-icon-btn--sm" data-move={`${part}-${id}-up`} disabled={i === 0}
                onClick={() => onMove(part, id, -1)} aria-label={`${t.up}: ${name}`} title={t.up} data-testid={`hl-up-${id}`}>
                <Icon name="arrowUp" size={16} />
              </button>
              <button type="button" className="ui-icon-btn ui-icon-btn--sm" data-move={`${part}-${id}-down`} disabled={i === ids.length - 1}
                onClick={() => onMove(part, id, 1)} aria-label={`${t.down}: ${name}`} title={t.down} data-testid={`hl-down-${id}`}>
                <Icon name="arrowDown" size={16} />
              </button>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default function HomeLayoutEditor({ onClose }) {
  const { lang } = useLang()
  const t = pickUi(HOME_TXT, lang, 'en')
  const ref = useRef(null)
  const [layout, setLayout] = useState(() => readLayout())
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) { try { d.showModal() } catch { d.setAttribute('open', '') } }
    const onCancel = (e) => { e.preventDefault(); onClose() }
    d?.addEventListener('cancel', onCancel)
    return () => d?.removeEventListener('cancel', onCancel)
  }, [onClose])

  const names = (part) => (part === 's' ? t.s : t.c)
  const commit = (next, announce) => { setLayout(saveLayout(next)); setMsg(announce) }

  const onMove = (part, id, dir) => {
    const next = moveItem(layout, part, id, dir)
    const pos = next[part].o.indexOf(id) + 1
    commit(next, t.moved(names(part)[id], pos, next[part].o.length))
    // Fokus eyni düymədə qalsın; kənara çatıbsa (düymə bağlanır) — əks istiqamətə
    requestAnimationFrame(() => {
      const root = ref.current
      const same = root?.querySelector(`[data-move="${part}-${id}-${dir < 0 ? 'up' : 'down'}"]`)
      const other = root?.querySelector(`[data-move="${part}-${id}-${dir < 0 ? 'down' : 'up'}"]`)
      ;(same && !same.disabled ? same : other)?.focus()
    })
  }
  const onDrop = (part, id, to) => {
    const next = moveTo(layout, part, id, to)
    commit(next, t.moved(names(part)[id], next[part].o.indexOf(id) + 1, next[part].o.length))
  }
  const onToggle = (part, id, hide) => {
    commit(setHidden(layout, part, id, hide), (hide ? t.hidden : t.shown)(names(part)[id]))
  }
  const reset = () => commit(defaultLayout(), t.resetDone)

  return (
    <dialog ref={ref} className="ui-dialog my-hl" aria-labelledby="hl-title" aria-describedby="hl-lead" data-testid="home-layout-editor"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ui-dialog__head">
        <h2 id="hl-title" className="ui-dialog__title"><Icon name="edit" size={20} /> {t.title}</h2>
        <button type="button" className="ui-icon-btn" onClick={onClose} aria-label={t.close} title={t.close}><Icon name="close" size={18} /></button>
      </div>
      <div className="ui-dialog__body">
        <p id="hl-lead" className="my-hl__lead">{t.lead}</p>
        <h3 className="my-hl__h">{t.sections}</h3>
        <OrderList part="s" ids={layout.s.o} hidden={layout.s.h} names={t.s} t={t} label={t.sections} onMove={onMove} onDrop={onDrop} onToggle={onToggle} />
        <h3 className="my-hl__h">{t.cells}</h3>
        <OrderList part="c" ids={layout.c.o} hidden={layout.c.h} names={t.c} t={t} label={t.cells} onMove={onMove} onDrop={onDrop} onToggle={onToggle} />
        <p className="my-hl__note"><Icon name="info" size={14} /> {t.note}</p>
        <p className="ui-sr-only" role="status" aria-live="polite" data-testid="hl-live">{msg}</p>
      </div>
      <div className="ui-dialog__foot">
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={reset} data-testid="hl-reset"><Icon name="refresh" className="ui-btn__icon" /> {t.reset}</button>
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={onClose} data-testid="hl-done">{t.done}</button>
      </div>
    </dialog>
  )
}
