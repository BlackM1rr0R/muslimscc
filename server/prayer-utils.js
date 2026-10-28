// Namaz push planlayıcısının saf köməkçiləri — şəbəkə və sirr tələb etmir,
// ona görə ayrıca test olunur (tests/unit/prayer-utils.test.js).
'use strict'

// src/config/brand.js → DEFAULT_PRAYER_LOCATION ilə eyni
const DEFAULT_LOC = {
  lat: 40.4093, lng: 49.8671, tz: 'Asia/Baku', method: 13,
  city: { az: 'Bakı', en: 'Baku', ru: 'Баку', tr: 'Bakü', ar: 'باكو' },
}
const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const PRAYERS = [
  ['fajr', 'Fajr'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha'],
]

const PUSH_TEXTS = {
  az: { names: { fajr: 'Sübh', dhuhr: 'Zöhr', asr: 'Əsr', maghrib: 'Məğrib', isha: 'İşa' },
        title: (n, t) => `🕌 ${n} azanı — ${t}`, jumuaTitle: (t) => `🕌 Cümə günü — zöhr azanı ${t}`,
        next: 'Növbəti', tomorrow: 'sabah' },
  en: { names: { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
        title: (n, t) => `🕌 ${n} adhan — ${t}`, jumuaTitle: (t) => `🕌 Friday — Dhuhr adhan ${t}`,
        next: 'Next', tomorrow: 'tomorrow' },
  ru: { names: { fajr: 'Фаджр', dhuhr: 'Зухр', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша' },
        title: (n, t) => `🕌 Азан: ${n} — ${t}`, jumuaTitle: (t) => `🕌 Пятница — азан Зухр ${t}`,
        next: 'Следующий', tomorrow: 'завтра' },
  tr: { names: { fajr: 'Sabah', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı' },
        title: (n, t) => `🕌 ${n} ezanı — ${t}`, jumuaTitle: (t) => `🕌 Cuma günü — öğle ezanı ${t}`,
        next: 'Sonraki', tomorrow: 'yarın' },
  ar: { names: { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
        title: (n, t) => `🕌 أذان ${n} — ${t}`, jumuaTitle: (t) => `🕌 يوم الجمعة — أذان الظهر ${t}`,
        next: 'التالي', tomorrow: 'غدًا' },
}

const validTz = (tz) => {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true } catch { return false }
}

/** Sənəddəki loc-u yoxla; yararsızdırsa standart yer. */
function normLoc(raw) {
  const lat = Number(raw && raw.lat), lng = Number(raw && raw.lng)
  if (!raw || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return DEFAULT_LOC
  const tz = typeof raw.tz === 'string' && validTz(raw.tz) ? raw.tz : DEFAULT_LOC.tz
  const method = Number.isInteger(Number(raw.method)) ? Number(raw.method) : DEFAULT_LOC.method
  const city = raw.city && typeof raw.city === 'object' ? raw.city : {}
  return { lat, lng, tz, method, city }
}
const locKey = (l) => `${l.lat.toFixed(2)},${l.lng.toFixed(2)}|${l.tz}|${l.method}`

/** Verilən saat qurşağında cari an. */
function nowIn(tz) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false,
  }).formatToParts(new Date())
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]))
  return {
    dateKey: `${p.year}-${p.month}-${p.day}`,
    ddmmyyyy: `${p.day}-${p.month}-${p.year}`,
    hhmm: `${p.hour === '24' ? '00' : p.hour}:${p.minute}`,
    friday: p.weekday === 'Fri',
  }
}

function addDay(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d) + 86400000)
  return `${String(t.getUTCDate()).padStart(2, '0')}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${t.getUTCFullYear()}`
}

module.exports = { DEFAULT_LOC, LANGS, PRAYERS, PUSH_TEXTS, validTz, normLoc, locKey, nowIn, addDay }
