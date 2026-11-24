// ═══════════════════════════════════════════════════════
// PWA paylaşma hədəfi (/share) — saf məntiq (React-sız)
//
// Android-də "Paylaş → Muslims.cc": brauzer /share?title=…&text=…&url=… açır
// (public/site.webmanifest → share_target, GET). Burada:
//   • readShareParams — ünvandan sahələri oxu, uzunluğu kəs, yalnız http(s) URL;
//   • classifyShare   — mətnə görə ağıllı əməllər: ərəbcə → Quranda tap, istənilən
//     mətn → məna ilə axtar, E-kod / ştrixkod / tərkib → halal yoxlaması, hər şey → dua gündəliyi;
//   • appendDuaJournal — dua gündəliyinə (localStorage "dua_journal", DuaJournalPage ilə eyni format)
//     yeni qeyd əlavə et; yaddaş kənardan verilir (test üçün).
// Heç nə serverə göndərilmir. tests/unit/share-intent.test.js
// ═══════════════════════════════════════════════════════

import { extractECodes, displayECode } from './ecodes.js'

export const LIMITS = Object.freeze({ title: 300, text: 4000, url: 2000, dua: 1000, meaning: 200, quranWords: 6 })

const URL_RE = /https?:\/\/[^\s<>"'«»]+/i
// Ərəb hərfləri (əsas blok + təqdimat formaları); hərəkələr ayrıca
const AR_LETTER = /[ء-غف-يٱ-ۓﭐ-﷿ﹰ-ﻼ]/g
const ANY_LETTER = /\p{L}/gu
// Hərəkələr, Quran işarələri, tətvil, BOM, sıfır enli simvollar
const AR_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ﻿​-‏]/g
// Tərkib siyahısı açar sözləri (qablaşdırmada ən çox rast gəlinən dillər)
const INGR_WORDS = ['ingredient', 'tərkib', 'terkib', 'состав', 'içindekiler', 'icindekiler', 'bileşen', 'zutaten', 'ingrédients', 'ingredientes', 'ingredienti', 'المكونات', 'مكونات', 'komposisi', 'samenstelling', 'skład']

const clean = (v, max) => String(v ?? '').replace(/\u0000/g, '').trim().slice(0, max)

/** Yalnız http(s) ünvan (javascript:, data: … rədd olunur); boş — '' */
export function safeHttpUrl(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href.slice(0, LIMITS.url) : ''
  } catch { return '' }
}

/** Mətndəki ilk http(s) ünvan */
export function findUrl(text) {
  const m = URL_RE.exec(String(text || ''))
  return m ? safeHttpUrl(m[0].replace(/[.,;:!?)\]]+$/, '')) : ''
}

/** ?title=&text=&url= → təmizlənmiş sahələr */
export function readShareParams(search) {
  let p
  try { p = new URLSearchParams(search || '') } catch { p = new URLSearchParams() }
  return {
    title: clean(p.get('title'), LIMITS.title),
    text: clean(p.get('text'), LIMITS.text),
    url: safeHttpUrl(p.get('url')),
  }
}

/** Hərflərin neçə faizi ərəbcədir (0..1) və ərəb hərflərinin sayı */
export function arabicShare(s) {
  const str = String(s || '')
  const ar = (str.match(AR_LETTER) || []).length
  const all = (str.match(ANY_LETTER) || []).length
  return { ratio: all ? ar / all : 0, count: ar }
}

/** Quran axtarışı üçün ərəbcə sorğu: hərəkəsiz, yalnız ərəb hərfləri, ilk N söz */
export function arabicQuery(s, words = LIMITS.quranWords) {
  const plain = String(s || '')
    .replace(AR_MARKS, '')
    .replace(/[ٱأإآ]/g, (c) => (c === 'ٱ' ? 'ا' : c))
    .replace(/[^ء-غف-ي\s]/g, ' ')
    .split(/\s+/).filter(Boolean)
  return plain.slice(0, words).join(' ')
}

