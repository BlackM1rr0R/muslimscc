// "Günün ayəsi" push planlayıcısının saf köməkçiləri — şəbəkə və sirr tələb
// etmir, ona görə ayrıca test olunur (tests/unit/daily-ayah.test.js).
//
// AYƏ SİYAHISI: saytın "Günün ayəsi" zolağının mənbəyi olan src/data/quotes.js
// (cat: 'quran') qeydlərinin İSTİNADLARI — yalnız surə:ayə nömrələri, mətn yox.
// Docker obrazına src/ düşmür, ona görə nömrələr burada saxlanılır; test
// siyahının quotes.js ilə eyni qaldığını yoxlayır. Ayə mətni və tərcüməsi
// alquran.cloud-dan çəkilir (uydurma mətn yoxdur).
'use strict'

const AYAH_REFS = [
  '1:1', '1:2', '1:5', '2:255', '2:256', '2:163', '2:45', '51:56', '94:6', '94:5',
  '93:5', '29:45', '2:153', '33:3', '112:1', '112:2', '113:1', '114:1', '108:1', '110:1',
  '111:1', '105:1', '104:1', '103:1-2', '102:1', '101:1-2', '100:1', '99:1', '97:1', '96:1',
  '95:1', '94:1', '93:1-2', '92:1', '91:1', '90:1', '89:1-2', '88:1', '87:1', '86:1',
  '85:1', '84:1', '83:1', '82:1', '81:1', '80:1', '79:1', '78:1', '76:1', '75:1',
  '74:1', '73:1', '72:1', '71:1', '67:1', '59:18', '59:22', '59:21', '13:28', '68:4',
  '21:107', '13:11', '2:155', '2:152', '65:3', '2:183', '2:186', '2:286', '3:110', '3:139',
  '4:1', '16:90', '20:114', '33:56', '49:12', '49:13', '50:16', '55:13', '98:7', '54:17',
  '3:185', '2:216', '3:200', '40:60', '12:87', '49:10', '2:83', '41:33', '36:1-2', '36:82',
  '3:103', '4:100', '5:1', '5:2', '5:32', '6:162', '17:37', '17:24', '18:46',
]

// Hər surədəki ayə sayı (cəmi 6236) — istinadların yoxlanması üçün
const AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
]

// Siyahıda olan surələrin Azərbaycan adları (src/data/surahNamesAz.js ilə eyni — test yoxlayır)
const SURAH_NAMES_AZ = {
  1: 'Fatihə', 2: 'Bəqərə', 3: 'Ali-İmran', 4: 'Nisa', 5: 'Maidə', 6: 'Ənam', 12: 'Yusuf',
  13: 'Rəd', 16: 'Nəhl', 17: 'İsra', 18: 'Kəhf', 20: 'Taha', 21: 'Ənbiya', 29: 'Ənkəbut',
  33: 'Əhzab', 36: 'Yasin', 40: 'Ğafir', 41: 'Fussilət', 49: 'Hücurat', 50: 'Qaf',
  51: 'Zariyat', 54: 'Qəmər', 55: 'Rəhman', 59: 'Həşr', 65: 'Talaq', 67: 'Mülk', 68: 'Qələm',
  71: 'Nuh', 72: 'Cinn', 73: 'Müzəmmil', 74: 'Müddəssir', 75: 'Qiyamə', 76: 'İnsan',
  78: 'Nəbə', 79: 'Naziat', 80: 'Əbəsə', 81: 'Təkvir', 82: 'İnfitar', 83: 'Mütəffifin',
  84: 'İnşiqaq', 85: 'Büruc', 86: 'Tariq', 87: 'Ələ', 88: 'Ğaşiyə', 89: 'Fəcr', 90: 'Bələd',
  91: 'Şəms', 92: 'Leyl', 93: 'Duha', 94: 'Şərh', 95: 'Tin', 96: 'Ələq', 97: 'Qədr',
  98: 'Bəyyinə', 99: 'Zilzal', 100: 'Adiyat', 101: 'Qariə', 102: 'Təkasür', 103: 'Əsr',
  104: 'Hüməzə', 105: 'Fil', 108: 'Kövsər', 110: 'Nasr', 111: 'Məsəd', 112: 'İxlas',
  113: 'Fələq', 114: 'Nas',
}

