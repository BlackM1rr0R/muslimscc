// ═══════════════════════════════════════════════════════
// Ramazan rejimi — saf köməkçilər (RamadanCard, RamadanPage)
//
// • Hicri tarix ÖZÜMÜZ hesablamırıq: aladhan cavabındakı date.hijri-yə
//   güvənirik (usePrayerTimes → hijri; hijriCalendar → hər günün hicri günü).
// • İmsakiyyə: aladhan /v1/hijriCalendar/{il}/9 — bütöv Ramazan ayı
//   (yoxlanılıb: 1448-ci il üçün 29 gün, 08-02-2027 … 08-03-2027 Bakı).
//   Hər günün timings-ində Imsak, Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha var.
// • Sınaq rejimi: ?ramadan=preview (&day=N) — növbəti Ramazanın N-ci günü
//   (susma ilə 1) real vaxtlarla simulyasiya olunur; ?ramadan=countdown —
//   "Ramazana N gün" kartı; ?ramadan=eid — bayram kartı. Yalnız UI-dir.
// ═══════════════════════════════════════════════════════

export const SHABAN = 8
export const RAMADAN = 9
export const SHAWWAL = 10
/** Bayram kartı Şəvvalın neçə günü görünür */
export const EID_DAYS = 3
/** "Ramazana N gün" kartı ən çox neçə gün əvvəl görünür */
export const COUNTDOWN_MAX_DAYS = 30

const pad2 = (n) => String(n).padStart(2, '0')

// aladhan cavabındakı açarlar → bizim açarlar
export const CAL_KEYS = { imsak: 'Imsak', fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }
export const TABLE_KEYS = ['imsak', 'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

/** "05:12 (+04)" / "5:12" → "05:12"; tanınmırsa ''. */
export function cleanTime(v) {
  const m = String(v || '').match(/(\d{1,2}):(\d{2})/)
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : ''
}

/** "HH:MM" → gecə yarısından saniyələr; boşdursa null. */
export function toSecs(hhmm) {
  const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/)
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 : null
}

/** URL axtarış sətrindən sınaq rejimi: { mode:'preview'|'countdown'|'eid', day } və ya null. */
export function parseRamadanMode(search) {
  let p
  try { p = new URLSearchParams(search || '') } catch { return null }
  const mode = (p.get('ramadan') || '').toLowerCase()
  if (!['preview', 'countdown', 'eid'].includes(mode)) return null
  const day = Math.min(30, Math.max(1, parseInt(p.get('day'), 10) || 1))
  return { mode, day }
}

/** usePrayerTimes-in hijri obyektindən { day, month, year } (rəqəm) və ya null. */
export function normHijri(h) {
  if (!h) return null
  const day = Number(h.day) || 0
  const month = Number(typeof h.month === 'object' && h.month ? h.month.number : h.month) || 0
  const year = Number(h.year) || 0
  if (!day || !year || month < 1 || month > 12) return null
  return { day, month, year }
}

/** Gələn (və ya cari) Ramazanın hicri ili: Ramazan keçibsə — növbəti il. */
export function ramadanYearFor(hijri) {
  const h = normHijri(hijri)
  if (!h) return null
  return h.month <= RAMADAN ? h.year : h.year + 1
}

/** hijriCalendar cavabı → [{ day, date:'DD-MM-YYYY', times:{imsak…isha} }]; yararsızdırsa null. */
export function normalizeCalendar(json) {
  const rows = json?.data
  if (!Array.isArray(rows) || !rows.length) return null
  const out = []
  for (const r of rows) {
    const date = r?.date?.gregorian?.date
    const day = Number(r?.date?.hijri?.day)
    const month = Number(r?.date?.hijri?.month?.number)
    if (!/^\d{2}-\d{2}-\d{4}$/.test(date || '') || !day) return null
    if (month && month !== RAMADAN) continue
    const times = {}
    for (const k of TABLE_KEYS) times[k] = cleanTime(r.timings?.[CAL_KEYS[k]])
    if (!times.fajr || !times.maghrib) return null
    out.push({ day, date, times })
  }
  return out.length ? out.sort((a, b) => a.day - b.day) : null
}

