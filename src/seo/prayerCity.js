// ═══════════════════════════════════════════════════════
// /prayer/<şəhər> — Azərbaycan şəhərinin namaz vaxtları səhifəsi (v6.6): SEO mətnləri,
// JSON-LD və statik aylıq cədvəl (scripts/seo-body.mjs). Node-da da işləyir (.js importları).
//
// Vaxtlar — saytın özünün hesabı (utils/prayCalc → computeTimes, Əbu Bəkr məscidinin
// parametrləri; YearPrayerChart və /prayer ilə eyni, Azərbaycan cədvəli ilə dəqiqəsinədək).
// Statik cədvəl build ayına aiddir; tətbiq yüklənəndə səhifə canlı vaxtları göstərir.
// ═══════════════════════════════════════════════════════
import { PRAYER_CITIES, COUNTRY_NAMES } from '../data/prayerCities.js'
import { computeTimes, tzOffsetHours, CALC_METHODS } from '../utils/prayCalc.js'

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
export const PRAYER_LABELS = {
  fajr:    { az: 'Sübh',   en: 'Fajr',    ru: 'Фаджр',  ar: 'الفجر',  tr: 'Sabah'  },
  sunrise: { az: 'Günəş',  en: 'Sunrise', ru: 'Восход', ar: 'الشروق', tr: 'Güneş'  },
  dhuhr:   { az: 'Zöhr',   en: 'Dhuhr',   ru: 'Зухр',   ar: 'الظهر',  tr: 'Öğle'   },
  asr:     { az: 'Əsr',    en: 'Asr',     ru: 'Аср',    ar: 'العصر',  tr: 'İkindi' },
  maghrib: { az: 'Məğrib', en: 'Maghrib', ru: 'Магриб', ar: 'المغرب', tr: 'Akşam'  },
  isha:    { az: 'İşa',    en: 'Isha',    ru: 'Иша',    ar: 'العشاء', tr: 'Yatsı'  },
}

// v6.7: dünya şəhərləri — canlı vaxtları aladhan 13 (Diyanət) ilə gəlir; yerli hesab (CALC_METHODS.diyanet)
// aladhan ilə 2027-nin bütün günlərində ±1 dəq (yuvarlaqlaşdırma) üst-üstə düşən şəhərlər. Moskva, Kazan,
// Sankt-Peterburq, Berlin — qışda əsr 2–3 dəq fərqlənir, statik cədvəl verilmir (canlı vaxt işləyir).
// tests/unit/prayer-world.test.js (aladhan nümunə dəyərləri ilə)
export const WORLD_CITY_IDS = ['Mecca', 'Medina', 'Istanbul', 'Ankara', 'Derbent', 'Tbilisi', 'Marneuli', 'Tabriz', 'Tehran',
  'Dubai', 'Cairo', 'Tashkent', 'Almaty', 'London', 'Paris', 'New York', 'Toronto', 'Jakarta', 'Kuala Lumpur']
export const citySlug = (c) => c.id.toLowerCase().replace(/\s+/g, '-')
const PAGE_CITIES = PRAYER_CITIES.filter(c => c.country === 'AZ' || WORLD_CITY_IDS.includes(c.id))
const BY_SLUG = new Map(PAGE_CITIES.map(c => [citySlug(c), c]))
export const isAzCity = (c) => c?.country === 'AZ'
export const methodOf = (c) => (isAzCity(c) ? CALC_METHODS.abubakr : CALC_METHODS.diyanet)
export const WORLD_PAGE_CITIES = PAGE_CITIES.filter(c => !isAzCity(c))

/** Şəhər (AZ + yoxlanmış dünya şəhərləri) — slug → { id, country, lat, lng, tz, label } və ya null */
export const prayerCity = (slug) => BY_SLUG.get(String(slug || '').toLowerCase()) || null
export const cityName = (c, lang) => (c && (c.label[lang] || c.label.en)) || ''
export const countryName = (c, lang) => (c && COUNTRY_NAMES[c.country] && (COUNTRY_NAMES[c.country][lang] || COUNTRY_NAMES[c.country].en)) || ''

/** Bir ayın cədvəli: [{ d, fajr, sunrise, dhuhr, asr, maghrib, isha }] */
export function monthTable(c, year, month) {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const rows = []
  for (let d = 1; d <= days; d++) {
    const t = computeTimes({ year, month, day: d }, c.lat, c.lng, tzOffsetHours(c.tz, year, month, d), methodOf(c))
    rows.push({ d, ...t })
  }
  return rows
}

