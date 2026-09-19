import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { subscribeToAnnouncements, ANNOUNCEMENT_TYPES } from '../data/adminContent'
import { parsePath, pathFor, PAGES } from '../seo/routes'
import {
  usePromptSlot,
  useBottomInset,
  useAutoHide,
  engagedMs,
  wasShownThisSession,
} from '../utils/promptCoordinator'
import '../styles/AnnouncementToast.css'

// ═══════════════════════════════════════════════════════
// Admin elanları üçün qısa bildiriş zolağı
//
// Sahibinin rəyi ilə sakitləşdirildi:
//   • hər elan ziyarətçiyə ən çox BİR dəfə göstərilir (localStorage);
//   • ilk ~5 s ərzində və səhifə dəyişən kimi dərhal çıxmır;
//   • ana səhifədə çıxmır — orada elanlar bölməsi və gündəlik zolaq var;
//   • quraşdırma zolağı və bildiriş təklifi ilə eyni anda çıxmır
//     (promptCoordinator); sessiyada bir elan (təcili elanlar istisna);
//   • aşağıda yığcam zolaqdır — səhifə boşluq alır, heç nəyi örtmür.
// ═══════════════════════════════════════════════════════

// Mövcud açar — adı dəyişmir. Əvvəl sessionStorage-da idi (hər sessiyada
// yenidən çıxırdı); indi localStorage-dadır, köhnə qeydlər də oxunur.
const SEEN_KEY = 'muslim_cc_seen_announcements'
const SEEN_LIMIT = 200

const LABELS = {
  az: { more:'Daha çox', all:'Bütün elanlar', close:'Bağla' },
  en: { more:'Read more', all:'All announcements', close:'Close' },
  ru: { more:'Подробнее', all:'Все объявления', close:'Закрыть' },
  ar: { more:'المزيد', all:'كل الإعلانات', close:'إغلاق' },
  tr: { more:'Devamı', all:'Tüm duyurular', close:'Kapat' },
}

// Toast çıxmayan səhifələr
const QUIET_PAGES = new Set(['home', 'announcements', 'admin', 'adminlogin'])
const MIN_ENGAGED_MS = 5000     // sessiyada ilk ~5 s heç nə çıxmır
const ROUTE_SETTLE_MS = 2500    // səhifə açılan kimi yox, bir az sonra
const DURATION_MS = { normal: 8000, urgent: 14000 }
const PRIORITY = { urgent: 1, event: 2, success: 3, reminder: 4, info: 5 }
const CLOSE_ANIM_MS = 250

// Elanlar səhifəsi marşrutu qeydiyyatdan keçibsə "Bütün elanlar" keçidi göstərilir
const HAS_ANNOUNCEMENTS_PAGE = PAGES.some(p => p.key === 'announcements')

function readIds(store) {
  try {
    const v = JSON.parse(window[store].getItem(SEEN_KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function getSeenIds() {
  return Array.from(new Set([...readIds('localStorage'), ...readIds('sessionStorage')]))
}

function markSeen(id) {
  const seen = getSeenIds()
  if (seen.includes(id)) return
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id].slice(-SEEN_LIMIT)))
  } catch { /* yaddaş bağlıdır */ }
}

/** Yalnız http(s) keçidlərinə icazə — "javascript:" və s. açılmasın. */
function safeLink(link) {
  return typeof link === 'string' && /^https?:\/\//i.test(link.trim()) ? link.trim() : ''
}

function pick(obj, lang) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[lang] || obj.az || obj.en || ''
}

