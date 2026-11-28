// Dua küpü — saf köməkçilər (tests/unit/rabbana.test.js)
import { SURAH_TABLE } from '../../data/mushafIndex.js'
import { getSurahLocal } from '../../data/surahNamesAz.js'

/**
 * Təsadüfi növbəti indeks: 0…n-1, heç vaxt ardıcıl iki dəfə eyni (n > 1 olanda).
 * rnd — [0, 1) (testdə sabit verilir).
 */
export function pickNext(n, last, rnd = Math.random) {
  if (!(n > 0)) return -1
  if (n === 1) return 0
  if (last == null || last < 0 || last >= n) return Math.min(n - 1, Math.floor(rnd() * n))
  // last-dan başqa n-1 seçimdən biri: last-ı "atlayırıq"
  const k = Math.min(n - 2, Math.floor(rnd() * (n - 1)))
  return k >= last ? k + 1 : k
}

/**
 * Silkələmə: iki ardıcıl ölçü arasında (accelerationIncludingGravity, m/s²) ani dəyişmə.
 * Telefonu yavaş fırlatmaq (cazibə yavaş-yavaş dəyişir) sayılmır.
 */
export function isShake(prev, cur, threshold = 28) {
  if (!prev || !cur) return false
  const d = Math.abs((cur.x || 0) - (prev.x || 0)) + Math.abs((cur.y || 0) - (prev.y || 0)) + Math.abs((cur.z || 0) - (prev.z || 0))
  return d > threshold
}

/** Surə adı: az/ru/tr — yerli yazılış, ar — ərəb adı, en və digərləri — latın */
export function surahName(s, lang) {
  const row = SURAH_TABLE[s - 1]
  if (!row) return ''
  if (lang === 'ar') return row[4]
  return getSurahLocal(s, lang)?.name || row[5]
}

/** Kartdakı istinad: "Bəqərə 2:127" */
export const refLabel = (it, lang) => `${surahName(it.s, lang)} ${it.s}:${it.a}`

/** Ayənin dua hissəsi və ətrafı — hamısı ayənin öz mətnindən */
export function splitAyah(it) {
  return { pre: it.ayah.slice(0, it.start), span: it.ayah.slice(it.start, it.end), post: it.ayah.slice(it.end) }
}
