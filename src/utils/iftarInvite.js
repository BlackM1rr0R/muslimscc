// ═══════════════════════════════════════════════════════
// iftarInvite — "İftar dəvət kartı"nın saf məntiqi və şəkil çəkimi
//
// • Tarix: hicri təqvim saytın öz utils/hijri.js-indən (Ümmül-Qura). Susma:
//   bu gün Ramazandırsa — bu gün, deyilsə — gələn Ramazanın 1-i.
// • İftar vaxtı = həmin günün MƏĞRİB vaxtı, saytın namaz səhifəsi ilə eyni
//   hesabla: utils/prayCalc.js → computeTimes, Azərbaycan şəhərləri üçün Əbu
//   Bəkr məscidinin parametrləri (99), qalan yerlər üçün Diyanət (13) —
//   seo/prayerCity.js → monthTable və hooks/usePrayerTimes.js ilə eyni seçim.
// • Kart kətan (canvas) üzərində çəkilir: 3 dizayn (fənərlər + hilal gecə
//   mavisində, mozaika tağı fil sümüyü fonda, xurma ağacları tünd firuzəyi
//   fonda), 2 ölçü (story 1080×1920, post 1080×1350), küncdə "muslims.cc".
// • Heç bir dini mətn (ayə/hədis) yoxdur — yalnız dəvət mətni.
// ═══════════════════════════════════════════════════════

import { CALC_METHODS, METHOD_ABUBAKR, computeTimes, tzOffsetHours } from './prayCalc'
import {
  addGDays, formatGregorian, formatHijri, fromLocalDate, gregorianToHijri, hijriToGregorian, weekdayName,
} from './hijri'

export const RAMADAN_MONTH = 9
export const NOTE_MAX = 120
export const LIMITS = { hosts: 60, guests: 60, address: 100, note: NOTE_MAX, phone: 24 }
export const HOST_KEY = 'muslim_cc_iftar_host'

export const FORMATS = [
  { id: 'story', w: 1080, h: 1920 },
  { id: 'post', w: 1080, h: 1350 },
]
export const formatOf = (id) => FORMATS.find(f => f.id === id) || FORMATS[0]

export const DESIGNS = ['lantern', 'arch', 'palm']

// ── Tarix ─────────────────────────────────────────────

/** Şəhərin saat qurşağında bu günün tarixi { year, month, day }. */
export function todayIn(tz, now = Date.now()) {
  try {
    const p = {}
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz || undefined, year: 'numeric', month: '2-digit', day: '2-digit' })
    for (const x of f.formatToParts(new Date(now))) p[x.type] = x.value
    const g = { year: Number(p.year), month: Number(p.month), day: Number(p.day) }
    if (g.year && g.month && g.day) return g
  } catch { /* tanınmayan saat qurşağı */ }
  return fromLocalDate(new Date(now))
}

/** Bu gün Ramazandırsa — bu gün; deyilsə — gələn Ramazanın 1-i. */
export function defaultIftarDate(today) {
  const h = gregorianToHijri(today)
  if (h.month === RAMADAN_MONTH) return today
  const year = h.month < RAMADAN_MONTH ? h.year : h.year + 1
  return hijriToGregorian({ year, month: RAMADAN_MONTH, day: 1 })
    // ehtiyat: 29 günlük axtarış (hicri çevirmə alınmasa)
    || firstRamadanAfter(today)
}

function firstRamadanAfter(g) {
  for (let i = 0; i < 400; i++) {
    const d = addGDays(g, i)
    if (gregorianToHijri(d).month === RAMADAN_MONTH) return d
  }
  return g
}

// ── İftar (məğrib) vaxtı ──────────────────────────────

/** Yerin hesab metodu — saytın namaz səhifəsi ilə eyni: AZ → Əbu Bəkr, qalanı → Diyanət. */
export function calcMethodFor(loc) {
  return Number(loc?.method) === METHOD_ABUBAKR ? CALC_METHODS.abubakr : CALC_METHODS.diyanet
}

/** Günün məğrib vaxtı 'HH:MM' (hesablanmırsa ''). */
export function iftarTime(g, loc) {
  if (!g || !loc || !Number.isFinite(Number(loc.lat)) || !Number.isFinite(Number(loc.lng))) return ''
  const abubakr = Number(loc.method) === METHOD_ABUBAKR
  const tz = tzOffsetHours(loc.tz || (abubakr ? 'Asia/Baku' : 'UTC'), g.year, g.month, g.day)
  return computeTimes(g, Number(loc.lat), Number(loc.lng), tz, calcMethodFor(loc)).maghrib || ''
}

