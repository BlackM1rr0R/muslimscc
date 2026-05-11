import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { subscribeToAnnouncements, ANNOUNCEMENT_TYPES } from '../data/adminContent'
import '../styles/AnnouncementToast.css'

const SEEN_KEY = 'muslim_cc_seen_announcements'

function getSeenIds() {
  try { return JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]') } catch { return [] }
}

function markSeen(id) {
  const seen = getSeenIds()
  if (!seen.includes(id)) {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]))
  }
}

export default function AnnouncementToast() {
  const { lang } = useLang()
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const [closing, setClosing] = useState(false)

  // Firestore subscriber
  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements((all) => {
      const seen = getSeenIds()
      const active = all.filter(a => a.active !== false && !seen.includes(a.id))
      // ən vacib olanlar əvvəl: urgent > event > success > info > reminder
      const priority = { urgent:1, event:2, success:3, reminder:4, info:5 }
      active.sort((a, b) => (priority[a.type] || 5) - (priority[b.type] || 5))
      setQueue(active)
    })
    return () => unsubscribe?.()
  }, [])

  // Növbədə olan elan varsa, göstər
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      // Avtomatik bağlanma (urgent olanlar 8s, digərləri 5s)
      const isUrgent = queue[0].type === 'urgent'
      const timer = setTimeout(() => handleClose(), isUrgent ? 8000 : 5000)
      return () => clearTimeout(timer)
    }
  }, [queue, current])

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      if (current) markSeen(current.id)
      setQueue(prev => prev.filter(a => a.id !== current?.id))
      setCurrent(null)
      setClosing(false)
    }, 350)
  }

  const handleClick = () => {
    if (current?.link) {
      window.open(current.link, '_blank', 'noopener')
    }
  }

  if (!current) return null

  const type = ANNOUNCEMENT_TYPES.find(t => t.key === current.type) || ANNOUNCEMENT_TYPES[0]

  return (
    <>
      {/* Backdrop (yalnız urgent üçün) */}
      {current.type === 'urgent' && (
        <div className={`announcement-backdrop ${closing ? 'closing' : ''}`} onClick={handleClose} />
      )}

      <div
        className={`announcement-toast ${closing ? 'closing' : ''} type-${current.type}`}
        style={{
          background: `linear-gradient(135deg, ${type.color}, ${type.color}dd)`,
          cursor: current.link ? 'pointer' : 'default',
        }}
        onClick={handleClick}
      >
        {/* Sol icon */}
        <div className="toast-icon-wrap">
          <div className="toast-icon">{type.icon}</div>
        </div>

        {/* Mətn */}
        <div className="toast-body">
          <div className="toast-type-label">
            {type.label[lang] || type.label.en}
          </div>
          <div className="toast-title">
            {current.title?.[lang] || current.title?.en}
          </div>
          {(current.message?.[lang] || current.message?.en) && (
            <div className="toast-message">
              {current.message[lang] || current.message.en}
            </div>
          )}
          {current.link && (
            <div className="toast-link">
              {lang==='az'?'Daha çox →':lang==='ru'?'Подробнее →':lang==='ar'?'المزيد ←':lang==='tr'?'Devamı →':'Read more →'}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          className="toast-close"
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          aria-label="Close"
        >✕</button>

        {/* Progress bar (auto-dismiss göstəricisi) */}
        <div className={`toast-progress ${current.type === 'urgent' ? 'urgent' : ''}`} />
      </div>
    </>
  )
}
