// ═══════════════════════════════════════════════════════
// Hərəkətli sitat kartı + video (/quotes)
//
// Statik kart (utils/quoteCard → renderCard) qatlara bölünür:
//   1) fon + naxış — bir dəfə ayrıca kanvasa çəkilir (keş), sonra hər kadrda
//      çox yavaş böyüyür və sürüşür ("Ken Burns");
//   2) atmosfer — tünd şablonlarda yavaş qalxan ulduz tozu, açıq
//      şablonlarda kartın üstündən keçən zərif işıq zolağı;
//   3) mətn — sətir-sətir üzə çıxır (şəffaflıq + yuxarı sürüşmə).
// Sonda mətn yumşaq sönür ki, video döngüdə (Instagram) tikişsiz görünsün.
//
// Video: kanvas.captureStream + MediaRecorder (real vaxtda). Ayə seçilibsə
// qiraət səsi (Mişari Əfasi, verses.quran.com — CORS açıqdır) WebAudio ilə
// videoya qarışdırılır və ərəbcə sətirlər qiraətin tempi ilə açılır.
// Hamısı brauzerdə — server yoxdur.
// ═══════════════════════════════════════════════════════
import { renderCard, unitOf, ensureFonts } from './quoteCard'

const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

const FADE_IN = 0.9      // hər elementin üzə çıxma müddəti (san)
const FADE_OUT = 0.8     // sondakı sönmə
const LEAD = 0.5         // ilk element başlamazdan əvvəl

/** Determinist təsadüfi (ulduz tozu hər kadrda eyni yerdən başlasın) */
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

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

/** Mətn elementlərinin siyahısı (çəkmədən) — zaman xətti üçün */
function collectItems(card, W, H) {
  const c = canvas(8, 8)
  return renderCard(c.getContext('2d'), card, W, H, { bg: false, border: false, text: false, clear: false }).items
}

/**
 * Zaman xətti: hər elementin başlama anı (san) və ümumi müddət.
 * audio verilibsə: ərəbcə sətirlər qiraətin müddətinə simvol sayına görə
 * paylanır (qiraət hansı sətirdədirsə, o sətir açılır), tərcümə qiraətin
 * ikinci yarısında, istinad sonda.
 */
export function planTimeline(items, { audioDur = 0, audioAt = LEAD + 0.4 } = {}) {
  const starts = new Array(items.length).fill(0)
  let t = LEAD
  const hasAudio = audioDur > 0
  const arIdx = items.map((it, i) => (it.kind === 'ar' ? i : -1)).filter(i => i >= 0)
  const arChars = arIdx.reduce((s, i) => s + Math.max(1, items[i].len), 0)
  let arDone = 0
  let readChars = 0
  let firstTr = true

  items.forEach((it, i) => {
    if (it.kind === 'kicker' || it.kind === 'ornament') {
      starts[i] = t; t += 0.35
    } else if (it.kind === 'ar') {
      if (hasAudio) {
        // Sətir qiraətdə öz payının başlanğıcında açılır (bir az qabaq)
        starts[i] = Math.max(t, audioAt + (arDone / arChars) * audioDur - 0.25)
        arDone += Math.max(1, it.len)
        t = starts[i] + 0.2
      } else {
        starts[i] = t; t += 0.55 + Math.min(0.6, it.len / 90)
      }
      readChars += it.len
    } else if (it.kind === 'tr') {
      if (hasAudio && firstTr) {
        // tərcümənin ilk sətri: qiraətin təxminən yarısında
        t = Math.max(t, audioAt + audioDur * 0.45)
      }
      firstTr = false
      starts[i] = t; t += 0.4 + Math.min(0.5, it.len / 120)
      readChars += it.len
    } else if (it.kind === 'divider') {
      starts[i] = t; t += 0.3
    } else if (it.kind === 'ref') {
      starts[i] = t; t += 0.3
    } else { // watermark
      starts[i] = t
    }
  })

  const revealEnd = Math.max(...starts, 0) + FADE_IN
  // Hamısı açıldıqdan sonra oxumaq üçün vaxt (orta oxu sürəti ~18 simvol/san)
  const hold = Math.min(9, Math.max(2.5, readChars / 18 - (revealEnd - LEAD) * 0.6))
  let total = revealEnd + hold + FADE_OUT
  if (hasAudio) total = Math.max(total, audioAt + audioDur + 1.6)
  return { starts, total: Math.min(60, total) }
}

