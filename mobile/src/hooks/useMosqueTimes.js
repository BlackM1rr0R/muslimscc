// ═══════════════════════════════════════════════════════
// useMosqueTimes — məscidin bugünkü namaz (azan) və camaat vaxtları
// (mobil; veb src/hooks/useMosqueTimes.js ilə EYNİ qaytarma forması)
//
// • Azan vaxtları aladhan.com-dan HESABLANIR — məscidin öz koordinatı
//   (MOSQUE.geo) və metodu ilə (prayerLocation()). Göstərən ekran bunu
//   "hesablanmış" kimi qeyd etməlidir.
// • Camaat (iqamə) vaxtları MOSQUE.jamaat qaydalarından gəlir (sahibin
//   göstərişi ilə azan vaxtından hesablanır, məs. "+20"); admin paneldən
//   Firestore-a (singletons/jamaat) yazılan doldurulmuş dəyər konfiqdəkini
//   üstələyir. Qayda boşdursa camaat vaxtı '' olur — heç vaxt uydurulmur.
// • Növbəti cümə: həmin cümənin zöhr azanı ayrıca gətirilir (eyni keş) və
//   cümə qaydası ona tətbiq olunur — ekranlar "növbəti cümə" kartını
//   həftənin istənilən günü göstərə bilir.
// • Bütün saat hesabları məscidin saat qurşağında (Asia/Baku) aparılır:
//   istifadəçi başqa ölkədə olsa belə geri sayım düzgün qalır.
// • React Native: sessionStorage/window/document yoxdur — yaddaş keşi
//   (tətbiq açıq qaldıqca) + AsyncStorage (son 4 gün) istifadə olunur.
//
// Qaytarır:
//   { loading, error, date:'DD-MM-YYYY', hijri:{day,month,monthEn,monthAr,year}|null,
//     prayers:[{ key, adhan:'HH:MM', jamaat:'HH:MM'|'', rule:'+N'|'HH:MM'|'', jumua:bool }]
//                                                          // məlumat yoxdursa []
//     hasJamaat, next:{ key, adhan, jamaat, inMs, at, adhanAt, jamaatAt, target, tomorrow }|null,
//     isFriday, jumua:{ time, khutbahLang }, exact, method, tz, reload(),
//     nextFriday:{ date:'DD-MM-YYYY', daysAway:0-7, isToday, dhuhr:'HH:MM'|'',
//                  time:'HH:MM'|'', rule, loading }|null }
//   (refresh — reload-un sinonimi, köhnə çağırışlar üçün)
//
//   nextFriday: bu gün cümədirsə və cümə vaxtı hələ keçməyibsə — bu gün
//   (daysAway 0), əks halda gələn cümə. time — cümə qaydası boşdursa ''.
//
//   next.target: 'adhan' — azana qədər; 'jamaat' — azan oxunub, camaata
//   qədər (yalnız camaat vaxtı təyin olunanda). next.at: hədəfin epoch ms-i.
//   next.adhanAt / next.jamaatAt: azanın və camaatın epoch ms-i (camaat
//   yoxdursa jamaatAt = null) — ekran birbaşa camaata qədər saya bilsin.
//   Cümə günü cümə vaxtı təyin olunubsa, zöhrün camaat vaxtı = cümə vaxtı.
//   prayers[].rule: həmin namaza tətbiq olunan effektiv qayda ("azandan +20
//   dəq" / "sabit vaxt" yazısı üçün); prayers[].jumua: bu sətrin camaatı
//   cümə namazıdır.
// ═══════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MOSQUE, filled, jamaatTime, prayerLocation } from '../config/mosque'
import { subscribeToJamaat } from '../data/adminContent'

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

