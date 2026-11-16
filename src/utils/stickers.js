// ═══════════════════════════════════════════════════════
// Stikerlər (components/StickerPack) — 512×512, şəffaf fon (WhatsApp/Telegram ölçüsü).
// Forma: səkkizguşəli ulduz və ya tağ, ağ "kəsik" haşiyə, ərəb xətti ilə ifadə,
// altda saytın dilində lent. Şəkil faylı yoxdur — hamısı kətanda.
// ═══════════════════════════════════════════════════════
export const STICKER_SIZE = 512

export const PHRASES = [
  { id: 'jumua', ar: 'جمعة مباركة', shape: 'star', az: 'Cümə mübarək', en: 'Jumu‘a Mubarak', ru: 'Благословенной пятницы', tr: 'Hayırlı Cumalar', arT: 'جمعة مباركة' },
  { id: 'eid', ar: 'عيد مبارك', shape: 'star', az: 'Bayramınız mübarək', en: 'Eid Mubarak', ru: 'С праздником!', tr: 'Bayramınız mübarek', arT: 'عيدكم مبارك' },
  { id: 'taqabbal', ar: 'تقبل الله منا ومنكم', shape: 'arch', az: 'Allah qəbul etsin', en: 'May Allah accept from us and you', ru: 'Да примет Аллах от нас и от вас', tr: 'Allah kabul etsin', arT: 'تقبل الله منا ومنكم' },
  { id: 'ramadan', ar: 'رمضان مبارك', shape: 'arch', az: 'Ramazanınız mübarək', en: 'Ramadan Mubarak', ru: 'Благословенного Рамадана', tr: 'Hayırlı Ramazanlar', arT: 'رمضان مبارك' },
  { id: 'salam', ar: 'السلام عليكم', shape: 'star', az: 'Salamün əleyküm', en: 'Peace be upon you', ru: 'Мир вам', tr: 'Selamün aleyküm', arT: 'السلام عليكم' },
  { id: 'jazak', ar: 'جزاك الله خيرا', shape: 'arch', az: 'Allah razı olsun', en: 'May Allah reward you', ru: 'Да вознаградит тебя Аллах', tr: 'Allah razı olsun', arT: 'جزاك الله خيرًا' }, // lang-ok: tr və az ifadəsi eynidir
  { id: 'mashallah', ar: 'ما شاء الله', shape: 'star', az: 'Maşallah', en: 'Masha’Allah', ru: 'Машаллах', tr: 'Maşallah', arT: 'ما شاء الله' },
  { id: 'alhamdulillah', ar: 'الحمد لله', shape: 'star', az: 'Əlhəmdulillah', en: 'Alhamdulillah', ru: 'Альхамдулиллях', tr: 'Elhamdülillah', arT: 'الحمد لله' },
  { id: 'inshallah', ar: 'إن شاء الله', shape: 'arch', az: 'İnşallah', en: 'In sha’ Allah', ru: 'Иншаллах', tr: 'İnşallah', arT: 'إن شاء الله' },
  { id: 'barak', ar: 'بارك الله فيك', shape: 'arch', az: 'Allah bərəkət versin', en: 'May Allah bless you', ru: 'Да благословит тебя Аллах', tr: 'Allah mübarek etsin', arT: 'بارك الله فيك' },
]

export const PALETTES = {
  emerald: { bg: '#0f4c3a', bg2: '#1b6b52', ink: '#f6dc8c', ribbon: '#c9962e', ribbonInk: '#1b1306' },
  lapis: { bg: '#163a6e', bg2: '#245597', ink: '#ffffff', ribbon: '#e2b04a', ribbonInk: '#14223a' },
  rose: { bg: '#8a2c45', bg2: '#b34561', ink: '#fff2d6', ribbon: '#f3d9a4', ribbonInk: '#4a1424' },
}

export const SCRIPTS = {
  ruqaa: { family: "'Aref Ruqaa', 'Amiri', serif", weight: 400 },
  kufi: { family: "'Reem Kufi', 'Amiri', sans-serif", weight: 500 },
  naskh: { family: "'Amiri', serif", weight: 700 },
}