/** reveal funksiyası: t anında i-ci elementin görünüşü */
function revealAt(plan, t, u) {
  const outStart = plan.total - FADE_OUT
  const out = t > outStart ? 1 - easeInOut((t - outStart) / FADE_OUT) : 1
  return (i) => {
    const k = easeOut((t - plan.starts[i]) / FADE_IN)
    if (k <= 0) return { a: 0 }
    return { a: k * out, dy: (1 - k) * 26 * u }
  }
}

/**
 * Hərəkətli kart səhnəsi. scene.draw(ctx, t) — t saniyə; ctx W×H
 * məntiqi koordinatlardadır (önizləmə setTransform ilə kiçildir).
 */
export function createScene(card, format, { audioDur = 0 } = {}) {
  const W = format.w, H = format.h
  const u = unitOf(W, H)
  const tpl = card.template || {}
  const round = card.style?.corners === 'round'

  // İki keş: fon (yavaş böyüyür) və şablonun naxışı/çərçivəsi/ayı (YERİNDƏ
  // qalır — böyüsə künc ulduzları və çərçivə kənardan kəsilir). Künclər düz
  // çəkilir, yumru kəsim hər kadrda tətbiq olunur.
  const flat = { ...card, style: { ...card.style, corners: 'square' } }
  const bgLayer = canvas(W, H)
  renderCard(bgLayer.getContext('2d'), flat, W, H, { paint: true, decor: false, border: false, text: false })
  const decorLayer = canvas(W, H)
  renderCard(decorLayer.getContext('2d'), flat, W, H, { paint: false, decor: true, border: false, text: false })

  const items = collectItems(card, W, H)
  const plan = planTimeline(items, { audioDur })

  // Atmosfer
  const dark = Boolean(tpl.dark)
  const rand = rng(0x5eed + W * 3 + H)
  const dust = dark
    ? Array.from({ length: 46 }, () => ({
        x: rand() * W, y: rand() * H, r: (0.8 + rand() * 2.2) * u,
        v: (6 + rand() * 16) * u, ph: rand() * Math.PI * 2, tw: 0.6 + rand() * 1.4,
      }))
    : []
  const glow = tpl.accent || '#d8b46a'

  function draw(ctx, t) {
    const p = Math.min(1, Math.max(0, t / plan.total))
    ctx.save()
    ctx.clearRect(0, 0, W, H)
    if (round) {
      ctx.beginPath()
      const r = Math.min(W, H) * 0.06
      ctx.moveTo(r, 0); ctx.arcTo(W, 0, W, H, r); ctx.arcTo(W, H, 0, H, r); ctx.arcTo(0, H, 0, 0, r); ctx.arcTo(0, 0, W, 0, r)
      ctx.closePath(); ctx.clip()
    }

    // 1) Fon — yavaş böyümə + yüngül sürüşmə
    const s = 1.03 + 0.06 * easeInOut(p)
    const dx = Math.sin(p * Math.PI) * W * 0.012
    const dy = -p * H * 0.012
    ctx.save()
    ctx.translate(W / 2 + dx, H / 2 + dy)
    ctx.scale(s, s)
    ctx.drawImage(bgLayer, -W / 2, -H / 2)
    ctx.restore()
    ctx.drawImage(decorLayer, 0, 0)

    // 2) Atmosfer
    if (dark) {
      ctx.save()
      ctx.fillStyle = glow
      for (const d of dust) {
        const yy = ((d.y - d.v * t) % H + H) % H
        const a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(d.ph + t * d.tw))
        ctx.globalAlpha = a * 0.55
        ctx.beginPath(); ctx.arc(d.x + Math.sin(d.ph + t * 0.4) * 6 * u, yy, d.r, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()
    } else {
      // Kartın üstündən çəp keçən işıq zolağı (hər ~7 saniyədə bir)
      const cyc = (t % 7) / 7
      const x = -W * 0.6 + cyc * W * 2.2
      ctx.save()
      ctx.globalCompositeOperation = 'soft-light'
      const g = ctx.createLinearGradient(x - W * 0.3, 0, x + W * 0.3, H * 0.4)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(0.5, 'rgba(255,255,255,0.55)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      ctx.restore()
    }
    ctx.restore()

    // 3) Mətn + çərçivə (fon artıq çəkilib)
    renderCard(ctx, card, W, H, { bg: false, border: true, clear: false, reveal: revealAt(plan, t, u) })
  }

  return { draw, total: plan.total, W, H }
}

// ── Video ──────────────────────────────────────────────

const MIME = [
  'video/mp4;codecs=avc1.42E01F,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
]

export function pickVideoMime() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
  return MIME.find(m => { try { return MediaRecorder.isTypeSupported(m) } catch { return false } }) || ''
}

export function videoSupported() {
  return typeof document !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
    Boolean(pickVideoMime())
}

/** Ayənin qiraəti (Mişari Əfasi). CORS açıqdır — WebAudio ilə oxuna bilir. */
export const recitationUrl = (s, a) =>
  `https://verses.quran.com/Alafasy/mp3/${String(s).padStart(3, '0')}${String(a).padStart(3, '0')}.mp3`

/** Kliklə dərhal yaradılmalıdır (brauzerlər səsi yalnız istifadəçi jesti ilə açır) */
export function createAudioContext() {
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!AC) return null
  try { const ac = new AC(); ac.resume?.(); return ac } catch { return null }
}

