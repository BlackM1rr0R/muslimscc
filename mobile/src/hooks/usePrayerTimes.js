// ═══════════════════════════════════════════════════════
// usePrayerTimes — istifadəçinin seçdiyi şəhər üçün bugünkü AZAN vaxtları
// (mobil; veb src/hooks/usePrayerTimes ilə eyni qayda — əvvəlki məscid hook-unun yerinə)
//
// • Yalnız AZAN vaxtları — aladhan.com-dan HESABLANIR (göstərən ekran bunu
//   "hesablanmış" kimi qeyd etməlidir). Camaat (iqamə) və cümə vaxtı
//   qaydaları YOXDUR — tətbiq konkret bir məscidə bağlı deyil.
// • Şəhər: istifadəçinin seçdiyi şəhər (Namaz / Bildirişlər ekranında
//   seçilir — services/prayerLocation.js). Seçim yoxdursa admin paneldəki
//   standart şəhər, o da yoxdursa config/brand.js-dəki DEFAULT_PRAYER_LOCATION.
// • Bütün saat hesabları ŞƏHƏRİN saat qurşağında aparılır: aladhan cavabı
//   iso8601 formatında istənir və UTC fərqi oradan götürülür (yay vaxtı
//   olan şəhərlər üçün də düzgün). Cavab gələnə qədər şəhər siyahısındakı
//   standart fərq işlədilir. Hermes-in Intl saat qurşağı dəstəyi cihazdan
//   asılı olduğu üçün Intl istifadə olunmur.
// • React Native: sessionStorage/window yoxdur — yaddaş keşi (tətbiq açıq
//   qaldıqca) + AsyncStorage (son 4 gün) istifadə olunur.
//
// Qaytarır:
//   { loading, error, date:'DD-MM-YYYY', hijri:{day,month,monthEn,monthAr,year}|null,
//     city:{ id, name:{az,en,ru,ar,tr}, isDefault },
//     prayers:[{ key, adhan:'HH:MM' }]                      // məlumat yoxdursa []
//     next:{ key, adhan, inMs, at, tomorrow }|null,
//     isFriday,
//     nextFriday:{ date:'DD-MM-YYYY', daysAway:0-7, isToday, dhuhr:'HH:MM'|'', loading },
//     method, utcOffsetMin, location, reload(), refresh() }
//
//   nextFriday: bu gün cümədirsə və zöhr azanı hələ oxunmayıbsa — bu gün
//   (daysAway 0), əks halda gələn cümə; dhuhr — həmin cümənin zöhr azanı.
// ═══════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { usePrayerLocation, locationSig } from '../services/prayerLocation'

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

export const PRAYER_NAMES = {
  fajr:    { az: 'Sübh',   en: 'Fajr',    ru: 'Фаджр',  ar: 'الفجر',  tr: 'Sabah'  },
  sunrise: { az: 'Günəş',  en: 'Sunrise', ru: 'Восход', ar: 'الشروق', tr: 'Güneş'  },
  dhuhr:   { az: 'Zöhr',   en: 'Dhuhr',   ru: 'Зухр',   ar: 'الظهر',  tr: 'Öğle'   },
  asr:     { az: 'Əsr',    en: 'Asr',     ru: 'Аср',    ar: 'العصر',  tr: 'İkindi' },
  maghrib: { az: 'Məğrib', en: 'Maghrib', ru: 'Магриб', ar: 'المغرب', tr: 'Akşam'  },
  isha:    { az: 'İşa',    en: 'Isha',    ru: 'Иша',    ar: 'العشاء', tr: 'Yatsı'  },
}

// Şəhər siyahısı və seçim — services/prayerLocation.js (Namaz ekranı və
// bildirişlərlə ortaq); burada rahatlıq üçün yenidən ixrac olunur.
export { PRAYER_CITIES, setPrayerCity, usePrayerLocation } from '../services/prayerLocation'

// ── Sabitlər ─────────────────────────────────────────

// Fərz namazları — "növbəti namaz" yalnız bunlar arasından seçilir
const FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

// aladhan cavabındakı açar adları
const API_KEY = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }

const TICK_MS = 30000          // "növbəti" hər 30 saniyədən bir yenidən hesablanır
const FETCH_TIMEOUT_MS = 15000
const STORAGE_KEY = 'muslim_cc_prayer_times' // AsyncStorage: { 'açar': gün }
const KEEP_DAYS = 4            // bu gün, sabah, növbəti cümə + ehtiyat

// ── Saat köməkçiləri ─────────────────────────────────