/** PRAYER_CITIES elementi → getPrayerLocation() formatı (prayerLocation.js → methodFor ilə eyni). */
export function locFromCity(c) {
  return {
    id: c.id, lat: c.lat, lng: c.lng, tz: c.tz,
    method: c.method || (c.country === 'AZ' ? METHOD_ABUBAKR : 13),
    city: c.label, country: c.country,
  }
}

export const cityLabel = (loc, lang) => {
  const c = loc?.city
  if (!c) return ''
  if (typeof c === 'string') return c
  return c[lang] || c.en || c.az || Object.values(c).find(Boolean) || ''
}

// ── Mətn ──────────────────────────────────────────────

const clip = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)
export const cleanPhone = (s) => String(s ?? '').replace(/[^\d+\-() ]/g, '').replace(/\s+/g, ' ').trim().slice(0, LIMITS.phone)

/** İstifadəçi sahələrini təmizlə və uzunluğu kəs. */
export function cleanFields(f = {}) {
  return {
    hosts: clip(f.hosts, LIMITS.hosts),
    guests: clip(f.guests, LIMITS.guests),
    address: clip(f.address, LIMITS.address),
    note: clip(f.note, LIMITS.note),
    phone: cleanPhone(f.phone),
  }
}

const capFirst = (s) => (s ? s[0].toLocaleUpperCase() + s.slice(1) : s)

/** Kartın və mesajın tarix sətirləri. */
export function dateLines(g, lang) {
  const h = gregorianToHijri(g)
  return {
    hijri: formatHijri(h, lang),
    greg: `${formatGregorian(g, lang)}, ${weekdayName(g, lang)}`,
    weekday: capFirst(weekdayName(g, lang)),
    hijriObj: h,
  }
}

// Kart/mesaj mətnləri (5 dil)
export const CARD_T = {
  az: { title: 'İftar dəvəti', invites: 'sizi iftar süfrəsinə dəvət edir', inviteWe: 'Sizi iftar süfrəsinə dəvət edirik', iftar: 'İftar', maghrib: 'məğrib azanı ilə', date: 'Tarix', place: 'Ünvan', rsvp: 'Cavab üçün' },
  en: { title: 'Iftar invitation', invites: 'invite you to break the fast together', inviteWe: 'We invite you to break the fast with us', iftar: 'Iftar', maghrib: 'at the Maghrib adhan', date: 'Date', place: 'Place', rsvp: 'RSVP' },
  ru: { title: 'Приглашение на ифтар', invites: 'приглашают вас на ифтар', inviteWe: 'Приглашаем вас на ифтар', iftar: 'Ифтар', maghrib: 'с азаном магриба', date: 'Дата', place: 'Адрес', rsvp: 'Ответ по телефону' },
  ar: { title: 'دعوة إفطار', invites: 'يتشرفون بدعوتكم إلى مائدة الإفطار', inviteWe: 'نتشرف بدعوتكم إلى مائدة الإفطار', iftar: 'الإفطار', maghrib: 'مع أذان المغرب', date: 'التاريخ', place: 'المكان', rsvp: 'للتأكيد' },
  tr: { title: 'İftar daveti', invites: 'sizi iftar sofrasına davet ediyor', inviteWe: 'Sizi iftar sofrasına davet ediyoruz', iftar: 'İftar', maghrib: 'akşam ezanıyla', date: 'Tarih', place: 'Adres', rsvp: 'Dönüş için' },
}
const ct = (lang) => CARD_T[lang] || CARD_T.en

/** Kopyalanan / paylaşılan dəvət mətni (WhatsApp üçün). */
export function inviteText({ fields, g, time, city, lang = 'az' }) {
  const t = ct(lang)
  const f = cleanFields(fields)
  const d = dateLines(g, lang)
  const place = [f.address, city].filter(Boolean).join(', ')
  const lines = []
  if (f.guests) lines.push(lang === 'ar' ? `${f.guests}،` : `${f.guests},`)
  lines.push(f.hosts ? `${f.hosts} ${t.invites}.` : `${t.inviteWe}.`)
  lines.push('')
  lines.push(`${t.date}: ${d.hijri} · ${d.greg}`)
  if (time) lines.push(`${t.iftar}: ${time} (${t.maghrib})`)
  if (place) lines.push(`${t.place}: ${place}`)
  if (f.note) lines.push('', f.note)
  if (f.phone) lines.push('', `${t.rsvp}: ${f.phone}`)
  lines.push('', 'muslims.cc')
  return lines.join('\n')
}

