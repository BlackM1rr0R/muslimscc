// ═══════════════════════════════════════════════════════
// usePrayerTimes — istifadəçinin SEÇDİYİ şəhərin bugünkü azan vaxtları
//
// • Yer utils/prayerLocation.js-dəndir (bütün saytda ortaq seçim: /prayer-də
//   şəhər dəyişəndə ana səhifə və /jamaat da dərhal yenilənir). Hook-a yer
//   ötürülsə (usePrayerTimes(loc)), o istifadə olunur.
// • Vaxtlar aladhan.com-dan koordinat və metodla HESABLANIR — göstərən
//   komponent bunu "hesablanmış" kimi qeyd etməlidir.
// • Bütün saat hesabları SEÇİLMİŞ şəhərin saat qurşağında (loc.tz) aparılır:
//   ziyarətçi başqa ölkədə olsa belə geri sayım düzgün qalır.
// • Camaat (iqamə) vaxtı YOXDUR — sayt konkret məscidin saytı deyil.
//
// Qaytarır:
//   { loading, error, date:'DD-MM-YYYY', hijri:{day,month,monthEn,monthAr,year}|null,
//     prayers:[{ key, adhan:'HH:MM' }]            // məlumat yoxdursa []
//     next:{ key, adhan, inMs, at, prevAt, tomorrow }|null,
//     isFriday, nextJumua:{ date, isToday, inDays, adhan, loading },
//     nowSecs, method, tz, location, reload() }
//
//   next.at — növbəti fərz namazın azanının epoch ms-i; next.prevAt —
//   əvvəlki fərz namazın azanı (irəliləyiş zolağı üçün; bilinmirsə null).
//   nextJumua — növbəti cümə günü və həmin günün zöhr azanı (cümə namazı
//   zöhr vaxtında qılınır). Bu gün cümədirsə və zöhr hələ çatmayıbsa — bu gün.
//   nowSecs — şəhərin saat qurşağında gecə yarısından keçən saniyələr.
// ═══════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePrayerLocation, locationSig } from '../utils/prayerLocation'

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

export const PRAYER_NAMES = {
  fajr:    { az: 'Sübh',   en: 'Fajr',    ru: 'Фаджр',  ar: 'الفجر',  tr: 'Sabah'  },
  sunrise: { az: 'Günəş',  en: 'Sunrise', ru: 'Восход', ar: 'الشروق', tr: 'Güneş'  },
  dhuhr:   { az: 'Zöhr',   en: 'Dhuhr',   ru: 'Зухр',   ar: 'الظهر',  tr: 'Öğle'   },
  asr:     { az: 'Əsr',    en: 'Asr',     ru: 'Аср',    ar: 'العصر',  tr: 'İkindi' },
  maghrib: { az: 'Məğrib', en: 'Maghrib', ru: 'Магриб', ar: 'المغرب', tr: 'Akşam'  },
  isha:    { az: 'İşa',    en: 'Isha',    ru: 'Иша',    ar: 'العشاء', tr: 'Yatsı'  },
}

// Fərz namazları — "növbəti namaz" yalnız bunlar arasından seçilir
export const FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

// aladhan cavabındakı açar adları
const API_KEY = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }

const TICK_MS = 30000          // "növbəti" hər 30 saniyədən bir yenidən hesablanır
const FETCH_TIMEOUT_MS = 15000
const CACHE_PREFIX = 'qm_ptimes_'
const FRIDAY = 5

// ── Saat köməkçiləri ─────────────────────────────────

const tzFormatters = new Map()
function getTzFormatter(tz) {
  if (!tzFormatters.has(tz)) {
    tzFormatters.set(tz, new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      weekday: 'short', hourCycle: 'h23',
    }))
  }
  return tzFormatters.get(tz)
}

const pad2 = (n) => String(n).padStart(2, '0')

/** Şəhərin saat qurşağında "indi": tarix açarı, gecə yarısından saniyələr, həftə günü. */
function cityClock(tz, epoch = Date.now()) {
  try {
    const parts = {}
    for (const p of getTzFormatter(tz).formatToParts(new Date(epoch))) parts[p.type] = p.value
    const h = Number(parts.hour) % 24
    return {
      epoch,
      dateKey: `${parts.day}-${parts.month}-${parts.year}`,
      secs: h * 3600 + Number(parts.minute) * 60 + Number(parts.second),
      ms: epoch % 1000,
      isFriday: parts.weekday === 'Fri',
    }
  } catch {
    // Intl saat qurşağını tanımırsa — cihazın yerli vaxtı
    const d = new Date(epoch)
    return {
      epoch,
      dateKey: `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`,
      secs: d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(),
      ms: d.getMilliseconds(),
      isFriday: d.getDay() === 5,
    }
  }
}

