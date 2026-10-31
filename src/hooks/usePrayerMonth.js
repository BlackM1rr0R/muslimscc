// ═══════════════════════════════════════════════════════
// usePrayerMonth — seçilmiş şəhər üçün bir Qriqorian ayının bütün günləri
//
// • Azərbaycan şəhərləri (Əbu Bəkr məscidinin cədvəli, METHOD_ABUBAKR):
//   vaxtlar yerli hesablanır (utils/prayCalc — usePrayerTimes ilə EYNİ funksiya),
//   şəbəkə yoxdur.
// • Digər yerlər: aladhan.com /v1/calendar/{il}/{ay} — eyni metod və saat
//   qurşağı ilə (bir sorğu, sessionStorage keşi). Cavab gözlənilən formada
//   deyilsə error qaytarılır (səhifə sakit xəta göstərir).
//
// Qaytarır: { days:[{ day, weekday, times:{fajr,sunrise,dhuhr,asr,maghrib,isha} }]|null,
//             loading, error, reload }
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useState } from 'react'
import { METHOD_ABUBAKR, aladhanMethodQuery, computeTimes, CALC_METHODS, tzOffsetHours } from '../utils/prayCalc'
import { locationSig } from '../utils/prayerLocation'
import { PRAYER_KEYS } from './usePrayerTimes'

const API_KEY = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }
const CACHE_PREFIX = 'qm_pmonth_'
const clean = (s) => (/^(\d{1,2}:\d{2})/.exec(String(s || '')) || [])[1] || ''
const weekdayOf = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay()

function localMonth(loc, y, m) {
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const out = []
  for (let d = 1; d <= n; d++) {
    const tz = tzOffsetHours(loc.tz || 'Asia/Baku', y, m, d)
    const t = computeTimes({ year: y, month: m, day: d }, loc.lat, loc.lng, tz, CALC_METHODS.abubakr)
    out.push({ day: d, weekday: weekdayOf(y, m, d), times: t })
  }
  return out
}

async function fetchMonth(loc, y, m) {
  const key = `${CACHE_PREFIX}${y}-${m}_${locationSig(loc)}`
  try {
    const c = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (Array.isArray(c) && c.length) return c
  } catch { /* keş yoxdur */ }
  const url = `https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${loc.lat}&longitude=${loc.lng}&${aladhanMethodQuery(loc.method)}` +
    (loc.tz ? `&timezonestring=${encodeURIComponent(loc.tz)}` : '')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json?.data)) throw new Error('bad response')
  const out = json.data.map((e, i) => {
    const times = {}
    for (const k of PRAYER_KEYS) times[k] = clean(e?.timings?.[API_KEY[k]])
    const d = Number(e?.date?.gregorian?.day) || i + 1
    return { day: d, weekday: weekdayOf(y, m, d), times }
  })
  if (!out.length || out.some(x => !x.times.fajr || !x.times.maghrib)) throw new Error('bad response')
  try { sessionStorage.setItem(key, JSON.stringify(out)) } catch { /* yaddaş bağlıdır */ }
  return out
}

export default function usePrayerMonth(loc, year, month) {
  const local = Number(loc?.method) === METHOD_ABUBAKR
  const sig = loc ? locationSig(loc) : ''
  const [state, setState] = useState({ days: null, loading: !local, error: false })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!loc || !year || !month) return undefined
    if (local) {
      setState({ days: localMonth(loc, year, month), loading: false, error: false })
      return undefined
    }
    let alive = true
    setState(s => ({ ...s, loading: true, error: false }))
    fetchMonth(loc, year, month)
      .then(days => { if (alive) setState({ days, loading: false, error: false }) })
      .catch(() => { if (alive) setState({ days: null, loading: false, error: true }) })
    return () => { alive = false }
    // sig — yer dəyişəndə; loc obyekti hər renderdə yeni ola bilər
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, local, year, month, nonce])

  const reload = useCallback(() => setNonce(n => n + 1), [])
  return { ...state, reload }
}