export const fileName = (g, formatId) =>
  `iftar-${g.year}-${String(g.month).padStart(2, '0')}-${String(g.day).padStart(2, '0')}-${formatId}-muslims-cc.png`

// ═══ Çəkim (canvas) ═══════════════════════════════════

const TAU = Math.PI * 2

/** Sabit "təsadüfi" ədədlər — ulduzlar hər dəfə eyni yerdə. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PALETTE = {
  lantern: { ink: '#f5ecd6', soft: 'rgba(245,236,214,.78)', gold: '#e9c46a', accent: '#ffd98a', panel: 'rgba(255,217,138,.10)', panelLine: 'rgba(233,196,106,.55)', mark: 'rgba(245,236,214,.6)' },
  arch: { ink: '#2b2118', soft: 'rgba(43,33,24,.72)', gold: '#b8862f', accent: '#b5482f', title: '#1d5f66', panel: 'rgba(29,95,102,.07)', panelLine: 'rgba(29,95,102,.45)', mark: 'rgba(43,33,24,.55)' },
  palm: { ink: '#f6ecd2', soft: 'rgba(246,236,210,.8)', gold: '#e4be6a', accent: '#ffd27a', panel: 'rgba(228,190,106,.10)', panelLine: 'rgba(228,190,106,.55)', mark: 'rgba(246,236,210,.6)' },
}

// ── Ortaq bəzəklər ──

function crescent(ctx, x, y, r, fill, glow) {
  if (glow) {
    const gl = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.2)
    gl.addColorStop(0, glow); gl.addColorStop(1, 'rgba(255,214,120,0)')
    ctx.fillStyle = gl
    ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill()
  }
  // Hilal: dairə minus sürüşdürülmüş dairə (evenodd, dairənin içi ilə kəsilmiş)
  ctx.save()
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.moveTo(x + r * 0.42 + r * 0.86, y - r * 0.22)
  ctx.arc(x + r * 0.42, y - r * 0.22, r * 0.86, 0, TAU)
  ctx.fillStyle = fill
  ctx.fill('evenodd')
  ctx.restore()
}

/** Səkkizguşəli ulduz (iki kvadrat). */
function star8(ctx, x, y, r) {
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2
    const rr = i % 2 ? r * 0.62 : r
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py)
  }
  ctx.closePath()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Asılmış fənər: yuxarı ip ucu (x, top), gövdə hündürlüyü s. */
