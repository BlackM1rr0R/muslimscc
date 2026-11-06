// ═══════════════════════════════════════════════════════
// Detal səhifələrinin SEO mətnləri: /quran/<n>-<slug>, /names/<n>-<slug>,
// /sahaba/<slug>, /scholars/<slug> — 5 dildə title, description, h1, JSON-LD və statik
// <body> blokunun (scripts/prerender.mjs) interfeys yazıları.
//
// Hər mətn ŞABLONDAN qurulur, amma yalnız layihədəki məlumatla:
//   surə  — src/seo/surahMeta.js (alquran.cloud), src/data/surahNamesAz.js
//   ad    — src/data/names99.js
//   səhabə — src/data/sahaba.js
//   alim   — src/data/scholars.js
//   termin — src/data/glossary.js (+ ru/tr adı: glossaryNames.js)
// Heç bir fakt, məna və ya izah UYDURULMUR — məlumatda olmayan sahə yazılmır.
//
// Tətbiqdə bu modul Seo.jsx tərəfindən TƏNBƏL yüklənir (yalnız detal
// səhifəsində) — əsas paketə düşmür. Prerender onu adi Node ilə import
// edir, ona görə importlarda .js uzantısı vacibdir.
//
// DİL QAYDASI (meta.js ilə eyni): hər mətn tamamilə öz dilində — az-da
// türkcə söz yox, tr-də "ə" yox; scripts/check-lang.mjs bu faylı yoxlayır.
// ═══════════════════════════════════════════════════════

import { SITE, pathFor, EXTRA_PAGES, isExtraLang } from './routes.js'
import { txt } from '../utils/uiText.js'
import { SURAH_META } from './surahMeta.js'
import { getSurahLocal } from '../data/surahNamesAz.js'
import { NAMES_99 } from '../data/names99.js'
import { SAHABA, slugOf } from '../data/sahaba.js'
import { scholarBySlug, lifeSpan } from '../data/scholars.js'
import { lessonBySlug, CAT_BY_KEY } from '../data/lessons/index.js'
// Lüğət məlumatı statik import OLUNMUR (hər detal səhifəsinə ~160 KB) — glossarySource.js
import { glossaryItem } from './glossarySource.js'
import { glossaryName, glossaryGloss } from '../data/glossaryNames.js'
import { brandName } from '../config/brand.js'
import { withBrand } from './title.js'
import { EXTRA_LANGS, EXTRA_CODES } from './langs.js'
import { INTL_QURAN, INTL_BODY_UI } from './intl.js'
import { INTL_QURAN_SECTION } from './intlMeta.js'

// Title-ın səhifə hissəsi üçün hədd (brend şəkilçisi bundan sonra gəlir)
export const TITLE_MAX = 60