/** 'DD-MM-YYYY' → N gün sonrakı 'DD-MM-YYYY' açarı. */
function addDaysKey(dateKey, days) {
  const [d, m, y] = dateKey.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return `${pad2(t.getUTCDate())}-${pad2(t.getUTCMonth() + 1)}-${t.getUTCFullYear()}`
}

/** 'DD-MM-YYYY' → həftə günü (0 = bazar ... 5 = cümə). */
function weekdayOf(dateKey) {
  const [d, m, y] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** "05:12 (+04)" / "5:12" → "05:12"; tanınmırsa ''. */
function cleanTime(v) {
  const m = String(v || '').match(/(\d{1,2}):(\d{2})/)
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : ''
}

/** "HH:MM" → gecə yarısından dəqiqələr; boşdursa null. */
export function toMinutes(hhmm) {
  if (!hhmm) return null
  const [h, m] = String(hhmm).split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}

// ── Keş (gün + yer üzrə) ─────────────────────────────

// Yaddaşdakı keş — sessionStorage bağlı olanda da eyni səhifədə təkrar sorğu getməsin
const memCache = new Map()
// Eyni anda bir neçə komponent (ana səhifə kartı, /jamaat) eyni günü
// istəyəndə yalnız BİR şəbəkə sorğusu gedir
const inflight = new Map()

const cacheKey = (dateKey, loc) => `${dateKey}|${locationSig(loc)}`

function readCache(dateKey, loc) {
  const key = cacheKey(dateKey, loc)
  if (memCache.has(key)) return memCache.get(key)
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!d || d.date !== dateKey || d.loc !== locationSig(loc) || !d.timings) return null
    memCache.set(key, d)
    return d
  } catch {
    return null
  }
}

function writeCache(dateKey, loc, data) {
  const key = cacheKey(dateKey, loc)
  memCache.set(key, data)
  try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data)) } catch { /* yaddaş bağlıdır */ }
}

async function fetchDay(dateKey, loc, signal) {
  // timezonestring: aladhan vaxtları məhz şəhərin saat qurşağında qaytarsın
  const url = `https://api.aladhan.com/v1/timings/${dateKey}` +
    `?latitude=${loc.lat}&longitude=${loc.lng}&method=${loc.method}` +
    (loc.tz ? `&timezonestring=${encodeURIComponent(loc.tz)}` : '')
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

  return { date: dateKey, loc: locationSig(loc), timings, hijri }
}

/**
 * Günün məlumatını gətir: əvvəl keş, sonra şəbəkə (vaxt limiti ilə).
 * Sorğu komponent silinəndə dayandırılmır — nəticə keşə düşür.
 */
function loadDay(dateKey, loc) {
  const cached = readCache(dateKey, loc)
  if (cached) return Promise.resolve(cached)
  const key = cacheKey(dateKey, loc)
  if (inflight.has(key)) return inflight.get(key)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  const p = fetchDay(dateKey, loc, ctrl.signal)
    .then(d => { writeCache(dateKey, loc, d); return d })
    .finally(() => {
      clearTimeout(timer)
      inflight.delete(key)
    })
  inflight.set(key, p)
  return p
}

// ═══════════════════════════════════════════════════════

