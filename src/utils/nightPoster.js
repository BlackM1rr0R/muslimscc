// ═══════════════════════════════════════════════════════
// Ayə ilə ulduzlu gecə kartı (v7.3) — saf hesab + poster çəkilişi
// (components/NightSkyPoster.jsx, tests/unit/night-poster.test.js)
//
// • Seçilən yerin (enlik/uzunluq, saat qurşağı) seçilən gecəsi: ulduzlar və
//   bürc xətləri (/data/sky/sky.json — HYG), Ay (utils/lunar — Meeus) əsl fazası
//   və parlaq tərəfinin istiqaməti ilə, planetlər (utils/skyMath — JPL).
// • Proyeksiya: zenit mərkəzdə stereoqrafik, üfüq — xarici dairə; yuxarı Şimal,
//   SOL Şərq (göyə arxası üstə uzanıb baxanda olduğu kimi).
// • Ayələr: SKY_AYAHS — mətnlər scripts/build-sky-ayahs.mjs ilə seo-data/quran-dan
//   hərfi-hərfinə köçürülür (public/data/sky-ayahs/<dil>.json).
// ═══════════════════════════════════════════════════════
import { angSep, horizontal, moonEcliptic, sunEcliptic, toEquatorial, elongLon } from './lunar.js'
import { planetEquatorial, PLANETS } from './skyMath.js'

const RAD = Math.PI / 180
const norm = (x) => ((x % 360) + 360) % 360

/** Göy və gecə barədə ayələr: { s, a, to? } — to: aralığın son ayəsi */
export const SKY_AYAHS = [
  { s: 25, a: 61 },
  { s: 37, a: 6 },
  { s: 6, a: 97 },
  { s: 86, a: 1, to: 3 },
  { s: 36, a: 38 },
  { s: 36, a: 39 },
  { s: 36, a: 40 },
  { s: 55, a: 5 },
  { s: 10, a: 5 },
  { s: 71, a: 16 },
]
export const ayahKey = (x) => `${x.s}:${x.a}`
export const ayahLabel = (x) => (x.to ? `${x.s}:${x.a}–${x.to}` : `${x.s}:${x.a}`)
/** Girişin bütün tək ayə istinadları: ['86:1', '86:2', '86:3'] */
export const ayahRefs = (x) => { const out = []; for (let a = x.a; a <= (x.to || x.a); a++) out.push(`${x.s}:${a}`); return out }
/** Build skripti üçün — bütün istinadlar */
export const allAyahRefs = () => SKY_AYAHS.flatMap(ayahRefs)

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const arNum = (n) => String(n).replace(/\d/g, d => AR_DIGITS[d])

/**
 * Seçilmiş ayə(lər)in mətni: { ar, tr } — aralıqda ərəbcə mətnlər ayə nömrəsi ilə ﴿…﴾ birləşir,
 * tərcümə boşluqla. Məlumat yoxdursa null.
 */
export function ayahText(entry, data) {
  if (!entry || !data?.ar) return null
  const refs = ayahRefs(entry)
  if (refs.some(r => !data.ar[r])) return null
  const ar = refs.map(r => (refs.length > 1 ? `${data.ar[r]} ﴿${arNum(r.split(':')[1])}﴾` : data.ar[r])).join(' ')
  const tr = data.tr && refs.every(r => data.tr[r]) ? refs.map(r => data.tr[r]).join(' ') : ''
  return { ar, tr, by: data.by || '' }
}

/** Şəxsi sətir: tək sətir, boşluqlar sıxılır, ən çox 60 simvol (kod nöqtəsi ilə) */
export const MAX_LINE = 60
export function cleanLine(s) {
  return Array.from(String(s || '').replace(/\s+/g, ' ').trimStart()).slice(0, MAX_LINE).join('')
}