// SEO mətnləri — axtarışdakı ən çox yazılan ifadə: "<şəhər> namaz vaxtları"
export const PRAYER_CITY_T = {
  az: {
    dW: (c, k) => `${c} (${k}) üçün bu günün namaz vaxtları: Sübh, Günəş, Zöhr, Əsr, Məğrib, İşa. Aylıq cədvəl, əzan bildirişi və qiblə istiqaməti.`,
    introW: (c) => `${c} şəhəri üçün namaz vaxtları — Türkiyə Diyanəti üsulu ilə (sübh 18°, işa 17°).`,
    world: 'Dünyanın digər şəhərləri', azList: 'Azərbaycan şəhərləri',
    t: (c) => `${c} namaz vaxtları — bu gün və aylıq cədvəl`,
    d: (c) => `${c} üçün bu günün namaz vaxtları: Sübh, Günəş, Zöhr, Əsr, Məğrib, İşa. Aylıq cədvəl, əzan bildirişi və qiblə. Azərbaycan cədvəli ilə eyni hesab.`,
    h1: (c) => `${c} namaz vaxtları`,
    intro: (c) => `${c} şəhəri üçün namaz vaxtları — Əbu Bəkr məscidinin hesablama qaydası ilə (sübh 18.5°, işa — məğribdən 90 dəqiqə sonra).`,
    month: 'Aylıq cədvəl', day: 'Gün', others: 'Azərbaycanın digər şəhərləri', all: 'Namaz vaxtları — bütün şəhərlər', live: 'Canlı vaxtlar, geri sayım və əzan bildirişi — tətbiqdə.',
  },
  en: {
    dW: (c, k) => `Today’s prayer times in ${c}, ${k}: Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha. Monthly timetable, adhan notifications and qibla direction.`,
    introW: (c) => `Prayer times for ${c}, calculated with the Diyanet (Türkiye) method (Fajr 18°, Isha 17°).`,
    world: 'Other cities worldwide', azList: 'Cities in Azerbaijan',
    t: (c) => `Prayer times in ${c} today — monthly timetable`,
    d: (c) => `Today’s prayer times for ${c}, Azerbaijan: Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha. Monthly timetable, adhan notifications and qibla.`,
    h1: (c) => `Prayer times in ${c}`,
    intro: (c) => `Prayer times for ${c}, calculated with the Abu Bakr Mosque method used in Azerbaijan (Fajr 18.5°, Isha 90 minutes after Maghrib).`,
    month: 'Monthly timetable', day: 'Day', others: 'Other cities in Azerbaijan', all: 'Prayer times: all cities', live: 'Live times, countdown and adhan notifications are in the app.',
  },
  ru: {
    dW: (c, k) => `Время намаза на сегодня, ${c} (${k}): Фаджр, восход, Зухр, Аср, Магриб, Иша. Расписание на месяц, оповещение об азане и направление киблы.`,
    introW: (c) => `Время намаза для города ${c} по методу Диянет (Турция): Фаджр 18°, Иша 17°.`,
    world: 'Другие города мира', azList: 'Города Азербайджана',
    t: (c) => `Время намаза: ${c} — сегодня и на месяц`,
    d: (c) => `Время намаза на сегодня, ${c} (Азербайджан): Фаджр, восход, Зухр, Аср, Магриб, Иша. Расписание на месяц, оповещение об азане и кибла.`,
    h1: (c) => `Время намаза: ${c}`,
    intro: (c) => `Время намаза для города ${c} по методу мечети Абу Бакр, принятому в Азербайджане (Фаджр 18,5°, Иша — через 90 минут после Магриба).`,
    month: 'Расписание на месяц', day: 'День', others: 'Другие города Азербайджана', all: 'Время намаза: все города', live: 'Время в реальном времени, обратный отсчёт и азан — в приложении.',
  },
  ar: {
    dW: (c, k) => `مواقيت الصلاة اليوم في ${c} (${k}): الفجر والشروق والظهر والعصر والمغرب والعشاء، مع جدول شهري وتنبيه الأذان واتجاه القبلة.`,
    introW: (c) => `مواقيت الصلاة في ${c} بطريقة رئاسة الشؤون الدينية التركية (الفجر 18°، والعشاء 17°).`,
    world: 'مدن أخرى حول العالم', azList: 'مدن أذربيجان',
    t: (c) => `مواقيت الصلاة في ${c} اليوم — جدول شهري`,
    d: (c) => `مواقيت الصلاة اليوم في ${c} (أذربيجان): الفجر والشروق والظهر والعصر والمغرب والعشاء، مع جدول شهري وتنبيه الأذان والقبلة.`,
    h1: (c) => `مواقيت الصلاة في ${c}`,
    intro: (c) => `مواقيت الصلاة في ${c} بطريقة مسجد أبي بكر المعتمدة في أذربيجان (الفجر 18.5°، والعشاء بعد المغرب بتسعين دقيقة).`,
    month: 'الجدول الشهري', day: 'اليوم', others: 'مدن أخرى في أذربيجان', all: 'مواقيت الصلاة: جميع المدن', live: 'المواقيت الحية والعدّ التنازلي وتنبيه الأذان في التطبيق.',
  },
  tr: {
    dW: (c, k) => `${c} (${k}) için bugünün namaz vakitleri: Sabah, Güneş, Öğle, İkindi, Akşam, Yatsı. Aylık takvim, ezan bildirimi ve kıble yönü.`,
    introW: (c) => `${c} için namaz vakitleri — Diyanet İşleri Başkanlığı yöntemiyle (sabah 18°, yatsı 17°).`,
    world: 'Dünyanın diğer şehirleri', azList: 'Azerbaycan şehirleri',
    t: (c) => `${c} namaz vakitleri — bugün ve aylık takvim`,
    d: (c) => `${c} için bugünün namaz vakitleri: Sabah, Güneş, Öğle, İkindi, Akşam, Yatsı. Aylık takvim, ezan bildirimi ve kıble. Azerbaycan takvimiyle aynı hesap.`,
    h1: (c) => `${c} namaz vakitleri`,
    intro: (c) => `${c} şehri için namaz vakitleri — Azerbaycan’da kullanılan Ebu Bekir Camii hesabıyla (sabah 18,5°, yatsı akşamdan 90 dakika sonra).`,
    month: 'Aylık takvim', day: 'Gün', others: 'Azerbaycan’ın diğer şehirleri', all: 'Namaz vakitleri — tüm şehirler', live: 'Canlı vakitler, geri sayım ve ezan bildirimi uygulamada.',
  },
}
