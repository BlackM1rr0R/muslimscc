// ═══════════════════════════════════════════════════════
// SideNav — saytın bütün bölmələri (kateqoriyalar), İKİ rejimdə
//
// Sahibin qərarı (#7, #5-i dar ekran üçün əvəz edir): "Mobildə Bölmələri
// YUXARIDA burger menyuya köçür, aşağı zolağı sil — aşağı hissə olmasın".
//
//   <SideNav mode="rail"  currentPage setPage />
//       ≥1024px: başlığın altında həmişə açıq yan panel (App.jsx-in
//       qabığında, sol sütun; ərəbcədə sağ sütun). Başlığın altına
//       bərkidilib, öz daxili sürüşməsi var. <1024px-də CSS ilə gizlənir.
//       (Bu rejim #5-dən bəri DƏYİŞMƏYİB.)
//
//   <SideNav mode="drawer" id open onClose currentPage setPage onOpenSearch returnFocusRef />
//       <1024px: başlıqdakı ☰ düyməsi (Header.jsx) açır — SAĞDAN (ərəbcədə
//       SOLDAN) sürüşüb gələn çəkmə menyu (drawer), eni min(88vw, 360px),
//       tam hündürlük. Yuxarıda brend + ✕, axtarış sahəsi, qruplar, altda
//       "Alətlər" (AI köməkçi, əlçatanlıq, bildirişlər — dar ekranda üzən
//       düymə yoxdur) və tema + dil ayarları.
//       Arxa fon qaralır və yüngül bulanır; Esc və arxa fona klik bağlayır,
//       fokus içəridə saxlanır və bağlananda ☰-yə qayıdır, arxadakı səhifə
//       sürüşmür. Kənara doğru ÜFÜQİ çəkmə (barmaq/siçan) bağlayır:
//       80px və ya sürətli "atma"; əks tərəfə rezin müqaviməti
//       (aşağıda useDrawerSwipe). Açılış yay kimi, qruplar növbə ilə
//       yumşaq gəlir (SideNav.css) — "hərəkəti azalt" rejimində hərəkət yoxdur.
//
// Ümumi:
// • Qruplar və bəndlər src/data/navigation.js-dəki NAV_GROUPS-dan gəlir.
// • Qruplar açılıb-bağlanır; istifadəçinin seçimi localStorage
//   "qm_sidenav_groups_v2" açarında yadda qalır (try/catch). Susmaya görə
//   HAMISI açıqdır (sahibin qərarı: "hər şey açıq olsun") — istifadəçi
//   istədiyini yığa bilər, seçimi növbəti gəlişdə də qalır.
// • Bəndlər həqiqi <a href> linkləridir (Ctrl/orta klik yeni tabda açır,
//   robotlar da görür); adi klikdə SPA naviqasiyası işləyir.
// • Yuxarıdakı axtarış sahəsi GlobalSearch dialoqunu açır: onOpenSearch
//   verilməyibsə "qm-open-search" hadisəsi göndərilir (Header.jsx dinləyir).
// ═══════════════════════════════════════════════════════

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/brand'
import { NAV_GROUPS, navGroupOf } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { isOverlayEntry } from '../utils/useBackToClose'
import Icon, { BrandMark } from './Icon'
import '../styles/SideNav.css'

// Açar "v2"-dir: sahibin qərarı ilə susmaya görə BÜTÜN qruplar açıq oldu.
// Köhnə açarda (qm_sidenav_groups) yalnız bir qrup yazılmışdı — onu oxusaydıq,
// əvvəl saytda olmuş ziyarətçi yenə yığılmış menyu görərdi.
const STORAGE_KEY = 'qm_sidenav_groups_v2'
// Susmaya görə BÜTÜN qruplar açıq: ziyarətçi bölmələri bir baxışda görsün
// (yığmaq istəsə, qrup başlığına klik — seçimi yaddaşda qalır).
const DEFAULT_OPEN = NAV_GROUPS.map(g => g.key)

// Header.jsx bu hadisəni dinləyib axtarış dialoqunu açır
const OPEN_SEARCH_EVENT = 'qm-open-search'

// FloatingDock.jsx bu hadisə ilə paneli açır: detail = 'ai' | 'a11y' | 'notif'
const OPEN_DOCK_EVENT = 'qm-dock-open'