const pad2 = (n) => String(n).padStart(2, '0')

/** Şəhərin saat qurşağında "indi": tarix açarı, gecə yarısından saniyələr, həftə günü. */
function cityClock(offsetMin, epoch = Date.now()) {
  // Sürüşdürülmüş an; getUTC* metodları şəhərin yerli vaxtını verir
  const d = new Date(epoch + offsetMin * 60000)
  return {
    epoch,
    offsetMin,
    dateKey: `${pad2(d.getUTCDate())}-${pad2(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`,
    secs: d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds(),
    ms: d.getUTCMilliseconds(),
    isFriday: d.getUTCDay() === 5,
  }
}

/** 'DD-MM-YYYY' + N gün → 'DD-MM-YYYY' açarı. */
function addDaysKey(dateKey, days) {
  const [d, m, y] = dateKey.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return `${pad2(t.getUTCDate())}-${pad2(t.getUTCMonth() + 1)}-${t.getUTCFullYear()}`
}

/** 'DD-MM-YYYY' → həftə günü (0 = bazar, 5 = cümə). */
function weekdayOf(dateKey) {
  const [d, m, y] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()
}

/** 'DD-MM-YYYY' → müqayisə üçün YYYYMMDD ədədi. */
function dateOrder(dateKey) {
  const [d, m, y] = String(dateKey).split('-').map(Number)
  return (y || 0) * 10000 + (m || 0) * 100 + (d || 0)
}

/** "2026-10-27T05:12:00+04:00" / "05:12 (+04)" / "5:12" → "05:12"; tanınmırsa ''. */
function cleanTime(v) {
  const s = String(v || '')
  const iso = s.match(/T(\d{2}):(\d{2})/)
  if (iso) return `${iso[1]}:${iso[2]}`
  const m = s.match(/(\d{1,2}):(\d{2})/)
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : ''
}

/** ISO vaxtın sonundakı UTC fərqi ("+04:00", "-05:00", "Z") → dəqiqə; yoxdursa null. */
function isoOffsetMin(v) {
  const s = String(v || '')
  if (/T\d{2}:\d{2}(:\d{2})?Z$/.test(s)) return 0
  const m = s.match(/T\d{2}:\d{2}(?::\d{2})?([+-])(\d{2}):?(\d{2})$/)
  if (!m) return null
  const min = Number(m[2]) * 60 + Number(m[3])
  return m[1] === '-' ? -min : min
}

/** "HH:MM" → gecə yarısından dəqiqələr; boşdursa null. */
function toMinutes(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}

// ── Keş: yaddaş (sinxron) + AsyncStorage (tətbiq yenidən açılanda) ──

const locSig = (city) => locationSig(city)
const memKey = (dateKey, city) => `${dateKey}|${locSig(city)}`

// Ekranlar arasında paylaşılır: memKey → gün məlumatı
const memCache = new Map()
// Eyni anda bir neçə ekran eyni günü istəyəndə yalnız BİR sorğu gedir
const inflight = new Map()
// Yerin son bilinən UTC fərqi (aladhan cavabından): locSig → dəqiqə
const offsetCache = new Map()

const offsetOf = (city) => offsetCache.get(locSig(city)) ?? city.utcOffsetMin

function validDay(d, dateKey, city) {
  return !!d && d.date === dateKey && d.loc === locSig(city) && !!d.timings
}

async function readStored(dateKey, city) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : null
    const d = all && typeof all === 'object' ? all[memKey(dateKey, city)] : null
    return validDay(d, dateKey, city) ? d : null
  } catch {
    return null
  }
}

// Yazmalar növbə ilə gedir — bugün və sabah eyni anda yazılanda biri itməsin
let writeQueue = Promise.resolve()
function writeStored(key, data) {
  writeQueue = writeQueue.then(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      const all = parsed && typeof parsed === 'object' ? parsed : {}
      all[key] = data
      // Yalnız ən son KEEP_DAYS yazını saxla
      const kept = {}
      Object.keys(all)
        .sort((a, b) => dateOrder(all[b]?.date) - dateOrder(all[a]?.date))
        .slice(0, KEEP_DAYS)
        .forEach(k => { kept[k] = all[k] })
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(kept))
    } catch { /* yaddaş əlçatan deyil — yalnız yaddaş keşi qalır */ }
  })
  return writeQueue
}

