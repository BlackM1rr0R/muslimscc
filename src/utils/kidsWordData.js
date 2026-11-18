// ═══════════════════════════════════════════════════════
// Uşaq oyunları üçün söz mənbəyi (krossvord + yaddaş cütləri)
//
// Hər şey saytın ÖZ məlumatından götürülür — burada yeni dini mətn yazılmır:
//  • Peyğəmbərlər — data/islamicHistory.js PROPHETS (ad, ərəbcə ad, qısa təsvir)
//  • Surələr — data/surahNamesAz.js (az/ru/tr ad + məna), data/mushafIndex.js
//    (ərəb adı, latın adı, ayə sayı), seo/surahMeta.js (ingiliscə məna)
//  • Allahın adları — KidsPage.jsx NAMES_OF_ALLAH siyahısının hərfi surəti
//    (emoji çıxarılıb). Səhifə bu faylı import edə bilər ki, iki nüsxə olmasın.
// Krossvord üçün söz hərflərə bölünür (cwLetters): böyük hərf (dilin qaydası
// ilə: tr/az i→İ), türkcə ^ işarəsi atılır, tire/boşluq/apostrof çıxarılır;
// ərəbcədə hərəkələr silinir.
// ═══════════════════════════════════════════════════════
import { PROPHETS } from '../data/islamicHistory'
import { SURAH_AZ, SURAH_RU, SURAH_TR } from '../data/surahNamesAz'
import { SURAH_TABLE } from '../data/mushafIndex'
import { SURAH_META } from '../seo/surahMeta'

