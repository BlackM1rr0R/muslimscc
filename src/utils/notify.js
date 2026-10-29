// ═══════════════════════════════════════════════════════
// Yerli (lokal) bildiriş göstərmək — bütün brauzerlərdə təhlükəsiz.
//
// Niyə: Android Chrome-da `new Notification()` TypeError atır ("Illegal
// constructor. Use ServiceWorkerRegistration.showNotification() instead").
// Effektdə/interval-da tutulmamış bu xəta təqvimdə bütün tətbiqi söndürür,
// namaz səhifəsində əzan səsini kəsir, bildiriş ayarlarında "sınaq" düyməsini
// səssiz qırırdı. Əvvəl service worker qeydiyyatı, yoxdursa konstruktor.
// ═══════════════════════════════════════════════════════

/** @returns {Promise<boolean>} bildiriş göstərildisə true */
export async function showLocalNotification(title, options = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.()
    if (reg?.showNotification) { await reg.showNotification(title, options); return true }
  } catch { /* SW yoxdur və ya rədd etdi — konstruktoru yoxla */ }
  try { new Notification(title, options); return true } catch { return false }
}
