// ═══════════════════════════════════════════════════════════════════════
// Namaz vaxtları — təqvim abunəliyi (iCalendar / .ics)
//
//   GET /api/prayer.ics?lat=40.40&lng=49.88&tz=Asia/Baku&method=99&lang=az&city=Bakı
//     → text/calendar: dünəndən 45 gün irəli, hər gün 5 fərz namazı (15 dəqiqəlik hadisə)
//
// Google / Apple / Outlook təqvimi "URL ilə abunə" edir və faylı özü yeniləyir
// (REFRESH-INTERVAL 12 saat). Vaxtlar:
//   • metod 99 (Azərbaycan, Əbu Bəkr məscidi) — yerli hesab (prayCalc, şəbəkəsiz)
//   • digərləri — aladhan aylıq təqvimi (/v1/calendar), yaddaşda 24 saat keş
// Hadisələr UTC ilə yazılır (DTSTART:…Z) — saat qurşağı tərifi lazım deyil.
// Google-un serverləri çox istifadəçi üçün eyni IP-dən gəlir — sərt IP limiti
// yoxdur; cavab ucuzdur (keş) və Cache-Control ilə 1 saat keşlənir.
// Şəxsi məlumat saxlanmır: koordinat yalnız sorğunun özündədir.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const prayCalc = require('./prayCalc')
const { LANGS, PRAYERS, PUSH_TEXTS, validTz, nowIn } = require('./prayer-utils')

const DAYS_BACK = 1
const DAYS_AHEAD = 45
const EVENT_MIN = 15
const CACHE_TTL = 24 * 60 * 60 * 1000
const CACHE_MAX = 2000
const CAL_NAME = { az: 'Namaz vaxtları', en: 'Prayer times', ru: 'Время намаза', ar: 'مواقيت الصلاة', tr: 'Namaz vakitleri' }

const pad = (n) => String(n).padStart(2, '0')

/** iCalendar mətn dəyəri: \ ; , və sətir sonu escape olunur */
function icsEscape(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** RFC 5545: sətir 75 oktetdən uzun olmasın — davamı boşluqla başlayan yeni sətirdə */
function foldLine(line) {
  const bytes = Buffer.from(line, 'utf8')
  if (bytes.length <= 75) return line
  const out = []
  let cur = ''
  let curLen = 0
  for (const ch of line) {
    const n = Buffer.byteLength(ch, 'utf8')
    const limit = out.length ? 74 : 75   // davam sətirlərində ilk boşluq da sayılır
    if (curLen + n > limit) { out.push(cur); cur = ''; curLen = 0 }
    cur += ch; curLen += n
  }
  out.push(cur)
  return out.map((s, i) => (i ? ` ${s}` : s)).join('\r\n')
}

/** 'YYYY-MM-DD' + 'HH:MM' (yerli, tz) → UTC 'YYYYMMDDTHHMMSSZ' */
function utcStamp(dateKey, hhmm, tz) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const [hh, mm] = hhmm.split(':').map(Number)
  const off = prayCalc.tzOffsetHours(tz, y, m, d)
  const t = new Date(Date.UTC(y, m - 1, d, hh, mm) - off * 3600000)
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00Z`
}

function addDays(dateKey, n) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d) + n * 86400000)
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** Sorğu parametrləri → yer | null */
function parseQuery(q) {
  const lat = Number(q.lat), lng = Number(q.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 66 || Math.abs(lng) > 180) return null
  const tz = typeof q.tz === 'string' && q.tz.length <= 64 && validTz(q.tz) ? q.tz : null
  if (!tz) return null
  const method = Number(q.method)
  if (!Number.isInteger(method) || method < 0 || (method > 23 && method !== prayCalc.METHOD_ABUBAKR)) return null
  const lang = LANGS.includes(q.lang) ? q.lang : 'az'
  const city = typeof q.city === 'string' ? q.city.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 60) : ''
  return { lat: Math.round(lat * 1e4) / 1e4, lng: Math.round(lng * 1e4) / 1e4, tz, method, lang, city }
}

/**
 * ICS mətni. days: [{ dateKey:'YYYY-MM-DD', friday:bool, times:{ fajr:'05:38', … } }]
 * now — DTSTAMP üçün (test üçün ötürülə bilər).
 */
function buildIcs({ loc, days, now = new Date() }) {
  const T = PUSH_TEXTS[loc.lang] || PUSH_TEXTS.az
  const calName = `${CAL_NAME[loc.lang] || CAL_NAME.az}${loc.city ? ` — ${loc.city}` : ''}`
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const uidBase = `${loc.lat},${loc.lng},${loc.method}`.replace(/[^0-9a-z.,-]/gi, '')
  const L = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//muslims.cc//prayer-times//AZ', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(calName)}`, `NAME:${icsEscape(calName)}`,
    'X-WR-CALDESC:muslims.cc', 'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H',
  ]
  for (const day of days) {
    for (const [key] of PRAYERS) {
      const hhmm = day.times && day.times[key]
      if (!/^\d{2}:\d{2}$/.test(hhmm || '')) continue
      const start = utcStamp(day.dateKey, hhmm, loc.tz)
      const [h, mi] = hhmm.split(':').map(Number)
      const endMin = h * 60 + mi + EVENT_MIN
      const endKey = endMin >= 1440 ? addDays(day.dateKey, 1) : day.dateKey
      const end = utcStamp(endKey, `${pad(Math.floor(endMin / 60) % 24)}:${pad(endMin % 60)}`, loc.tz)
      const name = T.names[key]
      const summary = key === 'dhuhr' && day.friday ? T.jumuaTitle(hhmm) : T.title(name, hhmm)
      L.push('BEGIN:VEVENT',
        `UID:${day.dateKey}-${key}-${uidBase}@muslims.cc`,
        `DTSTAMP:${stamp}`, `DTSTART:${start}`, `DTEND:${end}`,
        `SUMMARY:${icsEscape(summary)}`,
        `DESCRIPTION:${icsEscape(`${name} — ${hhmm}${loc.city ? ` (${loc.city})` : ''}\nmuslims.cc`)}`,
        'TRANSP:TRANSPARENT', 'END:VEVENT')
    }
  }
  L.push('END:VCALENDAR')
  return L.map(foldLine).join('\r\n') + '\r\n'
}

