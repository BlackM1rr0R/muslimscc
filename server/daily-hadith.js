// "Günün hədisi" push-unun saf köməkçiləri (tests/unit/daily-hadith.test.js)
//
// Siyahı: server/daily-hadith-data.js (scripts/build-daily-hadith.mjs — yalnız
// səhih, saytda səhifəsi olan hədislər; mətnlər saytdakı ilə eyni). Göndərmə
// "Günün ayəsi" ilə eyni saatda (prefs.daily.hour), ayrıca seçimlə
// (prefs.daily.hadith) — server.js → dailyAyahTick.
'use strict'

const LIST = require('./daily-hadith-data')
const { dayNumber, truncateWords } = require('./daily-ayah')

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']
// /hadith/<id> səhifələri yalnız 5 əsas dildə var (seo/routes.js → coreOnly)
const TITLE = { az: 'Günün hədisi', en: 'Hadith of the day', ru: 'Хадис дня', tr: 'Günün hadisi', ar: 'حديث اليوم' }
const STEP = 389   // siyahı uzunluğu ilə qarşılıqlı sadə — ardıcıl günlərdə qonşu hədislər düşməsin

const gcd = (a, b) => (b ? gcd(b, a % b) : a)

/** Yerli tarixə görə günün hədisi — hamı eyni tarixdə eyni hədisi alır. */
function hadithForDate(dateKey, list = LIST) {
  const n = list.length
  if (!n) return null
  const step = gcd(STEP, n) === 1 ? STEP : 1
  const i = (((dayNumber(dateKey) * step) % n) + n) % n
  return list[i]
}

const langOf = (lang) => (LANGS.includes(lang) ? lang : 'en')

/** Bildiriş: { title, body, link } */
function buildHadithMessage(lang, h) {
  const L = langOf(lang)
  const title = `📜 ${TITLE[L]} — ${h.src[L] || h.src.en}`
  const body = truncateWords(h.t[L] || h.t.en)
  const link = L === 'az' ? `/hadith/${h.id}` : `/${L}/hadith/${h.id}`
  return { title, body, link }
}

module.exports = { LIST, TITLE, hadithForDate, buildHadithMessage, langOf }
