// Hədisin tam mətni — ortaq (sayt + prerender, node-da da işləyir: .js uzantıları)
import { HADITH_FULL } from '../data/hadithFull.js'
import { narratorName } from '../data/hadithNarrators.js'

export const FULL_T = {
  az: { narr: 'Rəvayət edən', full: 'Tam mətn', title: 'Hədisin tam mətni', arH: 'Ərəbcə (sənədi ilə)', trH: 'Tam tərcümə', note: 'Tam mətn və tərcümə hadith-api (fawazahmed0) nəşrindən olduğu kimi götürülüb. Azərbaycan dilində tam tərcümə mənbəsi olmadığı üçün türkcə və ingiliscə göstərilir.', loading: 'Yüklənir…', err: 'Mətn yüklənmədi. İnternet bağlantısını yoxlayın.', close: 'Bağla', prev: 'Əvvəlki', next: 'Növbəti' }, // lang-ok[hadith-api,fawazahmed]: mənbə adı
  en: { narr: 'Narrated by', full: 'Full text', title: 'Full text of the hadith', arH: 'Arabic (with chain)', trH: 'Full translation', note: 'Full text and translation taken verbatim from the hadith-api (fawazahmed0) edition.', loading: 'Loading…', err: 'Could not load the text. Check your connection.', close: 'Close', prev: 'Previous', next: 'Next' }, // lang-ok[hadith-api,fawazahmed]: mənbə adı
  ru: { narr: 'Передал', full: 'Полный текст', title: 'Полный текст хадиса', arH: 'Арабский (с иснадом)', trH: 'Полный перевод', note: 'Полный текст и перевод взяты без изменений из издания hadith-api (fawazahmed0).', loading: 'Загрузка…', err: 'Не удалось загрузить текст. Проверьте подключение.', close: 'Закрыть', prev: 'Предыдущий', next: 'Следующий' }, // lang-ok[hadith-api,fawazahmed]: mənbə adı
  tr: { narr: 'Rivayet eden', full: 'Tam metin', title: 'Hadisin tam metni', arH: 'Arapça (senediyle)', trH: 'Tam tercüme', note: 'Tam metin ve tercüme hadith-api (fawazahmed0) baskısından olduğu gibi alınmıştır.', loading: 'Yükleniyor…', err: 'Metin yüklenemedi. Bağlantınızı kontrol edin.', close: 'Kapat', prev: 'Önceki', next: 'Sonraki' }, // lang-ok[hadith-api,fawazahmed]: mənbə adı
  ar: { narr: 'الراوي', full: 'النص الكامل', title: 'النص الكامل للحديث', arH: 'النص بالسند', trH: 'الترجمة', note: 'النص الكامل منقول كما هو من نسخة hadith-api (fawazahmed0).', loading: 'جارٍ التحميل…', err: 'تعذّر تحميل النص.', close: 'إغلاق', prev: 'السابق', next: 'التالي' }, // lang-ok[hadith-api,fawazahmed]: mənbə adı
}

/** Kartda: "Rəvayət edən: Əbu Hureyrə" (ravi tanınmayıbsa null) */
export function narratorLine(id, lang) {
  const ids = HADITH_FULL[id]
  if (!ids) return null
  const sep = lang === 'ar' ? ' و' : lang === 'ru' ? ' и ' : lang === 'tr' ? ' ve ' : lang === 'az' ? ' və ' : ' and '
  return ids.split(',').map(k => narratorName(k, lang)).filter(Boolean).join(sep) || null
}
export const hasFull = (id) => id in HADITH_FULL

