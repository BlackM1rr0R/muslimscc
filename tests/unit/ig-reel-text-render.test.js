// scripts/ig-reel/render.mjs — hədis / dua / Allahın adı videosunun tüstü testi (şəbəkə yoxdur): səhnə (kartın elementi,
// ərəb şrifti növə görə, adın transliterasiyası), mürəkkəb → tərcümə söz-söz → sabit kadr, tema (açıq dawn fonu), neytral fon
// səsinin filtri (tonsuz küy, musiqi / səsləndirmə yox). ffmpeg varsa (PATH və ya FFMPEG_PATH): fon səsli qısa MP4 və günün
// tam hədis videosu (müddət 20–40 s, < 15 MB, element kartla eyni). ffmpeg yoxdursa həmin hissələr atlanır.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { buildTextScene, renderPassageFrame, renderTextDay, ambientGraph, encode, W, H } from '../../scripts/ig-reel/render.mjs'

const require = createRequire(import.meta.url)
const R = require('../../server/instagramReel.js')
const IG = require('../../server/instagram.js')
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'
const hasFfmpeg = (() => { try { return spawnSync(FFMPEG, ['-hide_banner', '-version'], { windowsHide: true }).status === 0 } catch { return false } })()
const DAY = '2026-11-27'
const diff = (a, b, y0 = 0, y1 = H) => {
  let n = 0
  for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; if (Math.abs(a[i] - b[i]) > 24) n++ }
  return n
}