// KidsPage.jsx → NAMES_OF_ALLAH (hərfi surət, emoji-siz)
export const KIDS_NAMES_OF_ALLAH = [
  { ar:'ٱللَّهُ', az:'Allah — Yeganə İlah', en:'Allah — the only God worthy of worship', ru:'Аллах — единственный Бог, достойный поклонения', ar_desc:'الله — الإله الواحد المستحق للعبادة', tr:'Allah — ibadete layık tek İlah' },
  { ar:'ٱلرَّحۡمَٰنُ', az:'Rəhman — Çox Mərhəmətli', en:'Ar-Rahman — The Most Merciful', ru:'Ар-Рахман — Всемилостивый', ar_desc:'الرحمن — كثير الرحمة', tr:'Rahman — Çok Merhametli' },
  { ar:'ٱلرَّحِيمُ', az:'Rəhim — Çox Rəhimli', en:'Ar-Rahim — The Most Compassionate', ru:'Ар-Рахим — Милосердный', ar_desc:'الرحيم — الرؤوف بعباده', tr:'Rahim — Çok Şefkatli' },
  { ar:'ٱلۡمَلِكُ', az:'Malik — Hökmdar', en:'Al-Malik — The King', ru:'Аль-Малик — Царь', ar_desc:'الملك — صاحب الملك', tr:'Melik — Hükümdar' },
  { ar:'ٱلسَّلَٰمُ', az:'Salam — Əmin-Amanlıq Verən', en:'As-Salam — The Source of Peace', ru:'Ас-Салам — Дарующий мир', ar_desc:'السلام — مصدر السلام', tr:'Selam — Barış Veren' },
  { ar:'ٱلۡخَٰلِقُ', az:'Xaliq — Hər Şeyi Yaradan', en:'Al-Khaliq — The Creator', ru:'Аль-Халик — Творец', ar_desc:'الخالق — خالق كل شيء', tr:'Halık — Her Şeyi Yaratan' },
  { ar:'ٱلۡغَفُورُ', az:'Ğəfur — Çox Bağışlayan', en:'Al-Ghafur — The Forgiving', ru:'Аль-Гафур — Прощающий', ar_desc:'الغفور — كثير المغفرة', tr:'Gafur — Çok Bağışlayan' },
  { ar:'ٱلرَّزَّاقُ', az:'Rəzzaq — Ruzi Verən', en:'Ar-Razzaq — The Provider', ru:'Ар-Раззак — Дарующий блага', ar_desc:'الرزاق — المتكفل بالرزق', tr:'Rezzak — Rızık Veren' },
  { ar:'ٱلسَّمِيعُ', az:'Səmi — Hər Şeyi Eşidən', en:'As-Sami — The All-Hearing', ru:'Ас-Сами — Всеслышащий', ar_desc:'السميع — يسمع كل شيء', tr:'Semi — Her Şeyi İşiten' },
  { ar:'ٱلۡوَدُودُ', az:'Vədud — Çox Sevən', en:'Al-Wadud — The Most Loving', ru:'Аль-Вадуд — Любящий', ar_desc:'الودود — كثير المحبة', tr:'Vedud — Çok Seven' },
  { ar:'ٱلۡعَزِيزُ', az:'Əziz — Qüdrətli', en:'Al-Aziz — The Almighty', ru:'Аль-Азиз — Могущественный', ar_desc:'العزيز — القوي الغالب', tr:'Aziz — Güçlü' },
  { ar:'ٱلۡحَكِيمُ', az:'Həkim — Hikmət Sahibi', en:'Al-Hakim — The All-Wise', ru:'Аль-Хаким — Мудрый', ar_desc:'الحكيم — صاحب الحكمة', tr:'Hakim — Hikmet Sahibi' },
  { ar:'ٱلۡعَلِيمُ', az:'Əlim — Hər Şeyi Bilən', en:'Al-Alim — The All-Knowing', ru:'Аль-Алим — Всезнающий', ar_desc:'العليم — يعلم كل شيء', tr:'Alim — Her Şeyi Bilen' },
  { ar:'ٱلۡبَصِيرُ', az:'Bəsir — Hər Şeyi Görən', en:'Al-Basir — The All-Seeing', ru:'Аль-Басир — Всевидящий', ar_desc:'البصير — يرى كل شيء', tr:'Basir — Her Şeyi Gören' },
  { ar:'ٱللَّطِيفُ', az:'Lətif — Lütf Edən', en:'Al-Latif — The Most Gentle', ru:'Аль-Латиф — Добрый', ar_desc:'اللطيف — الرفيق بعباده', tr:'Latif — Lütuf Sahibi' },
  { ar:'ٱلۡكَبِيرُ', az:'Kəbir — Ən Böyük', en:'Al-Kabir — The Greatest', ru:'Аль-Кабир — Величайший', ar_desc:'الكبير — العظيم', tr:'Kebir — En Büyük' },
  { ar:'ٱلۡحَفِيظُ', az:'Həfiz — Qoruyan', en:'Al-Hafiz — The Protector', ru:'Аль-Хафиз — Хранитель', ar_desc:'الحفيظ — الحافظ لعباده', tr:'Hafız — Koruyan' },
  { ar:'ٱلشَّكُورُ', az:'Şəkur — Şükür Qəbul Edən', en:'Ash-Shakur — The Appreciative', ru:'Аш-Шакур — Благодарный', ar_desc:'الشكور — يقبل الشكر', tr:'Şekur — Şükrü Kabul Eden' },
  { ar:'ٱلۡحَيُّ', az:'Həyy — Əbədi Diri', en:'Al-Hayy — The Ever-Living', ru:'Аль-Хайй — Вечно Живой', ar_desc:'الحي — الدائم الحياة', tr:'Hayy — Daima Diri' },
  { ar:'ٱلۡقَيُّومُ', az:'Qayyum — Hər Şeyi Saxlayan', en:'Al-Qayyum — The Self-Sustaining', ru:'Аль-Каюм — Самодостаточный', ar_desc:'القيوم — القائم بذاته', tr:'Kayyum — Her Şeyi Ayakta Tutan' },
  { ar:'ٱلۡوَاحِدُ', az:'Vahid — Tək Olan', en:'Al-Wahid — The One', ru:'Аль-Вахид — Единственный', ar_desc:'الواحد — الأحد', tr:'Vahid — Tek Olan' },
  { ar:'ٱلۡقَادِرُ', az:'Qadir — Hər Şeyə Qadir', en:'Al-Qadir — The All-Powerful', ru:'Аль-Кадир — Всемогущий', ar_desc:'القادر — القادر على كل شيء', tr:'Kadir — Her Şeye Gücü Yeten' },
  { ar:'ٱلۡأَوَّلُ', az:'Əvvəl — Başlanğıcı Olmayan', en:'Al-Awwal — The First', ru:'Аль-Авваль — Первый', ar_desc:'الأول — ليس لوجوده بداية', tr:'Evvel — İlk Olan' },
  { ar:'ٱلۡآخِرُ', az:'Axir — Sonu Olmayan', en:'Al-Akhir — The Last', ru:'Аль-Ахир — Последний', ar_desc:'الآخر — ليس لوجوده نهاية', tr:'Ahir — Son Olan' },
  { ar:'ٱلنُّورُ', az:'Nur — İşıq, Nur Sahibi', en:'An-Nur — The Light', ru:'Ан-Нур — Свет', ar_desc:'النور — نور السماوات والأرض', tr:'Nur — Işık Sahibi' },
]