function lantern(ctx, x, top, len, s, col) {
  const { metal, glass, glow } = col
  ctx.save()
  ctx.strokeStyle = metal; ctx.lineWidth = Math.max(1.5, s * 0.025)
  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + len); ctx.stroke()
  const y = top + len
  // halqa
  ctx.beginPath(); ctx.arc(x, y + s * 0.04, s * 0.05, 0, TAU); ctx.stroke()
  // işıq halosu
  const halo = ctx.createRadialGradient(x, y + s * 0.55, 0, x, y + s * 0.55, s * 1.1)
  halo.addColorStop(0, glow); halo.addColorStop(1, 'rgba(255,190,90,0)')
  ctx.fillStyle = halo
  ctx.beginPath(); ctx.arc(x, y + s * 0.55, s * 1.1, 0, TAU); ctx.fill()
  // qübbəli qapaq
  ctx.fillStyle = metal
  ctx.beginPath()
  ctx.moveTo(x - s * 0.06, y + s * 0.09)
  ctx.quadraticCurveTo(x - s * 0.3, y + s * 0.16, x - s * 0.3, y + s * 0.25)
  ctx.lineTo(x + s * 0.3, y + s * 0.25)
  ctx.quadraticCurveTo(x + s * 0.3, y + s * 0.16, x + s * 0.06, y + s * 0.09)
  ctx.closePath(); ctx.fill()
  // şüşə gövdə (altıbucaqlı)
  const g = ctx.createLinearGradient(x - s * 0.3, 0, x + s * 0.3, 0)
  g.addColorStop(0, glass[0]); g.addColorStop(0.5, glass[1]); g.addColorStop(1, glass[0])
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(x - s * 0.26, y + s * 0.27)
  ctx.lineTo(x + s * 0.26, y + s * 0.27)
  ctx.lineTo(x + s * 0.34, y + s * 0.55)
  ctx.lineTo(x + s * 0.24, y + s * 0.84)
  ctx.lineTo(x - s * 0.24, y + s * 0.84)
  ctx.lineTo(x - s * 0.34, y + s * 0.55)
  ctx.closePath(); ctx.fill()
  ctx.lineWidth = Math.max(1.2, s * 0.022); ctx.stroke()
  // qabırğalar
  ctx.beginPath()
  ctx.moveTo(x, y + s * 0.27); ctx.lineTo(x, y + s * 0.84)
  ctx.moveTo(x - s * 0.13, y + s * 0.27); ctx.lineTo(x - s * 0.17, y + s * 0.55); ctx.lineTo(x - s * 0.12, y + s * 0.84)
  ctx.moveTo(x + s * 0.13, y + s * 0.27); ctx.lineTo(x + s * 0.17, y + s * 0.55); ctx.lineTo(x + s * 0.12, y + s * 0.84)
  ctx.moveTo(x - s * 0.34, y + s * 0.55); ctx.lineTo(x + s * 0.34, y + s * 0.55)
  ctx.stroke()
  // alt hissə + ucluq
  ctx.fillStyle = metal
  ctx.beginPath()
  ctx.moveTo(x - s * 0.24, y + s * 0.84); ctx.lineTo(x + s * 0.24, y + s * 0.84)
  ctx.lineTo(x + s * 0.1, y + s * 0.95); ctx.lineTo(x - s * 0.1, y + s * 0.95)
  ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(x - s * 0.04, y + s * 0.95); ctx.lineTo(x, y + s * 1.08); ctx.lineTo(x + s * 0.04, y + s * 0.95); ctx.fill()
  ctx.restore()
}

function cornerFrame(ctx, W, H, inset, color, lw) {
  ctx.save()
  ctx.strokeStyle = color; ctx.lineWidth = lw
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2)
  ctx.lineWidth = lw * 0.5
  const i2 = inset + lw * 5
  ctx.strokeRect(i2, i2, W - i2 * 2, H - i2 * 2)
  ctx.fillStyle = color
  for (const [cx, cy] of [[inset, inset], [W - inset, inset], [inset, H - inset], [W - inset, H - inset]]) {
    star8(ctx, cx, cy, lw * 7); ctx.fill()
  }
  ctx.restore()
}

// ── Dizayn 1: fənərlər + hilal, gecə mavisi ──
function bgLantern(ctx, W, H, u) {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#08122c'); bg.addColorStop(0.55, '#122557'); bg.addColorStop(1, '#1c1747')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  const r = rng(1448)
  for (let i = 0; i < 120; i++) {
    const x = r() * W, y = r() * H * 0.9, s = (0.6 + r() * 1.8) * u
    ctx.fillStyle = `rgba(255,244,214,${0.25 + r() * 0.6})`
    ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill()
  }
  // bir neçə parıldayan ulduz
  ctx.fillStyle = 'rgba(255,236,190,.9)'
  for (let i = 0; i < 7; i++) { star8(ctx, r() * W, r() * H * 0.6, (5 + r() * 5) * u); ctx.fill() }
  // aşağıda zərif işıq
  const glow = ctx.createRadialGradient(W / 2, H * 1.05, 0, W / 2, H * 1.05, H * 0.55)
  glow.addColorStop(0, 'rgba(233,196,106,.28)'); glow.addColorStop(1, 'rgba(233,196,106,0)')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H)
  crescent(ctx, W / 2, H * 0.09 + 40 * u, 62 * u, '#f3d28a', 'rgba(255,214,120,.35)')
  const col = { metal: '#d9b25e', glass: ['rgba(255,170,70,.75)', 'rgba(255,226,150,.95)'], glow: 'rgba(255,190,90,.45)' }
  const sTop = H * 0.075
  lantern(ctx, W * 0.14, 0, sTop * 0.9, 150 * u, col)
  lantern(ctx, W * 0.27, 0, sTop * 0.35, 105 * u, col)
  lantern(ctx, W * 0.86, 0, sTop * 1.2, 150 * u, col)
  lantern(ctx, W * 0.73, 0, sTop * 0.5, 105 * u, col)
  cornerFrame(ctx, W, H, 34 * u, 'rgba(233,196,106,.7)', 3 * u)
  return { top: Math.max(H * 0.075 + 270 * u, 300 * u), bottom: 110 * u, width: W * 0.8 }
}

