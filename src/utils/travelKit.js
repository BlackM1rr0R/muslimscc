// ═══════════════════════════════════════════════════════
// Müsəlman səyyahın dəsti (/traveller-kit) — saf hesab ("Səfərlərim" yaddaşı — utils/travelTrips)
//
// • Təyinat: saytın şəhər siyahısı və ya Open-Meteo geocoding (CityPicker / RoadTripPrayer ilə eyni mənbə).
//   Seçim saytın namaz şəhərini DƏYİŞMİR — yalnız istifadəçi "namaz şəhərim et" düyməsini basanda.
// • Namaz vaxtları — utils/prayCalc (saytın öz hesabı): Azərbaycan şəhərləri — Əbu Bəkr məscidinin
//   parametrləri, qalan ölkələr — Diyanət (aladhan 13 ilə eyni; seo/prayerCity → methodOf). Əsr — məzhəb seçimi.
// • Qiblə — utils/rasdQibla → bearing + KAABA (saytın qiblə həndəsəsi).
// • Tarixi qeyd: YALNIZ saytda mənbəli məlumat varsa — İbn Bəttutənin dayanacaqları (data/ibnBattuta, Rihla;
//   Dunn) və Quranda adı keçən yerlər (data/prophetPlaces, ayə istinadı ilə). Yaxında yoxdursa — göstərilmir.
//
// tests/unit/travel-kit.test.js
// ═══════════════════════════════════════════════════════
import { CALC_METHODS, computeTimes, tzOffsetHours, withAsr } from './prayCalc'
import { bearing, KAABA } from './rasdQibla'

export const HISTORY_KM = 60

// ── Hesab ──

const ymdFmt = new Map()
/** ms anında saat qurşağındakı təqvim günü { year, month, day } (formatter keşlənir) */
export function zonedYMD(ms, tz) {
  let f = ymdFmt.get(tz)
  if (!f) {
    try { f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }) } catch { f = null }
    ymdFmt.set(tz, f)
  }
  if (!f) { const d = new Date(ms); return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } }
  const p = {}
  for (const x of f.formatToParts(new Date(ms))) p[x.type] = x.value
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day) }
}

export const ymdKey = (g) => `${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}`
export function parseYmd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''))
  if (!m) return null
  const g = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
  const d = new Date(Date.UTC(g.year, g.month - 1, g.day))
  return d.getUTCMonth() === g.month - 1 && d.getUTCDate() === g.day ? g : null
}

/** Ölkəyə görə metod: Azərbaycan — Əbu Bəkr məscidi, qalanları — Diyanət (seo/prayerCity → methodOf ilə eyni) */
export const methodKeyOf = (cc) => (String(cc || '').toUpperCase() === 'AZ' ? 'abubakr' : 'diyanet')

/** Təyinatın bir günün vaxtları: { key, times: { fajr … isha }, tzHours } */
export function destTimes(place, date, asrFactor = 1) {
  const key = methodKeyOf(place.country)
  const tzHours = tzOffsetHours(place.tz, date.year, date.month, date.day)
  const times = computeTimes(date, place.lat, place.lng, tzHours, withAsr(CALC_METHODS[key], asrFactor))
  return { key, times, tzHours }
}

/** İki saat qurşağının həmin andakı fərqi (dəqiqə): + — təyinat irəlidədir */
export function tzDiffMin(homeTz, destTz, ms = Date.now()) {
  const h = zonedYMD(ms, homeTz), d = zonedYMD(ms, destTz)
  const off = (tz, g) => tzOffsetHours(tz, g.year, g.month, g.day)
  return Math.round((off(destTz, d) - off(homeTz, h)) * 60)
}

const RAD = Math.PI / 180
/** İki nöqtə arasında böyük dairə məsafəsi (km) */
export function haversineKm(a, b) {
  const dLat = (b.lat - a.lat) * RAD, dLng = (b.lng - a.lng) * RAD
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2
  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** Qiblə: { deg — şimaldan saat əqrəbi ilə, km — Kəbəyə qədər, point — 0…7 (Ş, ŞŞ, Ş … ŞQ) } */
export function qiblaFor(place) {
  const deg = bearing({ lat: place.lat, lng: place.lng }, KAABA)
  return { deg, km: haversineKm(place, KAABA), point: Math.round(deg / 45) % 8 }
}

/**
 * Yaxındakı mənbəli tarixi qeydlər (data modulları çağıranda ötürülür — tənbəl yüklənsin):
 *   stops  — data/ibnBattuta → IBN_BATTUTA_STOPS [{ name, lat, lon, year, approx, note }]
 *   places — data/prophetPlaces → PROPHET_PLACES [{ id, at: [lat, lng], approx, refs, name }]
 * Qaytarır: { battuta: [...] (ən çox 3, yaxından uzağa), quran: [...] (ən çox 2) }
 */
export function historyNear(place, { stops = [], places = [] } = {}, maxKm = HISTORY_KM) {
  const battuta = []
  for (const s of stops) {
    const km = haversineKm(place, { lat: s.lat, lng: s.lon })
    if (km <= maxKm) battuta.push({ ...s, km })
  }
  const quran = []
  for (const p of places) {
    if (!Array.isArray(p.at)) continue
    const km = haversineKm(place, { lat: p.at[0], lng: p.at[1] })
    if (km <= maxKm) quran.push({ ...p, km })
  }
  const byKm = (a, b) => a.km - b.km
  return { battuta: battuta.sort(byKm).slice(0, 3).sort((a, b) => a.year - b.year), quran: quran.sort(byKm).slice(0, 2) }
}
