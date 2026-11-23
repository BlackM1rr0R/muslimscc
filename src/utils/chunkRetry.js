// ═══════════════════════════════════════════════════════
// Tənbəl modul (chunk) yüklənmədikdə — bir dəfə avtomatik yeniləmə
//
// NƏ: deploydan sonra köhnə tabda hash-li fayl (məs. /assets/QuranPage-abc.js)
// serverdə artıq yoxdur — dinamik import() "Failed to fetch dynamically
// imported module" / "Importing a module script failed" xətası verir.
// withChunkRetry() belə xətada səhifəni BİR DƏFƏ yeniləyir (yeni index.html →
// yeni hash-lər). sessionStorage bayrağı sonsuz döngünün qarşısını alır:
// son 10 saniyədə artıq yeniləmə olubsa, xəta atılır və marşrutun
// ErrorBoundary-si (App.jsx → PageErrorBoundary) sakit xəta kartı göstərir.
// ═══════════════════════════════════════════════════════

const RELOAD_KEY = 'qm-chunk-reload-at'
const RELOAD_WINDOW = 10_000

/** Xəta dinamik modulun yüklənməməsidirmi (Chrome / Firefox / Safari / Vite mətnləri). */
export function isChunkLoadError(err) {
  const msg = String((err && (err.message || err)) || '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError|Loading (CSS )?chunk [\w-]+ failed/i.test(msg) ||
    (err && err.name === 'ChunkLoadError')
}

/** Bu tabda son RELOAD_WINDOW ms-də chunk xətası səbəbindən yeniləmə olubmu. */
function reloadedRecently() {
  try {
    const at = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
    return at > 0 && Date.now() - at < RELOAD_WINDOW
  } catch { return true } // yaddaş bağlıdır — döngü riskinə getmə
}

// Son "offline" hadisəsinin vaxtı. Bağlantı qısa müddət gedib-gələndə oflayn ikən başlamış
// import()-ların xətası bəzən navigator.onLine artıq true olandan SONRA çatır — onda bu, köhnə
// deploy deyil, sadəcə şəbəkə kəsintisidir (yeniləmə açıq təfsiri, oxucu yerini itirərdi).
const OFFLINE_GRACE = 10_000
let offlineAt = 0
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => { offlineAt = Date.now() })
}

/**
 * import() fabrikini bürü: chunk xətasında bir dəfə location.reload().
 * Yeniləmə gedərkən vəd həll olunmur (köhnə ekran qalır, xəta kartı yanıb-sönmür).
 */
export function withChunkRetry(factory) {
  return () => {
    const startedOffline = typeof navigator !== 'undefined' && navigator.onLine === false
    return factory().catch((err) => {
      if (typeof window === 'undefined' || !isChunkLoadError(err)) throw err
      // İnternet yoxdursa yeniləmə köhnə fayl problemi deyil — səhifəni yeniləmək
      // oxucunun yerini (Quran, pleyer) itirər və oflayn səhifə açar. Bağlantı
      // qayıdanda modulu sakitcə bir də yüklə.
      if (navigator.onLine === false) {
        return new Promise((resolve, reject) => {
          window.addEventListener('online', () => { factory().then(resolve, reject) }, { once: true })
        })
      }
      // Bağlantı indicə qayıdıb (import oflayn başlamışdı və ya bu arada kəsinti olub) —
      // yeniləmə yox, oflayn halındakı kimi modulu sakitcə bir də yüklə
      if (startedOffline || (offlineAt && Date.now() - offlineAt < OFFLINE_GRACE)) return factory()
      if (!reloadedRecently()) {
        try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())) } catch { /* yaddaş bağlıdır */ }
        window.location.reload()
        return new Promise(() => {})
      }
      throw err
    })
  }
}
