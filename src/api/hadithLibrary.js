// ═══════════════════════════════════════════════════════
// Hədis kitabxanası — fawazahmed0/hadith-api (Unlicense)
//
// Fayllar jsDelivr CDN-dən (CORS: *), bölmə-bölmə yüklənir — heç vaxt
// bütöv kitab (bəziləri 10+ MB) yüklənmir:
//   editions/<nəşr>/sections/<bölmə>.min.json
//   nəşr = <dil prefiksi>-<kitab>, məs. ara-bukhari, eng-bukhari, rus-muslim
// Cavab: { metadata: { name, section, section_detail }, hadiths: [
//   { hadithnumber, arabicnumber, text, grades: [{ name, grade }], reference } ] }
// CDN əlçatmazdırsa — müəllifin tövsiyə etdiyi ehtiyat ünvan (raw.githubusercontent).
//
// Keş: yaddaşda (Map) + Cache Storage ("hadith-lib-v1") — təkrar açılışda
// və oflayn rejimdə şəbəkəsiz işləyir. Cache API yoxdursa sadəcə şəbəkə.
// Mətn və dərəcələr OLDUĞU KİMİ qaytarılır — heç nə dəyişmir/hesablanmır.
// ═══════════════════════════════════════════════════════

const BASES = [
  'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1',
  'https://raw.githubusercontent.com/fawazahmed0/hadith-api/1',
]
const CACHE = 'hadith-lib-v1'
const memory = new Map()

export const sectionUrl = (edition, section, base = BASES[0]) =>
  `${base}/editions/${edition}/sections/${section}.min.json`

async function fromCache(url) {
  try {
    if (typeof caches === 'undefined') return null
    const c = await caches.open(CACHE)
    const r = await c.match(url)
    return r ? await r.json() : null
  } catch { return null }
}
async function toCache(url, data) {
  try {
    if (typeof caches === 'undefined') return
    const c = await caches.open(CACHE)
    await c.put(url, new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }))
  } catch { /* yaddaş dolu və ya bağlıdır */ }
}

function valid(data) {
  return data && Array.isArray(data.hadiths)
}

/**
 * Bir nəşrin bir bölməsi. Uğursuz olsa Error atır (err.offline — şəbəkə yoxdur).
 * @param {string} edition  məs. 'ara-bukhari'
 * @param {number} section
 * @param {AbortSignal} [signal]
 */
export async function fetchSection(edition, section, signal) {
  const key = `${edition}/${section}`
  if (memory.has(key)) return memory.get(key)
  const primary = sectionUrl(edition, section)
  const cached = await fromCache(primary)
  if (valid(cached)) { memory.set(key, cached); return cached }

  let lastErr = null
  for (const base of BASES) {
    try {
      const res = await fetch(sectionUrl(edition, section, base), { signal })
      if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue }
      const data = await res.json()
      if (!valid(data)) { lastErr = new Error('bad data'); continue }
      memory.set(key, data)
      toCache(primary, data)
      return data
    } catch (e) {
      if (e?.name === 'AbortError') throw e
      lastErr = e
    }
  }
  const err = lastErr || new Error('fetch failed')
  err.offline = typeof navigator !== 'undefined' && navigator.onLine === false
  throw err
}

/**
 * Ərəbcə mətn + (varsa) tərcümə — hədis nömrəsinə görə birləşdirilir.
 * Tərcümə yüklənməsə ərəbcə yenə göstərilir (trError=true).
 * Qaytarır: { hadiths: [{ n, an, ar, tr, grades }], trError }
 */
export async function fetchSectionPair(book, section, trCode, signal) {
  const [arRes, trRes] = await Promise.allSettled([
    fetchSection(`ara-${book}`, section, signal),
    trCode ? fetchSection(`${trCode}-${book}`, section, signal) : Promise.resolve(null),
  ])
  if (arRes.status === 'rejected') throw arRes.reason
  const trData = trRes.status === 'fulfilled' ? trRes.value : null
  const trError = trRes.status === 'rejected' && trRes.reason?.name !== 'AbortError'
  const trMap = new Map((trData?.hadiths || []).map(h => [String(h.hadithnumber), h]))
  const hadiths = arRes.value.hadiths.map((h) => {
    const t = trMap.get(String(h.hadithnumber))
    // Dərəcələr hər iki nəşrdə eynidir; ərəbcədə boşdursa tərcümədəkini götür
    const grades = (h.grades?.length ? h.grades : t?.grades) || []
    return {
      n: String(h.hadithnumber),
      an: h.arabicnumber != null ? String(h.arabicnumber) : '',
      ar: String(h.text || ''),
      tr: t ? String(t.text || '') : '',
      grades: grades.filter(g => g && g.name && g.grade && String(g.grade).trim() !== '-'),
    }
  })
  return { hadiths, trError }
}