// ── Saat qurşağı ──
/** tz-nin `ms` anındakı UTC fərqi (ms) */
export function tzOffset(ms, tz) {
  if (!tz) return -new Date(ms).getTimezoneOffset() * 60000
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(ms)).map(x => [x.type, x.value]))
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second)
    return asUtc - Math.floor(ms / 1000) * 1000
  } catch { return -new Date(ms).getTimezoneOffset() * 60000 }
}
/** "2026-11-17" + "21:00" yerin divar saatı ilə → UTC ms */
export function zonedToUtc(date, time, tz) {
  const [y, m, d] = String(date).split('-').map(Number)
  const [hh, mm] = String(time || '21:00').split(':').map(Number)
  if (!y || !m || !d) return NaN
  const guess = Date.UTC(y, m - 1, d, hh || 0, mm || 0)
  let ms = guess - tzOffset(guess, tz)
  ms = guess - tzOffset(ms, tz)
  return ms
}
/** `ms` anında yerin tarixi "YYYY-MM-DD" */
export function zonedDate(ms, tz) {
  const t = new Date(ms + tzOffset(ms, tz))
  return t.toISOString().slice(0, 10)
}

/** 40.3953, 49.8822 → "40°23′ N · 49°52′ E" */
export function fmtCoords(lat, lng) {
  const dm = (v) => { const a = Math.abs(v); let d = Math.floor(a), m = Math.round((a - d) * 60); if (m === 60) { d++; m = 0 } return `${d}°${String(m).padStart(2, '0')}′` }
  return `${dm(lat)} ${lat >= 0 ? 'N' : 'S'} · ${dm(lng)} ${lng >= 0 ? 'E' : 'W'}`
}

// ── Proyeksiya ──
/** Üfüqi → vahid dairə (zenit 0,0; üfüq r = 1). Yuxarı Şimal, sol Şərq. */
export function chartXY(alt, az) {
  const r = Math.tan(((90 - alt) / 2) * RAD)
  return [-r * Math.sin(az * RAD), -r * Math.cos(az * RAD)]
}
const vec = (alt, az) => [Math.cos(alt * RAD) * Math.sin(az * RAD), Math.cos(alt * RAD) * Math.cos(az * RAD), Math.sin(alt * RAD)]
const altaz = (v) => ({ alt: Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD, az: norm(Math.atan2(v[0], v[1]) / RAD) })

/**
 * Ayın parlaq kənarının xəritədə istiqaməti (radian, ekran: x sağa, y aşağı) —
 * Aydan Günəşə doğru böyük dairə boyunca 1° addımın proyeksiyası (stereoqrafik bucağı saxlayır).
 */
export function limbAngle(moon, sun) {
  const m = vec(moon.alt, moon.az), s = vec(sun.alt, sun.az)
  const d = m[0] * s[0] + m[1] * s[1] + m[2] * s[2]
  let t = [s[0] - d * m[0], s[1] - d * m[1], s[2] - d * m[2]]
  const L = Math.hypot(...t) || 1
  t = t.map(x => x / L)
  const k = 1 * RAD
  const p = altaz(m.map((x, i) => x * Math.cos(k) + t[i] * Math.sin(k)))
  const a = chartXY(moon.alt, moon.az), b = chartXY(p.alt, p.az)
  return Math.atan2(b[1] - a[1], b[0] - a[0])
}

/** Ayın fazası: { frac (0…1 işıqlı hissə), waxing, elong (°) } */
export function moonPhase(ms) {
  const m = moonEcliptic(ms), s = sunEcliptic(ms)
  const me = toEquatorial(m.lon, m.lat, ms), se = toEquatorial(s.lon, 0, ms)
  const elong = angSep(me.ra, me.dec, se.ra, se.dec)
  // Meeus 48.1: işıqlı hissə k = (1 + cos i)/2, faza bucağı i ≈ 180° − elongasiya (xəta < 0.2°)
  const frac = (1 - Math.cos(elong * RAD)) / 2
  return { frac, waxing: elongLon(ms) > 0, elong, me, se }
}

/**
 * Səhnə: seçilən an və yerdə xəritəyə düşən hər şey (koordinatlar vahid dairədə).
 * data — sky.json ({ stars: [[ra, dec, mag, bv]], lines: [[[ra, dec], …]] }).
 */
