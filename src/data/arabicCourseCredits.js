// ═══════════════════════════════════════════════════════
// Ərəb kursu — hərf səslərinin mənbəyi və lisenziyası (atribusiya)
//
// Bütün fayllar Wikimedia Commons-dakı Lingua Libre yazılarıdır (ərəb dili,
// Q13955). Lisenziya hər fayl üçün Commons API (prop=imageinfo,
// iiprop=extmetadata → LicenseShortName) və səhifənin vikimətni ilə
// 2026-10-30-da yoxlanılıb. Yazıda danışan hərfin özünü (transcription =
// hərf) oxuyur.
//
// Dəyişiklik (CC BY / BY-SA tələbi ilə qeyd olunur): 48 kHz → 24 kHz
// (pəncərəli sinc süzgəci ilə), pik −1 dBFS-ə normallaşdırılıb, kənarlara
// 10 ms keçid; format eyni qalıb (WAV PCM 16-bit mono — iOS Safari oxuyur).
// BY-SA faylların dəyişdirilmiş nüsxəsi də eyni lisenziya ilə paylaşılır.
//
// Koordinator: /licenses səhifəsinə (src/pages/LicensesPage.jsx) aşağıdakı
// ARABIC_AUDIO_SOURCES kartlarını əlavə et. Hecaların (بَ بِ بُ …) açıq
// lisenziyalı səsi tapılmadı — onlar üçün səs düyməsi YOXDUR.
// Quran nümunələrinin səsi: cdn.islamic.network (ar.alafasy) — /licenses-də
// artıq "Islamic Network CDN" kimi var.
// ═══════════════════════════════════════════════════════

const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/'
const CC_BY_SA_3 = 'https://creativecommons.org/licenses/by-sa/3.0/'
const CC_BY_4 = 'https://creativecommons.org/licenses/by/4.0/'

export const AUDIO_CHANGES = {
  az: 'Səslər 24 kHz-ə endirilib və səs səviyyəsi bərabərləşdirilib.',
  en: 'Resampled to 24 kHz and loudness-normalised.',
  ru: 'Частота дискретизации понижена до 24 кГц, громкость выровнена.',
  ar: 'خُفّض معدل العيّنات إلى ٢٤ كيلوهرتز وسُوّي مستوى الصوت.',
  tr: 'Ses dosyaları 24 kHz’e düşürüldü ve ses seviyesi eşitlendi.',
}

