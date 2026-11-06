// Əlavə dilin interfeys lüğətini (src/i18n/<dil>.json) tənbəl yüklə — hər dil
// ayrıca chunk-dır, yalnız həmin dildə açılan səhifədə endirilir.
// Lüğətin quruluşu və qaydası: src/utils/uiText.js
import { setUiDict, uiDictLang } from '../utils/uiText'

const FILES = import.meta.glob('./[a-z][a-z].json')

/** Bu dilin lüğəti varmı? */
export const hasUiDict = (lang) => Boolean(FILES[`./${lang}.json`])

/**
 * Dilin lüğətini qoy (əsas dil və ya lüğəti olmayan dil — sil).
 * Qaytarır: dəyişiklik oldusa true.
 */
export async function applyUiDict(lang) {
  const want = hasUiDict(lang) ? lang : null
  if (uiDictLang() === want) return false
  if (!want) { setUiDict(null); return true }
  try {
    const m = await FILES[`./${want}.json`]()
    setUiDict(want, m.default || m)
  } catch {
    // Chunk yüklənmədi (şəbəkə) — interfeys ingiliscə qalır
    setUiDict(null)
  }
  return true
}
