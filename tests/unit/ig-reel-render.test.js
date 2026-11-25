// scripts/ig-reel/render.mjs — reel renderinin tüstü testi (şəbəkə yoxdur): kart düzülüşü (sharp/pango), kadrlar
// (mürəkkəb animasiyası: əvvəl boş, sonda tam mətn), sığmayan mətn → null; ffmpeg varsa (PATH və ya FFMPEG_PATH)
// qısa MP4 kodlaşdırılır və Reels tələbləri yoxlanır (ftyp, faststart moov, müddət). ffmpeg yoxdursa MP4 hissəsi atlanır.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { buildScene, renderFrame, encode, W, H } from '../../scripts/ig-reel/render.mjs'

const require = createRequire(import.meta.url)
const R = require('../../server/instagramReel.js')
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'
const hasFfmpeg = (() => { try { return spawnSync(FFMPEG, ['-hide_banner', '-version'], { windowsHide: true }).status === 0 } catch { return false } })()

const CONTENT = {
  kind: 'ayah', title: 'Günün ayəsi', ar: 'وَتَوَكَّلْ عَلَى ٱللَّهِ ۚ وَكَفَىٰ بِٱللَّهِ وَكِيلًا',
  text: 'Allaha təvəkkül et. Allahın (bütün işlərdə sənə) vəkil olması kifayət edər!', ref: 'Əhzab 33:3',
}

describe('ig-reel render', () => {
  it('səhnə: kart düzülüşü, ərəbcə sətirlər və tərcümə sözləri ayrıca qatlardır; kadr 1080×1920 rgb', async () => {
    const scene = await buildScene(CONTENT, { reciter: 'Tilavət: Mişari Raşid əl-Əfasi' })
    expect(scene).toBeTruthy()
    expect(scene.lines).toBeGreaterThanOrEqual(1)
    expect(scene.words).toBe(CONTENT.text.split(' ').length)
    const tl = R.reelTimeline({ audioSec: 3, lines: scene.lines, words: scene.words, minSec: 1 })
    const first = renderFrame(scene, tl, 0)
    const mid = renderFrame(scene, tl, (tl.inkStart + tl.inkEnd) / 2)
    const last = renderFrame(scene, tl, tl.duration - 0.1)
    expect(first.length).toBe(W * H * 3)
    // ərəb mətni sahəsi: əvvəl fon, ortada qismən, sonda tam (piksel fərqi artır)
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) > 24) n++; return n }
    const dMid = diff(first, mid), dLast = diff(first, last)
    expect(dMid).toBeGreaterThan(500)
    expect(dLast).toBeGreaterThan(dMid)
    // İlk kadr (hook): başlıq, istinad və muslims.cc t=0-dan görünür — kadr yalnız fon deyil
    expect(diff(scene.bg.data, first)).toBeGreaterThan(3000)
    const refBox = (b) => { let n = 0; for (let y = scene.ref.y; y < scene.ref.y + scene.ref.l.h; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; if (Math.abs(b[i] - scene.bg.data[i]) > 24) n++ } return n }
    expect(refBox(first)).toBeGreaterThan(200)
    expect(refBox(first)).toBe(refBox(last))
    // mətn verbatim gəlir (yalnız dayanma işarəsi sözə bitişik) — uzun mətn sığmırsa null (qısaltma yoxdur)
    expect(await buildScene({ ...CONTENT, text: 'söz '.repeat(400) })).toBeNull()
    expect(await buildScene({ ...CONTENT, ar: '' })).toBeNull()
  }, 60000)

  it.skipIf(!hasFfmpeg)('ffmpeg: qısa MP4 (H.264 + AAC, faststart, müddət mvhd-də)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-reel-test-'))
    try {
      const scene = await buildScene(CONTENT, { reciter: null })
      const tl = R.reelTimeline({ audioSec: 0, lines: scene.lines, words: scene.words, minSec: 1 })
      const out = path.join(dir, 'r.mp4')
      const r = await encode({ scene, tl, pcm: null, out, ffmpeg: FFMPEG, fps: 10, frames: [{ t: tl.duration - 0.2, file: path.join(dir, 'last.png') }] })
      const buf = fs.readFileSync(out)
      expect(buf.toString('latin1', 4, 8)).toBe('ftyp')
      expect(buf.indexOf('moov', 0, 'latin1')).toBeLessThan(buf.indexOf('mdat', 0, 'latin1'))
      expect(r.size).toBeLessThan(R.REEL_MAX_BYTES)
      expect(Math.abs(R.mp4DurationMs(buf) - r.seconds * 1000)).toBeLessThan(250)
      expect(fs.statSync(path.join(dir, 'last.png')).size).toBeGreaterThan(10000)
    } finally { fs.rmSync(dir, { recursive: true, force: true }) }
  }, 120000)
})
