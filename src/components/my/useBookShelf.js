// H3 — kitab rəflərinin React vəziyyəti (utils/bookShelf); başqa tab / sinxron / modal dəyişəndə yenilənir
import { useCallback, useEffect, useState } from 'react'
import { readShelf, saveShelf, setEntry, SHELF_EVENT, SHELF_KEY } from '../../utils/bookShelf'

export default function useBookShelf() {
  const [shelf, setShelf] = useState(() => readShelf())
  useEffect(() => {
    const on = () => setShelf(readShelf())
    const st = (e) => { if (e.key === SHELF_KEY || e.key === null) on() }
    window.addEventListener(SHELF_EVENT, on)
    window.addEventListener('storage', st)
    window.addEventListener('mcc-acctsync', on)
    return () => { window.removeEventListener(SHELF_EVENT, on); window.removeEventListener('storage', st); window.removeEventListener('mcc-acctsync', on) }
  }, [])
  const set = useCallback((id, patch) => setShelf(saveShelf(setEntry(readShelf(), id, patch))), [])
  return { shelf, set }
}