async function fetchDay(dateKey, city, signal) {
  const url = `https://api.aladhan.com/v1/timings/${dateKey}` +
    `?latitude=${city.lat}&longitude=${city.lng}&method=${city.method}&iso8601=true`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const t = json?.data?.timings
  if (!t) throw new Error('bad response')

  const timings = {}
  for (const k of PRAYER_KEYS) timings[k] = cleanTime(t[API_KEY[k]])
  if (FARD.some(k => !timings[k])) throw new Error('bad response')

  const h = json.data.date?.hijri
  const hijri = h ? {
    day: String(h.day || ''),
    month: Number(h.month?.number) || null,
    monthEn: h.month?.en || '',
    monthAr: h.month?.ar || '',
    year: String(h.year || ''),
  } : null

  return { date: dateKey, loc: locSig(city), timings, hijri, offsetMin: isoOffsetMin(t.Fajr) }
}

function remember(mk, d, city) {
  memCache.set(mk, d)
  if (Number.isFinite(d.offsetMin)) offsetCache.set(locSig(city), d.offsetMin)
}

/**
 * Günün məlumatını gətir: əvvəl yaddaş keşi, sonra AsyncStorage, sonra şəbəkə
 * (vaxt limiti ilə). Sorğu ekran bağlananda dayandırılmır — nəticə keşə düşür.
 */
function loadDay(dateKey, city) {
  const mk = memKey(dateKey, city)
  const mem = memCache.get(mk)
  if (mem) return Promise.resolve(mem)
  if (inflight.has(mk)) return inflight.get(mk)

  const p = (async () => {
    const stored = await readStored(dateKey, city)
    if (stored) {
      remember(mk, stored, city)
      return stored
    }
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    try {
      const d = await fetchDay(dateKey, city, ctrl.signal)
      remember(mk, d, city)
      writeStored(mk, d)
      return d
    } finally {
      clearTimeout(timer)
    }
  })().finally(() => { inflight.delete(mk) })

  inflight.set(mk, p)
  return p
}

// ═══════════════════════════════════════════════════════

