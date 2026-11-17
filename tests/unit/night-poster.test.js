import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { SKY_AYAHS, allAyahRefs, ayahText, chartXY, cleanLine, fmtCoords, moonPhase, skyScene, tzOffset, zonedDate, zonedToUtc, limbAngle, MAX_LINE } from '../../src/utils/nightPoster.js'

const sky = JSON.parse(fs.readFileSync('public/data/sky/sky.json', 'utf8'))

describe('ulduzlu gecə kartı — hesab', () => {
  it('yerli divar saatı → UTC (saat qurşağı və yay vaxtı ilə)', () => {
    expect(zonedToUtc('2026-11-17', '21:00', 'Asia/Baku')).toBe(Date.UTC(2026, 10, 17, 17, 0))
    expect(zonedToUtc('2026-07-01', '21:00', 'Europe/London')).toBe(Date.UTC(2026, 6, 1, 20, 0))   // BST
    expect(zonedToUtc('2026-01-01', '21:00', 'Europe/London')).toBe(Date.UTC(2026, 0, 1, 21, 0))
    expect(zonedToUtc('2026-11-17', '21:00', 'America/New_York')).toBe(Date.UTC(2026, 10, 18, 2, 0))
    expect(tzOffset(Date.UTC(2026, 0, 1), 'Asia/Kolkata')).toBe(5.5 * 3600000)
    expect(zonedDate(Date.UTC(2026, 10, 17, 22, 30), 'Asia/Baku')).toBe('2026-11-18')
    expect(Number.isNaN(zonedToUtc('', '21:00', 'Asia/Baku'))).toBe(true)
  })

  it('stereoqrafik xəritə: zenit mərkəzdə, üfüq r = 1, Şimal yuxarı, Şərq solda', () => {
    expect(chartXY(90, 0).map(v => Math.abs(v))).toEqual([0, 0])
    const n = chartXY(0, 0), e = chartXY(0, 90)
    expect(n[0]).toBeCloseTo(0); expect(n[1]).toBeCloseTo(-1)
    expect(e[0]).toBeCloseTo(-1); expect(e[1]).toBeCloseTo(0)
    expect(Math.hypot(...chartXY(45, 200))).toBeCloseTo(Math.tan(22.5 * Math.PI / 180))
  })

  it('Ayın fazası: tam ay (2024-04-23 23:49 UT) ~100%, təzə ay (2024-04-08 18:21 UT) ~0%', () => {
    const full = moonPhase(Date.UTC(2024, 3, 23, 23, 49))
    expect(full.frac).toBeGreaterThan(0.99)
    const nw = moonPhase(Date.UTC(2024, 3, 8, 18, 21))
    expect(nw.frac).toBeLessThan(0.01)
    // İlk dördəbir (2024-04-15 19:13 UT) — yarım, böyüyən
    const q1 = moonPhase(Date.UTC(2024, 3, 15, 19, 13))
    expect(q1.frac).toBeGreaterThan(0.45); expect(q1.frac).toBeLessThan(0.55)
    expect(q1.waxing).toBe(true)
  })

  it('parlaq kənar Günəşə tərəf baxır', () => {
    // Ay zenitdə, Günəş Qərbdə üfüqdə → xəritədə Qərb sağdadır (x > 0)
    const a = limbAngle({ alt: 89.9, az: 0 }, { alt: 0, az: 270 })
    expect(Math.cos(a)).toBeGreaterThan(0.99)
  })

  it('səhnə: yalnız üfüqdən yuxarı ulduzlar, hamısı dairənin içində; bürc xətləri var', () => {
    const sc = skyScene(sky, Date.UTC(2026, 10, 17, 17, 0), 40.4, 49.87)
    expect(sc.stars.length).toBeGreaterThan(600)
    expect(sc.stars.length).toBeLessThan(sky.stars.length)
    expect(sc.stars.every(s => Math.hypot(s.x, s.y) <= 1.0001)).toBe(true)
    expect(sc.lines.length).toBeGreaterThan(50)
    expect(sc.sunAlt).toBeLessThan(-18)          // Bakı, 21:00 — gecə
    expect(sc.moon.frac).toBeGreaterThanOrEqual(0)
    expect(sc.planets.every(p => p.alt > 0)).toBe(true)
  })

  it('şəxsi sətir 60 simvola qədər kəsilir, koordinat formatı', () => {
    expect(cleanLine('  Toyumuz   ')).toBe('Toyumuz ')
    expect(Array.from(cleanLine('ə'.repeat(80))).length).toBe(MAX_LINE)
    expect(cleanLine('a\nb')).toBe('a b')
    expect(fmtCoords(40.3953, 49.8822)).toBe('40°24′ N · 49°53′ E')
    expect(fmtCoords(-33.87, -70.65)).toBe('33°52′ S · 70°39′ W')
  })

  it('ayələr saytın məlumatından hərfi-hərfinə (seo-data/quran)', () => {
    const read = (f) => JSON.parse(fs.readFileSync(`seo-data/quran/${f}.json`, 'utf8'))
    const at = (d, r) => { const [s, a] = r.split(':').map(Number); return d.ayahs[s - 1][a - 1] }
    const az = JSON.parse(fs.readFileSync('public/data/sky-ayahs/az.json', 'utf8'))
    const en = JSON.parse(fs.readFileSync('public/data/sky-ayahs/en.json', 'utf8'))
    const azQ = read('az.mammadaliyev'), enQ = read('en.asad'), uth = read('quran-uthmani')
    expect(az.by).toBe('Məmmədəliyev & Bünyadov')
    for (const r of allAyahRefs()) {
      expect(az.tr[r]).toBe(at(azQ, r))
      expect(en.tr[r]).toBe(at(enQ, r))
      expect(uth.ayahs[Number(r.split(':')[0]) - 1][Number(r.split(':')[1]) - 1].endsWith(az.ar[r])).toBe(true)
    }
    // 86:1 — bəsmələsiz
    expect(az.ar['86:1'].startsWith('بِسْمِ')).toBe(false)
    const t = ayahText(SKY_AYAHS.find(x => x.s === 86), az)
    expect(t.ar).toContain('﴿٣﴾')
    expect(t.tr).toBe(['86:1', '86:2', '86:3'].map(r => az.tr[r]).join(' '))
    expect(ayahText(SKY_AYAHS[0], { ar: {} })).toBe(null)
  })
})
