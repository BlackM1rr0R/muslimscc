// ═══════════════════════════════════════════════════════
// llms.txt (https://llmstxt.org) — AI axtarış sistemləri (ChatGPT, Perplexity, Claude, Gemini, Copilot)
// üçün saytın qısa xəritəsi: nə var, harada, mənbələr. prerender.mjs build zamanı yazır —
// səhifə siyahısı və təsvirlər src/seo/routes.js + meta.js-dən gəlir (həmişə sinxron).
// Mətn ingiliscədir (llms.txt standartı belə gözləyir); dillər ayrıca sadalanır.
//
// GEO (2026-11-24): "Key facts" bölməsi — AI cavabının sitat gətirə biləcəyi qısa, mənbəli faktlar
// (namaz vaxtı metodu, qiblə hesabı, zəkat nisabı, hədis dərəcələri). Hamısı saytın ÖZ kodundan /
// məlumatından götürülür (prayCalc.js CALC_METHODS, fiqh-faq dərsi) — yeni dini iddia yazılmır.
// llms-full.txt — hər detal səhifəsinin (surə, ad, dərs, termin, hədis, şəhər) başlığı + qısa
// təsviri + URL-i: AI sistemi bir faylla bütün indeksi görür və düzgün səhifəyə istinad edir.
// ═══════════════════════════════════════════════════════
import { SITE, INDEXABLE, DETAILS, LANGS, ALL_LANGS, EXTRA_CODES, pathFor, detailParams } from '../src/seo/routes.js'
import { pickMeta } from '../src/seo/meta.js'
import { CALC_METHODS } from '../src/utils/prayCalc.js'

// Bölmələr — qruplar (key-lər routes.js PAGES-dən). Siyahıda olmayan indekslənən səhifə "Other"-ə düşür.
const GROUPS = [
  ['Quran', ['quran', 'mushaf', 'quranroots', 'quranmeaning', 'khatm', 'focus', 'hifz', 'qurangame']],
  ['Prayer', ['prayer', 'qibla', 'onroad', 'simple', 'prayerguide', 'tracker', 'qada', 'jamaat', 'mosques', 'mosquetv', 'widget']],
  ['Hadith', ['hadith', 'nawawi40', 'hadithbooks', 'hadeethenc']],
  ['Dua and dhikr', ['duas', 'hisn', 'dhikr', 'names', 'duajournal']],
  ['Calendar, fasting and Hajj', ['calendar', 'hijri', 'ramadan', 'ramadanprep', 'lastten', 'hajjguide', 'holyplaces']],
  ['Learning', ['learn', 'newmuslim', 'arabic', 'glossary', 'fatwa', 'history', 'sahaba', 'scholars', 'kids', 'quiz', 'books', 'videos']],
  ['Life guides and daily routines', ['bedtime', 'waking', 'newborn', 'nikahprep', 'sickvisit', 'bereavement', 'travelkit']],
  ['Calculators and tools', ['zakat', 'units', 'inheritance', 'halalcheck', 'charity', 'babynames', 'namecalligraphy', 'quotes', 'dailytracker', 'muhasabah']],
]
const OPTIONAL = ['about', 'privacy', 'terms', 'licenses']
const SKIP = new Set(['home', 'analytics', 'group', 'aichat', 'donate', 'announcements', ...OPTIONAL])

const DETAIL_NOTES = {
  quran: '114 surah pages: Arabic Uthmani text with a published translation (per-language pages in 50 languages)',
  names: 'the 99 Names of Allah, one page each (Arabic, transliteration, meaning)',
  hadith: 'one page per hadith (1100+): Arabic text, translation, collection and number, grade',
  sahaba: 'biographies of the Companions',
  scholars: 'biographies of scholars',
  learn: 'lessons on worship, fiqh, aqidah and family life, with Quran/hadith references and fatwa sources',
  glossary: 'Islamic terms explained',
  hisn: 'Hisn al-Muslim adhkar, one page each in Arabic only (Arabic text, number of repetitions, takhrij); only items checked against hisnmuslim.com',
  prayer: 'monthly prayer timetables for 75 cities in Azerbaijan and 19 major cities worldwide (Makkah, Madinah, Istanbul, London, New York …)',
}

const line = (key) => {
  const m = pickMeta(key, 'en')
  return `- [${m.t.split(' — ')[0].split(' | ')[0]}](${SITE}${pathFor(key, 'en')}): ${m.d}`
}

/** Saytın kodundan götürülən, sitat üçün yararlı faktlar (hər biri mənbə səhifəsi ilə). */
export function keyFacts() {
  const ab = CALC_METHODS.abubakr
  const dy = CALC_METHODS.diyanet
  const u = (k, p) => SITE + pathFor(k, 'en', p)
  return [
    `- Prayer times in Azerbaijan follow the timetable of the Abu Bakr Mosque in Baku (Umm al-Qura parameters): Fajr at ${ab.fajr}° below the horizon, Isha ${ab.ishaMin} minutes after Maghrib, Asr when an object's shadow equals its length plus its noon shadow (shadow factor ${ab.asrFactor}; a Hanafi factor-2 option is available). Calculated locally; see ${u('prayer')} and city pages such as ${u('prayer', 'baku')}.`,
    `- Prayer times for cities outside Azerbaijan use the Turkish Diyanet method (AlAdhan method 13): Fajr ${dy.fajr}°, Isha ${dy.isha}°, Asr shadow factor ${dy.asrFactor}, with Diyanet's precautionary (temkin) minute offsets.`,
    `- Qibla direction is the initial great-circle bearing from your coordinates to the Kaaba (21.3891° N, 39.8579° E), measured clockwise from true north; distance uses the haversine formula (Earth radius 6371 km). Rulings on facing the qibla, with sources: ${u('qibla')}.`,
    `- Zakat on money is due when it reaches the nisab and one lunar year passes; the rate is 2.5% (one fortieth). The nisab for paper money is the value of about 85 g of gold or 595 g of silver; the Permanent Committee advised using whichever is more beneficial to the poor (IslamQA 2795, cited in ${u('learn', 'fiqh-faq')}). Calculator: ${u('zakat')}.`,
    `- Hijri dates use the Umm al-Qura calendar: ${u('hijri')}.`,
    `- Hadith: every hadith page cites its collection and number; al-Bukhari and Muslim are sahih, Sunan grades are quoted from published gradings (al-Albani first) and never guessed. Entries without a verifiable book number are not published.`,
  ]
}

