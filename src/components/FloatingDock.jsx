import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { useLang } from '../contexts/LangContext'
import { BRAND, tr } from '../config/brand'
import AccessibilityWidget from './AccessibilityWidget'
import { useBackToClose } from '../utils/useBackToClose'
import Icon from './Icon'
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

// ── İkonlar — saytın vahid xətti ikon dəsti (Icon.jsx, v2) ──
// Əvvəl burada ayrıca dolu SVG-lər idi; indi panellərdəki ikonlarla eynidir.

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
      icon: <Icon name="aichat" size={20} />,
      badge: unread ? { dot: true, sr: l.unread } : null,
    },
    {
      key: 'a11y',
      label: l.a11y,
      icon: <Icon name="a11y" size={21} />,
      badge: a11yCount > 0 ? { text: String(a11yCount), sr: `${a11yCount} ${l.active}` } : null,
    },
    {
      key: 'notif',
      label: l.notif,
      icon: <Icon name="bell" size={20} />,
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
                style={{ '--i': items.length - 1 - i }}  /* düyməyə ən yaxın bənd birinci qalxır */
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
          <span className="qm-dock-toggle-icon"><Icon name="plus" size={22} strokeWidth={2.2} /></span>
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
