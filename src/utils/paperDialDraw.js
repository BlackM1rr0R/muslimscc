// ═══════════════════════════════════════════════════════
// Kağız qiblə kompası və günəş saatı — A4 vərəqin kətanda çəkilməsi (components/PaperQiblaDial.jsx)
//
// Bütün ölçülər millimetrlədir (A4: 210 × 297 mm); k = piksel/mm. 300 dpi-də W = 2480 px.
// Ön baxış eyni funksiya ilə kiçik miqyasda çəkilir — çap faylı ilə eynidir.
// Yerləşmə: başlıq → üfüqi günəş saatının siferblatı → kompas kartı + qnomon (kəsmək üçün)
// → 5 addımlıq quraşdırma və qeydlər. Həndəsə: utils/paperDial.js.
// ═══════════════════════════════════════════════════════
import { hourLines, asrCurve, asrMarks, gnomonSize, rayToRect } from './paperDial'
import { wrapLines } from './quoteCard'

export const A4 = { w: 210, h: 297 }
export const DPI300 = { w: 2480, h: 3508 }
const RAD = Math.PI / 180
const AR_RE = /[؀-ۿ]/
const FONT = 'system-ui, "Segoe UI", "Noto Sans", "Noto Naskh Arabic", Arial, sans-serif'
const INK = '#1d2433'
const MUTED = '#5b6372'
const ACC = '#0f7a5c'
const ASR1 = '#c0571b'
const ASR2 = '#7a3fb0'

/**
 * @param ctx  2D kontekst (kətan W × H, A4 nisbəti)
 * @param o    { lat, lng, qibla, rtl, s: vərəq yazıları (komponentdən) }
 */