// LicensesPage kart formatı: { name, url, license, licenseUrl, by, note }
export const ARABIC_AUDIO_SOURCES = [
  {
    name: 'Lingua Libre — AlNatiq', url: 'https://commons.wikimedia.org/wiki/User:AlNatiq',
    license: 'CC0 1.0', licenseUrl: CC0, by: 'AlNatiq',
    note: {
      az: 'Ərəb kursunda 23 hərfin tələffüzü: ا ت ث ج ح خ ذ ر س ش ص ض ط ع غ ف ق ك ل م ن ه ي.',
      en: 'Pronunciation of 23 letters in the Arabic course: ا ت ث ج ح خ ذ ر س ش ص ض ط ع غ ف ق ك ل م ن ه ي.',
      ru: 'Произношение 23 букв в курсе арабского: ا ت ث ج ح خ ذ ر س ش ص ض ط ع غ ف ق ك ل م ن ه ي.',
      ar: 'نطق ٢٣ حرفًا في درس الحروف العربية: ا ت ث ج ح خ ذ ر س ش ص ض ط ع غ ف ق ك ل م ن ه ي.',
      tr: 'Arapça kursunda 23 harfin telaffuzu: ا ت ث ج ح خ ذ ر س ش ص ض ط ع غ ف ق ك ل م ن ه ي.',
    },
  },
  {
    name: 'Lingua Libre — Zinou2go', url: 'https://commons.wikimedia.org/wiki/User:Zinou2go',
    license: 'CC BY-SA 3.0', licenseUrl: CC_BY_SA_3, by: 'Zinou2go',
    note: {
      az: 'Ərəb kursunda 4 hərfin tələffüzü: ب د ز و. Səslər 24 kHz-ə endirilib və səs səviyyəsi bərabərləşdirilib.',
      en: 'Pronunciation of 4 letters in the Arabic course: ب د ز و. Resampled to 24 kHz and loudness-normalised.',
      ru: 'Произношение 4 букв в курсе арабского: ب د ز و. Частота дискретизации понижена до 24 кГц, громкость выровнена.',
      ar: 'نطق ٤ حروف في درس الحروف العربية: ب د ز و. خُفّض معدل العيّنات إلى ٢٤ كيلوهرتز وسُوّي مستوى الصوت.',
      tr: 'Arapça kursunda 4 harfin telaffuzu: ب د ز و. Ses dosyaları 24 kHz’e düşürüldü ve ses seviyesi eşitlendi.',
    },
  },
  {
    name: 'Lingua Libre — Rashed Aljahdali', url: 'https://commons.wikimedia.org/wiki/User:Rashed_Aljahdali',
    license: 'CC BY 4.0', licenseUrl: CC_BY_4, by: 'Rashed Aljahdali',
    note: {
      az: 'Ərəb kursunda ظ hərfinin tələffüzü. Səs 24 kHz-ə endirilib və səs səviyyəsi bərabərləşdirilib.',
      en: 'Pronunciation of the letter ظ in the Arabic course. Resampled to 24 kHz and loudness-normalised.',
      ru: 'Произношение буквы ظ в курсе арабского. Частота дискретизации понижена до 24 кГц, громкость выровнена.',
      ar: 'نطق حرف الظاء في درس الحروف العربية. خُفّض معدل العيّنات إلى ٢٤ كيلوهرتز وسُوّي مستوى الصوت.',
      tr: 'Arapça kursunda ظ harfinin telaffuzu. Ses 24 kHz’e düşürüldü ve ses seviyesi eşitlendi.',
    },
  },
]