/** Yalnız ştrixkod (8–14 rəqəm, boşluq/tire ilə ola bilər) */
export function barcodeOf(s) {
  const t = String(s || '').trim()
  if (!/^[\d\s-]{8,20}$/.test(t)) return ''
  const d = t.replace(/\D/g, '')
  return d.length >= 8 && d.length <= 14 ? d : ''
}

const hasIngredientWord = (s) => {
  const low = String(s || '').toLocaleLowerCase()
  return INGR_WORDS.some((w) => low.includes(w))
}

/**
 * Paylaşılanı təsnif et.
 * Qaytarır: { body, url, arabic, quranQuery, ecodes, barcode, ingredients, actions }
 *   body    — URL-siz mətn (başlıq mətndə yoxdursa — əvvəldə)
 *   actions — sıralı: 'quran' | 'meaning' | 'halal' | 'dua' (ilk — tövsiyə olunan)
 */
export function classifyShare({ title = '', text = '', url = '' } = {}) {
  const link = safeHttpUrl(url) || findUrl(text) || findUrl(title)
  const strip = (s) => String(s || '').replace(URL_RE, ' ').replace(/[ \t]+/g, ' ').trim()
  const t = strip(title), x = strip(text)
  const body = (t && !x.includes(t) ? (x ? `${t}\n${x}` : t) : x).trim()
  const ar = arabicShare(body)
  const arabic = ar.count >= 3 && ar.ratio >= 0.5
  const quranQuery = arabic ? arabicQuery(body) : ''
  const barcode = barcodeOf(body)
  const ecodes = barcode ? [] : extractECodes(body)
  const ingredients = !barcode && (ecodes.length > 0 || hasIngredientWord(body))
  const words = (body.match(ANY_LETTER) || []).length

  const actions = []
  const halal = Boolean(barcode || ingredients)
  if (halal) actions.push('halal')
  if (arabic && quranQuery.length >= 3) actions.push('quran')
  if (!barcode && words >= 3) actions.push('meaning')
  if (body || link) actions.push('dua')
  return { body, url: link, arabic, quranQuery, ecodes, barcode, ingredients, actions }
}

/** Dua gündəliyinə yazılacaq mətn (başlıq + mətn + keçid), 1000 simvola qədər */
export function duaTextFromShare(c) {
  const parts = [c?.body, c?.url && !String(c.body || '').includes(c.url) ? c.url : ''].filter(Boolean)
  return parts.join('\n').slice(0, LIMITS.dua).trim()
}

/** Halal yoxlaması üçün sorğu sətri (?barcode= və ya ?q=E471, E120) — '' — sorğusuz */
export function halalQuery(c) {
  if (c?.barcode) return `?barcode=${c.barcode}`
  if (c?.ecodes?.length) return `?q=${encodeURIComponent(c.ecodes.slice(0, 30).map(displayECode).join(', '))}`
  return ''
}

/** Yerli tarix ISO (Bakıda gecə yarısı UTC sürüşməsi olmasın) */
export function localISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const DUA_JOURNAL_KEY = 'dua_journal'

/**
 * Dua gündəliyinə yeni aktiv dua əlavə et (DuaJournalPage-in formatı: { duas: [...] }, ən yenisi əvvəldə).
 * storage — localStorage kimi obyekt. Qaytarır: yeni qeydin id-si və ya null (boş mətn / yaddaş xətası).
 */
export function appendDuaJournal(storage, text, { date = localISO(), id } = {}) {
  const t = String(text || '').trim().slice(0, LIMITS.dua)
  if (!t || !storage) return null
  try {
    let data = null
    try { data = JSON.parse(storage.getItem(DUA_JOURNAL_KEY) || 'null') } catch { data = null }
    const base = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
    const list = Array.isArray(base.duas) ? base.duas : []
    const newId = id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const entry = { id: newId, text: t, category: 'personal', priority: 'medium', date, answered: false, answeredDate: null }
    storage.setItem(DUA_JOURNAL_KEY, JSON.stringify({ ...base, duas: [entry, ...list] }))
    return newId
  } catch { return null }
}