// ── Dizayn 2: mozaika tağı, fil sümüyü ──
function mosaicBand(ctx, W, H, band, u) {
  const cols = ['#1d5f66', '#b5482f', '#c9a24a']
  const step = band
  ctx.save()
  ctx.fillStyle = '#efe3c8'
  ctx.fillRect(0, 0, W, H)
  let k = 0
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      const edge = x < band * 1.01 || x > W - band * 1.01 || y < band * 1.01 || y > H - band * 1.01
      if (!edge) continue
      ctx.fillStyle = cols[(k++) % 3]
      star8(ctx, x, y, step * 0.42); ctx.fill()
      ctx.fillStyle = '#f8f1e3'
      star8(ctx, x, y, step * 0.16); ctx.fill()
    }
  }
  ctx.restore()
  ctx.strokeStyle = '#1d5f66'; ctx.lineWidth = 3 * u
  ctx.strokeRect(band, band, W - band * 2, H - band * 2)
}

function archPath(ctx, x0, x1, spring, apex, bottom) {
  const w = x1 - x0, cx = (x0 + x1) / 2
  ctx.beginPath()
  ctx.moveTo(x0, bottom)
  ctx.lineTo(x0, spring)
  // sivri (kəsişən qövslü) tağ
  ctx.bezierCurveTo(x0, spring - (spring - apex) * 0.62, cx - w * 0.2, apex + (spring - apex) * 0.12, cx, apex)
  ctx.bezierCurveTo(cx + w * 0.2, apex + (spring - apex) * 0.12, x1, spring - (spring - apex) * 0.62, x1, spring)
  ctx.lineTo(x1, bottom)
  ctx.closePath()
}

function bgArch(ctx, W, H, u) {
  const band = 64 * u
  mosaicBand(ctx, W, H, band, u)
  // tağın ətrafı (köşəliklər) — daha incə naxış
  const x0 = band + 46 * u, x1 = W - band - 46 * u
  const apex = band + 40 * u, spring = apex + (x1 - x0) * 0.55, bottom = H - band - 40 * u
  ctx.save()
  ctx.beginPath(); ctx.rect(band, band, W - band * 2, H - band * 2); ctx.clip()
  ctx.fillStyle = '#f3e7cd'; ctx.fillRect(band, band, W - band * 2, H - band * 2)
  ctx.strokeStyle = 'rgba(29,95,102,.28)'; ctx.lineWidth = 1.5 * u
  const st = 46 * u
  for (let y = band; y < spring + st; y += st) {
    for (let x = band; x < W - band + st; x += st) { star8(ctx, x, y, st * 0.38); ctx.stroke() }
  }
  ctx.restore()
  // tağın içi
  const fill = ctx.createLinearGradient(0, apex, 0, bottom)
  fill.addColorStop(0, '#fffaf0'); fill.addColorStop(1, '#fbf3e2')
  ctx.save()
  ctx.shadowColor = 'rgba(80,50,20,.18)'; ctx.shadowBlur = 24 * u
  archPath(ctx, x0, x1, spring, apex, bottom); ctx.fillStyle = fill; ctx.fill()
  ctx.restore()
  archPath(ctx, x0, x1, spring, apex, bottom)
  ctx.strokeStyle = '#1d5f66'; ctx.lineWidth = 7 * u; ctx.stroke()
  archPath(ctx, x0 + 14 * u, x1 - 14 * u, spring + 6 * u, apex + 18 * u, bottom - 14 * u)
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 2.5 * u; ctx.stroke()
  // tağın zirvəsindən kiçik fənər
  lantern(ctx, W / 2, apex + 18 * u, 46 * u, 120 * u,
    { metal: '#9a7426', glass: ['rgba(214,120,60,.65)', 'rgba(255,214,140,.95)'], glow: 'rgba(255,190,110,.35)' })
  return { top: apex + 230 * u, bottom: band + 110 * u, width: (x1 - x0) - 110 * u }
}

