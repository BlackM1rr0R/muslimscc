#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// Instagram REEL renderi — günün ayəsi, 1080×1920, 30 fps, H.264 + AAC (docs/INSTAGRAM.md → "Reels")
//
//   node scripts/ig-reel/render.mjs [--date YYYY-MM-DD] [--out reel.mp4] [--meta reel.json] [--frames <qovluq>]
//                                   [--audio alafasy|none] [--theme day|night] [--ref 33:3] [--ffmpeg <yol>]
//
// • Serverdə İŞLƏMİR (1 GB server) — GitHub Actions (.github/workflows/ig-reel.yml) hər gün çəkir, ci-gate.sh "ig-reel"
//   ilə api həcminə yazır, server/instagram.js IG_REEL_TIME-da dərc edir. Asılılıqlar: server/node_modules (sharp), ffmpeg.
// • Kartın görünüşü (server/instagramCard.js): eyni fon, xatəm ornamenti, Amiri Quran / MccInter şriftləri, ölçülər,
//   pango ilə eyni sətir bölgüsü. Ərəbcə mətn kartdakı kimi BÜTÖV paraqraf kimi çəkilir; animasiya üçün eyni paraqraf
//   "yalnız bu söz / sətir görünür" (qalan sözlər şəffaf — fgalpha) rejimində təkrar çəkilir → mövqelər piksel-piksel eynidir.
// • Mətn alquran.cloud-dan (server ilə eyni nəşrlər — daily-ayah.js), DƏYİŞDİRİLMİR. Yeganə görüntü normallaşdırması kartdakı
//   kimidir (dayanma işarəsi sözə bitişik — displayArabic). Səs: saytın Quran səsi (Alafasy 128 kbps, cdn.islamic.network,
//   ehtiyat: verses.quran.com) — instagramReel.audioUrls.
// • Seçim: instagramReel.reelRef (08:00 ayə yuvası ilə eyni düstur); tilavət uzundursa (video > 45 s) və ya mətn sığmırsa
//   sıradakı ayə. Zaman cədvəli: instagramReel.reelTimeline.
// • İlk kadr (hook): başlıq ("GÜNÜN AYƏSİ"), istinad ("Əhzab 33:3") və muslims.cc t=0-dan tam görünür, ərəbcə mətn zəif iz
//   kimi (HOOK_GHOST) — mürəkkəb onun üstündən yazır. Üz qabığı (server: thumb_offset) — son saniyə, bütün mətn görünür.
// ═══════════════════════════════════════════════════════════════════════
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const card = require(path.join(ROOT, 'server/instagramCard.js'))
const REEL = require(path.join(ROOT, 'server/instagramReel.js'))
const dailyAyah = require(path.join(ROOT, 'server/daily-ayah.js'))

export const W = 1080
export const H = 1920
const FPS = 30
// Reels-də aşağıda ~20 % caption / hesab adı, sağda düymələr var — mətn oradan uzaq (kart story-sindən geniş kənarlar)
const FRAME = { top: 270, bottom: 400, padX: 130, ar: 72, arMin: 44, tr: 44, trMin: 32 }
const SCALES = [1.12, 1, 0.92, 0.85, 0.78, 0.72, 0.66, 0.6]
const SEP = 96
const MAX_TRIES = 12
const SAMPLE_RATE = 48000
const HOOK_GHOST = 0.16          // 1-ci kadrda ərəbcə mətnin "izi" (şəffaflıq)

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3)
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))

// ── Mətn qatları (sharp/pango — kartla eyni parametrlər) ──
/**
 * words — sözlər; visible(i) — i-ci söz görünürmü (qalanları şəffaf, amma yer tutur). → { data (RGBA raw), w, h }
 */
