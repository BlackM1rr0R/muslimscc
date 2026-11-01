// Paylaşma köməkçisi — Web Share API, olmasa mətni panoya kopyalayır.
// Qaytarır: 'shared' | 'copied' | null (ləğv və ya icazə yoxdur).
export async function shareOrCopy({ title, text, url }) {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title, text, url })
      return 'shared'
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return null
  }
  try {
    await navigator.clipboard.writeText([text, url].filter(Boolean).join('\n\n'))
    return 'copied'
  } catch {
    return null
  }
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}

// localStorage — həmişə try/catch (gizli rejim, bağlı yaddaş)
export function readJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback } catch { return fallback }
}
export function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* yaddaş bağlıdır */ }
}

// Günün seçimi — yerli tarixə görə sabit indeks (gün ərzində dəyişmir)
export function dayIndex(len, date = new Date()) {
  if (!len) return 0
  const start = Date.UTC(date.getFullYear(), 0, 0)
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000)
  return (day + date.getFullYear() * 7) % len
}