export default function AnnouncementToast() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.en
  const location = useLocation()
  const navigate = useNavigate()

  const { key: pageKey } = parsePath(location.pathname)
  const quiet = QUIET_PAGES.has(pageKey)

  const [items, setItems] = useState([])
  const [current, setCurrent] = useState(null)
  const [closing, setClosing] = useState(false)
  const barRef = useRef(null)
  const routeAtRef = useRef(Date.now())
  const closeTimerRef = useRef(null)

  // Səhifə dəyişəndə sayğacı sıfırla
  useEffect(() => { routeAtRef.current = Date.now() }, [location.pathname])

  // Firestore abunəsi
  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements((all) => setItems(Array.isArray(all) ? all : []))
    return () => unsubscribe?.()
  }, [])

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  // Növbə: aktiv, görülməmiş, ən vacib əvvəl
  const seen = getSeenIds()
  const queue = items
    .filter(a => a && a.id && a.active !== false && !seen.includes(a.id) && pick(a.title, lang))
    .sort((a, b) => (PRIORITY[a.type] || 5) - (PRIORITY[b.type] || 5))
  const candidate = queue[0] || null
  const candidateUrgent = candidate?.type === 'urgent'

  const enabled = Boolean(candidate) && !current && !quiet &&
    (candidateUrgent || !wasShownThisSession('announce'))

  const [shown, hide] = usePromptSlot(
    'announce',
    () => engagedMs() >= MIN_ENGAGED_MS && Date.now() - routeAtRef.current >= ROUTE_SETTLE_MS,
    { enabled },
  )

  // Slot alındı — göstəriləcək elanı sabitlə və "görüldü" qeyd et
  useEffect(() => {
    if (!shown || current) return
    if (candidate) {
      markSeen(candidate.id)
      setCurrent(candidate)
    } else {
      hide()
    }
  }, [shown, current, candidate, hide])

  const finish = useCallback(() => {
    clearTimeout(closeTimerRef.current)
    setClosing(false)
    setCurrent(null)
    hide()
  }, [hide])

  const close = useCallback(() => {
    setClosing(true)
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(finish, CLOSE_ANIM_MS)
  }, [finish])

  // Sakit səhifəyə (məs. ana səhifə) keçildisə dərhal gizlət
  useEffect(() => {
    if (quiet && current) finish()
  }, [quiet, current, finish])

  const urgent = current?.type === 'urgent'
  const duration = urgent ? DURATION_MS.urgent : DURATION_MS.normal

  useBottomInset(barRef, Boolean(current))
  const pauseProps = useAutoHide(Boolean(current) && !closing, duration, close)

  if (!current) return null

  const type = ANNOUNCEMENT_TYPES.find(t => t.key === current.type) || ANNOUNCEMENT_TYPES[0]
  const title = pick(current.title, lang)
  const message = pick(current.message, lang)
  const link = safeLink(current.link)
  const arrow = lang === 'ar' ? '←' : '→'

  const goAll = () => {
    finish()
    navigate(pathFor('announcements', lang))
    window.scrollTo(0, 0)
  }

  return (
    <div
      ref={barRef}
      className={`announcement-toast type-${type.key}${closing ? ' closing' : ''}`}
      style={{ '--toast-accent': type.color, '--toast-duration': `${duration}ms` }}
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
      {...pauseProps}
    >
      <div className="toast-inner">
        <div className="toast-icon-wrap" aria-hidden="true">
          <span className="toast-icon">{type.icon}</span>
        </div>

        <div className="toast-body">
          <div className="toast-type-label">{type.label[lang] || type.label.en}</div>
          <div className="toast-title">{title}</div>
          {message && <div className="toast-message">{message}</div>}
          {(link || HAS_ANNOUNCEMENTS_PAGE) && (
            <div className="toast-actions">
              {link && (
                <a className="toast-link" href={link} target="_blank" rel="noopener noreferrer">
                  {l.more} {arrow}
                </a>
              )}
              {HAS_ANNOUNCEMENTS_PAGE && (
                <button type="button" className="toast-all" onClick={goAll}>
                  {l.all}
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="toast-close"
          onClick={close}
          aria-label={l.close}
          title={l.close}
        >✕</button>
      </div>

      {/* Avtomatik bağlanma göstəricisi (siçan üstündə dayanır) */}
      <div className="toast-progress" aria-hidden="true" />
    </div>
  )
}
