// Surənin göstərilən adı: ərəbcədə ərəb adı, digər dillərdə yerli ad (data/surahNamesAz), yoxdursa latın
import { getSurahLocal } from '../../data/surahNamesAz'
import { surahInfo } from '../../utils/mushaf'

export const surahLabel = (s, lang) => (lang === 'ar' ? surahInfo(s)?.ar : (getSurahLocal(s, lang)?.name || surahInfo(s)?.latin || String(s)))