// LangContext-in dil tərcihi açarı (dəyişmir) — menyudan dil seçiləndə yazılır
const LANG_PREF_KEY = 'muslim_cc_lang'

// Qrupun açılma animasiyası (SideNav.css → .qm-sn-items-wrap) + kiçik ehtiyat
const EXPAND_MS = 320

// ── Üfüqi çəkib bağlama (useDrawerSwipe) ──
const SWIPE_SLOP = 10          // bu qədər hərəkətə qədər istiqamət bəlli deyil
const SWIPE_CLOSE_PX = 80      // bundan çox çəkmək bağlayır
const SWIPE_FLICK_PX = 24      // sürətli "atma" üçün minimum yol
const SWIPE_FLICK_SPEED = 0.5  // px/ms
const SWIPE_RUBBER_MAX = 24    // əks tərəfə (ekranın içinə) ən çox bu qədər

// Ayarlar sətrindəki dillər (Header.jsx-in dil menyusu ilə eyni sıra)
const LANG_OPTIONS = [
  { code: 'az', label: 'AZ', native: 'Azərbaycanca' },
  { code: 'en', label: 'EN', native: 'English' },
  { code: 'ru', label: 'RU', native: 'Русский' },
  { code: 'ar', label: 'AR', native: 'العربية' },
  { code: 'tr', label: 'TR', native: 'Türkçe' },
]

const SVG = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

const LABELS = {
  az: {
    sections: 'Bölmələr',
    close: 'Menyunu bağla',
    home: 'Ana səhifə',
    search: 'Saytda axtar',
    searchHint: 'Hədis, ayə, dua axtar…',
    settings: 'Görünüş və dil',
    language: 'Dil',
    dark: 'Qaranlıq rejim',
    notifications: 'Bildirişlər',
    tools: 'Alətlər',
    ai: 'AI köməkçi',
    a11y: 'Əlçatanlıq',
  },
  en: {
    sections: 'Sections',
    close: 'Close menu',
    home: 'Home',
    search: 'Search the site',
    searchHint: 'Search hadith, verses, du’as…',
    settings: 'Appearance and language',
    language: 'Language',
    dark: 'Dark mode',
    notifications: 'Notifications',
    tools: 'Tools',
    ai: 'AI assistant',
    a11y: 'Accessibility',
  },
  ru: {
    sections: 'Разделы',
    close: 'Закрыть меню',
    home: 'Главная',
    search: 'Поиск по сайту',
    searchHint: 'Хадисы, аяты, дуа…',
    settings: 'Оформление и язык',
    language: 'Язык',
    dark: 'Тёмная тема',
    notifications: 'Уведомления',
    tools: 'Инструменты',
    ai: 'ИИ-помощник',
    a11y: 'Доступность',
  },
  ar: {
    sections: 'الأقسام',
    close: 'إغلاق القائمة',
    home: 'الرئيسية',
    search: 'البحث في الموقع',
    searchHint: 'ابحث عن حديث أو آية أو دعاء…',
    settings: 'المظهر واللغة',
    language: 'اللغة',
    dark: 'الوضع الداكن',
    notifications: 'الإشعارات',
    tools: 'الأدوات',
    ai: 'المساعد الذكي',
    a11y: 'إمكانية الوصول',
  },
  tr: {
    sections: 'Bölümler',
    close: 'Menüyü kapat',
    home: 'Ana sayfa',
    search: 'Sitede ara',
    searchHint: 'Hadis, ayet, dua ara…',
    settings: 'Görünüm ve dil',
    language: 'Dil',
    dark: 'Karanlık mod',
    notifications: 'Bildirimler',
    tools: 'Araçlar',
    ai: 'Yapay zekâ',
    a11y: 'Erişilebilirlik',
  },
}

// Qısayol işarəsi: Mac-da ⌘, digərlərində Ctrl
const IS_MAC = typeof navigator !== 'undefined' &&
  /mac|iphone|ipad/i.test(navigator.userAgentData?.platform || navigator.platform || '')

// Menyu daxilində fokuslana bilən elementlər (bağlı qrupdakılar isVisible ilə süzülür)
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Yadda saxlanmış açıq qrupları oxu. Yoxdursa — null (default işlənəcək). */
function readStoredGroups() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return null
    const known = new Set(NAV_GROUPS.map(g => g.key))
    // 2026-10: "Məscid" qrupu (mosque) "Əsas" (main) oldu — açıq vəziyyəti keçsin
    return arr.map(k => (k === 'mosque' ? 'main' : k)).filter(k => known.has(k))
  } catch {
    return null
  }
}

