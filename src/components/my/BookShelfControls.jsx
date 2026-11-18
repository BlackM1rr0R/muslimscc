// ═══════════════════════════════════════════════════════
// H3 — kitab pəncərəsində (pages/BooksPage) rəf seçimi, qaldığım səhifə və şəxsi qeyd (≤500).
// Kitab xarici PDF-dir — səhifəni istifadəçi özü yazır. Hamısı utils/bookShelf-də (profil, sinxron).
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import Icon from '../Icon'
import { SHELVES, NOTE_MAX } from '../../utils/bookShelf'
import { SHELF_TXT } from './shelfText'
import useBookShelf from './useBookShelf'
import '../../styles/My.css'

export default function BookShelfControls({ bookId, title, maxPage }) {
  const { lang } = useLang()
  const t = pickUi(SHELF_TXT, lang, 'en')
  const { shelf, set } = useBookShelf()
  const id = String(bookId)
  const e = shelf.b[id] || null
  const [page, setPage] = useState(e?.p ? String(e.p) : '')
  const [note, setNote] = useState(e?.n || '')
  const [msg, setMsg] = useState('')
  useEffect(() => { setPage(e?.p ? String(e.p) : ''); setNote(e?.n || '') }, [id, e?.p, e?.n])
  useEffect(() => {
    if (!msg) return undefined
    const tm = setTimeout(() => setMsg(''), 2500)
    return () => clearTimeout(tm)
  }, [msg])

  const pickShelf = (s) => {
    if (s === null) { set(id, { s: null }); setMsg(t.remove); return }
    set(id, { s, t: title })
    setMsg(t.onShelf(t[s]))
  }
  const save = (ev) => {
    ev.preventDefault()
    const p = parseInt(page, 10)
    set(id, { s: e?.s || 'reading', t: title, p: Number.isFinite(p) && p > 0 ? p : undefined, n: note })
    setMsg(t.saved)
  }
  const base = `bs-${id}`
  return (
    <div className="my-shelf" data-testid="book-shelf">
      <fieldset className="my-shelf__set">
        <legend className="my-shelf__legend"><Icon name="books" size={16} /> {t.mine}</legend>
        <div className="my-shelf__seg" role="group" aria-label={t.shelf}>
          {SHELVES.map((s) => (
            <button key={s} type="button" className="ui-chip" aria-pressed={e?.s === s} onClick={() => pickShelf(s)} data-testid={`shelf-${s}`}>
              {e?.s === s && <Icon name="check" size={14} />} {t[s]}
            </button>
          ))}
          {e && <button type="button" className="ui-chip my-shelf__off" onClick={() => pickShelf(null)} data-testid="shelf-none">{t.remove}</button>}
        </div>
      </fieldset>
      {e && (
        <form className="my-shelf__form" onSubmit={save}>
          {e.s !== 'want' && (
            <label className="ui-field" htmlFor={`${base}-p`}>
              <span className="ui-field__label">{t.page}</span>
              <input id={`${base}-p`} className="ui-input ui-num my-shelf__page" type="number" inputMode="numeric" min={1} max={maxPage || 20000}
                value={page} onChange={(x) => setPage(x.target.value)} aria-describedby={`${base}-ph`} data-testid="shelf-page" />
              <span className="ui-field__hint" id={`${base}-ph`}>{t.pageHint}</span>
            </label>
          )}
          <label className="ui-field" htmlFor={`${base}-n`}>
            <span className="ui-field__label">{t.note}</span>
            <textarea id={`${base}-n`} className="ui-input" maxLength={NOTE_MAX} rows={3} value={note} onChange={(x) => setNote(x.target.value.slice(0, NOTE_MAX))}
              aria-describedby={`${base}-nh`} data-testid="shelf-note" />
            <span className="ui-field__hint ui-num" id={`${base}-nh`}>{t.noteHint([...note].length, NOTE_MAX)} · {t.private}</span>
          </label>
          <button type="submit" className="ui-btn ui-btn--secondary ui-btn--sm" data-testid="shelf-save"><Icon name="check" className="ui-btn__icon" /> {t.save}</button>
        </form>
      )}
      <p className="my-shelf__msg" role="status" aria-live="polite">{msg}</p>
    </div>
  )
}
