// "Tutulma xəbərdarlığı" push-unun saf köməkçiləri (v6.8) — şəbəkə və sirr tələb etmir,
// ayrıca test olunur (tests/unit/eclipse-server.test.js).
//
// AXIN: seçimi açıq olan abunəçiyə (prefs.eclipse === true; susmaya görə SÖNÜLÜ) öz şəhərinin
// yerli saatı ilə 20:00-da — tutulma gününün ƏVVƏLKİ axşamı — "Sabah Ay/Günəş tutulması …"
// bildirişi gedir, YALNIZ tutulma o şəhərdən görünəcəksə (Ay üfüqdən yuxarı / Günəşin ≥5%-i örtülür).
// Klikdə /learn/kusuf-prayer dərsi açılır (dil prefiksi ilə; az — prefikssiz). Hökm burada yazılmır.
//
// Hesab saytın özünündür (eclipse-lib.js — src-dən esbuild ilə yığılır): Ay — NASA vaxtları +
// Meeus Ay mövqeyi; Günəş — NASA Bessel elementləri ilə yerli şərait.
'use strict'

const { LANGS } = require('./prayer-utils')
const lib = require('./eclipse-lib')

const ECLIPSE_HHMM = '20:00'
const MIN_SOLAR_OBSC = 0.05
const DAY = 86400000

const normEclipse = (v) => v === true

/** ms → { dateKey: 'YYYY-MM-DD', hm: 'HH:MM' } şəhərin saat qurşağında */
function localParts(ms, tz) {
  const o = {}
  for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ms))) o[x.type] = x.value
  return { dateKey: `${o.year}-${o.month}-${o.day}`, hm: `${o.hour}:${o.minute}` }
}

const solarMaxMs = (s) => Date.parse(`${s.d}T${s.td}Z`) - s.e[5] * 1000

/**
 * Yerli `dateKey` günündə (şəhərin saatı ilə) baş verən və həmin yerdən GÖRÜNƏN tutulmalar:
 * [{ type: 'lunar'|'solar', kind: 'T'|'P'|'A'|'H', start, max, end, pct? }] — vaxtlar 'HH:MM' (yerli).
 * nowMs — yalnız yaxın tutulmalara baxmaq üçün (±3 gün).
 */
function eclipsesOnLocalDay(dateKey, loc, nowMs) {
  const out = []
  if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return out
  const near = (ms) => Math.abs(ms - nowMs) < 3 * DAY
  for (const e of lib.LUNAR_ECLIPSES) {
    const p = lib.lunarPhases(e)
    if (!near(p.max)) continue
    const v = lib.lunarVisibility(e, loc.lat, loc.lng)
    if (v.kind === 'none') continue
    if (localParts(p.max, loc.tz).dateKey !== dateKey && localParts(p.u1, loc.tz).dateKey !== dateKey) continue
    out.push({ type: 'lunar', kind: e.t, start: localParts(p.u1, loc.tz).hm, max: localParts(p.max, loc.tz).hm, end: localParts(p.u4, loc.tz).hm })
  }
  for (const s of lib.SOLAR_ECLIPSES) {
    if (!near(solarMaxMs(s))) continue
    const lc = lib.localCircumstances(s.e, loc.lat, loc.lng)
    if (!lc || !lc.visible || lc.seenObsc < MIN_SOLAR_OBSC) continue
    if (localParts(lc.seenMs, loc.tz).dateKey !== dateKey) continue
    const total = lc.kind !== 'P' && lc.c2 && lc.alt > 0
    out.push({ type: 'solar', kind: total ? lc.kind : 'P', start: localParts(lc.c1, loc.tz).hm, max: localParts(lc.seenMs, loc.tz).hm, end: localParts(lc.c4, loc.tz).hm, pct: Math.round(lc.seenObsc * 100) })
  }
  return out
}

/** 'YYYY-MM-DD' + n gün */
function addDaysKey(dateKey, n) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n, 12))
  return t.toISOString().slice(0, 10)
}

/** Bu axşam (yerli 20:00) xəbər veriləcək — sabahkı tutulmalar */
const eclipsesForTomorrow = (todayKey, loc, nowMs) => eclipsesOnLocalDay(addDaysKey(todayKey, 1), loc, nowMs)

