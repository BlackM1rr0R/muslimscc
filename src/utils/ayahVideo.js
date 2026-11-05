// ═══════════════════════════════════════════════════════
// Ayədən video (components/quran/KaraokeAyah.jsx → "Video kimi yüklə")
//
// 1080×1920 (story / reels), tilavət səsi ilə: ərəbcə sözlər oxunduqca vurğulanır,
// altda tərcümə, yuxarıda ayənin yeri, aşağıda muslims.cc. Hamısı brauzerdə:
// səs (verses.quran.com, CORS *) → WebAudio → MediaStreamDestination; canvas.captureStream
// → MediaRecorder (mp4 dəstəklənirsə, yoxsa webm). Heç nə serverə göndərilmir.
// ═══════════════════════════════════════════════════════
const W = 1080, H = 1920

/** Brauzerin yaza bildiyi format: mp4 üstün tutulur (Instagram/WhatsApp üçün) */
export function pickMime(isSupported = (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
  for (const t of ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']) {
    if (isSupported(t)) return t
  }
  return null
}

export const canRecordVideo = () => typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined'
  && typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype && !!(window.AudioContext || window.webkitAudioContext) && !!pickMime()

/** Sözləri sətirlərə böl (sağdan sola): [{ words: [i…], width }] — saf, ölçmə funksiyası verilir */
export function layoutWords(widths, maxW, gap) {
  const lines = []
  let cur = [], w = 0
  widths.forEach((ww, i) => {
    const add = cur.length ? gap + ww : ww
    if (cur.length && w + add > maxW) { lines.push({ words: cur, width: w }); cur = [i]; w = ww }
    else { cur.push(i); w += add }
  })
  if (cur.length) lines.push({ words: cur, width: w })
  return lines
}

function wrapText(ctx, text, maxW) {
  const out = []
  let line = ''
  for (const word of String(text || '').split(/\s+/)) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word } else line = test
  }
  if (line) out.push(line)
  return out
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

/**
 * Videonu yaz. Qaytarır: Promise<Blob>.
 *   words: [{ text, from, to }] (ms), audioUrl, ref: '2:255', translation, brand, reciter
 *   onProgress(0…1)
 */
export async function recordAyahVideo({ words, audioUrl, ref, translation = '', brand = 'muslims.cc', reciter = '', font = 'Amiri, serif', rtlTranslation = false, onProgress = () => {} }) {
  const mime = pickMime()
  if (!mime) throw new Error('unsupported')
  const AC = window.AudioContext || window.webkitAudioContext
  const ac = new AC()
  const buf = await fetch(audioUrl).then(r => { if (!r.ok) throw new Error('audio'); return r.arrayBuffer() }).then(b => ac.decodeAudioData(b))

  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')
  // Ərəb sözlərinin düzülüşü
  let fs = 88
  ctx.font = `${fs}px ${font}`
  let widths = words.map(w => ctx.measureText(w.text).width)
  let lines = layoutWords(widths, W - 160, 36)
  while (lines.length > 6 && fs > 48) { fs -= 8; ctx.font = `${fs}px ${font}`; widths = words.map(w => ctx.measureText(w.text).width); lines = layoutWords(widths, W - 160, 22) }
  const lh = fs * 1.75
  ctx.font = '40px Inter, system-ui, sans-serif'
  const tr = wrapText(ctx, translation, W - 180).slice(0, 7)
  const blockH = lines.length * lh + (tr.length ? 60 + tr.length * 58 : 0)
  const top = Math.max(360, (H - blockH) / 2)

  const draw = (ms) => {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#0b4232'); g.addColorStop(1, '#04150f')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    // həndəsi bəzək
    ctx.save(); ctx.globalAlpha = 0.08; ctx.strokeStyle = '#f3dc9a'; ctx.lineWidth = 2
    for (let k = 0; k < 8; k++) { ctx.save(); ctx.translate(W / 2, 260); ctx.rotate((k * Math.PI) / 8); ctx.strokeRect(-120, -120, 240, 240); ctx.restore() }
    ctx.restore()
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = '#f3dc9a'; ctx.font = '600 44px Inter, system-ui, sans-serif'
    ctx.fillText(`Quran ${ref}`, W / 2, 260)
    // aktiv söz
    let cur = -1
    for (let i = 0; i < words.length; i++) { if (words[i].from != null && words[i].from <= ms) cur = i; else if (words[i].from != null) break }
    ctx.font = `${fs}px ${font}`
    lines.forEach((ln, li) => {
      const y = top + li * lh + lh / 2
      let x = W / 2 + ln.width / 2 // sağdan başlayır
      ln.words.forEach((wi) => {
        const ww = widths[wi]
        const cx = x - ww / 2
        if (wi === cur) {
          ctx.fillStyle = '#f0c75e'; roundRect(ctx, cx - ww / 2 - 16, y - fs * 0.62, ww + 32, fs * 1.3, 22); ctx.fill()
          ctx.fillStyle = '#2a1d00'
        } else ctx.fillStyle = wi < cur ? '#bfe9d6' : '#ffffff'
        ctx.fillText(words[wi].text, cx, y)
        x -= ww + 36
      })
    })
    if (tr.length) {
      ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.font = '40px Inter, system-ui, sans-serif'
      ctx.direction = rtlTranslation ? 'rtl' : 'ltr'
      tr.forEach((l, i) => ctx.fillText(l, W / 2, top + lines.length * lh + 70 + i * 58))
      ctx.direction = 'ltr'
    }
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '600 38px Inter, system-ui, sans-serif'
    ctx.fillText(brand, W / 2, H - 170)
    if (reciter) { ctx.font = '32px Inter, system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillText(reciter, W / 2, H - 120) }
  }

  draw(-1)
  const dest = ac.createMediaStreamDestination()
  const src = ac.createBufferSource(); src.buffer = buf; src.connect(dest)
  const stream = new MediaStream([...cv.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()])
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 })
  const chunks = []
  rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data) }
  const done = new Promise((res, rej) => { rec.onstop = () => res(new Blob(chunks, { type: mime.split(';')[0] })); rec.onerror = (e) => rej(e.error || new Error('rec')) })

  const total = buf.duration + 1.2
  rec.start(250)
  const t0 = ac.currentTime + 0.4
  src.start(t0)
  await new Promise((res) => {
    const tick = () => {
      const t = ac.currentTime - t0
      draw(t * 1000)
      onProgress(Math.max(0, Math.min(1, t / total)))
      if (t >= total) res(); else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  rec.stop()
  stream.getTracks().forEach(t => t.stop())
  ac.close?.()
  return done
}