function createIcsRouter({ fetchImpl = (...a) => fetch(...a), now = () => new Date() } = {}) {
  const cache = new Map()   // `${lat},${lng}|${tz}|${method}|YYYY-MM` → { at, days: Map(dateKey → times) }

  async function monthFromAladhan(loc, y, m) {
    const key = `${loc.lat},${loc.lng}|${loc.tz}|${loc.method}|${y}-${pad(m)}`
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < CACHE_TTL) return hit.days
    const url = `https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${loc.lat}&longitude=${loc.lng}` +
      `&${prayCalc.aladhanMethodQuery(loc.method)}&timezonestring=${encodeURIComponent(loc.tz)}`
    const days = new Map()
    try {
      const r = await fetchImpl(url, { signal: AbortSignal.timeout(15000) })
      if (r.ok) {
        for (const row of ((await r.json())?.data || [])) {
          const [dd, mm, yyyy] = String(row?.date?.gregorian?.date || '').split('-')
          const t = row?.timings || {}
          const times = {}
          for (const [k, api] of PRAYERS) times[k] = String(t[api] || '').slice(0, 5)
          if (yyyy) days.set(`${yyyy}-${mm}-${dd}`, times)
        }
      }
    } catch { /* şəbəkə — bu ay boş qalır, növbəti sorğuda yenidən */ }
    if (days.size) {
      if (cache.size >= CACHE_MAX) cache.clear()
      cache.set(key, { at: Date.now(), days })
    }
    return days
  }

  async function daysFor(loc) {
    const today = nowIn(loc.tz).dateKey
    const keys = []
    for (let i = -DAYS_BACK; i <= DAYS_AHEAD; i++) keys.push(addDays(today, i))
    const isFri = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 5 }
    if (loc.method === prayCalc.METHOD_ABUBAKR) {
      return keys.map(k => {
        const [y, m, d] = k.split('-').map(Number)
        const t = prayCalc.computeTimes({ year: y, month: m, day: d }, loc.lat, loc.lng, prayCalc.tzOffsetHours(loc.tz, y, m, d), prayCalc.CALC_METHODS.abubakr)
        return { dateKey: k, friday: isFri(k), times: t }
      })
    }
    const months = [...new Set(keys.map(k => k.slice(0, 7)))]
    const maps = await Promise.all(months.map(ym => monthFromAladhan(loc, Number(ym.slice(0, 4)), Number(ym.slice(5, 7)))))
    const all = new Map(maps.flatMap(mp => [...mp]))
    return keys.filter(k => all.has(k)).map(k => ({ dateKey: k, friday: isFri(k), times: all.get(k) }))
  }

  const router = express.Router()
  router.get('/prayer.ics', async (req, res) => {
    const loc = parseQuery(req.query)
    if (!loc) return res.status(400).type('text/plain').send('bad location')
    const days = await daysFor(loc)
    if (!days.length) return res.status(503).type('text/plain').send('times unavailable')
    res.set('Content-Type', 'text/calendar; charset=utf-8')
    res.set('Content-Disposition', 'inline; filename="prayer-times.ics"')
    res.set('Cache-Control', 'public, max-age=3600')
    res.send(buildIcs({ loc, days, now: now() }))
  })
  return router
}

module.exports = { createIcsRouter, buildIcs, parseQuery, icsEscape, foldLine, utcStamp }