const TEXTS = {
  az: { lunar: { T: '🌕 Sabah tam Ay tutulması', P: '🌘 Sabah Ay tutulması' }, solar: { T: '☀️ Sabah tam Günəş tutulması', A: '☀️ Sabah həlqəvi Günəş tutulması', P: '🌤 Sabah Günəş tutulması' },
    body: (x) => `Şəhərinizdən görünəcək: ${x.start}–${x.end}, ən böyük faza ${x.max}${x.pct ? ` (Günəşin ${x.pct}%-i örtülür)` : ''}. Tutulma namazı (küsuf) barədə — dərsdə.`,
    safety: ' Günəşə qoruyucu eynəksiz baxmayın.' },
  en: { lunar: { T: '🌕 Total lunar eclipse tomorrow', P: '🌘 Lunar eclipse tomorrow' }, solar: { T: '☀️ Total solar eclipse tomorrow', A: '☀️ Annular solar eclipse tomorrow', P: '🌤 Solar eclipse tomorrow' },
    body: (x) => `Visible from your city: ${x.start}–${x.end}, maximum at ${x.max}${x.pct ? ` (${x.pct}% of the Sun covered)` : ''}. About the eclipse prayer — see the lesson.`,
    safety: ' Never look at the Sun without eclipse glasses.' },
  ru: { lunar: { T: '🌕 Завтра полное лунное затмение', P: '🌘 Завтра лунное затмение' }, solar: { T: '☀️ Завтра полное солнечное затмение', A: '☀️ Завтра кольцеобразное солнечное затмение', P: '🌤 Завтра солнечное затмение' },
    body: (x) => `Будет видно из вашего города: ${x.start}–${x.end}, максимум в ${x.max}${x.pct ? ` (закрыто ${x.pct}% Солнца)` : ''}. О молитве затмения — в уроке.`,
    safety: ' Не смотрите на Солнце без защитных очков.' },
  ar: { lunar: { T: '🌕 خسوف كلي للقمر غدًا', P: '🌘 خسوف القمر غدًا' }, solar: { T: '☀️ كسوف كلي للشمس غدًا', A: '☀️ كسوف حلقي للشمس غدًا', P: '🌤 كسوف الشمس غدًا' },
    body: (x) => `يُرى من مدينتك: ${x.start}–${x.end}، والذروة ${x.max}${x.pct ? ` (يُحجب ${x.pct}% من الشمس)` : ''}. عن صلاة الكسوف — في الدرس.`,
    safety: ' لا تنظر إلى الشمس دون نظارة كسوف.' },
  tr: { lunar: { T: '🌕 Yarın tam Ay tutulması', P: '🌘 Yarın Ay tutulması' }, solar: { T: '☀️ Yarın tam Güneş tutulması', A: '☀️ Yarın halkalı Güneş tutulması', P: '🌤 Yarın Güneş tutulması' },
    body: (x) => `Şehrinizden görünecek: ${x.start}–${x.end}, en büyük evre ${x.max}${x.pct ? ` (Güneş’in %${x.pct}’i örtülür)` : ''}. Küsuf namazı hakkında — derste.`,
    safety: ' Güneş’e koruyucu gözlüksüz bakmayın.' },
}

const prefix = (lang) => (lang === 'az' || !LANGS.includes(lang) ? '' : `/${lang}`)
const eclipseLink = (lang) => `${prefix(lang)}/learn/kusuf-prayer`

function buildEclipseMessage(lang, x, dateKey, icons = {}) {
  const t = TEXTS[lang] || TEXTS.az
  const title = (t[x.type] && (t[x.type][x.kind] || t[x.type].P)) || null
  if (!title) return null
  const tag = `eclipse-${x.type}-${dateKey}`
  const url = eclipseLink(lang)
  return {
    notification: { title, body: t.body(x) + (x.type === 'solar' ? t.safety : '') },
    data: { kind: 'eclipse', eclipse: x.type, date: dateKey, tag, url },
    webpush: {
      headers: { TTL: '43200' },   // ertəsi gün axşama qədər mənalıdır
      notification: { ...icons, tag },
      fcmOptions: { link: url },
    },
  }
}

module.exports = { ECLIPSE_HHMM, MIN_SOLAR_OBSC, normEclipse, localParts, eclipsesOnLocalDay, eclipsesForTomorrow, addDaysKey, buildEclipseMessage, eclipseLink, TEXTS }
