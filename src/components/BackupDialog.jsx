// "Məlumatlarım" dialoqu — footer-dəki düymədən açılır (tənbəl chunk).
// Brauzerin öz <dialog> elementi: fokus tələsi, ESC ilə bağlanma, arxa fon.
import { useEffect, useRef } from 'react'
import BackupCard from './BackupCard'
import Icon from './Icon'

export default function BackupDialog({ onClose, closeLabel }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) { try { d.showModal() } catch { d.setAttribute('open', '') } }
    const onCancel = (e) => { e.preventDefault(); onClose() }
    d?.addEventListener('cancel', onCancel)
    return () => d?.removeEventListener('cancel', onCancel)
  }, [onClose])
  return (
    <dialog ref={ref} className="bk-dialog" aria-labelledby="bk-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <BackupCard headingLevel={2} />
      <button type="button" className="ui-icon-btn bk-dialog__close" onClick={onClose} aria-label={closeLabel} title={closeLabel}>
        <Icon name="close" />
      </button>
    </dialog>
  )
}
