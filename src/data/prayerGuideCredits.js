// ═══════════════════════════════════════════════════════
// Namaz bələdçisindəki səslərin mənbəyi və lisenziyası
//
// Fayllar public/audio/prayer/ altındadır, dəyişdirilmədən (WAV, PCM —
// iOS Safari daxil bütün brauzerlər oxuyur; OGG istifadə olunmur).
// Yoxlanılıb: 2026-10-30, Wikimedia Commons API (extmetadata.LicenseShortName).
//
// Wikimedia Commons-da namaz zikrlərinin (rüku/səcdə təsbihləri, təşəhhüd,
// salavat, salam, istiftah və s.) açıq lisenziyalı səsi TAPILMADI — o zikrlər
// üçün səs düyməsi göstərilmir (TTS və ya uydurma səs yoxdur).
//
// Fatihə və İxlas — layihənin Quran səsi (utils/quranAudio.js):
// Mişari Raşid əl-Əfasi, cdn.islamic.network (alquran.cloud CDN), ayə-ayə MP3.
// ═══════════════════════════════════════════════════════

export const AUDIO_CREDITS = {
  takbir: {
    file: '/audio/prayer/takbir.wav',
    title: 'Allahu Akbar',
    author: 'Ajron Bach',
    site: 'Lingua Libre / Wikimedia Commons',
    url: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Ajron_Bach-Allahu_Akbar_(noun).wav',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  amin: {
    file: '/audio/prayer/amin.wav',
    title: 'آمين',
    author: 'Fenakhay',
    site: 'Lingua Libre / Wikimedia Commons',
    url: 'https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Fenakhay-%D8%A2%D9%85%D9%8A%D9%86.wav',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  quran: {
    title: 'Al-Fatiha 1:1–7, Al-Ikhlas 112:1–4',
    author: 'Mishary Rashid Alafasy',
    site: 'cdn.islamic.network (alquran.cloud)',
    url: 'https://alquran.cloud/cdn',
    license: '',
    licenseUrl: '',
  },
}

export const CREDIT_ORDER = ['quran', 'takbir', 'amin']
