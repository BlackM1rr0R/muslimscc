// SURƏT: src/utils/prayCalc.js — dəyişiklik orada edilməlidir
// ═══════════════════════════════════════════════════════
// prayCalc — namaz vaxtlarının yerli (şəbəkəsiz) hesablanması
//
// NİYƏ: Azərbaycan şəhərləri üçün vaxtlar Bakıdakı Əbu Bəkr məscidinin
// (abu-bakr.com → "Namaz vaxtları") cədvəli ilə DƏQİQƏSİNƏDƏK eyni olmalıdır.
// Məscidin cədvəli Ümmül-Qura parametrləri ilə hesablanır:
//   • sübh — günəş üfüqdən 18.5° aşağı
//   • günəşin çıxması/batması — 0.833° (refraksiya + günəş diskinin radiusu)
//   • zöhr — günorta (zenit), əlavəsiz
//   • əsr — kölgə = əşyanın boyu + günortadakı kölgə (cumhur: Şafii, Maliki, Hənbəli)
//   • məğrib — günəşin batması
//   • işa — məğribdən 90 dəqiqə sonra
// aladhan.com eyni parametrlərlə bəzən əsri 1 dəqiqə fərqli yuvarlaqlaşdırır,
// ona görə hesab burada aparılır (məscid cədvəli ilə tutuşdurulub — testə bax).
//
// Günəşin mövqeyi: ABŞ Dəniz Rəsədxanasının (USNO) təxmini düsturları
// (1950–2050 üçün ~1 dəqiqəlik dəqiqlik — namaz vaxtı üçün kifayətdir).
// ═══════════════════════════════════════════════════════

const RAD = Math.PI / 180
const sin = d => Math.sin(d * RAD)
const cos = d => Math.cos(d * RAD)
const tan = d => Math.tan(d * RAD)
const asin = x => Math.asin(x) / RAD
const acos = x => Math.acos(x) / RAD
const atan2 = (y, x) => Math.atan2(y, x) / RAD
const acot = x => Math.atan(1 / x) / RAD
const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a }
const fixAngle = a => fix(a, 360)
const fixHour = a => fix(a, 24)

// Metod parametrləri. ishaMin — məğribdən sonrakı dəqiqələr (bucaq əvəzinə)
export const CALC_METHODS = {
  // Bakı, Əbu Bəkr məscidi (Ümmül-Qura): sübh 18.5°, işa = məğrib + 90 dəq.
  abubakr: { fajr: 18.5, ishaMin: 90, asrFactor: 1 },
}

function julian(year, month, day) {
  if (month <= 2) { year -= 1; month += 12 }
  const A = Math.floor(year / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5
}

// Günəşin meyli (declination) və vaxt tənliyi (equation of time, saat)
function sunPosition(jd) {
  const D = jd - 2451545.0
  const g = fixAngle(357.529 + 0.98560028 * D)
  const q = fixAngle(280.459 + 0.98564736 * D)
  const L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g))
  const e = 23.439 - 0.00000036 * D
  const RA = atan2(cos(e) * sin(L), cos(L)) / 15
  return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - fixHour(RA) }
}

/** Saat qurşağının həmin gündəki UTC fərqi (saat). Intl tanımırsa — cihazınkı. */
export function tzOffsetHours(tz, y, m, d) {
  const probe = new Date(Date.UTC(y, m - 1, d, 12))
  try {
    const parts = {}
    const f = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
    for (const p of f.formatToParts(probe)) parts[p.type] = p.value
    const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute)
    return (local - probe.getTime()) / 3600000
  } catch {
    return -probe.getTimezoneOffset() / 60
  }
}

/**
 * Bir günün vaxtları.
 * @param {{year:number, month:number, day:number}} date — şəhərin təqvim günü
 * @param {number} lat @param {number} lng
 * @param {number} tzHours — UTC fərqi (Bakı: 4)
 * @param {object} method — CALC_METHODS-dən biri
 * @returns {{fajr, sunrise, dhuhr, asr, maghrib, isha}} — 'HH:MM'
 */
export function computeTimes({ year, month, day }, lat, lng, tzHours, method = CALC_METHODS.abubakr) {
  const jDate = julian(year, month, day) - lng / (15 * 24)

  const midDay = t => fixHour(12 - sunPosition(jDate + t).eqt)
  // Günəşin üfüqdən `angle` dərəcə aşağı olduğu an (ccw — günortadan əvvəl)
  const sunAngleTime = (angle, t, ccw) => {
    const { decl } = sunPosition(jDate + t)
    const noon = midDay(t)
    const T = acos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15
    return noon + (ccw ? -T : T)
  }
  const asrTime = (factor, t) => {
    const { decl } = sunPosition(jDate + t)
    const angle = -acot(factor + tan(Math.abs(lat - decl)))
    return sunAngleTime(angle, t)
  }

  // Bir iterasiya: ilkin təxminlər (gün hissəsi) → dəqiq an
  const p = h => h / 24
  let fajr = sunAngleTime(method.fajr, p(5), true)
  let sunrise = sunAngleTime(0.833, p(6), true)
  let dhuhr = midDay(p(12))
  let asr = asrTime(method.asrFactor, p(13))
  let sunset = sunAngleTime(0.833, p(18))

  // Yerli vaxta keçid
  const adj = tzHours - lng / 15
  fajr += adj; sunrise += adj; dhuhr += adj; asr += adj; sunset += adj
  let maghrib = sunset
  let isha = maghrib + method.ishaMin / 60

  // Yüksək enliklər (gecənin ortası qaydası): sübh və işa gecənin yarısını keçməsin
  const night = fixHour(sunrise - sunset)
  const half = night / 2
  if (!Number.isFinite(fajr) || fixHour(sunrise - fajr) > half) fajr = sunrise - half
  if (!Number.isFinite(isha) || fixHour(isha - sunset) > half) isha = sunset + half

  const fmt = t => {
    if (!Number.isFinite(t)) return ''
    const x = fixHour(t + 0.5 / 60) // dəqiqəyə yuvarlaqlaşdırma
    const h = Math.floor(x)
    const m = Math.floor((x - h) * 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  return {
    fajr: fmt(fajr), sunrise: fmt(sunrise), dhuhr: fmt(dhuhr),
    asr: fmt(asr), maghrib: fmt(maghrib), isha: fmt(isha),
  }
}

// aladhan-da xüsusi metod nömrəsi (99 = "custom") — Azərbaycan şəhərləri üçün
// Əbu Bəkr məscidinin parametrləri. Şəbəkədən hesablanan yerlər (Ramazan
// imsakiyyəsi, server bildirişləri) aladhan-a eyni parametrləri ötürür.
export const METHOD_ABUBAKR = 99
export const ABUBAKR_SETTINGS = '18.5,null,90 min'

/** aladhan sorğusu üçün metod parametrləri: 'method=13' və ya 'method=99&methodSettings=…'. */
export function aladhanMethodQuery(method) {
  return Number(method) === METHOD_ABUBAKR
    ? `method=${METHOD_ABUBAKR}&methodSettings=${encodeURIComponent(ABUBAKR_SETTINGS)}`
    : `method=${method}`
}