export function drawPaperDial(ctx, W, H, o) {
  const k = W / A4.w
  const { lat, qibla, s } = o
  const g = gnomonSize(lat)
  const font = (mm, w = 400) => { ctx.font = `${w} ${Math.round(mm * k * 10) / 10}px ${FONT}` }
  const line = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1 * k, y1 * k); ctx.lineTo(x2 * k, y2 * k); ctx.stroke() }
  // Ərəb hərfli yazı — rtl istiqamətində; qalanı (rəqəm, mm, dərəcə) — ltr
  const text = (str, x, y, align = 'center') => {
    try { ctx.direction = AR_RE.test(str) ? 'rtl' : 'ltr' } catch { /* köhnə brauzer */ }
    ctx.textAlign = align; ctx.fillText(str, x * k, y * k)
  }
  // ağ fonlu yazı (xətlərin üstündə oxunsun)
  const textBg = (str, x, y, align = 'center', pad = 0.6) => {
    const w = ctx.measureText(str).width / k, fs = parseFloat((ctx.font.match(/([\d.]+)px/) || [0, 10])[1]) / k
    const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2
    const keep = ctx.fillStyle
    ctx.fillStyle = '#fff'; ctx.fillRect((x0 - pad) * k, (y - fs * 0.85 - pad) * k, (w + 2 * pad) * k, (fs * 1.1 + 2 * pad) * k)
    ctx.fillStyle = keep; text(str, x, y, align)
  }
  const lw = (mm) => { ctx.lineWidth = Math.max(1, mm * k) }
  const dash = (on) => ctx.setLineDash(on ? [on * k, on * 0.7 * k] : [])

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, W, H)

  // ── Başlıq ──
  const M = 10
  const startX = o.rtl ? A4.w - M : M
  const sideAlign = o.rtl ? 'right' : 'left'
  ctx.fillStyle = INK
  font(5.6, 700); text(s.title, startX, 17, sideAlign)
  ctx.fillStyle = MUTED
  font(3, 400); text(s.meta, startX, 23, sideAlign)
  ctx.fillStyle = ACC
  font(3, 700); text('muslims.cc', o.rtl ? M : A4.w - M, 17, o.rtl ? 'left' : 'right')

  // ── 1) Siferblat ──
  const R = [M, 33, A4.w - M, 154] // [x0, y0, x1, y1]
  ctx.strokeStyle = INK; lw(0.35); dash(0)
  ctx.strokeRect(R[0] * k, R[1] * k, (R[2] - R[0]) * k, (R[3] - R[1]) * k)
  ctx.fillStyle = INK
  font(3.2, 700); text(s.dialTitle, startX, R[1] - 2.2, sideAlign)
  const Ox = A4.w / 2, Oy = 132
  const inner = [R[0] + 9, R[1] + 9, R[2] - 9, R[3] - 4]
  const labelBox = [R[0] + 4.5, R[1] + 8.5, R[2] - 4.5, R[3] - 2.5]
  const toSheet = (p) => [Ox + p.x, Oy - p.y]

  const placed = [] // saat yazıları bir-birinin üstünə düşməsin (ekvator yaxınlığı)
  for (const { h, angle, half } of [...hourLines(lat)].sort((a, b) => Math.abs(a.h - 12) - Math.abs(b.h - 12))) {
    const dx = Math.sin(angle * RAD), dy = -Math.cos(angle * RAD)
    const t = rayToRect(Ox, Oy, dx, dy, inner)
    if (!(t > 3)) continue
    ctx.strokeStyle = h === 12 ? ACC : INK
    lw(h === 12 ? 0.6 : half ? 0.18 : 0.32)
    const t0 = half ? Math.max(3, t - 7) : 3
    line(Ox + dx * t0, Oy + dy * t0, Ox + dx * t, Oy + dy * t)
    if (!half) {
      const tl = rayToRect(Ox, Oy, dx, dy, labelBox)
      const lx = Ox + dx * tl, lyy = Oy + dy * tl
      if (h !== 12 && placed.some(([px, py]) => Math.hypot(px - lx, py - lyy) < 5.5)) continue
      placed.push([lx, lyy])
      ctx.fillStyle = h === 12 ? ACC : INK
      font(h === 12 ? 4 : 3.2, 700)
      text(String(h), Ox + dx * tl, Oy + dy * tl + 1.2)
    }
  }
  // Günorta xəttinin adı və qütb
  ctx.fillStyle = ACC
  font(2.6, 700); textBg(`▲ ${s.pole}`, Ox + 2.4, R[1] + 14, 'left')
  ctx.save()
  ctx.translate((Ox + 2.2) * k, (Oy - 30) * k); ctx.rotate(-Math.PI / 2)
  font(2.3, 600); ctx.textAlign = 'left'; ctx.fillText(s.noon, 0, 0)
  ctx.restore()

  // Qnomonun yeri (O → F)
  ctx.strokeStyle = INK; lw(1); dash(1.6)
  line(Ox, Oy, Ox, Oy - g.b)
  dash(0)
  ctx.fillStyle = INK
  ctx.beginPath(); ctx.arc(Ox * k, Oy * k, 1 * k, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(Ox * k, (Oy - g.b) * k, 0.8 * k, 0, Math.PI * 2); ctx.fill()
  font(2.2, 400); ctx.fillStyle = MUTED
  textBg(s.glue, Ox, Oy + 5)
  textBg(`O · ∠${g.angle.toFixed(1)}°`, Ox, Oy + 8.4)

  // Əsr əyriləri (qnomon təpəsinin kölgəsi)
  const inside = ([x, y]) => x > inner[0] && x < inner[2] && y > inner[1] && y < R[3] - 2
  const curve = (pts, color, dashed) => {
    ctx.strokeStyle = color; lw(0.5); dash(dashed ? 1.4 : 0)
    ctx.beginPath()
    let pen = false
    for (const p of pts) {
      const q = toSheet(p)
      if (!inside(q)) { pen = false; continue }
      if (pen) ctx.lineTo(q[0] * k, q[1] * k); else ctx.moveTo(q[0] * k, q[1] * k)
      pen = true
    }
    ctx.stroke(); dash(0)
  }
  const legend = []
  for (const [kk, color, label] of [[1, ASR1, s.asr1], [2, ASR2, s.asr2]]) {
    curve(asrCurve(lat, kk, g, 48), color, kk === 2)
    let shown = 0
    for (const m of asrMarks(lat, kk, g)) {
      const q = toSheet(m)
      if (!inside(q)) continue
      shown++
      ctx.fillStyle = color
      ctx.beginPath(); ctx.arc(q[0] * k, q[1] * k, 0.9 * k, 0, Math.PI * 2); ctx.fill()
      font(2, 600)
      const out = q[0] >= Ox
      textBg(s.seasons[m.key], q[0] + (out ? 2 : -2), q[1] + 0.7, out ? 'left' : 'right', 0.4)
    }
    legend.push([color, label, kk === 2, shown])
  }
  // Legend (siferblatdan aşağıda, sağ sütunun yuxarısında)
  font(2.3, 600)
  let ly = 162
  for (const [color, label, dashed, shown] of legend) {
    const lx = 108
    ctx.strokeStyle = color; lw(0.6); dash(dashed ? 1.4 : 0)
    line(lx, ly - 0.8, lx + 6, ly - 0.8); dash(0)
    ctx.fillStyle = color
    text(shown ? label : `${label} — ${s.offPlate}`, lx + 7.5, ly, 'left')
    ly += 4
  }

  // ── 2) Kompas kartı ──
  const cx = 52, cy = 198, cr = 38
  ctx.strokeStyle = INK; lw(0.3); dash(1.2)
  ctx.beginPath(); ctx.arc(cx * k, cy * k, (cr + 3) * k, 0, Math.PI * 2); ctx.stroke(); dash(0)
  ctx.fillStyle = MUTED; font(2.2, 600); text(`✂ ${s.cut}`, cx - cr + 2, cy - cr - 0.5, 'left')
  lw(0.4); ctx.strokeStyle = INK
  ctx.beginPath(); ctx.arc(cx * k, cy * k, cr * k, 0, Math.PI * 2); ctx.stroke()
  for (let d = 0; d < 360; d += 5) {
    const a = d * RAD, long = d % 30 === 0, mid = d % 10 === 0
    const r2 = cr - (long ? 4.5 : mid ? 3 : 1.6)
    lw(long ? 0.35 : 0.18)
    line(cx + cr * Math.sin(a), cy - cr * Math.cos(a), cx + r2 * Math.sin(a), cy - r2 * Math.cos(a))
    if (long && d % 90 !== 0) {
      font(1.9, 400); ctx.fillStyle = MUTED
      text(String(d), cx + (cr - 7) * Math.sin(a), cy - (cr - 7) * Math.cos(a) + 0.7)
    }
  }
  // Ulduz (N/E/S/W)
  for (let i = 0; i < 4; i++) {
    const a = i * 90 * RAD, p = 17, w = 2.6
    ctx.fillStyle = i === 0 ? '#b3261e' : INK
    ctx.beginPath()
    ctx.moveTo((cx + p * Math.sin(a)) * k, (cy - p * Math.cos(a)) * k)
    ctx.lineTo((cx + w * Math.sin(a + Math.PI / 2)) * k, (cy - w * Math.cos(a + Math.PI / 2)) * k)
    ctx.lineTo((cx + w * Math.sin(a - Math.PI / 2)) * k, (cy - w * Math.cos(a - Math.PI / 2)) * k)
    ctx.closePath(); ctx.fill()
    font(4, 700)
    text(s.dirs[i], cx + (cr - 9.5) * Math.sin(a), cy - (cr - 9.5) * Math.cos(a) + 1.4)
  }
  // Qiblə xətti
  const qa = qibla * RAD
  ctx.strokeStyle = ACC; lw(0.9)
  line(cx, cy, cx + (cr - 1) * Math.sin(qa), cy - (cr - 1) * Math.cos(qa))
  lw(0.5)
  ctx.beginPath(); ctx.arc(cx * k, cy * k, 10 * k, -Math.PI / 2, qa - Math.PI / 2); ctx.stroke()
  // Kəbə nişanı (kiçik kub) qiblə xəttinin üstündə
  const kx = cx + 21 * Math.sin(qa), ky = cy - 21 * Math.cos(qa)
  ctx.fillStyle = '#111'; ctx.fillRect((kx - 1.8) * k, (ky - 1.8) * k, 3.6 * k, 3.6 * k)
  ctx.fillStyle = '#c9a227'; ctx.fillRect((kx - 1.8) * k, (ky - 1) * k, 3.6 * k, 0.5 * k)
  ctx.fillStyle = INK
  ctx.beginPath(); ctx.arc(cx * k, cy * k, 0.9 * k, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = ACC; font(3, 700)
  text(`${s.qibla} ${qibla.toFixed(1)}°`, cx, cy + cr + 7)
  ctx.fillStyle = MUTED; font(2.1, 600)
  text(s.trueNorth, cx, cy + cr + 10.5)

  // ── 3) Qnomon (kəsmək üçün) ──
  const gx0 = 112, baseY = 236
  const tab = 7
  // O solda, F sağda; dik tərəf F-də (qütbə tərəf)
  const O = [gx0, baseY], F = [gx0 + g.b, baseY], V = [gx0 + g.b, baseY - g.h]
  ctx.fillStyle = '#f3efe4'
  ctx.beginPath(); ctx.moveTo(O[0] * k, O[1] * k); ctx.lineTo(V[0] * k, V[1] * k); ctx.lineTo(F[0] * k, F[1] * k); ctx.closePath(); ctx.fill()
  // kəsmə konturu: üçbucaq + yapışdırma qanadı
  ctx.strokeStyle = INK; lw(0.45); dash(0)
  ctx.beginPath()
  ctx.moveTo(O[0] * k, O[1] * k); ctx.lineTo(V[0] * k, V[1] * k); ctx.lineTo(F[0] * k, F[1] * k)
  ctx.lineTo(F[0] * k, (F[1] + tab) * k); ctx.lineTo((O[0] + 2) * k, (O[1] + tab) * k); ctx.closePath()
  ctx.stroke()
  // qatlama xətti
  ctx.strokeStyle = ACC; lw(0.35); dash(1)
  line(O[0], O[1], F[0], F[1]); dash(0)
  ctx.fillStyle = ACC; font(2, 600)
  text(s.fold, (O[0] + F[0]) / 2, baseY + 4.6)
  // bucaq qövsü
  ctx.strokeStyle = ASR1; lw(0.35)
  ctx.beginPath(); ctx.arc(O[0] * k, O[1] * k, 7 * k, -Math.atan2(g.h, g.b), 0); ctx.stroke()
  ctx.fillStyle = ASR1; font(2.3, 700)
  text(`${g.angle.toFixed(1)}°`, O[0] + 9, O[1] - 1.3, 'left')
  ctx.fillStyle = INK; font(2.1, 700)
  text(s.gnomon, F[0] + 4, baseY - 9, 'left')
  font(2.1, 400)
  text(`${g.b.toFixed(0)} × ${g.h.toFixed(0)} mm`, F[0] + 4, baseY - 5.5, 'left')
  ctx.fillStyle = MUTED; font(2.1, 600)
  text(`✂ ${s.cut}`, F[0] + 4, baseY - 2, 'left')
  ctx.fillStyle = INK; font(2, 400)
  text('O', O[0] - 2.4, O[1] + 0.7)
  text(`V (${s.pole})`, V[0] + 1.2, V[1] + 0.6, 'left')
  // ölçü yoxlaması — 50 mm xətkeş
  const rx = 148, ry = 246.5
  ctx.strokeStyle = INK; lw(0.35)
  line(rx, ry, rx + 50, ry)
  for (let i = 0; i <= 50; i += 10) line(rx + i, ry - (i % 50 ? 1 : 2), rx + i, ry)
  font(1.9, 400); ctx.fillStyle = MUTED
  text(s.scale, rx + 25, ry + 3.2)

  // ── 4) Quraşdırma və qeydlər ──
  const tx0 = M, tW = A4.w - 2 * M, ty0 = 253, tMax = A4.h - 6
  const paras = [
    ...s.steps.map((st, i) => `${i + 1}. ${st}`),
    s.northNote, s.eotNote, s.warn, s.corr,
  ].filter(Boolean)
  let fs = 2.55
  let lines
  for (;;) {
    font(fs, 400)
    lines = paras.map(p => wrapLines(ctx, p, tW * k))
    const total = lines.reduce((a, l) => a + l.length, 0) * fs * 1.32 + (paras.length - 1) * fs * 0.35
    if (ty0 + total <= tMax || fs < 1.7) break
    fs -= 0.1
  }
  let y = ty0 + fs
  const x = o.rtl ? tx0 + tW : tx0
  lines.forEach((ls, i) => {
    const isCorr = i === paras.length - 1
    ctx.fillStyle = isCorr ? ACC : (i >= s.steps.length ? MUTED : INK)
    font(fs, isCorr ? 700 : 400)
    for (const l of ls) { text(l, x, y, o.rtl ? 'right' : 'left'); y += fs * 1.32 }
    y += fs * 0.35
  })
}