// ── Sıra sayları ─────────────────────────────────────
// Azərbaycan dilində şəkilçi rəqəmin oxunuşuna görədir: 1-ci, 3-cü, 6-cı,
// 9-cu, 10-cu, 40-cı, 100-cü (QuranPage.jsx → azOrdinal ilə eyni qayda)
const AZ_ONES = ['', 'ci', 'ci', 'cü', 'cü', 'ci', 'cı', 'ci', 'ci', 'cu']
const AZ_TENS = ['', 'cu', 'ci', 'cu', 'cı', 'ci', 'cı', 'ci', 'ci', 'cı']
export function azOrdinal(n) {
  if (n % 10) return `${n}-${AZ_ONES[n % 10]}`
  if (n % 100) return `${n}-${AZ_TENS[(n % 100) / 10]}`
  return `${n}-cü`
}
function enOrdinal(n) {
  const t = n % 100
  if (t >= 11 && t <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`
}
// Rus dilində say ilə isim uzlaşması: 1 аят · 2 аята · 5 аятов
function ruPlural(n, one, few, many) {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}

/** Uzun mətni söz sərhədində qısalt (description üçün). */
function clamp(text, max = 160) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  const sp = cut.lastIndexOf(' ')
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:—–-]+$/, '')}…`
}
/** Şablon variantlarından TITLE_MAX-a sığan ilkini seç. */
const fit = (...opts) => opts.find(o => o.length <= TITLE_MAX) || opts[opts.length - 1]

// ═══ Surə ═══════════════════════════════════════════

const stripSurahWord = (name) => String(name || '').replace(/^سُورَةُ\s+/, '')

/** Surənin cari dildəki məlumatı (yalnız layihədəki məlumatdan). */
export function surahInfo(n, lang) {
  const row = SURAH_META[n - 1]
  if (!row) return null
  const [arFull, en, enMeaning, place, ayahs] = row
  const extra = EXTRA_LANGS[lang]
  const local = extra ? null : getSurahLocal(n, lang)
  let name = en
  let meaning = enMeaning
  if (local) { name = local.name; meaning = local.meaning }
  else if (lang === 'ar') { name = stripSurahWord(arFull); meaning = '' }
  // Əlavə dil (src/seo/langs.js): ad latınca (urdu/fars/puştu — ərəbcə);
  // məna yalnız ingiliscə məlumatdadır — başqa dilin mətninə qatılmır
  else if (extra) { name = extra.script === 'arab' ? stripSurahWord(arFull) : en; meaning = '' }
  // Məna adla eynidirsə (məs. "Yasin") təkrarlanmır
  if (meaning === name) meaning = ''
  return { n, arFull, arName: stripSurahWord(arFull), name, latin: en, meaning, medinan: place === 'D', ayahs }
}

const QURAN = {
  az: {
    h1: (s) => `${s.name} surəsi`,
    t: (s) => fit(`${s.name} surəsi — ərəbcə mətn və Azərbaycan dilində tərcümə`, `${s.name} surəsi — ərəbcə mətn və tərcümə`),
    d: (s) => `${s.name} surəsi${s.meaning ? ` (${s.meaning})` : ''} — Quranın ${azOrdinal(s.n)} surəsi, ${s.ayahs} ayə, ${s.medinan ? 'Mədinədə' : 'Məkkədə'} nazil olub. Ərəbcə tam mətn, Azərbaycan dilində tərcümə və audio qiraət.`,
    intro: (s) => `${s.name} surəsi${s.meaning ? ` («${s.meaning}»)` : ''} Quranın ${azOrdinal(s.n)} surəsidir. ${s.ayahs} ayədən ibarətdir və ${s.medinan ? 'Mədinədə' : 'Məkkədə'} nazil olub. Aşağıda surənin ərəbcə tam mətni və Azərbaycan dilinə tərcüməsi verilir.`,
  },
  en: {
    h1: (s) => `Surah ${s.name}`,
    t: (s) => fit(...(s.meaning ? [`Surah ${s.name} (${s.meaning}) — Arabic Text & English Translation`] : []),
      `Surah ${s.name} — Arabic Text & English Translation`, `Surah ${s.name} — Arabic & English`),
    d: (s) => `Read Surah ${s.name}${s.meaning ? ` (${s.meaning})` : ''}, the ${enOrdinal(s.n)} surah of the Quran: ${s.ayahs} verses, revealed in ${s.medinan ? 'Medina' : 'Mecca'}. Full Arabic text with English translation and audio.`,
    intro: (s) => `Surah ${s.name}${s.meaning ? ` (“${s.meaning}”)` : ''} is the ${enOrdinal(s.n)} surah of the Quran. It has ${s.ayahs} verses and was revealed in ${s.medinan ? 'Medina' : 'Mecca'}. Below is the complete Arabic text of the surah with an English translation.`,
  },
  ru: {
    h1: (s) => `Сура ${s.name}`,
    t: (s) => fit(`Сура ${s.name} — арабский текст и перевод на русский`, `Сура ${s.name} — текст и перевод`),
    d: (s) => `Сура ${s.name}${s.meaning ? ` («${s.meaning}»)` : ''} — ${s.n}-я сура Корана, ${s.ayahs} ${ruPlural(s.ayahs, 'аят', 'аята', 'аятов')}, ниспослана в ${s.medinan ? 'Медине' : 'Мекке'}. Полный арабский текст, перевод смыслов на русский язык и аудио.`,
    intro: (s) => `Сура ${s.name}${s.meaning ? ` («${s.meaning}»)` : ''} — ${s.n}-я сура Корана. Она состоит из ${s.ayahs} ${ruPlural(s.ayahs, 'аята', 'аятов', 'аятов')} и была ниспослана в ${s.medinan ? 'Медине' : 'Мекке'}. Ниже приведён полный арабский текст суры и перевод смыслов на русский язык.`,
  },
  tr: {
    h1: (s) => `${s.name} Suresi`,
    t: (s) => fit(`${s.name} Suresi — Arapça Metni ve Türkçe Meali`, `${s.name} Suresi — Arapça ve Meali`),
    d: (s) => `${s.name} Suresi${s.meaning ? ` (${s.meaning})` : ''}: Kur’an’ın ${s.n}. suresi, ${s.ayahs} ayet, ${s.medinan ? 'Medine’de' : 'Mekke’de'} indi. Arapça metnin tamamı, Türkçe meali ve sesli okuma.`,
    intro: (s) => `${s.name} Suresi${s.meaning ? ` (“${s.meaning}”)` : ''}, Kur’an’ın ${s.n}. suresidir. ${s.ayahs} ayetten oluşur ve ${s.medinan ? 'Medine’de' : 'Mekke’de'} inmiştir. Aşağıda surenin Arapça metninin tamamı ve Türkçe meali yer alır.`,
  },
  ar: {
    h1: (s) => `سورة ${s.arName}`,
    t: (s) => fit(`سورة ${s.arName} — النص الكامل مع التفسير الميسر`, `سورة ${s.arName} — النص الكامل`),
    d: (s) => `اقرأ سورة ${s.arName}، السورة رقم ${s.n} في القرآن الكريم، ${s.medinan ? 'مدنية' : 'مكية'} وعدد آياتها ${s.ayahs}: النص العربي كاملاً مع التفسير الميسر والاستماع إلى التلاوة.`,
    intro: (s) => `سورة ${s.arName} هي السورة رقم ${s.n} في ترتيب المصحف، وهي سورة ${s.medinan ? 'مدنية' : 'مكية'} وعدد آياتها ${s.ayahs}. فيما يلي نص السورة كاملاً بالرسم العثماني مع التفسير الميسر.`,
  },
}

// ═══ 99 ad ══════════════════════════════════════════

/** Adın məlumatı: ərəbcə, transliterasiya, cari dildə məna (ərəbcədə yoxdur). */
export function nameInfo(n, lang) {
  const x = NAMES_99[n - 1]
  if (!x) return null
  // names99.js: "tr" — transliterasiya, türkcə məna "tr_meaning"-dədir
  const meaning = lang === 'ar' ? '' : lang === 'tr' ? (x.tr_meaning || '') : (x[lang] || '')
  return { n, ar: x.ar, translit: x.tr, meaning }
}

const NAMES = {
  az: {
    h1: (x) => `${x.translit} — ${x.meaning}`,
    t: (x) => fit(`${x.translit} (${x.ar}) — Allahın ${azOrdinal(x.n)} adı və mənası`, `${x.translit} — Allahın ${azOrdinal(x.n)} adı`),
    d: (x) => clamp(`${x.translit} (${x.ar}) — Allahın 99 gözəl adından ${azOrdinal(x.n)}. Mənası: «${x.meaning}». Ərəbcə yazılışı, oxunuşu və Əsmaül Hüsnanın tam siyahısı.`),
    intro: (x) => `${x.translit} Allahın 99 gözəl adının (Əsmaül Hüsna) ${azOrdinal(x.n)}sidir. Azərbaycan dilində mənası: «${x.meaning}».`,
  },
  en: {
    h1: (x) => `${x.translit} — ${x.meaning}`,
    t: (x) => fit(`${x.translit} (${x.ar}) — Meaning of the ${enOrdinal(x.n)} Name of Allah`, `${x.translit} — the ${enOrdinal(x.n)} Name of Allah`),
    d: (x) => clamp(`${x.translit} (${x.ar}) is the ${enOrdinal(x.n)} of the 99 Names of Allah (Asmaul Husna) meaning “${x.meaning}”. Arabic script, transliteration and all 99 names.`),
    intro: (x) => `${x.translit} is the ${enOrdinal(x.n)} of the 99 beautiful Names of Allah (Asmaul Husna). Its meaning in English: “${x.meaning}”.`,
  },
  ru: {
    h1: (x) => `${x.ar} — ${x.meaning}`,
    t: (x) => fit(`${x.meaning} (${x.ar}) — ${x.n}-е из 99 имён Аллаха`, `${x.ar} — ${x.n}-е из 99 имён Аллаха`),
    d: (x) => clamp(`${x.ar} — ${x.n}-е из 99 прекрасных имён Аллаха (Асма уль-Хусна). Значение: «${x.meaning}». Арабское написание, транскрипция и полный список всех имён.`),
    intro: (x) => `${x.ar} — ${x.n}-е из 99 прекрасных имён Аллаха (Асма уль-Хусна). Значение на русском языке: «${x.meaning}».`,
  },
  tr: {
    h1: (x) => `${x.translit} — ${x.meaning}`,
    t: (x) => fit(`${x.translit} (${x.ar}) — Allah’ın ${x.n}. İsmi ve Anlamı`, `${x.translit} — Allah’ın ${x.n}. İsmi`),
    d: (x) => clamp(`Allah’ın 99 güzel isminden ${x.n}. isim: ${x.translit} (${x.ar}). Anlamı: ${x.meaning}. Arapça yazılışı, okunuşu ve Esmaül Hüsna’nın tam listesi.`),
    intro: (x) => `${x.translit}, Allah’ın 99 güzel isminin (Esmaül Hüsna) ${x.n}. ismidir. Türkçe anlamı: ${x.meaning}.`,
  },
  ar: {
    h1: (x) => x.ar,
    t: (x) => fit(`${x.ar} — الاسم ${x.n} من أسماء الله الحسنى`, `${x.ar} — من أسماء الله الحسنى`),
    d: (x) => `${x.ar} هو الاسم رقم ${x.n} من أسماء الله الحسنى التسعة والتسعين. تعرّف على رسمه العربي ونطقه بالحروف اللاتينية، مع القائمة الكاملة للأسماء الحسنى.`,
    intro: (x) => `${x.ar} هو الاسم رقم ${x.n} من أسماء الله الحسنى التسعة والتسعين.`,
  },
}

// ═══ Səhabə ═════════════════════════════════════════

// Dilə görə sahə (SahabePage.jsx → pick ilə eyni: yoxdursa ingiliscə)
const pick = (obj, lang) => (obj && (obj[lang] || obj.en)) || ''
// "Hz." kimi qısaltmalardan sonra bölmədən cümlələr (SahabePage.jsx ilə eyni)
export function sentencesOf(text) {
  const out = []
  for (const p of String(text || '').split(/(?<=[.!?؟])\s+/)) {
    const prev = out[out.length - 1]
    if (prev && /(^|[\s(])\p{L}{1,2}\.$/u.test(prev)) out[out.length - 1] = `${prev} ${p}`
    else if (p) out.push(p)
  }
  return out
}
const isWoman = (s) => /\bbint\b/i.test(s.name.en)

/** Səhabənin profili (slug ilə). */
export function sahabaInfo(slug) {
  return SAHABA.find(s => slugOf(s) === slug) || null
}

/** Bioqrafiyanın ilk cümlələri — description üçün (≤ 160 simvol). */
function bioLead(s, lang, max = 160) {
  const parts = sentencesOf(pick(s.bio, lang))
  let out = ''
  for (const p of parts) {
    const next = out ? `${out} ${p}` : p
    if (next.length > max) break
    out = next
  }
  return out || clamp(parts[0] || '', max)
}

// more — description qısa qalanda bioqrafiyanın ardınca gələn cümlə
// (yalnız məlumatdakı saylar: faktların və hədislərin sayı)
const SAHABA_T = {
  az: { t: (n, ti) => fit(`${n} — ${ti}: həyatı və hədisləri`, `${n} — həyatı və hədisləri`),
        more: (f, h) => `Həyatı, ${f} əsas fakt və ${h} hədis.` },
  en: { t: (n, ti) => fit(`${n} — ${ti}: Life and Hadiths`, `${n} — Life and Hadiths`),
        more: (f, h) => `Biography, ${f} key facts and ${h} hadiths.` },
  ru: { t: (n, ti) => fit(`${n} — ${ti}: жизнь и хадисы`, `${n} — жизнь и хадисы`),
        more: (f, h) => `Биография, ключевые факты (${f}) и хадисы (${h}).` },
  tr: { t: (n, ti) => fit(`${n} — ${ti}: Hayatı ve Hadisleri`, `${n} — Hayatı ve Hadisleri`),
        more: (f, h) => `Hayatı, ${f} temel bilgi ve ${h} hadis.` },
  ar: {
    t: (n, ti, w) => fit(`${n} — ${ti}: ${w ? 'سيرتها وأحاديثها' : 'سيرته وأحاديثه'}`, `${n} — ${w ? 'سيرتها' : 'سيرته'}`),
    more: (f, h, w) => `${w ? 'سيرتها' : 'سيرته'} وحقائق أساسية (${f}) والأحاديث والآثار (${h}).`,
  },
}

// ═══ Sələf alimi ════════════════════════════════════

/** Alimin profili (slug ilə). */
export const scholarInfo = (slug) => scholarBySlug(slug)

const SCHOLAR_T = {
  az: { t: (n, ti) => fit(`${n} — ${ti}: həyatı və əsərləri`, `${n} — həyatı və əsərləri`) },
  en: { t: (n, ti) => fit(`${n} — ${ti}: Life and Works`, `${n} — Life and Works`) },
  ru: { t: (n, ti) => fit(`${n} — ${ti}: жизнь и труды`, `${n} — жизнь и труды`) },
  tr: { t: (n, ti) => fit(`${n} — ${ti}: Hayatı ve Eserleri`, `${n} — Hayatı ve Eserleri`) },
  ar: { t: (n, ti) => fit(`${n} — ${ti}: سيرته ومؤلفاته`, `${n} — سيرته ومؤلفاته`) },
}

/** Description: ömür aralığı + bir cümləlik xülasə (yalnız məlumatdan). */
function scholarDesc(x, lang) {
  const span = lifeSpan(x, lang)
  return clamp(`${pick(x.name, lang)}${span ? ` (${span})` : ''} — ${pick(x.summary, lang)}`)
}

// ═══ Dərs ═══════════════════════════════════════════

/** Dərsin meta məlumatı (slug ilə). */
export const lessonInfo = (slug) => lessonBySlug(slug)

const LESSON_T = {
  az: { t: (n) => fit(`${n} — dərs`, n) },
  en: { t: (n) => fit(`${n} — Lesson`, n) },
  ru: { t: (n) => fit(`${n} — урок`, n) },
  tr: { t: (n) => fit(`${n} — Ders`, n) },
  ar: { t: (n) => fit(`${n} — درس`, n) },
}

// ═══ Lüğət termini ═══════════════════════════════════
// İnsanlar terminin mənasını sual kimi axtarır: "təqva nədir", "what is
// taqwa in islam", "таква что это", "takva nedir", "معنى التقوى" — başlıq
// həmin sorğu formasındadır. Tarix terminləri (döyüş, hadisə) "nədir"
// sualına uyğun gəlmir — onlar üçün "İslam tarixində" forması.

export const GLOSSARY_CAT_LABEL = {
  aqidah:  { az: 'Əqidə', en: 'Creed', ru: 'Вероубеждение', ar: 'العقيدة', tr: 'Akide' },
  worship: { az: 'İbadət', en: 'Worship', ru: 'Поклонение', ar: 'العبادات', tr: 'İbadet' },
  fiqh:    { az: 'Fiqh və üsul', en: 'Fiqh & usul', ru: 'Фикх и усуль', ar: 'الفقه وأصوله', tr: 'Fıkıh ve usul' },
  quran:   { az: 'Quran elmləri', en: 'Quran sciences', ru: 'Науки Корана', ar: 'علوم القرآن', tr: 'Kur’an ilimleri' },
  hadith:  { az: 'Hədis elmi', en: 'Hadith science', ru: 'Наука хадиса', ar: 'علم الحديث', tr: 'Hadis ilmi' },
  akhlaq:  { az: 'Əxlaq və qəlb', en: 'Character & heart', ru: 'Нрав и сердце', ar: 'الأخلاق والقلوب', tr: 'Ahlak ve kalp' },
  history: { az: 'Tarix və siyər', en: 'History & sirah', ru: 'История и сира', ar: 'التاريخ والسيرة', tr: 'Tarih ve siyer' },
}

/** Termin (id ilə) və onun cari dildəki adı, ingiliscə qarşılığı, tərifi. */
export function termInfo(id, lang) {
  const x = glossaryItem(id)
  if (!x) return null
  return { ...x, name: glossaryName(x, lang), gloss: glossaryGloss(x), definition: x.def[lang] || x.def.en }
}

const TERM_MORE = {
  az: 'Ərəbcə yazılışı, oxunuşu və əlaqəli terminlər.',
  en: 'Arabic spelling, transliteration and related terms.',
  ru: 'Арабское написание, транскрипция и связанные термины.',
  tr: 'Arapça yazılışı, okunuşu ve ilgili terimler.',
  ar: 'مع الكتابة اللاتينية والمصطلحات ذات الصلة.',
}

// Tarix termini (döyüş, hadisə, yer) — "nədir" sualı əvəzinə "İslam tarixində"
const isHistory = (x) => x.cat === 'history'

const TERM_T = {
  az: { t: (x) => isHistory(x) ? fit(`${x.name} — İslam tarixində`, x.name) : fit(`${x.name} nədir? Mənası və izahı`, `${x.name} nədir?`, x.name) },
  en: {
    t: (x) => {
      const n = x.gloss ? `${x.name} (${x.gloss})` : x.name
      return isHistory(x)
        ? fit(`${n} — Islamic History`, `${x.gloss || x.name} — Islamic History`, x.gloss || x.name)
        : fit(`What Is ${n} in Islam? Meaning`, `What Is ${n} in Islam?`, `What Is ${x.name} in Islam?`, x.name)
    },
  },
  ru: { t: (x) => isHistory(x) ? fit(`${x.name} — история ислама`, x.name) : fit(`${x.name} — что это в исламе? Значение`, `${x.name} — что это в исламе?`, x.name) },
  tr: { t: (x) => isHistory(x) ? fit(`${x.name} — İslam tarihi`, x.name) : fit(`${x.name} nedir? İslam’da anlamı`, `${x.name} nedir?`, x.name) },
  // ərəbcə sual forması cinsə görə dəyişmir (وتعريفه/وتعريفها fərqi yoxdur)
  ar: { t: (x) => isHistory(x) ? fit(`${x.name} — من التاريخ الإسلامي`, x.name) : fit(`ما معنى ${x.name} في الإسلام؟ التعريف والشرح`, `ما معنى ${x.name} في الإسلام؟`, `معنى ${x.name}`, x.name) },
}

// ═══ Ümumi API ══════════════════════════════════════

/**
 * Detal səhifəsinin mətnləri: { t, d, h1, intro, crumb } və ya null.
 * t — title-ın səhifə hissəsi (brend şəkilçisi titleForDetail-də əlavə olunur).
 */
export function detailMeta(key, lang, param) {
  // Əlavə dildə Qurandan başqa detal (səhabə, dərs, termin…): məzmun yalnız 5
  // dildədir — ingiliscə mətn (maşın tərcüməsi yox; sahibin qərarı, 2026-11-06)
  if (isExtraLang(lang) && !EXTRA_PAGES.includes(key)) return detailMeta(key, 'en', param)
  if (key === 'quran') {
    const s = surahInfo(param, lang)
    const L = QURAN[lang] || INTL_QURAN[lang] || QURAN.az
    return s && { t: L.t(s), d: clamp(L.d(s)), h1: L.h1(s), intro: L.intro(s), crumb: lang === 'ar' ? s.arName : s.name }
  }
  if (key === 'names') {
    const x = nameInfo(param, lang)
    const L = NAMES[lang] || NAMES.az
    return x && { t: L.t(x), d: L.d(x), h1: L.h1(x), intro: L.intro(x), crumb: lang === 'ar' ? x.ar : x.translit }
  }
  if (key === 'sahaba') {
    const s = sahabaInfo(param)
    if (!s) return null
    const n = pick(s.name, lang)
    const L = SAHABA_T[lang] || SAHABA_T.az
    const lead = bioLead(s, lang)
    const withMore = `${lead} ${L.more(s.facts.length, s.hadiths.length, isWoman(s))}`
    const d = withMore.length <= 160 ? withMore : lead
    return { t: L.t(n, pick(s.title, lang), isWoman(s)), d, h1: n, intro: pick(s.title, lang), crumb: n }
  }
  if (key === 'learn') {
    const x = lessonInfo(param)
    if (!x) return null
    const n = pick(x.title, lang)
    const L = LESSON_T[lang] || LESSON_T.az
    return { t: L.t(n), d: clamp(pick(x.summary, lang)), h1: n, intro: pick(x.summary, lang), crumb: n }
  }
  if (key === 'scholars') {
    const x = scholarInfo(param)
    if (!x) return null
    const n = pick(x.name, lang)
    const L = SCHOLAR_T[lang] || SCHOLAR_T.az
    return { t: L.t(n, pick(x.title, lang)), d: scholarDesc(x, lang), h1: n, intro: pick(x.summary, lang), crumb: n }
  }
  if (key === 'glossary') {
    const x = termInfo(param, lang)
    if (!x) return null
    const L = TERM_T[lang] || TERM_T.az
    let d = lang === 'ar' ? `${x.name}: ${x.definition}` : `${x.name} (${x.ar}) — ${x.definition}`
    // Qısa tərif — səhifədə nə olduğunu deyən əlavə (təsvir axtarışda boş görünməsin)
    if (d.length < 80) d = `${d} ${TERM_MORE[lang] || TERM_MORE.az}`
    const h1 = lang === 'en' && x.gloss ? `${x.name} (${x.gloss})` : x.name
    return { t: L.t(x), d: clamp(d), h1, intro: x.definition, crumb: x.name }
  }
  return null
}

/** Tam <title>: "<səhifə> | Muslims.cc" — brend yalnız 60 simvola sığırsa (title.js → withBrand). */
export function titleForDetail(key, lang, param) {
  const m = detailMeta(key, lang, param)
  return m ? withBrand(m.t, brandName(lang)) : ''
}

// ── Breadcrumb adları (bölmə səviyyəsi) ──
export const SECTION_LABEL = {
  quran:  { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن الكريم', tr: 'Kur’an' },
  names:  { az: 'Allahın 99 adı', en: '99 Names of Allah', ru: '99 имён Аллаха', ar: 'أسماء الله الحسنى', tr: 'Allah’ın 99 İsmi' },
  sahaba: { az: 'Səhabələr', en: 'Companions', ru: 'Сахабы', ar: 'الصحابة', tr: 'Sahabeler' },
  scholars: { az: 'Alimlər', en: 'Scholars', ru: 'Учёные', ar: 'العلماء', tr: 'Âlimler' },
  learn:  { az: 'Dərslər', en: 'Lessons', ru: 'Уроки', ar: 'الدروس', tr: 'Dersler' },
  glossary: { az: 'İslami söz lüğəti', en: 'Islamic Glossary', ru: 'Исламский глоссарий', ar: 'قاموس المصطلحات الإسلامية', tr: 'İslami Sözlük' },
}

/** Bölmənin adı cari dildə (əlavə dildə — ingiliscənin lüğətdəki tərcüməsi). */
export function sectionLabel(key, lang) {
  const row = SECTION_LABEL[key]
  if (!row) return key
  if (row[lang]) return row[lang]
  return isExtraLang(lang) ? txt(row.en) : row.az
}

/** İz: Ana səhifə → bölmə → detal (hər addım { name, url }). */
export function crumbsFor(key, lang, param) {
  const m = detailMeta(key, lang, param)
  const items = [
    { name: brandName(lang), url: SITE + pathFor('home', lang) },
    { name: sectionLabel(key, lang), url: SITE + pathFor(key, lang) },
  ]
  if (m) items.push({ name: m.crumb, url: SITE + pathFor(key, lang, param) })
  return items
}

// Quranın adı — Chapter sxemindəki isPartOf (Book) üçün
const QURAN_BOOK = { az: 'Qurani-Kərim', en: 'The Holy Quran', ru: 'Священный Коран', ar: 'القرآن الكريم', tr: 'Kur’an-ı Kerim' }
// Əlavə dillər (yalnız Quran): bölmənin adı, kitabın adı, statik blokun
// yazıları (qalan açarlar ingiliscə — bu dillərdə başqa bölmə yoxdur)
for (const c of EXTRA_CODES) {
  SECTION_LABEL.quran[c] = INTL_QURAN_SECTION[c]
  QURAN_BOOK[c] = INTL_BODY_UI[c].book
}
const NAMES_SET = { az: 'Allahın 99 gözəl adı (Əsmaül Hüsna)', en: 'The 99 Names of Allah (Asmaul Husna)', ru: '99 прекрасных имён Аллаха (Асма уль-Хусна)', ar: 'أسماء الله الحسنى', tr: 'Allah’ın 99 güzel ismi (Esmaül Hüsna)' }

/**
 * Səhifə sxemi (schema.org): WebPage + breadcrumb + mainEntity.
 *   surə  → Chapter (isPartOf: Book "Quran"), position = surənin nömrəsi
 *   ad    → DefinedTerm (inDefinedTermSet: 99 ad), termCode = nömrə
 *   səhabə → Person (yalnız məlumatdakı sahələr: ad, ərəbcə ad, vəzifə)
 *   alim   → Person (ad, ərəbcə/tam ad, ləqəb, doğum/vəfat ili və yeri —
 *            yalnız məlumatda olan; "təxminən" il yazılmır)
 * Saxta Article/FAQ yoxdur — sxem yalnız səhifədə görünən məzmunu təsvir edir.
 */
export function detailJsonLd(key, lang, param) {
  const m = detailMeta(key, lang, param)
  if (!m) return null
  const url = SITE + pathFor(key, lang, param)
  const brand = brandName(lang)
  let main = null
  if (key === 'quran') {
    const s = surahInfo(param, lang)
    main = {
      '@type': 'Chapter',
      name: m.h1,
      alternateName: s.arFull,
      position: s.n,
      inLanguage: ['ar', lang].filter((v, i, a) => a.indexOf(v) === i),
      isPartOf: { '@type': 'Book', name: QURAN_BOOK[lang] || QURAN_BOOK.en, inLanguage: 'ar' },
      url,
    }
  } else if (key === 'names') {
    const x = nameInfo(param, lang)
    main = {
      '@type': 'DefinedTerm',
      name: lang === 'ar' ? x.ar : x.translit,
      alternateName: lang === 'ar' ? x.translit : x.ar,
      ...(x.meaning ? { description: x.meaning } : {}),
      termCode: String(x.n),
      inDefinedTermSet: { '@type': 'DefinedTermSet', name: NAMES_SET[lang] || NAMES_SET.en, url: SITE + pathFor('names', lang) },
      url,
    }
  } else if (key === 'sahaba') {
    const s = sahabaInfo(param)
    main = {
      '@type': 'Person',
      name: pick(s.name, lang),
      ...(lang !== 'ar' && s.name.ar ? { alternateName: s.name.ar } : {}),
      ...(pick(s.title, lang) ? { description: pick(s.title, lang) } : {}),
      url,
    }
  } else if (key === 'learn') {
    const x = lessonInfo(param)
    main = {
      '@type': 'LearningResource',
      name: m.h1,
      description: m.d,
      inLanguage: lang,
      learningResourceType: 'lesson',
      ...(CAT_BY_KEY[x.cat] ? { about: pick(CAT_BY_KEY[x.cat].label, lang) } : {}),
      ...(x.minutes ? { timeRequired: `PT${x.minutes}M` } : {}),
      url,
    }
  } else if (key === 'glossary') {
    const x = termInfo(param, lang)
    const alt = [lang !== 'ar' ? x.ar : null, x.translit, lang !== 'az' && lang !== 'ar' ? x.term : null]
      .filter((v, i, a) => v && v !== m.h1 && a.indexOf(v) === i)
    main = {
      '@type': 'DefinedTerm',
      name: m.h1,
      ...(alt.length ? { alternateName: alt } : {}),
      description: x.definition,
      inDefinedTermSet: { '@type': 'DefinedTermSet', name: sectionLabel('glossary', lang), url: SITE + pathFor('glossary', lang) },
      url,
    }
  } else if (key === 'scholars') {
    const x = scholarInfo(param)
    const alt = [lang !== 'ar' ? x.name.ar : null, pick(x.fullName, lang)].filter(v => v && v !== m.h1)
    const place = (p) => (p ? { '@type': 'Place', name: pick(p, lang) } : null)
    main = {
      '@type': 'Person',
      name: m.h1,
      ...(alt.length ? { alternateName: alt } : {}),
      ...(pick(x.title, lang) ? { jobTitle: pick(x.title, lang) } : {}),
      description: pick(x.summary, lang),
      ...(x.born && !x.born.approx && x.born.g ? { birthDate: String(x.born.g) } : {}),
      ...(x.died && !x.died.approx && x.died.g ? { deathDate: String(x.died.g) } : {}),
      ...(place(x.birthplace) ? { birthPlace: place(x.birthplace) } : {}),
      url,
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: titleForDetail(key, lang, param),
    description: m.d,
    url,
    inLanguage: lang,
    isPartOf: { '@type': 'WebSite', '@id': SITE + '/#website', name: brand, url: SITE + '/' },
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbsFor(key, lang, param).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
    },
    mainEntity: main,
  }
}

// ═══ Statik <body> blokunun yazıları (scripts/prerender.mjs) ═══
// Tətbiq yüklənəndə React bu bloku öz görünüşü ilə əvəz edir.
export const BODY_UI = {
  az: {
    category: 'Bölmə', arabic: 'Ərəbcə', termRelated: 'Əlaqəli terminlər', termLesson: 'Mövzu üzrə ətraflı dərs', sameCat: 'Bu bölmədən digər terminlər',
    prevTerm: 'Əvvəlki termin', nextTerm: 'Növbəti termin', allTerms: 'Lüğətin bütün terminləri', termList: 'Terminlərin siyahısı',
    prevLesson: 'Əvvəlki dərs', nextLesson: 'Növbəti dərs', allLessons: 'Bütün dərslər', sameLesson: 'Bu bölmədən', lessonList: 'Dərslərin siyahısı',
    crumbs: 'Səhifənin yeri', number: 'Sıra nömrəsi', ayahs: 'Ayə sayı', place: 'Nazil olma yeri', meaning: 'Mənası',
    mecca: 'Məkkə', medina: 'Mədinə', prevSurah: 'Əvvəlki surə', nextSurah: 'Növbəti surə', allSurahs: 'Bütün 114 surə',
    basmalah: 'Bismillahir-Rahmanir-Rahim', translation: 'Tərcümə', textSource: 'Ərəbcə mətn: Tanzil layihəsi (CC BY 3.0), dəyişdirilmədən göstərilir.',
    licenses: 'Lisenziyalar və mənbələr', translit: 'Oxunuşu', prevName: 'Əvvəlki ad', nextName: 'Növbəti ad', allNames: 'Allahın 99 adının hamısı',
    bio: 'Həyatı', facts: 'Əsas faktlar', hadiths: 'Hədislər və rəvayətlər', sources: 'Mənbələr', prevSahaba: 'Əvvəlki səhabə',
    nextSahaba: 'Növbəti səhabə', allSahaba: 'Bütün səhabələr', related: 'Digər səhabələr', surahList: 'Quranın 114 surəsi',
    nameList: 'Allahın 99 gözəl adı', sahabaList: 'Səhabələrin siyahısı', open: 'Tətbiqdə aç',
    life: 'Həyatı', contribution: 'Elmə töhfəsi', teachers: 'Müəllimləri', students: 'Tələbələri', works: 'Əsas əsərləri',
    praise: 'Alimlər onun haqqında', note: 'Qeyd', born: 'Doğulub', died: 'Vəfat edib', birthplace: 'Doğulduğu yer',
    city: 'Yaşadığı yer', era: 'Dövr', fullName: 'Tam adı', prevScholar: 'Əvvəlki alim', nextScholar: 'Növbəti alim',
    allScholars: 'Bütün alimlər', sameEra: 'Eyni dövrdən', scholarList: 'Alimlərin siyahısı',
  },
  en: {
    category: 'Section', arabic: 'Arabic', termRelated: 'Related terms', termLesson: 'In-depth lesson on this topic', sameCat: 'More terms from this section',
    prevTerm: 'Previous term', nextTerm: 'Next term', allTerms: 'All glossary terms', termList: 'List of terms',
    prevLesson: 'Previous lesson', nextLesson: 'Next lesson', allLessons: 'All lessons', sameLesson: 'From this section', lessonList: 'List of lessons',
    crumbs: 'You are here', number: 'Number', ayahs: 'Verses', place: 'Place of revelation', meaning: 'Meaning',
    mecca: 'Mecca', medina: 'Medina', prevSurah: 'Previous surah', nextSurah: 'Next surah', allSurahs: 'All 114 surahs',
    basmalah: 'In the Name of Allah, the Most Gracious, the Most Merciful', translation: 'Translation', textSource: 'Arabic text: Tanzil Project (CC BY 3.0), shown unchanged.',
    licenses: 'Licenses and sources', translit: 'Transliteration', prevName: 'Previous name', nextName: 'Next name', allNames: 'All 99 Names of Allah',
    bio: 'Biography', facts: 'Key facts', hadiths: 'Hadiths and narrations', sources: 'Sources', prevSahaba: 'Previous companion',
    nextSahaba: 'Next companion', allSahaba: 'All companions', related: 'Other companions', surahList: 'The 114 surahs of the Quran',
    nameList: 'The 99 beautiful Names of Allah', sahabaList: 'List of companions', open: 'Open in the app',
    life: 'Biography', contribution: 'Contribution to knowledge', teachers: 'Teachers', students: 'Students', works: 'Major works',
    praise: 'What scholars said about him', note: 'Note', born: 'Born', died: 'Died', birthplace: 'Birthplace',
    city: 'Lived in', era: 'Era', fullName: 'Full name', prevScholar: 'Previous scholar', nextScholar: 'Next scholar',
    allScholars: 'All scholars', sameEra: 'From the same era', scholarList: 'List of scholars',
  },
  ru: {
    category: 'Раздел', arabic: 'По-арабски', termRelated: 'Связанные термины', termLesson: 'Подробный урок по теме', sameCat: 'Другие термины из этого раздела',
    prevTerm: 'Предыдущий термин', nextTerm: 'Следующий термин', allTerms: 'Все термины глоссария', termList: 'Список терминов',
    prevLesson: 'Предыдущий урок', nextLesson: 'Следующий урок', allLessons: 'Все уроки', sameLesson: 'Из этого раздела', lessonList: 'Список уроков',
    crumbs: 'Вы здесь', number: 'Порядковый номер', ayahs: 'Число аятов', place: 'Место ниспослания', meaning: 'Значение',
    mecca: 'Мекка', medina: 'Медина', prevSurah: 'Предыдущая сура', nextSurah: 'Следующая сура', allSurahs: 'Все 114 сур',
    // lang-ok[BY]: lisenziyanın rəsmi adı (CC BY 3.0) tərcümə olunmur
    basmalah: 'Во имя Аллаха, Милостивого, Милосердного', translation: 'Перевод смыслов', textSource: 'Арабский текст: проект Танзиль (CC BY 3.0), приводится без изменений.',
    licenses: 'Лицензии и источники', translit: 'Транскрипция', prevName: 'Предыдущее имя', nextName: 'Следующее имя', allNames: 'Все 99 имён Аллаха',
    bio: 'Биография', facts: 'Ключевые факты', hadiths: 'Хадисы и предания', sources: 'Источники', prevSahaba: 'Предыдущий сахаба',
    nextSahaba: 'Следующий сахаба', allSahaba: 'Все сахабы', related: 'Другие сахабы', surahList: '114 сур Корана',
    nameList: '99 прекрасных имён Аллаха', sahabaList: 'Список сахабов', open: 'Открыть в приложении',
    life: 'Биография', contribution: 'Вклад в науку', teachers: 'Учителя', students: 'Ученики', works: 'Основные труды',
    praise: 'Учёные о нём', note: 'Примечание', born: 'Родился', died: 'Скончался', birthplace: 'Место рождения',
    city: 'Жил в', era: 'Эпоха', fullName: 'Полное имя', prevScholar: 'Предыдущий учёный', nextScholar: 'Следующий учёный',
    allScholars: 'Все учёные', sameEra: 'Из той же эпохи', scholarList: 'Список учёных',
  },
  tr: {
    category: 'Bölüm', arabic: 'Arapçası', termRelated: 'İlgili terimler', termLesson: 'Konuyla ilgili ayrıntılı ders', sameCat: 'Bu bölümden diğer terimler',
    prevTerm: 'Önceki terim', nextTerm: 'Sonraki terim', allTerms: 'Sözlüğün tüm terimleri', termList: 'Terimlerin listesi',
    prevLesson: 'Önceki ders', nextLesson: 'Sonraki ders', allLessons: 'Tüm dersler', sameLesson: 'Bu bölümden', lessonList: 'Ders listesi',
    crumbs: 'Buradasınız', number: 'Sıra numarası', ayahs: 'Ayet sayısı', place: 'İniş yeri', meaning: 'Anlamı',
    mecca: 'Mekke', medina: 'Medine', prevSurah: 'Önceki sure', nextSurah: 'Sonraki sure', allSurahs: 'Tüm 114 sure',
    basmalah: 'Bismillahirrahmanirrahim', translation: 'Meal', textSource: 'Arapça metin: Tanzil projesi (CC BY 3.0), değiştirilmeden gösterilir.',
    licenses: 'Lisanslar ve kaynaklar', translit: 'Okunuşu', prevName: 'Önceki isim', nextName: 'Sonraki isim', allNames: 'Allah’ın 99 isminin tamamı',
    bio: 'Hayatı', facts: 'Temel bilgiler', hadiths: 'Hadisler ve rivayetler', sources: 'Kaynaklar', prevSahaba: 'Önceki sahabe',
    nextSahaba: 'Sonraki sahabe', allSahaba: 'Tüm sahabeler', related: 'Diğer sahabeler', surahList: 'Kur’an’ın 114 suresi',
    nameList: 'Allah’ın 99 güzel ismi', sahabaList: 'Sahabelerin listesi', open: 'Uygulamada aç',
    life: 'Hayatı', contribution: 'İlme katkısı', teachers: 'Hocaları', students: 'Talebeleri', works: 'Başlıca eserleri',
    praise: 'Âlimler onun hakkında', note: 'Not', born: 'Doğumu', died: 'Vefatı', birthplace: 'Doğum yeri',
    city: 'Yaşadığı yer', era: 'Dönem', fullName: 'Tam adı', prevScholar: 'Önceki âlim', nextScholar: 'Sonraki âlim',
    allScholars: 'Tüm âlimler', sameEra: 'Aynı dönemden', scholarList: 'Âlimlerin listesi',
  },
  ar: {
    category: 'القسم', arabic: 'بالعربية', termRelated: 'مصطلحات ذات صلة', termLesson: 'درس مفصّل في الموضوع', sameCat: 'مصطلحات أخرى من هذا القسم',
    prevTerm: 'المصطلح السابق', nextTerm: 'المصطلح التالي', allTerms: 'جميع مصطلحات القاموس', termList: 'قائمة المصطلحات',
    prevLesson: 'الدرس السابق', nextLesson: 'الدرس التالي', allLessons: 'جميع الدروس', sameLesson: 'من هذا القسم', lessonList: 'قائمة الدروس',
    crumbs: 'أنت هنا', number: 'رقم السورة', ayahs: 'عدد الآيات', place: 'مكان النزول', meaning: 'المعنى',
    mecca: 'مكية', medina: 'مدنية', prevSurah: 'السورة السابقة', nextSurah: 'السورة التالية', allSurahs: 'جميع السور الـ114',
    // lang-ok[BY]: lisenziyanın rəsmi adı (CC BY 3.0) tərcümə olunmur
    basmalah: '', translation: 'التفسير الميسر', textSource: 'النص العربي: مشروع تنزيل (CC BY 3.0)، ويُعرض دون أي تعديل.',
    licenses: 'التراخيص والمصادر', translit: 'النطق', prevName: 'الاسم السابق', nextName: 'الاسم التالي', allNames: 'جميع أسماء الله الحسنى',
    bio: 'السيرة', facts: 'حقائق أساسية', hadiths: 'الأحاديث والآثار', sources: 'المصادر', prevSahaba: 'الصحابي السابق',
    nextSahaba: 'الصحابي التالي', allSahaba: 'جميع الصحابة', related: 'صحابة آخرون', surahList: 'سور القرآن الكريم الـ114',
    nameList: 'أسماء الله الحسنى التسعة والتسعون', sahabaList: 'قائمة الصحابة', open: 'افتح في التطبيق',
    life: 'السيرة', contribution: 'أثره في العلم', teachers: 'شيوخه', students: 'تلاميذه', works: 'أبرز مؤلفاته',
    praise: 'ثناء العلماء عليه', note: 'تنبيه', born: 'المولد', died: 'الوفاة', birthplace: 'مكان المولد',
    city: 'موطنه', era: 'الحقبة', fullName: 'الاسم الكامل', prevScholar: 'العالم السابق', nextScholar: 'العالم التالي',
    allScholars: 'جميع العلماء', sameEra: 'من الحقبة نفسها', scholarList: 'قائمة العلماء',
  },
}

for (const c of EXTRA_CODES) BODY_UI[c] = { ...BODY_UI.en, ...INTL_BODY_UI[c] }