export function skyScene(data, ms, lat, lng) {
  const stars = []
  for (const [ra, dec, mag, bv] of data?.stars || []) {
    const h = horizontal(ra, dec, ms, lat, lng)
    if (h.alt < 0) continue
    const [x, y] = chartXY(h.alt, h.az)
    stars.push({ x, y, mag, bv })
  }
  const lines = []
  for (const l of data?.lines || []) {
    const pts = l.map(([ra, dec]) => horizontal(ra, dec, ms, lat, lng))
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i]
      if (a.alt < -25 || b.alt < -25 || (a.alt < 0 && b.alt < 0)) continue   // dairədən kənarda kəsilir (clip)
      lines.push([...chartXY(a.alt, a.az), ...chartXY(b.alt, b.az)])
    }
  }
  const ph = moonPhase(ms)
  const mh = horizontal(ph.me.ra, ph.me.dec, ms, lat, lng)
  const sh = horizontal(ph.se.ra, ph.se.dec, ms, lat, lng)
  const moon = { ...mh, xy: chartXY(mh.alt, mh.az), frac: ph.frac, waxing: ph.waxing, angle: limbAngle(mh, sh), up: mh.alt > -0.5 }
  const planets = []
  for (const p of PLANETS) {
    const e = planetEquatorial(p, ms)
    const h = horizontal(e.ra, e.dec, ms, lat, lng)
    if (h.alt > 0) planets.push({ id: p, ...h, xy: chartXY(h.alt, h.az) })
  }
  return { stars, lines, moon, planets, sunAlt: sh.alt }
}

// ═══ Poster çəkilişi (canvas 2D) ═══
export const FORMATS = { a4: { w: 2480, h: 3508 }, story: { w: 1080, h: 1920 } }

const GOLD = '#e2c27a'
const GOLD_SOFT = 'rgba(226,194,122,'
const SERIF = 'Georgia, "Times New Roman", serif'
const SANS = 'Inter, system-ui, sans-serif'
const ARAB = 'Amiri, "Traditional Arabic", serif'

function starFill(bv) {
  if (bv < 0) return '#cfdcff'
  if (bv < 0.5) return '#f4f6ff'
  if (bv < 1.0) return '#fff4dc'
  return '#ffe2bb'
}

function wrap(ctx, text, maxW) {
  const out = []
  for (const para of String(text || '').split(/\n+/)) {
    const words = para.trim().split(/\s+/).filter(Boolean)
    let line = ''
    for (const w of words) {
      const t = line ? `${line} ${w}` : w
      if (line && ctx.measureText(t).width > maxW) { out.push(line); line = w } else line = t
    }
    if (line) out.push(line)
  }
  return out
}

/** Ayı fazası ilə çək: (x, y) mərkəz, r radius, angle — parlaq kənarın istiqaməti */
function drawMoon(g, x, y, r, frac, angle) {
  g.save()
  g.translate(x, y)
  g.shadowColor = 'rgba(255,246,220,.55)'; g.shadowBlur = r * 1.6
  g.fillStyle = '#26304f'
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill()
  g.shadowBlur = 0
  g.rotate(angle)
  // Parlaq tərəf +x: kənar (yarımdairə) + terminator (ellips, x = c·r·cos t)
  const c = 1 - 2 * frac
  g.beginPath()
  g.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false)
  for (let i = 0; i <= 48; i++) { const t = Math.PI / 2 - (i / 48) * Math.PI; g.lineTo(c * r * Math.cos(t), r * Math.sin(t)) }
  g.closePath()
  g.fillStyle = '#fbf3dc'
  g.fill()
  g.restore()
  g.strokeStyle = `${GOLD_SOFT}.7)`; g.lineWidth = Math.max(1, r * 0.06)
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke()
}

/**
 * Poster: ctx-yə W×H ölçüdə çəkir.
 * p: { scene, place, dateLine, coords, line, ayah: { ar, tr, ref, by } | null, labels: { N, E, S, W }, planetNames, rtl }
 */
