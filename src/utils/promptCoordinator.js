// ═══════════════════════════════════════════════════════
// Üzən prompt/banner koordinatoru
//
// Sayt sahibinin rəyi: ilk açılışda ekran qarışıq idi — PWA quraşdırma
// banneri, bildiriş icazəsi, elan toast-u və üzən düymələr eyni anda
// məzmunun üstünə çıxırdı. Buradakı qaydalar bunun qarşısını alır:
//
//   • Eyni anda YALNIZ BİR prompt görünür (claimPrompt / releasePrompt).
//   • İlk gəlişin ilk anlarında heç nə çıxmır — engagedMs() səhifənin
//     GÖRÜNƏN qaldığı vaxtı sayır (fon tabında keçən vaxt sayılmır).
//   • "Xahiş" tipli promptlardan (install, notif) sessiyada yalnız biri.
//   • Aşağı zolaq görünəndə <html> üzərində --bottom-inset qurulur:
//     footer aşağıdan o qədər boşluq alır (globals.css → --qm-bottom-reserve),
//     FloatingDock (≥1024px) zolağın üstünə qalxır — heç nə məzmunu örtmür.
//
// İstifadə edənlər: InstallBanner, NotificationPrompt, AnnouncementToast,
// FloatingDock. Heç bir React konteksti tələb etmir — modul səviyyəli
// vəziyyət + "qm-prompt-change" hadisəsi.
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react'

export const PROMPT_CHANGE_EVENT = 'qm-prompt-change'

// Yaddaş açarları (yeni; köhnə muslim_cc_* açarlarına toxunulmur)
const VISITS_KEY = 'muslim_cc_visit_count'            // localStorage — neçənci gəliş
const SESSION_KEY = 'muslim_cc_session_started'       // sessionStorage — sessiya başlanğıcı
const ENGAGED_KEY = 'muslim_cc_session_engaged_ms'    // sessionStorage — görünən vaxt (ms)
const LANDING_KEY = 'muslim_cc_landing_path'          // sessionStorage — ilk açılan səhifə
const NAVIGATED_KEY = 'muslim_cc_session_navigated'   // sessionStorage — başqa səhifəyə keçibmi
const ASK_KEY = 'muslim_cc_session_ask'               // sessionStorage — bu sessiyada göstərilən "xahiş"
const SHOWN_PREFIX = 'muslim_cc_prompt_shown_'        // sessionStorage — bu sessiyada göstərilib

// İki FƏRQLİ prompt arasında minimum fasilə (biri bağlanan kimi o biri çıxmasın)
const GAP_OTHER_MS = 20000
// Eyni növ promptlar arasında (məs. iki təcili elan) qısa fasilə
const GAP_SAME_MS = 1500

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

function readStore(store, key) {
  try { return window[store].getItem(key) } catch { return null }
}
function writeStore(store, key, value) {
  try { window[store].setItem(key, value) } catch { /* gizli rejim və s. */ }
}

// ── Sessiya və gəliş sayğacı ─────────────────────────
let visits = 1
let landingPath = '/'
let engagedBase = 0
let visibleSince = null
let active = null
let lastRelease = { id: null, at: 0 }

if (isBrowser) {
  if (!readStore('sessionStorage', SESSION_KEY)) {
    // Yeni sessiya = yeni gəliş
    writeStore('sessionStorage', SESSION_KEY, String(Date.now()))
    writeStore('sessionStorage', LANDING_KEY, window.location.pathname)
    visits = (Number(readStore('localStorage', VISITS_KEY)) || 0) + 1
    writeStore('localStorage', VISITS_KEY, String(visits))
  } else {
    visits = Math.max(1, Number(readStore('localStorage', VISITS_KEY)) || 1)
  }
  landingPath = readStore('sessionStorage', LANDING_KEY) || window.location.pathname
  engagedBase = Number(readStore('sessionStorage', ENGAGED_KEY)) || 0
  visibleSince = document.visibilityState === 'visible' ? Date.now() : null

  const persist = () => writeStore('sessionStorage', ENGAGED_KEY, String(engagedMs()))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (visibleSince == null) visibleSince = Date.now()
    } else if (visibleSince != null) {
      engagedBase += Date.now() - visibleSince
      visibleSince = null
      persist()
    }
  })
  window.addEventListener('pagehide', persist)
}

/** Neçənci gəlişdir (1 = ilk gəliş). */
export function visitCount() {
  return visits
}

/** Bu sessiyada səhifənin görünən qaldığı ümumi vaxt (ms). Yenidən yükləmədə davam edir. */
export function engagedMs() {
  return engagedBase + (visibleSince != null ? Date.now() - visibleSince : 0)
}

/** Ziyarətçi bu sessiyada ilk açdığı səhifədən başqa səhifəyə keçibmi? */
export function hasNavigated() {
  if (readStore('sessionStorage', NAVIGATED_KEY) === '1') return true
  if (isBrowser && window.location.pathname !== landingPath) {
    writeStore('sessionStorage', NAVIGATED_KEY, '1')
    return true
  }
  return false
}

/** Bu prompt bu sessiyada artıq göstərilibmi? */
export function wasShownThisSession(id) {
  return readStore('sessionStorage', SHOWN_PREFIX + id) === '1'
}

// ── Tək slot ─────────────────────────────────────────
function emit() {
  if (isBrowser) window.dispatchEvent(new CustomEvent(PROMPT_CHANGE_EVENT, { detail: active }))
}