function writeStoredGroups(keys) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
  } catch {
    /* gizli rejim / bloklanmış yaddaş — sadəcə yadda saxlamırıq */
  }
}

/** Element həqiqətən görünür və fokuslana biləndirmi? (bağlı qrupdakılar yox) */
function isVisible(el) {
  if (!el) return false
  const style = window.getComputedStyle(el)
  return style.visibility !== 'hidden' && style.display !== 'none' && el.getClientRects().length > 0
}

/** Adi sol klikdirmi? (Ctrl/⌘/orta klik — brauzer linki yeni tabda açsın) */
function isPlainClick(e) {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

/**
 * Cari səhifənin sətri görünmürsə, onu sürüşən qutunun ortasına gətir.
 * scrollIntoView işlədilmir — o, bütün pəncərəni də sürüşdürə bilər.
 */
function revealCurrent(box) {
  const cur = box?.querySelector('.qm-sn-item.is-current')
  if (!cur) return
  const b = box.getBoundingClientRect()
  const r = cur.getBoundingClientRect()
  if (r.top >= b.top && r.bottom <= b.bottom) return
  box.scrollTop += (r.top - b.top) - (b.height - r.height) / 2
}

/**
 * useDrawerSwipe — çəkmə menyunu KƏNARA doğru üfüqi çəkib bağlamaq.
 *
 * • Pointer Events (barmaq, siçan, qələm). Panelin touch-action: pan-y
 *   dəyəri var (SideNav.css): şaquli sürüşməni brauzer özü edir, üfüqi
 *   hərəkət isə bura gəlir. İlk 10px-də istiqamət müəyyənləşir — şaquli
 *   çıxsa, çəkmə başlamır (siyahı adi qaydada sürüşür).
 * • Kənara (LTR sağa, RTL sola) barmağı birbaşa izləyir; əks tərəfə
 *   "rezin" müqaviməti (kök qanunu, ən çox 24px).
 * • 80px-dən çox və ya sürətli "atma" (≥ 0.5 px/ms, ≥ 24px) bağlayır;
 *   az çəkiləndə panel yay kimi yerinə qayıdır (CSS keçidi).
 * • Çəkmə irəlilədikcə kök elementə --drawer-drag (0…1) yazılır — arxa fon
 *   onunla solğunlaşır. Yalnız transform (layout yoxdur).
 * • Linkin/düymənin üstündən başlanan çəkmədən sonra gələn klik udulur —
 *   ziyarətçi təsadüfən başqa səhifəyə keçmir (yalnız buraxılışdan sonrakı
 *   qısa an ərzində; sonrakı kliklər adi qaydada işləyir).
 */
function useDrawerSwipe(panelRef, onClose, rtl) {
  const stateRef = useRef(null)
  const suppressClickRef = useRef(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const rtlRef = useRef(rtl)
  rtlRef.current = rtl

  return useMemo(() => {
    const rootOf = (panel) => panel?.parentElement
    const setProgress = (panel, p) => rootOf(panel)?.style.setProperty('--drawer-drag', String(p))

    const onPointerDown = (e) => {
      suppressClickRef.current = false
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if (e.target.closest?.('input, textarea, select')) return
      const panel = panelRef.current
      if (!panel) return
      stateRef.current = {
        id: e.pointerId,
        el: e.currentTarget,
        x0: e.clientX, y0: e.clientY,
        dx: 0, active: false,
        lastX: e.clientX, lastT: performance.now(), v: 0,
        w: panel.getBoundingClientRect().width || 1,
      }
    }

    const onPointerMove = (e) => {
      const s = stateRef.current
      if (!s || s.id !== e.pointerId) return
      const panel = panelRef.current
      if (!panel) return
      const sign = rtlRef.current ? -1 : 1   // bağlanma istiqaməti: LTR +x, RTL −x
      const rawX = e.clientX - s.x0
      const rawY = e.clientY - s.y0

      if (!s.active) {
        if (Math.abs(rawX) < SWIPE_SLOP && Math.abs(rawY) < SWIPE_SLOP) return
        // Şaquli niyyət — bu toxunuş siyahını sürüşdürür, çəkmə deyil
        if (Math.abs(rawY) >= Math.abs(rawX)) {
          stateRef.current = null
          return
        }
        s.active = true
        suppressClickRef.current = true
        try { s.el.setPointerCapture(e.pointerId) } catch { /* köhnə brauzer */ }
        panel.style.transition = 'none'
        rootOf(panel)?.classList.add('is-dragging')
      }

      const d = rawX * sign
      s.dx = d >= 0 ? d : -Math.min(SWIPE_RUBBER_MAX, Math.sqrt(-d) * 2.2)
      const now = performance.now()
      const dt = Math.max(1, now - s.lastT)
      s.v = ((e.clientX - s.lastX) * sign) / dt
      s.lastX = e.clientX
      s.lastT = now
      panel.style.transform = `translate3d(${s.dx * sign}px, 0, 0)`
      setProgress(panel, Math.max(0, Math.min(1, s.dx / s.w)))
    }

    const onPointerEnd = (e) => {
      const s = stateRef.current
      if (!s || s.id !== e.pointerId) return
      stateRef.current = null
      if (!s.active) return
      // Klik (əgər gələcəksə) buraxılışdan dərhal sonra gəlir; toxunuşla çəkmədə
      // isə heç gəlmir — bayraq qısa müddətdən sonra söndürülür ki, növbəti
      // (məs. klaviatura ilə) klik udulmasın
      window.setTimeout(() => { suppressClickRef.current = false }, 250)
      const panel = panelRef.current
      if (!panel) return
      panel.style.transition = ''
      rootOf(panel)?.classList.remove('is-dragging')
      setProgress(panel, 0)
      const shouldClose = e.type !== 'pointercancel' &&
        (s.dx > SWIPE_CLOSE_PX || (s.dx > SWIPE_FLICK_PX && s.v > SWIPE_FLICK_SPEED))
      if (shouldClose) {
        closeRef.current?.()
        // "is-open" götürüləndən sonra inline transform silinir — panel
        // olduğu yerdən kənara sürüşüb gedir (əvvəlcə geri sıçramır)
        requestAnimationFrame(() => { panel.style.transform = '' })
      } else {
        panel.style.transform = ''
      }
    }

    // Çəkmədən sonra gələn klik (link/düymə üstündə buraxılıbsa) udulur
    const onClickCapture = (e) => {
      if (!suppressClickRef.current) return
      suppressClickRef.current = false
      e.preventDefault()
      e.stopPropagation()
    }

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onClickCapture,
      // Siçanla linki çəkəndə brauzerin öz "drag & drop"-u çəkməni kəsməsin
      onDragStart: (e) => e.preventDefault(),
    }
  }, [panelRef])
}

// "Alətlər" sətrinin ikonları (üzən düymənin menyusundakılarla eyni forma)
function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3.5 L17.9 13.6 L28 16 L17.9 18.4 L16 28.5 L14.1 18.4 L4 16 L14.1 13.6 Z" fill="currentColor" />
      <path d="M24.5 5.5 L25.3 8.2 L28 9 L25.3 9.8 L24.5 12.5 L23.7 9.8 L21 9 L23.7 8.2 Z" fill="currentColor" opacity="0.85" />
    </svg>
  )
}

