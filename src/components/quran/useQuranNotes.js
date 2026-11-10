// Ayə qeydləri (utils/quranNotes) — React vəziyyəti; başqa tab/komponent dəyişəndə yenilənir
import { useCallback, useEffect, useState } from 'react'
import { NOTES_EVENT, NOTES_KEY, readNotes, writeNotes, setNote, removeNote } from '../../utils/quranNotes'

export default function useQuranNotes() {
  const [notes, setNotes] = useState(readNotes)
  useEffect(() => {
    const reload = () => setNotes(readNotes())
    const onStorage = (e) => { if (!e.key || e.key === NOTES_KEY) reload() }
    window.addEventListener(NOTES_EVENT, reload)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(NOTES_EVENT, reload); window.removeEventListener('storage', onStorage) }
  }, [])
  const save = useCallback((key, data) => writeNotes(setNote(readNotes(), key, data)), [])
  const remove = useCallback((key) => writeNotes(removeNote(readNotes(), key)), [])
  return { notes, save, remove }
}
