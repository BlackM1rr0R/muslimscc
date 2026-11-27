#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// Instagram REEL renderi — günün Quran PASSAJI (ardıcıl ayələr), 1080×1920, 30 fps, H.264 + AAC (docs/INSTAGRAM.md → "Reels")
//
//   node scripts/ig-reel/render.mjs [--kind ayah|hadith|extra] [--date YYYY-MM-DD] [--out reel.mp4] [--meta reel.json]
//                                   [--frames <qovluq>] [--lang en|az|ru|tr] [--audio alafasy|ambient|none]
//                                   [--theme dawn|day|night] [--ref 67:1-5] [--ffmpeg <yol>]
//
// • --kind (2026-11-27): ayah (susmaya görə) — Quran passajı, tilavətlə; hadith — günün 13:00 hədisi; extra — günün 20:00
//   duası və ya Allahın adı (instagram.js kindFor). Hədis / dua videosunda SƏSLƏNDİRMƏ və MUSİQİ YOXDUR: çox zəif neytral
//   fon (süzülmüş qəhvəyi küy, ~-30 dB, fade in/out; IG_REEL_AMBIENT=0 və ya --audio none — sükut). Element instagram.js-in
//   kart seçicisi ilə eyni (staticCandidate + kartın sığması) — video həmin günün kartını göstərir; video kadrına sığmırsa
//   sıradakı element (log + sidecar-da öz item-i). Tema növə görə (instagramReel.KIND_THEMES: ayə — dawn, hədis — day,
//   dua / ad — night).
//
// • Serverdə İŞLƏMİR (1 GB server) — GitHub Actions (.github/workflows/ig-reel.yml) hər gün çəkir, ci-gate.sh "ig-reel"
//   ilə api həcminə yazır, server/instagram.js IG_REEL_TIME-da dərc edir. Asılılıqlar: server/node_modules (sharp), ffmpeg.
// • Dil: --lang (susmaya görə IG_REEL_LANG mühit dəyişəni, o da yoxdursa 'en'): tərcümə saytın həmin dil üçün nəşri
//   (daily-ayah.js EDITIONS — en: en.asad, alquran.cloud), başlıq / tilavət sətri də həmin dildə.
// • Passaj: instagramReel.passageRef (REEL_PASSAGES — gün üzrə deterministik növbə). Hər ayə növbə ilə: ərəbcə mətn
//   "mürəkkəblə yazılır", tərcümə söz-söz görünür, yuxarıda kiçik "surə:ayə" sayğacı; ayənin öz tilavəti ilə sinxron
//   (ayələrin səs faylları ffmpeg ilə PCM-ə açılıb ARASIZ birləşdirilir — ayə sərhədi = səs sərhədi). Tilavət
//   PASSAGE_MAX_SEC-ə sığmırsa — ən uzun bütöv ayə prefiksi (trimPassage; ayə kəsilmir). Hər hansı ayə kartda minimal
//   ölçüdə sığmırsa / şriftdə qlifi yoxdursa — sıradakı passaj.
// • Kartın görünüşü (server/instagramCard.js): eyni fon, xatəm ornamenti, Amiri Quran / MccInter şriftləri, pango ilə
//   eyni sətir bölgüsü. Ərəbcə mətn BÜTÖV paraqraf kimi düzülür; animasiya üçün eyni paraqraf "yalnız bu söz / sətir
//   görünür" (qalan sözlər şəffaf — fgalpha) rejimində təkrar çəkilir → mövqelər piksel-piksel eynidir. Qatlar öz
//   sərhədlərinə kəsilir (yaddaş). Mətn DƏYİŞDİRİLMİR (yalnız dayanma işarəsi sözə bitişik — displayArabic).
// • İlk kadr (hook): başlıq ("VERSES OF THE QURAN"), istinad ("Al-Mulk 67:1-5"), tilavət sətri, sayğac və muslims.cc
//   t=0-dan tam görünür, 1-ci ayə zəif iz kimi (HOOK_GHOST). Üz qabığı (server: thumb_offset = son saniyə) — son ayə tam.
// • Ölçü: VBV həddi (maxrate) müddətə görə ≤ 15 MB-a hesablanır; aşarsa daha aşağı bitreytlə təkrar.
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
const IG = require(path.join(ROOT, 'server/instagram.js'))
const dailyAyah = require(path.join(ROOT, 'server/daily-ayah.js'))

export const W = 1080
export const H = 1920
const FPS = 30
// Reels-də aşağıda ~20 % caption / hesab adı, sağda düymələr var — mətn oradan uzaq (kart story-sindən geniş kənarlar)
const FRAME = { top: 270, bottom: 400, padX: 130, ar: 72, arMin: 44, tr: 44, trMin: 32 }
const SCALES = [1.12, 1, 0.92, 0.85, 0.78, 0.72, 0.66, 0.6]
// Hədis / dua / ad videosu: mətn uzun ola bilər (≤ 650 simvol) — kiçik ölçülərə qədər (kartın feed minimumları)
const TEXT_FRAME = { padX: 120, ar: 64, arMin: 38, tr: 42, trMin: 30, name: 170, nameMin: 110 }
const TEXT_SCALES = [1.1, 1, 0.92, 0.85, 0.78, 0.72, 0.66, 0.6]
const AMBIENT_DB = -30           // fon küyünün orta səviyyəsi (dBFS, volumedetect mean_volume ilə yoxlanıb)
const SEP = 96
const MAX_TRIES = 8
const SAMPLE_RATE = 48000
const HOOK_GHOST = 0.16          // ayənin "izi" (şəffaflıq) — mürəkkəb onun üstündən yazır
const AUDIO_KBPS = 128

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3)
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
const upper = (s, lang) => s.toLocaleUpperCase(lang === 'az' || lang === 'tr' ? 'tr' : lang || 'en')

