// ═══════════════════════════════════════════════════════
// "İndi sizin üçün" (ana səhifə) — günün vaxtına, namaz vaxtlarına və hicri
// təqvimə görə saytın MÖVCUD bölmələrindən 1–3 təklif seçir. Saf məntiq
// (React-sız) — tests/unit/now-for-you.test.js.
//
//   pickNowItems({ secs, times, weekday, hijri, tomorrow, max })
//     secs     — şəhərin saat qurşağında gecə yarısından keçən saniyələr
//     times    — { fajr, sunrise, dhuhr, asr, maghrib, isha } (saniyə; bilinməyən — null)
//     weekday  — 0 (bazar) … 6 (şənbə); hijri — { year, month, day } (bu gün)
//     tomorrow — { weekday, hijri } (sabah) — sabahkı oruc / cümə üçün
//   → [{ id, page, param?, hash?, icon, reason: { kind, … } }]
//
// QAYDALAR:
//   • Yeni dini mətn YOXDUR — başlıqlar interfeys yazısıdır, "səbəb" yalnız
//     məlumatdır: namaz vaxtı, hicri tarix, həftə günü, oruc gününün növü
//     (utils/fastStatus — /calendar-ın sünnə oruc qaydası ilə eyni).
//   • Cümə günü təklif yoxdur — ana səhifədəki Cümə kartı (JumuahCard: Kəhf,
//     salavat, geri sayım) artıq göstərilir və ondan yuxarıdadır.
//   • Bayram günləri — EidMode (qlobal) göstərir; burada ayrıca təklif yoxdur.
//   • Həmişə ən azı bir təklif var (kartın hündürlüyü sabit qalsın).
// ═══════════════════════════════════════════════════════
import { fastStatus } from './fastStatus'

const H = 3600
// Namaz vaxtları bilinmirsə — kobud cihaz saatı (yalnız təklif seçimi üçün)
const FALLBACK = { fajr: 5 * H, sunrise: 6.5 * H, dhuhr: 12.5 * H, asr: 15.5 * H, maghrib: 18 * H, isha: 19.5 * H }

/** 'HH:MM' → saniyə (səhvdirsə null) */
export function hmToSecs(hm) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hm || ''))
  if (!m) return null
  const h = +m[1], mi = +m[2]
  return h < 24 && mi < 60 ? h * H + mi * 60 : null
}

const fill = (times) => {
  const t = {}
  for (const k of Object.keys(FALLBACK)) t[k] = Number.isFinite(times?.[k]) ? times[k] : FALLBACK[k]
  return t
}

// Oruc səbəbləri — ən xüsusisi birinci (həftə günü ən sonda)
const FAST_ORDER = ['arafah', 'ashura', 'tasua', 'bid', 'shawwal', 'mon', 'thu']
const fastReasons = (h, wd) => {
  if (!h) return []
  // fastStatus həftə gününü Date-dən oxuyur — yalnız getDay lazımdır
  const st = fastStatus(h, { getDay: () => wd })
  return Array.isArray(st) ? FAST_ORDER.filter((r) => st.includes(r)) : []
}

/** Növbəti fərz namaz (fallback təklifin səbəbi üçün) */
function nextPrayer(secs, t) {
  for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) if (t[k] > secs) return k
  return 'fajr'
}

export function pickNowItems({ secs, times, weekday, hijri, tomorrow, max = 3 } = {}) {
  const t = fill(times)
  const s = Number.isFinite(secs) ? secs : 12 * H
  const out = []
  const add = (prio, item) => out.push({ prio, ...item })
  const hm = hijri?.month, hd = hijri?.day

  // ── Mövsüm ──
  if (hm === 9) {
    if (s < t.maghrib) add(10, { id: 'iftar', page: 'ramadan', icon: 'ramadan', reason: { kind: 'iftar', prayer: 'maghrib', at: t.maghrib } })
    else add(10, { id: 'taraweeh', page: 'ramadan', hash: 'taraweeh-log', icon: 'moonStar', reason: { kind: 'hijri' } })
  }
  if (hm === 12 && hd === 9) add(11, { id: 'arafah', page: 'calendar', hash: 'cal-fasts', icon: 'calendar', reason: { kind: 'hijri' } })
  if (hm === 12 && hd === 8 && s >= t.asr) add(12, { id: 'arafahTomorrow', page: 'calendar', hash: 'cal-fasts', icon: 'calendar', reason: { kind: 'hijri' } })
  if (hm === 12 && hd >= 1 && hd <= 9) add(13, { id: 'dhulhijjah', page: 'learn', param: 'dhul-hijjah-ten', icon: 'moonStar', reason: { kind: 'hijri' } })

  // ── Sünnə orucları (bu gün — məğribə qədər; sabah — əsrdən sonra) ──
  const today = fastReasons(hijri, weekday).filter((r) => r !== 'arafah')
  if (today.length && s < t.maghrib) add(20, { id: 'fastToday', page: 'calendar', hash: 'cal-fasts', icon: 'calendar', reason: { kind: 'fast', r: today[0] } })
  const tmr = fastReasons(tomorrow?.hijri, tomorrow?.weekday).filter((r) => r !== 'arafah')
  if (tmr.length && s >= t.asr) add(40, { id: 'fastTomorrow', page: 'calendar', hash: 'cal-fasts', icon: 'calendar', reason: { kind: 'fast', r: tmr[0] } })

  // ── Cümə axşamı (məğribdən sonra) — cümənin fəzilət və hökmləri (/jamaat) ──
  if (weekday === 4 && s >= t.maghrib) add(25, { id: 'fridayEve', page: 'jamaat', icon: 'jamaat', reason: { kind: 'tomorrowFriday' } })

  // ── Günün vaxtı ──
  const morningEnd = Math.min(t.sunrise + 2.5 * H, t.dhuhr)
  if (s >= t.fajr && s < morningEnd) add(30, { id: 'morning', page: 'waking', icon: 'waking', reason: { kind: 'after', prayer: 'fajr', at: t.fajr } })
  if (s >= t.isha || s < t.fajr) add(30, { id: 'bedtime', page: 'bedtime', icon: 'bedtime', reason: { kind: 'after', prayer: 'isha', at: t.isha } })

  // ── Ehtiyat: həmişə ən azı bir təklif ──
  if (!out.length) {
    const k = nextPrayer(s, t)
    add(90, { id: 'focus', page: 'focus', icon: 'focus', reason: { kind: 'next', prayer: k, at: t[k] } })
  }

  const seen = new Set()
  return out
    .sort((a, b) => a.prio - b.prio)
    .filter((x) => (seen.has(x.id) ? false : seen.add(x.id)))
    .slice(0, Math.max(1, max))
    .map(({ prio, ...x }) => x) // eslint-disable-line no-unused-vars
}

/** saniyə → 'HH:MM' */
export const secsToHm = (v) => `${String(Math.floor(v / H) % 24).padStart(2, '0')}:${String(Math.floor((v % H) / 60)).padStart(2, '0')}`
