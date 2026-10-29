// ═══════════════════════════════════════════════════════
// Quran səsi: qarilər, səs faylının ünvanı, ehtiyat mənbə, seçimlərin yaddaşı
//
// Mənbələr (2026-10 yoxlanılıb — hər qarinin faylı HEAD sorğusu ilə 200 verir):
//   1) cdn.islamic.network/quran/audio/<bitreyt>/<nəşr>/<ümumi ayə nömrəsi>.mp3
//      — alquran.cloud-un öz CDN-i (api.alquran.cloud/v1/edition?format=audio)
//   2) verses.quran.com/<qovluq>/mp3/<SSSAAA>.mp3 — Quran.com-un CDN-i
//      (api.quran.com/api/v4/resources/recitations); yalnız orada olan qarilər
//      üçün. Orada olmayanlarda ehtiyat — eyni CDN-in aşağı bitreyti.
// Səd əl-Ğamidi bu mənbələrin heç birində ayə-ayə yoxdur (everyayah.com
// yoxlananda cavab vermədi) — siyahıya salınmayıb.
// Səs faylları service worker-də keşlənmir (public/sw.js) — belə qalır.
// ═══════════════════════════════════════════════════════

const ISLAMIC = (bitrate, edition) => ({ g }) => `https://cdn.islamic.network/quran/audio/${bitrate}/${edition}/${g}.mp3`
const pad3 = n => String(n).padStart(3, '0')
const QURANCOM = folder => ({ s, a }) => `https://verses.quran.com/${folder}/mp3/${pad3(s)}${pad3(a)}.mp3`

// Adlar 5 dildə; ərəbcə — orijinal yazılış
export const RECITERS = [
  {
    id: 'alafasy',
    name: { az: 'Mişari Raşid əl-Əfasi', en: 'Mishary Rashid Alafasy', ru: 'Мишари Рашид аль-Афаси', ar: 'مشاري راشد العفاسي', tr: 'Mişari Raşid el-Afasi' },
    sources: [ISLAMIC(128, 'ar.alafasy'), QURANCOM('Alafasy'), ISLAMIC(64, 'ar.alafasy')],
  },
  {
    id: 'sudais',
    name: { az: 'Əbdürrəhman əs-Südeys', en: 'Abdur-Rahman as-Sudais', ru: 'Абдуррахман ас-Судайс', ar: 'عبد الرحمن السديس', tr: 'Abdurrahman es-Sudeys' },
    sources: [ISLAMIC(192, 'ar.abdurrahmaansudais'), QURANCOM('Sudais'), ISLAMIC(64, 'ar.abdurrahmaansudais')],
  },
  {
    id: 'abdulbasit',
    name: { az: 'Əbdülbasit Əbdüssaməd (mürəttəl)', en: 'Abdul Basit Abdus-Samad (murattal)', ru: 'Абдульбасит Абдуссамад (муратталь)', ar: 'عبد الباسط عبد الصمد (مرتل)', tr: 'Abdulbasit Abdussamed (mürettel)' },
    sources: [ISLAMIC(64, 'ar.abdulsamad'), QURANCOM('AbdulBaset/Murattal')],
  },
  {
    id: 'husary',
    name: { az: 'Mahmud Xəlil əl-Husari', en: 'Mahmoud Khalil Al-Husary', ru: 'Махмуд Халиль аль-Хусари', ar: 'محمود خليل الحصري', tr: 'Mahmud Halil el-Husari' },
    sources: [ISLAMIC(128, 'ar.husary'), ISLAMIC(64, 'ar.husary')],
  },
  {
    id: 'maher',
    name: { az: 'Mahir əl-Muayqli', en: 'Maher Al-Muaiqly', ru: 'Махер аль-Муайкли', ar: 'ماهر المعيقلي', tr: 'Mahir el-Muaykli' },
    sources: [ISLAMIC(128, 'ar.mahermuaiqly'), ISLAMIC(64, 'ar.mahermuaiqly')],
  },
  {
    id: 'minshawi',
    name: { az: 'Məhəmməd Siddiq əl-Minşavi', en: 'Mohamed Siddiq al-Minshawi', ru: 'Мухаммад Сиддик аль-Миншави', ar: 'محمد صديق المنشاوي', tr: 'Muhammed Sıddık el-Minşavi' },
    sources: [ISLAMIC(128, 'ar.minshawi'), QURANCOM('Minshawi/Murattal')],
  },
  {
    id: 'shuraym',
    name: { az: 'Səud əş-Şureym', en: 'Saud ash-Shuraim', ru: 'Сауд аш-Шурейм', ar: 'سعود الشريم', tr: 'Suud eş-Şureym' },
    sources: [ISLAMIC(64, 'ar.saoodshuraym'), QURANCOM('Shuraym')],
  },
  {
    id: 'shatri',
    name: { az: 'Əbu Bəkr əş-Şatiri', en: 'Abu Bakr al-Shatri', ru: 'Абу Бакр аш-Шатри', ar: 'أبو بكر الشاطري', tr: 'Ebubekir eş-Şatıri' },
    sources: [ISLAMIC(128, 'ar.shaatree'), QURANCOM('Shatri'), ISLAMIC(64, 'ar.shaatree')],
  },
  {
    id: 'hudhaify',
    name: { az: 'Əli əl-Huzeyfi', en: 'Ali Al-Hudhaifi', ru: 'Али аль-Хузайфи', ar: 'علي الحذيفي', tr: 'Ali el-Huzeyfi' },
    sources: [ISLAMIC(128, 'ar.hudhaify'), ISLAMIC(64, 'ar.hudhaify')],
  },
  {
    id: 'rifai',
    name: { az: 'Hani ər-Rifai', en: 'Hani ar-Rifai', ru: 'Хани ар-Рифаи', ar: 'هاني الرفاعي', tr: 'Hani er-Rifai' },
    sources: [ISLAMIC(192, 'ar.hanirifai'), QURANCOM('Rifai'), ISLAMIC(64, 'ar.hanirifai')],
  },
  {
    id: 'ayyub',
    name: { az: 'Məhəmməd Əyyub', en: 'Muhammad Ayyub', ru: 'Мухаммад Айюб', ar: 'محمد أيوب', tr: 'Muhammed Eyyub' },
    sources: [ISLAMIC(128, 'ar.muhammadayyoub')],   // 64 kbps nəşri 403 qaytarır
  },
]