// ── Mətn qatları (sharp/pango — kartla eyni parametrlər) ──
/**
 * words — sözlər; visible(i) — i-ci söz görünürmü (qalanları şəffaf, amma yer tutur). → { data (RGBA raw), w, h, ox, oy }
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
  return { data, w: info.width, h: info.height, ox: 0, oy: 0 }
}
const line = (text, o) => paragraph({ ...o, words: [text] })

/** Qatdakı mürəkkəbin sərhədləri (alfa > 0), qatın öz koordinatlarında. */
function bbox(l) {
  let x0 = l.w, y0 = l.h, x1 = -1, y1 = -1
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      if (l.data[(y * l.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 }
}
/** Qatı mürəkkəbin sərhədinə kəs (yaddaş: tam paraqraf əvəzinə yalnız söz / sətir); ox/oy — paraqrafdakı mövqe. */
function crop(l) {
  const b = bbox(l)
  if (!b) return null
  const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1
  const data = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) l.data.copy(data, y * w * 4, ((b.y0 + y) * l.w + b.x0) * 4, ((b.y0 + y) * l.w + b.x1 + 1) * 4)
  return { data, w, h, ox: l.ox + b.x0, oy: l.oy + b.y0 }
}

async function rawSvg(svg, alpha) {
  const sharp = card.loadSharp()
  let p = sharp(Buffer.from(svg))
  p = alpha ? p.ensureAlpha() : p.flatten({ background: '#000000' }).removeAlpha()
  const { data, info } = await p.raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height, ox: 0, oy: 0 }
}

// ── Kadr qurulması (rgb24) ──
/**
 * layer (RGBA, kəsilmiş) → frame (RGB): paraqrafın sol-yuxarı küncü (px, py)-dədir, qat (px + l.ox, py + l.oy)-də.
 * op — ümumi şəffaflıq; colAlpha(x) / tint(x) — x paraqrafın koordinatındadır.
 */
function blend(frame, l, px, py, { op = 1, colAlpha = null, tint = null } = {}) {
  if (!l || op <= 0.002) return
  const ox = px + l.ox, oy = py + l.oy
  for (let y = 0; y < l.h; y++) {
    const fy = oy + y
    if (fy < 0 || fy >= H) continue
    for (let x = 0; x < l.w; x++) {
      const i = (y * l.w + x) * 4
      const a = l.data[i + 3]
      if (!a) continue
      const fx = ox + x
      if (fx < 0 || fx >= W) continue
      let k = (a / 255) * op
      if (colAlpha) { k *= colAlpha(x + l.ox); if (k <= 0) continue }
      const j = (fy * W + fx) * 3
      const c = tint ? tint(x + l.ox) : null
      frame[j] = frame[j] + ((c ? c[0] : l.data[i]) - frame[j]) * k
      frame[j + 1] = frame[j + 1] + ((c ? c[1] : l.data[i + 1]) - frame[j + 1]) * k
      frame[j + 2] = frame[j + 2] + ((c ? c[2] : l.data[i + 2]) - frame[j + 2]) * k
    }
  }
}
/** Qələmin ucunda yumşaq qızılı işıq: tünd temada additiv, açıq temada (mix) rəngə doğru qarışıq — ağ fonda itməsin. */
function glow(frame, cx, cy, r, color, op, mix = false) {
  if (op <= 0.01) return
  const s2 = 2 * (r / 3) * (r / 3)                         // σ = r/3 — qutunun kənarında işıq ~0-dır (kvadrat görünmür)
  for (let y = Math.max(0, Math.round(cy - r)); y <= Math.min(H - 1, Math.round(cy + r)); y++) {
    for (let x = Math.max(0, Math.round(cx - r)); x <= Math.min(W - 1, Math.round(cx + r)); x++) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2
      const k = Math.exp(-d2 / s2) * op
      if (k < 0.004) continue
      const j = (y * W + x) * 3
      if (mix) {
        frame[j] += (color[0] - frame[j]) * k; frame[j + 1] += (color[1] - frame[j + 1]) * k; frame[j + 2] += (color[2] - frame[j + 2]) * k
        continue
      }
      frame[j] = Math.min(255, frame[j] + color[0] * k)
      frame[j + 1] = Math.min(255, frame[j + 1] + color[1] * k)
      frame[j + 2] = Math.min(255, frame[j + 2] + color[2] * k)
    }
  }
}

// ── Səhnə: kart düzülüşü + hər ayə üçün animasiya qatları ──
// Görünməz formatlama simvolları (qlif tələb etmir): en.asad mətnində yumşaq defis U+00AD var ("shack­les") — pango onu
// yalnız sətir sonunda "-" kimi çəkir; mətn dəyişdirilmir
const INVISIBLE = new Set([0xad, 0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0x2060, 0xfeff])
/** Tərcümə şriftində (MccInter) olmayan simvollar — varsa ayə çəkilmir (▯ / başqa şriftə düşmə olmasın). */
export function latinIssues(text) {
  const has = card.fontCoverage(card.FONT.ui.file)
  const out = new Set()
  for (const ch of String(text || '')) {
    const cp = ch.codePointAt(0)
    if (!/\s/u.test(ch) && !INVISIBLE.has(cp) && !has(cp)) out.add('U+' + cp.toString(16).toUpperCase().padStart(4, '0'))
  }
  return [...out]
}

