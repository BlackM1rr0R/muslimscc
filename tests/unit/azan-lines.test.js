import { describe, it, expect } from 'vitest'
import { LINES, lineAt } from '../../src/utils/azanLines.js'

describe('azan sətirləri', () => {
  it('12 sətir, vaxtlar artan', () => {
    expect(LINES).toHaveLength(12)
    for (let i = 1; i < LINES.length; i++) expect(LINES[i][0]).toBeGreaterThan(LINES[i - 1][0])
  })
  it('lineAt: başlanğıcdan əvvəl -1, sonra uyğun sətir', () => {
    expect(lineAt(0)).toBe(-1)
    expect(lineAt(2)).toBe(0)
    expect(lineAt(31)).toBe(4)
    expect(lineAt(86)).toBe(11)
  })
})