/** Hazırda görünən prompt ('install' | 'notif' | 'announce' | null). */
export function getActivePrompt() {
  return active
}

/**
 * Slotu tutmağa çalış. Uğurludursa true — prompt göstərilə bilər.
 * @param {string} id
 * @param {{ask?: boolean}} opts  ask: "xahiş" tipli (sessiyada yalnız biri)
 */
export function claimPrompt(id, { ask = false } = {}) {
  if (!isBrowser) return false
  if (active === id) return true
  if (active) return false
  if (document.visibilityState !== 'visible') return false
  // Panel (AI, əlçatanlıq, bildiriş ayarları) və ya dok menyusu açıqdırsa gözlə
  if (document.body.classList.contains('panel-open')) return false
  if (document.documentElement.classList.contains('qm-dock-open')) return false
  const since = Date.now() - lastRelease.at
  if (lastRelease.id && lastRelease.id !== id && since < GAP_OTHER_MS) return false
  if (lastRelease.id === id && since < GAP_SAME_MS) return false
  if (ask) {
    const asked = readStore('sessionStorage', ASK_KEY)
    if (asked && asked !== id) return false
    writeStore('sessionStorage', ASK_KEY, id)
  }
  writeStore('sessionStorage', SHOWN_PREFIX + id, '1')
  active = id
  emit()
  return true
}

/** Slotu burax (prompt bağlandı). */
export function releasePrompt(id) {
  if (active !== id) return
  active = null
  lastRelease = { id, at: Date.now() }
  emit()
}

// ── Aşağı zolaq üçün boşluq ─────────────────────────
/**
 * Aşağıdakı zolağın hündürlüyünü <html>-ə yaz. 0 = zolaq yoxdur.
 * CSS: footer-in alt boşluğu (globals.css → --qm-bottom-reserve) və
 * FloatingDock-un bottom mövqeyi bu dəyişəni oxuyur.
 */
export function setBottomInset(px) {
  if (!isBrowser) return
  const root = document.documentElement
  if (px > 0) {
    root.style.setProperty('--bottom-inset', `${Math.ceil(px)}px`)
    root.classList.add('qm-has-bottom-bar')
  } else {
    root.style.removeProperty('--bottom-inset')
    root.classList.remove('qm-has-bottom-bar')
  }
}

// ── React hook-ları ──────────────────────────────────

/**
 * Prompt slotu üçün hook. `enabled` true olduqda hər saniyə `isEligible()`
 * yoxlanılır; uyğun olan kimi slot tutulur və `shown` true olur.
 * @returns {[boolean, () => void]} [shown, hide]
 */
export function usePromptSlot(id, isEligible, { ask = false, enabled = true } = {}) {
  const [shown, setShown] = useState(false)
  const eligibleRef = useRef(isEligible)
  eligibleRef.current = isEligible

  useEffect(() => {
    if (!enabled || shown) return undefined
    let done = false
    const tick = () => {
      if (done) return
      if (eligibleRef.current() && claimPrompt(id, { ask })) {
        done = true
        clearInterval(timer)
        setShown(true)
      }
    }
    const timer = setInterval(tick, 1000)
    tick()
    return () => { done = true; clearInterval(timer) }
  }, [id, ask, enabled, shown])

  const hide = useCallback(() => {
    setShown(false)
    releasePrompt(id)
  }, [id])

  // Komponent silinəndə slot boşalsın
  useEffect(() => () => releasePrompt(id), [id])

  return [shown, hide]
}

/**
 * Görünən aşağı zolağın hündürlüyünü ölçüb --bottom-inset-ə yazır.
 * @param {React.RefObject<HTMLElement>} ref
 * @param {boolean} visible
 */
export function useBottomInset(ref, visible) {
  useEffect(() => {
    if (!visible || !ref.current) return undefined
    const el = ref.current
    const measure = () => setBottomInset(el.offsetHeight)
    measure()
    let ro = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure)
      ro.observe(el)
    } else {
      window.addEventListener('resize', measure)
    }
    return () => {
      if (ro) ro.disconnect()
      else window.removeEventListener('resize', measure)
      setBottomInset(0)
    }
  }, [ref, visible])
}

/**
 * Avtomatik gizlətmə — siçan üstündə və ya fokus içində olanda dayanır
 * (WCAG 2.2.1: vaxt məhdudiyyəti dayandırıla bilməlidir).
 * @returns {{ onMouseEnter, onMouseLeave, onFocus, onBlur }} konteynerə yayılacaq props
 */
export function useAutoHide(active, ms, onHide) {
  const remainingRef = useRef(ms)
  const startedRef = useRef(0)
  const timerRef = useRef(null)
  const onHideRef = useRef(onHide)
  onHideRef.current = onHide

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      remainingRef.current -= Date.now() - startedRef.current
    }
  }, [])

  const start = useCallback(() => {
    if (timerRef.current) return
    startedRef.current = Date.now()
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      onHideRef.current?.()
    }, Math.max(1000, remainingRef.current))
  }, [])

  useEffect(() => {
    if (!active) return undefined
    remainingRef.current = ms
    start()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [active, ms, start])

  return {
    onMouseEnter: stop,
    onMouseLeave: start,
    onFocus: stop,
    onBlur: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) start() },
  }
}