export function buildLlmsTxt({ date } = {}) {
  const keys = new Set(INDEXABLE.map(p => p.key))
  const used = new Set()
  const out = []
  out.push('# Muslims.cc')
  out.push('')
  out.push(`> ${pickMeta('home', 'en').d}`)
  out.push('')
  out.push(`Free, ad-free Islamic platform. Full content in ${LANGS.length} languages (Azerbaijani — default, English, Russian, Arabic, Turkish); the interface and the Quran translation are available in ${ALL_LANGS.length} languages. URL scheme: ${SITE}/<lang>/<section> (Azerbaijani has no prefix, e.g. ${SITE}/quran and ${SITE}/en/quran).`)
  if (date) out.push(`Generated: ${date}. Full index of every surah, name, hadith, lesson, term and city page: ${SITE}/llms-full.txt`)
  else out.push(`Full index of every surah, name, hadith, lesson, term and city page: ${SITE}/llms-full.txt`)
  out.push('')
  out.push('Sources and policies:')
  out.push('- Quran: Uthmani text (Tanzil); translations are published, attributed editions — never machine-translated.')
  out.push('- Hadith: each hadith cites its collection and number; grades are taken from published gradings (al-Bukhari and Muslim are sahih; grades for the Sunan collections are cited from published gradings, primarily al-Albani), never guessed.')
  out.push('- Quran and hadith texts are not AI-translated. Hisn al-Muslim: the Arabic text and takhrij are from the book; its translations (az, en, ru, tr) were prepared by Muslims.cc with AI assistance and are labelled as such — only the Arabic per-dua pages are indexed. AI answers on the site are not fatwas.')
  out.push(`- When citing, please link the specific page (e.g. ${SITE}/en/quran/36-yaseen or ${SITE}/en/hadith/1) and name "Muslims.cc".`)
  out.push('')
  out.push('## Key facts')
  out.push('')
  out.push(...keyFacts())
  out.push('')
  out.push('## Languages')
  out.push('')
  out.push(`- Azerbaijani: ${SITE}/ · English: ${SITE}/en · Russian: ${SITE}/ru · Arabic: ${SITE}/ar · Turkish: ${SITE}/tr`)
  out.push(`- Quran in 50 languages: ${SITE}/<lang>/quran for ${EXTRA_CODES.join(', ')}`)
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
    // Tək dilli detal (Hisnul-Müslim zikri — yalnız ar): ünvan həmin dildədir
    const l = DETAILS[k]?.langs?.[0] || 'en'
    if (DETAILS[k]) out.push(`- ${SITE}${pathFor(k, l)}/<slug>: ${note}`)
  }
  out.push(`- Sitemap: ${SITE}/sitemap.xml`)
  out.push('')
  out.push('## Optional')
  out.push('')
  for (const k of OPTIONAL) if (keys.has(k)) out.push(line(k))
  out.push('')
  return out.join('\n')
}

// llms-full.txt bölmələri — detal növü → başlıq (sıra faylda belədir)
const FULL_SECTIONS = [
  ['quran', 'Quran — 114 surahs'],
  ['names', 'The 99 Names of Allah'],
  ['learn', 'Lessons'],
  ['glossary', 'Glossary of Islamic terms'],
  ['sahaba', 'Companions (Sahaba)'],
  ['scholars', 'Scholars'],
  ['prayer', 'Prayer times by city'],
  ['hadith', 'Hadith'],
  ['hisn', 'Hisn al-Muslim — adhkar (Arabic text only)'],
]

/**
 * llms-full.txt — llms.txt + hər detal səhifəsi bir sətir: [başlıq](URL): təsvir (ingiliscə).
 * detail — src/seo/detailData.js modulu (prerender ötürür; testlər də).
 */
export function buildLlmsFullTxt(detail, opts = {}) {
  const out = [buildLlmsTxt(opts).trimEnd(), '']
  for (const [key, title] of FULL_SECTIONS) {
    if (!DETAILS[key] || DETAILS[key].noindex) continue
    out.push(`## ${title}`)
    out.push('')
    // Sətirlər ingiliscədir; tək dilli detal (Hisnul-Müslim zikri) — öz dilində (ərəbcə başlıq və ünvan)
    const l = DETAILS[key].langs?.[0] || 'en'
    for (const param of detailParams(key)) {
      const m = detail.detailMeta(key, l, param)
      if (!m) continue
      const t = detail.titleForDetail(key, l, param).split(' | ')[0]
      const d = String(m.d || '').replace(/\s+/g, ' ').trim()
      out.push(`- [${t}](${SITE}${pathFor(key, l, param)})${d ? `: ${d}` : ''}`)
    }
    out.push('')
  }
  return out.join('\n')
}