// ── Dizayn 3: xurma ağacları + qızılı, tünd firuzəyi ──
function palm(ctx, x, base, h, lean, u0, flip = 1) {
  const u = u0 * Math.min(1, h / (400 * u0))   // kiçik ağacda yarpaq və salxım da kiçilir
  const topX = x + lean * flip, topY = base - h
  ctx.save()
  // gövdə — seqmentlər
  ctx.strokeStyle = '#052322'; ctx.lineWidth = 22 * u; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + lean * 0.15 * flip, base - h * 0.5, topX, topY); ctx.stroke()
  ctx.strokeStyle = 'rgba(228,190,106,.35)'; ctx.lineWidth = 2 * u
  for (let i = 1; i < 12; i++) {
    const t = i / 12
    const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * (x + lean * 0.15 * flip) + t * t * topX
    const py = (1 - t) * (1 - t) * base + 2 * (1 - t) * t * (base - h * 0.5) + t * t * topY
    ctx.beginPath(); ctx.moveTo(px - 11 * u, py + 3 * u); ctx.lineTo(px + 11 * u, py - 3 * u); ctx.stroke()
  }
  // yarpaqlar
  const fronds = [-2.7, -2.25, -1.85, -1.3, -0.9, -0.45, -0.05, 0.35]
  for (const a0 of fronds) {
    const a = flip > 0 ? a0 : -Math.PI - a0
    const L = (150 + 60 * Math.cos(a0 + 1.5)) * u
    const ex = topX + Math.cos(a) * L, ey = topY + Math.sin(a) * L + L * 0.35
    const mx = topX + Math.cos(a) * L * 0.55, my = topY + Math.sin(a) * L * 0.55 - 26 * u
    const nx = -(ey - topY), ny = ex - topX, nl = Math.hypot(nx, ny) || 1
    const w = 22 * u
    ctx.fillStyle = '#0a4a47'
    ctx.beginPath()
    ctx.moveTo(topX, topY)
    ctx.quadraticCurveTo(mx + (nx / nl) * w, my + (ny / nl) * w, ex, ey)
    ctx.quadraticCurveTo(mx - (nx / nl) * w * 0.3, my - (ny / nl) * w * 0.3, topX, topY)
    ctx.fill()
    ctx.strokeStyle = 'rgba(228,190,106,.55)'; ctx.lineWidth = 1.6 * u
    ctx.beginPath(); ctx.moveTo(topX, topY); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke()
  }
  // xurma salxımları
  const r = rng(Math.round(x))
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const dx = side * (10 + r() * 26) * u, dy = (14 + r() * 40) * u
      ctx.fillStyle = r() > 0.5 ? '#e0a33a' : '#c9772b'
      ctx.beginPath(); ctx.ellipse(topX + dx, topY + dy, 6.5 * u, 9 * u, 0, 0, TAU); ctx.fill()
    }
  }
  ctx.restore()
}