function A11yIcon() {
  return (
    <svg {...SVG}>
      <circle cx="12" cy="4.5" r="1.8" />
      <path d="M5 8.5l7 1.5 7-1.5M12 10v4.5M12 14.5l-3.2 6M12 14.5l3.2 6" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg {...SVG}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="qm-sn-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  )
}

export default function SideNav({ mode = 'drawer', id, open = false, onClose, currentPage, setPage, onOpenSearch, returnFocusRef }) {
  const isRail = mode === 'rail'
  const { lang, setLang, dark, toggleDark } = useLang()
  const routerNavigate = useNavigate()
  const l = LABELS[lang] || LABELS.az
  const isRtl = lang === 'ar'
  const currentGroup = navGroupOf(currentPage)

  // Açıq qruplar: yadda saxlanmış seçim (yoxdursa hamısı) + cari səhifənin qrupu
  const [expanded, setExpanded] = useState(() => {
    const set = new Set(readStoredGroups() ?? DEFAULT_OPEN)
    if (currentGroup) set.add(currentGroup)
    return set
  })

  // Menyu: vizual açıq vəziyyət bir kadr gecikir ki, ilk mount-da da
  // (open=true ilə) kənardan sürüşüb gəlmə animasiyası görünsün
  const [shown, setShown] = useState(false)

  const panelRef = useRef(null)
  const bodyRef = useRef(null)
  const closeBtnRef = useRef(null)
  const triggerRef = useRef(null)        // menyunu açan element (☰) — fokus ora qayıdır
  const skipRestoreRef = useRef(false)   // axtarışa / alətlərə keçəndə fokusu qaytarma
  const wasOpenRef = useRef(false)

  // ── Səhifə dəyişəndə onun qrupu açılsın və sətri görünsün ──
  // (istifadəçinin öz seçimi deyil — yaddaşa yazılmır)
  useEffect(() => {
    if (currentGroup) {
      setExpanded(prev => (prev.has(currentGroup) ? prev : new Set(prev).add(currentGroup)))
    }
    if (!isRail) return undefined
    const t = window.setTimeout(() => revealCurrent(bodyRef.current), EXPAND_MS)
    return () => window.clearTimeout(t)
  }, [currentGroup, currentPage, isRail])

  // ── Yan panel: cari sətrin qızılı göstəricisi SÜRÜŞÜR ──
  // Bir element (.qm-sn-ind) sürüşən qutunun içində cari sətrin hündürlüyünün
  // ortasına translateY ilə gedir (yalnız transform). Qrup açılıb-bağlananda
  // sətirlər yerini dəyişir — animasiya bitəndə (EXPAND_MS) yenidən ölçülür.
  // Cari səhifə bağlı qrupdadırsa və ya paneldə yoxdursa — göstərici solur.
  const [ind, setInd] = useState({ y: 0, on: false, instant: true })
  useLayoutEffect(() => {
    if (!isRail) return undefined
    const measure = () => {
      const box = bodyRef.current
      const cur = box?.querySelector('.qm-sn-group.is-expanded .qm-sn-item.is-current')
      if (!cur || !cur.offsetHeight) { setInd(p => (p.on ? { ...p, on: false } : p)); return }
      // Qutunun məzmununa nisbətən (sürüşmə də nəzərə alınır)
      const b = box.getBoundingClientRect()
      const r = cur.getBoundingClientRect()
      const y = Math.round(r.top - b.top + box.scrollTop + r.height / 2)
      setInd(p => (p.y === y && p.on ? p : { y, on: true, instant: !p.on }))
    }
    measure()
    // qrupun açılma animasiyası və panelin ilk giriş animasiyası bitəndə
    const t1 = window.setTimeout(measure, EXPAND_MS)
    const t2 = window.setTimeout(measure, 900)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [isRail, currentPage, expanded, lang])
  useEffect(() => {
    if (!ind.instant || !ind.on) return undefined
    const r = requestAnimationFrame(() => setInd(p => ({ ...p, instant: false })))
    return () => cancelAnimationFrame(r)
  }, [ind.instant, ind.on])

  // ── Menyu: açılış / bağlanış — animasiya, fokus, scroll kilidi ──
  useEffect(() => {
    if (isRail) return undefined
    if (!open) {
      setShown(false)
      if (wasOpenRef.current) {
        wasOpenRef.current = false
        const trigger = triggerRef.current
        triggerRef.current = null
        if (!skipRestoreRef.current && trigger && document.contains(trigger) && typeof trigger.focus === 'function') {
          trigger.focus({ preventScroll: true })
        }
        skipRestoreRef.current = false
      }
      return undefined
    }

    wasOpenRef.current = true
    // Fokus ☰-yə qayıtsın (Safari toxunuşda düyməni fokuslamır — ona görə ref üstündür)
    const active = document.activeElement
    if (returnFocusRef?.current) {
      triggerRef.current = returnFocusRef.current
    } else if (active && active !== document.body && !panelRef.current?.contains(active)) {
      triggerRef.current = active
    }

    // Cari səhifənin qrupu açıq olsun (əvvəl bağlanmış olsa belə)
    if (currentGroup) {
      setExpanded(prev => (prev.has(currentGroup) ? prev : new Set(prev).add(currentGroup)))
    }

    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShown(true))
    })

    // Arxadakı səhifə sürüşməsin. Kilid <html>-dədir, body-də YOX:
    // globals.css-də html { overflow-x: clip } var, ona görə body-nin
    // overflow-u pəncərəyə ötürülmür — body.style.overflow='hidden' səhifəni
    // kilidləmirdi (təkər, trackpad, arxa fonda barmaq yenə sürüşdürürdü),
    // üstəlik body-ni sürüşən qaba çevirib yapışqan (sticky) panelləri yerindən
    // qoparırdı. <html>-in overflow-u isə birbaşa pəncərəyə keçir.
    // Scrollbar enini kompensasiya edirik ki, səhifə tullanmasın; eyni en
    // --qm-scroll-lock-gap dəyişəninə də yazılır — sabit başlıq onu oxuyur.
    // (hooks/useScrollDirection kilidi html.style.overflow ilə tanıyır.)
    const body = document.body
    const root = document.documentElement
    const prevRootOverflow = root.style.overflow
    const prevPaddingRight = body.style.paddingRight
    const scrollbar = window.innerWidth - root.clientWidth
    root.style.overflow = 'hidden'
    if (scrollbar > 0) {
      body.style.paddingRight = `${scrollbar}px`
      root.style.setProperty('--qm-scroll-lock-gap', `${scrollbar}px`)
    }

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      root.style.overflow = prevRootOverflow
      body.style.paddingRight = prevPaddingRight
      root.style.removeProperty('--qm-scroll-lock-gap')
    }
    // currentGroup yalnız açılış anında lazımdır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isRail])

  // Menyu görünən kimi fokus "bağla" düyməsinə keçir, cari səhifə görünən yerə gəlir
  useEffect(() => {
    if (isRail || !shown) return undefined
    closeBtnRef.current?.focus({ preventScroll: true })
    const t = window.setTimeout(() => revealCurrent(bodyRef.current), EXPAND_MS)
    return () => window.clearTimeout(t)
  }, [shown, isRail])

  // ── Klaviatura (menyu): Esc bağlayır, Tab menyu daxilində dövr edir ──
  useEffect(() => {
    if (isRail || !open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(isVisible)
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const activeEl = document.activeElement
      const inside = panelRef.current.contains(activeEl)
      if (e.shiftKey && (activeEl === first || !inside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (activeEl === last || !inside)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, isRail])

  // Qrupu aç/bağla və seçimi yadda saxla (yalnız istifadəçinin öz seçimi yazılır)
  const toggleGroup = (key) => {
    const next = new Set(expanded)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    writeStoredGroups([...next])
    setExpanded(next)
  }

  const onItemClick = (e, key) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    setPage?.(key)
    if (!isRail) onClose?.()
  }

  // Menyunu bağlamazdan əvvəl fokusu açan düyməyə veririk ki, növbəti dialoq
  // (axtarış, bildiriş ayarları) "əvvəlki element" kimi gizli menyunu yox,
  // həmin düyməni yadda saxlasın; menyunun öz fokus bərpası isə atlanır.
  const handOffFocus = () => {
    const trigger = triggerRef.current
    if (trigger && document.contains(trigger) && typeof trigger.focus === 'function') {
      trigger.focus({ preventScroll: true })
    }
    skipRestoreRef.current = true
    onClose?.()
  }

  const openSearch = () => {
    if (!isRail) handOffFocus()
    if (onOpenSearch) onOpenSearch()
    else window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))
  }

  // Alətlər: AI köməkçi, əlçatanlıq, bildiriş ayarları — panelləri FloatingDock açır
  const openTool = (key) => {
    handOffFocus()
    window.dispatchEvent(new CustomEvent(OPEN_DOCK_EVENT, { detail: key }))
  }

  // Dil seçimi. Menyu açıqdırsa ünvan "replace" ilə dəyişir: menyunun tarixçə
  // girişi (utils/useBackToClose) yeni dilin ünvanı ilə əvəzlənir, menyu isə
  // girişini yenidən qoyur — Geri əvvəlcə menyunu bağlayır.
  const pickLang = (code) => {
    if (code === lang) return
    if (!isRail && isOverlayEntry()) {
      try { window.localStorage.setItem(LANG_PREF_KEY, code) } catch { /* yaddaş bağlıdır */ }
      routerNavigate(pathFor(currentPage, code), { replace: true })
      return
    }
    setLang?.(code)
  }

  // ── Kənara üfüqi çəkib bağlama (yalnız menyu) ──
  const swipeProps = useDrawerSwipe(panelRef, onClose, isRtl)

  // ── Qruplar (hər iki rejimdə eyni) ──
  // --gi (qrupun sırası) hər iki rejimə verilir: menyuda da, yan paneldə də
  // qruplar növbə ilə yumşaq görünür (SideNav.css).
  const GroupHeading = isRail ? 'div' : 'h2'
  const groups = NAV_GROUPS.map((group, gi) => {
    const isOpen = expanded.has(group.key)
    const hasCurrent = group.items.some(it => it.key === currentPage)
    const listId = `qm-sn-${mode}-${group.key}`
    const groupLabel = group.label[lang] || group.label.az || group.label.en
    return (
      <div
        key={group.key}
        className={`qm-sn-group${isOpen ? ' is-expanded' : ''}${hasCurrent ? ' has-current' : ''}`}
        style={{ '--gi': gi }}
      >
        <GroupHeading className="qm-sn-group-h">
          <button
            type="button"
            className="qm-sn-group-btn"
            aria-expanded={isOpen}
            aria-controls={listId}
            onClick={() => toggleGroup(group.key)}
          >
            <span className="qm-sn-group-label">{groupLabel}</span>
            {hasCurrent && !isOpen && <span className="qm-sn-group-dot" aria-hidden="true" />}
            <svg className="qm-sn-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </GroupHeading>
        <div className="qm-sn-items-wrap" id={listId}>
          <ul className="qm-sn-items" aria-label={groupLabel}>
            {group.items.map(item => {
              const isCurrent = item.key === currentPage
              const label = item.label[lang] || item.label.az || item.label.en
              return (
                <li key={item.key}>
                  <a
                    href={pathFor(item.key, lang)}
                    className={`qm-sn-item${isCurrent ? ' is-current' : ''}`}
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={(e) => onItemClick(e, item.key)}
                  >
                    {/* Xətti SVG ikon (Icon.jsx); ikon yoxdursa emoji ehtiyatı */}
                    <span className="qm-sn-item-icon" aria-hidden="true">
                      <Icon name={item.key} size={18} fallback={item.icon} />
                    </span>
                    <span className="qm-sn-item-label">{label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    )
  })

  // ═══ Yan panel (≥1024px) ═══
  if (isRail) {
    return (
      <nav className="qm-sn qm-sn--rail" aria-label={l.sections} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="qm-sn-search-wrap">
          {/* Görünən mətn düymənin adıdır (səslə idarədə "axtar" deyən tapsın) */}
          <button
            type="button"
            className="qm-sn-search"
            onClick={openSearch}
            aria-haspopup="dialog"
            aria-keyshortcuts="Control+K Meta+K /"
          >
            <SearchIcon />
            <span className="qm-sn-search-text">{l.search}</span>
            <kbd className="qm-sn-kbd" aria-hidden="true">{IS_MAC ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
        </div>
        <div className={`qm-sn-body${ind.on ? ' has-ind' : ''}`} ref={bodyRef}>
          <span
            className={`qm-sn-ind${ind.on ? ' is-on' : ''}${ind.instant ? ' is-instant' : ''}`}
            style={{ transform: `translate3d(0, ${ind.y}px, 0)` }}
            aria-hidden="true"
          />
          {groups}
        </div>
      </nav>
    )
  }

  // ═══ Kənardan sürüşüb gələn çəkmə menyu (<1024px) ═══
  const visible = open && shown

  // Brend adı domen kimi: "Muslims" + vurğulu ".cc" (başlıqdakı loqo kimi)
  const brand = brandName(lang)
  const brandSplit = brand.lastIndexOf('.')
  const brandMain = brandSplit > 0 ? brand.slice(0, brandSplit) : brand
  const brandAccent = brandSplit > 0 ? brand.slice(brandSplit) : ''

  return (
    <div
      className={`qm-sn qm-sn--drawer${visible ? ' is-open' : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="qm-sn-backdrop" onClick={() => onClose?.()} aria-hidden="true" />

      <div
        ref={panelRef}
        id={id}
        className="qm-sn-panel"
        role="dialog"
        aria-modal="true"
        aria-label={l.sections}
        {...swipeProps}
      >
        {/* Daxili qab: alçaq ekranda (telefon üfüqi) sürüşən məhz budur —
            panelin özü sürüşən konteyner olmur (SideNav.css → .qm-sn-inner) */}
        <div className="qm-sn-inner">
          {/* ── Yuxarı sətir: brend (ana səhifəyə) + ✕ (başlıqdakı ☰-nin yerində) ── */}
          <div className="qm-sn-head">
            <a
              className="qm-sn-brand"
              href={pathFor('home', lang)}
              onClick={(e) => onItemClick(e, 'home')}
              aria-label={`${brand} — ${l.home}`}
            >
              <span className="qm-sn-brand-mark" aria-hidden="true">
                <BrandMark size={32} />
              </span>
              <span className="qm-sn-brand-name">
                {brandMain}
                {brandAccent && <span className="qm-sn-brand-accent">{brandAccent}</span>}
              </span>
            </a>
            <button
              ref={closeBtnRef}
              type="button"
              className="qm-sn-close"
              onClick={() => onClose?.()}
              aria-label={l.close}
            >
              {/* Başlıqdakı ☰ ilə eyni üç xətt, eyni yerdə: panel yerinə çatanda
                  ☰ yumşaq şəkildə ✕-ə çevrilir, bağlananda geri ☰ olur
                  (panel başlığın ☰ düyməsini örtür — keçid burada görünür) */}
              <span className="qm-sn-x" aria-hidden="true">
                <span className="qm-sn-x-line" />
                <span className="qm-sn-x-line" />
                <span className="qm-sn-x-line" />
              </span>
            </button>
          </div>

          {/* ── Axtarış (GlobalSearch dialoqunu açır) ── */}
          <div className="qm-sn-search-wrap">
            <button type="button" className="qm-sn-search" onClick={openSearch} aria-haspopup="dialog">
              <SearchIcon />
              <span className="qm-sn-search-text">{l.searchHint}</span>
            </button>
          </div>

          {/* ── Qruplar ── */}
          <nav className="qm-sn-body" ref={bodyRef} aria-label={l.sections}>
            {groups}
          </nav>

          {/* ── Alt hissə: alətlər və ayarlar (tema + dil) ── */}
          <div className="qm-sn-foot">
            {/* Alətlər — dar ekranda üzən düymə yoxdur, onun işini bunlar görür */}
            <div className="qm-sn-tools" role="group" aria-label={l.tools}>
              {currentPage !== 'aichat' && (
                <button type="button" className="qm-sn-tool" onClick={() => openTool('ai')} aria-haspopup="dialog">
                  <span className="qm-sn-tool-icon"><SparkleIcon /></span>
                  <span className="qm-sn-tool-label">{l.ai}</span>
                </button>
              )}
              <button type="button" className="qm-sn-tool" onClick={() => openTool('a11y')} aria-haspopup="dialog">
                <span className="qm-sn-tool-icon"><A11yIcon /></span>
                <span className="qm-sn-tool-label">{l.a11y}</span>
              </button>
              <button type="button" className="qm-sn-tool" onClick={() => openTool('notif')} aria-haspopup="dialog">
                <span className="qm-sn-tool-icon"><BellIcon /></span>
                <span className="qm-sn-tool-label">{l.notifications}</span>
              </button>
            </div>
            <div className="qm-sn-settings" role="group" aria-label={l.settings}>
              <button
                type="button"
                className="qm-sn-theme"
                onClick={() => toggleDark?.()}
                aria-pressed={Boolean(dark)}
                aria-label={l.dark}
              >
                {dark ? (
                  <svg {...SVG}>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
                  </svg>
                ) : (
                  <svg {...SVG}>
                    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
                  </svg>
                )}
              </button>
              <div className="qm-sn-langs" role="group" aria-label={l.language}>
                {LANG_OPTIONS.map(x => {
                  const current = x.code === lang
                  return (
                    <button
                      key={x.code}
                      type="button"
                      className={`qm-sn-lang${current ? ' is-current' : ''}`}
                      onClick={() => pickLang(x.code)}
                      aria-pressed={current}
                      aria-label={x.native}
                      lang={x.code}
                    >
                      {x.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
