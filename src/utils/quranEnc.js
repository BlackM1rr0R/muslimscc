// ═══════════════════════════════════════════════════════
// QuranEnc.com — Quran məna tərcümələri ensiklopediyası (API v1)
//   /api/v1/translations/list/<dil>             — tərcümələr (versiya, son yenilənmə)
//   /api/v1/translation/sura/<açar>/<surə>      — surənin tərcüməsi + haşiyələr
// CORS: Access-Control-Allow-Origin: * (yoxlanılıb) — brauzerdən birbaşa.
//
// Oxuyucuda tərcümə seçimi: standart nəşr (alquran.cloud, EDITION_MAP) dəyişmir;
// istifadəçi QuranEnc tərcüməsini seçəndə yalnız tərcümə sətri onunla əvəzlənir.
// Seçim dil üzrə localStorage-dadır (quran_translation = { az:'azeri_musayev' }).
//
// QuranEnc şərtləri (hər tərcümə səhifəsində): mətn dəyişdirilmir, naşir və
// mənbə (QuranEnc.com) göstərilir, versiya nömrəsi yazılır, həmişə son versiya
// işlədilir — mətn canlı yüklənir, versiya siyahı API-sindən yenilənir.
//
// Kataloq: siyahı API-sində olan açarlar (az/en/tr). ru və ar açarları siyahı
// API-sində (hələ) yoxdur, amma sura API-si onları verir — yoxlanılıb (2026-11):
// russian_rwwad, russian_aboadel, arabic_mokhtasar. Versiyası siyahıda yoxdursa
// göstərilmir (uydurulmur).
// ═══════════════════════════════════════════════════════

export const QURANENC_API = 'https://quranenc.com/api/v1'
export const QURANENC_SITE = 'https://quranenc.com'

// lang — oxuyucunun interfeys dili; name — həmin dildə qısa ad; title — QuranEnc-in
// rəsmi adı; version / updated (unix san.) — siyahı API-sindən (2026-11-01)
export const QURANENC_CATALOG = [
  { key: 'azeri_musayev', lang: 'az', name: 'Əli Xan Musayev', title: 'Azerbaijani Translation - Ali Khan Musayev', version: '1.0.4', updated: 1748378549 },
  { key: 'english_saheeh', lang: 'en', name: 'Saheeh International', title: 'English Translation - Noor International Center', version: '1.1.2', updated: 1750772247 },
  { key: 'english_hilali_khan', lang: 'en', name: 'Hilali & Khan', title: 'English Translation - Hilali and Khan', version: '1.1.2', updated: 1756933433 },
  { key: 'english_rwwad', lang: 'en', name: 'Rowwad Translation Center', title: 'English Translation - Rowwad Translation Center', version: '1.0.20', updated: 1792534351 },
  { key: 'russian_rwwad', lang: 'ru', name: 'Центр переводов «Руввад»', title: 'Russian Translation - Rowwad Translation Center' },
  { key: 'russian_aboadel', lang: 'ru', name: 'Абу Адель', title: 'Russian Translation - Abu Adel' },
  { key: 'arabic_mokhtasar', lang: 'ar', name: 'المختصر في تفسير القرآن الكريم', title: 'Al-Mukhtasar in Interpreting the Noble Quran' },
  { key: 'turkish_rwwad', lang: 'tr', name: 'Rowwad Tercüme Merkezi', title: 'Turkish Translation - Rowwad Translation Center', version: '1.0.4', updated: 1759071052 },
  { key: 'turkish_shaban', lang: 'tr', name: 'Şaban Piriş', title: 'Turkish Translation - Shaaban British', version: '1.1.0', updated: 1577307600 },
  { key: 'turkish_shahin', lang: 'tr', name: 'Dr. Ali Özek ve arkadaşları', title: 'Turkish Translation - Dr. Ali Ozek and others', version: '1.0.0', updated: 1495486800 },
]

export const quranEncOptions = (lang) => QURANENC_CATALOG.filter(t => t.lang === lang)
export const quranEncEntry = (key, lang) => QURANENC_CATALOG.find(t => t.key === key && (!lang || t.lang === lang)) || null
/** Tərcümənin QuranEnc-dəki səhifəsi (mənbə linki); saytın rus interfeysi yoxdur (404) */
const SITE_LANGS = ['az', 'en', 'tr', 'ar']
export const quranEncUrl = (key, sura, lang = 'en') =>
  `${QURANENC_SITE}/${SITE_LANGS.includes(lang) ? lang : 'en'}/browse/${encodeURIComponent(key)}${sura ? `/${sura}` : ''}`

