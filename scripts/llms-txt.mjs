// ═══════════════════════════════════════════════════════
// llms.txt (https://llmstxt.org) — AI axtarış sistemləri (ChatGPT, Perplexity, Claude, Gemini)
// üçün saytın qısa xəritəsi: nə var, harada, mənbələr. prerender.mjs build zamanı yazır —
// səhifə siyahısı və təsvirlər src/seo/routes.js + meta.js-dən gəlir (həmişə sinxron).
// Mətn ingiliscədir (llms.txt standartı belə gözləyir); dillər ayrıca sadalanır.
// ═══════════════════════════════════════════════════════
import { SITE, INDEXABLE, DETAILS, LANGS, ALL_LANGS, pathFor } from '../src/seo/routes.js'
import { pickMeta } from '../src/seo/meta.js'

// Bölmələr — qruplar (key-lər routes.js PAGES-dən). Siyahıda olmayan indekslənən səhifə "Other"-ə düşür.
const GROUPS = [
  ['Quran', ['quran', 'mushaf', 'quranroots', 'hifz', 'qurangame']],
  ['Prayer', ['prayer', 'qibla', 'prayerguide', 'tracker', 'qada', 'jamaat', 'mosques', 'mosquetv', 'widget']],
  ['Hadith', ['hadith', 'nawawi40', 'hadithbooks', 'hadeethenc']],
  ['Dua and dhikr', ['duas', 'hisn', 'dhikr', 'names', 'duajournal']],
  ['Calendar, fasting and Hajj', ['calendar', 'hijri', 'ramadan', 'hajjguide', 'holyplaces']],
  ['Learning', ['learn', 'arabic', 'glossary', 'fatwa', 'history', 'sahaba', 'scholars', 'kids', 'quiz', 'books', 'videos']],
  ['Calculators and tools', ['zakat', 'inheritance', 'halalcheck', 'charity', 'babynames', 'namecalligraphy', 'quotes', 'dailytracker', 'muhasabah']],
]
const SKIP = new Set(['home', 'privacy', 'terms', 'licenses', 'analytics', 'group', 'aichat', 'donate', 'announcements'])

const DETAIL_NOTES = {
  quran: '114 surah pages, Arabic Uthmani text with translations',
  names: 'the 99 Names of Allah, one page each',
  sahaba: 'biographies of the Companions',
  scholars: 'biographies of scholars',
  learn: 'lessons on worship, fiqh, aqidah and family life',
  glossary: 'Islamic terms explained',
  prayer: 'monthly prayer timetables for 75 cities in Azerbaijan and 19 major cities worldwide (Makkah, Madinah, Istanbul, London, New York …)',
}

const line = (key) => {
  const m = pickMeta(key, 'en')
  return `- [${m.t.split(' — ')[0]}](${SITE}${pathFor(key, 'en')}): ${m.d}`
}

export function buildLlmsTxt() {
  const keys = new Set(INDEXABLE.map(p => p.key))
  const used = new Set()
  const out = []
  out.push('# Muslims.cc')
  out.push('')
  out.push(`> ${pickMeta('home', 'en').d}`)
  out.push('')
  out.push(`Free, ad-free Islamic platform. Full content in ${LANGS.length} languages (Azerbaijani — default, English, Russian, Arabic, Turkish); the interface and the Quran translation are available in ${ALL_LANGS.length} languages. URL scheme: ${SITE}/<lang>/<section> (Azerbaijani has no prefix, e.g. ${SITE}/quran and ${SITE}/en/quran).`)
  out.push('')
  out.push('Sources and policies:')
  out.push('- Quran: Uthmani text (Tanzil); translations are published, attributed editions — never machine-translated.')
  out.push('- Hadith: each hadith cites its collection and number; grades are taken from published gradings (al-Bukhari and Muslim are sahih; grades for the Sunan collections are cited from published gradings, primarily al-Albani), never guessed.')
  out.push('- Prayer times for Azerbaijan: calculated with the Abu Bakr Mosque (Baku) method — Fajr 18.5°, Isha 90 minutes after Maghrib; Asr shadow factor 1.')
  out.push('- Religious texts (Quran, hadith, duas) are not AI-translated.')
  out.push('')
  for (const [title, list] of GROUPS) {
    const ks = list.filter(k => keys.has(k))
    if (!ks.length) continue
    out.push(`## ${title}`)
    out.push('')
    for (const k of ks) { out.push(line(k)); used.add(k) }
    out.push('')
  }
  const rest = [...keys].filter(k => !used.has(k) && !SKIP.has(k))
  if (rest.length) {
    out.push('## Other')
    out.push('')
    for (const k of rest) out.push(line(k))
    out.push('')
  }
  out.push('## Detail pages')
  out.push('')
  for (const [k, note] of Object.entries(DETAIL_NOTES)) {
    if (DETAILS[k]) out.push(`- ${SITE}${pathFor(k, 'en')}/<slug>: ${note}`)
  }
  out.push(`- Sitemap: ${SITE}/sitemap.xml`)
  out.push('')
  out.push('## Optional')
  out.push('')
  for (const k of ['about', 'privacy', 'terms', 'licenses']) if (keys.has(k)) out.push(line(k))
  out.push('')
  return out.join('\n')
}
