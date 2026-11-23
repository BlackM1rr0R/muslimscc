// ═══════════════════════════════════════════════════════
// Həftəlik ailə halqası (/family-halaqa) — ISO həftəsinə görə deterministik dəst + yerli qeyd (React-sız).
//
// Dəst saytın MÖVCUD məlumatından yığılır (burada dini mətn YOXDUR, yalnız indekslər):
//   • ayə   — data/tadabbur.js (61 ayə, ərəb mətni + tərcümə + saytın düşüncə sualı)
//   • hədis — data/nawawi40.js, YALNIZ Buxari / Müslimdə olanlar (HALAQA_HADITH_NS; mənbə testdə yoxlanılır)
//   • dərs  — data/lessons/<slug>.js-in qısa bölmələri (HALAQA_LESSONS)
//   • suallar — UI sualları (bölmənin adı ilə; hökm yoxdur), uşaq fəaliyyəti — /kids?section=…
// Eyni həftə + eyni variant → bütün cihazlarda eyni dəst. "Qarışdır" variantı (v) artırır.
//
//   family_halaqa_v1  { v:1, d:{ 'YYYY-Www': 'YYYY-MM-DD' }, s:{ 'YYYY-Www': variant } }
//     d — "bu həftə keçirdik" günü, s — bu həftə üçün seçilən variant. YALNIZ bu cihaz
//     (userBackup EXCLUDE_KEYS) — xal/say yoxdur. tests/unit/family-halaqa.test.js
// ═══════════════════════════════════════════════════════
import { validDay, isObj, safeStorage, parse, localDay } from './journeyStore'

export { safeStorage, localDay }

export const HALAQA_KEY = 'family_halaqa_v1'
export const HALAQA_EVENT = 'mcc-halaqa'
export const HALAQA_KEEP = 60          // son 60 həftənin qeydi saxlanılır
export const VARIANT_MAX = 999

// Nəvəvinin 40 hədisindən yalnız Səhih Buxari / Səhih Müslimdə olanlar (mənbə: nawawi40.js → src)
export const HALAQA_HADITH_NS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25, 26, 34, 35, 36, 37, 38, 40]

// Qısa, ailə üçün uyğun dərs bölmələri (ədəb, valideyn, tövbə, mühasəbə, əsaslar)
export const HALAQA_LESSONS = [
  { s: 'adab-al-mufrad', sec: 'gentleness' }, { s: 'birr-al-walidayn', sec: 'status' },
  { s: 'adab-al-mufrad', sec: 'speech' }, { s: 'tawbah', sec: 'door' },
  { s: 'adab-al-mufrad', sec: 'salam' }, { s: 'birr-al-walidayn', sec: 'mother' },
  { s: 'adab-al-mufrad', sec: 'mercy' }, { s: 'intro-to-islam', sec: 'allah' },
  { s: 'adab-al-mufrad', sec: 'gratitude' }, { s: 'birr-al-walidayn', sec: 'practice' },
  { s: 'adab-al-mufrad', sec: 'haya' }, { s: 'tawbah', sec: 'joy' },
  { s: 'adab-al-mufrad', sec: 'anger' }, { s: 'birr-al-walidayn', sec: 'kinship' },
  { s: 'muhasabah', sec: 'sunnah' }, { s: 'intro-to-islam', sec: 'quran' },
  { s: 'muhasabah', sec: 'meaning' },
]

// Uşaq fəaliyyəti — KidsPage bölmələri (?section=…; KidsPage DEEP_SECTIONS-də olmalıdır)
export const HALAQA_KIDS = ['stories', 'prophets', 'manners', 'quiz', 'memory', 'surahs', 'duas', 'names', 'crossword', 'wudu']

// Ümumi müzakirə sualları (UI mətni, pages/FamilyHalaqaPage → PROMPTS); hər həftə 3-ü + ayənin sualı
export const PROMPT_IDS = ['new', 'step', 'remember', 'example', 'ask', 'thank']
export const PROMPTS_PER_WEEK = 3

const DAY = 86400000
const WEEK = 7 * DAY
const KEY_RE = /^(\d{4})-W(\d{2})$/

/** Yerli tarixin ISO həftəsi → { y, w, key: 'YYYY-Www' } */
export function isoWeek(d = new Date()) {
  const t = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (new Date(t).getUTCDay() + 6) % 7          // B.e. = 0
  const thu = new Date(t + (3 - dow) * DAY)               // həftənin cümə axşamı ilin müəyyən edir
  const y = thu.getUTCFullYear()
  const w = 1 + Math.floor((thu.getTime() - Date.UTC(y, 0, 1)) / WEEK)
  return { y, w, key: `${y}-W${String(w).padStart(2, '0')}` }
}

/** İlin ISO həftə sayı (52 və ya 53) */
export function weeksInYear(y) {
  return isoWeek(new Date(y, 11, 28)).w
}

/** 'YYYY-Www' → həftənin bazar ertəsi (UTC ms) və ya null */
export function weekStart(key) {
  const m = KEY_RE.exec(String(key || ''))
  if (!m) return null
  const y = Number(m[1]), w = Number(m[2])
  if (y < 2000 || y > 2200 || w < 1 || w > weeksInYear(y)) return null
  const jan4 = Date.UTC(y, 0, 4)
  const dow = (new Date(jan4).getUTCDay() + 6) % 7
  return jan4 - dow * DAY + (w - 1) * WEEK
}
export const validWeek = (key) => weekStart(key) !== null