export default function usePrayerTimes(locOverride) {
  const shared = usePrayerLocation()
  const loc = locOverride || shared
  const sig = locationSig(loc)

  const [clock, setClock] = useState(() => cityClock(loc.tz))
  // Şəhər dəyişəndə saat da yeni saat qurşağına keçsin
  useEffect(() => { setClock(cityClock(loc.tz)) }, [loc.tz])

  const dateKey = clock.dateKey
  const tomorrowKey = useMemo(() => addDaysKey(dateKey, 1), [dateKey])

  const [day, setDay] = useState(() => readCache(dateKey, loc))
  const [tomorrow, setTomorrow] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Köhnə günün / köhnə şəhərin məlumatı göstərilməsin
  const today = day && day.date === dateKey && day.loc === sig ? day : null
  const nextDay = tomorrow && tomorrow.date === tomorrowKey && tomorrow.loc === sig ? tomorrow : null

  // ── Bugünkü vaxtları yüklə ──
  useEffect(() => {
    let alive = true
    setError(null)
    const cached = readCache(dateKey, loc)
    if (cached) { setDay(cached); setPending(false); return undefined }
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
    // loc obyektinin özü yox, vaxta təsir edən imzası izlənir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, reloadKey, sig])

  // ── Saat: hər 30 saniyə + tab yenidən görünəndə ──
  useEffect(() => {
    const refresh = () => setClock(cityClock(loc.tz))
    const id = setInterval(refresh, TICK_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loc.tz])

  const prayers = useMemo(
    () => (today ? PRAYER_KEYS.map(key => ({ key, adhan: today.timings[key] })) : []),
    [today],
  )

  // ── Növbəti namaz (yalnız fərzlər) ──
  const next = useMemo(() => {
    if (!prayers.length) return null
    const nowMs = clock.secs * 1000 + clock.ms
    const epochOf = (min, extraDays = 0) => clock.epoch + (min * 60 + extraDays * 86400) * 1000 - nowMs
    const fard = prayers.filter(p => FARD.includes(p.key))
    for (let i = 0; i < fard.length; i++) {
      const p = fard[i]
      const a = toMinutes(p.adhan)
      if (a != null && a * 60 * 1000 > nowMs) {
        // Əvvəlki fərz: sübhdən əvvəl — dünənki işa (bugünkü vaxtla təxmini)
        const prev = i > 0 ? toMinutes(fard[i - 1].adhan) : toMinutes(fard[fard.length - 1].adhan)
        const prevAt = prev == null ? null : epochOf(prev, i > 0 ? 0 : -1)
        const at = epochOf(a)
        return { key: p.key, adhan: p.adhan, inMs: at - clock.epoch, at, prevAt, tomorrow: false }
      }
    }
    // İşadan sonra — sabahın sübhü (sabahın vaxtı yüklənməyibsə bugünkü təxmin edilir)
    const fajrAdhan = nextDay?.timings?.fajr || prayers[0].adhan
    const a = toMinutes(fajrAdhan)
    if (a == null) return null
    const isha = toMinutes(fard[fard.length - 1].adhan)
    const at = epochOf(a, 1)
    return {
      key: 'fajr', adhan: fajrAdhan, inMs: at - clock.epoch, at,
      prevAt: isha == null ? null : epochOf(isha), tomorrow: true,
    }
  }, [prayers, clock, nextDay])

  // Bugünkü namazların hamısı keçibsə sabahın vaxtlarını da gətir
  const needTomorrow = !!next?.tomorrow
  useEffect(() => {
    if (!needTomorrow || nextDay) return undefined
    let alive = true
    loadDay(tomorrowKey, loc)
      .then(d => { if (alive) setTomorrow(d) })
      .catch(() => { /* təxmini bugünkü sübh vaxtı qalır */ })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needTomorrow, nextDay, tomorrowKey, sig])

  // ── Növbəti cümə ──
  // Bu gün cümədirsə: zöhr hələ çatmayıbsa bu gün, çatıbsa gələn həftə.
  const todayDhuhr = today ? toMinutes(today.timings.dhuhr) : null
  const dhuhrPassed = todayDhuhr != null && clock.secs >= todayDhuhr * 60
  const fridayOffset = useMemo(() => {
    const add = (FRIDAY - weekdayOf(dateKey) + 7) % 7
    return add === 0 && dhuhrPassed ? 7 : add
  }, [dateKey, dhuhrPassed])
  const fridayKey = useMemo(() => addDaysKey(dateKey, fridayOffset), [dateKey, fridayOffset])

  const [friday, setFriday] = useState(null)
  const [fridayFailed, setFridayFailed] = useState('')
  const fridayDay = fridayOffset === 0
    ? today
    : (friday && friday.date === fridayKey && friday.loc === sig ? friday : null)

  useEffect(() => {
    if (fridayOffset === 0) return undefined
    let alive = true
    setFridayFailed('')
    loadDay(fridayKey, loc)
      .then(d => { if (alive) setFriday(d) })
      .catch(() => { if (alive) setFridayFailed(fridayKey) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fridayOffset, fridayKey, reloadKey, sig])

  const nextJumua = useMemo(() => ({
    date: fridayKey,
    isToday: fridayOffset === 0,
    inDays: fridayOffset,
    adhan: fridayDay?.timings?.dhuhr || '',
    loading: !fridayDay && (fridayOffset === 0 ? !error : fridayFailed !== fridayKey),
  }), [fridayDay, fridayKey, fridayOffset, error, fridayFailed])

  // Keçid anını 30 saniyə gözləmədən dəqiq tut
  useEffect(() => {
    if (!next || next.inMs > TICK_MS) return undefined
    const id = setTimeout(() => setClock(cityClock(loc.tz)), Math.max(0, next.inMs) + 500)
    return () => clearTimeout(id)
  }, [next, loc.tz])

  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  return {
    loading: !today && (pending || !error),
    error: today ? null : error,
    date: dateKey,
    hijri: today?.hijri || null,
    prayers,
    next,
    isFriday: clock.isFriday,
    nextJumua,
    nowSecs: clock.secs,
    method: loc.method,
    tz: loc.tz,
    location: loc,
    reload,
  }
}