async function paragraph({ words, font, size, color, width, spacing = 0, letter = 0, visible = () => true }) {
  const sharp = card.loadSharp()
  const f = card.FONT[font]
  const arabic = font === 'ar' || font === 'arBold' || font === 'quran'
  const body = words.map((w, i) => (visible(i) ? card._esc(w) : `<span fgalpha="1">${card._esc(w)}</span>`)).join(' ')
  const attrs = `foreground="${color}"${arabic ? ' lang="ar"' : ''}${letter ? ` letter_spacing="${Math.round(letter * 1024)}"` : ''}`
  const { data, info } = await sharp({
    text: {
      text: `<span ${attrs}>${body}</span>`, font: `${f.family} ${size}`, fontfile: path.join(ROOT, 'server/fonts', f.file),
      width, align: 'centre', rgba: true, wrap: 'word', dpi: 72, ...(spacing ? { spacing: Math.round(spacing) } : {}),
    },
  }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}
const line = (text, o) => paragraph({ ...o, words: [text] })

/** Qatdakı mürəkkəbin sərhədləri (alfa > 0). */
function bbox(l) {
  let x0 = l.w, y0 = l.h, x1 = -1, y1 = -1
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      if (l.data[(y * l.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 }
}

async function rawSvg(svg, alpha) {
  const sharp = card.loadSharp()
  let p = sharp(Buffer.from(svg))
  p = alpha ? p.ensureAlpha() : p.flatten({ background: '#000000' }).removeAlpha()
  const { data, info } = await p.raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

// ── Kadr qurulması (rgb24) ──
/** layer (RGBA) → frame (RGB), (ox, oy) mövqedə; op — ümumi şəffaflıq; colAlpha(x) — sütun üzrə əmsal; tint(x) — rəng. */
function blend(frame, l, ox, oy, { op = 1, box = null, colAlpha = null, tint = null } = {}) {
  if (op <= 0) return
  const b = box || { x0: 0, y0: 0, x1: l.w - 1, y1: l.h - 1 }
  for (let y = b.y0; y <= b.y1; y++) {
    const fy = oy + y
    if (fy < 0 || fy >= H) continue
    for (let x = b.x0; x <= b.x1; x++) {
      const i = (y * l.w + x) * 4
      let a = l.data[i + 3]
      if (!a) continue
      const fx = ox + x
      if (fx < 0 || fx >= W) continue
      let k = (a / 255) * op
      if (colAlpha) { k *= colAlpha(x); if (k <= 0) continue }
      const j = (fy * W + fx) * 3
      const c = tint ? tint(x) : null
      frame[j] = frame[j] + ((c ? c[0] : l.data[i]) - frame[j]) * k
      frame[j + 1] = frame[j + 1] + ((c ? c[1] : l.data[i + 1]) - frame[j + 1]) * k
      frame[j + 2] = frame[j + 2] + ((c ? c[2] : l.data[i + 2]) - frame[j + 2]) * k
    }
  }
}
/** Qələmin ucunda yumşaq qızılı işıq (additiv). */
function glow(frame, cx, cy, r, color, op) {
  if (op <= 0.01) return
  const s2 = 2 * (r / 3) * (r / 3)                         // σ = r/3 — qutunun kənarında işıq ~0-dır (kvadrat görünmür)
  for (let y = Math.max(0, Math.round(cy - r)); y <= Math.min(H - 1, Math.round(cy + r)); y++) {
    for (let x = Math.max(0, Math.round(cx - r)); x <= Math.min(W - 1, Math.round(cx + r)); x++) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2
      const k = Math.exp(-d2 / s2) * op
      if (k < 0.004) continue
      const j = (y * W + x) * 3
      frame[j] = Math.min(255, frame[j] + color[0] * k)
      frame[j + 1] = Math.min(255, frame[j + 1] + color[1] * k)
      frame[j + 2] = Math.min(255, frame[j + 2] + color[2] * k)
    }
  }
}

// ── Səhnə: kart düzülüşü + animasiya üçün qatlar ──
/**
 * content: { title, ar, text, ref } (saytın mətni), reciter: footer sətri (və ya null — səssiz).
 * → səhnə | null (oxunaqlı ölçüdə sığmır / ərəb mətni şriftdə düzgün çəkilmir)
 */
export async function buildScene(content, { theme = 'day', reciter = null } = {}) {
  const t = card.THEMES[theme] || card.THEMES.day
  const ar = card.displayArabic(content.ar)
  const text = card._clean(content.text)
  if (!ar || !text || card.arabicIssues(ar, 'quran').length) return null
  const width = W - 2 * FRAME.padX
  const title = await line(card._clean(content.title).toLocaleUpperCase('tr'), { font: 'uiSemi', size: 28, color: t.gold, width, letter: 4 })
  const ref = await line(card._clean(content.ref), { font: 'uiSemi', size: 30, color: t.gold, width })
  const rec = reciter ? await line(reciter, { font: 'ui', size: 26, color: t.soft, width }) : null
  const mark = await line('muslims.cc', { font: 'uiSemi', size: 34, color: t.gold, width, letter: 3 })

  const titleY = FRAME.top + 44 + 40 + 30
  const markY = H - FRAME.bottom - mark.h
  const footY = markY - 26
  const recY = rec ? footY - 30 - rec.h : footY
  const refY = (rec ? recY - 14 : footY - 34) - ref.h
  const areaTop = titleY + title.h + 48
  const areaBottom = refY - 44
  const avail = areaBottom - areaTop

  const arWords = ar.split(' ').filter(Boolean)
  const trWords = text.split(' ').filter(Boolean)
  const fit = async (s) => {
    const arSize = Math.round(FRAME.ar * s)
    if (arSize < FRAME.arMin) return null
    const trSize = Math.max(Math.round(FRAME.tr * Math.min(s, 1)), FRAME.trMin)
    const arL = await paragraph({ words: arWords, font: 'quran', size: arSize, color: '#ffffff', width })
    const trL = await paragraph({ words: trWords, font: 'ui', size: trSize, color: t.text, width, spacing: trSize * 0.3 })
    const total = arL.h + SEP + trL.h
    return total <= avail && arL.w <= width + 2 && trL.w <= width + 2 ? { arSize, trSize, arL, trL, total } : false
  }
  let pick = null
  for (let i = 0; i < SCALES.length && !pick; i++) {
    const r = await fit(SCALES[i])
    if (r === null) break
    if (!r) continue
    pick = r
    // Böyük ölçüdə ərəbcə bir sətir artıq bölünürsə (məs. son sətirdə tək söz) və bir pillə kiçik ölçü onu azaldırsa — kiçik
    if (SCALES[i] >= 1 && SCALES[i + 1]) {
      const n = await fit(SCALES[i + 1])
      if (n && n.arL.h < r.arL.h * 0.75) pick = n
    }
  }
  if (!pick) return null

  const y0 = areaTop + Math.max(0, Math.floor((avail - pick.total) / 2))
  const arPos = { x: Math.round((W - pick.arL.w) / 2), y: y0 }
  const sepY = Math.round(y0 + pick.arL.h + SEP / 2)
  const trPos = { x: Math.round((W - pick.trL.w) / 2), y: y0 + pick.arL.h + SEP }

  // Ərəbcə: hər söz ayrıca (eyni paraqraf, qalanları şəffaf) → sətirlərə qruplaşdır (söz mərkəzinin hündürlüyü)
  const wordBoxes = []
  for (let i = 0; i < arWords.length; i++) {
    const l = await paragraph({ words: arWords, font: 'quran', size: pick.arSize, color: '#ffffff', width, visible: (k) => k === i })
    const b = bbox(l)
    if (b) wordBoxes.push({ i, cy: (b.y0 + b.y1) / 2 })
  }
  wordBoxes.sort((a, b) => a.cy - b.cy)
  const groups = []
  for (const wb of wordBoxes) {
    const g = groups[groups.length - 1]
    if (g && wb.cy - g.cy0 < pick.arSize * 0.9) g.idx.add(wb.i)
    else groups.push({ cy0: wb.cy, idx: new Set([wb.i]) })
  }
  const arLines = []
  for (const g of groups) {
    const l = await paragraph({ words: arWords, font: 'quran', size: pick.arSize, color: '#ffffff', width, visible: (k) => g.idx.has(k) })
    const b = bbox(l)
    if (b) arLines.push({ layer: l, box: b })
  }
  // Tərcümə: hər söz ayrıca qat (eyni paraqraf) — söz-söz görünür
  const trLayers = []
  for (let i = 0; i < trWords.length; i++) {
    const l = await paragraph({ words: trWords, font: 'ui', size: pick.trSize, color: t.text, width, spacing: pick.trSize * 0.3, visible: (k) => k === i })
    const b = bbox(l)
    if (b) trLayers.push({ layer: l, box: b })
  }

  const bg = await rawSvg(card._background('story', theme, { sepY: null, footY }).toString(), false)
  const sepSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="40" viewBox="0 0 ${W} 40">` +
    `<line x1="${W / 2 - 150}" y1="20" x2="${W / 2 - 28}" y2="20" stroke="${t.gold}" stroke-opacity="0.55" stroke-width="2"/>` +
    `<line x1="${W / 2 + 28}" y1="20" x2="${W / 2 + 150}" y2="20" stroke="${t.gold}" stroke-opacity="0.55" stroke-width="2"/>` +
    card._khatam(W / 2, 20, 13, { stroke: t.gold, width: 2, opacity: 0.85 }) + '</svg>'
  const sep = await rawSvg(sepSvg, true)
  const center = (l, y) => ({ l, x: Math.round((W - l.w) / 2), y: Math.round(y) })
  return {
    theme: t, bg, arSize: pick.arSize, trSize: pick.trSize, arPos, trPos, arLines, trLayers, arFull: { layer: pick.arL, box: bbox(pick.arL) },
    sep: { l: sep, x: 0, y: sepY - 20 },
    title: center(title, titleY), ref: center(ref, refY), rec: rec ? center(rec, recY) : null, mark: center(mark, markY),
    lines: arLines.length, words: trLayers.length,
  }
}

/** Zaman cədvəlinə görə t saniyəsindəki kadr (rgb24 Buffer). */
export function renderFrame(scene, tl, t) {
  const f = Buffer.from(scene.bg.data)
  const T = scene.theme
  const gold = hex(T.gold), arC = hex(T.ar), fresh = [255, 236, 186]
  const fade = (start, dur = 0.6) => easeOut((t - start) / dur)
  const put = (o, op) => blend(f, o.l, o.x, o.y, { op })

  // 1-ci kadr (Instagram güclü ilk kadrı üstün tutur; üz qabığı seçilməsə də boş görünməsin): başlıq + istinad ("GÜNÜN AYƏSİ"
  // · "Əhzab 33:3") və muslims.cc t=0-dan tam görünür, ərəbcə mətn isə zəif "iz" kimi (HOOK_GHOST) — mürəkkəb onun üstündən yazır.
  put(scene.title, 1)
  put(scene.mark, 1)
  put(scene.ref, 1)
  if (scene.arFull && scene.arFull.box) blend(f, scene.arFull.layer, scene.arPos.x, scene.arPos.y, { op: HOOK_GHOST, box: scene.arFull.box, tint: () => arC })

  // Ərəbcə: sətir-sətir, sağdan sola "mürəkkəblə yazılır" (yumşaq kənar + qələmin ucunda işıq + təzə mürəkkəb qızılıdır)
  const F = Math.round(scene.arSize * 1.1)
  const weights = scene.arLines.map((ln) => ln.box.x1 - ln.box.x0 + F)
  const sum = weights.reduce((a, b) => a + b, 0)
  let acc = tl.inkStart
  for (let i = 0; i < scene.arLines.length; i++) {
    const ln = scene.arLines[i]
    const dur = ((tl.inkEnd - tl.inkStart) * weights[i]) / sum
    const s = acc
    acc += dur
    if (t < s) continue
    const startX = ln.box.x1 + F, endX = ln.box.x0
    const v = (startX - endX) / dur
    const fx = startX - (t - s) * v           // sona çatandan sonra da hərəkət edir — rəng tam "qurusun"
    blend(f, ln.layer, scene.arPos.x, scene.arPos.y, {
      box: ln.box,
      colAlpha: (x) => clamp((x - (fx - F)) / F, 0, 1),
      tint: (x) => {
        const m = clamp((x - fx) / (F * 2.5), 0, 1)
        return [fresh[0] + (arC[0] - fresh[0]) * m, fresh[1] + (arC[1] - fresh[1]) * m, fresh[2] + (arC[2] - fresh[2]) * m]
      },
    })
    if (t <= acc) {
      const env = Math.min(1, (t - s) / 0.3, (acc - t) / 0.3 + 0.15)
      glow(f, scene.arPos.x + clamp(fx - F * 0.5, endX, ln.box.x1), scene.arPos.y + (ln.box.y0 + ln.box.y1) / 2, scene.arSize * 0.75, gold, 0.22 * env)
    }
  }

  // Ayırıcı + tərcümə söz-söz (yuxarıdan yumşaq enir)
  put(scene.sep, fade(tl.trStart - 0.3, 0.8))
  for (let i = 0; i < scene.trLayers.length; i++) {
    const w = scene.trLayers[i]
    const p = easeOut((t - (tl.trStart + i * tl.wordGap)) / 0.5)
    if (p <= 0) continue
    blend(f, w.layer, scene.trPos.x, scene.trPos.y - Math.round((1 - p) * 10), { op: p, box: w.box })
  }

  if (scene.rec) put(scene.rec, fade(tl.footStart + 0.25, 0.6))
  return f
}

// ── Səs ──
function run(bin, args, { input = null } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    const out = [], err = []
    p.stdout.on('data', (d) => out.push(d))
    p.stderr.on('data', (d) => err.push(d))
    p.on('error', reject)
    p.on('close', (code) => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`${path.basename(bin)} ${code}: ${Buffer.concat(err).toString().slice(-600)}`))))
    if (input) p.stdin.end(input); else p.stdin.end()
  })
}

async function fetchBuf(url, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'muslimscc-reel-render' } })
      if (r.ok) return Buffer.from(await r.arrayBuffer())
      if (r.status === 404 || r.status === 403) return null
    } catch { /* təkrar */ }
    await new Promise((res) => setTimeout(res, 1500))
  }
  return null
}
const looksMp3 = (b) => b && b.length > 2000 && (b.toString('latin1', 0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0))

/** Ayə(lər)in tilavəti → PCM s16le 48 kHz stereo (aralıq: ayələr arasında 0.3 s sükut). */
export async function recitationPcm(pick, ffmpeg) {
  const parts = []
  for (let a = pick.a; a <= pick.to; a++) {
    let mp3 = null
    for (const u of REEL.audioUrls(pick.s, a)) { mp3 = await fetchBuf(u); if (looksMp3(mp3)) break; mp3 = null }
    if (!mp3) throw new Error(`səs faylı tapılmadı: ${pick.s}:${a}`)
    parts.push(await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-f', 's16le', '-ac', '2', '-ar', String(SAMPLE_RATE), 'pipe:1'], { input: mp3 }))
    if (a < pick.to) parts.push(Buffer.alloc(Math.round(0.3 * SAMPLE_RATE) * 4))
  }
  return Buffer.concat(parts)
}

function wav(pcm) {
  const h = Buffer.alloc(44)
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12)
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SAMPLE_RATE, 24)
  h.writeUInt32LE(SAMPLE_RATE * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([h, pcm])
}

// ── Kodlaşdırma ──
/**
 * scene + tl → MP4 (H.264 High yuv420p bt709, qapalı GOP, AAC 128k 48 kHz stereo, faststart, edit list yoxdur).
 * pcm — tilavət (null: səssiz trek). frames: [{ t, file }] — PNG kadrlar (baxış üçün).
 */
export async function encode({ scene, tl, pcm, out, ffmpeg = 'ffmpeg', fps = FPS, frames = [], crf = 19 }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-reel-'))
  try {
    const n = Math.round(tl.duration * fps)
    const total = n / fps
    let audioIn
    if (pcm) {
      const lead = Buffer.alloc(Math.round(tl.audioStart * SAMPLE_RATE) * 4)
      const body = Buffer.concat([lead, pcm])
      const need = Math.round(total * SAMPLE_RATE) * 4
      const full = body.length >= need ? body.subarray(0, need) : Buffer.concat([body, Buffer.alloc(need - body.length)])
      fs.writeFileSync(path.join(tmp, 'a.wav'), wav(full))
      audioIn = ['-i', path.join(tmp, 'a.wav')]
    } else audioIn = ['-f', 'lavfi', '-t', total.toFixed(3), '-i', `anullsrc=r=${SAMPLE_RATE}:cl=stereo`]
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
    const args = [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-framerate', String(fps), '-i', 'pipe:0',
      ...audioIn,
      '-map', '0:v:0', '-map', '1:a:0',
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-profile:v', 'high', '-level:v', '4.2',
      '-g', String(fps * 2), '-keyint_min', String(fps), '-sc_threshold', '0', '-flags', '+cgop', '-x264-params', 'aq-mode=3',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
      '-c:a', 'aac', '-b:a', '128k', '-ar', String(SAMPLE_RATE), '-ac', '2',
      '-t', total.toFixed(3), '-movflags', '+faststart', '-use_editlist', '0',
      path.resolve(out),
    ]
    const p = spawn(ffmpeg, args, { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true })
    const err = []
    p.stderr.on('data', (d) => err.push(d))
    const closed = new Promise((resolve) => p.on('close', resolve))
    let failed = null
    p.on('error', (e) => { failed = e })
    p.stdin.on('error', (e) => { failed = failed || e })
    const want = new Map(frames.map((fr) => [Math.min(n - 1, Math.max(0, Math.round(fr.t * fps))), fr.file]))
    for (let i = 0; i < n && !failed; i++) {
      const buf = renderFrame(scene, tl, i / fps)
      if (want.has(i)) {
        await card.loadSharp()(buf, { raw: { width: W, height: H, channels: 3 } }).png().toFile(want.get(i))
      }
      if (!p.stdin.write(buf)) await Promise.race([once(p.stdin, 'drain'), closed])
    }
    p.stdin.end()
    const code = await closed
    if (failed || code !== 0) throw new Error(`ffmpeg: ${failed ? failed.message : code} ${Buffer.concat(err).toString().slice(-800)}`)
    return { frames: n, seconds: total, size: fs.statSync(out).size }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }) }
}

// ── Günün reel-i ──
export function bakuDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

async function ayahData(pick) {
  const parts = []
  for (let a = pick.a; a <= pick.to; a++) {
    const b = await fetchBuf(dailyAyah.ayahApiUrl(pick.s, a), 3)
    let j = null
    try { j = b ? JSON.parse(b.toString('utf8')) : null } catch { j = null }
    parts.push(j ? dailyAyah.parseAyahResponse(j, pick.s, a) : null)
  }
  return dailyAyah.mergeAyahParts(parts)
}

/** server/instagram.js → ayahContent ilə eyni başlıq / istinad (az). */
function contentFor(pick, data, lang = 'az') {
  const num = `${pick.s}:${pick.a}${pick.to && pick.to !== pick.a ? `-${pick.to}` : ''}`
  return { kind: 'ayah', title: dailyAyah.TITLE_PREFIX[lang], ar: data.texts.ar, text: data.texts[lang], ref: `${dailyAyah.surahLabel(lang, pick.s, data.names)} ${num}` }
}

/**
 * Günün reel-ini çək. → { ref, k, audio, duration, size, out }
 * opts: { date, out, audio: 'alafasy'|'none', theme, ref (məcburi ayə — sınaq), ffmpeg, framesDir, log }
 */
export async function renderDay(opts = {}) {
  const { date = bakuDate(), out, audio = 'alafasy', theme = 'day', ffmpeg = 'ffmpeg', framesDir = null, log = console } = opts
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('tarix YYYY-MM-DD olmalıdır')
  if (!REEL.AUDIO_MODES.includes(audio)) throw new Error('audio: alafasy | none')
  if (opts.ref && !dailyAyah.AYAH_REFS.includes(opts.ref)) throw new Error('ref siyahıda yoxdur (daily-ayah.js AYAH_REFS)')
  const reciter = audio === 'alafasy' ? `${REEL.RECITATION.az}: ${REEL.RECITER.name.az}` : null
  for (let k = 0; k < (opts.ref ? 1 : MAX_TRIES); k++) {
    const ref = opts.ref || REEL.reelRef(date, k)
    const pick = { ...dailyAyah.parseRef(ref), ref }
    const data = await ayahData(pick)
    if (!data) throw new Error(`ayə mənbəyi əlçatmazdır: ${ref}`)
    const content = contentFor(pick, data)
    const scene = await buildScene(content, { theme, reciter })
    if (!scene) { log.warn(`  ${ref}: kartda sığmır / ərəb mətni yoxlamadan keçmir — sıradakı`); continue }
    const pcm = audio === 'alafasy' ? await recitationPcm(pick, ffmpeg) : null
    const audioSec = pcm ? pcm.length / (SAMPLE_RATE * 4) : 0
    const tl = REEL.reelTimeline({ audioSec, lines: scene.lines, words: scene.words })
    if (tl.duration > REEL.REEL_MAX_SEC) { log.warn(`  ${ref}: video ${tl.duration.toFixed(1)} s > ${REEL.REEL_MAX_SEC} s (tilavət ${audioSec.toFixed(1)} s) — sıradakı`); continue }
    const frames = framesDir ? [
      { t: tl.inkStart + 0.45 * (tl.inkEnd - tl.inkStart), file: path.join(framesDir, 'frame-1-ink.png') },
      { t: tl.trStart + 0.55 * (tl.trEnd - tl.trStart), file: path.join(framesDir, 'frame-2-translation.png') },
      { t: tl.duration - 0.5, file: path.join(framesDir, 'frame-3-final.png') },
    ] : []
    if (framesDir) fs.mkdirSync(framesDir, { recursive: true })
    let r = await encode({ scene, tl, pcm, out, ffmpeg, frames })
    if (r.size > REEL.REEL_MAX_BYTES) r = await encode({ scene, tl, pcm, out, ffmpeg, crf: 26 })
    if (r.size > REEL.REEL_MAX_BYTES) throw new Error(`MP4 ${r.size} bayt > ${REEL.REEL_MAX_BYTES}`)
    return { date, ref, k, audio, audioSec: Math.round(audioSec * 100) / 100, duration: r.seconds, size: r.size, out }
  }
  throw new Error('reel üçün uyğun ayə tapılmadı')
}

// ── CLI ──
function args(argv) {
  const o = {}
  for (let i = 0; i < argv.length; i++) {
    const m = /^--([a-z]+)$/.exec(argv[i])
    if (!m) throw new Error(`naməlum arqument: ${argv[i]}`)
    o[m[1]] = argv[++i]
  }
  return o
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const a = args(process.argv.slice(2))
  const audioEnv = String(process.env.IG_REEL_AUDIO || '').trim()
  const opts = {
    date: a.date || bakuDate(), out: a.out || 'reel.mp4', audio: a.audio || (audioEnv === 'none' ? 'none' : 'alafasy'),
    theme: a.theme === 'night' ? 'night' : 'day', ref: a.ref || null, ffmpeg: a.ffmpeg || process.env.FFMPEG_PATH || 'ffmpeg', framesDir: a.frames || null,
  }
  const t0 = Date.now()
  renderDay(opts).then((r) => {
    if (a.meta) fs.writeFileSync(a.meta, JSON.stringify(r, null, 2) + '\n')
    console.log(`✓ ${r.date} ${r.ref} (k=${r.k}, səs: ${r.audio}${r.audioSec ? ` ${r.audioSec} s` : ''}) → ${r.out} — ${r.duration.toFixed(2)} s, ${(r.size / 1048576).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(0)} s`)
  }).catch((e) => { console.error('✗', e && e.message); process.exit(1) })
}
