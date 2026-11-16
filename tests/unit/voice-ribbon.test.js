// "Səs heykəli" — saf səs ölçüləri (src/utils/voiceRibbon.js):
// sintetik sinus kadrlarında ton dəqiqliyi, səssizlikdə sıfır amplituda.
import { describe, it, expect } from 'vitest'
import {
  rms, estimatePitch, loudnessToAmp, pitchToY, nibWidth, nibQuad, createPen, demoSample, smooth,
} from '../../src/utils/voiceRibbon.js'

function sine(hz, sr = 48000, n = 2048, amp = 0.5, harmonics = false) {
  const f = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    f[i] = amp * Math.sin(2 * Math.PI * hz * t)
    if (harmonics) f[i] += amp * 0.6 * Math.sin(4 * Math.PI * hz * t) + amp * 0.3 * Math.sin(6 * Math.PI * hz * t)
  }
  return f
}

describe('Səs heykəli — güc və ton', () => {
  it('sinusun RMS-i amp/√2-dir', () => {
    expect(rms(sine(220, 48000, 4800, 0.5))).toBeCloseTo(0.5 / Math.SQRT2, 2)
  })

  for (const [hz, sr] of [[110, 48000], [220, 44100], [330, 48000], [440, 44100], [660, 48000]]) {
    it(`${hz} Hz sinus (${sr}) — ton ±2%`, () => {
      const p = estimatePitch(sine(hz, sr), sr)
      expect(Math.abs(p - hz) / hz).toBeLessThan(0.02)
    })
  }

  it('harmonikalı səs — oktava xətası yoxdur', () => {
    const p = estimatePitch(sine(196, 48000, 2048, 0.4, true), 48000)
    expect(Math.abs(p - 196) / 196).toBeLessThan(0.02)
  })

  it('səssizlik → ton 0, amplituda 0', () => {
    const z = new Float32Array(2048)
    expect(rms(z)).toBe(0)
    expect(estimatePitch(z, 48000)).toBe(0)
    expect(loudnessToAmp(rms(z))).toBe(0)
    expect(loudnessToAmp(0.003)).toBe(0) // fon küyü
  })

  it('küy (təsadüfi) — aydın ton yoxdur', () => {
    let s = 7
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1
    const f = Float32Array.from({ length: 2048 }, () => rnd() * 0.3)
    expect(estimatePitch(f, 48000)).toBe(0)
  })

  it('güc → amplituda monotondur və 1-də doyur', () => {
    expect(loudnessToAmp(0.05)).toBeGreaterThan(0)
    expect(loudnessToAmp(0.1)).toBeGreaterThan(loudnessToAmp(0.05))
    expect(loudnessToAmp(5)).toBe(1)
  })

  it('yüksək ton yuxarıda (kiçik y), səssizlikdə null', () => {
    expect(pitchToY(400)).toBeLessThan(pitchToY(120))
    expect(pitchToY(0)).toBeNull()
    expect(pitchToY(20)).toBeLessThanOrEqual(1)
  })

  it('enli qələm: uca paralel xətt incə, perpendikulyar xətt qalın', () => {
    const nib = (70 * Math.PI) / 180
    expect(nibWidth(nib, 10)).toBeCloseTo(1.2, 5)
    expect(nibWidth(nib + Math.PI / 2, 10)).toBeCloseTo(10, 5)
    const q = nibQuad({ x: 0, y: 0, w: 2 }, { x: -1, y: 0, w: 0 })
    expect(q).toHaveLength(8)
    expect(Math.hypot(q[0] - q[6], q[1] - q[7])).toBeCloseTo(2, 5)
  })

  it('qələm sağdan sola gedir, səssizlikdə mürəkkəb yoxdur', () => {
    const pen = createPen()
    const a = pen.step({ hz: 0, amp: 0, dt: 0.1 })
    const b = pen.step({ hz: 0, amp: 0, dt: 0.1 })
    expect(b.x).toBeLessThan(a.x)
    expect(b.ink).toBe(false)
    let s
    for (let i = 0; i < 30; i++) s = pen.step({ hz: 300, amp: 0.8, dt: 1 / 60 })
    expect(s.ink).toBe(true)
    expect(s.w).toBeGreaterThan(0)
  })

  it('demo melodiyası: ton və nəfəs fasilələri var', () => {
    const xs = Array.from({ length: 400 }, (_, i) => demoSample(i * 0.05))
    expect(xs.some(x => x.hz > 150 && x.amp > 0)).toBe(true)
    expect(xs.some(x => x.amp === 0)).toBe(true)
  })

  it('smooth: NaN başlanğıcda yeni dəyəri qaytarır', () => {
    expect(smooth(NaN, 3, 0.2)).toBe(3)
    expect(smooth(0, 10, 0.5)).toBe(5)
  })
})
