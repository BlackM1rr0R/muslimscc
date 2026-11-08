// ═══════════════════════════════════════════════════════
// Canlı səma (v5.6) — saytın işığı günəşin REAL mövqeyini izləyir
//
// İstifadəçinin namaz yeri (utils/prayerLocation) və yerli hesab
// (utils/prayCalc → computeTimes, şəbəkəsiz) ilə günün fazası tapılır:
//   night → fajr (şəfəq, çəhrayı) → sunrise (qızılı) → day (aydın) →
//   asr (isti qızılı) → maghrib (narıncı-bənövşəyi) → isha → night
// və <html>-ə yazılır:
//   data-sky="<faza>"
//   --sky-x / --sky-y  — işıq ləkəsinin hero-dakı yeri: günəş şərqdən
//                        (LTR-də sol) çıxır, günorta ən yuxarıda, qərbdə batır;
//                        gecə — ay kimi yuxarıda, sakit
//   --sky-c / --sky-c2 — əsas və ikinci rəng (alfa CSS-də — vau3.css §13)
// Dəqiqədə bir dəfə yenilənir (yalnız 4 dəyişən — layout yoxdur).
// Test: ?sky=fajr|sunrise|day|asr|maghrib|isha|night
// ═══════════════════════════════════════════════════════
import { getPrayerLocation, subscribePrayerLocation } from './prayerLocation'
import { computeTimes, tzOffsetHours, CALC_METHODS } from './prayCalc'

export const SKY_PHASES = ['night', 'fajr', 'sunrise', 'day', 'asr', 'maghrib', 'isha']

// Rənglər — tam doymuş; şəffaflıq CSS-dədir (işıqlı/qaranlıq rejimə görə)
const COLORS = {
  night:   ['#4a5fd0', '#1f7a66'],
  fajr:    ['#e8789e', '#8b7be0'],
  sunrise: ['#f2b34a', '#ef8a6a'],
  day:     ['#3fb68e', '#5fb4e0'],
  asr:     ['#e2a83a', '#d98a3d'],
  maghrib: ['#ee7a4a', '#9a5bd0'],
  isha:    ['#6a5fd0', '#2f6fae'],
}

const toMin = (s) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(s || '')
  return m ? (+m[1]) * 60 + (+m[2]) : NaN
}

/** Saf funksiya (test olunur): dəqiqə + vaxtlar → { phase, x, y } (x,y — 0..100) */
export function skyAt(nowMin, t) {
  const f = toMin(t.fajr), sr = toMin(t.sunrise), as = toMin(t.asr), mg = toMin(t.maghrib), is = toMin(t.isha)
  if ([f, sr, as, mg, is].some(Number.isNaN)) return { phase: 'day', x: 85, y: 0 }
  let phase
  if (nowMin >= is || nowMin < f) phase = 'night'
  else if (nowMin < sr) phase = 'fajr'
  else if (nowMin < sr + 50) phase = 'sunrise'
  else if (nowMin < as) phase = 'day'
  else if (nowMin < mg - 35) phase = 'asr'
  else if (nowMin < mg + 30) phase = 'maghrib'
  else phase = 'isha'
  // Günəşin yolu: çıxışdan batışa 8% → 92%, hündürlük — yarımsinus
  let x, y
  if (nowMin >= sr && nowMin <= mg) {
    const k = (nowMin - sr) / Math.max(1, mg - sr)
    x = 8 + k * 84
    y = 92 - Math.sin(k * Math.PI) * 92
  } else if (nowMin > mg) {          // batdıqdan sonra: qərb üfüqü, solur
    x = 94; y = 96
  } else if (nowMin >= f) {          // şəfəq: şərq üfüqü
    x = 6; y = 96
  } else { x = 70; y = 0 }           // gecə: yuxarıda (ay)
  if (phase === 'night') { x = 70; y = 0 }
  return { phase, x: Math.round(x), y: Math.round(y) }
}

function nowInZone(tz) {
  const d = new Date()
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate()
  const off = tz ? tzOffsetHours(tz, y, m, day) : -d.getTimezoneOffset() / 60
  const local = new Date(d.getTime() + off * 3600000)
  return {
    date: { year: local.getUTCFullYear(), month: local.getUTCMonth() + 1, day: local.getUTCDate() },
    min: local.getUTCHours() * 60 + local.getUTCMinutes(),
    off,
  }
}

let timer = 0
export function initLivingSky() {
  if (typeof window === 'undefined' || timer) return
  const root = document.documentElement
  let forced = ''
  try { forced = new URLSearchParams(window.location.search).get('sky') || '' } catch { /* */ }
  const apply = () => {
    let s
    try {
      const loc = getPrayerLocation()
      const n = nowInZone(loc.tz)
      const t = computeTimes(n.date, loc.lat, loc.lng, n.off, CALC_METHODS.abubakr)
      s = skyAt(n.min, t)
    } catch { s = { phase: 'day', x: 85, y: 0 } }
    if (SKY_PHASES.includes(forced)) {
      const demo = { night: [70, 0], fajr: [6, 96], sunrise: [14, 60], day: [50, 0], asr: [74, 40], maghrib: [92, 88], isha: [94, 96] }
      s = { phase: forced, x: demo[forced][0], y: demo[forced][1] }
    }
    const [c1, c2] = COLORS[s.phase]
    root.setAttribute('data-sky', s.phase)
    root.style.setProperty('--sky-x', `${s.x}%`)
    root.style.setProperty('--sky-xr', `${100 - s.x}%`)
    root.style.setProperty('--sky-y', `${s.y}%`)
    root.style.setProperty('--sky-c', c1)
    root.style.setProperty('--sky-c2', c2)
  }
  apply()
  timer = setInterval(apply, 60 * 1000)
  try { subscribePrayerLocation(apply) } catch { /* */ }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') apply() })
}