// Surə adlarının ru/tr tərcüməsi layihədə yoxdur — orada "Коран 2:255" yazılır
// (src/utils/sourceNames.js ilə eyni qayda). en/ar adı API-dən gəlir.
const QURAN_WORD = { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: "Kur'an" }

// Dil → alquran.cloud nəşri (ar — ərəbcə mətnin özü)
const EDITIONS = {
  ar: 'quran-uthmani', az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet',
}

const TITLE_PREFIX = {
  az: 'Günün ayəsi', en: 'Verse of the day', ru: 'Аят дня', ar: 'آية اليوم', tr: 'Günün ayeti',
}

// UI-da təklif olunan saatlar (NotificationSettingsWidget.jsx ilə eyni)
const HOURS = [7, 8, 9, 20]
const DEFAULT_HOUR = 8
const BODY_MAX = 150
// Addım siyahı uzunluğu (99) ilə qarşılıqlı sadədir → 99 gündə hər ayə düz bir dəfə,
// qonşu günlərdə isə siyahıdakı qonşu (oxşar) ayələr ardıcıl düşmür.
const STEP = 37

/** '103:1-2' → { s:103, a:1, to:2 } | null */
function parseRef(ref) {
  const m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(String(ref || ''))
  if (!m) return null
  const s = Number(m[1]), a = Number(m[2]), to = m[3] ? Number(m[3]) : a
  if (s < 1 || s > 114 || a < 1 || to < a || to > AYAH_COUNTS[s - 1]) return null
  return { s, a, to }
}

const gcd = (x, y) => (y ? gcd(y, x % y) : x)