/** 'DD-MM-YYYY' → UTC gün nömrəsi (fərq hesabı üçün). */
function dayNumber(dateKey) {
  const [d, m, y] = String(dateKey).split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86400000)
}

/** İki 'DD-MM-YYYY' arasındakı gün fərqi (b − a). */
export function daysBetween(a, b) {
  return dayNumber(b) - dayNumber(a)
}

/** 'DD-MM-YYYY' → həftə günü (0 = bazar). */
export function weekdayOf(dateKey) {
  const [d, m, y] = String(dateKey).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/**
 * Kartın vəziyyəti (hicri tarix və sınaq rejiminə görə):
 *   { phase:'ramadan', day } · { phase:'before' } · { phase:'eid', day } · { phase:'none' }
 * 'before' yalnız Şabanda (Ramazandan ≤ 30 gün əvvəl) — dəqiq gün sayı təqvimdən.
 */
export function ramadanPhase(hijri, preview = null) {
  if (preview?.mode === 'preview') return { phase: 'ramadan', day: preview.day }
  if (preview?.mode === 'countdown') return { phase: 'before' }
  if (preview?.mode === 'eid') return { phase: 'eid', day: 1 }
  const h = normHijri(hijri)
  if (!h) return { phase: 'none' }
  if (h.month === RAMADAN) return { phase: 'ramadan', day: h.day }
  if (h.month === SHAWWAL && h.day <= EID_DAYS) return { phase: 'eid', day: h.day }
  if (h.month === SHABAN) return { phase: 'before' }
  return { phase: 'none' }
}

/**
 * Növbəti oruc hadisəsi.
 *   nowSecs — şəhərin saatı ilə gecə yarısından saniyələr
 *   today / tomorrow — { imsak, fajr, maghrib } ('HH:MM'); imsak yoxdursa fajr
 * Qaytarır: { kind:'imsak'|'iftar', time, secsLeft, tomorrow } və ya null
 * (bu son gündür və iftar keçib, ya da vaxtlar yoxdur).
 */
export function nextFastEvent(nowSecs, today, tomorrow = null) {
  if (!today) return null
  const imsak = toSecs(today.imsak || today.fajr)
  const iftar = toSecs(today.maghrib)
  if (imsak == null || iftar == null) return null
  if (nowSecs < imsak) return { kind: 'imsak', time: today.imsak || today.fajr, secsLeft: imsak - nowSecs, tomorrow: false }
  if (nowSecs < iftar) return { kind: 'iftar', time: today.maghrib, secsLeft: iftar - nowSecs, tomorrow: false }
  if (!tomorrow) return null
  const t = toSecs(tomorrow.imsak || tomorrow.fajr)
  if (t == null) return null
  return { kind: 'imsak', time: tomorrow.imsak || tomorrow.fajr, secsLeft: 86400 - nowSecs + t, tomorrow: true }
}

/** Saniyə → "HH:MM:SS" (mənfi → 00:00:00). */
export function formatCountdown(secs) {
  const s = Math.max(0, Math.floor(secs))
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`
}

/** Oruc gününün irəliləyişi (imsakdan iftara 0…1); gündüz deyilsə null. */
export function fastProgress(nowSecs, today) {
  const a = toSecs(today?.imsak || today?.fajr)
  const b = toSecs(today?.maghrib)
  if (a == null || b == null || b <= a || nowSecs < a || nowSecs >= b) return null
  return (nowSecs - a) / (b - a)
}

// Azərbaycanca sıra şəkilçisi: son rəqəmin (sıfırdırsa onluğun) sait ahənginə görə
const AZ_UNIT = ['', 'ci', 'ci', 'cü', 'cü', 'ci', 'cı', 'ci', 'ci', 'cu']
const AZ_TENS = ['', 'cu', 'ci', 'cu', 'cı', 'ci', 'cı', 'ci', 'ci', 'cı']   // on, iyirmi, otuz, qırx, əlli, altmış, yetmiş, səksən, doxsan
/** 12 → "12-ci", 30 → "30-cu", 6 → "6-cı". */
export function azOrdinal(n) {
  const v = Math.abs(Math.trunc(n))
  if (v === 0) return '0-cı'
  if (v % 100 === 0) return `${v}-cü`
  const u = v % 10
  const suf = u ? AZ_UNIT[u] : AZ_TENS[Math.floor(v / 10) % 10]
  return `${v}-${suf}`
}

/** Rus dilində say formaları: 1 день, 2 дня, 5 дней. */
export function ruPlural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10
  if (a > 10 && a < 20) return many
  if (b === 1) return one
  if (b >= 2 && b <= 4) return few
  return many
}

/** "Ramazanın 12-ci günü" — 5 dildə. */
export function ramadanDayLabel(n, lang) {
  switch (lang) {
    case 'az': return `Ramazanın ${azOrdinal(n)} günü`
    case 'ru': return `${n}-й день Рамадана`
    case 'tr': return `Ramazan'ın ${n}. günü`
    case 'ar': return `اليوم ${n} من رمضان`
    default: return `Day ${n} of Ramadan`
  }
}