// ── Seçim: dil üzrə (boş — standart nəşr) ──
const CHOICE_KEY = 'quran_translation'
export function readTranslationChoices() {
  try {
    const v = JSON.parse(localStorage.getItem(CHOICE_KEY))
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
  } catch { return {} }
}
/** Cari dil üçün etibarlı açar və ya '' (standart) */
export const translationFor = (lang, choices) => (quranEncEntry(choices?.[lang], lang) ? choices[lang] : '')
export function saveTranslationChoice(lang, key) {
  const next = { ...readTranslationChoices() }
  if (key && quranEncEntry(key, lang)) next[lang] = key
  else delete next[lang]
  try { localStorage.setItem(CHOICE_KEY, JSON.stringify(next)) } catch { /* yaddaş bağlıdır */ }
  return next
}

// ── Şəbəkə + keş (yaddaş + sessionStorage) ──
const TIMEOUT = 15000
const mem = new Map()
function cacheGet(id) {
  if (mem.has(id)) return mem.get(id)
  try {
    const raw = sessionStorage.getItem(id)
    if (raw) { const v = JSON.parse(raw); mem.set(id, v); return v }
  } catch { /* sessionStorage bağlıdır */ }
  return null
}
function cacheSet(id, v) {
  mem.set(id, v)
  try { sessionStorage.setItem(id, JSON.stringify(v)) } catch { /* yer yoxdur — yalnız yaddaşda */ }
}
async function getJSON(url, signal) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
  const onAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const r = await fetch(url, { signal: ctrl.signal })
    if (!r.ok) throw new Error(`http-${r.status}`)
    return await r.json()
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/**
 * Surənin tərcüməsi: [{ tr, fn }] (indeks = ayə − 1). Cavabda hər ayə
 * olmalıdır (total — gözlənilən ayə sayı); yoxdursa xəta → standart nəşr.
 * Mətn olduğu kimi saxlanılır (yalnız kənar boşluqlar atılır).
 */
export async function fetchQuranEncSura(key, sura, total, signal) {
  const id = `qe:v1:${key}:${sura}`
  const hit = cacheGet(id)
  if (Array.isArray(hit) && hit.length === total) return hit
  const d = await getJSON(`${QURANENC_API}/translation/sura/${encodeURIComponent(key)}/${sura}`, signal)
  const list = Array.isArray(d?.result) ? d.result : null
  if (!list) throw new Error('bad-response')
  const rows = new Array(total)
  for (const x of list) {
    const a = Number(x?.aya)
    if (Number(x?.sura) !== sura || !(a >= 1 && a <= total) || typeof x.translation !== 'string') continue
    rows[a - 1] = { tr: x.translation.trim(), fn: typeof x.footnotes === 'string' ? x.footnotes.trim() : '' }
  }
  for (let i = 0; i < total; i++) if (!rows[i] || !rows[i].tr) throw new Error('incomplete')
  cacheSet(id, rows)
  return rows
}

/**
 * Siyahı API-sindən tərcümənin son versiyası və yenilənmə tarixi. Alınmasa
 * (və ya açar siyahıda yoxdursa) — kataloqdakı məlumat. Sessiyada bir dəfə.
 */
export async function fetchQuranEncMeta(key, lang, signal) {
  const base = quranEncEntry(key, lang)
  if (!base) return null
  const id = `qe:v1:list:${lang}`
  let list = cacheGet(id)
  if (!Array.isArray(list)) {
    try {
      const d = await getJSON(`${QURANENC_API}/translations/list/${encodeURIComponent(lang)}`, signal)
      list = Array.isArray(d?.translations)
        ? d.translations.map(t => ({ key: t.key, title: t.title, version: t.version, updated: t.last_update }))
        : []
      cacheSet(id, list)
    } catch { list = [] }
  }
  const live = list.find(t => t.key === key)
  return live ? { ...base, title: live.title || base.title, version: live.version || base.version, updated: Number(live.updated) || base.updated } : base
}
