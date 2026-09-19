// ═══════════════════════════════════════════════════════
// useBackToClose — açıq üst qat (vərəq, axtarış) üçün "Geri" davranışı
//
// Telefonda (Android jesti, brauzerin Geri düyməsi) ziyarətçi açıq vərəqi
// və ya axtarışı Geri ilə bağlamağa öyrəşib. Əvvəl Geri arxadakı SƏHİFƏNİ
// dəyişirdi, vərəq isə açıq qalırdı.
//
// Necə işləyir:
//   • Üst qat açılanda tarixçəyə eyni ünvanlı bir giriş əlavə olunur
//     (history.state.qmOverlay = <token>). URL dəyişmir.
//   • Geri basılanda həmin giriş çıxır → popstate → üst qat bağlanır,
//     səhifə yerində qalır.
//   • Üst qat düymə ilə bağlananda öz girişi hələ üstdədirsə, history.back()
//     ilə geri götürülür — tarixçədə artıq giriş qalmır.
//   • Bir üst qat bağlanıb dərhal başqası açılırsa (vərəq → axtarış), yeni
//     üst qat köhnə girişi "miras alır" (replaceState) — back() + pushState
//     yarışı yaranmır.
//   • Üst qatdan başqa səhifəyə keçid App.jsx-də replace ilə olur
//     (isOverlayEntry) — tarixçədə köhnə səhifənin təkrarı qalmır.
//   • Açıq ikən ünvan replace ilə dəyişibsə (vərəqdən dil seçimi), giriş
//     yenidən qoyulur ki, Geri yenə əvvəlcə üst qatı bağlasın.
//
// Yalnız brauzerdə; history əlçatmazdırsa sadəcə heç nə etmir.
// ═══════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export const OVERLAY_KEY = 'qmOverlay'

let seq = 0

function readState() {
  try {
    const st = window.history.state
    return st && typeof st === 'object' ? st : {}
  } catch {
    return {}
  }
}

/** Tarixçənin cari girişi hansısa açıq üst qata aiddirmi? */
export function isOverlayEntry() {
  if (typeof window === 'undefined') return false
  return Boolean(readState()[OVERLAY_KEY])
}

/** Üst qatın girişini qoy: başqa üst qatın girişi üstdədirsə onu miras al. */
function placeEntry(token) {
  const st = readState()
  const next = { ...st, [OVERLAY_KEY]: token }
  try {
    if (st[OVERLAY_KEY]) window.history.replaceState(next, '')
    else window.history.pushState(next, '')
    return true
  } catch {
    return false
  }
}

/**
 * @param {boolean} open        üst qat açıqdırmı
 * @param {() => void} onClose  Geri basılanda çağırılır
 */
export function useBackToClose(open, onClose) {
  const location = useLocation()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const tokenRef = useRef(null)

  // Açılış: giriş qoy, Geri-ni dinlə; bağlanış: girişi geri götür
  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined
    seq += 1
    const token = `o${Date.now().toString(36)}${seq}`
    if (!placeEntry(token)) return undefined
    tokenRef.current = token

    const onPop = () => {
      // Öz girişimiz artıq üstdə deyil — Geri basıldı
      if (readState()[OVERLAY_KEY] !== token) {
        tokenRef.current = null
        onCloseRef.current?.()
      }
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      const closedByBack = tokenRef.current !== token
      tokenRef.current = null
      if (closedByBack) return
      // Eyni commit-də başqa üst qat açılıb girişi miras ala bilər —
      // ona görə yoxlamanı növbəti tapşırığa saxlayırıq
      window.setTimeout(() => {
        if (readState()[OVERLAY_KEY] === token) {
          try { window.history.back() } catch { /* tarixçə bağlıdır */ }
        }
      }, 0)
    }
  }, [open])

  // Açıq ikən ünvan replace ilə dəyişdi (məs. vərəqdən dil seçildi) —
  // girişi yenidən qoy ki, Geri əvvəlcə üst qatı bağlasın
  useEffect(() => {
    const token = tokenRef.current
    if (!open || !token) return
    if (readState()[OVERLAY_KEY] !== token) placeEntry(token)
  }, [open, location.key])
}
