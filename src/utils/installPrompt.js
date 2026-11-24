// ═══════════════════════════════════════════════════════
// PWA quraşdırma hadisəsinin tutucusu (components/InstallBanner.jsx üçün).
//
// "beforeinstallprompt" tez-tez React mount olmamışdan ƏVVƏL gəlir; modul səviyyəsində
// tutulmasa itir. PERFORMANS (2026-11-24): InstallBanner özü (UI + promptCoordinator
// istifadəsi) boş vaxtda tənbəl yüklənir, bu kiçik modul isə əsas paketdə qalır —
// hadisə yenə ilk andan tutulur. Davranış əvvəlki kimidir.
// ═══════════════════════════════════════════════════════

export const INSTALLED_KEY = 'muslim_cc_pwa_installed'      // '1' — quraşdırılıb, bir daha təklif etmə
export const INSTALLABLE_EVENT = 'qm-installable'

export function markInstalled() {
  try { localStorage.setItem(INSTALLED_KEY, '1') } catch { /* yaddaş bağlıdır */ }
}

export function isInstalled() {
  try { return localStorage.getItem(INSTALLED_KEY) === '1' } catch { return false }
}

let savedPrompt = null

/** Tutulmuş (hələ istifadə olunmamış) quraşdırma hadisəsi və ya null. */
export const getSavedPrompt = () => savedPrompt
/** Hadisə bir dəfə istifadə olunur — sonra unudulur. */
export const clearSavedPrompt = () => { savedPrompt = null }

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    savedPrompt = e
    window.dispatchEvent(new Event(INSTALLABLE_EVENT))
  })
  window.addEventListener('appinstalled', () => {
    savedPrompt = null
    markInstalled()
    window.dispatchEvent(new Event(INSTALLABLE_EVENT))
  })
}