/** Bazar ertəsi (UTC ms) → 'YYYY-Www' */
const keyOfMonday = (ms) => { const d = new Date(ms); return isoWeek(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).key }

/** Qonşu həftə: shiftWeek('2026-W53', 1) → '2027-W01' */
export function shiftWeek(key, n) {
  const ms = weekStart(key)
  return ms === null ? null : keyOfMonday(ms + n * WEEK)
}

/** Həftənin günləri: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' } */
export function weekRange(key) {
  const ms = weekStart(key)
  if (ms === null) return null
  const iso = (x) => new Date(x).toISOString().slice(0, 10)
  return { from: iso(ms), to: iso(ms + 6 * DAY) }
}

/** 1970-ci ildən bəri həftə nömrəsi (fırlanma üçün sabit tam ədəd) */
const absWeek = (key) => Math.round((weekStart(key) - Date.UTC(1969, 11, 29)) / WEEK)
const mod = (a, n) => ((a % n) + n) % n
export const cleanVariant = (v) => { const n = Number(v); return Number.isInteger(n) && n >= 0 && n <= VARIANT_MAX ? n : 0 }

/**
 * Həftənin dəsti (indekslər). nAyah — TADABBUR uzunluğu.
 * Addımlar hər hovuzun ölçüsü ilə qarşılıqlı sadədir — variant dəyişəndə hər hissə dəyişir.
 * → { week, v, ayah, hadith (Nəvəvi n), lesson ({ s, sec }), kids (bölmə), prompts: [id × 3] }
 */
export function kitFor(key, variant = 0, nAyah = 61) {
  if (!validWeek(key)) return null
  const v = cleanVariant(variant)
  const w = absWeek(key)
  const p0 = mod(w + v, PROMPT_IDS.length)
  return {
    week: key,
    v,
    ayah: mod(w + v * 17, Math.max(1, nAyah)),
    hadith: HALAQA_HADITH_NS[mod(w + v * 11, HALAQA_HADITH_NS.length)],
    lesson: HALAQA_LESSONS[mod(w + v * 5, HALAQA_LESSONS.length)],
    kids: HALAQA_KIDS[mod(w + v * 3, HALAQA_KIDS.length)],
    prompts: Array.from({ length: PROMPTS_PER_WEEK }, (_, i) => PROMPT_IDS[(p0 + i) % PROMPT_IDS.length]),
  }
}

/** URL parametrləri (?week=2026-W48&v=2) → { week?, v? } */
export function readParams(search) {
  let q
  try { q = new URLSearchParams(search || '') } catch { return {} }
  const out = {}
  const w = q.get('week')
  if (w && validWeek(w)) out.week = w
  if (q.has('v')) { const v = cleanVariant(q.get('v')); if (v) out.v = v }
  return out
}

/** Paylaşma keçidi: <origin><path>?week=…[&v=…] */
export const shareUrl = (origin, path, key, v = 0) => `${origin}${path}?week=${encodeURIComponent(key)}${cleanVariant(v) ? `&v=${cleanVariant(v)}` : ''}`

// ── Yerli qeyd ──
const emit = () => { try { globalThis.dispatchEvent?.(new CustomEvent(HALAQA_EVENT)) } catch { /* */ } }

/** Son HALAQA_KEEP həftə qalır (açar sırası ilə) */
const keepLast = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-HALAQA_KEEP))

export function sanitizeHalaqa(raw) {
  const r = isObj(raw) ? raw : {}
  const d = {}, s = {}
  if (isObj(r.d)) for (const [k, v] of Object.entries(r.d)) if (validWeek(k) && validDay(v)) d[k] = v
  if (isObj(r.s)) for (const [k, v] of Object.entries(r.s)) { const n = cleanVariant(v); if (validWeek(k) && n) s[k] = n }
  return { v: 1, d: keepLast(d), s: keepLast(s) }
}

export const readHalaqa = (storage = safeStorage()) => sanitizeHalaqa(parse(storage, HALAQA_KEY, null))

function writeHalaqa(data, storage) {
  const v = sanitizeHalaqa(data)
  try {
    if (Object.keys(v.d).length || Object.keys(v.s).length) storage?.setItem(HALAQA_KEY, JSON.stringify(v))
    else storage?.removeItem(HALAQA_KEY)
  } catch { /* yaddaş bağlıdır */ }
  emit()
  return v
}

/** "Bu həftə keçirdik" işarəsi */
export function setHalaqaDone(key, done, storage = safeStorage(), today = localDay()) {
  const cur = readHalaqa(storage)
  if (!validWeek(key)) return cur
  const d = { ...cur.d }
  if (done) d[key] = d[key] || today
  else delete d[key]
  return writeHalaqa({ ...cur, d }, storage)
}

/** Həftə üçün seçilən variant (0 — standart dəst, qeyd silinir) */
export function setHalaqaVariant(key, variant, storage = safeStorage()) {
  const cur = readHalaqa(storage)
  if (!validWeek(key)) return cur
  const s = { ...cur.s }
  const n = cleanVariant(variant)
  if (n) s[key] = n
  else delete s[key]
  return writeHalaqa({ ...cur, s }, storage)
}
