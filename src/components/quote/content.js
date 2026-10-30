// ═══════════════════════════════════════════════════════
// Sitat kartının MƏZMUNU: istinad yazılışı, ayənin API-dən gətirilməsi,
// URL parametrləri (ShareCardButton → /quotes?ayah=2:255 …)
//
// Mətnlər heç vaxt yaddaşdan yazılmır və dəyişdirilmir:
//  • sitatlar — src/data/quotes.js (+ admin Firebase sitatları)
//  • ayə — api.alquran.cloud (Quran səhifəsi ilə eyni nəşrlər)
//  • hədis — utils/hadithData.js (layihənin hədis bazası)
// ═══════════════════════════════════════════════════════
import { localizeSource } from '../../utils/sourceNames'
import { getSurahLocal } from '../../data/surahNamesAz'
import { displayAyah } from '../../utils/quranText'

// Ayə tərcüməsinin nəşri (VirtueCards / QuranPage ilə eyni; ərəbcədə yalnız ərəb mətni)
export const VERSE_EDITIONS = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet' }
export const ARABIC_EDITION = 'quran-uthmani'
const CACHE_PREFIX = 'qm_qcard_ayah_'
const TIMEOUT_MS = 15000

// Tez seçim üçün tanınmış ayələr (yalnız istinad — mətn API-dən gəlir)
export const POPULAR_AYAHS = ['2:255', '94:5', '2:286', '13:28', '65:3', '3:139', '2:152', '39:53']

const QURAN_RE = /^(?:Quran|Qurani-Kərim)\s+(\d{1,3}):(\d{1,3}(?:-\d{1,3})?)$/i

/**
 * Mənbə sətrinin kartda görünən yazılışı.
 *   az/ru/tr: "Quran 2:255" → "Bəqərə 2:255" / "Аль-Бакара 2:255" / "Bakara 2:255"
 *   en/ar:    localizeSource → "Quran 2:255" / "القرآن 2:255" (surə adı API-dən gəlmirsə)
 *   hədis:    "Buxari 8" → "Bukhari 8" …
 */
export function refLabel(source, lang, surahName = '') {
  const s = String(source || '').trim()
  if (!s) return ''
  const m = s.match(QURAN_RE)
  if (m) {
    const n = Number(m[1])
    const name = surahName || getSurahLocal(n, lang)?.name
    if (name) return `${name} ${n}:${m[2]}`
  }
  return localizeSource(s, lang)
}

/** "2:255" → { s: 2, a: 255 } və ya null (1–114 surə, 1–286 ayə). */
export function parseAyahRef(v) {
  const m = String(v || '').trim().match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/)
  if (!m) return null
  const s = Number(m[1]), a = Number(m[2])
  if (s < 1 || s > 114 || a < 1 || a > 286) return null
  return { s, a }
}

const stripSurahWord = name => String(name || '').replace(/^سُورَةُ\s+/, '')

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key)
    const d = raw ? JSON.parse(raw) : null
    return d && typeof d.ar === 'string' && d.ar ? d : null
  } catch { return null }
}
function writeCache(key, d) {
  try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(d)) } catch { /* yaddaş bağlıdır */ }
}

/**
 * Ayəni gətir: { ar, text, ref, tname }. ref — kartdakı istinad
 * ("Bəqərə 2:255"; en: "Al-Baqara 2:255"; ar: "البقرة 2:255").
 */
export async function fetchAyah(s, a, lang, signal) {
  const edition = lang === 'ar' ? '' : (VERSE_EDITIONS[lang] || VERSE_EDITIONS.en)
  const key = `${s}:${a}_${edition || 'ar'}`
  const cached = readCache(key)
  if (cached) return cached

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  const onAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const eds = edition ? `${ARABIC_EDITION},${edition}` : ARABIC_EDITION
    const r = await fetch(`https://api.alquran.cloud/v1/ayah/${s}:${a}/editions/${eds}`, { signal: ctrl.signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const json = await r.json()
    const list = Array.isArray(json?.data) ? json.data : []
    const arabic = list.find(x => x?.edition?.identifier === ARABIC_EDITION)
    const trans = edition ? list.find(x => x?.edition?.identifier === edition) : null
    if (!arabic?.text || (edition && !trans?.text)) throw new Error('bad response')
    const surah = arabic.surah || {}
    // Surə adı: az/ru/tr — yerli yazılış; en — API transliterasiyası; ar — ərəb adı
    const local = getSurahLocal(s, lang)?.name
    const name = local || (lang === 'ar' ? stripSurahWord(surah.name) : surah.englishName) || ''
    const data = {
      // 1-ci ayədə API-nin yapışdırdığı Bəsmələ təkrarı gizlənir (QuranPage ilə eyni qayda)
      ar: displayAyah(arabic.text, s, (arabic.numberInSurah || a) - 1),
      text: trans?.text || '',
      ref: name ? `${name} ${s}:${a}` : refLabel(`Quran ${s}:${a}`, lang),
      tname: trans ? (lang === 'en' ? trans.edition?.englishName : trans.edition?.name) || '' : '',
    }
    writeCache(key, data)
    return data
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/**
 * /quotes URL parametrləri (ShareCardButton):
 *   ?ayah=2:255                     — ayə (mətn API-dən)
 *   ?hadith=123                     — hədis bazasından id ilə
 *   ?text=…&src=…&ar=…              — sərbəst mətn (istinad verilməyibsə göstərilmir)
 *   &tpl=night&fmt=story            — şablon və ölçü (istəyə görə)
 */
export function readParams(search) {
  const p = new URLSearchParams(search || '')
  const cut = (v, n) => String(v || '').slice(0, n)
  return {
    ayah: parseAyahRef(p.get('ayah')),
    hadith: /^\d{1,6}$/.test(p.get('hadith') || '') ? Number(p.get('hadith')) : null,
    text: cut(p.get('text'), 1200).trim(),
    ar: cut(p.get('ar'), 1200).trim(),
    src: cut(p.get('src'), 120).trim(),
    tpl: cut(p.get('tpl'), 20),
    fmt: cut(p.get('fmt'), 20),
  }
}

/** Kartı açan ünvanın sorğu hissəsi (ShareCardButton və testlər üçün). */
export function buildQuery({ ayah, hadith, text, ar, src, tpl, fmt } = {}) {
  const p = new URLSearchParams()
  if (ayah) p.set('ayah', String(ayah))
  else if (hadith != null) p.set('hadith', String(hadith))
  else {
    if (ar) p.set('ar', String(ar).slice(0, 1200))
    if (text) p.set('text', String(text).slice(0, 1200))
    if (src) p.set('src', String(src).slice(0, 120))
  }
  if (tpl) p.set('tpl', tpl)
  if (fmt) p.set('fmt', fmt)
  const q = p.toString()
  return q ? `?${q}` : ''
}