export const DEFAULT_RECITER = 'alafasy'
export const SPEEDS = [0.75, 1, 1.25]
export const REPEATS = [1, 2, 3, 5, 10]

export const getReciter = id => RECITERS.find(r => r.id === id) || RECITERS[0]
export const reciterName = (id, lang) => {
  const r = getReciter(id)
  return r.name[lang] || r.name.en
}

/**
 * Ayənin səs ünvanları (birincisi əsas, qalanları ehtiyat).
 * g — Quranda ümumi ayə nömrəsi (1…6236), s — surə, a — surədəki ayə.
 */
export function ayahSources(reciterId, { g, s, a }) {
  return getReciter(reciterId).sources.map(f => f({ g, s, a }))
}

// ── Seçimlərin yaddaşı ──
// { reciter, rate, repeat, autoNext } — pozuq yazı səhifəni çökdürməsin
const PREFS_KEY = 'quran_audio'
export function readAudioPrefs() {
  const def = { reciter: DEFAULT_RECITER, rate: 1, repeat: 1, autoNext: false }
  try {
    const v = JSON.parse(localStorage.getItem(PREFS_KEY))
    if (!v || typeof v !== 'object') return def
    return {
      reciter: RECITERS.some(r => r.id === v.reciter) ? v.reciter : def.reciter,
      rate: SPEEDS.includes(v.rate) ? v.rate : def.rate,
      repeat: REPEATS.includes(v.repeat) ? v.repeat : def.repeat,
      autoNext: v.autoNext === true,
    }
  } catch { return def }
}
export function writeAudioPrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch { /* yaddaş bağlıdır */ }
}