function starPath(ctx, cx, cy, r, inner = 0.8) {
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2 + Math.PI / 16, rr = i % 2 ? r * inner : r
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
  }
  ctx.closePath()
}
function archPath(ctx, x, y, w, h) {
  // sivri (Osmanlı/fars) tağ: iki qövs zirvədə görüşür, altda düz
  const top = y, base = y + h, mid = x + w / 2
  const shoulder = top + h * 0.42
  ctx.beginPath()
  ctx.moveTo(x, base)
  ctx.lineTo(x, shoulder)
  ctx.quadraticCurveTo(x, top + h * 0.12, mid, top)
  ctx.quadraticCurveTo(x + w, top + h * 0.12, x + w, shoulder)
  ctx.lineTo(x + w, base - 28)
  ctx.quadraticCurveTo(x + w, base, x + w - 28, base)
  ctx.lineTo(x + 28, base)
  ctx.quadraticCurveTo(x, base, x, base - 28)
  ctx.closePath()
}

/** Mətni verilmiş qutuya sığdıran şrift ölçüsü (px) */
export function fitFont(measureAt, text, maxW, maxH, start = 180, min = 28) {
  let s = start
  while (s > min && (measureAt(s, text) > maxW || s * 1.05 > maxH)) s -= 4
  return s
}

/** Bir stikeri çək. phrase — PHRASES elementi, label — saytın dilində lent mətni (boş — lentsiz). */
export function drawSticker(ctx, { phrase, label = '', palette = 'emerald', script = 'ruqaa', S = STICKER_SIZE }) {
  const P = PALETTES[palette] || PALETTES.emerald
  const F = SCRIPTS[script] || SCRIPTS.ruqaa
  const k = S / 512
  ctx.clearRect(0, 0, S, S)
  ctx.save()
  ctx.scale(k, k)
  const shape = () => (phrase.shape === 'arch' ? archPath(ctx, 70, 30, 372, 420) : starPath(ctx, 256, 236, 222, 0.82))
  // ağ "kəsik" haşiyə + kölgə
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5
  shape(); ctx.lineJoin = 'round'; ctx.lineWidth = 30; ctx.strokeStyle = '#fff'; ctx.stroke()
  ctx.restore()
  shape(); ctx.lineWidth = 30; ctx.strokeStyle = '#fff'; ctx.stroke()
  // fon
  const g = ctx.createLinearGradient(0, 30, 0, 460)
  g.addColorStop(0, P.bg2); g.addColorStop(1, P.bg)
  shape(); ctx.fillStyle = g; ctx.fill()
  // incə daxili xətt
  ctx.save(); shape(); ctx.clip()
  ctx.strokeStyle = P.ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 3
  if (phrase.shape === 'arch') archPath(ctx, 92, 54, 328, 380); else starPath(ctx, 256, 236, 196, 0.82)
  ctx.stroke(); ctx.restore()
  // ərəb mətni
  const words = phrase.ar.split(' ')
  const lines = words.length >= 3 && phrase.ar.length > 12 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [phrase.ar]
  const boxW = phrase.shape === 'arch' ? 300 : 290
  const boxH = (label ? 230 : 280) / lines.length
  const measureAt = (s, t) => { ctx.font = `${F.weight} ${s}px ${F.family}`; return ctx.measureText(t).width }
  const fs = Math.min(...lines.map((l) => fitFont(measureAt, l, boxW, boxH)))
  ctx.font = `${F.weight} ${fs}px ${F.family}`
  ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = P.ink
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2
  const cy = label ? 210 : 236, lh = fs * 1.12
  lines.forEach((l, i) => ctx.fillText(l, 256, cy + (i - (lines.length - 1) / 2) * lh))
  ctx.shadowColor = 'transparent'
  // lent
  if (label) {
    ctx.direction = 'ltr'
    let ls = 40
    const sans = 'system-ui, -apple-system, "Segoe UI", sans-serif'
    const lw = () => { ctx.font = `800 ${ls}px ${sans}`; return ctx.measureText(label).width }
    while (ls > 20 && lw() > 380) ls -= 2
    const w = Math.min(440, lw() + 56), h = ls + 30, x = 256 - w / 2, y = 392
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, h / 2) : ctx.rect(x, y, w, h)
    ctx.lineWidth = 10; ctx.strokeStyle = '#fff'; ctx.stroke()
    ctx.fillStyle = P.ribbon; ctx.fill()
    ctx.fillStyle = P.ribbonInk; ctx.textBaseline = 'middle'
    ctx.fillText(label, 256, y + h / 2 + 1)
  }
  ctx.restore()
}
