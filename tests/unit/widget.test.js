// public/widget.js (başqa saytlara yerləşdirilən vidcet) Azərbaycan şəhərlərini
// src/utils/prayCalc.js ilə EYNİ hesablamalıdır — burada qurulmuş fayl icra
// olunur və bütün AZ şəhərləri üçün il boyu dəqiqəsinədək tutuşdurulur.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { computeTimes, CALC_METHODS } from '../../src/utils/prayCalc.js'

const ROOT = path.resolve(__dirname, '../..')
const code = fs.readFileSync(path.join(ROOT, 'public/widget.js'), 'utf8')

function loadWidget() {
  const window = {}
  const ctx = { window, document: { currentScript: null }, Math, Date, Intl, parseInt, isFinite, encodeURIComponent }
  vm.createContext(ctx)
  vm.runInContext(code, ctx)
  return window.MuslimsWidget
}

// AZ şəhərləri prayerLocation.js-dən (mətn kimi — modul brauzer API-lərinə bağlıdır)
const locSrc = fs.readFileSync(path.join(ROOT, 'src/utils/prayerLocation.js'), 'utf8')
const AZ = [...locSrc.matchAll(/\{ id:'([^']+)', country:'AZ', lat:(-?[\d.]+), lng:(-?[\d.]+)/g)]
  .map(m => ({ id: m[1], lat: Number(m[2]), lng: Number(m[3]) }))

const hm = (n) => `${String(Math.floor(n / 60) % 24).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
const KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

describe('public/widget.js', () => {
  it('is smaller than 6 KB', () => {
    expect(Buffer.byteLength(code)).toBeLessThan(6 * 1024)
  })

  it('exposes mount and calc', () => {
    const w = loadWidget()
    expect(typeof w.mount).toBe('function')
    expect(typeof w.calc).toBe('function')
  })

  it('contains every AZ city id', () => {
    expect(AZ.length).toBeGreaterThan(50)
    for (const c of AZ) expect(code).toContain(c.id)
  })

  it('matches prayCalc for all AZ cities on every day of 2026', () => {
    const { calc } = loadWidget()
    let checked = 0
    for (const c of AZ) {
      for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += 86400000) {
        const d = new Date(t)
        const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate()
        const ref = computeTimes({ year: y, month: m, day }, c.lat, c.lng, 4, CALC_METHODS.abubakr)
        const got = calc(y, m, day, c.lat, c.lng, 4).map(hm)
        for (let i = 0; i < 6; i++) {
          if (got[i] !== ref[KEYS[i]]) throw new Error(`${c.id} ${y}-${m}-${day} ${KEYS[i]}: ${got[i]} ≠ ${ref[KEYS[i]]}`)
        }
        checked++
      }
    }
    expect(checked).toBe(AZ.length * 365)
  })
})