export default function usePrayerTimes() {
  // Seçilmiş şəhər (istifadəçi → admin standartı → DEFAULT_PRAYER_LOCATION)
  const city = usePrayerLocation()

  const [tick, setTick] = useState(() => Date.now())
  // UTC fərqi: cavabdan öyrənilibsə o, yoxsa şəhər siyahısındakı təxmini dəyər
  const [offsetMin, setOffsetMin] = useState(() => offsetOf(city))
  useEffect(() => { setOffsetMin(offsetOf(city)) }, [city])

  const clock = useMemo(() => cityClock(offsetMin, tick), [offsetMin, tick])
  const dateKey = clock.dateKey
  const tomorrowKey = useMemo(() => addDaysKey(dateKey, 1), [dateKey])

  // Başqa ekran artıq yükləyibsə dərhal göstər (titrəmə olmasın)
  const [day, setDay] = useState(() => memCache.get(memKey(dateKey, city)) || null)
  const [tomorrow, setTomorrow] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Köhnə günün və ya köhnə şəhərin məlumatı göstərilməsin
  const today = day && day.date === dateKey && day.loc === locSig(city) ? day : null
  const nextDay = tomorrow && tomorrow.date === tomorrowKey && tomorrow.loc === locSig(city) ? tomorrow : null

  // ── Bugünkü vaxtları yüklə ──
  useEffect(() => {
    let alive = true
    setError(null)
    setPending(true)
    loadDay(dateKey, city)
      .then(d => {
        if (!alive) return
        setDay(d)
        // Əsl UTC fərqi təxminidən fərqlidirsə saatı düzəlt
        if (Number.isFinite(d.offsetMin)) setOffsetMin(d.offsetMin)
      })
      .catch(e => {
        if (!alive) return
        // AbortError yalnız vaxt limitindən gəlir
        setError(e?.name === 'AbortError' ? 'timeout' : (e?.message || 'network'))
      })
      .finally(() => { if (alive) setPending(false) })
    return () => { alive = false }
  }, [dateKey, reloadKey, city])

  // ── Saat: hər 30 saniyə + tətbiq yenidən ön plana gələndə ──
  useEffect(() => {
    const refresh = () => setTick(Date.now())
    const id = setInterval(refresh, TICK_MS)
    let sub = null
    try {
      sub = AppState.addEventListener('change', (state) => { if (state === 'active') refresh() })
    } catch { /* AppState yoxdur (məs. testlər) */ }
    return () => {
      clearInterval(id)
      try { sub?.remove?.() } catch { /* */ }
    }
  }, [])

  // ── Azan vaxtları ──
  const prayers = useMemo(() => (
    today ? PRAYER_KEYS.map(key => ({ key, adhan: today.timings[key] })) : []
  ), [today])

  // ── Növbəti namaz ──
  const next = useMemo(() => {
    if (!prayers.length) return null
    const nowMs = clock.secs * 1000 + clock.ms
    const make = (p, targetMin, extraDays = 0) => {
      const inMs = Math.max(0, (targetMin * 60 + extraDays * 86400) * 1000 - nowMs)
      return { key: p.key, adhan: p.adhan, inMs, at: clock.epoch + inMs, tomorrow: extraDays > 0 }
    }
    for (const p of prayers) {
      if (!FARD.includes(p.key)) continue
      const a = toMinutes(p.adhan)
      if (a != null && a * 60 * 1000 > nowMs) return make(p, a)
    }
    // İşadan sonra — sabahın sübhü (sabahın vaxtı yüklənməyibsə bugünkü təxmin edilir)
    const fajrAdhan = nextDay?.timings?.fajr || prayers[0].adhan
    const a = toMinutes(fajrAdhan)
    return a == null ? null : make({ key: 'fajr', adhan: fajrAdhan }, a, 1)
  }, [prayers, clock, nextDay])

  // Bugünkü namazların hamısı keçibsə sabahın vaxtlarını da gətir
  const needTomorrow = !!next?.tomorrow
  useEffect(() => {
    if (!needTomorrow || nextDay) return
    let alive = true
    loadDay(tomorrowKey, city)
      .then(d => { if (alive) setTomorrow(d) })
      .catch(() => { /* təxmini bugünkü sübh vaxtı qalır */ })
    return () => { alive = false }
  }, [needTomorrow, nextDay, tomorrowKey, city])

  // ── Növbəti cümə ──
  // Bu gün cümədirsə və zöhr azanı hələ oxunmayıbsa — bu gün; əks halda
  // gələn cümə. Vaxt hələ bilinmirsə (yüklənir) bu gün sayılır.
  const fridayAway = useMemo(() => {
    const away = (5 - weekdayOf(dateKey) + 7) % 7
    if (away !== 0) return away
    const cutoff = toMinutes(today?.timings?.dhuhr)
    return cutoff != null && clock.secs >= cutoff * 60 ? 7 : 0
  }, [dateKey, today, clock.secs])

  const fridayKey = useMemo(() => addDaysKey(dateKey, fridayAway), [dateKey, fridayAway])
  const fridayIsToday = fridayAway === 0

  const [fridayDay, setFridayDay] = useState(() => memCache.get(memKey(fridayKey, city)) || null)
  const [fridayFailed, setFridayFailed] = useState(null)

  // Cümənin zöhr azanını gətir — bugünkü vaxtlar yükləndikdən sonra
  const hasToday = !!today
  useEffect(() => {
    if (fridayIsToday || !hasToday) return
    let alive = true
    setFridayFailed(null)
    loadDay(fridayKey, city)
      .then(d => { if (alive) setFridayDay(d) })
      .catch(() => { if (alive) setFridayFailed(fridayKey) })
    return () => { alive = false }
  }, [fridayIsToday, fridayKey, city, reloadKey, hasToday])

  const fridayData = fridayIsToday
    ? today
    : (fridayDay && fridayDay.date === fridayKey && fridayDay.loc === locSig(city) ? fridayDay : null)
  const fridayErr = fridayIsToday ? (!today && !!error) : (fridayFailed === fridayKey || (!today && !!error))

  const nextFriday = useMemo(() => ({
    date: fridayKey,
    daysAway: fridayAway,
    isToday: fridayIsToday,
    dhuhr: fridayData?.timings?.dhuhr || '',
    loading: !fridayData && !fridayErr,
  }), [fridayData, fridayKey, fridayAway, fridayIsToday, fridayErr])

  // Keçid anını 30 saniyə gözləmədən dəqiq tut
  useEffect(() => {
    if (!next || next.inMs > TICK_MS) return
    const id = setTimeout(() => setTick(Date.now()), next.inMs + 500)
    return () => clearTimeout(id)
  }, [next])

  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  return {
    loading: !today && (pending || !error),
    error: today ? null : error,
    date: dateKey,
    hijri: today?.hijri || null,
    city: { id: city.id, name: city.city, isDefault: city.isDefault },
    prayers,
    next,
    isFriday: clock.isFriday,
    nextFriday,
    method: city.method,
    utcOffsetMin: offsetMin,
    location: city,   // veb usePrayerTimes ilə eyni ad (tam yer obyekti)
    reload,
    refresh: reload,
  }
}
