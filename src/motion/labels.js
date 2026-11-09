// Motion komponentlərinin öz kiçik yazıları (5 dil; əlavə dillər pickUi lüğəti ilə)
import { pickUi } from '../utils/uiText'

const T = {
  az: { prev: 'Əvvəlki', next: 'Növbəti', close: 'Bağla', deck: 'Kart dəstəsi', orbit: 'Dairəvi zaman xətti' },
  en: { prev: 'Previous', next: 'Next', close: 'Close', deck: 'Card deck', orbit: 'Orbital timeline' },
  ru: { prev: 'Назад', next: 'Далее', close: 'Закрыть', deck: 'Колода карточек', orbit: 'Круговая хронология' },
  ar: { prev: 'السابق', next: 'التالي', close: 'إغلاق', deck: 'مجموعة بطاقات', orbit: 'خط زمني دائري' },
  tr: { prev: 'Önceki', next: 'Sonraki', close: 'Kapat', deck: 'Kart destesi', orbit: 'Dairesel zaman çizelgesi' },
}
export const motionLabels = (lang) => pickUi(T, lang, 'en')
/** "3 / 12" — dildən asılı olmayan, rəqəmli mövqe (ekran oxuyucu üçün tam cümlə ayrıca) */
export const posText = (i, n) => `${i + 1} / ${n}`