/** Bir ayənin düzülüşü (sahəyə sığan ən böyük ölçü) → qatlar | null (oxunaqlı ölçüdə sığmır / qlif yoxdur). */
// opts (hədis / dua / ad videosu üçün): font — ərəb şrifti ('quran' | 'ar'), arBase / arMin / trBase / trMin / scales —
// ölçülər, sub — ərəbcədən sonra sabit sətir (adın transliterasiyası: { text }), tərcümə ilə birlikdə görünür
async function layoutAyah(ayah, { t, width, areaTop, avail, font = 'quran', arBase = FRAME.ar, arMin = FRAME.arMin, trBase = FRAME.tr, trMin = FRAME.trMin, scales = SCALES, sub = null }) {
  const ar = card.displayArabic(ayah.ar)
  const text = card._clean(ayah.text)
  if (!ar || !text || card.arabicIssues(ar, font).length || latinIssues(text).length) return null
  if (sub && latinIssues(sub.text).length) return null
  const arWords = ar.split(' ').filter(Boolean)
  const trWords = text.split(' ').filter(Boolean)
  const SUB_GAP = 30
  const fit = async (s) => {
    const arSize = Math.round(arBase * s)
    if (arSize < arMin) return null
    const trSize = Math.max(Math.round(trBase * Math.min(s, 1)), trMin)
    const arL = await paragraph({ words: arWords, font, size: arSize, color: '#ffffff', width })
    const subL = sub ? await line(card._clean(sub.text), { font: 'uiSemi', size: Math.round(46 * Math.max(Math.min(s, 1), 0.8)), color: t.goldText, width, letter: 1 }) : null
    const trL = await paragraph({ words: trWords, font: 'ui', size: trSize, color: t.text, width, spacing: trSize * 0.3 })
    const total = arL.h + (subL ? SUB_GAP + subL.h : 0) + SEP + trL.h
    return total <= avail && arL.w <= width + 2 && trL.w <= width + 2 && (!subL || subL.w <= width + 2) ? { arSize, trSize, arL, subL, trL, total } : false
  }
  let pick = null
  for (let i = 0; i < scales.length && !pick; i++) {
    const r = await fit(scales[i])
    if (r === null) break
    if (!r) continue
    pick = r
    // Böyük ölçüdə ərəbcə bir sətir artıq bölünürsə (məs. son sətirdə tək söz) və bir pillə kiçik ölçü onu azaldırsa — kiçik
    if (scales[i] >= 1 && scales[i + 1]) {
      const n = await fit(scales[i + 1])
      if (n && n.arL.h < r.arL.h * 0.75) pick = n
    }
  }
  if (!pick) return null

  const y0 = areaTop + Math.max(0, Math.floor((avail - pick.total) / 2))
  const arPos = { x: Math.round((W - pick.arL.w) / 2), y: y0 }
  const subH = pick.subL ? SUB_GAP + pick.subL.h : 0
  const subPos = pick.subL ? { l: crop(pick.subL), x: Math.round((W - pick.subL.w) / 2), y: y0 + pick.arL.h + SUB_GAP } : null
  const sepY = Math.round(y0 + pick.arL.h + subH + SEP / 2)
  const trPos = { x: Math.round((W - pick.trL.w) / 2), y: y0 + pick.arL.h + subH + SEP }

  // Ərəbcə: hər söz ayrıca (eyni paraqraf, qalanları şəffaf) → sətirlərə qruplaşdır (söz mərkəzinin hündürlüyü)
  const wordBoxes = []
  for (let i = 0; i < arWords.length; i++) {
    const l = await paragraph({ words: arWords, font, size: pick.arSize, color: '#ffffff', width, visible: (k) => k === i })
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
    const l = crop(await paragraph({ words: arWords, font, size: pick.arSize, color: '#ffffff', width, visible: (k) => g.idx.has(k) }))
    if (l) arLines.push({ layer: l, x0: l.ox, x1: l.ox + l.w - 1, cy: l.oy + l.h / 2 })
  }
  // Tərcümə: hər söz ayrıca qat (eyni paraqraf) — söz-söz görünür
  const trLayers = []
  for (let i = 0; i < trWords.length; i++) {
    const l = crop(await paragraph({ words: trWords, font: 'ui', size: pick.trSize, color: t.text, width, spacing: pick.trSize * 0.3, visible: (k) => k === i }))
    if (l) trLayers.push(l)
  }
  if (!arLines.length || !trLayers.length) return null
  return { arSize: pick.arSize, trSize: pick.trSize, arPos, trPos, sepY, arLines, trLayers, arFull: crop(pick.arL), sub: subPos, lines: arLines.length, words: trLayers.length }
}

/**
 * passage: { title, ref, ayahs: [{ ar, text, num }] } (saytın mətni, verbatim), reciter: footer sətri (və ya null — səssiz).
 * → səhnə | null (hər hansı ayə oxunaqlı ölçüdə sığmır / ərəb mətni şriftdə düzgün çəkilmir)
 */
