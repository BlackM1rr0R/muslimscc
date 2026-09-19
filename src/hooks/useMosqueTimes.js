// ═══════════════════════════════════════════════════════
// useMosqueTimes — məscidin bugünkü namaz (azan) və camaat vaxtları
//
// • Azan vaxtları aladhan.com-dan HESABLANIR (prayerLocation() koordinatı
//   və metodu ilə). Göstərən komponent bunu "hesablanmış" kimi qeyd etməlidir.
// • Camaat (iqamə) vaxtları MOSQUE.jamaat qaydalarından gəlir; admin
//   paneldən Firestore-a (singletons/jamaat) yazılan doldurulmuş dəyər
//   konfiqdəkini üstələyir. Admin "-" yazıbsa həmin namazın camaat vaxtı
//   gizlənir (konfiqə qayıtmır). Qayda boşdursa camaat vaxtı '' olur —
//   heç vaxt uydurulmur.
// • Bütün saat hesabları məscidin saat qurşağında (Asia/Baku) aparılır:
//   ziyarətçi başqa ölkədə olsa belə geri sayım düzgün qalır.
//
// Qaytarır:
//   { loading, error, date:'DD-MM-YYYY', hijri:{day,month,monthEn,monthAr,year}|null,
//     prayers:[{ key, adhan:'HH:MM', jamaat:'HH:MM'|'', rule:'+N'|'HH:MM'|'', jumua:bool }]
//                                                          // məlumat yoxdursa []
//     hasJamaat, next:{ key, adhan, jamaat, inMs, at, adhanAt, jamaatAt, target, tomorrow }|null,
//     isFriday, jumua:{ time, khutbahLang }, nextJumua, nowSecs, exact, method, tz, reload() }
//
//   next.target: 'adhan' — azana qədər; 'jamaat' — azan oxunub, camaata
//   qədər (yalnız camaat vaxtı təyin olunanda). next.at: hədəfin epoch ms-i.
//   next.adhanAt / next.jamaatAt: azanın və camaatın epoch ms-i (camaat
//   yoxdursa jamaatAt = null) — səhifə birbaşa camaata qədər saya bilsin.
//   Cümə günü cümə vaxtı təyin olunubsa, zöhrün camaat vaxtı = cümə vaxtı.
//   prayers[].rule: həmin namaza tətbiq olunan effektiv qayda ("azandan +20
//   dəq" nişanı üçün); prayers[].jumua: bu sətrin camaatı cümə namazıdır.
//
//   nextJumua: növbəti cümə namazı — { date:'DD-MM-YYYY', isToday, inDays,
//     adhan:'HH:MM'|'' (həmin cümənin zöhr azanı), time:'HH:MM'|'' (cümə
//     qaydası HƏMİN günün zöhrünə tətbiq olunub), rule, khutbahLang, loading }.
//   Bu gün cümədirsə və cümə namazının vaxtı hələ çatmayıbsa — bu gün;
//   yoxsa gələn cümə. jumua.time isə köhnə istifadəçilər üçün qalır
//   (bugünkü zöhrə görə hesablanır).
//   nowSecs: məscidin saat qurşağında gecə yarısından keçən saniyələr.
// ═══════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MOSQUE, filled, jamaatTime, prayerLocation } from '../config/mosque'

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

export const PRAYER_NAMES = {
  fajr:    { az: 'Sübh',   en: 'Fajr',    ru: 'Фаджр',  ar: 'الفجر',  tr: 'Sabah'  },
  sunrise: { az: 'Günəş',  en: 'Sunrise', ru: 'Восход', ar: 'الشروق', tr: 'Güneş'  },
  dhuhr:   { az: 'Zöhr',   en: 'Dhuhr',   ru: 'Зухр',   ar: 'الظهر',  tr: 'Öğle'   },
  asr:     { az: 'Əsr',    en: 'Asr',     ru: 'Аср',    ar: 'العصر',  tr: 'İkindi' },
  maghrib: { az: 'Məğrib', en: 'Maghrib', ru: 'Магриб', ar: 'المغرب', tr: 'Akşam'  },
  isha:    { az: 'İşa',    en: 'Isha',    ru: 'Иша',    ar: 'العشاء', tr: 'Yatsı'  },
}

