import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { subscribeToAnnouncements, ANNOUNCEMENT_TYPES } from '../data/adminContent'
import { parsePath, pathFor, PAGES } from '../seo/routes'
import Icon from './Icon'
import {
  usePromptSlot,
  useBottomInset,
  useAutoHide,
  engagedMs,
  wasShownThisSession,
  exitDelay,
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
//   • 2-ci mərhələ: görünüş ümumi .ui-toast (ui.css §11); elan növünün
//     emoji/göy qurşağı rəngi əvəzinə xətti ikon + palitra tokeni (TYPE_STYLE).
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
const CLOSE_ANIM_MS = 220

// Elan növü → ikon + vurğu tokeni (adminContent-dəki emoji və hex rənglərin yerinə)
const TYPE_STYLE = {
  info:     { icon: 'info',     accent: 'var(--brand)' },
  urgent:   { icon: 'alert',    accent: 'var(--bad)' },
  event:    { icon: 'calendar', accent: 'var(--accent)' },
  success:  { icon: 'star',     accent: 'var(--ok)' },
  reminder: { icon: 'bell',     accent: 'var(--accent)' },
}

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

// Yalnız cari dil: elan bu dildə yazılmayıbsa göstərilmir (başqa dilin
// mətni səhifəyə "sızmasın" — /announcements ilə eyni qayda)
function pick(obj, lang) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return typeof obj[lang] === 'string' ? obj[lang] : ''
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
    closeTimerRef.current = setTimeout(finish, exitDelay(CLOSE_ANIM_MS))
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
  const look = TYPE_STYLE[type.key] || TYPE_STYLE.info

  const goAll = () => {
    finish()
    navigate(pathFor('announcements', lang))
    window.scrollTo(0, 0)
  }

  return (
    <div
      ref={barRef}
      className={`announcement-toast ui-toast type-${type.key}${closing ? ' is-leaving' : ''}`}
      style={{ '--toast-accent': look.accent, '--toast-duration': `${duration}ms` }}
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
      {...pauseProps}
    >
      <span className="ui-toast__icon toast-icon-wrap" aria-hidden="true">
        <Icon name={look.icon} />
      </span>

      <div className="ui-toast__body">
        <span className="ui-toast__eyebrow toast-type-label">{type.label[lang] || type.label.en}</span>
        <strong className="ui-toast__title">{title}</strong>
        {message && <span className="ui-toast__text">{message}</span>}
        {(link || HAS_ANNOUNCEMENTS_PAGE) && (
          <div className="toast-actions">
            {link && (
              <a className="ui-link toast-link" href={link} target="_blank" rel="noopener noreferrer">
                {l.more}
                <Icon name="external" size={14} />
              </a>
            )}
            {HAS_ANNOUNCEMENTS_PAGE && (
              <button type="button" className="ui-link toast-all" onClick={goAll}>
                {l.all}
                <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" />
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className="ui-toast__close"
        onClick={close}
        aria-label={l.close}
        title={l.close}
      >
        <Icon name="close" size={18} />
      </button>

      {/* Avtomatik bağlanma göstəricisi (siçan üstündə dayanır) */}
      <span className="ui-toast__progress" aria-hidden="true" />
    </div>
  )
}
