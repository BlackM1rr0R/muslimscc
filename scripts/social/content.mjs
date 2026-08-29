// ═══════════════════════════════════════════════════════
// Post üçün məzmun seçicisi
//
// PRİNSİP: müqəddəs mətn HEÇ VAXT model tərəfindən yaradılmır.
// Ayə, hədis, dua və adlar yalnız saytın doğrulanmış data
// fayllarından — dəyişdirilmədən, mənbəsi ilə birlikdə — götürülür.
// Modelin işi yalnız ətrafdakı caption-dır (bax: caption.mjs).
//
// Hər element bir dəfə paylaşılır; istifadə olunanlar state/used.json-da
// saxlanılır. Hamısı bitəndə siyahı sıfırlanır və dövr yenidən başlayır.
// ═══════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const STATE_DIR = path.join(HERE, 'state')
const USED_FILE = path.join(STATE_DIR, 'used.json')

// Hazır hovuz: serverə yalnız scripts/social/ + assets/fonts/ köçürülsün
// deyə məzmun bir dəfə JSON-a yığılır (npm run social:pool).
// Fayl varsa src/data/ oxunmur — frontend mənbəyi serverdə lazım deyil.
const POOL_FILE = path.join(HERE, 'pool.json')

// Növ başına paylanma — hər gün 3 post, növbə ilə dolanır
export const TYPES = ['quran', 'hadith', 'dua', 'name']

/**
 * Bütün mənbələri vahid formaya gətir.
 * Hər element: { key, type, ar, az, en, source }
 *   ar — ərəb mətni (şəkildə əsas element)
 *   az/en — tərcümələr
 *   source — istinad; olmayan növlərdə boş
 */
async function buildPoolFromSource() {
  // Dinamik import: pool.json mövcuddursa bu fayllar heç oxunmur
  const [{ HADITHS }, { QUOTES }, { DUAS_DATA }, { NAMES_99 }] = await Promise.all([
    import('../../src/data/hadiths.js'),
    import('../../src/data/quotes.js'),
    import('../../src/data/duas.js'),
    import('../../src/data/names99.js'),
  ])

  const pool = []

  // ── Quran ayələri ──
  for (const [i, q] of QUOTES.entries()) {
    if (q.cat !== 'quran') continue
    if (!q.ar || !q.text?.az || !q.text?.en) continue
    pool.push({
      key: `quran:${i}`,
      type: 'quran',
      ar: q.ar,
      az: q.text.az,
      en: q.text.en,
      source: q.source || '',
    })
  }

  // ── Hədislər ── az və en eyni id ilə uyğunlaşır
  const enById = new Map(HADITHS.en.map(h => [h.id, h.text]))
  for (const h of HADITHS.az) {
    const en = enById.get(h.id)
    if (!h.ar || !h.text || !en) continue
    pool.push({
      key: `hadith:${h.id}`,
      type: 'hadith',
      ar: h.ar,
      az: h.text,
      en,
      source: h.source || '',
    })
  }

  // ── Dualar ──
  for (const d of DUAS_DATA) {
    if (!d.ar || !d.az || !d.en) continue
    pool.push({
      key: `dua:${d.id}`,
      type: 'dua',
      ar: d.ar,
      az: d.az,
      en: d.en,
      source: d.source || '',
    })
  }

  // ── Allahın 99 adı ──
  for (const n of NAMES_99) {
    if (!n.ar || !n.az || !n.en) continue
    pool.push({
      key: `name:${n.n}`,
      type: 'name',
      ar: n.ar,
      az: n.az,
      en: n.en,
      // Adlarda istinad yoxdur; translit sahəsi ad kimi istifadə olunur
      source: n.tr || '',
    })
  }

  return pool
}

/** Hovuzu yüklə: əvvəlcə pool.json, yoxdursa mənbə fayllarından qur. */
async function loadPool() {
  if (fs.existsSync(POOL_FILE)) {
    return JSON.parse(fs.readFileSync(POOL_FILE, 'utf8')).items
  }
  return buildPoolFromSource()
}

/** pool.json yarat — yerləşdirmədən əvvəl bir dəfə işlədilir. */
export async function writePool() {
  const items = await buildPoolFromSource()
  fs.writeFileSync(
    POOL_FILE,
    JSON.stringify({ built: new Date().toISOString(), count: items.length, items }),
    'utf8',
  )
  return items.length
}

export const POOL = await loadPool()

function readUsed() {
  try {
    const raw = JSON.parse(fs.readFileSync(USED_FILE, 'utf8'))
    return new Set(Array.isArray(raw.keys) ? raw.keys : [])
  } catch {
    return new Set()
  }
}

function writeUsed(set) {
  fs.mkdirSync(STATE_DIR, { recursive: true })
  fs.writeFileSync(
    USED_FILE,
    JSON.stringify({ updated: new Date().toISOString(), keys: [...set] }, null, 2),
    'utf8',
  )
}

/**
 * Növbəti paylaşılmamış elementi seç.
 *
 * @param {string} [type] — istənilən növ ('quran'|'hadith'|'dua'|'name');
 *                          verilməzsə bütün hovuzdan seçilir
 * @param {boolean} [commit=true] — seçiləni "istifadə olunmuş" kimi qeyd et
 */
export function pickNext(type, commit = true) {
  const used = readUsed()
  const candidates = POOL.filter(p => (!type || p.type === type) && !used.has(p.key))

  let list = candidates
  if (list.length === 0) {
    // Bu növün hamısı paylaşılıb — həmin növ üçün dövrü sıfırla
    for (const p of POOL) if (!type || p.type === type) used.delete(p.key)
    list = POOL.filter(p => !type || p.type === type)
    if (list.length === 0) throw new Error(`Bu növ üçün məzmun yoxdur: ${type}`)
  }

  const chosen = list[Math.floor(Math.random() * list.length)]
  if (commit) {
    used.add(chosen.key)
    writeUsed(used)
  }
  return chosen
}

/** Hovuzun növ üzrə statistikası — diaqnostika üçün. */
export function stats() {
  const used = readUsed()
  const out = {}
  for (const t of TYPES) {
    const all = POOL.filter(p => p.type === t)
    out[t] = { total: all.length, used: all.filter(p => used.has(p.key)).length }
  }
  return out
}
