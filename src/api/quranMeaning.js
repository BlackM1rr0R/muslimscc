// ═══════════════════════════════════════════════════════
// "Quranda məna ilə axtar" — POST /api/quran-meaning (server/quranMeaning.js)
// Cavab: { results: [{ s, a }], cached } — YALNIZ istinadlar (model mətni yoxdur).
// Ayənin mətni klientdə saytın Quran mənbəyindən gətirilir (components/quote/content → fetchAyah).
// CSRF: "X-Requested-With: fetch" (cookie göndərilmir — hesab tələb olunmur).
// ═══════════════════════════════════════════════════════
import { apiFetch } from './http'

export const QUERY_MAX = 200

/** → Promise<[{ s, a }]>; xəta: ApiError (status, code) və ya TypeError (şəbəkə) */
export async function searchQuranMeaning(q, lang, signal) {
  const data = await apiFetch('/api/quran-meaning', {
    method: 'POST',
    body: { q: String(q || '').slice(0, QUERY_MAX), lang },
    headers: { 'X-Requested-With': 'fetch' },
    signal,
  })
  const list = Array.isArray(data?.results) ? data.results : []
  // Server yoxlayıb; klient də yalnız düzgün formanı götürür (köhnə / qəribə cavab sınmasın)
  return list
    .filter((r) => r && Number.isInteger(r.s) && Number.isInteger(r.a) && r.s >= 1 && r.s <= 114 && r.a >= 1 && r.a <= 286)
    .slice(0, 10)
    .map((r) => ({ s: r.s, a: r.a }))
}