export const PRAYER_NAMES = {
  fajr:    { az: 'Sübh',   en: 'Fajr',    ru: 'Фаджр',  ar: 'الفجر',  tr: 'Sabah'  },
  sunrise: { az: 'Günəş',  en: 'Sunrise', ru: 'Восход', ar: 'الشروق', tr: 'Güneş'  },
  dhuhr:   { az: 'Zöhr',   en: 'Dhuhr',   ru: 'Зухр',   ar: 'الظهر',  tr: 'Öğle'   },
  asr:     { az: 'Əsr',    en: 'Asr',     ru: 'Аср',    ar: 'العصر',  tr: 'İkindi' },
  maghrib: { az: 'Məğrib', en: 'Maghrib', ru: 'Магриб', ar: 'المغرب', tr: 'Akşam'  },
  isha:    { az: 'İşa',    en: 'Isha',    ru: 'Иша',    ar: 'العشاء', tr: 'Yatsı'  },
}

// Məscidin saat qurşağı. Azərbaycanda 2016-dan yay vaxtı tətbiq olunmur —
// Bakı vaxtı il boyu UTC+4-dür. Hermes-in Intl saat qurşağı dəstəyi cihazdan
// asılı olduğu üçün mobil versiya sabit fərqlə hesablayır (nəticə eynidir).
export const MOSQUE_TZ = 'Asia/Baku'
export const MOSQUE_UTC_OFFSET_MIN = 240

// Fərz namazları — "növbəti namaz" yalnız bunlar arasından seçilir
const FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

// aladhan cavabındakı açar adları
const API_KEY = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }

const TICK_MS = 30000          // "növbəti" hər 30 saniyədən bir yenidən hesablanır
const FETCH_TIMEOUT_MS = 15000
const STORAGE_KEY = 'qm_times' // AsyncStorage: { 'DD-MM-YYYY': gün } — yeni açar
const KEEP_DAYS = 4            // bu gün, sabah, növbəti cümə + ehtiyat

// ── Saat köməkçiləri ─────────────────────────────────

const pad2 = (n) => String(n).padStart(2, '0')

/** Məscidin saat qurşağında "indi": tarix açarı, gecə yarısından saniyələr, həftə günü. */
function mosqueClock(epoch = Date.now()) {
  // UTC+4 sürüşdürülmüş an; getUTC* metodları Bakı vaxtını verir
  const d = new Date(epoch + MOSQUE_UTC_OFFSET_MIN * 60000)
  return {
    epoch,
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

/** 'DD-MM-YYYY' → növbəti günün 'DD-MM-YYYY' açarı. */
function nextDateKey(dateKey) {
  return addDaysKey(dateKey, 1)
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

/** "05:12 (+04)" / "5:12" → "05:12"; tanınmırsa ''. */
function cleanTime(v) {
  const m = String(v || '').match(/(\d{1,2}):(\d{2})/)
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : ''
}

/** "HH:MM" → gecə yarısından dəqiqələr; boşdursa null. */
function toMinutes(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}

// ── Keş: yaddaş (sinxron) + AsyncStorage (tətbiq yenidən açılanda) ──

const locSig = (loc) => `${loc.lat},${loc.lng},${loc.method}`
const memKey = (dateKey, loc) => `${dateKey}|${locSig(loc)}`

// Ekranlar arasında paylaşılır: memKey → gün məlumatı
const memCache = new Map()
// Eyni anda bir neçə ekran (ana səhifə zolağı, camaat ekranı) eyni günü
// istəyəndə yalnız BİR sorğu gedir: memKey → Promise
const inflight = new Map()

function validDay(d, dateKey, loc) {
  return !!d && d.date === dateKey && d.loc === locSig(loc) && !!d.timings
}

async function readStored(dateKey, loc) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : null
    const d = all && typeof all === 'object' ? all[dateKey] : null
    // Koordinat və ya metod dəyişibsə köhnə keşi istifadə etmə
    return validDay(d, dateKey, loc) ? d : null
  } catch {
    return null
  }
}

// Yazmalar növbə ilə gedir — bugün və sabah eyni anda yazılanda biri itməsin
let writeQueue = Promise.resolve()
function writeStored(dateKey, data) {
  writeQueue = writeQueue.then(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      const all = parsed && typeof parsed === 'object' ? parsed : {}
      all[dateKey] = data
      // Yalnız ən son KEEP_DAYS günü saxla
      const kept = {}
      Object.keys(all)
        .sort((a, b) => dateOrder(b) - dateOrder(a))
        .slice(0, KEEP_DAYS)
        .forEach(k => { kept[k] = all[k] })
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(kept))
    } catch { /* yaddaş əlçatan deyil — yalnız yaddaş keşi qalır */ }
  })
  return writeQueue
}