/** 'YYYY-MM-DD' → gün nömrəsi (1970-01-01 = 0); saat qurşağından asılı deyil. */
function dayNumber(dateKey) {
  const [y, m, d] = String(dateKey).split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

/**
 * Yerli tarixə görə günün ayəsi — hamı eyni tarixdə eyni ayəni alır.
 * @param {string} dateKey 'YYYY-MM-DD' (abunəçinin öz saat qurşağında)
 */
function ayahForDate(dateKey, refs = AYAH_REFS) {
  const n = refs.length
  const step = gcd(STEP, n) === 1 ? STEP : 1
  const i = (((dayNumber(dateKey) * step) % n) + n) % n
  return { ...parseRef(refs[i]), ref: refs[i] }
}

/** Token sənədindəki `daily` sahəsi → { hour } | null (ayə sönülüdürsə və ya yararsızdırsa). */
function normDaily(raw) {
  if (!raw || typeof raw !== 'object' || raw.ayah !== true) return null
  const h = Number(raw.hour)
  return { hour: Number.isInteger(h) && h >= 0 && h <= 23 ? h : DEFAULT_HOUR }
}

/** Yerli 'HH:MM' seçilmiş saatın tam başlanğıcıdırmı (dəqiqə 00)? */
function isDueNow(hhmm, hour) {
  const m = /^(\d{2}):(\d{2})$/.exec(String(hhmm || ''))
  if (!m) return false
  return Number(m[1]) === Number(hour) && m[2] === '00'
}

/** Mətni max simvola qədər qısalt — söz ortasında kəsmədən, sonda "…". */
function truncateWords(text, max = BODY_MAX) {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const sp = cut.lastIndexOf(' ')
  const base = sp > max * 0.5 ? cut.slice(0, sp) : cut   // çox uzun tək söz — məcburi kəsim
  return base.replace(/[\s,.;:!?·—–-]+$/u, '') + '…'
}

// Bəsmələ (Fatihədən başqa) surələrin 1-ci ayəsinin əvvəlinə API tərəfindən
// yapışdırılır — QuranPage.jsx-dəki kimi təkrar göstərilmir (mətn dəyişmir).
const AR_MARKS = /[ً-ٰٟۖ-ۭـ]/g
const plainArabic = s => s.replace(AR_MARKS, '').replace(/ٱ/g, 'ا')
const BASMALA_PLAIN = 'بسم الله الرحمن الرحيم'
function withoutLeadingBasmala(text) {
  const words = String(text).split(' ')
  if (words.length > 4 && plainArabic(words.slice(0, 4).join(' ')) === BASMALA_PLAIN) {
    return words.slice(4).join(' ')
  }
  return text
}

/** alquran.cloud cavabının yoxlanması üçün sorğu ünvanı (bir ayə, bütün dillər). */
function ayahApiUrl(s, a) {
  return `https://api.alquran.cloud/v1/ayah/${s}:${a}/editions/${Object.values(EDITIONS).join(',')}`
}

/**
 * /ayah/{s:a}/editions/... cavabı → { texts:{ar,az,en,ru,tr}, names:{en,ar} } | null.
 * Hər hansı dil yoxdursa və ya cavab başqa ayəyə aiddirsə — null (uydurma yox).
 */
function parseAyahResponse(json, s, a) {
  const list = json && json.code === 200 && Array.isArray(json.data) ? json.data : null
  if (!list) return null
  const texts = {}, names = {}
  for (const [lang, id] of Object.entries(EDITIONS)) {
    const item = list.find(x => x && x.edition && x.edition.identifier === id)
    if (!item || !item.surah || item.surah.number !== s || item.numberInSurah !== a) return null
    let text = typeof item.text === 'string' ? item.text.trim() : ''
    if (lang === 'ar' && a === 1 && s !== 1 && s !== 9) text = withoutLeadingBasmala(text)
    if (!text) return null
    texts[lang] = text
    if (!names.en && item.surah.englishName) names.en = String(item.surah.englishName)
    if (!names.ar && item.surah.name) names.ar = String(item.surah.name)
  }
  return { texts, names }
}

/** Bir neçə ayənin (aralıq: 103:1-2) nəticələrini birləşdir. */
function mergeAyahParts(parts) {
  if (!parts.length || parts.some(p => !p)) return null
  const texts = {}
  for (const lang of Object.keys(EDITIONS)) texts[lang] = parts.map(p => p.texts[lang]).join(' ')
  return { texts, names: parts[0].names }
}

/** Başlıqdakı surə adı: az — öz cədvəlimiz, en/ar — API, ru/tr — "Коран"/"Kur'an". */
function surahLabel(lang, s, names = {}) {
  if (lang === 'az' && SURAH_NAMES_AZ[s]) return SURAH_NAMES_AZ[s]
  if ((lang === 'en' || lang === 'ar') && names[lang]) return names[lang]
  return QURAN_WORD[lang] || QURAN_WORD.az
}

/** "📖 Günün ayəsi — Bəqərə 2:255" */
function ayahTitle(lang, pick, names) {
  const L = TITLE_PREFIX[lang] ? lang : 'az'
  const num = `${pick.s}:${pick.a}${pick.to && pick.to !== pick.a ? `-${pick.to}` : ''}`
  return `📖 ${TITLE_PREFIX[L]} — ${surahLabel(L, pick.s, names)} ${num}`
}

/** Bildirişə klikdə açılan ünvan (az prefikssiz). */
function ayahLink(lang, pick) {
  const q = `/quran?s=${pick.s}&a=${pick.a}`
  return !lang || lang === 'az' ? q : `/${lang}${q}`
}

module.exports = {
  AYAH_REFS, AYAH_COUNTS, SURAH_NAMES_AZ, EDITIONS, TITLE_PREFIX, HOURS, DEFAULT_HOUR, BODY_MAX,
  parseRef, dayNumber, ayahForDate, normDaily, isDueNow, truncateWords, withoutLeadingBasmala,
  ayahApiUrl, parseAyahResponse, mergeAyahParts, surahLabel, ayahTitle, ayahLink,
}
