import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { useLang } from '../contexts/LangContext'
import { BRAND, tr } from '../config/brand'
import AccessibilityWidget from './AccessibilityWidget'
import { useBackToClose } from '../utils/useBackToClose'
import '../styles/FloatingDock.css'

// ═══════════════════════════════════════════════════════
// FloatingDock — sağ aşağıda TƏK üzən düymə
//
// Əvvəl ekranda 2-3 ayrı dairəvi düymə (AI, əlçatanlıq, bildirişlər)
// üst-üstə yığılıb məzmunu örtürdü. İndi bir düymə açılır və kiçik
// şaquli menyu göstərir; seçilən element öz panelini açır.
//
// • Əlçatanlıq tərcihləri panel bağlı olanda da tətbiq olunmalıdır —
//   ona görə AccessibilityWidget həmişə render edilir (statik import).
// • AI və bildiriş panelləri Firebase çəkir (~470 KB) — yalnız ilk dəfə
//   açılanda yüklənir və sonra yaddaşda qalır (yarımçıq AI cavabı itmir).
// • <1024px-də düymənin özü CSS ilə gizlidir (məzmunu örtürdü) — alətlər
//   başlıqdakı ☰ çəkmə menyusundadır (SideNav "drawer", "Alətlər" sətri)
//   və panelləri aşağıdakı hadisə ilə açır; panel bağlananda fokus ☰-yə qayıdır.
//   Panellər (AI, əlçatanlıq, bildirişlər) hər ekran enində buradan render olunur.
// • Header-in "open-notifications" hadisəsini burada dinləyirik.
// • Başqa komponentlər paneli belə aça bilər:
//     window.dispatchEvent(new CustomEvent('qm-dock-open', { detail: 'ai' | 'a11y' | 'notif' }))
// ═══════════════════════════════════════════════════════

const loadAIChat = () => import('./AIChatWidget')
const loadNotifSettings = () => import('./NotificationSettingsWidget')
const AIChatWidget = lazy(loadAIChat)
const NotificationSettingsWidget = lazy(loadNotifSettings)

const LABELS = {
  az: { toggle:'Köməkçi alətlər', close:'Menyunu bağla', a11y:'Əlçatanlıq', notif:'Bildirişlər', unread:'yeni cavab var', active:'aktiv ayar' },
  en: { toggle:'Quick tools', close:'Close menu', a11y:'Accessibility', notif:'Notifications', unread:'new reply', active:'active settings' },
  ru: { toggle:'Быстрые инструменты', close:'Закрыть меню', a11y:'Доступность', notif:'Уведомления', unread:'есть новый ответ', active:'активных настроек' },
  ar: { toggle:'أدوات سريعة', close:'إغلاق القائمة', a11y:'إمكانية الوصول', notif:'الإشعارات', unread:'رد جديد', active:'إعدادات مفعّلة' },
  tr: { toggle:'Hızlı araçlar', close:'Menüyü kapat', a11y:'Erişilebilirlik', notif:'Bildirimler', unread:'yeni yanıt var', active:'aktif ayar' },
}

const PANEL_KEYS = ['ai', 'a11y', 'notif']

// Səhifənin ilk bu qədər pikselində düymə sürüşdürmə ilə gizlənmir
const SHOW_NEAR_TOP_PX = 120

// ── İkonlar (panellərin özündəkilərlə eyni forma; lazy chunk-u
//    açmamaq üçün burada ayrıca saxlanılır) ─────────────
function SparkleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3.5 L17.9 13.6 L28 16 L17.9 18.4 L16 28.5 L14.1 18.4 L4 16 L14.1 13.6 Z" fill="currentColor" />
      <path d="M24.5 5.5 L25.3 8.2 L28 9 L25.3 9.8 L24.5 12.5 L23.7 9.8 L21 9 L23.7 8.2 Z" fill="currentColor" opacity="0.85" />
    </svg>
  )
}

function A11yIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="4.5" r="2.2" fill="currentColor" />
      <path
        d="M5.5 8.5C6.1 8.2 6.8 8.4 7 9L8.2 11.5L11.5 11.5L11.5 14L9 19.2C8.7 19.9 9.1 20.6 9.8 20.9C10.5 21.2 11.3 20.8 11.5 20.1L13 16.5L14.5 20.1C14.7 20.8 15.5 21.2 16.2 20.9C16.9 20.6 17.3 19.9 17 19.2L14.5 14L14.5 11.5L17.5 11.5C18.3 11.5 18.8 11 18.8 10.3C18.8 9.5 18.3 9 17.5 9L12 9C11.2 9 10.8 9.4 10.8 9.4L10.2 8.2C10 7.8 9.5 7.5 9 7.5L6 7.5C5.5 7.5 5 8 5 8.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

function BellIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2C10.5 2 9.3 3.2 9.3 4.7V5.2C6.8 6 5 8.4 5 11.2V14L3.5 16.5C3.2 17 3 17.6 3 18.2C3 19 3.7 19.7 4.5 19.7H19.5C20.3 19.7 21 19 21 18.2C21 17.6 20.8 17 20.5 16.5L19 14V11.2C19 8.4 17.2 6 14.7 5.2V4.7C14.7 3.2 13.5 2 12 2Z"
        fill="currentColor"
      />
      <path d="M10 20.7C10 21.9 10.9 22.7 12 22.7C13.1 22.7 14 21.9 14 20.7H10Z" fill="currentColor" />
    </svg>
  )
}

function PlusIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/** Panel chunk-ı yüklənərkən dok yerində kiçik fırlanan göstərici. */
function DockLoading() {
  return (
    <div className="qm-dock-loading" role="status" aria-live="polite">
      <span className="qm-dock-spinner" />
    </div>
  )
}

/**
 * @param {{ page?: string }} props  page — cari səhifə açarı ('aichat'-da AI elementi gizlənir)
 */
export default function FloatingDock({ page }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const isAdmin = page === 'admin' || page === 'adminlogin'
  const showAI = page !== 'aichat'

  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState(null)              // 'ai' | 'a11y' | 'notif' | null
  const [loaded, setLoaded] = useState({ ai: false, notif: false })
  const [aiUnread, setAiUnread] = useState(false)
  const [a11yCount, setA11yCount] = useState(0)
  const [scrollHidden, setScrollHidden] = useState(false)

  const rootRef = useRef(null)
  const toggleRef = useRef(null)
  // Paneli açan element (məs. ☰ çəkmə menyusundan gələndə — başlığın ☰-si):
  // panel bağlananda fokus ora qayıdır
  const returnFocusRef = useRef(null)

  // Menyu elementləri DOM-dan oxunur. Əvvəl ref massivi render zamanı
  // sıfırlanırdı; React render edib dəyişiklik olmadığına görə commit-i
  // atlayanda (məs. eyni dəyərli setState) massiv boş qalır, fokus və ox
  // düymələri işləmirdi.
  const getItems = () => Array.from(rootRef.current?.querySelectorAll('.qm-dock-item') || [])

  const openPanel = useCallback((key) => {
    if (!PANEL_KEYS.includes(key)) return
    // Fokusun qayıdacağı yer. Dok menyusunun öz elementləri menyu ilə
    // birlikdə DOM-dan çıxır — onlar yadda saxlanmır (dok düyməsi qalır)
    const ae = document.activeElement
    returnFocusRef.current = ae && ae !== document.body && !rootRef.current?.contains(ae) ? ae : null
    setMenuOpen(false)
    if (key === 'ai' || key === 'notif') {
      setLoaded(prev => (prev[key] ? prev : { ...prev, [key]: true }))
    }
    setPanel(key)
  }, [])

  const closePanel = useCallback(() => {
    setPanel(null)
    // Fokus itibsə (panel DOM-dan çıxdı) — paneli açan elementə, o yoxdursa
    // dok düyməsinə qaytar. <1024px-də dok düyməsi gizlidir (display:none —
    // focus() heç nə etmir), alətlər ☰ menyusundan açılır → başlığın ☰-si.
    setTimeout(() => {
      const ae = document.activeElement
      const opener = returnFocusRef.current
      returnFocusRef.current = null
      if (ae && ae !== document.body) return
      const canFocus = (el) => Boolean(el?.isConnected && el.getClientRects().length)
      const target = [opener, toggleRef.current, document.querySelector('.hdr-burger')].find(canFocus)
      target?.focus({ preventScroll: true })
    }, 30)
  }, [])

  // Açıq paneli (AI, əlçatanlıq, bildirişlər) telefonun Geri düyməsi bağlasın —
  // səhifə dəyişməsin (utils/useBackToClose)
  useBackToClose(Boolean(panel), closePanel)

  // Header "Bildirişlər" menyusu və digər komponentlərdən açılma
  useEffect(() => {
    const onNotif = () => openPanel('notif')
    const onOpen = (e) => {
      const key = e?.detail
      if (key === 'ai' && !showAI) return
      openPanel(key)
    }
    window.addEventListener('open-notifications', onNotif)
    window.addEventListener('qm-dock-open', onOpen)
    return () => {
      window.removeEventListener('open-notifications', onNotif)
      window.removeEventListener('qm-dock-open', onOpen)
    }
  }, [openPanel, showAI])

  // Səhifə dəyişəndə menyu bağlansın; AI səhifəsinə keçəndə AI paneli də
  useEffect(() => {
    setMenuOpen(false)
    setScrollHidden(false)
    if (page === 'aichat') setPanel(p => (p === 'ai' ? null : p))
  }, [page])

  // Oxuyarkən məzmunu örtməsin: aşağı sürüşdürəndə düymə kənara çəkilir,
  // yuxarı sürüşdürəndə qayıdır. Səhifənin başında həmişə görünür;
  // klaviatura fokusu və açıq menyu onu yenə göstərir (CSS: :focus-within).
  useEffect(() => {
    if (isAdmin) return undefined
    let lastY = window.scrollY
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = window.scrollY
        const dy = y - lastY
        if (Math.abs(dy) < 6) return
        lastY = y
        setScrollHidden(dy > 0 && y > SHOW_NEAR_TOP_PX)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [isAdmin])

  // Menyu açıq ikən: <html> sinfi (koordinator promptları saxlayır),
  // Escape, kənara klik, ilk elementə fokus
  useEffect(() => {
    if (!menuOpen) return undefined
    const root = document.documentElement
    root.classList.add('qm-dock-open')

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onPointer = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    const t = setTimeout(() => getItems()[0]?.focus(), 30)

    // Panel chunk-larını əvvəlcədən yüklə — seçim edəndə gecikmə olmasın
    loadAIChat().catch(() => {})
    loadNotifSettings().catch(() => {})

    return () => {
      root.classList.remove('qm-dock-open')
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
      clearTimeout(t)
    }
  }, [menuOpen])

  // Menyuda ox düymələri ilə gəzmək
  const onMenuKeyDown = (e) => {
    const items = getItems()
    if (!items.length) return
    const idx = items.indexOf(document.activeElement)
    let next = null
    if (e.key === 'ArrowDown') next = (idx + 1) % items.length
    else if (e.key === 'ArrowUp') next = (idx - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    if (next != null) {
      e.preventDefault()
      items[next].focus()
    }
  }

  // Fokus dokdan tamamilə çıxanda (Tab) menyunu bağla
  const onDockBlur = (e) => {
    if (menuOpen && rootRef.current && !rootRef.current.contains(e.relatedTarget)) {
      setMenuOpen(false)
    }
  }

  if (isAdmin) return null

  const unread = aiUnread && showAI

  const items = [
    showAI && {
      key: 'ai',
      label: tr(BRAND.aiName, lang),
      icon: <SparkleIcon size={20} />,
      badge: unread ? { dot: true, sr: l.unread } : null,
    },
    {
      key: 'a11y',
      label: l.a11y,
      icon: <A11yIcon size={20} />,
      badge: a11yCount > 0 ? { text: String(a11yCount), sr: `${a11yCount} ${l.active}` } : null,
    },
    {
      key: 'notif',
      label: l.notif,
      icon: <BellIcon size={19} />,
      badge: null,
    },
  ].filter(Boolean)

  const rootClass = [
    'qm-dock',
    menuOpen ? 'is-open' : '',
    panel ? 'is-hidden' : '',
    scrollHidden && !menuOpen ? 'is-scroll-hidden' : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <div ref={rootRef} className={rootClass} onBlur={onDockBlur}>
        {menuOpen && (
          <div
            id="qm-dock-menu"
            className="qm-dock-menu"
            role="menu"
            aria-label={l.toggle}
            onKeyDown={onMenuKeyDown}
          >
            {items.map((it, i) => (
              <button
                key={it.key}
                type="button"
                role="menuitem"
                className={`qm-dock-item qm-dock-item-${it.key}`}
                style={{ '--i': i }}
                onClick={() => openPanel(it.key)}
              >
                <span className="qm-dock-item-label">
                  {it.label}
                  {it.badge && <span className="qm-sr-only">, {it.badge.sr}</span>}
                </span>
                <span className="qm-dock-item-icon" aria-hidden="true">
                  {it.icon}
                  {it.badge?.dot && <span className="qm-dock-item-dot" />}
                  {it.badge?.text && <span className="qm-dock-item-badge">{it.badge.text}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          ref={toggleRef}
          type="button"
          className="qm-dock-toggle"
          aria-label={menuOpen ? l.close : (unread ? `${l.toggle}, ${l.unread}` : l.toggle)}
          title={menuOpen ? l.close : l.toggle}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? 'qm-dock-menu' : undefined}
          onClick={() => setMenuOpen(o => !o)}
        >
          <span className="qm-dock-toggle-icon"><PlusIcon size={22} /></span>
          {unread && !menuOpen && <span className="qm-dock-dot" aria-hidden="true" />}
        </button>
      </div>

      {/* Əlçatanlıq — həmişə render olunur ki, tərcihlər tətbiq olunsun */}
      <AccessibilityWidget
        open={panel === 'a11y'}
        onClose={closePanel}
        onActiveCountChange={setA11yCount}
      />

      {/* Hər panelin öz Suspense sərhədi var — biri yüklənərkən o biri gizlənməsin */}
      {loaded.ai && showAI && (
        <Suspense fallback={panel === 'ai' ? <DockLoading /> : null}>
          <AIChatWidget
            open={panel === 'ai'}
            onClose={closePanel}
            onUnreadChange={setAiUnread}
          />
        </Suspense>
      )}
      {loaded.notif && (
        <Suspense fallback={panel === 'notif' ? <DockLoading /> : null}>
          <NotificationSettingsWidget
            open={panel === 'notif'}
            onClose={closePanel}
          />
        </Suspense>
      )}
    </>
  )
}