export async function buildPassageScene(passage, { theme = 'dawn', reciter = null, lang = 'en' } = {}) {
  const t = card.THEMES[theme] || card.THEMES.day
  if (!passage || !Array.isArray(passage.ayahs) || !passage.ayahs.length) return null
  const width = W - 2 * FRAME.padX
  const title = await line(upper(card._clean(passage.title), lang), { font: 'uiSemi', size: 28, color: t.goldText, width, letter: 4 })
  const ref = await line(card._clean(passage.ref), { font: 'uiSemi', size: 30, color: t.goldText, width })
  const rec = reciter ? await line(reciter, { font: 'ui', size: 26, color: t.soft, width }) : null
  const mark = await line('muslims.cc', { font: 'uiSemi', size: 34, color: t.goldText, width, letter: 3 })
  const counters = []
  for (const a of passage.ayahs) counters.push(await line(card._clean(a.num), { font: 'uiSemi', size: 26, color: t.goldText, width, letter: 2 }))

  const titleY = FRAME.top + 44 + 40 + 30
  const counterY = titleY + title.h + 18
  const counterH = Math.max(...counters.map((c) => c.h))
  const markY = H - FRAME.bottom - mark.h
  const footY = markY - 26
  const recY = rec ? footY - 30 - rec.h : footY
  const refY = (rec ? recY - 14 : footY - 34) - ref.h
  const areaTop = counterY + counterH + 40
  const areaBottom = refY - 44
  const avail = areaBottom - areaTop

  const ayahs = []
  for (const a of passage.ayahs) {
    const l = await layoutAyah(a, { t, width, areaTop, avail })
    if (!l) return null
    ayahs.push(l)
  }

  const bg = await rawSvg(card._background('story', theme, { sepY: null, footY }).toString(), false)
  const sep = await separator(t)
  const center = (l, y) => ({ l, x: Math.round((W - l.w) / 2), y: Math.round(y) })
  return {
    theme: t, bg, sep, ayahs,
    title: center(title, titleY), ref: center(ref, refY), rec: rec ? center(rec, recY) : null, mark: center(mark, markY),
    counters: counters.map((c) => center(c, counterY + (counterH - c.h) / 2)),
  }
}

