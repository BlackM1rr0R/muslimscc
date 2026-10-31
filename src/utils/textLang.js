// Mənbə adlarının (kitab, fətva, sayt başlığı) dilini əlifbadan təxmin et —
// mənbə adı orijinal dilində yazılır (məs. ingiliscə fətva başlığı rus
// səhifəsində). lang atributu ekran oxuyucusu üçün düzgün tələffüz verir və
// dil yoxlaması (tests/e2e/routes.spec.js) onu başqa dil kimi tanıyır.
const AR = /[؀-ۿ]/g
const CYR = /[Ѐ-ӿ]/g
const LAT = /[A-Za-zÀ-ɏəƏ]/g

/** 'ar' | 'ru' | 'az' | 'tr' | 'en' — mətnin əsas əlifbasına görə. */
export function guessLang(text) {
  const s = String(text || '')
  const ar = (s.match(AR) || []).length
  const cyr = (s.match(CYR) || []).length
  const lat = (s.match(LAT) || []).length
  if (ar >= cyr && ar >= lat && ar > 0) return 'ar'
  if (cyr >= lat && cyr > 0) return 'ru'
  if (/[əƏ]/.test(s)) return 'az'
  if (/[ğĞıİşŞ]/.test(s)) return 'tr'
  return 'en'
}
