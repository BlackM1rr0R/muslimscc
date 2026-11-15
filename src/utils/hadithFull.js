// Hədisin tam mətni — ortaq (sayt + prerender, node-da da işləyir: .js uzantıları)
import { HADITH_FULL } from '../data/hadithFull.js'
import { narratorName, narratorSlug, narratorBySlug } from '../data/hadithNarrators.js'

export const FULL_T = {
  az: { narr: 'Rəvayət edən', full: 'Tam mətn', title: 'Hədisin tam mətni', arH: 'Ərəbcə (sənədi ilə)', trH: 'Tam tərcümə', note: 'Tam mətn və tərcümə hadith-api (fawazahmed0) nəşrindən olduğu kimi götürülüb. Azərbaycanca tam tərcüməsi olmayan hədislərdə türkcə və ingiliscə göstərilir.', loading: 'Yüklənir…', err: 'Mətn yüklənmədi. İnternet bağlantısını yoxlayın.', close: 'Bağla', prev: 'Əvvəlki', next: 'Növbəti', expl: 'Şərh', heNote: 'Azərbaycanca tərcümə, mənbə, dərəcə və şərh — Hədis ensiklopediyası (HadeethEnc.com), olduğu kimi.', heOpen: 'Mənbədə aç', grade: 'Dərəcə' }, // lang-ok[hadith-api,fawazahmed,HadeethEnc,ensiklopediyası]: mənbə adı
  en: { narr: 'Narrated by', full: 'Full text', title: 'Full text of the hadith', arH: 'Arabic (with chain)', trH: 'Full translation', note: 'Full text and translation taken verbatim from the hadith-api (fawazahmed0) edition.', loading: 'Loading…', err: 'Could not load the text. Check your connection.', close: 'Close', prev: 'Previous', next: 'Next', expl: 'Explanation', heNote: 'Translation, source, grade and explanation — the Encyclopedia of Hadith (HadeethEnc.com), verbatim.', heOpen: 'Open in the encyclopedia', grade: 'Grade' }, // lang-ok[hadith-api,fawazahmed,HadeethEnc]: mənbə adı
  ru: { narr: 'Передал', full: 'Полный текст', title: 'Полный текст хадиса', arH: 'Арабский (с иснадом)', trH: 'Полный перевод', note: 'Полный текст и перевод взяты без изменений из издания hadith-api (fawazahmed0).', loading: 'Загрузка…', err: 'Не удалось загрузить текст. Проверьте подключение.', close: 'Закрыть', prev: 'Предыдущий', next: 'Следующий', expl: 'Разъяснение', heNote: 'Перевод, источник, степень и разъяснение — Энциклопедия хадисов (HadeethEnc.com), без изменений.', heOpen: 'Открыть в энциклопедии', grade: 'Степень' }, // lang-ok[hadith-api,fawazahmed,HadeethEnc]: mənbə adı
  tr: { narr: 'Rivayet eden', full: 'Tam metin', title: 'Hadisin tam metni', arH: 'Arapça (senediyle)', trH: 'Tam tercüme', note: 'Tam metin ve tercüme hadith-api (fawazahmed0) baskısından olduğu gibi alınmıştır.', loading: 'Yükleniyor…', err: 'Metin yüklenemedi. Bağlantınızı kontrol edin.', close: 'Kapat', prev: 'Önceki', next: 'Sonraki', expl: 'Şerh', heNote: 'Tercüme, kaynak, derece ve şerh — Hadis Ansiklopedisi (HadeethEnc.com), olduğu gibi.', heOpen: 'Ansiklopedide aç', grade: 'Derece' }, // lang-ok[hadith-api,fawazahmed,HadeethEnc]: mənbə adı
  ar: { narr: 'الراوي', full: 'النص الكامل', title: 'النص الكامل للحديث', arH: 'النص بالسند', trH: 'الترجمة', note: 'النص الكامل منقول كما هو من نسخة hadith-api (fawazahmed0).', loading: 'جارٍ التحميل…', err: 'تعذّر تحميل النص.', close: 'إغلاق', prev: 'السابق', next: 'التالي', expl: 'الشرح', heNote: 'الترجمة والتخريج والحكم والشرح من موسوعة الأحاديث النبوية (HadeethEnc.com).', heOpen: 'افتح في الموسوعة', grade: 'الحكم' }, // lang-ok[hadith-api,fawazahmed,HadeethEnc]: mənbə adı
}

/** Kartda: "Rəvayət edən: Əbu Hureyrə" (ravi tanınmayıbsa null) */
export function narratorLine(id, lang) {
  const ids = HADITH_FULL[id]
  if (!ids) return null
  const sep = lang === 'ar' ? ' و' : lang === 'ru' ? ' и ' : lang === 'tr' ? ' ve ' : lang === 'az' ? ' və ' : ' and '
  return ids.split(',').map(k => narratorName(k, lang)).filter(Boolean).join(sep) || null
}
export const hasFull = (id) => id in HADITH_FULL


/** Kart üçün: [{ name, slug|null }] — profili olan səhabə keçid olur */
export function narratorParts(id, lang) {
  const ids = HADITH_FULL[id]
  if (!ids) return []
  return ids.split(',').map(k => ({ name: narratorName(k, lang), slug: narratorSlug(k) })).filter(x => x.name)
}

/** Səhabə profilinin slug-u → saytdakı rəvayətlərinin id-ləri */
export function hadithIdsBySahaba(slug) {
  const k = narratorBySlug(slug)
  if (!k) return []
  return Object.entries(HADITH_FULL).filter(([, v]) => v.split(',').includes(k)).map(([id]) => Number(id))
}
