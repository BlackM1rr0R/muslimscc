import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { narratorIds, narratorName, narratorKey } from '../../src/data/hadithNarrators.js'
import { HADITH_FULL } from '../../src/data/hadithFull.js'
import { narratorLine, hasFull } from '../../src/utils/hadithFull.js'
import { HADITHS as HADITHS_DATA } from '../../src/data/hadiths.js'

describe('hədisin tam mətni və ravi', () => {
  it('ləqəblər normallaşır, qeyri-müəyyən ad tanınmır', () => {
    expect(narratorKey("Ibn `Umar")).toBe('bin umar')
    expect(narratorIds('Abu Huraira')).toEqual(['abuhurayra'])
    expect(narratorIds("Abu Sa`id Al-Khudri and Abu Huraira")).toEqual(['khudri', 'abuhurayra'])
    expect(narratorIds('`Abdullah')).toEqual([])
    expect(narratorIds('Mujahid')).toEqual([])
    expect(narratorName('abuhurayra', 'az')).toBe('Əbu Hureyrə')
    expect(narratorName('abuhurayra', 'fr')).toBe('Abu Hurayrah')
  })
  it('hər indeks yazısının faylı var, ərəb mətni boş deyil, ravi açarları tanınır', () => {
    const ids = Object.keys(HADITH_FULL)
    expect(ids.length).toBeGreaterThan(1000)
    for (const id of ids) {
      const d = JSON.parse(fs.readFileSync(`public/data/hadith-full/${id}.json`, 'utf8'))
      expect(d.ar.length).toBeGreaterThan(10)
      expect(d.en || d.tr).toBeTruthy()
      for (const k of (HADITH_FULL[id] ? HADITH_FULL[id].split(',') : [])) expect(narratorName(k, 'az')).toBeTruthy()
    }
  })
  it('kart sətri: Buxari 8 — İbn Ömər', () => {
    expect(hasFull(1)).toBe(true)
    expect(narratorLine(1, 'az')).toBe('Abdullah ibn Ömər')
    expect(narratorLine(999999, 'az')).toBe(null)
  })
  it('yalnız saytdakı hədislər (silinmiş id yoxdur)', () => {
    const all = new Set((HADITHS_DATA?.az || []).map(h => String(h.id)))
    if (all.size) for (const id of Object.keys(HADITH_FULL)) expect(all.has(id)).toBe(true)
  })
})