/** Ayırıcı xətt + xatəm (kartdakı kimi) — kəsilmiş RGBA qat. */
async function separator(t) {
  const sepSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="40" viewBox="0 0 ${W} 40">` +
    `<line x1="${W / 2 - 150}" y1="20" x2="${W / 2 - 28}" y2="20" stroke="${t.gold}" stroke-opacity="0.55" stroke-width="2"/>` +
    `<line x1="${W / 2 + 28}" y1="20" x2="${W / 2 + 150}" y2="20" stroke="${t.gold}" stroke-opacity="0.55" stroke-width="2"/>` +
    card._khatam(W / 2, 20, 13, { stroke: t.gold, width: 2, opacity: 0.85 }) + '</svg>'
  return crop(await rawSvg(sepSvg, true))
}

/**
 * Hədis / dua / Allahın adı videosunun səhnəsi. content — instagram.js məzmunu ({ kind, title, ar, text, ref, tl? }, saytın
 * verbatim mətni; "Sahih" ref-də yalnız instagram.js qaydası ilə). → səhnə | null (oxunaqlı ölçüdə sığmır / qlif yoxdur).
 */
export async function buildTextScene(content, { theme = 'day', lang = 'en' } = {}) {
  const t = card.THEMES[theme] || card.THEMES.day
  if (!content || !content.ar || !content.text) return null
  const width = W - 2 * TEXT_FRAME.padX
  const isName = content.kind === 'name'
  const title = await line(upper(card._clean(content.title), lang), { font: 'uiSemi', size: 28, color: t.goldText, width, letter: 4 })
  const ref = content.ref ? await line(card._clean(content.ref), { font: 'uiSemi', size: 30, color: t.goldText, width }) : null
  const mark = await line('muslims.cc', { font: 'uiSemi', size: 34, color: t.goldText, width, letter: 3 })
  const titleY = FRAME.top + 44 + 40 + 30
  const markY = H - FRAME.bottom - mark.h
  const footY = markY - 26
  const refY = ref ? footY - 34 - ref.h : footY
  const areaTop = titleY + title.h + 48
  const avail = refY - 44 - areaTop
  const layout = await layoutAyah({ ar: content.ar, text: content.text }, {
    t, width, areaTop, avail, font: card.arabicFontFor(content.kind),
    arBase: isName ? TEXT_FRAME.name : TEXT_FRAME.ar, arMin: isName ? TEXT_FRAME.nameMin : TEXT_FRAME.arMin,
    trBase: TEXT_FRAME.tr, trMin: TEXT_FRAME.trMin, scales: TEXT_SCALES, sub: isName && content.tl ? { text: content.tl } : null,
  })
  if (!layout) return null
  const bg = await rawSvg(card._background('story', theme, { sepY: null, footY }).toString(), false)
  const center = (l, y) => ({ l, x: Math.round((W - l.w) / 2), y: Math.round(y) })
  return {
    theme: t, bg, sep: await separator(t), ayahs: [layout],
    title: center(title, titleY), ref: ref ? center(ref, refY) : null, rec: null, mark: center(mark, markY), counters: [null],
  }
}

/** t saniyəsində aktiv seqment (ayə) indeksi. */
function segmentAt(tl, t) {
  let i = 0
  while (i + 1 < tl.segments.length && t >= tl.segments[i + 1].start) i++
  return i
}

/**
 * Zaman cədvəlinə (instagramReel.passageTimeline) görə t saniyəsindəki kadr (rgb24 Buffer). cache — { key, buf }:
 * ayə tam yazılıb sönməyə başlayana qədər kadr dəyişmir — eyni bufer qaytarılır (render 2–3 dəfə tezləşir).
 */
export function renderPassageFrame(scene, tl, t, cache = null) {
  const i = segmentAt(tl, t)
  const seg = tl.segments[i]
  const A = scene.ayahs[i]
  const still = t >= seg.settle && (seg.fadeOut == null || t < seg.fadeOut)
  if (cache && still && cache.key === i) return cache.buf

  const f = Buffer.from(scene.bg.data)
  const T = scene.theme
  const gold = hex(T.gold), arC = hex(T.ar), fresh = hex(T.fresh || '#ffecba')
  const put = (o, op) => { if (o) blend(f, o.l, o.x, o.y, { op }) }

  // Sabit hissə (t=0-dan tam): başlıq, istinad, tilavət sətri, muslims.cc
  put(scene.title, 1)
  put(scene.mark, 1)
  put(scene.ref, 1)
  put(scene.rec, 1)

  // Ayənin şəffaflığı: sonda sönür (növbəti ayə gəlir), əvvəldə (1-ci ayədən başqa) iz / sayğac yumşaq görünür
  const out = seg.fadeOut != null && t > seg.fadeOut ? 1 - clamp((t - seg.fadeOut) / Math.max(0.05, seg.end - seg.fadeOut), 0, 1) : 1
  const inn = i === 0 ? 1 : easeOut((t - seg.start) / 0.25)
  const op = out * inn
  put(scene.counters[i], op)
  blend(f, A.arFull, A.arPos.x, A.arPos.y, { op: HOOK_GHOST * op, tint: () => arC })

  // Ərəbcə: sətir-sətir, sağdan sola "mürəkkəblə yazılır" (yumşaq kənar + qələmin ucunda işıq + təzə mürəkkəb qızılıdır)
  const F = Math.round(A.arSize * 1.1)
  const weights = A.arLines.map((ln) => ln.x1 - ln.x0 + F)
  const sum = weights.reduce((a, b) => a + b, 0)
  let acc = seg.inkStart
  for (let k = 0; k < A.arLines.length; k++) {
    const ln = A.arLines[k]
    const dur = ((seg.inkEnd - seg.inkStart) * weights[k]) / sum
    const s = acc
    acc += dur
    if (t < s) continue
    if (t >= acc + 0.55) { blend(f, ln.layer, A.arPos.x, A.arPos.y, { op, tint: () => arC }); continue }   // qurumuş mürəkkəb
    const startX = ln.x1 + F, endX = ln.x0
    const v = (startX - endX) / dur
    // sətrin sonundan sonra kənar sürətlə sola çəkilir — təzə (qızılı) mürəkkəb ≤ 0.5 s-də "quruyur"
    const fx = t <= acc ? startX - (t - s) * v : endX - (t - acc) * Math.max(v, (2.5 * F) / 0.5)
    blend(f, ln.layer, A.arPos.x, A.arPos.y, {
      op,
      colAlpha: (x) => clamp((x - (fx - F)) / F, 0, 1),
      tint: (x) => {
        const m = clamp((x - fx) / (F * 2.5), 0, 1)
        return [fresh[0] + (arC[0] - fresh[0]) * m, fresh[1] + (arC[1] - fresh[1]) * m, fresh[2] + (arC[2] - fresh[2]) * m]
      },
    })
    if (t <= acc) {
      const env = Math.min(1, (t - s) / 0.3, (acc - t) / 0.3 + 0.15)
      glow(f, A.arPos.x + clamp(fx - F * 0.5, endX, ln.x1), A.arPos.y + ln.cy, A.arSize * 0.75, gold, (T.light ? 0.16 : 0.22) * env * op, T.light)
    }
  }

  // Ayırıcı + tərcümə söz-söz (yuxarıdan yumşaq enir)
  blend(f, scene.sep, 0, A.sepY - 20, { op: easeOut((t - (seg.trStart - 0.3)) / 0.8) * op })
  if (A.sub) blend(f, A.sub.l, A.sub.x, A.sub.y, { op: easeOut((t - (seg.trStart - 0.5)) / 0.7) * op })
  for (let k = 0; k < A.trLayers.length; k++) {
    const p = easeOut((t - (seg.trStart + k * seg.wordGap)) / 0.5)
    if (p <= 0) continue
    blend(f, A.trLayers[k], A.trPos.x, A.trPos.y - Math.round((1 - p) * 10), { op: p * op })
  }
  if (cache && still) { cache.key = i; cache.buf = f }
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

/**
 * Passajın ayələrinin tilavəti → [PCM s16le 48 kHz stereo] (hər ayə ayrıca; aralarında sükut YOXDUR — arasız birləşdirmə).
 * maxSec — cəm bu həddi keçən kimi dayanır (lazımsız yükləmə olmasın; trimPassage onsuz da kəsəcək).
 */
export async function recitationParts(pick, ffmpeg, maxSec = Infinity) {
  const parts = []
  let sum = 0
  for (let a = pick.a; a <= pick.to && sum <= maxSec; a++) {
    let mp3 = null
    for (const u of REEL.audioUrls(pick.s, a)) { mp3 = await fetchBuf(u); if (looksMp3(mp3)) break; mp3 = null }
    if (!mp3) throw new Error(`səs faylı tapılmadı: ${pick.s}:${a}`)
    const pcm = await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-f', 's16le', '-ac', '2', '-ar', String(SAMPLE_RATE), 'pipe:1'], { input: mp3 })
    parts.push(pcm)
    sum += pcm.length / (SAMPLE_RATE * 4)
  }
  return parts
}
const pcmSec = (b) => b.length / (SAMPLE_RATE * 4)

function wav(pcm) {
  const h = Buffer.alloc(44)
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12)
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SAMPLE_RATE, 24)
  h.writeUInt32LE(SAMPLE_RATE * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([h, pcm])
}

/**
 * Neytral fon səsi (lavfi): qəhvəyi küy → alçaq / yüksək tezlik süzgəci (külək kimi, tonu YOXDUR — musiqi deyil) → çox yavaş
 * tremolo (nəfəs kimi dalğalanma) → səviyyə AMBIENT_DB (orta, dBFS) → 2.5 s fade in / 3 s fade out → stereo.
 * Seed sabitdir — eyni müddət → eyni səs (deterministik render).
 */
export function ambientGraph(seconds) {
  const d = Math.max(1, Number(seconds) || 1)
  const gain = AMBIENT_DB + 25                       // anoisesrc a=0.5 + süzgəclərdən sonra orta səviyyə ≈ -25 dBFS (volumedetect ilə ölçülüb)
  return [
    `anoisesrc=d=${d.toFixed(3)}:c=brown:r=${SAMPLE_RATE}:a=0.5:s=7`,
    'highpass=f=70', 'lowpass=f=420', 'tremolo=f=0.12:d=0.35',
    `volume=${gain}dB`,
    'afade=t=in:st=0:d=2.5', `afade=t=out:st=${Math.max(0, d - 3).toFixed(3)}:d=3`,
    'pan=stereo|c0=c0|c1=c0',
  ].join(',')
}

// ── Kodlaşdırma ──
/** Müddətə görə video bitreyt həddi (kbit/s): bütün fayl maxBytes-ın ~90 %-nə sığsın (səs + konteyner payı çıxılır). */
export function videoMaxrateKbps(seconds, maxBytes = REEL.REEL_MAX_BYTES) {
  const total = (maxBytes * 0.9 * 8) / Math.max(1, seconds) / 1000
  return Math.max(400, Math.min(8000, Math.floor(total - AUDIO_KBPS - 16)))
}

/**
 * Kadrlar → MP4 (H.264 High yuv420p bt709, qapalı GOP, CRF + VBV həddi, AAC 128k 48 kHz stereo, faststart, edit list yoxdur).
 * renderAt(t) — kadr (rgb24); duration — saniyə; audioStart — tilavət nə vaxt başlayır; pcm — tilavət (null: səssiz trek).
 * frames: [{ t, file }] — PNG kadrlar (baxış üçün).
 */
export async function encode({ renderAt, duration, audioStart = 0, pcm, ambient = false, out, ffmpeg = 'ffmpeg', fps = FPS, frames = [], crf = 20, maxrate = null }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-reel-'))
  try {
    const n = Math.round(duration * fps)
    const total = n / fps
    const rate = maxrate || videoMaxrateKbps(total)
    let audioIn
    if (pcm) {
      const lead = Buffer.alloc(Math.round(audioStart * SAMPLE_RATE) * 4)
      const body = Buffer.concat([lead, pcm])
      const need = Math.round(total * SAMPLE_RATE) * 4
      const full = body.length >= need ? body.subarray(0, need) : Buffer.concat([body, Buffer.alloc(need - body.length)])
      fs.writeFileSync(path.join(tmp, 'a.wav'), wav(full))
      audioIn = ['-i', path.join(tmp, 'a.wav')]
    } else if (ambient) audioIn = ['-f', 'lavfi', '-t', total.toFixed(3), '-i', ambientGraph(total)]
    else audioIn = ['-f', 'lavfi', '-t', total.toFixed(3), '-i', `anullsrc=r=${SAMPLE_RATE}:cl=stereo`]
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
    const args = [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-framerate', String(fps), '-i', 'pipe:0',
      ...audioIn,
      '-map', '0:v:0', '-map', '1:a:0',
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-maxrate', `${rate}k`, '-bufsize', `${rate * 2}k`,
      '-profile:v', 'high', '-level:v', '4.2',
      '-g', String(fps * 2), '-keyint_min', String(fps), '-sc_threshold', '0', '-flags', '+cgop', '-x264-params', 'aq-mode=3',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
      '-c:a', 'aac', '-b:a', `${AUDIO_KBPS}k`, '-ar', String(SAMPLE_RATE), '-ac', '2',
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
      const buf = renderAt(i / fps)
      if (want.has(i)) {
        await card.loadSharp()(buf, { raw: { width: W, height: H, channels: 3 } }).png().toFile(want.get(i))
      }
      if (!p.stdin.write(buf)) await Promise.race([once(p.stdin, 'drain'), closed])
    }
    p.stdin.end()
    const code = await closed
    if (failed || code !== 0) throw new Error(`ffmpeg: ${failed ? failed.message : code} ${Buffer.concat(err).toString().slice(-800)}`)
    return { frames: n, seconds: total, size: fs.statSync(out).size, maxrate: rate }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }) }
}

// ── Günün reel-i ──
export function bakuDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

/** Passajın hər ayəsi ayrıca (alquran.cloud, saytın nəşrləri) → [{ texts, names }] | null (hər hansı ayə əlçatmazdır). */
async function ayahParts(pick) {
  const parts = []
  for (let a = pick.a; a <= pick.to; a++) {
    const b = await fetchBuf(dailyAyah.ayahApiUrl(pick.s, a), 3)
    let j = null
    try { j = b ? JSON.parse(b.toString('utf8')) : null } catch { j = null }
    const p = j ? dailyAyah.parseAyahResponse(j, pick.s, a) : null
    if (!p) return null
    parts.push(p)
  }
  return parts
}

/** Səssiz rejimdə ayənin "oxuma" müddəti — passageTimeline ilə eyni düstur (trimPassage üçün). */
const silentSec = (words) => clamp(words * 0.32 + 1.5, 4, 14)

/**
 * Günün reel-ini çək. → { date, ref, passage, k, audio, lang, ayahs, audioSec, duration, size, out }
 * opts: { date, out, lang, audio: 'alafasy'|'none', theme, ref (məcburi passaj / ayə — sınaq), ffmpeg, framesDir, log }
 */
export async function renderDay(opts = {}) {
  const { date = bakuDate(), out, audio = 'alafasy', theme = REEL.themeForKind('ayah'), ffmpeg = 'ffmpeg', framesDir = null, log = console } = opts
  const lang = REEL.parseReelLang(opts.lang)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('tarix YYYY-MM-DD olmalıdır')
  if (!REEL.AUDIO_MODES.includes(audio)) throw new Error('audio: alafasy | none')
  if (opts.lang && opts.lang !== lang) throw new Error(`lang: ${REEL.REEL_LANGS.join(' | ')}`)
  if (opts.ref && !REEL.isReelRef(opts.ref)) throw new Error('ref icazəli deyil (instagramReel.js REEL_PASSAGES və ya daily-ayah.js AYAH_REFS)')
  const reciter = audio === 'alafasy' ? `${REEL.RECITATION[lang]}: ${REEL.RECITER.name[lang]}` : null
  const capAudio = REEL.PASSAGE_MAX_SEC - REEL.PASSAGE_LEAD_SEC - REEL.PASSAGE_TAIL_SEC
  for (let k = 0; k < (opts.ref ? 1 : MAX_TRIES); k++) {
    const passage = opts.ref || REEL.passageRef(date, k)
    const full = dailyAyah.parseRef(passage)
    const parts = await ayahParts(full)
    if (!parts) throw new Error(`ayə mənbəyi əlçatmazdır: ${passage}`)
    const pcmParts = audio === 'alafasy' ? await recitationParts(full, ffmpeg, capAudio) : null
    const durations = pcmParts ? pcmParts.map(pcmSec) : parts.map((p) => silentSec(card._clean(p.texts[lang]).split(' ').filter(Boolean).length))
    const pick = REEL.trimPassage(full, durations, capAudio)
    if (!pick) { log.warn(`  ${passage}: 1-ci ayənin tilavəti də ${capAudio} s-dən uzundur — sıradakı`); continue }
    if (pick.ref !== passage) log.log(`  ${passage} → ${pick.ref} (tilavət ${pick.audioSec.toFixed(1)} s ≤ ${capAudio} s; bütöv ayələr)`)
    const used = parts.slice(0, pick.count)
    const content = {
      title: REEL.reelTitle(lang, pick),
      ref: `${dailyAyah.surahLabel(lang, pick.s, used[0].names)} ${pick.ref}`,
      ayahs: used.map((p, i) => ({ ar: p.texts.ar, text: p.texts[lang], num: `${pick.s}:${pick.a + i}` })),
    }
    const scene = await buildPassageScene(content, { theme, reciter, lang })
    if (!scene) { log.warn(`  ${pick.ref}: ayələrdən biri kartda minimal ölçüdə sığmır / qlif yoxlamadan keçmir — sıradakı passaj`); continue }
    const tl = REEL.passageTimeline(used.map((p, i) => ({ audioSec: pcmParts ? pcmSec(pcmParts[i]) : 0, words: scene.ayahs[i].words })))
    if (tl.duration > REEL.PASSAGE_MAX_SEC + 0.05) { log.warn(`  ${pick.ref}: video ${tl.duration.toFixed(1)} s > ${REEL.PASSAGE_MAX_SEC} s — sıradakı`); continue }
    const pcm = pcmParts ? Buffer.concat(pcmParts.slice(0, pick.count)) : null
    const mid = tl.segments[Math.floor((tl.segments.length - 1) / 2)]
    const frames = framesDir ? [
      { t: 0, file: path.join(framesDir, 'frame-1-hook.png') },
      { t: mid.inkStart + 0.7 * (mid.inkEnd - mid.inkStart), file: path.join(framesDir, 'frame-2-ink.png') },
      { t: tl.duration - 1, file: path.join(framesDir, 'frame-3-cover.png') },
    ] : []
    if (framesDir) fs.mkdirSync(framesDir, { recursive: true })
    const cache = {}
    const renderAt = (t) => renderPassageFrame(scene, tl, t, cache)
    const enc = { renderAt, duration: tl.duration, audioStart: tl.audioStart, pcm, out, ffmpeg }
    let r = await encode({ ...enc, frames })
    if (r.size > REEL.REEL_MAX_BYTES) r = await encode({ ...enc, crf: 25, maxrate: Math.floor(r.maxrate * 0.7) })
    if (r.size > REEL.REEL_MAX_BYTES) throw new Error(`MP4 ${r.size} bayt > ${REEL.REEL_MAX_BYTES}`)
    return {
      kind: 'ayah', date, ref: pick.ref, passage, k, audio, lang, theme, ayahs: pick.count, audioSec: Math.round(tl.audioSec * 100) / 100,
      duration: r.seconds, size: r.size, out,
    }
  }
  throw new Error('reel üçün uyğun passaj tapılmadı')
}

/**
 * Günün hədis (slot 'hadith') və ya dua / Allahın adı (slot 'extra') videosu. Element — instagram.js-in kart seçicisi
 * (staticCandidate + ərəb qlif yoxlaması + caption + feed / story kartının sığması) ilə eyni; video kadrına sığmırsa sıradakı.
 * → { kind, item, key, cardKey, date, k, audio, lang, theme, duration, size, out }
 * opts: { date, slot: 'hadith'|'extra', out, lang, audio: 'ambient'|'none', theme, ffmpeg, framesDir, log, maxTries }
 */
export async function renderTextDay(opts = {}) {
  const { date = bakuDate(), slot = 'hadith', out, audio = 'ambient', ffmpeg = 'ffmpeg', framesDir = null, log = console } = opts
  const lang = REEL.parseReelLang(opts.lang)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('tarix YYYY-MM-DD olmalıdır')
  if (!REEL.TEXT_AUDIO_MODES.includes(audio)) throw new Error('audio: ambient | none')
  if (opts.lang && opts.lang !== lang) throw new Error(`lang: ${REEL.REEL_LANGS.join(' | ')}`)
  if (!['hadith', 'extra'].includes(slot)) throw new Error('slot: hadith | extra')
  const kind = slot === 'hadith' ? 'hadith' : IG.kindFor(2, date)
  const theme = opts.theme || REEL.themeForKind(kind)
  let cardKey = null
  for (let k = 0; k < (opts.maxTries || MAX_TRIES); k++) {
    const c = IG.staticCandidate(kind, date, k, lang)
    if (!c || card.contentIssues(c).length || !IG.buildCaptionMulti(c, [lang], { day: date })) continue
    // Kart seçicisi bu elementi götürərdimi? (feed VƏ story sığmalıdır — instagram.js prepare)
    if (!(await card.renderCard(c, { format: 'feed', theme, lang })) || !(await card.renderCard(c, { format: 'story', theme, lang }))) continue
    if (!cardKey) cardKey = c.key
    const scene = await buildTextScene(c, { theme, lang })
    if (!scene) { log.warn(`  ${c.key}: video kadrına oxunaqlı ölçüdə sığmır / qlif yoxlamasından keçmir — sıradakı (kart: ${cardKey})`); continue }
    const A = scene.ayahs[0]
    const tl = REEL.textTimeline({ lines: A.lines, words: A.words })
    const seg = tl.segments[0]
    const frames = framesDir ? [
      { t: 0, file: path.join(framesDir, `frame-${kind}-1-start.png`) },
      { t: seg.inkStart + 0.6 * (seg.inkEnd - seg.inkStart), file: path.join(framesDir, `frame-${kind}-2-ink.png`) },
      { t: seg.trStart + (seg.trEnd - seg.trStart) * 0.5, file: path.join(framesDir, `frame-${kind}-3-words.png`) },
      { t: tl.duration - 1, file: path.join(framesDir, `frame-${kind}-4-cover.png`) },
    ] : []
    if (framesDir) fs.mkdirSync(framesDir, { recursive: true })
    const cache = {}
    const enc = { renderAt: (t) => renderPassageFrame(scene, tl, t, cache), duration: tl.duration, pcm: null, ambient: audio === 'ambient', out, ffmpeg }
    let r = await encode({ ...enc, frames })
    if (r.size > REEL.REEL_MAX_BYTES) r = await encode({ ...enc, crf: 25, maxrate: Math.floor(r.maxrate * 0.7) })
    if (r.size > REEL.REEL_MAX_BYTES) throw new Error(`MP4 ${r.size} bayt > ${REEL.REEL_MAX_BYTES}`)
    return { kind, item: IG.itemIdOf(c.key), key: c.key, cardKey, date, k, audio, lang, theme, duration: r.seconds, size: r.size, out }
  }
  throw new Error(`${kind} videosu üçün uyğun element tapılmadı`)
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
  const kind = a.kind || 'ayah'
  if (!['ayah', 'hadith', 'extra'].includes(kind)) { console.error('✗ --kind: ayah | hadith | extra'); process.exit(1) }
  const audioEnv = String(process.env.IG_REEL_AUDIO || '').trim()
  const ambientOff = String(process.env.IG_REEL_AMBIENT || '').trim() === '0'
  const textAudio = a.audio || (ambientOff ? 'none' : 'ambient')
  const opts = {
    date: a.date || bakuDate(), out: a.out || 'reel.mp4',
    audio: kind === 'ayah' ? (a.audio || (audioEnv === 'none' ? 'none' : 'alafasy')) : textAudio,
    lang: a.lang || String(process.env.IG_REEL_LANG || '').trim() || REEL.DEFAULT_REEL_LANG,
    theme: card.THEME_NAMES.includes(a.theme) ? a.theme : undefined, ref: a.ref || null,
    ffmpeg: a.ffmpeg || process.env.FFMPEG_PATH || 'ffmpeg', framesDir: a.frames || null,
  }
  const t0 = Date.now()
  const job = kind === 'ayah' ? renderDay(opts) : renderTextDay({ ...opts, slot: kind })
  job.then((r) => {
    if (a.meta) fs.writeFileSync(a.meta, JSON.stringify(r, null, 2) + '\n')
    const what = r.kind === 'ayah' ? `${r.ref} (${r.ayahs} ayə, passaj ${r.passage}` : `${r.key} (kart: ${r.cardKey}`
    console.log(`✓ ${r.date} ${what}, k=${r.k}, dil: ${r.lang}, tema: ${r.theme}, səs: ${r.audio}${r.audioSec ? ` ${r.audioSec} s` : ''}) → ${r.out} — ${r.duration.toFixed(2)} s, ${(r.size / 1048576).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(0)} s`)
  }).catch((e) => { console.error('✗', e && e.message); process.exit(1) })
}
