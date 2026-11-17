// ═══════════════════════════════════════════════════════
// Xətm şəhadətnaməsi (components/quran/KhatmCertificates.jsx) — məlumat + kətan
//
// Xətm mənbələri (heç biri uydurulmur):
//   • 'plan' — Xətm planı (quran_khatm_plan, KhatmPlanner): done ≥ 604 səhifə;
//              başlanğıc = plan.start, son = log-un son günü
//   • 'life' — Ömürlük mozaika (quran_life_v1 → ks[]): 6236 ayənin hamısı oxunanda
// Kolleksiya: quran_khatm_certs_v1 → [{ id, src, start, end, name, ded, made }] (≤ 100)
// (utils/userBackup — qadağan siyahısında deyil → ehtiyat nüsxə + hesab sinxronizasiyası).
// Dini mətn: yalnız saytdakı Bəsmələ (utils/quranText → BASMALA_DISPLAY). Xətm duası
// QƏSDƏN yoxdur (KhatmPlanner-in qeydi: yayılan mətn sabit deyil).
// tests/unit/khatm-cert.test.js
// ═══════════════════════════════════════════════════════

export const CERTS_KEY = 'quran_khatm_certs_v1'
export const CERTS_EVENT = 'quran-khatm-certs-change'
export const NAME_MAX = 60
export const DED_MAX = 90
const MAX_CERTS = 100
const MUSHAF_PAGES = 604
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const isDate = (s) => typeof s === 'string' && DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`))
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
const clean = (s, max) => [...String(s ?? '')].map(ch => (ch.charCodeAt(0) < 32 || ch === '\u007f' ? ' ' : ch)).join('').replace(/\s+/g, ' ').trim().slice(0, max)

export function sanitizeCerts(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const out = []
  for (const c of raw) {
    if (!c || typeof c !== 'object' || typeof c.id !== 'string' || !c.id || seen.has(c.id)) continue
    if (!isDate(c.start) || !isDate(c.end) || c.start > c.end) continue
    seen.add(c.id)
    out.push({
      id: c.id.slice(0, 40), src: c.src === 'life' || c.src === 'plan' ? c.src : 'plan',
      start: c.start, end: c.end, name: clean(c.name, NAME_MAX), ded: clean(c.ded, DED_MAX),
      made: isDate(c.made) ? c.made : c.end,
    })
  }
  return out.slice(-MAX_CERTS)
}

export function readCerts(storage = safeStorage()) {
  try { return sanitizeCerts(JSON.parse(storage?.getItem(CERTS_KEY) || 'null')) } catch { return [] }
}
export function writeCerts(list, storage = safeStorage()) {
  try {
    if (list.length) storage?.setItem(CERTS_KEY, JSON.stringify(sanitizeCerts(list)))
    else storage?.removeItem(CERTS_KEY)
  } catch { /* yaddaş bağlıdır */ }
  try { globalThis.dispatchEvent?.(new CustomEvent(CERTS_EVENT)) } catch { /* */ }
}

/** Kolleksiyaya əlavə et / eyni id-li yazını yenilə (saf) */
export function upsertCert(list, cert) {
  const next = sanitizeCerts([...list.filter(c => c.id !== cert.id), cert])
  return next.sort((a, b) => (a.end < b.end ? -1 : a.end > b.end ? 1 : 0))
}
export const removeCert = (list, id) => list.filter(c => c.id !== id)

/** Plan bitibsə xətm qeydi: { id, src, start, end } və ya null */
export function planKhatm(plan) {
  if (!plan || !isDate(plan.start) || !(Number(plan.done) >= MUSHAF_PAGES)) return null
  const log = Array.isArray(plan.log) ? plan.log.filter(isDate).sort() : []
  const end = log[log.length - 1] || plan.start
  return { id: `plan:${plan.start}`, src: 'plan', start: plan.start, end: end < plan.start ? plan.start : end }
}

/** Mozaikanın xətmləri → [{ id, src, start, end }] */
export const lifeKhatms = (ks) => (Array.isArray(ks) ? ks : [])
  .filter(k => k && isDate(k.s) && isDate(k.e)).map((k, i) => ({ id: `life:${i + 1}:${k.e}`, src: 'life', start: k.s, end: k.e }))

/** Bütün aşkarlanmış xətmlər; certs-də olmayanlar — "pending" (şəhadətnamə təklif olunur) */
export function khatmEvents({ plan, ks, certs = [] } = {}) {
  const all = [...lifeKhatms(ks)]
  const p = planKhatm(plan)
  if (p) all.push(p)
  const have = new Set(certs.map(c => c.id))
  return {
    all: all.sort((a, b) => (a.end < b.end ? -1 : a.end > b.end ? 1 : 0)),
    pending: all.filter(k => !have.has(k.id)),
  }
}

/** Gün sayı (hər iki gün daxil): 2026-01-01 → 2026-01-30 = 30 */
export function durationDays(start, end) {
  if (!isDate(start) || !isDate(end)) return 0
  return Math.max(1, Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000) + 1)
}

/** Şəhadətnamənin məlumatı (formadan) — yoxlanmış; xəta: { error: 'name'|'dates' } */
export function certData({ name, start, end, ded, today }) {
  const nm = clean(name, NAME_MAX)
  if (!nm) return { error: 'name' }
  if (!isDate(start) || !isDate(end) || start > end || (today && end > today)) return { error: 'dates' }
  return { name: nm, start, end, ded: clean(ded, DED_MAX), days: durationDays(start, end) }
}

export function certFileName(name, end) {
  const slug = clean(name, NAME_MAX).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'khatm'
  return `muslims-cc-khatm-${slug}-${end || 'date'}.png`
}

// ── Kətan (A4 albom: 1600×1131) ──
const INK = '#1c2a33', GOLD = '#a77a22', GOLD2 = '#d9b45e', TEAL = '#174d4a', PAPER0 = '#fffdf7', PAPER1 = '#f1e6cc'

function star(ctx, x, y, r, inner = 0.42, points = 8, rot = -Math.PI / 2) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (Math.PI / points) * i, rr = i % 2 ? r * inner : r
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  ctx.closePath()
}

/** Girih üslubunda rozet: iki kvadrat (8 guşə) + daxili dairə */
function rosette(ctx, x, y, r) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = TEAL
  for (const rot of [0, Math.PI / 4]) { ctx.save(); ctx.rotate(rot); ctx.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4); ctx.restore() }
  ctx.fillStyle = GOLD2; star(ctx, 0, 0, r * 0.82, 0.55); ctx.fill()
  ctx.fillStyle = TEAL; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

/** Haşiyə zolağı: bir-birinə keçən səkkizguşəli ulduzlar və romblar */
function band(ctx, x0, y0, x1, y1, step) {
  const horiz = y0 === y1
  const len = horiz ? x1 - x0 : y1 - y0
  const n = Math.max(1, Math.round(len / step))
  const d = len / n
  for (let i = 0; i <= n; i++) {
    const x = horiz ? x0 + i * d : x0, y = horiz ? y0 : y0 + i * d
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6; star(ctx, x, y, step * 0.42, 0.62); ctx.stroke()
    ctx.fillStyle = GOLD2; star(ctx, x, y, step * 0.2, 0.5); ctx.fill()
    if (i < n) {
      const mx = horiz ? x + d / 2 : x, my = horiz ? y : y + d / 2
      ctx.fillStyle = TEAL
      ctx.beginPath(); ctx.moveTo(mx, my - step * 0.16); ctx.lineTo(mx + step * 0.16, my); ctx.lineTo(mx, my + step * 0.16); ctx.lineTo(mx - step * 0.16, my); ctx.closePath(); ctx.fill()
    }
  }
}

function wrap(ctx, text, maxW) {
  const words = String(text || '').split(/\s+/).filter(Boolean), lines = []
  let line = ''
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  return lines
}

/**
 * t: { title, intro, deed, period, duration, ded, basmala, brand } — hazır (tərcümə olunmuş) sətirlər
 * name — istifadəçinin adı; rtl — ərəb interfeysi
 */
export function drawKhatmCert(ctx, { W = 1600, H = 1131, name, t, rtl = false }) {
  // kağız
  const bg = ctx.createRadialGradient(W / 2, H * 0.45, 80, W / 2, H / 2, W * 0.78)
  bg.addColorStop(0, PAPER0); bg.addColorStop(1, PAPER1)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  // xarici tünd çərçivə + qızılı xətlər
  ctx.strokeStyle = TEAL; ctx.lineWidth = 14; ctx.strokeRect(26, 26, W - 52, H - 52)
  ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.strokeRect(46, 46, W - 92, H - 92)
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.strokeRect(96, 96, W - 192, H - 192)
  // ornament zolağı (46…96 arası)
  band(ctx, 120, 71, W - 120, 71, 46); band(ctx, 120, H - 71, W - 120, H - 71, 46)
  band(ctx, 71, 120, 71, H - 120, 46); band(ctx, W - 71, 120, W - 71, H - 120, 46)
  for (const [x, y] of [[71, 71], [W - 71, 71], [71, H - 71], [W - 71, H - 71]]) rosette(ctx, x, y, 34)

  const cx = W / 2
  const sans = 'system-ui, -apple-system, "Segoe UI", sans-serif'
  const serif = '"Amiri", "Noto Naskh Arabic", Georgia, serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  // Bəsmələ (saytdakı mətn)
  ctx.direction = 'rtl'; ctx.fillStyle = TEAL; ctx.font = `700 58px ${serif}`
  ctx.fillText(t.basmala, cx, 205)
  // başlıq + ayırıcı
  ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.fillStyle = GOLD; ctx.font = `700 30px ${sans}`
  ctx.fillText(String(t.title).toLocaleUpperCase(rtl ? 'ar' : undefined), cx, 268)
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(cx - 260, 292); ctx.lineTo(cx - 24, 292); ctx.moveTo(cx + 24, 292); ctx.lineTo(cx + 260, 292); ctx.stroke()
  ctx.fillStyle = GOLD; star(ctx, cx, 292, 13, 0.5); ctx.fill()
  // giriş sətri
  ctx.fillStyle = '#5b4a2a'; ctx.font = `500 34px ${sans}`
  ctx.fillText(t.intro, cx, 370)
  // ad (sığana qədər kiçilir)
  let size = 112
  ctx.font = `700 ${size}px ${serif}`
  while (size > 48 && ctx.measureText(name).width > W - 420) { size -= 4; ctx.font = `700 ${size}px ${serif}` }
  ctx.fillStyle = INK
  ctx.fillText(name, cx, 380 + 34 + size)
  const lineY = 380 + 64 + size
  ctx.strokeStyle = GOLD2; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(cx - 360, lineY); ctx.lineTo(cx + 360, lineY); ctx.stroke()
  // nailiyyət
  ctx.fillStyle = INK; ctx.font = `600 44px ${sans}`
  const dl = wrap(ctx, t.deed, W - 440)
  dl.forEach((l, i) => ctx.fillText(l, cx, lineY + 76 + i * 56))
  let y = lineY + 76 + dl.length * 56 + 22
  // dövr + müddət
  ctx.fillStyle = TEAL; ctx.font = `600 36px ${sans}`
  ctx.fillText(t.period, cx, y)
  ctx.fillStyle = '#5b4a2a'; ctx.font = `500 30px ${sans}`
  ctx.fillText(t.duration, cx, y + 48)
  y += 48
  // ithaf (istəyə bağlı)
  if (t.ded) {
    ctx.fillStyle = INK; ctx.font = `italic 500 32px ${sans}`
    wrap(ctx, `“${t.ded}”`, W - 520).slice(0, 2).forEach((l, i) => ctx.fillText(l, cx, y + 64 + i * 42))
  }
  // möhür (aşağıda ortada) + brend
  const sy = H - 176
  ctx.save(); ctx.globalAlpha = 0.9
  ctx.strokeStyle = TEAL; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(cx, sy, 46, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, sy, 38, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = GOLD; star(ctx, cx, sy, 30, 0.55); ctx.fill()
  ctx.fillStyle = TEAL; star(ctx, cx, sy, 14, 0.55, 8, -Math.PI / 2 + Math.PI / 8); ctx.fill()
  ctx.restore()
  ctx.direction = 'ltr'; ctx.fillStyle = GOLD; ctx.font = `700 26px ${sans}`
  ctx.fillText(t.brand || 'muslims.cc', cx, H - 112)
}
