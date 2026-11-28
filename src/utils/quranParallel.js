// ═══════════════════════════════════════════════════════
// Paralel tərcümə (Quran oxuyucusu): ərəb mətni + 2–3 tərcümə yan-yana sütunlarda.
//
// Seçilə bilən tərcümələr YALNIZ saytın artıq təklif etdiyi nəşr olunmuş mətnlərdir:
//   • 5 əsas dilin standart nəşri (api.alquran.cloud — QuranPage.jsx → EDITION_MAP ilə eyni)
//   • QuranEnc.com kataloqu (utils/quranEnc.js → QURANENC_CATALOG)
// AI mətni yoxdur, heç nə uydurulmur.
//
// Yaddaş (localStorage 'quran_parallel'): { on: bool, keys: ['az.mammadaliyev', 'azeri_musayev'] }.
// Bu, profil məlumatı deyil (görünüş seçimi) — quran_compare / quran_translation kimi.
// ═══════════════════════════════════════════════════════
import { QURANENC_CATALOG, quranEncEntry } from './quranEnc'

export const PAR_KEY = 'quran_parallel'
export const PAR_MIN = 2
export const PAR_MAX = 3
export const BASE_LANGS = ['az', 'en', 'ru', 'tr', 'ar']

// 5 əsas dilin standart nəşri və tərcüməçisi (QuranPage.jsx → EDITION_MAP / DEFAULT_TRANSLATOR)
export const BASE_EDITIONS = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet', ar: 'ar.muyassar' }
export const BASE_TRANSLATORS = { az: 'Vasim Məmmədəliyev və Ziya Bünyadov', en: 'Muhammad Asad', ru: 'Эльмир Кулиев', tr: 'Diyanet İşleri Başkanlığı', ar: 'التفسير الميسر' }

const EDITION_LANG = Object.fromEntries(Object.entries(BASE_EDITIONS).map(([l, e]) => [e, l]))

/** Açar alquran.cloud nəşridir? (yoxsa QuranEnc) */
export const isEditionKey = (k) => Object.prototype.hasOwnProperty.call(EDITION_LANG, k)

/** Açarın təsviri: { key, kind: 'alq'|'qe', lang, name } və ya null (naməlum açar) */
export function parallelEntry(key) {
  if (isEditionKey(key)) { const lang = EDITION_LANG[key]; return { key, kind: 'alq', lang, name: BASE_TRANSLATORS[lang] } }
  const qe = quranEncEntry(key)
  return qe ? { key, kind: 'qe', lang: qe.lang, name: qe.name } : null
}

/** Seçici qrupları: əvvəl interfeys dili, sonra qalan əsas dillər — [{ lang, items: [entry] }] */
export function parallelGroups(uiLang) {
  const order = BASE_LANGS.includes(uiLang) ? [uiLang, ...BASE_LANGS.filter(l => l !== uiLang)] : BASE_LANGS
  return order.map(lang => ({
    lang,
    items: [parallelEntry(BASE_EDITIONS[lang]), ...QURANENC_CATALOG.filter(t => t.lang === lang).map(t => parallelEntry(t.key))],
  }))
}

/** Etibarlı, təkrarsız, ən çox PAR_MAX açar */
export function sanitizeKeys(keys) {
  if (!Array.isArray(keys)) return []
  const out = []
  for (const k of keys) {
    if (typeof k !== 'string' || out.includes(k) || !parallelEntry(k)) continue
    out.push(k)
    if (out.length >= PAR_MAX) break
  }
  return out
}

/**
 * İlk açılışda seçim: dilin standart nəşri + (müqayisədəki / seçilmiş QuranEnc
 * tərcüməsi, yoxsa həmin dilin ilk QuranEnc tərcüməsi, yoxsa ingiliscə standart).
 */
export function defaultKeys(uiLang, { transKey = '', cmpKey = '' } = {}) {
  const lang = BASE_LANGS.includes(uiLang) ? uiLang : 'en'
  const first = BASE_EDITIONS[lang]
  // Ehtiyat ikinci sütun: ingiliscə standart (ingilis interfeysində — türkcə)
  const alt = lang === 'en' ? BASE_EDITIONS.tr : BASE_EDITIONS.en
  const cands = [transKey, cmpKey !== 'std' ? cmpKey : '', ...QURANENC_CATALOG.filter(t => t.lang === lang).map(t => t.key), alt]
  const second = cands.find(k => k && k !== first && parallelEntry(k))
  return sanitizeKeys([first, second])
}

export function readParallel() {
  try {
    const v = JSON.parse(localStorage.getItem(PAR_KEY))
    if (!v || typeof v !== 'object' || Array.isArray(v)) return { on: false, keys: [] }
    return { on: v.on === true, keys: sanitizeKeys(v.keys) }
  } catch { return { on: false, keys: [] } }
}

export function writeParallel(state) {
  const v = { on: !!state?.on, keys: sanitizeKeys(state?.keys) }
  try { localStorage.setItem(PAR_KEY, JSON.stringify(v)) } catch { /* yaddaş bağlıdır */ }
  return v
}

/** Seçimi dəyiş: açar varsa çıxar, yoxdursa (həddə çatmayıbsa) əlavə et */
export function toggleKey(keys, key) {
  const cur = sanitizeKeys(keys)
  if (cur.includes(key)) return cur.filter(k => k !== key)
  if (cur.length >= PAR_MAX || !parallelEntry(key)) return cur
  return [...cur, key]
}

/**
 * alquran.cloud cavabından nəşrlərin ayə mətnləri: { [identifier]: string[] }.
 * Nəşrin ayə sayı gözləniləndən fərqlidirsə — o nəşr nəticəyə düşmür (xəta sayılır).
 */
export function editionRows(data, total) {
  const list = Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : []
  const out = {}
  for (const ed of list) {
    const id = ed?.edition?.identifier
    if (!id || !isEditionKey(id) || !Array.isArray(ed.ayahs) || ed.ayahs.length !== total) continue
    out[id] = ed.ayahs.map(a => (typeof a?.text === 'string' ? a.text.replace(/^﻿/, '').trim() : ''))
  }
  return out
}