export function drawPoster(g, W, H, p) {
  const u = W / 1080
  // Fon
  const bg = g.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0d1838'); bg.addColorStop(0.55, '#081129'); bg.addColorStop(1, '#050a1b')
  g.fillStyle = bg; g.fillRect(0, 0, W, H)
  // Çərçivə (qızılı ikiqat xətt)
  const m = 34 * u
  g.strokeStyle = `${GOLD_SOFT}.75)`; g.lineWidth = 2.2 * u; g.strokeRect(m, m, W - 2 * m, H - 2 * m)
  g.strokeStyle = `${GOLD_SOFT}.35)`; g.lineWidth = 1 * u; g.strokeRect(m + 12 * u, m + 12 * u, W - 2 * m - 24 * u, H - 2 * m - 24 * u)

  const R = Math.min(W * 0.39, H * 0.255)
  // Hündür format (story): xəritə bir az aşağı — mətn aşağıda boş yer qoymasın
  const cx = W / 2, cy = m + 70 * u + R + (H / W > 1.6 ? 160 * u : 0)
  const sc = p.scene
  // Göy dairəsi
  const sky = g.createRadialGradient(cx, cy, 0, cx, cy, R)
  sky.addColorStop(0, '#132150'); sky.addColorStop(1, '#0a1433')
  g.fillStyle = sky
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill()
  if (sc) {
    g.save()
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip()
    // Hündürlük dairələri (30°, 60°) — zərif kəsik xətlər
    g.strokeStyle = `${GOLD_SOFT}.12)`; g.lineWidth = 1 * u
    for (const a of [30, 60]) { const rr = R * Math.tan(((90 - a) / 2) * RAD); g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.stroke() }
    // Bürc xətləri
    g.strokeStyle = `${GOLD_SOFT}.42)`; g.lineWidth = 1.3 * u; g.lineCap = 'round'
    g.beginPath()
    for (const [x1, y1, x2, y2] of sc.lines) { g.moveTo(cx + x1 * R, cy + y1 * R); g.lineTo(cx + x2 * R, cy + y2 * R) }
    g.stroke()
    // Ulduzlar
    const k = R / 430
    for (const s of sc.stars) {
      const r = Math.max(0.55, (5.4 - s.mag) * 0.62) * k
      g.globalAlpha = Math.min(1, 0.4 + (5.4 - s.mag) * 0.16)
      g.fillStyle = starFill(s.bv)
      g.beginPath(); g.arc(cx + s.x * R, cy + s.y * R, r, 0, Math.PI * 2); g.fill()
    }
    g.globalAlpha = 1
    // Planetlər
    g.font = `500 ${Math.round(15 * u)}px ${SANS}`
    g.textAlign = 'left'; g.textBaseline = 'middle'
    for (const pl of sc.planets) {
      const x = cx + pl.xy[0] * R, y = cy + pl.xy[1] * R
      g.fillStyle = '#ffe6a6'
      g.beginPath(); g.arc(x, y, 3.2 * k, 0, Math.PI * 2); g.fill()
      const nm = p.planetNames?.[pl.id]
      if (nm) { g.fillStyle = `${GOLD_SOFT}.85)`; g.fillText(nm, x + 7 * k, y) }
    }
    // Ay
    if (sc.moon.up) drawMoon(g, cx + sc.moon.xy[0] * R, cy + sc.moon.xy[1] * R, Math.max(10 * u, R * 0.05), sc.moon.frac, sc.moon.angle)
    g.restore()
  }
  // Üfüq halqası, bölgülər, istiqamətlər
  g.strokeStyle = GOLD; g.lineWidth = 2.6 * u
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke()
  g.strokeStyle = `${GOLD_SOFT}.5)`; g.lineWidth = 1 * u
  g.beginPath(); g.arc(cx, cy, R + 16 * u, 0, Math.PI * 2); g.stroke()
  for (let az = 0; az < 360; az += 5) {
    const big = az % 30 === 0, [dx, dy] = chartXY(0, az)
    const r1 = R + (big ? 3 : 6) * u, r2 = R + 14 * u
    g.lineWidth = (big ? 1.6 : 0.9) * u
    g.beginPath(); g.moveTo(cx + dx * r1, cy + dy * r1); g.lineTo(cx + dx * r2, cy + dy * r2); g.stroke()
  }
  g.fillStyle = GOLD; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.font = `600 ${Math.round(22 * u)}px ${SERIF}`
  for (const [lab, az] of [[p.labels?.N || 'N', 0], [p.labels?.E || 'E', 90], [p.labels?.S || 'S', 180], [p.labels?.W || 'W', 270]]) {
    const [dx, dy] = chartXY(0, az), rr = R + 36 * u
    g.fillText(lab, cx + dx * rr, cy + dy * rr)
  }

  // ── Mətn bloku ──
  let y = cy + R + 112 * u
  const maxW = W - 2 * m - 120 * u
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'
  const line = cleanLine(p.line || '').trim()
  if (line) {
    g.font = `italic 500 ${Math.round(46 * u)}px ${SERIF}`
    g.fillStyle = '#f6e6b8'
    for (const l of wrap(g, line, maxW).slice(0, 2)) { g.fillText(l, cx, y); y += 54 * u }
    y += 6 * u
  }
  g.font = `700 ${Math.round(26 * u)}px ${SANS}`
  g.fillStyle = GOLD
  if ('letterSpacing' in g) g.letterSpacing = `${(3 * u).toFixed(1)}px`
  g.fillText(String(p.place || '').toUpperCase(), cx, y); y += 38 * u
  g.font = `500 ${Math.round(21 * u)}px ${SANS}`
  g.fillStyle = 'rgba(240,232,210,.85)'
  g.fillText(p.dateLine || '', cx, y); y += 32 * u
  g.fillStyle = 'rgba(240,232,210,.6)'
  g.font = `500 ${Math.round(17 * u)}px ${SANS}`
  g.fillText(p.coords || '', cx, y); y += 20 * u
  if ('letterSpacing' in g) g.letterSpacing = '0px'

  // Ayırıcı — kiçik səkkizguşəli ulduz
  y += 26 * u
  g.strokeStyle = `${GOLD_SOFT}.55)`; g.lineWidth = 1.2 * u
  g.beginPath(); g.moveTo(cx - 150 * u, y); g.lineTo(cx - 22 * u, y); g.moveTo(cx + 22 * u, y); g.lineTo(cx + 150 * u, y); g.stroke()
  g.fillStyle = GOLD
  for (const rot of [0, Math.PI / 4]) { g.save(); g.translate(cx, y); g.rotate(rot); g.fillRect(-7 * u, -7 * u, 14 * u, 14 * u); g.restore() }
  y += 44 * u

  // Ayə — qalan yerə sığana qədər kiçilir
  const bottom = H - m - 70 * u
  const a = p.ayah
  if (a) {
    let fa = 40, ft = 25, arL = [], trL = []
    for (let i = 0; i < 14; i++) {
      g.font = `400 ${fa * u}px ${ARAB}`; g.direction = 'rtl'
      arL = wrap(g, a.ar, maxW)
      g.direction = 'ltr'
      g.font = `400 ${ft * u}px ${SERIF}`
      trL = a.tr ? wrap(g, a.tr, maxW) : []
      const need = arL.length * fa * 1.75 * u + (trL.length ? 18 * u + trL.length * ft * 1.5 * u : 0) + 56 * u
      if (y + need <= bottom) break
      fa *= 0.92; ft *= 0.92
    }
    g.fillStyle = '#fbf3dc'
    g.font = `400 ${fa * u}px ${ARAB}`; g.direction = 'rtl'
    for (const l of arL) { y += fa * 1.75 * u * 0.78; g.fillText(l, cx, y); y += fa * 1.75 * u * 0.22 }
    g.direction = p.rtl ? 'rtl' : 'ltr'
    if (trL.length) {
      y += 18 * u
      g.fillStyle = 'rgba(240,232,210,.88)'
      g.font = `400 ${ft * u}px ${SERIF}`
      for (const l of trL) { y += ft * 1.5 * u; g.fillText(l, cx, y) }
    }
    g.direction = 'ltr'
    y += 40 * u
    g.fillStyle = `${GOLD_SOFT}.9)`
    g.font = `600 ${Math.round(17 * u)}px ${SANS}`
    g.fillText([a.ref, a.by].filter(Boolean).join(' · '), cx, Math.min(y, bottom))
  }
  // muslims.cc nişanı
  g.fillStyle = `${GOLD_SOFT}.6)`
  g.font = `600 ${Math.round(16 * u)}px ${SANS}`
  g.textAlign = 'center'
  g.fillText('muslims.cc', cx, H - m - 30 * u)
}