async function fetchDay(dateKey, loc, signal) {
  const url = `https://api.aladhan.com/v1/timings/${dateKey}` +
    `?latitude=${loc.lat}&longitude=${loc.lng}&method=${loc.method}`
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

  return { date: dateKey, loc: locSig(loc), timings, hijri }
}

/**
 * Günün məlumatını gətir: əvvəl yaddaş keşi, sonra AsyncStorage, sonra şəbəkə
 * (vaxt limiti ilə). Sorğu ekran bağlananda dayandırılmır — nəticə keşə düşür
 * və növbəti açılışda dərhal istifadə olunur (çağıran tərəf "alive" bayrağı
 * ilə köhnə nəticəni sadəcə nəzərə almır). Veb versiya ilə eyni davranış.
 */
function loadDay(dateKey, loc) {
  const mk = memKey(dateKey, loc)
  const mem = memCache.get(mk)
  if (mem) return Promise.resolve(mem)
  if (inflight.has(mk)) return inflight.get(mk)

  const p = (async () => {
    const stored = await readStored(dateKey, loc)
    if (stored) {
      memCache.set(mk, stored)
      return stored
    }
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    try {
      const d = await fetchDay(dateKey, loc, ctrl.signal)
      memCache.set(mk, d)
      writeStored(dateKey, d)
      return d
    } finally {
      clearTimeout(timer)
    }
  })().finally(() => { inflight.delete(mk) })

  inflight.set(mk, p)
  return p
}

// ── Camaat qaydalarının birləşdirilməsi ──────────────

/** Firestore-dakı doldurulmuş dəyər konfiqi üstələyir; yoxsa konfiq. */
function mergeRules(override) {
  const jamaat = {}
  for (const k of FARD) {
    const ov = override?.jamaat?.[k]
    jamaat[k] = filled(ov) ? String(ov) : (MOSQUE.jamaat?.[k] || '')
  }
  const ovTime = override?.jumua?.time
  const ovLang = override?.jumua?.khutbahLang
  return {
    jamaat,
    jumuaRule: filled(ovTime) ? String(ovTime) : (MOSQUE.jumua?.time || ''),
    // Dil obyekti bütöv halda üstələnir — dillər qarışmasın
    khutbahLang: filled(ovLang) ? ovLang : (MOSQUE.jumua?.khutbahLang || {}),
  }
}

// ═══════════════════════════════════════════════════════