// Məscidin saat qurşağı (Azərbaycanda yay vaxtı 2016-dan tətbiq olunmur)
export const MOSQUE_TZ = 'Asia/Baku'

// Fərz namazları — "növbəti namaz" yalnız bunlar arasından seçilir
const FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

// aladhan cavabındakı açar adları
const API_KEY = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }

const TICK_MS = 30000          // "növbəti" hər 30 saniyədən bir yenidən hesablanır
const FETCH_TIMEOUT_MS = 15000
const CACHE_PREFIX = 'qm_times_'

// ── Saat köməkçiləri ─────────────────────────────────

let tzFormatter = null
function getTzFormatter() {
  if (tzFormatter) return tzFormatter
  tzFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: MOSQUE_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    weekday: 'short', hourCycle: 'h23',
  })
  return tzFormatter
}

const pad2 = (n) => String(n).padStart(2, '0')

/** Məscidin saat qurşağında "indi": tarix açarı, gecə yarısından saniyələr, həftə günü. */
function mosqueClock(epoch = Date.now()) {
  try {
    const parts = {}
    for (const p of getTzFormatter().formatToParts(new Date(epoch))) parts[p.type] = p.value
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

/** 'DD-MM-YYYY' → növbəti günün 'DD-MM-YYYY' açarı. */
const nextDateKey = (dateKey) => addDaysKey(dateKey, 1)

/** 'DD-MM-YYYY' → həftə günü (0 = bazar ... 5 = cümə). */
function weekdayOf(dateKey) {
  const [d, m, y] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

const FRIDAY = 5

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

// ── sessionStorage keşi (gün üzrə) ───────────────────

const locSig = (loc) => `${loc.lat},${loc.lng},${loc.method}`

// Yaddaşdakı keş — sessionStorage bağlı olanda (gizli rejim və s.) da
// eyni səhifədə təkrar sorğu getməsin
const memCache = new Map()
// Eyni anda bir neçə komponent (ana səhifə zolağı, camaat səhifəsi, admin
// önbaxışı) eyni günü istəyəndə yalnız BİR şəbəkə sorğusu gedir
const inflight = new Map()

function readCache(dateKey, loc) {
  const mem = memCache.get(dateKey)
  if (mem && mem.loc === locSig(loc)) return mem
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + dateKey)
    if (!raw) return null
    const d = JSON.parse(raw)
    // Koordinat və ya metod dəyişibsə köhnə keşi istifadə etmə
    if (!d || d.loc !== locSig(loc) || d.date !== dateKey || !d.timings) return null
    memCache.set(dateKey, d)
    return d
  } catch {
    return null
  }
}

function writeCache(dateKey, data) {
  memCache.set(dateKey, data)
  try { sessionStorage.setItem(CACHE_PREFIX + dateKey, JSON.stringify(data)) } catch { /* yaddaş bağlıdır */ }
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
 * Günün məlumatını gətir: əvvəl keş, sonra şəbəkə (vaxt limiti ilə).
 * Sorğu komponent silinəndə dayandırılmır — nəticə keşə düşür və növbəti
 * açılışda dərhal istifadə olunur (çağıran tərəf "alive" bayrağı ilə
 * köhnə nəticəni sadəcə nəzərə almır).
 */
function loadDay(dateKey, loc) {
  const cached = readCache(dateKey, loc)
  if (cached) return Promise.resolve(cached)
  const key = `${dateKey}|${locSig(loc)}`
  if (inflight.has(key)) return inflight.get(key)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  const p = fetchDay(dateKey, loc, ctrl.signal)
    .then(d => { writeCache(dateKey, d); return d })
    .finally(() => {
      clearTimeout(timer)
      inflight.delete(key)
    })
  inflight.set(key, p)
  return p
}

// ── Camaat qaydalarının birləşdirilməsi ──────────────

// Admin paneldə "-" — "bu namazın camaat vaxtını göstərmə" (JamaatManager ilə eyni)
const HIDE_RULE = /^[-–—]$/

/** Firestore dəyəri → qayda: "-" → '' (gizli), boş → konfiq, qalanı olduğu kimi. */
function pickRule(ov, fallback) {
  if (!filled(ov)) return fallback || ''
  const s = String(ov).trim()
  return HIDE_RULE.test(s) ? '' : s
}

/** Firestore-dakı doldurulmuş dəyər konfiqi üstələyir; yoxsa konfiq. */
function mergeRules(override) {
  const jamaat = {}
  for (const k of FARD) jamaat[k] = pickRule(override?.jamaat?.[k], MOSQUE.jamaat?.[k])
  const ovLang = override?.jumua?.khutbahLang
  return {
    jamaat,
    jumuaRule: pickRule(override?.jumua?.time, MOSQUE.jumua?.time),
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

  const [day, setDay] = useState(() => readCache(dateKey, loc))
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

  // ── Saat: hər 30 saniyə + tab yenidən görünəndə ──
  useEffect(() => {
    const refresh = () => setClock(mosqueClock())
    const id = setInterval(refresh, TICK_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // ── Camaat vaxtlarının admin üstələmələri (Firestore) ──
  // Firebase modulu dinamik yüklənir ki, ana səhifənin ilk yükü ağırlaşmasın.
  useEffect(() => {
    let alive = true
    let unsub = null
    import('../data/adminContent')
      .then(m => {
        if (!alive || typeof m.subscribeToJamaat !== 'function') return
        unsub = m.subscribeToJamaat(doc => { if (alive) setOverride(doc || null) })
      })
      .catch(() => { /* Firebase əlçatan deyil — konfiq dəyərləri qalır */ })
    return () => {
      alive = false
      if (typeof unsub === 'function') unsub()
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
    const epochOf = (min, extraDays) => clock.epoch + (min * 60 + extraDays * 86400) * 1000 - nowMs
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

  // ── Növbəti cümə namazı ──
  // Bu gün cümədirsə: cümə namazının vaxtı hələ çatmayıbsa bu gün, çatıbsa
  // gələn həftə. Bugünkü zöhr hələ yüklənməyibsə "bu gün" qalır.
  const todayJumuaMin = today ? toMinutes(jamaatTime(rules.jumuaRule, today.timings.dhuhr)) : null
  const jumuaPassed = todayJumuaMin != null && clock.secs >= todayJumuaMin * 60
  const fridayOffset = useMemo(() => {
    const add = (FRIDAY - weekdayOf(dateKey) + 7) % 7
    return add === 0 && jumuaPassed ? 7 : add
  }, [dateKey, jumuaPassed])
  const fridayKey = useMemo(() => addDaysKey(dateKey, fridayOffset), [dateKey, fridayOffset])

  const [friday, setFriday] = useState(null)
  const [fridayFailed, setFridayFailed] = useState('')
  const fridayDay = fridayOffset === 0
    ? today
    : (friday && friday.date === fridayKey ? friday : null)

  useEffect(() => {
    if (fridayOffset === 0) return
    let alive = true
    setFridayFailed('')
    loadDay(fridayKey, loc)
      .then(d => { if (alive) setFriday(d) })
      .catch(() => { if (alive) setFridayFailed(fridayKey) })
    return () => { alive = false }
  }, [fridayOffset, fridayKey, reloadKey, loc])

  const nextJumua = useMemo(() => {
    const adhan = fridayDay?.timings?.dhuhr || ''
    return {
      date: fridayKey,
      isToday: fridayOffset === 0,
      inDays: fridayOffset,
      adhan,
      // Sabit "HH:MM" qaydası azan olmadan da göstərilir, "+N" isə azan gələndə
      time: jamaatTime(rules.jumuaRule, adhan),
      rule: rules.jumuaRule,
      khutbahLang: rules.khutbahLang,
      loading: !fridayDay && (fridayOffset === 0 ? !error : fridayFailed !== fridayKey),
    }
  }, [fridayDay, fridayKey, fridayOffset, rules, error, fridayFailed])

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
    nextJumua,
    nowSecs: clock.secs,
    exact: loc.exact,
    method: loc.method,
    tz: MOSQUE_TZ,
    reload,
  }
}