// Fayl-fayl siyahı: hərf → Commons faylı, müəllif, lisenziya (bytes — yüklənən ölçü)
export const ARABIC_AUDIO_FILES = [
  { id: 'alif', letter: 'ا', file: '/audio/arabic/alif.wav', bytes: 31532, title: 'File:LL-Q13955 (ara)-AlNatiq-ا.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%A7.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'ba', letter: 'ب', file: '/audio/arabic/ba.wav', bytes: 30124, title: 'File:LL-Q13955 (ara)-Zinou2go-ب.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Zinou2go-%D8%A8.wav', author: 'Zinou2go', license: 'CC BY-SA 3.0', licenseUrl: CC_BY_SA_3 },
  { id: 'ta', letter: 'ت', file: '/audio/arabic/ta.wav', bytes: 31788, title: 'File:LL-Q13955 (ara)-AlNatiq-ت.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%AA.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'tha', letter: 'ث', file: '/audio/arabic/tha.wav', bytes: 40108, title: 'File:LL-Q13955 (ara)-AlNatiq-ث.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%AB.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'jim', letter: 'ج', file: '/audio/arabic/jim.wav', bytes: 35116, title: 'File:LL-Q13955 (ara)-AlNatiq-ج.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%AC.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'ha', letter: 'ح', file: '/audio/arabic/ha.wav', bytes: 30892, title: 'File:LL-Q13955 (ara)-AlNatiq-ح.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%AD.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'kha', letter: 'خ', file: '/audio/arabic/kha.wav', bytes: 31020, title: 'File:LL-Q13955 (ara)-AlNatiq-خ.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%AE.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'dal', letter: 'د', file: '/audio/arabic/dal.wav', bytes: 50604, title: 'File:LL-Q13955 (ara)-Zinou2go-د.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Zinou2go-%D8%AF.wav', author: 'Zinou2go', license: 'CC BY-SA 3.0', licenseUrl: CC_BY_SA_3 },
  { id: 'dhal', letter: 'ذ', file: '/audio/arabic/dhal.wav', bytes: 39852, title: 'File:LL-Q13955 (ara)-AlNatiq-ذ.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%B0.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'ra', letter: 'ر', file: '/audio/arabic/ra.wav', bytes: 37548, title: 'File:LL-Q13955 (ara)-AlNatiq-ر.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%B1.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'zay', letter: 'ز', file: '/audio/arabic/zay.wav', bytes: 50604, title: 'File:LL-Q13955 (ara)-Zinou2go-ز.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Zinou2go-%D8%B2.wav', author: 'Zinou2go', license: 'CC BY-SA 3.0', licenseUrl: CC_BY_SA_3 },
  { id: 'sin', letter: 'س', file: '/audio/arabic/sin.wav', bytes: 37548, title: 'File:LL-Q13955 (ara)-AlNatiq-س.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%B3.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'shin', letter: 'ش', file: '/audio/arabic/shin.wav', bytes: 38316, title: 'File:LL-Q13955 (ara)-AlNatiq-ش.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%B4.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'sad', letter: 'ص', file: '/audio/arabic/sad.wav', bytes: 31276, title: 'File:LL-Q13955 (ara)-AlNatiq-ص.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%B5.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'dad', letter: 'ض', file: '/audio/arabic/dad.wav', bytes: 33708, title: 'File:LL-Q13955 (ara)-AlNatiq-ض.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%B6.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'ta2', letter: 'ط', file: '/audio/arabic/ta2.wav', bytes: 39852, title: 'File:LL-Q13955 (ara)-AlNatiq-ط.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%B7.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'za2', letter: 'ظ', file: '/audio/arabic/za2.wav', bytes: 32300, title: 'File:LL-Q13955 (ara)-Rashed Aljahdali-ظ.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Rashed_Aljahdali-%D8%B8.wav', author: 'Rashed Aljahdali', license: 'CC BY 4.0', licenseUrl: CC_BY_4 },
  { id: 'ayn', letter: 'ع', file: '/audio/arabic/ayn.wav', bytes: 39212, title: 'File:LL-Q13955 (ara)-AlNatiq-ع.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%B9.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'ghayn', letter: 'غ', file: '/audio/arabic/ghayn.wav', bytes: 42028, title: 'File:LL-Q13955 (ara)-AlNatiq-غ.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D8%BA.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'fa', letter: 'ف', file: '/audio/arabic/fa.wav', bytes: 41388, title: 'File:LL-Q13955 (ara)-AlNatiq-ف.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D9%81.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'qaf', letter: 'ق', file: '/audio/arabic/qaf.wav', bytes: 33836, title: 'File:LL-Q13955 (ara)-AlNatiq-ق.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D9%82.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'kaf', letter: 'ك', file: '/audio/arabic/kaf.wav', bytes: 35372, title: 'File:LL-Q13955 (ara)-AlNatiq-ك.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D9%83.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'lam', letter: 'ل', file: '/audio/arabic/lam.wav', bytes: 42668, title: 'File:LL-Q13955 (ara)-AlNatiq-ل.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D9%84.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'mim', letter: 'م', file: '/audio/arabic/mim.wav', bytes: 41132, title: 'File:LL-Q13955 (ara)-AlNatiq-م.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D9%85.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'nun', letter: 'ن', file: '/audio/arabic/nun.wav', bytes: 34860, title: 'File:LL-Q13955 (ara)-AlNatiq-ن.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D9%86.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'ha2', letter: 'ه', file: '/audio/arabic/ha2.wav', bytes: 41772, title: 'File:LL-Q13955 (ara)-AlNatiq-ه.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D9%87.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
  { id: 'waw', letter: 'و', file: '/audio/arabic/waw.wav', bytes: 46508, title: 'File:LL-Q13955 (ara)-Zinou2go-و.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Zinou2go-%D9%88.wav', author: 'Zinou2go', license: 'CC BY-SA 3.0', licenseUrl: CC_BY_SA_3 },
  { id: 'ya', letter: 'ي', file: '/audio/arabic/ya.wav', bytes: 34604, title: 'File:LL-Q13955 (ara)-AlNatiq-ي.wav', page: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-AlNatiq-%D9%8A.wav', author: 'AlNatiq', license: 'CC0', licenseUrl: CC0 },
]
