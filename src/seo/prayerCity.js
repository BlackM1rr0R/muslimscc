// ═══════════════════════════════════════════════════════
// /prayer/<şəhər> — Azərbaycan şəhərinin namaz vaxtları səhifəsi (v6.6): SEO mətnləri,
// JSON-LD və statik aylıq cədvəl (scripts/seo-body.mjs). Node-da da işləyir (.js importları).
//
// Vaxtlar — saytın özünün hesabı (utils/prayCalc → computeTimes, Əbu Bəkr məscidinin
// parametrləri; YearPrayerChart və /prayer ilə eyni, Azərbaycan cədvəli ilə dəqiqəsinədək).
// Statik cədvəl build ayına aiddir; tətbiq yüklənəndə səhifə canlı vaxtları göstərir.
// ═══════════════════════════════════════════════════════
import { PRAYER_CITIES } from '../data/prayerCities.js'
import { computeTimes, tzOffsetHours } from '../utils/prayCalc.js'

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
export const PRAYER_LABELS = {
  fajr:    { az: 'Sübh',   en: 'Fajr',    ru: 'Фаджр',  ar: 'الفجر',  tr: 'Sabah'  },
  sunrise: { az: 'Günəş',  en: 'Sunrise', ru: 'Восход', ar: 'الشروق', tr: 'Güneş'  },
  dhuhr:   { az: 'Zöhr',   en: 'Dhuhr',   ru: 'Зухр',   ar: 'الظهر',  tr: 'Öğle'   },
  asr:     { az: 'Əsr',    en: 'Asr',     ru: 'Аср',    ar: 'العصر',  tr: 'İkindi' },
  maghrib: { az: 'Məğrib', en: 'Maghrib', ru: 'Магриб', ar: 'المغرب', tr: 'Akşam'  },
  isha:    { az: 'İşa',    en: 'Isha',    ru: 'Иша',    ar: 'العشاء', tr: 'Yatsı'  },
}

const BY_SLUG = new Map(PRAYER_CITIES.filter(c => c.country === 'AZ').map(c => [c.id.toLowerCase(), c]))

/** Şəhər (yalnız Azərbaycan) — slug → { id, lat, lng, tz, label } və ya null */
export const prayerCity = (slug) => BY_SLUG.get(String(slug || '').toLowerCase()) || null
export const cityName = (c, lang) => (c && (c.label[lang] || c.label.en)) || ''
export const citySlug = (c) => c.id.toLowerCase()

/** Bir ayın cədvəli: [{ d, fajr, sunrise, dhuhr, asr, maghrib, isha }] */
export function monthTable(c, year, month) {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const rows = []
  for (let d = 1; d <= days; d++) {
    const t = computeTimes({ year, month, day: d }, c.lat, c.lng, tzOffsetHours(c.tz, year, month, d))
    rows.push({ d, ...t })
  }
  return rows
}

// SEO mətnləri — axtarışdakı ən çox yazılan ifadə: "<şəhər> namaz vaxtları"
export const PRAYER_CITY_T = {
  az: {
    t: (c) => `${c} namaz vaxtları — bu gün və aylıq cədvəl`,
    d: (c) => `${c} üçün bu günün namaz vaxtları: Sübh, Günəş, Zöhr, Əsr, Məğrib, İşa. Aylıq cədvəl, əzan bildirişi və qiblə. Azərbaycan cədvəli ilə eyni hesab.`,
    h1: (c) => `${c} namaz vaxtları`,
    intro: (c) => `${c} şəhəri üçün namaz vaxtları — Əbu Bəkr məscidinin hesablama qaydası ilə (sübh 18.5°, işa — məğribdən 90 dəqiqə sonra).`,
    month: 'Aylıq cədvəl', day: 'Gün', others: 'Azərbaycanın digər şəhərləri', all: 'Namaz vaxtları — bütün şəhərlər', live: 'Canlı vaxtlar, geri sayım və əzan bildirişi — tətbiqdə.',
  },
  en: {
    t: (c) => `Prayer times in ${c} today — monthly timetable`,
    d: (c) => `Today’s prayer times for ${c}, Azerbaijan: Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha. Monthly timetable, adhan notifications and qibla.`,
    h1: (c) => `Prayer times in ${c}`,
    intro: (c) => `Prayer times for ${c}, calculated with the Abu Bakr Mosque method used in Azerbaijan (Fajr 18.5°, Isha 90 minutes after Maghrib).`,
    month: 'Monthly timetable', day: 'Day', others: 'Other cities in Azerbaijan', all: 'Prayer times: all cities', live: 'Live times, countdown and adhan notifications are in the app.',
  },
  ru: {
    t: (c) => `Время намаза: ${c} — сегодня и на месяц`,
    d: (c) => `Время намаза на сегодня, ${c} (Азербайджан): Фаджр, восход, Зухр, Аср, Магриб, Иша. Расписание на месяц, оповещение об азане и кибла.`,
    h1: (c) => `Время намаза: ${c}`,
    intro: (c) => `Время намаза для города ${c} по методу мечети Абу Бакр, принятому в Азербайджане (Фаджр 18,5°, Иша — через 90 минут после Магриба).`,
    month: 'Расписание на месяц', day: 'День', others: 'Другие города Азербайджана', all: 'Время намаза: все города', live: 'Время в реальном времени, обратный отсчёт и азан — в приложении.',
  },
  ar: {
    t: (c) => `مواقيت الصلاة في ${c} اليوم — جدول شهري`,
    d: (c) => `مواقيت الصلاة اليوم في ${c} (أذربيجان): الفجر والشروق والظهر والعصر والمغرب والعشاء، مع جدول شهري وتنبيه الأذان والقبلة.`,
    h1: (c) => `مواقيت الصلاة في ${c}`,
    intro: (c) => `مواقيت الصلاة في ${c} بطريقة مسجد أبي بكر المعتمدة في أذربيجان (الفجر 18.5°، والعشاء بعد المغرب بتسعين دقيقة).`,
    month: 'الجدول الشهري', day: 'اليوم', others: 'مدن أخرى في أذربيجان', all: 'مواقيت الصلاة: جميع المدن', live: 'المواقيت الحية والعدّ التنازلي وتنبيه الأذان في التطبيق.',
  },
  tr: {
    t: (c) => `${c} namaz vakitleri — bugün ve aylık takvim`,
    d: (c) => `${c} için bugünün namaz vakitleri: Sabah, Güneş, Öğle, İkindi, Akşam, Yatsı. Aylık takvim, ezan bildirimi ve kıble. Azerbaycan takvimiyle aynı hesap.`,
    h1: (c) => `${c} namaz vakitleri`,
    intro: (c) => `${c} şehri için namaz vakitleri — Azerbaycan’da kullanılan Ebu Bekir Camii hesabıyla (sabah 18,5°, yatsı akşamdan 90 dakika sonra).`,
    month: 'Aylık takvim', day: 'Gün', others: 'Azerbaycan’ın diğer şehirleri', all: 'Namaz vakitleri — tüm şehirler', live: 'Canlı vakitler, geri sayım ve ezan bildirimi uygulamada.',
  },
}