function bgPalm(ctx, W, H, u) {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0c4346'); bg.addColorStop(0.6, '#0a3234'); bg.addColorStop(1, '#06201f')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  // yuxarıda qızılı işıq + hilal
  const glow = ctx.createRadialGradient(W / 2, H * 0.06, 0, W / 2, H * 0.06, W * 0.6)
  glow.addColorStop(0, 'rgba(228,190,106,.30)'); glow.addColorStop(1, 'rgba(228,190,106,0)')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H)
  const r = rng(9)
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(246,236,210,${0.2 + r() * 0.5})`
    ctx.beginPath(); ctx.arc(r() * W, r() * H * 0.5, (0.6 + r() * 1.4) * u, 0, TAU); ctx.fill()
  }
  crescent(ctx, W / 2, 150 * u, 56 * u, '#ecc977', 'rgba(236,201,119,.3)')
  // qumtəpələr
  ctx.fillStyle = '#082b2a'
  ctx.beginPath(); ctx.moveTo(0, H)
  ctx.lineTo(0, H - 120 * u)
  ctx.quadraticCurveTo(W * 0.3, H - 190 * u, W * 0.55, H - 110 * u)
  ctx.quadraticCurveTo(W * 0.8, H - 50 * u, W, H - 140 * u)
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = 'rgba(228,190,106,.45)'; ctx.lineWidth = 2 * u; ctx.stroke()
  const ph = Math.min(H * (H / W > 1.5 ? 0.2 : 0.12), 400 * u)
  const ps = Math.min(1, ph / (400 * u))
  palm(ctx, W * 0.1, H - 90 * u, ph, 70 * u, u, 1)
  palm(ctx, W * 0.9, H - 100 * u, ph * 0.86, 60 * u, u, -1)
  cornerFrame(ctx, W, H, 34 * u, 'rgba(228,190,106,.75)', 3 * u)
  return { top: 260 * u, bottom: ph + 90 * u + 170 * ps * u, width: W * 0.72 }
}

const BG = { lantern: bgLantern, arch: bgArch, palm: bgPalm }

// ── Mətn düzümü ──

function wrap(ctx, text, maxW, maxLines = 3) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width <= maxW || !line) line = test
    else { lines.push(line); line = w }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines)
    let last = keep[maxLines - 1]
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1)
    keep[maxLines - 1] = `${last}…`
    return keep
  }
  return lines
}

// Telefon nömrəsi ərəbcə (RTL) kartda tərsinə düşməsin — LTR yerləşdirmə
const LTR = (s) => String.fromCharCode(0x202A) + s + String.fromCharCode(0x202C)
const SERIF = 'Amiri, Georgia, "Times New Roman", serif'
// Ərəbcə kartda istifadəçi latınca yazıbsa, həmin sətir soldan sağa çəkilsin (ilk güclü hərfə görə)
const lineDir = (s) => {
  const m = String(s).match(/[A-Za-zÀ-ɏЀ-ӿ؀-ۿ]/)
  return m && /[؀-ۿ]/.test(m[0]) ? 'rtl' : 'ltr'
}
const SANS = 'Inter, "IBM Plex Sans Arabic", system-ui, sans-serif'

/**
 * Kartı çək. data: { design, lang, fields, g, time, city }
 * Koordinatlar W×H-dədir (önizləmə üçün ctx əvvəlcədən miqyaslana bilər).
 */
export function renderInvite(ctx, data, W, H) {
  const { design = 'lantern', lang = 'az', g, time, city } = data
  const f = cleanFields(data.fields)
  const t = ct(lang)
  const u = W / 1080
  const pal = PALETTE[design] || PALETTE.lantern
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  try { ctx.direction = lang === 'ar' ? 'rtl' : 'ltr' } catch { /* köhnə brauzer */ }
  const safe = (BG[design] || bgLantern)(ctx, W, H, u)
  const d = dateLines(g, lang)
  const place = [f.address, city].filter(Boolean).join(', ')
  const cx = W / 2
  const maxW = safe.width

  // Elementlər: { kind, font(k), color, text|lines, size, gapAfter }
  const build = (k) => {
    const items = []
    const add = (o) => items.push(o)
    const sz = (n) => n * u * k
    if (f.guests) add({ text: lang === 'ar' ? `${f.guests}،` : `${f.guests},`, font: `italic 500 ${sz(42)}px ${SANS}`, size: sz(42), color: pal.soft, gap: sz(18), max: 2 })
    add({ text: t.title, font: `700 ${sz(lang === 'ru' ? 92 : 112)}px ${SERIF}`, size: sz(lang === 'ru' ? 92 : 112), color: pal.title || pal.gold, gap: sz(8), max: 2 })
    add({ kind: 'orn', size: sz(34), gap: sz(26) })
    if (f.hosts) {
      add({ text: f.hosts, font: `800 ${sz(54)}px ${SANS}`, size: sz(54), color: pal.ink, gap: sz(10), max: 2 })
      add({ text: t.invites, font: `400 ${sz(36)}px ${SANS}`, size: sz(36), color: pal.soft, gap: sz(36), max: 2 })
    } else {
      add({ text: t.inviteWe, font: `500 ${sz(40)}px ${SANS}`, size: sz(40), color: pal.ink, gap: sz(36), max: 2 })
    }
    if (time) add({ kind: 'time', size: sz(190), gap: sz(36), k })
    add({ text: d.hijri, font: `700 ${sz(52)}px ${SERIF}`, size: sz(52), color: pal.gold, gap: sz(6), max: 1 })
    add({ text: d.greg, font: `500 ${sz(36)}px ${SANS}`, size: sz(36), color: pal.ink, gap: sz(28), max: 2 })
    if (place) add({ text: place, font: `600 ${sz(36)}px ${SANS}`, size: sz(36), color: pal.ink, gap: sz(24), max: 3, pin: true })
    if (f.note) add({ text: lang === 'ar' ? `«${f.note}»` : `“${f.note}”`, font: `italic 400 ${sz(34)}px ${SANS}`, size: sz(34), color: pal.soft, gap: sz(22), max: 3 })
    if (f.phone) add({ text: `${t.rsvp}: ${LTR(f.phone)}`, font: `600 ${sz(32)}px ${SANS}`, size: sz(32), color: pal.soft, gap: 0, max: 1 })
    let total = 0
    for (const it of items) {
      if (it.text != null) {
        ctx.font = it.font
        it.lines = wrap(ctx, it.text, it.pin ? maxW - 50 * u : maxW, it.max)
        it.h = it.lines.length * it.size * 1.22
      } else it.h = it.size
      total += it.h + it.gap
    }
    return { items, total }
  }

  const avail = H - safe.top - safe.bottom
  // Böyükdən başla (story-də boşluq qalmasın), sığana qədər kiçilt
  let k = 1.3, lay = build(k)
  while (lay.total > avail && k > 0.62) { k -= 0.04; lay = build(k) }
  let y = safe.top + Math.max(0, (avail - lay.total) / 2)

  for (const it of lay.items) {
    if (it.kind === 'orn') {
      const oy = y + it.size / 2
      ctx.strokeStyle = pal.gold; ctx.fillStyle = pal.gold; ctx.lineWidth = 2 * u
      ctx.beginPath(); ctx.moveTo(cx - 170 * u, oy); ctx.lineTo(cx - 28 * u, oy); ctx.moveTo(cx + 28 * u, oy); ctx.lineTo(cx + 170 * u, oy); ctx.stroke()
      star8(ctx, cx, oy, 15 * u); ctx.fill()
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * 180 * u, oy, 4 * u, 0, TAU); ctx.fill() }
    } else if (it.kind === 'time') {
      const pw = Math.min(maxW, 640 * u), ph = it.size
      roundRect(ctx, cx - pw / 2, y, pw, ph, 30 * u)
      ctx.fillStyle = pal.panel; ctx.fill()
      ctx.strokeStyle = pal.panelLine; ctx.lineWidth = 2.5 * u; ctx.stroke()
      ctx.fillStyle = pal.soft
      ctx.font = `600 ${32 * u * it.k}px ${SANS}`
      ctx.fillText(`${t.iftar} · ${t.maghrib}`, cx, y + ph * 0.3)
      ctx.fillStyle = pal.accent
      ctx.font = `800 ${104 * u * it.k}px ${SANS}`
      ctx.save(); try { ctx.direction = 'ltr' } catch { /* */ }
      ctx.fillText(time, cx, y + ph * 0.82)
      ctx.restore()
    } else {
      ctx.font = it.font; ctx.fillStyle = it.color
      it.lines.forEach((ln, i) => {
        const ly = y + it.size * (1 + i * 1.22)
        const dir = lang === 'ar' ? lineDir(ln) : 'ltr'
        try { ctx.direction = dir } catch { /* köhnə brauzer */ }
        ctx.fillText(ln, cx, ly)
        if (it.pin && i === 0) {
          // kiçik yer nişanı
          const w = ctx.measureText(ln).width
          const px = dir === 'rtl' ? cx + w / 2 + 24 * u : cx - w / 2 - 24 * u
          const py = ly - it.size * 0.42
          ctx.save(); ctx.fillStyle = pal.gold
          ctx.beginPath(); ctx.arc(px, py - 4 * u, 11 * u, Math.PI, 0)
          ctx.lineTo(px, py + 16 * u); ctx.closePath(); ctx.fill()
          ctx.fillStyle = design === 'arch' ? '#fffaf0' : '#0b1d33'
          ctx.beginPath(); ctx.arc(px, py - 4 * u, 4.2 * u, 0, TAU); ctx.fill()
          ctx.restore()
        }
      })
    }
    y += it.h + it.gap
  }

  // Saytın nişanı
  ctx.font = `600 ${26 * u}px ${SANS}`
  ctx.fillStyle = pal.mark
  try { ctx.direction = 'ltr' } catch { /* */ }
  ctx.fillText('muslims.cc', cx, H - (design === 'arch' ? 128 * u : 62 * u))
  ctx.restore()
}