/** "Ramazana 12 gün qaldı" — 5 dildə. */
export function daysUntilLabel(n, lang) {
  switch (lang) {
    case 'az': return `Ramazana ${n} gün qaldı`
    case 'ru': return `До Рамадана ${n} ${ruPlural(n, 'день', 'дня', 'дней')}`
    case 'tr': return `Ramazan'a ${n} gün kaldı`
    case 'ar': return n === 1 ? 'يوم واحد حتى رمضان' : n === 2 ? 'يومان حتى رمضان' : `${n} ${n <= 10 ? 'أيام' : 'يومًا'} حتى رمضان`
    default: return n === 1 ? '1 day until Ramadan' : `${n} days until Ramadan`
  }
}

// ── Şəhərin saatı ────────────────────────────────────

const fmtCache = new Map()
/** Seçilmiş şəhərin saat qurşağında: { dateKey:'DD-MM-YYYY', secs }. */
export function tzNow(tz, epoch = Date.now()) {
  try {
    if (!fmtCache.has(tz)) {
      fmtCache.set(tz, new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
      }))
    }
    const p = {}
    for (const x of fmtCache.get(tz).formatToParts(new Date(epoch))) p[x.type] = x.value
    return { dateKey: `${p.day}-${p.month}-${p.year}`, secs: (Number(p.hour) % 24) * 3600 + Number(p.minute) * 60 + Number(p.second) }
  } catch {
    const d = new Date(epoch)
    return { dateKey: `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`, secs: d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() }
  }
}

// ── İmsakiyyənin yüklənməsi (keş: yaddaş + sessionStorage) ──

const CACHE_PREFIX = 'qm_ramadan_'
const mem = new Map()
const inflight = new Map()

export function calendarUrl(year, loc) {
  return `https://api.aladhan.com/v1/hijriCalendar/${year}/${RAMADAN}` +
    `?latitude=${loc.lat}&longitude=${loc.lng}&method=${loc.method}` +
    (loc.tz ? `&timezonestring=${encodeURIComponent(loc.tz)}` : '')
}

const calKey = (year, loc) => `${year}|${loc.lat},${loc.lng},${loc.method}`

export function readCalendarCache(year, loc) {
  const key = calKey(year, loc)
  if (mem.has(key)) return mem.get(key)
  try {
    const raw = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(CACHE_PREFIX + key)
    const v = raw ? JSON.parse(raw) : null
    if (Array.isArray(v) && v.length) { mem.set(key, v); return v }
  } catch { /* yaddaş bağlıdır */ }
  return null
}

/** Ramazan ayının imsakiyyəsi (normalizeCalendar formatında); xətada atır. */
export function loadRamadanCalendar(year, loc, timeoutMs = 15000) {
  const cached = readCalendarCache(year, loc)
  if (cached) return Promise.resolve(cached)
  const key = calKey(year, loc)
  if (inflight.has(key)) return inflight.get(key)
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = setTimeout(() => ctrl?.abort(), timeoutMs)
  const p = fetch(calendarUrl(year, loc), { signal: ctrl?.signal })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then(json => {
      const cal = normalizeCalendar(json)
      if (!cal) throw new Error('bad response')
      mem.set(key, cal)
      try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cal)) } catch { /* */ }
      return cal
    })
    .finally(() => { clearTimeout(timer); inflight.delete(key) })
  inflight.set(key, p)
  return p
}