export default function useMosqueTimes() {
  const loc = useMemo(() => prayerLocation(), [])

  const [clock, setClock] = useState(() => mosqueClock())
  const dateKey = clock.dateKey
  const tomorrowKey = useMemo(() => nextDateKey(dateKey), [dateKey])

  // Başqa ekran artıq yükləyibsə dərhal göstər (titrəmə olmasın)
  const [day, setDay] = useState(() => memCache.get(memKey(dateKey, loc)) || null)
  const [tomorrow, setTomorrow] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [override, setOverride] = useState(null)

  // Köhnə günün məlumatı yeni günə düşməsin (gecə yarısı keçidi)
  const today = day && day.date === dateKey ? day : null
  const nextDay = tomorrow && tomorrow.date === tomorrowKey ? tomorrow : null

  // ── Bugünkü vaxtları yüklə ──
  useEffect(() => {
    let alive = true
    setError(null)
    setPending(true)
    loadDay(dateKey, loc)
      .then(d => { if (alive) setDay(d) })
      .catch(e => {
        if (!alive) return
        // AbortError yalnız vaxt limitindən gəlir
        setError(e?.name === 'AbortError' ? 'timeout' : (e?.message || 'network'))
      })
      .finally(() => { if (alive) setPending(false) })
    return () => { alive = false }
  }, [dateKey, reloadKey, loc])

  // ── Saat: hər 30 saniyə + tətbiq yenidən ön plana gələndə ──
  useEffect(() => {
    const refresh = () => setClock(mosqueClock())
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

  // ── Camaat vaxtlarının admin üstələmələri (Firestore, real-vaxt) ──
  useEffect(() => {
    let alive = true
    let unsub = null
    try {
      unsub = subscribeToJamaat(doc => { if (alive) setOverride(doc || null) })
    } catch { /* Firebase əlçatan deyil — konfiq dəyərləri qalır */ }
    return () => {
      alive = false
      if (typeof unsub === 'function') {
        try { unsub() } catch { /* */ }
      }
    }
  }, [])

  const rules = useMemo(() => mergeRules(override), [override])

  // ── Vaxtların hesablanması ──
  const computed = useMemo(() => {
    // Azan hələ yoxdursa sabit "HH:MM" cümə vaxtı yenə göstərilir, "+N" isə ''
    if (!today) return { prayers: [], jumuaTime: jamaatTime(rules.jumuaRule, '') }
    const t = today.timings
    const jumuaTime = jamaatTime(rules.jumuaRule, t.dhuhr)
    const prayers = PRAYER_KEYS.map(key => {
      let rule = key === 'sunrise' ? '' : (rules.jamaat[key] || '')
      let jamaat = jamaatTime(rule, t[key])
      let jumua = false
      // Cümə günü zöhrün camaatı cümə namazıdır
      if (key === 'dhuhr' && clock.isFriday && jumuaTime) {
        jamaat = jumuaTime
        rule = rules.jumuaRule
        jumua = true
      }
      return { key, adhan: t[key], jamaat, rule, jumua }
    })
    return { prayers, jumuaTime }
    // clock.isFriday yalnız gün dəyişəndə dəyişir
  }, [today, rules, clock.isFriday])

  const { prayers, jumuaTime } = computed

  // ── Növbəti namaz ──
  const next = useMemo(() => {
    if (!prayers.length) return null
    const nowMs = clock.secs * 1000 + clock.ms
    // Gecə yarısından dəqiqə → epoch ms (məscidin saat qurşağında)
    const epochOf = (min, extraDays = 0) => clock.epoch + (min * 60 + extraDays * 86400) * 1000 - nowMs
    const make = (p, targetMin, target, extraDays = 0) => {
      const inMs = Math.max(0, (targetMin * 60 + extraDays * 86400) * 1000 - nowMs)
      const a = toMinutes(p.adhan)
      const j = toMinutes(p.jamaat)
      return {
        key: p.key, adhan: p.adhan, jamaat: p.jamaat, inMs, at: clock.epoch + inMs,
        adhanAt: a == null ? null : epochOf(a, extraDays),
        // Azandan əvvələ düşən (səhv) camaat vaxtı nəzərə alınmır — aşağıdakı dövrlə eyni qayda
        jamaatAt: j != null && j >= (a ?? 0) ? epochOf(j, extraDays) : null,
        target, tomorrow: extraDays > 0,
      }
    }
    for (const p of prayers) {
      if (!FARD.includes(p.key)) continue
      const a = toMinutes(p.adhan)
      if (a != null && a * 60 * 1000 > nowMs) return make(p, a, 'adhan')
      // Azan oxunub, amma camaat hələ qılınmayıb
      const j = toMinutes(p.jamaat)
      if (j != null && j >= (a ?? 0) && j * 60 * 1000 > nowMs) return make(p, j, 'jamaat')
    }
    // İşadan sonra — sabahın sübhü (sabahın vaxtı yüklənməyibsə bugünkü təxmin edilir)
    const fajrAdhan = nextDay?.timings?.fajr || prayers[0].adhan
    const fajr = { key: 'fajr', adhan: fajrAdhan, jamaat: jamaatTime(rules.jamaat.fajr, fajrAdhan) }
    const a = toMinutes(fajrAdhan)
    return a == null ? null : make(fajr, a, 'adhan', 1)
  }, [prayers, clock, nextDay, rules])

  // Bugünkü namazların hamısı keçibsə sabahın vaxtlarını da gətir
  const needTomorrow = !!next?.tomorrow
  useEffect(() => {
    if (!needTomorrow || nextDay) return
    let alive = true
    loadDay(tomorrowKey, loc)
      .then(d => { if (alive) setTomorrow(d) })
      .catch(() => { /* təxmini bugünkü sübh vaxtı qalır */ })
    return () => { alive = false }
  }, [needTomorrow, nextDay, tomorrowKey, loc])

  // ── Növbəti cümə ──
  // Bu gün cümədirsə və cümə vaxtı (təyin olunmayıbsa zöhr azanı) hələ
  // keçməyibsə — bu gün; əks halda gələn cümə. Vaxt hələ bilinmirsə
  // (yüklənir) bu gün sayılır.
  const fridayAway = useMemo(() => {
    const away = (5 - weekdayOf(dateKey) + 7) % 7
    if (away !== 0) return away
    const cutoff = toMinutes(jumuaTime) ?? toMinutes(today?.timings?.dhuhr)
    return cutoff != null && clock.secs >= cutoff * 60 ? 7 : 0
  }, [dateKey, jumuaTime, today, clock.secs])

  const fridayKey = useMemo(() => addDaysKey(dateKey, fridayAway), [dateKey, fridayAway])
  const fridayIsToday = fridayAway === 0

  // Başqa ekran artıq yükləyibsə dərhal götür (titrəmə olmasın)
  const [fridayDay, setFridayDay] = useState(() => memCache.get(memKey(fridayKey, loc)) || null)
  const [fridayFailed, setFridayFailed] = useState(null)

  // Cümənin zöhr azanını gətir — bugünkü vaxtlar yükləndikdən sonra
  // (eyni anda iki sorğu getməsin; bu gün alınmırsa cümə də alınmayacaq)
  const hasToday = !!today
  useEffect(() => {
    if (fridayIsToday || !hasToday) return
    let alive = true
    setFridayFailed(null)
    loadDay(fridayKey, loc)
      .then(d => { if (alive) setFridayDay(d) })
      .catch(() => { if (alive) setFridayFailed(fridayKey) })
    return () => { alive = false }
  }, [fridayIsToday, fridayKey, loc, reloadKey, hasToday])

  const fridayData = fridayIsToday
    ? today
    : (fridayDay && fridayDay.date === fridayKey ? fridayDay : null)
  const fridayErr = fridayIsToday ? (!today && !!error) : (fridayFailed === fridayKey || (!today && !!error))

  const nextFriday = useMemo(() => {
    const dhuhr = fridayData?.timings?.dhuhr || ''
    return {
      date: fridayKey,
      daysAway: fridayAway,
      isToday: fridayIsToday,
      dhuhr,
      // Sabit "HH:MM" qaydası azansız da işləyir; "+N" üçün zöhr azanı lazımdır
      time: jamaatTime(rules.jumuaRule, dhuhr),
      rule: rules.jumuaRule,
      loading: !fridayData && !fridayErr,
    }
  }, [fridayData, fridayKey, fridayAway, fridayIsToday, rules, fridayErr])

  // Keçid anını 30 saniyə gözləmədən dəqiq tut
  useEffect(() => {
    if (!next || next.inMs > TICK_MS) return
    const id = setTimeout(() => setClock(mosqueClock()), next.inMs + 500)
    return () => clearTimeout(id)
  }, [next])

  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  return {
    loading: !today && (pending || !error),
    error: today ? null : error,
    date: dateKey,
    hijri: today?.hijri || null,
    prayers,
    hasJamaat: prayers.some(p => filled(p.jamaat)),
    next,
    isFriday: clock.isFriday,
    jumua: { time: jumuaTime, khutbahLang: rules.khutbahLang },
    nextFriday,
    exact: loc.exact,
    method: loc.method,
    tz: MOSQUE_TZ,
    reload,
    refresh: reload,
  }
}
