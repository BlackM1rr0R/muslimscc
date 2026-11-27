// scripts/ig-reel/render.mjs — passaj reel renderinin tüstü testi (şəbəkə yoxdur): kart düzülüşü (sharp/pango), hər ayə
// növbə ilə (mürəkkəb animasiyası, tərcümə, sayğac), güclü ilk kadr, sabit kadr keşi, sığmayan mətn → null; ffmpeg varsa
// (PATH və ya FFMPEG_PATH) qısa MP4 kodlaşdırılır və Reels tələbləri yoxlanır. ffmpeg yoxdursa MP4 hissəsi atlanır.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { buildPassageScene, renderPassageFrame, encode, videoMaxrateKbps, latinIssues, W, H } from '../../scripts/ig-reel/render.mjs'

const require = createRequire(import.meta.url)
const R = require('../../server/instagramReel.js')
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'
const hasFfmpeg = (() => { try { return spawnSync(FFMPEG, ['-hide_banner', '-version'], { windowsHide: true }).status === 0 } catch { return false } })()

// 112:1-2 — alquran.cloud quran-uthmani / en.asad (verbatim)
const PASSAGE = {
  title: 'Verses of the Quran', ref: 'Al-Ikhlas 112:1-2',
  ayahs: [
    { ar: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', text: 'SAY: "He is the One God:', num: '112:1' },
    { ar: 'ٱللَّهُ ٱلصَّمَدُ', text: '"God the Eternal, the Uncaused Cause of All Being.', num: '112:2' },
  ],
}
const diff = (a, b, box = null) => {
  let n = 0
  const y0 = box ? box.y0 : 0, y1 = box ? box.y1 : H
  for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; if (Math.abs(a[i] - b[i]) > 24) n++ }
  return n
}

describe('ig-reel render (passaj)', () => {
  it('səhnə: hər ayə ayrıca düzülür; ilk kadr güclüdür; ayələr növbə ilə yazılır; sabit kadr keşlənir', async () => {
    const scene = await buildPassageScene(PASSAGE, { reciter: 'Recitation: Mishary Rashid Alafasy', lang: 'en' })
    expect(scene).toBeTruthy()
    expect(scene.ayahs).toHaveLength(2)
    expect(scene.counters).toHaveLength(2)
    expect(scene.ayahs[1].words).toBe(PASSAGE.ayahs[1].text.split(' ').length)
    const tl = R.passageTimeline([{ audioSec: 3, words: scene.ayahs[0].words }, { audioSec: 4, words: scene.ayahs[1].words }], { minSec: 1 })
    const s0 = tl.segments[0], s1 = tl.segments[1]
    const first = renderPassageFrame(scene, tl, 0)
    expect(first.length).toBe(W * H * 3)
    // İlk kadr: başlıq, istinad, tilavət sətri, sayğac görünür — fon deyil; istinad son kadrdakı ilə eynidir
    expect(diff(scene.bg.data, first)).toBeGreaterThan(3000)
    const refBox = { y0: scene.ref.y, y1: scene.ref.y + scene.ref.l.h }
    expect(diff(scene.bg.data, first, refBox)).toBeGreaterThan(200)
    const last = renderPassageFrame(scene, tl, tl.duration - 0.05)
    expect(diff(scene.bg.data, first, refBox)).toBe(diff(scene.bg.data, last, refBox))
    // 1-ci ayə: yazılır → tam; sonra sönür, 2-ci ayə yazılır
    const a0 = { y0: scene.ayahs[0].arPos.y, y1: scene.ayahs[0].trPos.y }
    const mid0 = renderPassageFrame(scene, tl, (s0.inkStart + s0.inkEnd) / 2)
    const full0 = renderPassageFrame(scene, tl, s0.settle + 0.01)
    expect(diff(first, mid0, a0)).toBeGreaterThan(300)
    expect(diff(first, full0, a0)).toBeGreaterThan(diff(first, mid0, a0))
    const full1 = renderPassageFrame(scene, tl, s1.settle + 0.01)
    expect(diff(full0, full1)).toBeGreaterThan(3000)
    // keş: sabit hissədə eyni bufer, sönmə başlayanda yeni kadr
    const cache = {}
    const c1 = renderPassageFrame(scene, tl, s0.settle + 0.02, cache)
    expect(renderPassageFrame(scene, tl, s0.settle + 0.05, cache)).toBe(c1)
    expect(renderPassageFrame(scene, tl, s0.fadeOut + 0.1, cache)).not.toBe(c1)
    expect(Buffer.compare(c1, full0)).toBe(0)
    // mətn verbatim gəlir — uzun mətn sığmırsa null (qısaltma yoxdur); boş ərəbcə → null
    expect(await buildPassageScene({ ...PASSAGE, ayahs: [PASSAGE.ayahs[0], { ...PASSAGE.ayahs[1], text: 'word '.repeat(400) }] })).toBeNull()
    expect(await buildPassageScene({ ...PASSAGE, ayahs: [{ ...PASSAGE.ayahs[0], ar: '' }] })).toBeNull()
    expect(await buildPassageScene({ ...PASSAGE, ayahs: [] })).toBeNull()
  }, 60000)

  it('tərcümə qlif yoxlaması: yumşaq defis (en.asad) görünməzdir; şriftdə olmayan simvol → problem', () => {
    expect(latinIssues('shack­les, reaching up')).toEqual([])
    expect(latinIssues('He is the One God')).toEqual([])
    expect(latinIssues('arrow → here')).toEqual(['U+2192'])
  })

  it('bitreyt həddi: 89 s video ≤ 15 MB-a sığır', () => {
    for (const s of [15, 45, 89]) {
      const k = videoMaxrateKbps(s)
      expect(((k + 128 + 16) * 1000 * s) / 8).toBeLessThanOrEqual(R.REEL_MAX_BYTES * 0.9 + 1)
    }
    expect(videoMaxrateKbps(89)).toBeGreaterThan(1000)
  })

  it.skipIf(!hasFfmpeg)('ffmpeg: qısa MP4 (H.264 + AAC, faststart, müddət mvhd-də)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-reel-test-'))
    try {
      const scene = await buildPassageScene(PASSAGE, { reciter: null })
      const tl = R.passageTimeline(scene.ayahs.map((a) => ({ audioSec: 0, words: a.words })), { minSec: 1 })
      const out = path.join(dir, 'r.mp4')
      const cache = {}
      const r = await encode({
        renderAt: (t) => renderPassageFrame(scene, tl, t, cache), duration: Math.min(tl.duration, 3), audioStart: tl.audioStart, pcm: null,
        out, ffmpeg: FFMPEG, fps: 10, frames: [{ t: 2.5, file: path.join(dir, 'last.png') }],
      })
      const buf = fs.readFileSync(out)
      expect(buf.toString('latin1', 4, 8)).toBe('ftyp')
      expect(buf.indexOf('moov', 0, 'latin1')).toBeLessThan(buf.indexOf('mdat', 0, 'latin1'))
      expect(r.size).toBeLessThan(R.REEL_MAX_BYTES)
      expect(Math.abs(R.mp4DurationMs(buf) - r.seconds * 1000)).toBeLessThan(250)
      expect(fs.statSync(path.join(dir, 'last.png')).size).toBeGreaterThan(10000)
    } finally { fs.rmSync(dir, { recursive: true, force: true }) }
  }, 120000)
})