describe('ig-reel render (hədis / dua / ad)', () => {
  it('hədis səhnəsi: bir seqment, mürəkkəb → tərcümə → sabit kadr; başlıq və mənbə ilk kadrdan görünür', async () => {
    const c = IG.staticCandidate('hadith', DAY, 0, 'en')
    const scene = await buildTextScene(c, { theme: 'day', lang: 'en' })
    expect(scene).toBeTruthy()
    expect(scene.ayahs).toHaveLength(1)
    const A = scene.ayahs[0]
    expect(A.words).toBe(c.text.split(' ').filter(Boolean).length)
    expect(A.sub).toBeNull()
    const tl = R.textTimeline({ lines: A.lines, words: A.words })
    const s = tl.segments[0]
    const first = renderPassageFrame(scene, tl, 0)
    const ink = renderPassageFrame(scene, tl, (s.inkStart + s.inkEnd) / 2)
    const done = renderPassageFrame(scene, tl, s.settle + 0.1)
    const last = renderPassageFrame(scene, tl, tl.duration - 0.05)
    expect(first.length).toBe(W * H * 3)
    expect(diff(scene.bg.data, first, scene.title.y, scene.title.y + scene.title.l.h)).toBeGreaterThan(200)
    expect(diff(scene.bg.data, first, scene.ref.y, scene.ref.y + scene.ref.l.h)).toBeGreaterThan(200)
    // ərəbcə yazılır, tərcümə hələ yoxdur
    expect(diff(first, ink, A.arPos.y, A.trPos.y - 60)).toBeGreaterThan(300)
    expect(diff(first, ink, A.trPos.y, A.trPos.y + 200)).toBe(0)
    // sonda tərcümə görünür, kadr sabitdir
    expect(diff(first, done, A.trPos.y, A.trPos.y + 200)).toBeGreaterThan(300)
    expect(diff(done, last)).toBe(0)
  })

  it('Allahın adı: Amiri Quran, transliterasiya sətri; dawn — açıq fon', async () => {
    const c = IG.staticCandidate('name', DAY, 0, 'en')
    expect(c.tl).toBeTruthy()
    const scene = await buildTextScene(c, { theme: 'dawn', lang: 'en' })
    expect(scene.ayahs[0].sub).toBeTruthy()
    const corner = [...scene.bg.data.subarray(0, 3)]
    expect(Math.min(...corner)).toBeGreaterThan(200)
    const tl = R.textTimeline({ lines: scene.ayahs[0].lines, words: scene.ayahs[0].words })
    expect(tl.duration).toBe(R.TEXT_MIN_SEC)
  })

  it('mətn yoxdur / qlif yoxdur → null', async () => {
    expect(await buildTextScene(null)).toBeNull()
    expect(await buildTextScene({ kind: 'dua', title: 'x', ar: 'دعاء', text: '', ref: 'x' })).toBeNull()
    expect(await buildTextScene({ kind: 'dua', title: 'x', ar: 'دعاء', text: 'Arrow → here', ref: 'x' })).toBeNull()
  })

  it('fon səsi: süzülmüş qəhvəyi küy (ton / musiqi / səsləndirmə yoxdur), ~-30 dB, fade in / out, stereo', () => {
    const g = ambientGraph(24)
    expect(g).toMatch(/^anoisesrc=d=24\.000:c=brown/)
    expect(g).toContain('lowpass=f=')
    expect(g).toContain('afade=t=in')
    expect(g).toContain('afade=t=out:st=21.000')
    expect(g).toMatch(/volume=-?\d+dB/)
    expect(g).toContain('pan=stereo')
    expect(g).not.toMatch(/sine|aevalsrc|flite|tts|amovie|\.mp3|\.wav/i)
  })

  it.skipIf(!hasFfmpeg)('ffmpeg: fon səsli qısa MP4 — orta səviyyə -40…-24 dB', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-ttr-'))
    try {
      const c = IG.staticCandidate('dua', DAY, 0, 'en')
      const scene = await buildTextScene(c, { theme: 'night', lang: 'en' })
      const tl = R.textTimeline({ lines: scene.ayahs[0].lines, words: scene.ayahs[0].words })
      const out = path.join(dir, 'a.mp4')
      const r = await encode({ renderAt: (t) => renderPassageFrame(scene, tl, t * 2.5), duration: 8, pcm: null, ambient: true, out, ffmpeg: FFMPEG, fps: 5 })
      expect(r.size).toBeGreaterThan(10000)
      const vd = spawnSync(FFMPEG, ['-hide_banner', '-i', out, '-af', 'atrim=start=2.5:end=5,volumedetect', '-f', 'null', '-'], { encoding: 'utf8', windowsHide: true })
      const mean = Number((/mean_volume: (-?[\d.]+) dB/.exec(vd.stderr) || [])[1])
      expect(mean).toBeGreaterThan(-40)
      expect(mean).toBeLessThan(-24)
    } finally { fs.rmSync(dir, { recursive: true, force: true }) }
  }, 120000)

  it.skipIf(!hasFfmpeg)('ffmpeg: günün hədis videosu — kartın elementi, 20–40 s, < 15 MB', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-ttr-'))
    try {
      const out = path.join(dir, `${DAY}-reel-hadith.mp4`)
      const r = await renderTextDay({ date: DAY, slot: 'hadith', out, lang: 'en', ffmpeg: FFMPEG, log: { warn: () => {}, log: () => {} } })
      expect(r).toMatchObject({ kind: 'hadith', theme: 'day', audio: 'ambient', lang: 'en' })
      expect(r.key).toBe(r.cardKey)
      expect(r.key).toBe(`hadith:${r.item}`)
      expect(r.duration).toBeGreaterThanOrEqual(R.TEXT_MIN_SEC)
      expect(r.duration).toBeLessThanOrEqual(R.TEXT_MAX_SEC)
      expect(r.size).toBeLessThan(R.REEL_MAX_BYTES)
      const head = fs.readFileSync(out).subarray(0, 512 * 1024)
      expect(Math.abs(R.mp4DurationMs(head) - r.duration * 1000)).toBeLessThan(200)
      expect(R.parseTextMeta({ kind: r.kind, item: r.item, audio: r.audio, lang: r.lang }, 'hadith')).toBeTruthy()
    } finally { fs.rmSync(dir, { recursive: true, force: true }) }
  }, 300000)
})