export const WORD_THEMES = ['prophets', 'surahs', 'names']

const LOCALE = { az: 'az', tr: 'tr', ru: 'ru', en: 'en' } // lang-ok: locale kodları cədvəli (mətn deyil)
const AR_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g

/** Ərəb sözünü sadələşdir: hərəkələr, təthil, ﷺ, boşluq yox; ٱ → ا */
export function plainArabic(s) {
  return String(s || '').replace(/ﷺ/g, '').replace(AR_MARKS, '').replace(/ٱ/g, 'ا').replace(/\s+/g, ' ').trim()
}

/** Krossvord hərfləri (massiv) və ya null (söz uyğun deyil) */
export function cwLetters(word, lang) {
  if (lang === 'ar') {
    const s = plainArabic(word)
    if (!/^[\u0621-\u064A]+$/.test(s)) return null
    return [...s]
  }
  let s = String(word || '').normalize('NFD').replace(/\u0302/g, '').normalize('NFC')
  s = s.replace(/[\s\-'’ʼʿ`.]/g, '')
  s = s.toLocaleUpperCase(LOCALE[lang] || 'en')
  if (!/^[\p{Script=Latin}\p{Script=Cyrillic}]+$/u.test(s)) return null
  return [...s]
}

/** Bir hərfi cavabla müqayisə üçün normallaşdır (istifadəçinin yazdığı) */
export function cwKey(ch, lang) {
  if (!ch) return ''
  const l = cwLetters(ch, lang)
  return l && l.length === 1 ? l[0] : ''
}

/** Artikl: Al-/An-/Ар-/ال… (yalnız surə və ad sözləri üçün) */
export function dropArticle(name, lang) {
  const s = String(name || '').trim()
  if (lang === 'en') return s.replace(/^A[a-z]{1,2}-/, '')
  if (lang === 'ru') return s.replace(/^А[а-яё]{1,2}[- ]/, '')
  if (lang === 'ar') {
    const p = plainArabic(s)
    return p !== 'الله' && p.startsWith('ال') && p.length >= 5 ? p.slice(2) : p
  }
  return s
}

const cleanName = (s) => String(s || '').replace(/\s*\(.*?\)/g, '').replace(/\s*ﷺ/g, '').trim()

/** Təsvirin əvvəli: ən azı ~25 simvol olana qədər cümlələr */
export function firstSentences(text, min = 25) {
  const parts = String(text || '').match(/[^.!?؟]+[.!?؟]*/g) || []
  let out = ''
  for (const p of parts) {
    out += p
    if (out.trim().length >= min) break
  }
  return out.trim()
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Cavab ipucunda görünməsin */
export function maskWord(text, word) {
  const w = String(word || '').trim()
  if (!w) return text
  return String(text).replace(new RegExp(escRe(w), 'giu'), '…')
}

const CLUE = {
  az: { surah: (n, a) => `${n}-cü surə, ${a} ayə` },
  en: { surah: (n, a) => `Surah ${n}, ${a} ayahs` },
  ru: { surah: (n, a) => `Сура ${n}, аятов: ${a}` },
  tr: { surah: (n, a) => `${n}. sure, ${a} ayet` },
  ar: { surah: (n, a) => `السورة رقم ${n}، آياتها ${a}` },
}

const SURAH_LOCAL = { az: SURAH_AZ, ru: SURAH_RU, tr: SURAH_TR } // lang-ok: dil → surə adları cədvəli (en/ar başqa mənbədən)
function surahLocal(n, lang) {
  const row = SURAH_TABLE[n - 1]
  if (lang === 'ar') return { name: row[4], meaning: '' }
  if (lang === 'en') return { name: row[5], meaning: SURAH_META[n - 1]?.[2] || '' }
  const loc = SURAH_LOCAL[lang]?.[n]
  return loc ? { name: loc.name, meaning: loc.meaning } : { name: row[5], meaning: SURAH_META[n - 1]?.[2] || '' }
}

const splitDash = (s) => { const i = String(s).indexOf(' — '); return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 3)] }
function nameOfAllah(n, lang) {
  const [name, meaning] = splitDash(lang === 'ar' ? n.ar_desc : (n[lang] || n.en))
  return { name: name.trim(), meaning: meaning.trim() }
}

const L = (lang) => (['az', 'en', 'ru', 'tr', 'ar'].includes(lang) ? lang : 'en')

/**
 * Krossvord üçün sözlər: [{ id, answer, letters, clue }]
 * theme: 'prophets' | 'surahs' | 'names'
 */
export function crosswordEntries(theme, lang) {
  lang = L(lang)
  const out = []
  const push = (id, answer, clue) => {
    const letters = cwLetters(answer, lang)
    if (!letters || !clue) return
    out.push({ id, answer: lang === 'ar' ? plainArabic(answer) : answer, letters, clue })
  }
  if (theme === 'prophets') {
    for (const p of PROPHETS) {
      const name = lang === 'ar' ? plainArabic(p.arabic) : cleanName(p.name[lang])
      push(`p${p.num}`, name, maskWord(firstSentences(p.desc[lang]), name))
    }
  } else if (theme === 'surahs') {
    SURAH_TABLE.forEach((row, i) => {
      const n = i + 1
      const loc = surahLocal(n, lang)
      const word = dropArticle(loc.name, lang)
      const num = CLUE[lang].surah(n, row[2])
      const lw = (cwLetters(word, lang) || []).join('')
      const lm = (cwLetters(loc.meaning, lang) || []).join('')
      const meaningOk = loc.meaning && !(lw && lm.includes(lw)) && !(lm && lw.includes(lm))
      push(`s${n}`, word, meaningOk ? `${maskWord(loc.meaning, word)} — ${num}` : num)
    })
  } else if (theme === 'names') {
    KIDS_NAMES_OF_ALLAH.forEach((n, i) => {
      const { name, meaning } = nameOfAllah(n, lang)
      const word = dropArticle(name, lang)
      push(`n${i + 1}`, word, maskWord(meaning, word))
    })
  }
  // Təkrar sözlər yox
  const seen = new Set()
  return out.filter(e => { const k = e.letters.join(''); if (seen.has(k)) return false; seen.add(k); return true })
}

/** Uşaqların ilk öyrəndiyi surələr: Fatihə + 30-cu cüz (78–114) */
const KIDS_SURAHS = [1, ...Array.from({ length: 37 }, (_, i) => 78 + i)]

/**
 * Yaddaş oyunu cütləri: [{ id, a: { text, lang }, b: { text, lang } }]
 * a — həmişə ərəbcə; b — UI dilində (ar üçün latın yazılışı)
 */
export function memoryPairs(theme, lang) {
  lang = L(lang)
  const bl = lang === 'ar' ? 'en' : lang
  if (theme === 'prophets') {
    return PROPHETS.map(p => ({ id: `p${p.num}`, a: { text: plainArabic(p.arabic), lang: 'ar' }, b: { text: cleanName(p.name[bl]), lang: bl } }))
  }
  if (theme === 'surahs') {
    return KIDS_SURAHS.map(n => ({ id: `s${n}`, a: { text: SURAH_TABLE[n - 1][4], lang: 'ar' }, b: { text: surahLocal(n, bl).name, lang: bl } }))
  }
  if (theme === 'names') {
    return KIDS_NAMES_OF_ALLAH.map((n, i) => {
      const m = nameOfAllah(n, lang).meaning
      return m ? { id: `n${i + 1}`, a: { text: n.ar, lang: 'ar' }, b: { text: m, lang } } : null
    }).filter(Boolean)
  }
  return []
}