async function loadAudio(actx, url, signal) {
  const res = await fetch(url, { signal, mode: 'cors' })
  if (!res.ok) throw new Error(`audio ${res.status}`)
  const buf = await res.arrayBuffer()
  return new Promise((resolve, reject) => {
    // Köhnə Safari: yalnız callback forması
    const p = actx.decodeAudioData(buf, resolve, reject)
    if (p?.then) p.then(resolve, reject)
  })
}

/**
 * Videonu yazır. Qaytarır: { blob, ext, mime, audio: bool }
 * opts: { audioUrl, actx, onStart({ total, audioDur }), onProgress(sec, total), signal }
 * Real vaxtda işləyir (müddət qədər çəkir); tab gizlənsə dayanır (abort).
 */
export async function recordVideo(card, format, { audioUrl = '', actx = null, onStart, onProgress, signal } = {}) {
  const mime = pickVideoMime()
  if (!mime) throw new Error('unsupported')
  await ensureFonts(card)

  // Səs (istəyə görə) — alınmasa səssiz davam edir
  let audioBuf = null
  if (audioUrl && actx) {
    try { audioBuf = await loadAudio(actx, audioUrl, signal) } catch (e) {
      if (signal?.aborted) throw e
      audioBuf = null
    }
  }
  if (signal?.aborted) throw new DOMException('aborted', 'AbortError')

  const scene = createScene(card, format, { audioDur: audioBuf ? audioBuf.duration : 0 })
  const cv = canvas(format.w, format.h)
  const ctx = cv.getContext('2d')
  scene.draw(ctx, 0)

  const vStream = cv.captureStream(30)
  const tracks = [...vStream.getVideoTracks()]
  let src = null
  if (audioBuf) {
    const dest = actx.createMediaStreamDestination()
    src = actx.createBufferSource()
    src.buffer = audioBuf
    src.connect(dest)
    src.connect(actx.destination) // istifadəçi yazılış zamanı qiraəti eşidir
    tracks.push(...dest.stream.getAudioTracks())
  }
  const stream = new MediaStream(tracks)
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 128_000 })
  const chunks = []
  rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data) }
  const stopped = new Promise((resolve, reject) => {
    rec.onstop = resolve
    rec.onerror = (e) => reject(e.error || new Error('recorder'))
  })

  // Zaman mənbəyi: səs varsa AudioContext saatı (səs-görüntü sinxron qalır)
  const clock = audioBuf ? () => actx.currentTime : () => performance.now() / 1000
  const AUDIO_AT = LEAD + 0.4
  onStart?.({ total: scene.total, audioDur: audioBuf ? audioBuf.duration : 0 })
  rec.start(250)
  const t0 = clock()
  if (src) src.start(actx.currentTime + AUDIO_AT)

  let aborted = false
  const onHide = () => { if (document.hidden) aborted = true }
  document.addEventListener('visibilitychange', onHide)
  const onAbort = () => { aborted = true }
  signal?.addEventListener('abort', onAbort)

  try {
    await new Promise((resolve) => {
      const tick = () => {
        const t = clock() - t0
        if (aborted || t >= scene.total) { resolve(); return }
        scene.draw(ctx, t)
        onProgress?.(t, scene.total)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    scene.draw(ctx, scene.total) // son kadr
  } finally {
    document.removeEventListener('visibilitychange', onHide)
    signal?.removeEventListener('abort', onAbort)
    try { src?.stop() } catch { /* artıq dayanıb */ }
    if (rec.state !== 'inactive') rec.stop()
    tracks.forEach(tr => tr.stop())
  }
  await stopped
  if (aborted) throw new DOMException(document.hidden ? 'hidden' : 'aborted', 'AbortError')

  const type = mime.split(';')[0]
  return { blob: new Blob(chunks, { type }), ext: type === 'video/mp4' ? 'mp4' : 'webm', mime: type, audio: Boolean(audioBuf) }
}
